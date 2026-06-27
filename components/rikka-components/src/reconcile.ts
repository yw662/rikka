/**
 * Shared element cache + DOM reconciliation logic for virtual scroll components.
 *
 * Used by `virtualScroll`, `virtualTable`, and `virtualTree` to:
 * - Cache rendered elements by key (with max-size eviction)
 * - Clean up elements no longer in the source or viewport
 * - Reorder DOM children to match the visible order
 * - Dispose per-key resources (e.g. effects, ResizeObserver entries) when
 *   elements are evicted
 *
 * This module is DOM-aware (unlike `virtual-scroll-core.ts` which is pure
 * computation). The pure/side-effect separation of the core is preserved.
 *
 * The `onEvict` callback is the primary explicit-cleanup path: whenever an
 * element leaves the cache (due to source cleanup, max-cache eviction,
 * `disposeKey`, or `dispose`), `onEvict` fires so the caller can release
 * per-key resources. `FinalizationRegistry`-based disposal (registered by the
 * caller separately) remains as a safety net.
 */

export interface ReconcilerOptions<K> {
  /** Parent element whose children are reconciled. */
  parent: HTMLElement;
  /**
   * Element to keep at the end of the parent during reorder (e.g. a loading
   * indicator). It is never removed even if absent from the visible set.
   */
  keepLast?: HTMLElement | null;
  /** Max cached elements. Non-visible elements are evicted when exceeded. */
  maxCache: number;
  /**
   * Called when an element is evicted from the cache (due to source cleanup,
   * max-cache eviction, `disposeKey`, or `dispose`). Use to free per-key
   * resources such as `core.unmeasureElement(el)` or effect disposers.
   */
  onEvict?: (key: K, el: HTMLElement) => void;
}

export interface ReconcileOptions {
  /**
   * Cleanup strategy:
   * - `"source"` (default): evict keys not in the source (as reported by
   *   `hasSourceKey`). Off-screen cached elements are kept until `maxCache`
   *   is exceeded, enabling DOM reuse when scrolling back.
   * - `"visible"`: evict keys not in the visible set. Aggressively removes
   *   all off-screen elements. Used by table mode where rows are not reused
   *   across renders (rows live in normal flow with spacer elements).
   */
  cleanupStrategy?: "source" | "visible";
  /**
   * If `true` (default), reorder DOM children to match the visible order,
   * removing children not in the visible set (except `keepLast`).
   * If `false`, the caller handles DOM manipulation (e.g. table mode with
   * spacer rows that clear-and-append).
   */
  reorder?: boolean;
}

export interface Reconciler<K> {
  /** Get a cached element by key, or `undefined`. */
  get(key: K): HTMLElement | undefined;
  /** Cache an element under a key. */
  set(key: K, el: HTMLElement): void;
  /** Whether a key is currently in the cache. */
  has(key: K): boolean;
  /**
   * Reconcile the cache and (optionally) the DOM with the visible items.
   *
   * 1. Evicts cached elements per the cleanup strategy.
   * 2. Enforces `maxCache` by evicting non-visible elements.
   * 3. If `reorder` is `true`, reorders DOM children to match `visible`,
   *    removing children not in the visible set (except `keepLast`).
   *
   * @param visible - Visible items in render order.
   * @param hasSourceKey - O(1) predicate: is this key still in the source?
   *   Used only when `cleanupStrategy` is `"source"`.
   * @param options - Reconcile options.
   */
  reconcile(
    visible: Array<{ key: K; element: HTMLElement }>,
    hasSourceKey: (key: K) => boolean,
    options?: ReconcileOptions,
  ): void;
  /** Evict a single key from the cache (calls `onEvict`). No-op if not cached. */
  disposeKey(key: K): void;
  /** Clear all cached elements (calls `onEvict` for each). */
  dispose(): void;
  /** Current cache size. */
  readonly size: number;
}

/**
 * Create a shared element cache + DOM reconciler.
 *
 * @example
 * ```ts
 * const reconciler = createReconciler<string>({
 *   parent: contentEl,
 *   keepLast: loadingEl,
 *   maxCache: 200,
 *   onEvict: (_key, el) => core.unmeasureElement(el),
 * });
 *
 * // In render effect:
 * const visible = items.map((item, i) => ({
 *   key: keyFn(item, i),
 *   element: getOrCreate(item, i),
 * }));
 * reconciler.reconcile(visible, (key) => sourceKeySet.has(key));
 * ```
 */
export function createReconciler<K>(
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

  /**
   * Evict cached elements per strategy, then enforce maxCache.
   * Collects keys first to avoid mutating the map during iteration.
   */
  function cleanup(
    visibleKeys: Set<K>,
    hasSourceKey: (key: K) => boolean,
    strategy: "source" | "visible",
  ): void {
    // 1. Strategy-based cleanup
    const toEvict: K[] = [];
    for (const [key] of cache) {
      if (visibleKeys.has(key)) continue;
      if (strategy === "visible" || !hasSourceKey(key)) {
        toEvict.push(key);
      }
    }
    for (const key of toEvict) evictKey(key);

    // 2. Enforce maxCache: evict non-visible elements
    if (cache.size > maxCache) {
      const overflow: K[] = [];
      for (const [key] of cache) {
        if (!visibleKeys.has(key)) overflow.push(key);
      }
      for (const key of overflow) evictKey(key);
    }
  }

  /**
   * Reorder DOM children to match `newChildren`, keeping `keepLast` at the end.
   * Removes children not in the new set (except `keepLast`).
   */
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

    // Insert/move in order (backwards, before keepLast)
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
    has: (key: K) => cache.has(key),
    reconcile,
    disposeKey: evictKey,
    dispose,
    get size() {
      return cache.size;
    },
  };
}
