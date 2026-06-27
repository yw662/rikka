import { effect, computed, Signal } from "@takanashi/rikka-signal";
import {
  HTML_NS,
  SVG_NS,
  MATHML_NS,
  SVG_TAGS,
  MATHML_TAGS,
} from "./constants.js";
import { isSignal, isWritableSignal, isPlainObject } from "./signal-utils.js";
import type { AttrTagNameMap, CommonHTMLAttributes } from "./attributes.js";
import { hTemplate } from "./template.js";

export type ElementTagNameMap = HTMLElementTagNameMap &
  Omit<SVGElementTagNameMap, keyof HTMLElementTagNameMap> &
  Omit<
    MathMLElementTagNameMap,
    keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap
  >;

const TWO_WAY_ATTRS = new Set(["value", "checked", "selectedIndex"]);

/** Maps JS DOM property names to their HTML attribute equivalents. */
const PROPERTY_TO_ATTR: Readonly<Record<string, string>> = {
  className: "class",
  htmlFor: "for",
  readOnly: "readonly",
  tabIndex: "tabindex",
};

function resolveNamespace(tag: string): string {
  if (tag === "svg") return SVG_NS;
  if (tag === "math") return MATHML_NS;
  if (SVG_TAGS.has(tag)) return SVG_NS;
  if (MATHML_TAGS.has(tag)) return MATHML_NS;
  return HTML_NS;
}

function isInputElement(
  el: Element,
): el is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement
  );
}

export class ReactiveRange {
  readonly start = document.createComment("");
  readonly end = document.createComment("");
  #weakParent: WeakRef<Element> | null = null;
  #disposables: (() => void)[] = [];
  #setup: ((range: ReactiveRange) => (() => void) | void) | null;
  #alive = false;

  constructor(setup: (range: ReactiveRange) => (() => void) | void) {
    this.#setup = setup;
  }

  get parent(): Element | null {
    return this.#weakParent?.deref() ?? null;
  }

  get alive(): boolean {
    return this.#alive;
  }

  attach(parent: Element, ref: ChildNode | null): void {
    this.#weakParent = new WeakRef(parent);
    this.#alive = true;
    parent.insertBefore(this.start, ref);
    parent.insertBefore(this.end, ref);
    if (this.#setup) {
      const dispose = this.#setup(this);
      if (dispose) this.#disposables.push(dispose);
      this.#setup = null;
    }
  }

  clear(): void {
    const p = this.parent;
    if (!p) return;
    const range = document.createRange();
    range.setStartAfter(this.start);
    range.setEndBefore(this.end);
    range.deleteContents();
  }

  reconcile(newChildren: Child[]): void {
    if (!this.#alive) return;
    const p = this.parent;
    if (!p) return;

    // Mixed content (text/signal/function/non-Element items) has no stable
    // identity for keyed diffing, so clear and rebuild via insertChildBefore.
    // Only Element children participate in the smart reconcile below.
    if (!newChildren.every((c) => c instanceof Element)) {
      this.clear();
      for (const item of newChildren) {
        insertChildBefore(p, item, this.end);
      }
      return;
    }

    const newElements = newChildren as Element[];

    // Fast path: if there are no existing children, just append all new elements.
    if (this.start.nextSibling === this.end) {
      for (const el of newElements) {
        p.insertBefore(el, this.end);
      }
      return;
    }

    const newSet = new Set(newElements as ChildNode[]);

    let current: ChildNode | null = this.start.nextSibling;
    while (current && current !== this.end) {
      const next = current.nextSibling;
      if (!newSet.has(current)) {
        p.removeChild(current);
      }
      current = next;
    }

    let ref: ChildNode = this.end;
    for (let i = newElements.length - 1; i >= 0; i--) {
      const el = newElements[i];
      if (el.nextSibling !== ref || el.parentNode !== p) {
        p.insertBefore(el, ref);
      }
      ref = el;
    }
  }

  detach(): void {
    this.#alive = false;
    for (const d of this.#disposables) d();
    this.#disposables = [];
    this.clear();
    this.start.remove();
    this.end.remove();
    this.#weakParent = null;
  }
}

export type Child =
  | null
  | string
  | number
  | boolean
  | Element
  | DocumentFragment
  | ReactiveRange
  | Signal.State<Child>
  | Signal.Computed<Child>
  | Child[]
  | Signal.State<Child[]>
  | Signal.Computed<Child[]>
  | (() => Child);

const elementDisposables = new WeakMap<Element, Set<() => void>>();

const keyedDisposables = new WeakMap<Element, Map<string, () => void>>();

const effectRegistry = new FinalizationRegistry<() => void>((cleanup) => {
  cleanup();
});

function once(fn: () => void): () => void {
  let called = false;
  return () => {
    if (called) return;
    called = true;
    fn();
  };
}

export function registerDisposable(el: Element, dispose: () => void): void {
  let set = elementDisposables.get(el);
  if (!set) {
    set = new Set();
    elementDisposables.set(el, set);
    const capturedSet = set;
    effectRegistry.register(el, () => {
      for (const d of capturedSet) d();
      capturedSet.clear();
    });
  }
  set.add(dispose);
}

/**
 * Explicitly run every disposable registered on `el` and tear down the
 * tracking entries. This is the primary cleanup path at known lifecycle
 * points (e.g. a For item being removed); the FinalizationRegistry above
 * remains as a GC safety net for elements that slip through explicit
 * teardown. Disposables are wrapped in `once`, so a later registry callback
 * touching the same (now empty) set is a harmless no-op.
 */
export function disposeElement(el: Element): void {
  const set = elementDisposables.get(el);
  if (set) {
    for (const d of set) d();
    set.clear();
    elementDisposables.delete(el);
  }
  keyedDisposables.delete(el);
  effectRegistry.unregister(el);
}

function getStyle(el: Element): CSSStyleDeclaration | null {
  if (typeof (el as HTMLElement).style?.setProperty === "function") {
    return (el as HTMLElement).style;
  }
  return null;
}

function applyStyle(
  el: Element,
  styleObj: Record<string, unknown>,
  clear = false,
): () => void {
  const style = getStyle(el);
  if (!style) return () => {};
  if (clear) style.cssText = "";
  const disposers: Array<() => void> = [];
  for (const [prop, val] of Object.entries(styleObj)) {
    if (isSignal(val)) {
      const signal = val;
      const weakRef = new WeakRef(el);
      const dispose = effect(() => {
        const target = weakRef.deref();
        if (!target) return;
        const targetStyle = getStyle(target);
        if (!targetStyle) return;
        const value = signal.get();
        if (value == null) {
          if (prop.startsWith("--")) {
            targetStyle.removeProperty(prop);
          } else {
            (targetStyle as unknown as Record<string, unknown>)[prop] = "";
          }
        } else if (prop.startsWith("--")) {
          targetStyle.setProperty(prop, String(value));
        } else {
          (targetStyle as unknown as Record<string, unknown>)[prop] = value;
        }
      });
      disposers.push(dispose);
    } else if (val != null) {
      if (prop.startsWith("--")) {
        style.setProperty(prop, String(val));
      } else {
        (style as unknown as Record<string, unknown>)[prop] = val;
      }
    }
  }
  return () => {
    for (const d of disposers) d();
  };
}

function assignDomProperty(el: Element, key: string, value: unknown): void {
  (el as unknown as Record<string, unknown>)[key] = value;
}

function readDomProperty<T>(el: Element, key: string): T {
  return (el as unknown as Record<string, T>)[key];
}

/**
 * Read the value to write back into a two-way-bound signal. For numeric
 * inputs (`<input type="number">` / `<input type="range">`) we prefer
 * `valueAsNumber` so the signal stays a number when it was initialized as
 * one — `el.value` is always a `DOMString` and would silently coerce the
 * signal to a string. All other cases fall back to the raw property.
 */
function readTwoWayValue(
  el: Element,
  attrKey: string,
  signal: Signal.State<unknown> | Signal.Computed<unknown>,
): unknown {
  if (
    attrKey === "value" &&
    typeof signal.get() === "number" &&
    el instanceof HTMLInputElement &&
    (el.type === "number" || el.type === "range")
  ) {
    return el.valueAsNumber;
  }
  return readDomProperty<unknown>(el, attrKey);
}

function toAttrName(key: string): string {
  return PROPERTY_TO_ATTR[key] ?? key;
}

/**
 * Shared attribute setter used by both the static and reactive binding
 * paths. null/undefined/false remove the attribute, true sets it to "",
 * everything else is stringified. This keeps the two paths consistent.
 */
export function setAttr(el: Element, key: string, value: unknown): void {
  if (value == null || value === false) {
    el.removeAttribute(toAttrName(key));
    return;
  }
  if (value === true) {
    el.setAttribute(toAttrName(key), "");
    return;
  }
  el.setAttribute(toAttrName(key), String(value));
}

function applyAttrStatic(el: Element, key: string, value: unknown): () => void {
  if (key.startsWith("on") && key.length > 2) {
    if (typeof value === "function") {
      assignDomProperty(el, key, value);
    }
    return () => {};
  }

  if (key === "style") {
    const style = getStyle(el);
    if (!style) return () => {};
    if (typeof value === "string") {
      style.cssText = value;
      return () => {};
    }
    if (value != null && typeof value === "object" && !Array.isArray(value)) {
      return applyStyle(el, value as Record<string, unknown>, true);
    }
    return () => {};
  }

  if (key === "defaultValue") {
    if ("defaultValue" in el) {
      (el as HTMLTextAreaElement).defaultValue = String(value);
    }
    return () => {};
  }

  setAttr(el, key, value);
  return () => {};
}

/**
 * Two-way binding for form fields (value/checked/selectedIndex). Writes the
 * signal into the DOM property reactively, and — when the signal is
 * writable — listens for input/change events to write the user's edit back
 * into the signal. This is the only place two-way semantics live; the core
 * applyAttrSignal path is purely one-way.
 */
function bindTwoWay(
  el: Element,
  attrKey: string,
  signal: Signal.State<unknown> | Signal.Computed<unknown>,
): () => void {
  const weakRef = new WeakRef(el);

  const disposeEffect = effect(() => {
    const target = weakRef.deref();
    if (!target) return;
    // Two-way attrs are written as DOM properties, not attributes.
    assignDomProperty(target, attrKey, signal.get());
  });

  let disposeListener: (() => void) | null = null;
  if (isWritableSignal(signal)) {
    const eventType = getTwoWayEventType(attrKey, el);
    const handler = () => {
      const target = weakRef.deref();
      if (!target) return;
      signal.set(readTwoWayValue(target, attrKey, signal));
    };
    el.addEventListener(eventType, handler);
    disposeListener = () => {
      const target = weakRef.deref();
      if (!target) return;
      target.removeEventListener(eventType, handler);
    };
  }

  return () => {
    disposeEffect();
    disposeListener?.();
    disposeListener = null;
  };
}

function applyAttrSignal(
  el: Element,
  key: string,
  signal: Signal.State<unknown> | Signal.Computed<unknown>,
): () => void {
  // Form-field two-way binding is delegated to bindTwoWay so the core path
  // below stays a pure one-way signal→attribute binding.
  if (TWO_WAY_ATTRS.has(key) && isInputElement(el)) {
    return bindTwoWay(el, key, signal);
  }

  const weakRef = new WeakRef(el);
  let innerDispose: (() => void) | null = null;

  const disposeEffect = effect(() => {
    const target = weakRef.deref();
    if (!target) return;
    innerDispose?.();
    innerDispose = applyAttrStatic(target, key, signal.get());
  });

  return () => {
    innerDispose?.();
    innerDispose = null;
    disposeEffect();
  };
}

function getTwoWayEventType(attrKey: string, el: Element): string {
  if (attrKey === "checked") return "change";
  if (el instanceof HTMLSelectElement) return "change";
  if (attrKey === "selectedIndex") return "change";
  return "input";
}

export function unbindAttr(el: Element, key: string): void {
  const keyMap = keyedDisposables.get(el);
  if (!keyMap) return;
  const dispose = keyMap.get(key);
  if (!dispose) return;
  dispose();
  keyMap.delete(key);
  const set = elementDisposables.get(el);
  if (set) set.delete(dispose);
}

export function bindAttr(el: Element, key: string, value: unknown): void {
  unbindAttr(el, key);

  const dispose = isSignal(value)
    ? applyAttrSignal(el, key, value)
    : applyAttrStatic(el, key, value);

  const safeDispose = once(dispose);

  let keyMap = keyedDisposables.get(el);
  if (!keyMap) {
    keyMap = new Map();
    keyedDisposables.set(el, keyMap);
  }
  keyMap.set(key, safeDispose);

  registerDisposable(el, safeDispose);
}

export function bindAttrs(el: Element, attrs: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(attrs)) {
    bindAttr(el, key, value);
  }
}

export function attachRange(
  parent: Element,
  range: ReactiveRange,
  ref: ChildNode | null = null,
): void {
  range.attach(parent, ref);
  registerDisposable(parent, () => range.detach());
}

function insertChildBefore(
  parent: Element,
  child: Child,
  ref: ChildNode | null,
): void {
  if (child == null || typeof child === "boolean") return;

  if (typeof child === "function") {
    return insertChildBefore(parent, computed(child), ref);
  }

  if (typeof child === "string" || typeof child === "number") {
    parent.insertBefore(document.createTextNode(String(child)), ref);
    return;
  }

  if (child instanceof DocumentFragment) {
    while (child.firstChild) {
      parent.insertBefore(child.firstChild, ref);
    }
    return;
  }

  if (child instanceof Element) {
    parent.insertBefore(child, ref);
    return;
  }

  if (child instanceof ReactiveRange) {
    attachRange(parent, child, ref);
    return;
  }

  if (isSignal(child)) {
    const range = new ReactiveRange((range) => {
      return effect(() => {
        if (!range.alive) return;

        const value = child.get();

        if (value == null) {
          range.clear();
          return;
        }

        if (Array.isArray(value)) {
          range.reconcile(value);
          return;
        }

        if (value instanceof Element) {
          range.clear();
          const p = range.parent;
          if (p) p.insertBefore(value, range.end);
          return;
        }

        const p = range.parent;
        if (!p) return;
        range.clear();
        insertChildBefore(p, value as Child, range.end);
      });
    });
    range.attach(parent, ref);
    registerDisposable(parent, () => range.detach());
    return;
  }

  if (Array.isArray(child)) {
    for (const item of child) {
      insertChildBefore(parent, item, ref);
    }
    return;
  }
}

export { insertChildBefore };

export function applyChild(el: Element, child: Child): void {
  insertChildBefore(el, child, null);
}

type EventMapOf<T extends Element> = T extends HTMLVideoElement
  ? HTMLVideoElementEventMap
  : T extends HTMLAudioElement
    ? HTMLMediaElementEventMap
    : T extends HTMLMediaElement
      ? HTMLMediaElementEventMap
      : T extends HTMLBodyElement
        ? HTMLBodyElementEventMap
        : T extends HTMLFrameSetElement
          ? HTMLFrameSetElementEventMap
          : T extends SVGSVGElement
            ? SVGSVGElementEventMap
            : T extends SVGElement
              ? SVGElementEventMap
              : T extends MathMLElement
                ? MathMLElementEventMap
                : T extends HTMLElement
                  ? HTMLElementEventMap
                  : ElementEventMap;

export type Attributes<K extends keyof ElementTagNameMap> =
  (K extends keyof AttrTagNameMap
    ? AttrTagNameMap[K]
    : CommonHTMLAttributes) & {
    [E in keyof EventMapOf<ElementTagNameMap[K]> as E extends string
      ? `on${E}` | `on${Capitalize<E>}`
      : never]?: (
      this: ElementTagNameMap[K],
      ev: EventMapOf<ElementTagNameMap[K]>[E],
    ) => void;
  };

function isTemplateStringsArray(arg: unknown): arg is TemplateStringsArray {
  if (!Array.isArray(arg) || !("raw" in arg)) return false;
  const raw = (arg as { raw: unknown }).raw;
  return Array.isArray(raw);
}

export interface TagFunction<
  T extends Element = Element,
  A extends Record<string, unknown> = Record<string, unknown>,
> {
  new (...args: any[]): T;
  readonly h: (this: unknown, ...args: any[]) => T;
}

function isTagFunction(arg: unknown): arg is TagFunction {
  if (typeof arg !== "function" || !("h" in arg)) return false;
  const h = (arg as { h: unknown }).h;
  return typeof h === "function";
}

export function h<K extends keyof ElementTagNameMap>(
  tag: K,
  ...children: Child[]
): ElementTagNameMap[K];

export function h<K extends keyof ElementTagNameMap>(
  tag: K,
  attrs: Attributes<K>,
  ...children: Child[]
): ElementTagNameMap[K];

export function h<T extends { new (): HTMLElement; tagName: string }>(
  tag: T,
  ...children: Child[]
): InstanceType<T>;

export function h<T extends { new (): HTMLElement; tagName: string }>(
  tag: T,
  attrs: CommonHTMLAttributes,
  ...children: Child[]
): InstanceType<T>;

export function h<T extends Element, A extends Record<string, unknown>>(
  tag: TagFunction<T, A>,
  ...children: Child[]
): T;

export function h<T extends Element, A extends Record<string, unknown>>(
  tag: TagFunction<T, A>,
  attrs: A & CommonHTMLAttributes,
  ...children: Child[]
): T;

export function h(strings: TemplateStringsArray, ...values: any[]): Element[];

export function h(
  tagOrStrings:
    | string
    | { tagName: string }
    | TagFunction
    | TemplateStringsArray,
  ...args: any[]
): Element | Element[] {
  if (isTemplateStringsArray(tagOrStrings)) {
    return hTemplate(tagOrStrings as TemplateStringsArray, ...args);
  }
  if (isTagFunction(tagOrStrings)) {
    return tagOrStrings.h(...args);
  }
  return createElement(tagOrStrings as string | { tagName: string }, args);
}

export function createElement(
  tag: string | { tagName: string },
  args: any[],
  forcedNS?: string,
): Element {
  let el: Element;

  if (typeof tag !== "string") {
    tag = tag.tagName;
  }
  const ns = forcedNS ?? resolveNamespace(tag);
  el = document.createElementNS(ns, tag);

  let attrs: Record<string, unknown> | undefined;
  let children: any[];

  const first = args[0];
  if (isPlainObject(first)) {
    attrs = first as Record<string, unknown>;
    children = args.slice(1);
  } else {
    attrs = undefined;
    children = args;
  }

  if (attrs) {
    bindAttrs(el, attrs);
  }

  for (const child of children) {
    insertChildBefore(el, child, null);
  }

  return el;
}

/**
 * Internal helper: keyed memoization + DOM reconciliation over a source
 * array. The key type K is pinned at the call site — `K = T` when no
 * `keyFn` is given (the item is its own key, compared by `===`) and
 * `K = ReturnType<keyFn>` otherwise. This is what lets the public
 * signatures stay free of `as unknown as K` escapes: the key type is
 * always concrete before we reach the cache.
 *
 * Unkeyed semantics: using the item itself as the key means identity
 * (`===`) decides reuse. For primitives this is value equality; for
 * objects it is reference equality. Two array slots holding the same
 * reference will share a DOM node — this is correct, since they are
 * literally the same object and must render identically. When a slot's
 * reference changes (e.g. a fresh object from a fetch), the old node is
 * disposed and a new one is built. Callers who want value-based reuse
 * across reference changes supply a `keyFn`.
 */
function makeFor<T, K>(
  source: Signal.State<T[]> | Signal.Computed<T[]>,
  render: (item: T, index: number) => Element,
  getKey: (item: T, index: number) => K,
): ReactiveRange {
  const cache = new Map<K, { element: HTMLElement; dispose: () => void }>();

  return new ReactiveRange((range) => {
    const stop = effect(() => {
      if (!range.alive) return;

      const items = source.get();
      const result: HTMLElement[] = [];
      const used = new Set<K>();

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const key = getKey(item, i);

        if (cache.has(key)) {
          const cached = cache.get(key);
          if (cached) result.push(cached.element);
        } else {
          const el = render(item, i) as HTMLElement;
          cache.set(key, { element: el, dispose: () => disposeElement(el) });
          result.push(el);
        }
        used.add(key);
      }

      for (const [key, entry] of cache) {
        if (!used.has(key)) {
          entry.dispose();
          cache.delete(key);
        }
      }

      range.reconcile(result);
    });
    // When the range is detached (parent removed, Show toggled off, etc.),
    // dispose every cached element so their signal bindings and child
    // ranges are torn down immediately rather than waiting for GC.
    return () => {
      stop();
      for (const [, entry] of cache) entry.dispose();
      cache.clear();
    };
  });
}

/**
 * Iterate a reactive array, keyed by item identity (`===` on the item
 * itself). For primitives this is value equality; for objects it is
 * reference equality — two slots holding the same reference share a
 * DOM node (correct, since they are the same object), and a slot whose
 * reference changes gets a fresh node. Use the keyed overload below
 * when you need value-based reuse across reference changes.
 */
export function For<T>(
  source: Signal.State<T[]> | Signal.Computed<T[]>,
  render: (item: T, index: number) => Element,
): ReactiveRange;
/**
 * Iterate a reactive array keyed by `keyFn`. Items with the same key
 * preserve their DOM node across renders (only moved, not rebuilt).
 * Use this when items have a stable identity (e.g. `item.id`) — it
 * avoids re-rendering unchanged items and keeps stateful child nodes
 * (form focus, scroll position) stable across reorders.
 */
export function For<T, K>(
  source: Signal.State<T[]> | Signal.Computed<T[]>,
  render: (item: T, index: number) => Element,
  keyFn: (item: T, index: number) => K,
): ReactiveRange;
export function For<T, K>(
  source: Signal.State<T[]> | Signal.Computed<T[]>,
  render: (item: T, index: number) => Element,
  keyFn?: (item: T, index: number) => K,
): ReactiveRange {
  // When keyFn is absent, K = T and the item is its own key. We pin K = T
  // explicitly at the call site so the type system sees a concrete key
  // type all the way down to the cache — no `as unknown as K` escape.
  // When keyFn is present, K is its return type and we pass it through.
  return keyFn
    ? makeFor(source, render, keyFn)
    : makeFor<T, T>(source, render, (item) => item);
}
