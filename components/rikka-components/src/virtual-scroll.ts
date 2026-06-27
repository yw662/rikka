import { computed, effect } from "@takanashi/rikka-signal";
import { h, registerDisposable } from "@takanashi/rikka-dom";
import {
  createVirtualScrollCore,
  readBool,
  type ReadableSignal,
  type VirtualScrollCore,
} from "./virtual-scroll-core.js";
import { createReconciler } from "./reconcile.js";

export type { ReadableSignal } from "./virtual-scroll-core.js";

const DATA_VSCROLL = "data-r-vscroll";
const DATA_VSCROLL_CONTENT = "data-r-vscroll-content";
const DATA_VSCROLL_ITEM = "data-r-vscroll-item";
const DATA_VSCROLL_LOADING = "data-r-vscroll-loading";

/** Max number of cached item elements. Prevents unbounded memory growth. */
const MAX_CACHE = 200;

export interface VirtualScrollOptions<T, K = unknown> {
  /**
   * Fixed item height in pixels. When provided, enables fast fixed-height
   * mode (no DOM measurement). Recommended when item height is known.
   */
  itemHeight?: number;
  /**
   * Estimated item height in pixels for variable-height mode.
   * Used as the default before real measurement. Default 40.
   */
  estimatedItemHeight?: number;
  /** Number of extra items to render above/below the viewport. Default 3. */
  overscan?: number;
  /**
   * Function to derive a stable key from each item. Defaults to the item
   * itself (reference equality). Provide a keyFn for object items.
   */
  keyFn?: (item: T, index: number) => K;
  /** Height of the scroll container. Number = px, string = any CSS length. Default "100%". */
  height?: number | string;
  /** Additional class name(s) for the scroll container. */
  className?: string;
  /** Called when the user scrolls near the bottom. Use to load more data. */
  onLoadMore?: (info: { lastIndex: number; total: number }) => void;
  /** Distance from bottom (in px) to trigger onLoadMore. Default 100. */
  loadMoreThreshold?: number;
  /** Render function for the loading indicator shown at the bottom while loading. */
  loadingIndicator?: () => Element;
  /** Whether more data is being loaded. When true, shows loadingIndicator. */
  isLoading?: ReadableSignal<boolean> | boolean;
  /** Whether more data can be loaded. When false, onLoadMore won't be called. Default true. */
  hasMore?: ReadableSignal<boolean> | boolean;
}

export interface VirtualScrollHandle extends HTMLElement {
  /** Scroll to a specific item index. */
  scrollToIndex(index: number, align?: "start" | "center" | "end"): void;
  /**
   * Dispose all internal effects, listeners, and observers. Call this when
   * the element is removed from the DOM to prevent effect leaks (especially
   * in test environments where GC may not run promptly).
   */
  dispose(): void;
}

/**
 * Creates a virtual scroll container that only renders visible items.
 *
 * Supports two modes:
 * - **Fixed-height mode** (when `itemHeight` is set): fast, no DOM measurement.
 * - **Variable-height mode** (default): measures rendered items via ResizeObserver
 *   and caches their heights for subsequent layout calculations.
 *
 * The container uses `data-r-vscroll` attribute. Items use `data-r-vscroll-item`.
 * Style them with regular CSS — no Shadow DOM is used.
 *
 * @example
 * ```ts
 * const items = signal(Array.from({ length: 1000 }, (_, i) => i));
 * const list = virtualScroll(items, (item, i) =>
 *   h("div", { style: { height: "40px", padding: "8px" } }, `Item ${item}`)
 * , { itemHeight: 40 });
 * document.body.appendChild(list);
 * ```
 */
export function virtualScroll<T, K = unknown>(
  source: ReadableSignal<T[]>,
  renderItem: (item: T, index: number) => Element,
  options: VirtualScrollOptions<T, K> = {},
): VirtualScrollHandle {
  const {
    itemHeight,
    estimatedItemHeight = 40,
    overscan = 3,
    keyFn,
    height = "100%",
    className,
    onLoadMore,
    loadMoreThreshold = 100,
    loadingIndicator,
    isLoading,
    hasMore,
  } = options;

  const core: VirtualScrollCore<T, K> = createVirtualScrollCore({
    source,
    itemHeight,
    estimatedItemHeight,
    overscan,
    keyFn,
    onLoadMore,
    loadMoreThreshold,
    isLoading,
    hasMore,
    hasLoadingIndicator: !!loadingIndicator,
  });

  // --- Build DOM ---
  const container = h("div", {
    className,
    style: {
      overflow: "auto",
      position: "relative",
      height: typeof height === "number" ? `${height}px` : height,
    },
  }) as unknown as VirtualScrollHandle;
  container.setAttribute(DATA_VSCROLL, "");

  const content = h("div", {
    style: {
      position: "relative",
      width: "100%",
    },
  });
  content.setAttribute(DATA_VSCROLL_CONTENT, "");
  container.appendChild(content);

  core.attach(container);

  // --- Loading indicator ---
  let loadingEl: HTMLElement | null = null;
  const disposers: Array<() => void> = [];
  if (loadingIndicator) {
    loadingEl = loadingIndicator() as HTMLElement;
    loadingEl.setAttribute(DATA_VSCROLL_LOADING, "");
    loadingEl.style.width = "100%";
    content.appendChild(loadingEl);

    const loadingDispose = effect(() => {
      if (!loadingEl) return;
      loadingEl.style.display = readBool(isLoading, false) ? "" : "none";
    });
    disposers.push(loadingDispose);
  }

  // --- Element cache + reconciler (shared) ---
  // onEvict is the explicit cleanup path: unmeasure the element when it
  // leaves the cache. FinalizationRegistry (via registerDisposable below)
  // remains as a safety net.
  const reconciler = createReconciler<K>({
    parent: content,
    keepLast: loadingEl,
    maxCache: MAX_CACHE,
    onEvict: (_key, el) => core.unmeasureElement(el),
  });

  // O(1) source-key lookup for cache cleanup (replaces O(n·m) scan).
  // Recomputes only when the source array changes.
  const sourceKeySet = computed<Set<K>>(() => {
    const items = source.get();
    const set = new Set<K>();
    for (let i = 0; i < items.length; i++) {
      set.add(keyFn ? keyFn(items[i], i) : (items[i] as unknown as K));
    }
    return set;
  });

  // --- Render effect: reconcile visible items ---
  const renderDispose = effect(() => {
    const items = source.get();
    const { start, end } = core.visibleRange.get();
    const { offsets, total } = core.layout.get();
    const keys = sourceKeySet.get();

    const visible: Array<{ key: K; element: HTMLElement }> = [];

    for (let i = start; i < end; i++) {
      const item = items[i];
      const key = keyFn ? keyFn(item, i) : (item as unknown as K);

      let el = reconciler.get(key);
      if (!el) {
        el = renderItem(item, i) as HTMLElement;
        el.setAttribute(DATA_VSCROLL_ITEM, "");
        reconciler.set(key, el);
        core.measureElement(el, key);
      }
      visible.push({ key, element: el });
    }

    // Reconciler handles: source cleanup (O(1) via predicate), maxCache
    // eviction, and DOM reorder (keeping loadingEl at end).
    reconciler.reconcile(visible, (key) => keys.has(key));

    // Insert top/bottom spacers for scroll height (normal flow, no absolute).
    // Reconciler already removed old spacers (not in visible set).
    const visibleEls = visible.map((v) => v.element);
    if (start > 0 && visibleEls.length > 0) {
      const topSpacer = h("div", { style: { height: `${offsets[start]}px` } });
      content.insertBefore(topSpacer, visibleEls[0]);
    }
    if (end < items.length) {
      const bottomSpacer = h("div", {
        style: { height: `${total - offsets[end]}px` },
      });
      if (loadingEl) {
        content.insertBefore(bottomSpacer, loadingEl);
      } else {
        content.appendChild(bottomSpacer);
      }
    }
  });

  // --- scrollToIndex ---
  container.scrollToIndex = (index, align) =>
    core.scrollToIndex(index, align);

  // --- Cleanup ---
  // Explicit dispose (primary path) + registerDisposable (GC safety net).
  let disposed = false;
  container.dispose = () => {
    if (disposed) return;
    disposed = true;
    for (const d of disposers) {
      try {
        d();
      } catch {
        // ignore disposal errors
      }
    }
    disposers.length = 0;
    renderDispose();
    reconciler.dispose();
    core.dispose();
  };
  registerDisposable(container, () => container.dispose());

  return container;
}
