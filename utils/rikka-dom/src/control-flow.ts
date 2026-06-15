import { effect } from '@takanashi/rikka-signal';
import type { Signal } from '@takanashi/rikka-signal';
import { unwrapSignal } from './signal-utils.js';
import { ReactiveRange } from './h.js';

type Condition = boolean | Signal.State<boolean> | Signal.Computed<boolean>;

type RenderResult = Element | null;
type RenderInput = RenderResult | (() => RenderResult);

function toElements(result: RenderResult): Element[] {
  return result ? [result] : [];
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
  let wasShowing = false;

  return new ReactiveRange((range) => {
    return effect(() => {
      if (!range.alive) return;

      const shouldShow = unwrapSignal(condition);

      if (shouldShow) {
        if (!cached) {
          cached = toElements(renderFn());
        }
        if (!wasShowing) {
          range.reconcile(cached);
          wasShowing = true;
        }
      } else {
        if (wasShowing) {
          range.clear();
          wasShowing = false;
        }
      }
    });
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
  let wasTrue: boolean | null = null;

  return new ReactiveRange((range) => {
    return effect(() => {
      if (!range.alive) return;

      const isTrue = unwrapSignal(condition);

      if (isTrue) {
        if (!trueEls) {
          trueEls = toElements(trueFn());
        }
        if (wasTrue !== true) {
          range.reconcile(trueEls);
          wasTrue = true;
        }
      } else {
        if (!falseEls) {
          falseEls = toElements(falseFn());
        }
        if (wasTrue !== false) {
          range.reconcile(falseEls);
          wasTrue = false;
        }
      }
    });
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
  let lastRenderFn: (() => RenderResult) | null = null;

  return new ReactiveRange((range) => {
    return effect(() => {
      if (!range.alive) return;

      const val = unwrapSignal(value);
      const renderFn = findMatch(val, cases, fallbackFn);

      if (!renderFn) {
        if (lastRenderFn !== null) {
          range.clear();
          lastRenderFn = null;
        }
        return;
      }

      if (!cache.has(renderFn)) {
        cache.set(renderFn, toElements(renderFn()));
      }
      const elements = cache.get(renderFn);
      if (elements && lastRenderFn !== renderFn) {
        range.reconcile(elements);
        lastRenderFn = renderFn;
      }
    });
  });
}

export function Match<T>(
  match: CaseMatcher<T>,
  render: RenderInput,
): Case<T> {
  return { match, render: normalizeRender(render) };
}

export { For } from './h.js';
