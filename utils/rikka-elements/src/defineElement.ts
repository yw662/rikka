import { Signal, effect } from "rikka-signal";
import { h } from "rikka-dom";
import type { Child, CommonHTMLAttributes } from "rikka-dom";
import type { CamelCase, PascalCase } from "./utils.js";
import { toCamelCase, toPascalCase } from "./utils.js";

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

export type AttributeSpec<T> =
  | ((attr: string | undefined) => T)
  | {
      type: (attr: string | undefined) => T;
      default?: T;
    };

type AttrValueType<S> = S extends AttributeSpec<infer T> ? T : unknown;

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
  events?: Record<string, EventSpec>;
  methods?: Record<string, (...args: any[]) => any>;
};

export type ElementConfig<C extends BaseConfig = BaseConfig> =
  | (BaseConfig & { template: HTMLTemplateElement; render?: never })
  | (BaseConfig & { template?: never; render?: (this: RikkaElement<C>) => Element })
  | BaseConfig;

export type RikkaElement<C extends BaseConfig> = HTMLElement &
  AttributeProps<C> &
  SignalProps<C> &
  EventProps<C> &
  ShadowProp<C> &
  MethodProps<C>;

export type TagFunctionProps<C extends BaseConfig> = AttributeProps<C> &
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

type SignalProps<C extends BaseConfig> =
  C["attributes"] extends Record<string, AttributeSpec<any>>
    ? {
        -readonly [K in keyof C["attributes"] as `$${K & string}`]: Signal.State<
          AttrValueType<C["attributes"][K]>
        >;
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

function getOrCreateSignal<T>(
  el: HTMLElement,
  name: string,
  parse: (v: string | undefined) => T,
  defaultValue?: T,
): Signal.State<T> {
  let signals = (el as any)[signalKey];
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

function normalizeAttribute<T>(
  spec: AttributeSpec<T>,
): NormalizedAttribute & { defaultValue?: T } {
  if (typeof spec === "function") {
    return {
      parse: spec,
      serialize: (v) => (v == null ? undefined : String(v)),
    };
  }

  return {
    parse: spec.type,
    serialize: (v) => (v == null ? undefined : String(v)),
    defaultValue: spec.default,
  };
}

// ---------------------------------------------------------------------------
// Runtime: Apply attributes to prototype
// ---------------------------------------------------------------------------

function applyAttributes(
  proto: any,
  Class: Function,
  attributes: Record<string, AttributeSpec<unknown>>,
): string[] {
  const observed: string[] = (Class as any).observedAttributes ?? [];

  for (const [name, spec] of Object.entries(attributes)) {
    const { parse, serialize, defaultValue } = normalizeAttribute(spec);
    observed.push(name);

    Object.defineProperty(proto, name, {
      get(this: HTMLElement) {
        const sig = getOrCreateSignal(this, name, parse, defaultValue);
        return sig.get();
      },
      set(this: HTMLElement, value: unknown) {
        const sig = getOrCreateSignal(this, name, parse, defaultValue);
        sig.set(value);
        const strValue = serialize(value);
        if (strValue == null) {
          this.removeAttribute(name);
        } else if (this.getAttribute(name) !== strValue) {
          this.setAttribute(name, strValue);
        }
      },
      enumerable: true,
      configurable: true,
    });

    const signalName = `$${name}`;
    Object.defineProperty(proto, signalName, {
      get(this: HTMLElement) {
        return getOrCreateSignal(this, name, parse, defaultValue);
      },
      enumerable: true,
      configurable: true,
    });

    const originalCallback = proto.attributeChangedCallback;
    proto.attributeChangedCallback = function (
      this: HTMLElement,
      attrName: string,
      oldValue: string | null,
      newValue: string | null,
    ) {
      if (attrName === name) {
        const sig = getOrCreateSignal(this, name, parse, defaultValue);
        sig.set(parse(newValue ?? undefined));
      }
      originalCallback?.call(this, attrName, oldValue, newValue);
    };
  }

  return [...new Set(observed)];
}

// ---------------------------------------------------------------------------
// Runtime: Apply events to prototype
// ---------------------------------------------------------------------------

function applyEvents(
  proto: any,
  Class: Function,
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
    const originalDisconnected = proto.disconnectedCallback;
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

function trackDisposable(el: HTMLElement, dispose: () => void): void {
  let list = (el as any)[disposablesKey] as (() => void)[] | undefined;
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
  const list = (el as any)[disposablesKey] as (() => void)[] | undefined;
  if (list) {
    for (const dispose of list) dispose();
    list.length = 0;
  }
}

const SLOT_REGEX = /\{\{(\w+)\}\}/g;

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
      // Prefer $-prefixed signal for reactive updates
      let reactiveValue = (element as any)["$" + name];
      if (!isSignal(reactiveValue)) reactiveValue = (element as any)[name];

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
        // Prefer $-prefixed signal for reactive updates
        let reactiveValue = (element as any)["$" + name];
        if (!isSignal(reactiveValue)) reactiveValue = (element as any)[name];
        if (isSignal(reactiveValue)) {
          queueMicrotask(() => {
            trackDisposable(
              element,
              effect(() => {
                node.textContent = original.replace(
                  /\{\{(\w+)\}\}/g,
                  (_m: string, n: string) => {
                    const rv = (element as any)["$" + n];
                    return isSignal(rv)
                      ? String(rv.get())
                      : (element as any)[n] != null
                        ? String((element as any)[n])
                        : "";
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
          // {{@event}} syntax: DOM event → transform → dispatch element's custom event
          const customEventName = dispatchMatch[1];
          const domEventName = attrName.slice(2).toLowerCase();
          const dispatchMethod = "dispatch" + toPascalCase(customEventName);
          const transforms = (element.constructor as any)[
            eventTransformsKey
          ] as Record<string, EventSpec> | undefined;
          const transform = transforms?.[customEventName];
          el.removeAttribute(attrName);
          el.addEventListener(domEventName, (domEvent: Event) => {
            const detail =
              typeof transform === "function" ? transform(domEvent) : undefined;
            (element as any)[dispatchMethod]?.(detail);
          });
        } else {
          // Legacy {{handler}} syntax: read handler from element
          const singleMatch = /^\{\{(\w+)\}\}$/.exec(value);
          if (singleMatch) {
            const name = singleMatch[1];
            let handler = (element as any)["$" + name];
            const isHandlerSignal = isSignal(handler);
            if (!isHandlerSignal) handler = (element as any)[name];

            const eventName = attrName.slice(2).toLowerCase();
            el.removeAttribute(attrName);

            const bindHandler = (fn: unknown) => {
              if (typeof fn === "function") {
                (el as any)[eventName] = fn.bind(element);
              }
            };

            if (isHandlerSignal) {
              trackDisposable(
                element,
                effect(() => bindHandler(handler.get())),
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
        let prop = (element as any)["$" + name];
        if (!isSignal(prop)) prop = (element as any)[name];

        if (isSignal(prop)) {
          el.removeAttribute(attrName);
          trackDisposable(
            element,
            effect(() => {
              const v = prop.get();
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
            let v = (element as any)["$" + name];
            if (!isSignal(v)) v = (element as any)[name];
            return isSignal(v) ? String(v.get()) : v != null ? String(v) : "";
          }),
        );
      }
    }
  }
}

function isSignal(value: unknown): value is { get(): unknown } {
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
  const templateEl =
    "template" in (config ?? {})
      ? ((config as any).template as HTMLTemplateElement | undefined)
      : undefined;
  const renderFn =
    "render" in (config ?? {})
      ? ((config as any).render as (() => Element) | undefined)
      : undefined;

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
          const result = (this as any).render();
          if (result instanceof Element) {
            shadow.appendChild(result);
          }
        }
      }
    }

    disconnectedCallback() {
      runDisposables(this);
    }
  }

  if (renderFn) {
    (RikkaElementInner.prototype as any).render = renderFn;
  }

  const methods = config?.methods;
  if (methods) {
    for (const [name, fn] of Object.entries(methods)) {
      (RikkaElementInner.prototype as any)[name] = fn;
    }
  }

  const observed = applyAttributes(
    RikkaElementInner.prototype,
    RikkaElementInner,
    attributes,
  );
  Object.defineProperty(RikkaElementInner, "observedAttributes", {
    get() {
      return observed;
    },
    configurable: true,
    enumerable: true,
  });

  applyEvents(RikkaElementInner.prototype, RikkaElementInner, events);

  queueMicrotask(() => {
    customElements.define(
      tagName,
      RikkaElementInner as CustomElementConstructor,
    );
  });

  const tagHelper = (...args: any[]) => {
    if (isPlainObject(args[0])) {
      return (h as any)(
        tagName,
        args[0] as Record<string, unknown>,
        ...args.slice(1),
      ) as RikkaElement<C>;
    }
    return (h as any)(tagName, ...args) as RikkaElement<C>;
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
