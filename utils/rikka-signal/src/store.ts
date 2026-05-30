import { Signal } from "signal-polyfill";

const RAW = Symbol("rikka.raw");
const SIGNALS = Symbol("rikka.signals");
const PROXY_CACHE = Symbol("rikka.proxyCache");

function isReactiveObject(value: unknown): value is object {
  if (value === null || typeof value !== "object") return false;
  if (Array.isArray(value)) return true;
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

function toRaw<T>(value: T): T {
  if (value !== null && typeof value === "object" && (value as any)[RAW]) {
    return (value as any)[RAW];
  }
  return value;
}

declare const __storeBrand: unique symbol;

export type Store<T extends object> = T & {
  readonly [__storeBrand]?: undefined;
};

function syncNestedProxy(nestedProxy: any, newObj: object | null | undefined) {
  const nestedSignals: Map<PropertyKey, Signal.State<any>> | undefined =
    nestedProxy[SIGNALS];
  if (!nestedSignals) return;

  for (const [key, signal] of nestedSignals) {
    const newValue = newObj != null ? (newObj as any)[key] : undefined;
    const currentValue = signal.get();

    if (!Object.is(newValue, currentValue)) {
      signal.set(newValue);
    }

    if (isReactiveObject(newValue)) {
      const nestedProxyCache: Map<PropertyKey, any> | undefined =
        nestedProxy[PROXY_CACHE];
      const deeperNested = nestedProxyCache?.get(key);
      if (deeperNested) {
        syncNestedProxy(deeperNested, newValue);
      }
    } else {
      const nestedProxyCache: Map<PropertyKey, any> | undefined =
        nestedProxy[PROXY_CACHE];
      const deeperNested = nestedProxyCache?.get(key);
      if (deeperNested) {
        syncNestedProxy(deeperNested, undefined);
        nestedProxyCache!.delete(key);
      }
    }
  }
}

function createReactiveProxy(
  readTarget: () => object | null,
  proxyTarget: object,
): any {
  const signals = new Map<PropertyKey, Signal.State<any>>();
  const proxyCache = new Map<PropertyKey, any>();

  const proxy = new Proxy(proxyTarget, {
    get(_target, prop, receiver) {
      if (prop === RAW) return readTarget();
      if (prop === SIGNALS) return signals;
      if (prop === PROXY_CACHE) return proxyCache;

      const target = readTarget();

      let s = signals.get(prop);
      if (!s) {
        if (target == null) return undefined;
        s = new Signal.State((target as any)[prop]);
        signals.set(prop, s);
      }

      const value = s.get();

      if (isReactiveObject(value)) {
        let nested = proxyCache.get(prop);
        if (!nested) {
          const parentSignals = signals;
          const parentKey = prop;
          const parentReadTarget = readTarget;
          nested = createReactiveProxy(() => {
            const currentSignal = parentSignals.get(parentKey);
            if (currentSignal) {
              const currentRaw = currentSignal.get();
              if (isReactiveObject(currentRaw)) return currentRaw;
            }
            const parentTarget = parentReadTarget();
            if (parentTarget != null) {
              const val = (parentTarget as any)[parentKey];
              if (isReactiveObject(val)) return val;
            }
            return null;
          }, value);
          proxyCache.set(prop, nested);
        }
        return nested;
      }
      return value;
    },

    set(_target, prop, value) {
      value = toRaw(value);

      const target = readTarget();

      let s = signals.get(prop);
      if (!s) {
        s = new Signal.State(value);
        signals.set(prop, s);
      } else {
        s.set(value);
      }

      if (target != null) {
        (target as any)[prop] = value;
      }

      const nestedProxy = proxyCache.get(prop);
      if (nestedProxy) {
        syncNestedProxy(
          nestedProxy,
          isReactiveObject(value) ? value : undefined,
        );
      }

      return true;
    },

    deleteProperty(_target, prop) {
      const target = readTarget();
      const had =
        target != null && Object.prototype.hasOwnProperty.call(target, prop);

      if (target != null) {
        delete (target as any)[prop];
      }

      if (had) {
        const s = signals.get(prop);
        if (s) {
          s.set(undefined);
        }

        const nestedProxy = proxyCache.get(prop);
        if (nestedProxy) {
          syncNestedProxy(nestedProxy, undefined);
        }
      }

      return true;
    },

    has(_target, prop) {
      if (prop === RAW || prop === SIGNALS || prop === PROXY_CACHE) return true;
      const target = readTarget();
      if (target == null) return false;
      return prop in target;
    },

    ownKeys(_target) {
      const target = readTarget();
      if (target == null) return [];
      return Reflect.ownKeys(target);
    },

    getOwnPropertyDescriptor(_target, prop) {
      const target = readTarget();
      if (target == null) return undefined;
      const descriptor = Object.getOwnPropertyDescriptor(target, prop);
      if (descriptor) {
        return {
          ...descriptor,
          configurable: true,
        };
      }
      return undefined;
    },
  });

  return proxy;
}

export function store<T extends object>(initial: T): Store<T> {
  if (initial != null && typeof initial === "object" && (initial as any)[RAW]) {
    return initial as Store<T>;
  }

  const target = initial as object;

  const proxy = createReactiveProxy(() => target, target);

  return proxy as Store<T>;
}

export function raw<T extends object>(store: Store<T> | T): T {
  if (store != null && typeof store === "object" && (store as any)[RAW]) {
    return (store as any)[RAW];
  }
  return store;
}

type PathValue<T, P extends readonly PropertyKey[]> = P extends readonly [
  infer K,
  ...infer R extends readonly PropertyKey[],
]
  ? K extends keyof T
    ? PathValue<T[K], R>
    : never
  : T;

export function signalOf<
  T extends object,
  const P extends readonly PropertyKey[],
>(store: Store<T>, ...path: P): Signal.State<PathValue<T, P>> {
  let current: any = store;

  for (let i = 0; i < path.length - 1; i++) {
    current = current[path[i]];
  }

  const rawKey = path[path.length - 1];
  const lastKey: PropertyKey =
    typeof rawKey === "number" ? String(rawKey) : rawKey;
  current[lastKey];

  const signals: Map<PropertyKey, Signal.State<any>> | undefined =
    current[SIGNALS];
  if (!signals) {
    throw new Error("signalOf: target is not a store");
  }

  let s = signals.get(lastKey);
  if (!s) {
    const target = current[RAW];
    s = new Signal.State(target?.[lastKey]);
    signals.set(lastKey, s);
  }

  return s as Signal.State<PathValue<T, P>>;
}
