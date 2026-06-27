import { effect } from '@takanashi/rikka-signal';
import type { Signal } from '@takanashi/rikka-signal';
import { unwrapSignal } from './signal-utils.js';
import { ReactiveRange, disposeElement } from './h.js';

type Condition = boolean | Signal.State<boolean> | Signal.Computed<boolean>;

type RenderResult = Element | null;
type RenderInput = RenderResult | (() => RenderResult);

function toElements(result: RenderResult): Element[] {
  return result ? [result] : [];
}

function disposeElements(els: Element[] | null): void {
  if (!els) return;
  for (const el of els) disposeElement(el);
}

function normalizeRender(
  render: RenderInput,
): () => RenderResult {
  return typeof render === "function" && !(render instanceof Element)
    ? render
    : () => render as RenderResult;
}

export function Show(
  condition: Condition,
  render: RenderInput,
): ReactiveRange {
  let cached: Element[] | null = null;
  const renderFn = normalizeRender(render);

  return new ReactiveRange((range) => {
    const stop = effect(() => {
      if (!range.alive) return;

      if (unwrapSignal(condition)) {
        if (!cached) {
          cached = toElements(renderFn());
        }
        range.reconcile(cached);
      } else {
        range.clear();
      }
    });
    return () => {
      stop();
      disposeElements(cached);
      cached = null;
    };
  });
}

export function When(
  condition: Condition,
  trueRender: RenderInput,
  falseRender: RenderInput,
): ReactiveRange {
  let trueEls: Element[] | null = null;
  let falseEls: Element[] | null = null;
  const trueFn = normalizeRender(trueRender);
  const falseFn = normalizeRender(falseRender);

  return new ReactiveRange((range) => {
    const stop = effect(() => {
      if (!range.alive) return;

      if (unwrapSignal(condition)) {
        if (!trueEls) {
          trueEls = toElements(trueFn());
        }
        range.reconcile(trueEls);
      } else {
        if (!falseEls) {
          falseEls = toElements(falseFn());
        }
        range.reconcile(falseEls);
      }
    });
    return () => {
      stop();
      disposeElements(trueEls);
      disposeElements(falseEls);
      trueEls = null;
      falseEls = null;
    };
  });
}

type CaseMatcher<T> = T | ((value: T) => boolean);

export interface Case<T> {
  match: CaseMatcher<T>;
  render: () => RenderResult;
}

type SwitchValue<T> = T | Signal.State<T> | Signal.Computed<T>;

function findMatch<T>(
  val: T,
  cases: Case<T>[],
  fallback: (() => RenderResult) | undefined,
): (() => RenderResult) | null {
  for (const c of cases) {
    if (typeof c.match === "function") {
      if ((c.match as (v: T) => boolean)(val)) {
        return c.render;
      }
    } else if (Object.is(c.match, val)) {
      return c.render;
    }
  }
  return fallback ?? null;
}

export function Switch<T>(
  value: SwitchValue<T>,
  cases: Case<T>[],
  fallback?: RenderInput,
): ReactiveRange {
  const cache = new Map<() => RenderResult, Element[]>();
  const fallbackFn = fallback ? normalizeRender(fallback) : undefined;

  return new ReactiveRange((range) => {
    const stop = effect(() => {
      if (!range.alive) return;

      const val = unwrapSignal(value);
      const renderFn = findMatch(val, cases, fallbackFn);

      if (!renderFn) {
        range.clear();
        return;
      }

      if (!cache.has(renderFn)) {
        cache.set(renderFn, toElements(renderFn()));
      }
      const elements = cache.get(renderFn);
      if (elements) {
        range.reconcile(elements);
      }
    });
    return () => {
      stop();
      for (const [, els] of cache) disposeElements(els);
      cache.clear();
    };
  });
}

export function Match<T>(
  match: CaseMatcher<T>,
  render: RenderInput,
): Case<T> {
  return { match, render: normalizeRender(render) };
}

export { For } from './h.js';
