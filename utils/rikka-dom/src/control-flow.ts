import { effect } from 'rikka-signal';
import type { Signal } from 'rikka-signal';
import { unwrapSignal } from './signal-utils.js';
import { ReactiveRange } from './h.js';

type Condition = boolean | Signal.State<boolean> | Signal.Computed<boolean>;

type RenderResult = Element | null;

function toElements(result: RenderResult): Element[] {
  return result ? [result] : [];
}

export function Show(
  condition: Condition,
  render: () => RenderResult,
): ReactiveRange {
  let cached: Element[] | null = null;

  return new ReactiveRange((range) => {
    return effect(() => {
      if (!range.alive) return;

      if (unwrapSignal(condition)) {
        if (!cached) {
          cached = toElements(render());
        }
        range.reconcile(cached);
      } else {
        range.clear();
      }
    });
  });
}

export function When(
  condition: Condition,
  trueRender: () => RenderResult,
  falseRender: () => RenderResult,
): ReactiveRange {
  let trueEls: Element[] | null = null;
  let falseEls: Element[] | null = null;

  return new ReactiveRange((range) => {
    return effect(() => {
      if (!range.alive) return;

      if (unwrapSignal(condition)) {
        if (!trueEls) {
          trueEls = toElements(trueRender());
        }
        range.reconcile(trueEls);
      } else {
        if (!falseEls) {
          falseEls = toElements(falseRender());
        }
        range.reconcile(falseEls);
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
    if (typeof c.match === 'function') {
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
  fallback?: () => RenderResult,
): ReactiveRange {
  const cache = new Map<() => RenderResult, Element[]>();

  return new ReactiveRange((range) => {
    return effect(() => {
      if (!range.alive) return;

      const val = unwrapSignal(value);
      const renderFn = findMatch(val, cases, fallback);

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
  });
}

export function Match<T>(
  match: CaseMatcher<T>,
  render: () => RenderResult,
): Case<T> {
  return { match, render };
}

export { For } from './h.js';
