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
    let current: ChildNode | null = this.start.nextSibling;
    while (current && current !== this.end) {
      const next = current.nextSibling;
      p.removeChild(current);
      current = next;
    }
  }

  reconcile(newElements: Element[]): void {
    if (!this.#alive) return;
    const p = this.parent;
    if (!p) return;
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

const effectRegistry = new FinalizationRegistry<() => void>((cleanup) => {
  cleanup();
});

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
): void {
  const style = getStyle(el);
  if (!style) return;
  if (clear) style.cssText = "";
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
      registerDisposable(el, dispose);
    } else if (val != null) {
      if (prop.startsWith("--")) {
        style.setProperty(prop, String(val));
      } else {
        (style as unknown as Record<string, unknown>)[prop] = val;
      }
    }
  }
}

function assignDomProperty(el: Element, key: string, value: unknown): void {
  (el as unknown as Record<string, unknown>)[key] = value;
}

function readDomProperty<T>(el: Element, key: string): T {
  return (el as unknown as Record<string, T>)[key];
}

function toAttrName(key: string): string {
  return PROPERTY_TO_ATTR[key] ?? key;
}

function setAttr(el: Element, key: string, value: unknown): void {
  if (key.startsWith("on") && key.length > 2) {
    if (typeof value === "function") {
      assignDomProperty(el, key, value);
    }
    return;
  }

  if (isSignal(value)) {
    const signal = value;
    const attrKey = key;
    const weakRef = new WeakRef(el);

    const dispose = effect(() => {
      const target = weakRef.deref();
      if (!target) return;
      if (TWO_WAY_ATTRS.has(attrKey) && isInputElement(target)) {
        assignDomProperty(target, attrKey, signal.get());
      } else {
        setAttr(target, attrKey, signal.get());
      }
    });

    registerDisposable(el, dispose);

    if (
      isWritableSignal(signal) &&
      TWO_WAY_ATTRS.has(attrKey) &&
      isInputElement(el)
    ) {
      const eventType = getTwoWayEventType(attrKey, el);
      const handler = () => {
        const target = weakRef.deref();
        if (!target) return;
        signal.set(readDomProperty<unknown>(target, attrKey));
      };
      el.addEventListener(eventType, handler);
      registerDisposable(el, () => el.removeEventListener(eventType, handler));
    }
    return;
  }

  if (key === "style") {
    const style = getStyle(el);
    if (!style) return;
    if (typeof value === "string") {
      style.cssText = value;
    } else if (
      value != null &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      applyStyle(el, value as Record<string, unknown>, true);
    }
    return;
  }

  if (key === "defaultValue") {
    if ("defaultValue" in el) {
      (el as HTMLTextAreaElement).defaultValue = String(value);
    }
    return;
  }

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

function getTwoWayEventType(attrKey: string, el: Element): string {
  if (attrKey === "checked") return "change";
  if (el instanceof HTMLSelectElement) return "change";
  if (attrKey === "selectedIndex") return "change";
  return "input";
}

function applyAttrs(el: Element, attrs: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(attrs)) {
    setAttr(el, key, value);
  }
}

function insertChildBefore(
  parent: Element,
  child: Child,
  ref: ChildNode | null,
): void {
  if (child == null) return;

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
    child.attach(parent, ref);
    registerDisposable(parent, () => child.detach());
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
          if (value.every((v) => v instanceof Element)) {
            range.reconcile(value as Element[]);
          } else {
            const p = range.parent;
            if (!p) return;
            range.clear();
            for (const item of value) {
              insertChildBefore(p, item, range.end);
            }
          }
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
    applyAttrs(el, attrs);
  }

  for (const child of children) {
    insertChildBefore(el, child, null);
  }

  return el;
}

export function For<T, K = T>(
  source: Signal.State<T[]> | Signal.Computed<T[]>,
  render: (item: T, index: number) => Element,
  keyFn?: (item: T, index: number) => K,
): ReactiveRange {
  const cache = new Map<K, HTMLElement>();

  return new ReactiveRange((range) => {
    return effect(() => {
      if (!range.alive) return;

      const items = source.get();
      const result: HTMLElement[] = [];
      const used = new Set<K>();

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const key = keyFn ? keyFn(item, i) : (item as unknown as K);

        if (cache.has(key)) {
          const cached = cache.get(key);
          if (cached) result.push(cached);
        } else {
          const el = render(item, i);
          cache.set(key, el as HTMLElement);
          result.push(el as HTMLElement);
        }
        used.add(key);
      }

      for (const [key] of cache) {
        if (!used.has(key)) {
          cache.delete(key);
        }
      }

      range.reconcile(result);
    });
  });
}
