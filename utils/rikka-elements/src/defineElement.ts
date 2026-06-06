import { Signal, effect } from "@takanashi/rikka-signal";
import { h } from "@takanashi/rikka-dom";
import type { Child, CommonHTMLAttributes } from "@takanashi/rikka-dom";
import type { CamelCase, PascalCase } from "./utils.js";
import { toCamelCase, toKebabCase, toPascalCase } from "./utils.js";

// Extended isPlainObject that also excludes Element and DocumentFragment,
// since defineElement deals with DOM APIs where these are common.
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Element) &&
    !(value instanceof DocumentFragment)
  );
}

const signalKey = Symbol.for("rikka.signals");
const eventTransformsKey = Symbol.for("rikka.eventTransforms");

// ---------------------------------------------------------------------------
// Attribute Types
// ---------------------------------------------------------------------------

/**
 * Declarative attribute binding.
 *
 * - `toProp`: parses the HTML attribute string (or `undefined` when absent) into the prop value.
 * - `toAttribute`: serializes the prop back to an attribute string. Return `undefined`/`null` to
 *   remove the attribute. If omitted, the default is `v == null ? undefined : String(v)`.
 * - `default`: value used when the attribute is missing and no DOM source exists.
 */
export type AttributeSpec<T> = {
  toProp: (attr: string | undefined) => T;
  toAttribute?: (prop: T) => string | undefined;
  default?: T;
};

type AttrValueType<S> = S extends AttributeSpec<infer T> ? T : unknown;

// ---------------------------------------------------------------------------
// Built-in Attribute Specs
// ---------------------------------------------------------------------------

/** Identity: `undefined` → `""`, otherwise the raw string. */
export const StringAttr: AttributeSpec<string> = {
  toProp: (attr) => attr ?? "",
  toAttribute: (prop) => prop,
};

/** `Number`: `"42"` → `42`, `undefined` → `NaN`. `toAttribute` returns `undefined` for `null`/`undefined`, otherwise `String(v)` (so `NaN` round-trips as `"NaN"`). */
export const NumberAttr: AttributeSpec<number> = {
  toProp: Number,
  toAttribute: (prop) => (prop == null ? undefined : String(prop)),
};

/** HTML boolean attribute: any value other than `undefined`/`null`/`"false"` is `true`; serializes `true` as `""` (attribute present) and `false` as `undefined` (attribute removed). */
export const BooleanAttr: AttributeSpec<boolean> = {
  toProp: (attr) => attr !== undefined && attr !== null && attr !== "false",
  toAttribute: (prop) => (prop ? "" : undefined),
};

/**
 * Declarative `data-*` attribute binding. Always string — the DOM does not
 * coerce `data-*` values, and `el.dataset[key]` returns a string per spec.
 * `default` is the value used when the attribute is absent.
 *
 * ```ts
 * defineElement("user-card", {
 *   dataset: {
 *     role: { default: "guest" },
 *     userId: { default: "" },
 *   },
 * });
 * // → el.role, el.userId (read as string)
 * // → el.$role, el.$userId (Signal.State<string>)
 * // → HTML: <user-card data-role="guest" data-user-id="">
 * ```
 */
export type DatasetSpec = {
  default?: string;
};

// ---------------------------------------------------------------------------
// Event Types
// ---------------------------------------------------------------------------

export function event<T = void>(): ((domEvent: Event) => T) | undefined {
  return undefined;
}

export type EventSpec = ((domEvent: Event) => any) | undefined;

type EventDetailOf<S> = S extends undefined
  ? void
  : S extends (domEvent: Event) => infer T
    ? T
    : void;

// ---------------------------------------------------------------------------
// Element Config
// ---------------------------------------------------------------------------

type BaseConfig = {
  shadow?: ShadowRootInit | false;
  styles?: CSSStyleSheet | CSSStyleSheet[];
  attributes?: Record<string, AttributeSpec<any>>;
  dataset?: Record<string, DatasetSpec>;
  events?: Record<string, EventSpec>;
  methods?: Record<string, (...args: any[]) => any>;
};

export type ElementConfig<C extends BaseConfig = BaseConfig> =
  | (BaseConfig & { template: HTMLTemplateElement; render?: never })
  | (BaseConfig & {
      template?: never;
      render?: (this: RikkaElement<C>) => Element;
    })
  | BaseConfig;

export type RikkaElement<C extends BaseConfig> = HTMLElement &
  AttributeProps<C> &
  DatasetProps<C> &
  SignalProps<C> &
  DatasetSignalProps<C> &
  EventProps<C> &
  ShadowProp<C> &
  MethodProps<C>;

export type TagFunctionProps<C extends BaseConfig> = PartialAttributeProps<C> &
  EventListenerProps<C>;

type EventListenerProps<C extends BaseConfig> =
  C["events"] extends Record<string, EventSpec>
    ? {
        -readonly [K in keyof C["events"] as `on${CamelCase<K & string>}`]?:
          | ((ev: CustomEvent<EventDetailOf<C["events"][K]>>) => void)
          | null;
      }
    : {};

export interface TagFunctionH<C extends BaseConfig = BaseConfig> {
  (...children: Child[]): RikkaElement<C>;
  (
    attrs: TagFunctionProps<C> & CommonHTMLAttributes,
    ...children: Child[]
  ): RikkaElement<C>;
}

// ---------------------------------------------------------------------------
// Type Mappings
// ---------------------------------------------------------------------------

type AttributeProps<C extends BaseConfig> =
  C["attributes"] extends Record<string, AttributeSpec<any>>
    ? {
        -readonly [K in keyof C["attributes"]]: AttrValueType<
          C["attributes"][K]
        >;
      }
    : {};

/**
 * Same shape as {@link AttributeProps} but with every key optional. Used for
 * the `.h()` call site so callers can omit any attribute and fall back to the
 * element's own defaults. Instance reads (`this.xxx`) still use the required
 * {@link AttributeProps} because the live element always has a value.
 */
type PartialAttributeProps<C extends BaseConfig> =
  C["attributes"] extends Record<string, AttributeSpec<any>>
    ? {
        -readonly [K in keyof C["attributes"]]?: AttrValueType<
          C["attributes"][K]
        >;
      }
    : {};

type SignalProps<C extends BaseConfig> =
  C["attributes"] extends Record<string, AttributeSpec<any>>
    ? {
        -readonly [K in keyof C["attributes"] as `$${K & string}`]: Signal.State<
          AttrValueType<C["attributes"][K]>
        >;
      }
    : {};

type DatasetProps<C extends BaseConfig> =
  C["dataset"] extends Record<string, DatasetSpec>
    ? {
        -readonly [K in keyof C["dataset"]]: string;
      }
    : {};

type DatasetSignalProps<C extends BaseConfig> =
  C["dataset"] extends Record<string, DatasetSpec>
    ? {
        -readonly [K in keyof C["dataset"] as `$${K & string}`]: Signal.State<string>;
      }
    : {};

type EventProps<C extends BaseConfig> =
  C["events"] extends Record<string, EventSpec>
    ? {
        -readonly [K in keyof C["events"] as `dispatch${PascalCase<K & string>}`]: EventDetailOf<
          C["events"][K]
        > extends void
          ? (options?: Omit<CustomEventInit<void>, "detail">) => boolean
          : (
              detail: NonNullable<EventDetailOf<C["events"][K]>>,
              options?: Omit<
                CustomEventInit<NonNullable<EventDetailOf<C["events"][K]>>>,
                "detail"
              >,
            ) => boolean;
      } & {
        -readonly [K in keyof C["events"] as `on${CamelCase<K & string>}`]:
          | ((ev: CustomEvent<EventDetailOf<C["events"][K]>>) => void)
          | null;
      }
    : {};

type ShadowProp<C extends BaseConfig> = C["shadow"] extends false
  ? {}
  : { shadowRoot: ShadowRoot };

type MethodProps<C extends BaseConfig> =
  C["methods"] extends Record<string, (...args: any[]) => any>
    ? { -readonly [K in keyof C["methods"]]: C["methods"][K] }
    : {};

export type ElementConstructor<C extends BaseConfig> =
  C["attributes"] extends Record<string, AttributeSpec<any>>
    ? (new (...args: any[]) => RikkaElement<C>) & {
        observedAttributes: (keyof C["attributes"] & string)[];
        readonly h: TagFunctionH<C>;
      }
    : (new (...args: any[]) => RikkaElement<C>) & {
        readonly h: TagFunctionH<C>;
      };

// ---------------------------------------------------------------------------
// Runtime: Signal helpers
// ---------------------------------------------------------------------------

type SignalMap = Map<string, Signal.State<unknown>>;

function getOrCreateSignal<T>(
  el: HTMLElement,
  name: string,
  parse: (v: string | undefined) => T,
  defaultValue?: T,
): Signal.State<T> {
  const internal = el as unknown as Record<symbol, SignalMap | undefined>;
  let signals = internal[signalKey];
  if (!signals) {
    signals = new Map<string, Signal.State<unknown>>();
    Object.defineProperty(el, signalKey, {
      value: signals,
      writable: false,
      enumerable: false,
      configurable: true,
    });
  }

  let sig = signals.get(name) as Signal.State<T> | undefined;
  if (!sig) {
    const attrValue = el.getAttribute(name);
    let initialValue: T;
    if (attrValue !== null) {
      initialValue = parse(attrValue ?? undefined);
    } else if (defaultValue !== undefined) {
      initialValue = defaultValue;
    } else {
      initialValue = parse(undefined);
    }
    sig = new Signal.State(initialValue);
    signals.set(name, sig);
  }

  return sig;
}

// ---------------------------------------------------------------------------
// Runtime: Attribute normalization
// ---------------------------------------------------------------------------

interface NormalizedAttribute {
  parse: (v: string | undefined) => unknown;
  serialize: (v: unknown) => string | undefined;
}

const defaultSerialize = (v: unknown): string | undefined =>
  v == null ? undefined : String(v);

function normalizeAttribute<T>(
  spec: AttributeSpec<T>,
): NormalizedAttribute & { defaultValue?: T } {
  return {
    parse: spec.toProp,
    serialize: spec.toAttribute
      ? (spec.toAttribute as (v: unknown) => string | undefined)
      : defaultSerialize,
    defaultValue: spec.default,
  };
}

// ---------------------------------------------------------------------------
// Runtime: Apply attributes / dataset to prototype
// ---------------------------------------------------------------------------

/**
 * Installs a single attribute-backed binding: a typed property, a `$`-prefixed
 * signal accessor, and an `attributeChangedCallback` chain entry. Used by both
 * `applyAttributes` and `applyDataset`.
 */
function applyBinding(
  proto: Record<string, unknown>,
  attrName: string,
  propName: string,
  parse: (v: string | undefined) => unknown,
  serialize: (v: unknown) => string | undefined,
  defaultValue: unknown,
): void {
  Object.defineProperty(proto, propName, {
    get(this: HTMLElement) {
      const sig = getOrCreateSignal(this, attrName, parse, defaultValue);
      return sig.get();
    },
    set(this: HTMLElement, value: unknown) {
      const sig = getOrCreateSignal(this, attrName, parse, defaultValue);
      sig.set(value);
      const strValue = serialize(value);
      if (strValue == null) {
        this.removeAttribute(attrName);
      } else if (this.getAttribute(attrName) !== strValue) {
        this.setAttribute(attrName, strValue);
      }
    },
    enumerable: true,
    configurable: true,
  });

  Object.defineProperty(proto, `$${propName}`, {
    get(this: HTMLElement) {
      return getOrCreateSignal(this, attrName, parse, defaultValue);
    },
    enumerable: true,
    configurable: true,
  });

  const originalCallback = proto.attributeChangedCallback as
    | ((this: HTMLElement, attrName: string, oldValue: string | null, newValue: string | null) => void)
    | undefined;
  proto.attributeChangedCallback = function (
    this: HTMLElement,
    changedName: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    if (changedName === attrName) {
      const sig = getOrCreateSignal(this, attrName, parse, defaultValue);
      const next = newValue === null
        ? (defaultValue !== undefined ? defaultValue : parse(undefined))
        : parse(newValue);
      sig.set(next);
    }
    originalCallback?.call(this, changedName, oldValue, newValue);
  };
}

function applyAttributes(
  proto: Record<string, unknown>,
  Class: { observedAttributes?: string[] },
  attributes: Record<string, AttributeSpec<unknown>>,
): string[] {
  const observed: string[] = Class.observedAttributes ? [...Class.observedAttributes] : [];

  for (const [name, spec] of Object.entries(attributes)) {
    const { parse, serialize, defaultValue } = normalizeAttribute(spec);
    observed.push(name);
    applyBinding(proto, name, name, parse, serialize, defaultValue);
  }

  return [...new Set(observed)];
}

function applyDataset(
  proto: Record<string, unknown>,
  Class: { observedAttributes?: string[] },
  dataset: Record<string, DatasetSpec>,
  existingAttrNames: ReadonlySet<string>,
): string[] {
  const observed: string[] = Class.observedAttributes ? [...Class.observedAttributes] : [];

  for (const [key, spec] of Object.entries(dataset)) {
    const attrName = `data-${toKebabCase(key)}`;
    if (existingAttrNames.has(attrName)) {
      throw new Error(
        `dataset key "${key}" produces attribute "${attrName}" which is also ` +
          `defined in \`attributes\`. Remove the attribute from \`attributes\` ` +
          `or pick a different key in \`dataset\`.`,
      );
    }
    observed.push(attrName);
    const parse = (a: string | undefined) => a ?? spec.default ?? "";
    const serialize = (v: unknown) => (v == null ? undefined : String(v));
    applyBinding(proto, attrName, key, parse, serialize, spec.default);
  }

  return [...new Set(observed)];
}

// ---------------------------------------------------------------------------
// Runtime: Apply events to prototype
// ---------------------------------------------------------------------------

function applyEvents(
  proto: Record<string, unknown>,
  Class: object,
  events: Record<string, EventSpec>,
): void {
  Object.defineProperty(Class, eventTransformsKey, {
    value: events,
    writable: false,
    enumerable: false,
    configurable: true,
  });

  const eventNames = Object.keys(events);
  const customEventNames = eventNames.filter(
    (name) => !(`on${toCamelCase(name)}` in HTMLElement.prototype),
  );

  for (const name of eventNames) {
    const methodName = toPascalCase(name);
    const dispatchName = `dispatch${methodName}`;

    proto[dispatchName] = function (
      this: HTMLElement,
      detail?: unknown,
      options?: Omit<CustomEventInit<unknown>, "detail">,
    ): boolean {
      return this.dispatchEvent(new CustomEvent(name, { detail, ...options }));
    };
  }

  const customWrapperMaps = new Map<
    string,
    WeakMap<HTMLElement, ((ev: Event) => void) | null>
  >();

  for (const name of customEventNames) {
    const propName = `on${toCamelCase(name)}`;
    const wrapperMap = new WeakMap<HTMLElement, ((ev: Event) => void) | null>();
    const processedMap = new WeakMap<HTMLElement, WeakSet<Event>>();

    customWrapperMaps.set(name, wrapperMap);

    Object.defineProperty(proto, propName, {
      get(this: HTMLElement) {
        return wrapperMap.get(this) ?? null;
      },
      set(this: HTMLElement, handler: ((ev: CustomEvent) => void) | null) {
        const prevWrapper = wrapperMap.get(this) ?? null;
        if (prevWrapper)
          this.removeEventListener(name, prevWrapper as EventListener);
        if (handler) {
          let processed = processedMap.get(this);
          if (!processed) {
            processed = new WeakSet<Event>();
            processedMap.set(this, processed);
          }
          const wrapper = (ev: Event) => {
            if (processed!.has(ev)) return;
            processed!.add(ev);
            handler.call(this, ev as CustomEvent);
          };
          wrapperMap.set(this, wrapper);
          this.addEventListener(name, wrapper as EventListener);
        } else {
          wrapperMap.set(this, null);
          processedMap.delete(this);
        }
      },
      enumerable: true,
      configurable: true,
    });
  }

  if (customEventNames.length > 0) {
    const originalDisconnected = proto.disconnectedCallback as
      | ((this: HTMLElement) => void)
      | undefined;
    proto.disconnectedCallback = function (this: HTMLElement) {
      for (const [name, map] of customWrapperMaps) {
        const wrapper = map.get(this);
        if (wrapper) this.removeEventListener(name, wrapper as EventListener);
      }
      originalDisconnected?.call(this);
    };
  }
}

// ---------------------------------------------------------------------------
// Runtime: Template slot binding
// ---------------------------------------------------------------------------

const disposablesKey = Symbol.for("rikka.disposables");

type DisposablesList = (() => void)[];

function trackDisposable(el: HTMLElement, dispose: () => void): void {
  const internal = el as unknown as Record<symbol, DisposablesList | undefined>;
  let list = internal[disposablesKey];
  if (!list) {
    list = [];
    Object.defineProperty(el, disposablesKey, {
      value: list,
      writable: false,
      enumerable: false,
      configurable: true,
    });
  }
  list.push(dispose);
}

function runDisposables(el: HTMLElement): void {
  const internal = el as unknown as Record<symbol, DisposablesList | undefined>;
  const list = internal[disposablesKey];
  if (list) {
    for (const dispose of list) dispose();
    list.length = 0;
  }
}

const SLOT_REGEX = /\{\{(\w+)\}\}/;

function asDynamicRecord(el: unknown): Record<string, unknown> {
  return el as Record<string, unknown>;
}

function getElementBinding(
  element: HTMLElement,
  name: string,
): unknown {
  const record = asDynamicRecord(element);
  const signalLike = record[`$${name}`];
  if (isSignal(signalLike)) return signalLike;
  return record[name];
}

function readTemplateVar(
  element: HTMLElement,
  name: string,
): { kind: "signal"; value: { get(): unknown } } | { kind: "value"; value: unknown } | { kind: "absent" } {
  const record = asDynamicRecord(element);
  const signalLike = record[`$${name}`];
  if (isSignal(signalLike)) return { kind: "signal", value: signalLike };
  if (name in record) return { kind: "value", value: record[name] };
  return { kind: "absent" };
}

function bindSlots(element: HTMLElement, root: HTMLElement | ShadowRoot): void {
  bindTextSlots(element, root);
  bindAttributeSlots(element, root);
}

function bindTextSlots(
  element: HTMLElement,
  root: HTMLElement | ShadowRoot,
): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: { node: Text; original: string }[] = [];

  let node: Node | null;
  while ((node = walker.nextNode()) !== null) {
    const text = node.textContent ?? "";
    if (SLOT_REGEX.test(text)) {
      textNodes.push({ node: node as Text, original: text });
    }
    SLOT_REGEX.lastIndex = 0;
  }

  for (const { node, original } of textNodes) {
    const singleMatch = /^\{\{(\w+)\}\}$/.exec(original);
    if (singleMatch) {
      const name = singleMatch[1];
      const reactiveValue = getElementBinding(element, name);

      if (isSignal(reactiveValue)) {
        node.textContent = String(reactiveValue.get());
        trackDisposable(
          element,
          effect(() => {
            node.textContent = String(reactiveValue.get());
          }),
        );
      } else {
        node.textContent = reactiveValue != null ? String(reactiveValue) : "";
      }
    } else {
      node.textContent = original.replace(/\{\{(\w+)\}\}/g, (_match, name) => {
        const reactiveValue = getElementBinding(element, name);
        if (isSignal(reactiveValue)) {
          queueMicrotask(() => {
            trackDisposable(
              element,
              effect(() => {
                node.textContent = original.replace(
                  /\{\{(\w+)\}\}/g,
                  (_m: string, n: string) => {
                    const result = readTemplateVar(element, n);
                    if (result.kind === "signal") return String(result.value.get());
                    if (result.kind === "value") return result.value != null ? String(result.value) : "";
                    return "";
                  },
                );
              }),
            );
          });
          return String(reactiveValue.get());
        }
        return reactiveValue != null ? String(reactiveValue) : "";
      });
    }
  }
}

function bindAttributeSlots(
  element: HTMLElement,
  root: HTMLElement | ShadowRoot,
): void {
  const allElements = root.querySelectorAll("*");
  const eventTransforms = (
    element.constructor as unknown as Record<symbol, unknown>
  )[eventTransformsKey] as Record<string, EventSpec> | undefined;

  for (const el of allElements) {
    for (const attr of Array.from(el.attributes)) {
      const value = attr.value;
      const isSlotBinding = SLOT_REGEX.test(value);
      const isDispatchBinding = /^\{\{@(\w+)\}\}$/.test(value);
      if (!isSlotBinding && !isDispatchBinding) continue;
      SLOT_REGEX.lastIndex = 0;

      const attrName = attr.name;

      if (attrName.startsWith("on") && attrName.length > 2) {
        const dispatchMatch = /^\{\{@(\w+)\}\}$/.exec(value);
        if (dispatchMatch) {
          const customEventName = dispatchMatch[1];
          const domEventName = attrName.slice(2).toLowerCase();
          const dispatchMethod = "dispatch" + toPascalCase(customEventName);
          const transform = eventTransforms?.[customEventName];
          el.removeAttribute(attrName);
          const domHandler = (domEvent: Event) => {
            const detail =
              typeof transform === "function" ? transform(domEvent) : undefined;
            (asDynamicRecord(element)[dispatchMethod] as ((d: unknown) => boolean) | undefined)?.(detail);
          };
          el.addEventListener(domEventName, domHandler);
          trackDisposable(element, () =>
            el.removeEventListener(domEventName, domHandler),
          );
        } else {
          const singleMatch = /^\{\{(\w+)\}\}$/.exec(value);
          if (singleMatch) {
            const name = singleMatch[1];
            const handler = getElementBinding(element, name);
            const isHandlerSignal = isSignal(handler);

            const eventName = attrName.slice(2).toLowerCase();
            el.removeAttribute(attrName);

            const bindHandler = (fn: unknown) => {
              if (typeof fn === "function") {
                (asDynamicRecord(el)[eventName] as unknown) = (
                  fn as (...a: unknown[]) => unknown
                ).bind(element);
              }
            };

            if (isHandlerSignal) {
              trackDisposable(
                element,
                effect(() => bindHandler((handler as { get(): unknown }).get())),
              );
            } else {
              queueMicrotask(() => bindHandler(handler));
            }
          }
        }
        continue;
      }

      const singleMatch = /^\{\{(\w+)\}\}$/.exec(value);
      if (singleMatch) {
        const name = singleMatch[1];
        const prop = getElementBinding(element, name);

        if (isSignal(prop)) {
          el.removeAttribute(attrName);
          trackDisposable(
            element,
            effect(() => {
              const v = (prop as { get(): unknown }).get();
              if (v === null || v === undefined || v === false) {
                el.removeAttribute(attrName);
              } else {
                el.setAttribute(attrName, String(v));
              }
            }),
          );
        } else {
          el.removeAttribute(attrName);
          if (prop != null && prop !== false) {
            el.setAttribute(attrName, String(prop));
          }
        }
      } else {
        el.setAttribute(
          attrName,
          value.replace(/\{\{(\w+)\}\}/g, (_match, name) => {
            const result = readTemplateVar(element, name);
            if (result.kind === "signal") return String(result.value.get());
            if (result.kind === "value") return result.value != null ? String(result.value) : "";
            return "";
          }),
        );
      }
    }
  }
}

function isSignal(value: unknown): value is { get(): unknown } {
  if (value == null || typeof value !== "object") return false;
  return Signal.isState(value) || Signal.isComputed(value);
}

// ---------------------------------------------------------------------------
// defineElement
// ---------------------------------------------------------------------------

export function defineElement<C extends BaseConfig = BaseConfig>(
  tagName: string,
  config?: ElementConfig<C>,
): ElementConstructor<C> {
  const attributes = config?.attributes ?? {};
  const dataset = config?.dataset ?? {};
  const events = config?.events ?? {};
  const shadowOptions =
    config?.shadow === false
      ? null
      : (config?.shadow ?? { mode: "open" as const });
  const styles = config?.styles
    ? Array.isArray(config.styles)
      ? config.styles
      : [config.styles]
    : [];
  const configRecord = (config ?? {}) as Record<string, unknown>;
  const templateEl = configRecord.template as HTMLTemplateElement | undefined;
  const renderFn = configRecord.render as unknown as
    | ((this: HTMLElement) => Element)
    | undefined;

  class RikkaElementInner extends HTMLElement {
    static observedAttributes: string[] = [];
    static tagName: string = tagName;

    #initialized = false;

    constructor() {
      super();
    }

    attributeChangedCallback(
      attrName: string,
      oldValue: string | null,
      newValue: string | null,
    ) {}

    connectedCallback() {
      if (this.#initialized) return;
      this.#initialized = true;

      if (shadowOptions) {
        const shadow = this.shadowRoot ?? this.attachShadow(shadowOptions);

        if (styles.length > 0) {
          shadow.adoptedStyleSheets = [...shadow.adoptedStyleSheets, ...styles];
        }

        if (templateEl) {
          shadow.appendChild(templateEl.content.cloneNode(true));
          bindSlots(this, shadow);
        } else if (renderFn) {
          const result = renderFn.call(this);
          if (result instanceof Element) {
            shadow.appendChild(result);
          }
        }
      }
    }

    disconnectedCallback() {
      runDisposables(this);
      this.#initialized = false;
    }
  }

  const proto = RikkaElementInner.prototype as unknown as Record<string, unknown>;
  if (renderFn) {
    proto.render = renderFn;
  }

  const methods = config?.methods;
  if (methods) {
    for (const [name, fn] of Object.entries(methods)) {
      proto[name] = fn;
    }
  }

  const attrObserved = applyAttributes(
    proto,
    RikkaElementInner as unknown as { observedAttributes?: string[] },
    attributes,
  );
  const datasetObserved = applyDataset(
    proto,
    RikkaElementInner as unknown as { observedAttributes?: string[] },
    dataset,
    new Set(attrObserved),
  );
  const observed = [...new Set([...attrObserved, ...datasetObserved])];
  Object.defineProperty(RikkaElementInner, "observedAttributes", {
    get() {
      return observed;
    },
    configurable: true,
    enumerable: true,
  });

  applyEvents(proto, RikkaElementInner, events);

  if (!customElements.get(tagName)) {
    customElements.define(
      tagName,
      RikkaElementInner as unknown as CustomElementConstructor,
    );
  }

  const tagHelper = (...args: unknown[]) => {
    if (isPlainObject(args[0])) {
      return h(
        tagName,
        args[0] as Parameters<typeof h>[1],
        ...(args.slice(1) as Child[]),
      ) as RikkaElement<C>;
    }
    return h(tagName, ...(args as Child[])) as RikkaElement<C>;
  };

  const result = RikkaElementInner as unknown as ElementConstructor<C>;

  Object.defineProperty(result, "h", {
    value: tagHelper,
    writable: false,
    enumerable: true,
    configurable: true,
  });

  return result;
}
