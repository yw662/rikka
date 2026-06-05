/**
 * @module rikka-signal
 *
 * Fine-grained reactive primitives: signals, computed values, and effects.
 * Built on top of {@link https://github.com/tc39/proposal-signals signal-polyfill}.
 *
 * @example
 * import { signal, computed, effect } from '@rikka/signal';
 *
 * const count = signal(0);
 * const doubled = computed(() => count.get() * 2);
 *
 * effect(() => console.log(doubled.get())); // 0
 * count.set(3); // (next microtask) 6
 */

export { Signal } from 'signal-polyfill';

import { Signal } from 'signal-polyfill';

/**
 * Creates a reactive signal with an initial value.
 *
 * @typeParam T - The type of the signal's value
 * @param initialValue - The initial value
 * @returns A Signal.State that tracks and notifies dependents on changes
 *
 * @example
 * const count = signal(0);
 * console.log(count.get()); // 0
 * count.set(1);
 * console.log(count.get()); // 1
 */
export function signal<T>(initialValue: T): Signal.State<T> {
  return new Signal.State(initialValue);
}

/**
 * Creates a computed signal derived from other signals.
 * Automatically tracks dependencies and only recomputes when they change.
 * Results are cached — repeated `.get()` calls return the cached value
 * until a dependency changes.
 *
 * @typeParam T - The type of the computed value
 * @param fn - A pure function that reads signals and returns a derived value
 * @returns A Signal.Computed that lazily recomputes on access
 *
 * @example
 * const a = signal(1);
 * const b = signal(2);
 * const sum = computed(() => a.get() + b.get());
 * console.log(sum.get()); // 3
 */
export function computed<T>(fn: () => T): Signal.Computed<T> {
  return new Signal.Computed(fn);
}

export { effect } from './effect.js';
