import { effect, computed, Signal } from "@takanashi/rikka-signal";
import { isSignal } from "./signal-utils.js";
import { ReactiveRange } from "./h.js";
import { registerDisposable } from "./h.js";
import type { StyleRecord } from "./attributes.js";

type SignalLike = Signal.State<any> | Signal.Computed<any>;

const sheetCleanup = new FinalizationRegistry<() => void>((dispose) =>
  dispose(),
);

export function css(
  strings: TemplateStringsArray,
  ...values: (string | number | CSSStyleSheet | SignalLike)[]
): CSSStyleSheet {
  if (typeof CSSStyleSheet === "undefined") {
    return {
      cssRules: [],
      replaceSync: () => {},
      replace: () => Promise.resolve(undefined),
    } as unknown as CSSStyleSheet;
  }

  const sheet = new CSSStyleSheet();

  const signalEntries: SignalLike[] = [];
  for (let i = 0; i < values.length; i++) {
    if (isSignal(values[i])) {
      signalEntries.push(values[i] as SignalLike);
    }
  }

  function buildCssText(): string {
    let cssText = "";
    for (let i = 0; i < strings.length; i++) {
      cssText += strings[i];
      if (i < values.length) {
        const value = values[i];
        if (value instanceof CSSStyleSheet) {
          cssText += Array.from(value.cssRules)
            .map((r) => r.cssText)
            .join("\n");
        } else if (isSignal(value)) {
          cssText += String(value.get());
        } else {
          cssText += String(value);
        }
      }
    }
    return cssText;
  }

  if (signalEntries.length > 0) {
    const dispose = effect(() => {
      for (const sig of signalEntries) sig.get();
      sheet.replaceSync(buildCssText());
    });
    sheetCleanup.register(sheet, dispose);
  } else {
    sheet.replaceSync(buildCssText());
  }

  return sheet;
}

export function inlineStyle(
  strings: TemplateStringsArray,
  ...values: (string | number | SignalLike)[]
): StyleRecord {
  const SIGNAL_MARKER = "__RIKKA_SIG_";
  const signalMap = new Map<string, SignalLike>();

  let cssText = "";
  for (let i = 0; i < strings.length; i++) {
    cssText += strings[i];
    if (i < values.length) {
      const value = values[i];
      if (isSignal(value)) {
        const marker = `${SIGNAL_MARKER}${i}__`;
        cssText += marker;
        signalMap.set(marker, value as SignalLike);
      } else {
        cssText += String(value);
      }
    }
  }

  const result: StyleRecord = {};
  const declarations = splitDeclarations(cssText);

  for (const decl of declarations) {
    const colonIndex = decl.indexOf(":");
    if (colonIndex === -1) continue;
    const property = decl.slice(0, colonIndex).trim();
    const valueTemplate = decl.slice(colonIndex + 1).trim();
    const camelProp = property.startsWith("--")
      ? property
      : property.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

    const markers = Array.from(signalMap.keys()).filter((m) =>
      valueTemplate.includes(m),
    );

    if (markers.length === 0) {
      result[camelProp] = valueTemplate;
    } else if (markers.length === 1 && valueTemplate === markers[0]) {
      result[camelProp] = signalMap.get(markers[0])!;
    } else {
      const captured = markers.map((m) => ({
        marker: m,
        signal: signalMap.get(m)!,
      }));
      result[camelProp] = computed(() => {
        let val = valueTemplate;
        for (const { marker, signal } of captured) {
          const v = signal.get();
          val = val.replaceAll(marker, v == null ? "" : String(v));
        }
        return val;
      });
    }
  }
  return result;
}

/**
 * Split CSS text into individual declarations, respecting quoted strings
 * so semicolons inside quotes don't break the split.
 */
function splitDeclarations(cssText: string): string[] {
  const declarations: string[] = [];
  let current = "";
  let inString: string | null = null;
  for (let i = 0; i < cssText.length; i++) {
    const ch = cssText[i];
    if (inString) {
      current += ch;
      if (ch === inString && cssText[i - 1] !== "\\") inString = null;
    } else if (ch === '"' || ch === "'") {
      current += ch;
      inString = ch;
    } else if (ch === ";") {
      const trimmed = current.trim();
      if (trimmed) declarations.push(trimmed);
      current = "";
    } else {
      current += ch;
    }
  }
  const trimmed = current.trim();
  if (trimmed) declarations.push(trimmed);
  return declarations;
}

function isInAttributeValue(
  strings: TemplateStringsArray,
  index: number,
): boolean {
  // We must process all strings from 0..index to correctly carry over
  // quote state across template segments. A single segment like
  // '" title="' both closes one attribute and opens another; starting
  // fresh for each segment would lose the opening quote.
  let inSingle = false;
  let inDouble = false;
  for (let s = 0; s <= index; s++) {
    for (let i = 0; i < strings[s].length; i++) {
      const ch = strings[s][i];
      if (ch === '"' && !inSingle) inDouble = !inDouble;
      if (ch === "'" && !inDouble) inSingle = !inSingle;
    }
  }
  return inSingle || inDouble;
}

// Template cache: avoids repeated innerHTML parsing for the same HTML string.
// Keyed by the full HTML string. Cloned on hit so the cached template stays pristine.
const templateCache = new Map<string, HTMLTemplateElement>();
const MAX_CACHE_SIZE = 256;

// Regex for detecting attr signal markers in attribute values.
const ATTR_MARKER_RE = /__rk_attr_\d+__/g;

// Beacon attribute injected on tags that contain attr signal markers,
// so we can find them with querySelector instead of scanning all elements.
const ATTR_BEACON = "data-rk-bind";

export function hTemplate(
  strings: TemplateStringsArray,
  ...values: any[]
): Element[] {
  let html = "";
  const textSignals = new Map<string, any>();
  const attrSignals = new Map<string, any>();
  const elementBindings = new Map<string, Element>();

  for (let i = 0; i < strings.length; i++) {
    html += strings[i];
    if (i < values.length) {
      const value = values[i];
      if (isSignal(value)) {
        if (isInAttributeValue(strings, i)) {
          const marker = `__rk_attr_${i}__`;
          html += marker;
          attrSignals.set(marker, value);
        } else {
          const marker = `rikka-sig-${i}`;
          html += `<!--${marker}-->`;
          textSignals.set(marker, value);
        }
      } else if (value instanceof Element) {
        const marker = `rikka-el-${i}`;
        html += `<!--${marker}-->`;
        elementBindings.set(marker, value);
      } else {
        html += String(value ?? "");
      }
    }
  }

  // Inject beacon attributes on tags that contain signal markers,
  // so we can find them with a precise selector instead of scanning all elements.
  if (attrSignals.size > 0) {
    html = html.replace(
      /(<[a-zA-Z][a-zA-Z0-9-]*[^>]*__rk_attr_[^>]*?)(\s*\/?>)/g,
      `$1 ${ATTR_BEACON}=""$2`,
    );
  }

  // Use <template> for correct parsing of table/SVG/MathML elements.
  // Cache parsed templates to avoid repeated innerHTML parsing.
  // Skip caching for templates containing <template> — cloneNode may not
  // correctly deep-clone nested template.content in all environments.
  const hasNestedTemplate = /<template[\s>]/i.test(html);

  let container: DocumentFragment;
  const cached = !hasNestedTemplate && templateCache.get(html);
  if (cached) {
    container = (cached.cloneNode(true) as HTMLTemplateElement).content;
  } else {
    const tpl = document.createElement("template");
    tpl.innerHTML = html;
    if (!hasNestedTemplate && templateCache.size < MAX_CACHE_SIZE) {
      templateCache.set(html, tpl);
      container = (tpl.cloneNode(true) as HTMLTemplateElement).content;
    } else {
      container = tpl.content;
    }
  }

  // Process comment markers (text signals and element bindings)
  const comments: Comment[] = [];
  const commentWalker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_COMMENT,
  );
  let cNode: Node | null;
  while ((cNode = commentWalker.nextNode())) {
    comments.push(cNode as Comment);
  }

  for (const comment of comments) {
    const text = comment.textContent ?? "";

    if (textSignals.has(text)) {
      const signal = textSignals.get(text);
      if (!signal) continue;
      const parent = comment.parentNode as Element;
      const next = comment.nextSibling;
      parent.removeChild(comment);

      const range = new ReactiveRange((range) => {
        return effect(() => {
          if (!range.alive) return;
          range.clear();
          const val = signal.get();
          if (val != null) {
            const p = range.parent;
            if (p)
              p.insertBefore(document.createTextNode(String(val)), range.end);
          }
        });
      });
      range.attach(parent, next);
      registerDisposable(parent, () => range.detach());
    } else if (elementBindings.has(text)) {
      const value = elementBindings.get(text);
      if (!value) continue;
      if (value instanceof Element && comment.parentNode) {
        comment.parentNode.replaceChild(value, comment);
      } else if (comment.parentNode) {
        comment.parentNode.removeChild(comment);
      }
    }
  }

  // Process attr signals: use beacon attribute to find only relevant elements,
  // then use regex to efficiently locate markers within their attribute values.
  if (attrSignals.size > 0) {
    const bindableElements = container.querySelectorAll(`[${ATTR_BEACON}]`);
    for (const el of bindableElements) {
      el.removeAttribute(ATTR_BEACON);
      for (const attr of Array.from(el.attributes)) {
        const attrBindings: Array<{ marker: string; signal: any }> = [];
        ATTR_MARKER_RE.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = ATTR_MARKER_RE.exec(attr.value)) !== null) {
          const signal = attrSignals.get(match[0]);
          if (signal) {
            attrBindings.push({ marker: match[0], signal });
          }
        }
        if (attrBindings.length === 0) continue;

        const attrName = attr.name;
        const attrTemplate = attr.value;
        const weakEl = new WeakRef(el);

        const dispose = effect(() => {
          const target = weakEl.deref();
          if (!target) return;
          let value = attrTemplate;
          for (const { marker, signal } of attrBindings) {
            value = value.replaceAll(marker, String(signal.get()));
          }
          target.setAttribute(attrName, value);
        });

        registerDisposable(el, dispose);
      }
    }
  }

  // Extract top-level elements
  const elements: Element[] = [];
  while (container.firstChild) {
    const child = container.firstChild;
    container.removeChild(child);
    if (child instanceof Element) {
      elements.push(child);
    }
  }
  return elements;
}
