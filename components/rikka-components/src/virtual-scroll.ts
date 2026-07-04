import { computed, effect, signal, type Signal } from "@takanashi/rikka-signal";
import { h, registerDisposable, disposeElement } from "@takanashi/rikka-dom";

// === Shared public types ===
export type ReadableSignal<T> = Signal.State<T> | Signal.Computed<T>;

// === Internal constants ===
const DATA_VSCROLL = "data-r-vscroll";
const DATA_VSCROLL_CONTENT = "data-r-vscroll-content";
const DATA_VSCROLL_ITEM = "data-r-vscroll-item";
const DATA_VSCROLL_LOADING = "data-r-vscroll-loading";

/** Max number of cached item elements. Prevents unbounded memory growth. */
const MAX_CACHE = 200;

// === Internal helpers ===
function readBool(
  value: ReadableSignal<boolean> | boolean | undefined,
  defaultValue: boolean,
): boolean {
  if (value == null) return defaultValue;
  if (typeof value === "boolean") return value;
  return value.get();
}

// === Virtual scroll core (pure computation, internal) ===
interface VirtualScrollCoreOptions<T, K = unknown> {
  source: ReadableSignal<T[]>;
  itemHeight?: number;
  estimatedItemHeight?: number;
  overscan?: number;
  keyFn?: (item: T, index: number) => K;
  onLoadMore?: (info: { lastIndex: number; total: number }) => void;
  loadMoreThreshold?: number;
  isLoading?: ReadableSignal<boolean> | boolean;
  hasMore?: ReadableSignal<boolean> | boolean;
}

interface VirtualScrollCore<T, K = unknown> {
  scrollTop: Signal.State<number>;
  viewportHeight: Signal.State<number>;
  layout: Signal.Computed<{
    offsets: number[];
    count: number;
    total: number;
  }>;
  visibleRange: Signal.Computed<{ start: number; end: number }>;
  heightCache: Map<K, number>;
  elementKeys: WeakMap<HTMLElement, K>;
  measureElement: (el: HTMLElement, key: K) => void;
  unmeasureElement: (el: HTMLElement) => void;
  attach: (container: HTMLElement) => void;
  scrollToIndex: (
    index: number,
    align?: "start" | "center" | "end",
  ) => void;
  dispose: () => void;
}

/**
 * Core virtual scroll logic: state, layout computation, visible range,
 * height measurement, scroll handling, and lazy loading. Pure computation —
 * the caller owns DOM creation and rendering.
 */
function createVirtualScrollCore<T, K = unknown>(
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

// === Reconciler (element cache + DOM reorder, internal) ===
interface ReconcilerOptions<K> {
  parent: HTMLElement;
  keepLast?: HTMLElement | null;
  maxCache: number;
  onEvict?: (key: K, el: HTMLElement) => void;
}

interface ReconcileOptions {
  cleanupStrategy?: "source" | "visible";
  reorder?: boolean;
}

interface Reconciler<K> {
  get(key: K): HTMLElement | undefined;
  set(key: K, el: HTMLElement): void;
  reconcile(
    visible: Array<{ key: K; element: HTMLElement }>,
    hasSourceKey: (key: K) => boolean,
    options?: ReconcileOptions,
  ): void;
  dispose(): void;
}

/**
 * Shared element cache + DOM reconciler. Caches rendered elements by key,
 * cleans up evicted entries, and reorders DOM children to match the visible
 * order. `onEvict` is the primary explicit-cleanup path for per-key resources.
 */
function createReconciler<K>(
  options: ReconcilerOptions<K>,
): Reconciler<K> {
  const { parent, keepLast = null, maxCache, onEvict } = options;
  const cache = new Map<K, HTMLElement>();

  function evictKey(key: K): void {
    const el = cache.get(key);
    if (el === undefined) return;
    cache.delete(key);
    onEvict?.(key, el);
  }

  function cleanup(
    visibleKeys: Set<K>,
    hasSourceKey: (key: K) => boolean,
    strategy: "source" | "visible",
  ): void {
    const toEvict: K[] = [];
    for (const [key] of cache) {
      if (visibleKeys.has(key)) continue;
      if (strategy === "visible" || !hasSourceKey(key)) {
        toEvict.push(key);
      }
    }
    for (const key of toEvict) evictKey(key);

    if (cache.size > maxCache) {
      const overflow: K[] = [];
      for (const [key] of cache) {
        if (!visibleKeys.has(key)) overflow.push(key);
      }
      for (const key of overflow) evictKey(key);
    }
  }

  function reorderDOM(newChildren: HTMLElement[]): void {
    const newSet = new Set(newChildren);

    const toRemove: Node[] = [];
    let child = parent.firstChild;
    while (child) {
      const next = child.nextSibling;
      if (child !== keepLast && !newSet.has(child as HTMLElement)) {
        toRemove.push(child);
      }
      child = next;
    }
    for (const c of toRemove) parent.removeChild(c);

    let ref: Node | null = keepLast;
    for (let i = newChildren.length - 1; i >= 0; i--) {
      const el = newChildren[i];
      if (el.nextSibling !== ref || el.parentNode !== parent) {
        parent.insertBefore(el, ref);
      }
      ref = el;
    }
  }

  function reconcile(
    visible: Array<{ key: K; element: HTMLElement }>,
    hasSourceKey: (key: K) => boolean,
    options?: ReconcileOptions,
  ): void {
    const { cleanupStrategy = "source", reorder = true } = options ?? {};
    const visibleKeys = new Set<K>();
    const visibleElements: HTMLElement[] = [];
    for (const { key, element } of visible) {
      visibleKeys.add(key);
      visibleElements.push(element);
    }
    cleanup(visibleKeys, hasSourceKey, cleanupStrategy);
    if (reorder) {
      reorderDOM(visibleElements);
    }
  }

  function dispose(): void {
    const keys = [...cache.keys()];
    for (const key of keys) {
      evictKey(key);
    }
    cache.clear();
  }

  return {
    get: (key: K) => cache.get(key),
    set: (key: K, el: HTMLElement) => {
      cache.set(key, el);
    },
    reconcile,
    dispose,
  };
}

// === Public VirtualScroller API ===

/**
 * Parts passed to the `structure` component for assembly.
 *
 * The structure component receives the spacer + content elements and is
 * responsible for placing them in the desired DOM hierarchy (the returned
 * element becomes the scroll container that `core.attach` is called on).
 */
export interface VirtualScrollerParts {
  /** Top spacer element (reactive height already bound). */
  topSpacer: HTMLElement;
  /** Content element — the reconciler's parent. Items + loading live here. */
  content: HTMLElement;
  /** Bottom spacer element (reactive height already bound). */
  bottomSpacer: HTMLElement;
}

export interface VirtualScrollerOptions<T, K = unknown> {
  // --- Structure components (caller-provided, full flexibility) ---
  /**
   * Structure component: receives the spacer + content elements and returns
   * the scroll container element (the one `core.attach` is called on, must
   * have `overflow: auto`).
   *
   * Default: a `<div>` with `overflow:auto` containing
   * `[topSpacer, content, bottomSpacer]`.
   *
   * For a table: a `<div>` containing a `<table>` with
   * `[colgroup, thead, topSpacer(tbody), content(tbody), bottomSpacer(tbody)]`.
   */
  structure?: (parts: VirtualScrollerParts) => HTMLElement;
  /**
   * Content component: returns the element that the reconciler manages
   * (items + loading are appended here). Default: `<div>`.
   * For tables: `<tbody>`. For lists: `<ul>`.
   */
  content?: () => HTMLElement;
  /**
   * Top spacer component: receives a reactive height (px string) and returns
   * a spacer element. Default: `<div>` with `style.height = height`.
   * For tables: `<tbody><tr><td colSpan=N style.height=height></td></tr></tbody>`.
   */
  topSpacer?: (height: ReadableSignal<string>) => HTMLElement;
  /** Bottom spacer component. Same signature as `topSpacer`. */
  bottomSpacer?: (height: ReadableSignal<string>) => HTMLElement;
  /** Loading indicator element. If provided, appended to content (keepLast). */
  loading?: () => HTMLElement;

  // --- Render hooks ---
  /** Attribute set on each new item element. Default: none. */
  itemAttribute?: string;
  /** Derive a stable key from each item. Defaults to the item itself. */
  keyFn?: (item: T, index: number) => K;
  /**
   * Called for each visible item (new or cached). Use to apply per-item
   * state (e.g. selection) or update cached elements (e.g. h-scroll cells).
   */
  onItem?: (
    item: T,
    index: number,
    key: K,
    element: HTMLElement,
    isNew: boolean,
  ) => void;
  /** Called after reconcile. Use for post-render updates (e.g. header). */
  onReconcile?: () => void;
  /** Called when an element is evicted from the cache (after unmeasure). */
  onEvict?: (key: K, element: HTMLElement) => void;

  // --- Scroll parameters ---
  /** Fixed item height in pixels. Enables fast fixed-height mode. */
  itemHeight?: number;
  /** Estimated item height for variable-height mode. Default 40. */
  estimatedItemHeight?: number;
  /** Extra items to render above/below the viewport. Default 3. */
  overscan?: number;
  /** Height of the scroll container. Number = px, string = any CSS length. Default "100%". */
  height?: number | string;
  /** Additional class name(s) for the scroll container (default structure only). */
  className?: string;
  /** Called when the user scrolls near the bottom. Use to load more data. */
  onLoadMore?: (info: { lastIndex: number; total: number }) => void;
  /** Distance from bottom (in px) to trigger onLoadMore. Default 100. */
  loadMoreThreshold?: number;
  /** Whether more data is being loaded. When true, shows loading indicator. */
  isLoading?: ReadableSignal<boolean> | boolean;
  /** Whether more data can be loaded. When false, onLoadMore won't be called. Default true. */
  hasMore?: ReadableSignal<boolean> | boolean;
}

export interface VirtualScrollerHandle extends HTMLElement {
  /** Scroll to a specific item index. */
  scrollToIndex(index: number, align?: "start" | "center" | "end"): void;
  /**
   * Reactive visible range `{ start, end }`. Read this (via `.get()`) inside
   * a computed to derive viewport-dependent state (e.g. the tree's
   * `requestedKeys`).
   */
  visibleRange: ReadableSignal<{ start: number; end: number }>;
  /**
   * Dispose all internal effects, listeners, and observers. Call this when
   * the element is removed from the DOM to prevent effect leaks.
   */
  dispose(): void;
}

/**
 * VirtualScroller — a virtual-scrolling component (FC style, returns Element).
 *
 * This is the shared base for `virtualScroll`, `virtualTree`, and
 * `virtualTable`. It owns:
 * - The virtual scroll core (pure computation: layout, visible range, heights)
 * - The scroll container (assembled by the caller-provided `structure`)
 * - Top/bottom spacer elements (reactive heights, caller-provided components)
 * - The content element (reconciler parent, caller-provided component)
 * - The loading indicator (optional, caller-provided component)
 * - The element cache + reconciler
 * - The render effect (iterates visible items, creates/reuses via `renderItem`)
 *
 * The caller controls the DOM structure entirely through component functions:
 * `structure`, `content`, `topSpacer`, `bottomSpacer`. This lets the caller
 * use `<div>`, `<ul>`, `<nav>`, `<table>/<tbody>`, or any other tag.
 *
 * Positioning uses spacer elements (not padding): the top spacer occupies the
 * space above the first visible item, the bottom spacer occupies the space
 * below the last visible item. Both heights are reactive (computed signals
 * bound via rikka-dom's signal-aware styles).
 *
 * @example
 * ```ts
 * const list = VirtualScroller(
 *   signal(Array.from({ length: 1000 }, (_, i) => i)),
 *   (item) => h("div", { style: { height: "40px" } }, `Item ${item}`),
 *   { itemHeight: 40, height: 300, itemAttribute: "data-r-vscroll-item" },
 * );
 * document.body.appendChild(list);
 * ```
 */
export function VirtualScroller<T, K = unknown>(
  source: ReadableSignal<T[]>,
  renderItem: (item: T, index: number) => Element,
  options: VirtualScrollerOptions<T, K> = {},
): VirtualScrollerHandle {
  const {
    structure: makeStructure,
    content: makeContent,
    topSpacer: makeTopSpacer,
    bottomSpacer: makeBottomSpacer,
    loading: makeLoading,
    itemAttribute,
    keyFn,
    onItem,
    onReconcile,
    onEvict,
    itemHeight,
    estimatedItemHeight = 40,
    overscan = 3,
    height = "100%",
    className,
    onLoadMore,
    loadMoreThreshold = 100,
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
  });

  // --- Reactive spacer heights ---
  // Top spacer = offset of the first visible item. Bottom spacer = remaining
  // height after the last visible item. Both are computed signals bound to
  // the spacer elements via rikka-dom's signal-aware styles.
  const topHeight = computed(() => {
    const { start } = core.visibleRange.get();
    if (start === 0) return "0px";
    return `${core.layout.get().offsets[start]}px`;
  });
  const bottomHeight = computed(() => {
    const { end } = core.visibleRange.get();
    const { offsets, total, count } = core.layout.get();
    if (end >= count) return "0px";
    return `${total - offsets[end]}px`;
  });

  // --- Create parts (content + spacers + loading) ---
  const content =
    makeContent?.() ??
    h("div", { style: { position: "relative", width: "100%" } });
  content.setAttribute(DATA_VSCROLL_CONTENT, "");

  const topSpacer =
    makeTopSpacer?.(topHeight) ??
    (h("div", { style: { height: topHeight } }) as HTMLElement);
  const bottomSpacer =
    makeBottomSpacer?.(bottomHeight) ??
    (h("div", { style: { height: bottomHeight } }) as HTMLElement);

  // --- Loading indicator (appended to content, kept via reconciler keepLast) ---
  let loadingEl: HTMLElement | null = null;
  const disposers: Array<() => void> = [];
  if (makeLoading) {
    loadingEl = makeLoading();
    loadingEl.setAttribute(DATA_VSCROLL_LOADING, "");
    loadingEl.style.width = "100%";
    content.appendChild(loadingEl);

    const loadingDispose = effect(() => {
      if (!loadingEl) return;
      loadingEl.style.display = readBool(isLoading, false) ? "" : "none";
    });
    disposers.push(loadingDispose);
  }

  // --- Structure: assemble scroll container from parts ---
  const scrollContainer = makeStructure
    ? makeStructure({ topSpacer, content, bottomSpacer })
    : (() => {
        const el = h("div", {
          className,
          style: {
            overflow: "auto",
            position: "relative",
            height: typeof height === "number" ? `${height}px` : height,
          },
        }) as HTMLElement;
        el.setAttribute(DATA_VSCROLL, "");
        el.appendChild(topSpacer);
        el.appendChild(content);
        el.appendChild(bottomSpacer);
        return el;
      })();

  core.attach(scrollContainer);

  // --- Element cache + reconciler ---
  const reconciler = createReconciler<K>({
    parent: content,
    keepLast: loadingEl,
    maxCache: MAX_CACHE,
    onEvict: (key, el) => {
      core.unmeasureElement(el);
      disposeElement(el);
      onEvict?.(key, el);
    },
  });

  // O(1) source-key lookup for cache cleanup. Recomputes only when the
  // source array changes.
  const sourceKeySet = computed<Set<K>>(() => {
    const items = source.get();
    const set = new Set<K>();
    for (let i = 0; i < items.length; i++) {
      set.add(keyFn ? keyFn(items[i], i) : (items[i] as unknown as K));
    }
    return set;
  });

  // --- Render effect: reconcile visible items only ---
  const renderDispose = effect(() => {
    const items = source.get();
    const { start, end } = core.visibleRange.get();
    const keys = sourceKeySet.get();

    const visible: Array<{ key: K; element: HTMLElement }> = [];

    for (let i = start; i < end; i++) {
      const item = items[i];
      if (item === undefined) continue;
      const key = keyFn ? keyFn(item, i) : (item as unknown as K);

      const cached = reconciler.get(key);
      let el: HTMLElement;
      const isNew = !cached;
      if (isNew) {
        el = renderItem(item, i) as HTMLElement;
        if (itemAttribute) el.setAttribute(itemAttribute, "");
        reconciler.set(key, el);
        core.measureElement(el, key);
      } else {
        el = cached;
      }
      onItem?.(item, i, key, el, isNew);
      visible.push({ key, element: el });
    }

    reconciler.reconcile(visible, (key) => keys.has(key));
    onReconcile?.();
  });

  // --- scrollToIndex + visibleRange accessor ---
  const handle = scrollContainer as VirtualScrollerHandle;
  handle.scrollToIndex = (index, align) => core.scrollToIndex(index, align);
  handle.visibleRange = core.visibleRange;

  // --- Cleanup ---
  let disposed = false;
  handle.dispose = () => {
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
    disposeElement(topSpacer);
    disposeElement(bottomSpacer);
    disposeElement(content);
    core.dispose();
  };
  registerDisposable(scrollContainer, () => handle.dispose());

  return handle;
}

// --- Public API: virtualScroll (thin wrapper with default item attribute) ---

/**
 * Options for `virtualScroll`. Extends `VirtualScrollerOptions` with the
 * `loadingIndicator` alias (mapped to VirtualScroller's `loading`).
 */
export interface VirtualScrollOptions<T, K = unknown>
  extends Omit<VirtualScrollerOptions<T, K>, "loading"> {
  /** Loading indicator render function (alias for VirtualScroller's `loading`). */
  loadingIndicator?: () => HTMLElement;
}
export type VirtualScrollHandle = VirtualScrollerHandle;

/**
 * Creates a virtual scroll container that only renders visible items.
 *
 * Thin wrapper over `VirtualScroller` that sets the default
 * `data-r-vscroll-item` attribute on items.
 *
 * @example
 * ```ts
 * const items = signal(Array.from({ length: 1000 }, (_, i) => i));
 * const list = virtualScroll(items, (item) =>
 *   h("div", { style: { height: "40px" } }, `Item ${item}`)
 * , { itemHeight: 40 });
 * document.body.appendChild(list);
 * ```
 */
export function virtualScroll<T, K = unknown>(
  source: ReadableSignal<T[]>,
  renderItem: (item: T, index: number) => Element,
  options: VirtualScrollOptions<T, K> = {},
): VirtualScrollHandle {
  const { loadingIndicator, ...rest } = options;
  return VirtualScroller<T, K>(source, renderItem, {
    ...rest,
    itemAttribute: rest.itemAttribute ?? DATA_VSCROLL_ITEM,
    loading: loadingIndicator,
  });
}
