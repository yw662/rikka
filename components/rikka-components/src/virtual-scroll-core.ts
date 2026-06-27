import { signal, computed, type Signal } from "@takanashi/rikka-signal";

export type ReadableSignal<T> = Signal.State<T> | Signal.Computed<T>;

/** Reserved space (px) at the bottom for the loading indicator. */
export const LOADING_RESERVED = 50;

export function readBool(
  value: ReadableSignal<boolean> | boolean | undefined,
  defaultValue: boolean,
): boolean {
  if (value == null) return defaultValue;
  if (typeof value === "boolean") return value;
  return value.get();
}

export interface VirtualScrollCoreOptions<T, K = unknown> {
  source: ReadableSignal<T[]>;
  itemHeight?: number;
  estimatedItemHeight?: number;
  overscan?: number;
  keyFn?: (item: T, index: number) => K;
  onLoadMore?: (info: { lastIndex: number; total: number }) => void;
  loadMoreThreshold?: number;
  isLoading?: ReadableSignal<boolean> | boolean;
  hasMore?: ReadableSignal<boolean> | boolean;
  /** When true, contentHeight reserves space for a loading indicator. */
  hasLoadingIndicator?: boolean;
}

export interface VirtualScrollCore<T, K = unknown> {
  /** Current scroll top (updated by scroll handler). */
  scrollTop: Signal.State<number>;
  /** Current viewport height (updated by ResizeObserver + clientHeight). */
  viewportHeight: Signal.State<number>;
  /** Layout: prefix sums of item heights. */
  layout: Signal.Computed<{
    offsets: number[];
    count: number;
    total: number;
  }>;
  /** Total content height (includes loading space when loading). */
  contentHeight: Signal.Computed<number>;
  /** Visible item range [start, end). */
  visibleRange: Signal.Computed<{ start: number; end: number }>;
  /** Height cache (variable mode). */
  heightCache: Map<K, number>;
  /** Map from element to its key (for height measurement). */
  elementKeys: WeakMap<HTMLElement, K>;
  /** Observe an element for height changes (variable mode). */
  measureElement: (el: HTMLElement, key: K) => void;
  /** Stop observing an element. */
  unmeasureElement: (el: HTMLElement) => void;
  /** Attach to a scroll container element. Sets up listeners and observers. */
  attach: (container: HTMLElement) => void;
  /** Scroll to a specific item index. */
  scrollToIndex: (
    index: number,
    align?: "start" | "center" | "end",
  ) => void;
  /** Clean up all listeners and observers. */
  dispose: () => void;
}

/**
 * Creates the core virtual scroll logic: state, layout computation,
 * visible range calculation, height measurement, scroll handling,
 * and lazy loading.
 *
 * This is an internal module shared by `virtualScroll`, `virtualTable`,
 * and `virtualTree`. The caller is responsible for DOM creation and
 * rendering (positioning items, reconciling children).
 */
export function createVirtualScrollCore<T, K = unknown>(
  options: VirtualScrollCoreOptions<T, K>,
): VirtualScrollCore<T, K> {
  const {
    source,
    itemHeight,
    estimatedItemHeight = 40,
    overscan = 3,
    keyFn,
    onLoadMore,
    loadMoreThreshold = 100,
    isLoading,
    hasMore,
    hasLoadingIndicator = false,
  } = options;

  const fixedMode = itemHeight != null && itemHeight > 0;
  const resolvedItemHeight = itemHeight ?? estimatedItemHeight;

  // --- State ---
  const scrollTop = signal(0);
  const viewportHeight = signal(0);
  /** Bumped when measured heights change, to trigger layout recompute. */
  const heightVersion = signal(0);

  // --- Height cache (variable mode) ---
  const heightCache = new Map<K, number>();
  const elementKeys = new WeakMap<HTMLElement, K>();

  // --- Layout: prefix sums of item heights ---
  const layout = computed(() => {
    const items = source.get();
    heightVersion.get();

    const offsets: number[] = new Array(items.length + 1);
    offsets[0] = 0;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const key = keyFn ? keyFn(item, i) : (item as unknown as K);
      const h = fixedMode
        ? (itemHeight as number)
        : (heightCache.get(key) ?? resolvedItemHeight);
      offsets[i + 1] = offsets[i] + h;
    }
    return {
      offsets,
      count: items.length,
      total: offsets[items.length] ?? 0,
    };
  });

  const contentHeight = computed(() => {
    const base = layout.get().total;
    const loading = readBool(isLoading, false);
    return loading && hasLoadingIndicator ? base + LOADING_RESERVED : base;
  });

  // --- Visible range [start, end) ---
  const visibleRange = computed(() => {
    const top = scrollTop.get();
    const vh = viewportHeight.get();
    const { offsets, count } = layout.get();

    if (count === 0 || vh === 0) return { start: 0, end: 0 };

    // Binary search: first index where offsets[i+1] > top
    let lo = 0;
    let hi = count;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (offsets[mid + 1] <= top) lo = mid + 1;
      else hi = mid;
    }
    const rawStart = lo;

    // Binary search: first index where offsets[i] >= top + vh
    const bottom = top + vh;
    lo = rawStart;
    hi = count;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (offsets[mid] < bottom) lo = mid + 1;
      else hi = mid;
    }
    const rawEnd = lo;

    return {
      start: Math.max(0, rawStart - overscan),
      end: Math.min(count, rawEnd + overscan),
    };
  });

  // --- Item height measurement (variable mode only) ---
  let itemObserver: ResizeObserver | null = null;
  if (!fixedMode && typeof ResizeObserver !== "undefined") {
    itemObserver = new ResizeObserver((entries) => {
      let changed = false;
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        const key = elementKeys.get(el);
        if (key !== undefined) {
          const h =
            entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
          if (h > 0 && heightCache.get(key) !== h) {
            heightCache.set(key, h);
            changed = true;
          }
        }
      }
      if (changed) {
        heightVersion.set(heightVersion.get() + 1);
      }
    });
  }

  function measureElement(el: HTMLElement, key: K): void {
    elementKeys.set(el, key);
    itemObserver?.observe(el);
  }

  function unmeasureElement(el: HTMLElement): void {
    itemObserver?.unobserve(el);
  }

  // --- Container setup ---
  let container: HTMLElement | null = null;
  let rafId = 0;
  let viewportObserver: ResizeObserver | null = null;

  function updateViewportHeight(): void {
    if (!container) return;
    const h = container.clientHeight;
    if (h > 0) viewportHeight.set(h);
  }

  function onScroll(): void {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      if (!container) return;
      scrollTop.set(container.scrollTop);
      updateViewportHeight();

      // Lazy loading check
      if (onLoadMore) {
        const items = source.get();
        if (items.length === 0) return;
        const { total } = layout.get();
        const remaining =
          total - container.scrollTop - container.clientHeight;
        if (
          remaining < loadMoreThreshold &&
          readBool(hasMore, true) &&
          !readBool(isLoading, false)
        ) {
          onLoadMore({ lastIndex: items.length - 1, total: items.length });
        }
      }
    });
  }

  function attach(el: HTMLElement): void {
    container = el;
    el.addEventListener("scroll", onScroll, { passive: true });

    // Initial read (may be 0 if not attached to DOM yet)
    updateViewportHeight();
    // Read after next frame (element likely attached by then)
    requestAnimationFrame(updateViewportHeight);

    if (typeof ResizeObserver !== "undefined") {
      viewportObserver = new ResizeObserver(() => updateViewportHeight());
      viewportObserver.observe(el);
    }
  }

  function scrollToIndex(
    index: number,
    align: "start" | "center" | "end" = "start",
  ): void {
    if (!container) return;
    const items = source.get();
    if (index < 0 || index >= items.length) return;
    const { offsets } = layout.get();
    const itemTop = offsets[index] ?? 0;
    const itemBottom = offsets[index + 1] ?? itemTop + resolvedItemHeight;
    const vh = viewportHeight.get();
    const itemH = itemBottom - itemTop;

    let target: number;
    if (align === "start") {
      target = itemTop;
    } else if (align === "center") {
      target = itemTop - (vh - itemH) / 2;
    } else {
      target = itemBottom - vh;
    }
    container.scrollTop = Math.max(0, target);
  }

  function dispose(): void {
    if (rafId) cancelAnimationFrame(rafId);
    if (container) {
      container.removeEventListener("scroll", onScroll);
    }
    viewportObserver?.disconnect();
    itemObserver?.disconnect();
  }

  return {
    scrollTop,
    viewportHeight,
    layout,
    contentHeight,
    visibleRange,
    heightCache,
    elementKeys,
    measureElement,
    unmeasureElement,
    attach,
    scrollToIndex,
    dispose,
  };
}
