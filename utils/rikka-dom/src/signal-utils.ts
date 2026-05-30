import { Signal } from 'rikka-signal';

export function isSignal(
  value: unknown,
): value is Signal.State<unknown> | Signal.Computed<unknown> {
  return Signal.isState(value) || Signal.isComputed(value);
}

export function isWritableSignal(value: unknown): value is Signal.State<unknown> {
  return Signal.isState(value);
}

export function unwrapSignal<T>(value: T | Signal.State<T> | Signal.Computed<T>): T {
  if (isSignal(value)) return value.get() as T;
  return value;
}

export function isPlainObject(val: unknown): val is Record<string, unknown> {
  if (val == null || typeof val !== "object") return false;
  const proto = Object.getPrototypeOf(val);
  return proto === Object.prototype || proto === null;
}
