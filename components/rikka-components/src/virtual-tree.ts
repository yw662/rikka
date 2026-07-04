import {
  signal,
  computed,
  effect,
  type Signal,
} from "@takanashi/rikka-signal";
import { h, registerDisposable } from "@takanashi/rikka-dom";
import {
  VirtualScroller,
  type VirtualScrollerHandle,
  type ReadableSignal,
} from "./virtual-scroll.js";

const DATA_VTREE = "data-r-vtree";
const DATA_VTREE_CONTENT = "data-r-vtree-content";
const DATA_VTREE_NODE = "data-r-vtree-node";
const DATA_VTREE_TOGGLE = "data-r-vtree-toggle";
const DATA_VTREE_LABEL = "data-r-vtree-label";
const DATA_VTREE_PLACEHOLDER = "data-r-vtree-placeholder";

/** Prefix for synthetic placeholder keys (unloaded children slots). */
const PLACEHOLDER_PREFIX = "__ph__";

export interface VirtualTreeOptions<Key extends string | number> {
  /** Reactive root keys. */
  roots: ReadableSignal<Key[]>;
  /**
   * Get children keys for a node. Returns `undefined` if children are not
   * yet loaded. The caller is responsible for loading children (triggered
   * by reading `requestedKeys` from the handle).
   *
   * This function should read from reactive state (signals) so the tree
   * re-flattens when children arrive.
   */
  getChildren: (key: Key) => Key[] | undefined;
  /** Total child count for a node. Used to reserve height for unloaded children. */
  getChildCount: (key: Key) => number;
  /** Whether a node is a leaf (no children, no toggle). */
  isLeaf: (key: Key) => boolean;
  /**
   * Item component: receives a key, returns an Element.
   * Like other h-function components. The component can read node data
   * from the caller's store using the key, and use reactive bindings
   * for dynamic content.
   */
  Item: (key: Key) => Element;
  /** Fixed node height in pixels. Enables fast fixed-height mode. */
  itemHeight?: number;
  /** Estimated node height for variable-height mode. Default 32. */
  estimatedItemHeight?: number;
  /** Extra nodes to render above/below the viewport. Default 3. */
  overscan?: number;
  /** Indentation per depth level in pixels. Default 20. */
  indent?: number;
  /** Height of the tree. Number = px, string = any CSS length. Default "100%". */
  height?: number | string;
  /** Additional class for the tree root element. */
  className?: string;
  /** Keys that are expanded by default (uncontrolled mode). */
  defaultExpandedKeys?: Key[];
  /**
   * Controlled expand state. When provided, the tree uses this signal as
   * the source of truth and updates it on toggle. When omitted, the tree
   * maintains its own internal expand state.
   */
  expandedKeys?: Signal.State<Set<Key>>;
  /** Custom toggle indicator renderer. Defaults to a rotating triangle. */
  renderToggle?: (ctx: {
    key: Key;
    isExpanded: boolean;
    isLeaf: boolean;
  }) => HTMLElement;
  /** Custom placeholder renderer for unloaded child slots. */
  renderPlaceholder?: (parentKey: Key, index: number) => HTMLElement;
  /** Called when a node is expanded. */
  onExpand?: (key: Key) => void;
  /** Called when a node is collapsed. */
  onCollapse?: (key: Key) => void;
  /** Called when a node row is clicked (not on the toggle). */
  onNodeClick?: (key: Key, event: MouseEvent) => void;
}

export interface VirtualTreeHandle<Key extends string | number>
  extends HTMLElement {
  /** Expand state signal (controlled or internal). */
  expandedKeys: Signal.State<Set<Key>>;
  /**
   * Pure computed: the set of keys the caller needs to provide data for.
   * Includes visible real node keys and visible expanded parent keys whose
   * children are not yet loaded. Depends on viewport and tree structure.
   * No side effects — the caller reads this to know what to load.
   */
  requestedKeys: Signal.Computed<Set<Key>>;
  /** Expand a node by key. */
  expand(key: Key): void;
  /** Collapse a node by key. */
  collapse(key: Key): void;
  /** Toggle a node by key. */
  toggle(key: Key): void;
  /** Whether a node is currently expanded. */
  isExpanded(key: Key): boolean;
  /** Scroll a node with the given key into view. */
  scrollToNode(key: Key, align?: "start" | "center" | "end"): void;
  /** Dispose all internal effects and free resources. */
  dispose(): void;
}

/** Internal flattened representation of a visible tree entry. */
interface FlatEntry<Key> {
  /** Reconciler/height-cache key. Real key or synthetic placeholder key. */
  key: string | number;
  /** The actual Key for real nodes, null for placeholders. */
  realKey: Key | null;
  depth: number;
  parentKey: Key | null;
  isPlaceholder: boolean;
  /** For placeholders: index within parent's children. */
  placeholderIndex: number;
}

/**
 * Creates a virtual-scrolling tree component with a key-based interface.
 *
 * Built on top of `VirtualScroller`. The tree flattens its structure into a
 * visible list (`flatList`), then delegates scrolling/positioning/caching to
 * `VirtualScroller`. Tree-specific concerns (expand state, placeholders,
 * toggle indicators, indentation) live in the tree's `renderItem`.
 *
 * The tree only works with primitive keys (`string | number`) — it never
 * inspects node data. The caller provides:
 * - `roots`: reactive root keys
 * - `getChildren` / `getChildCount` / `isLeaf`: structural readers (should
 *   read from reactive state so the tree re-flattens on data changes)
 * - `Item`: a component that receives a key and returns an Element
 *
 * Data loading is external: the caller reads `requestedKeys` (a pure
 * computed) to know which keys need data, then updates their store. No
 * internal cache, no loading effects.
 *
 * @example
 * ```ts
 * const children = signal(new Map<string, string[]>());
 * const tree = virtualTree<string>({
 *   roots: signal(["root"]),
 *   getChildren: (key) => children.get().get(key),
 *   getChildCount: (key) => children.get().get(key)?.length ?? 0,
 *   isLeaf: (key) => key.endsWith(".ts"),
 *   Item: (key) => h("span", {}, key),
 *   itemHeight: 28,
 * });
 * ```
 */
export function virtualTree<Key extends string | number>(
  options: VirtualTreeOptions<Key>,
): VirtualTreeHandle<Key> {
  const {
    roots,
    getChildren,
    getChildCount,
    isLeaf,
    Item,
    itemHeight,
    estimatedItemHeight = 32,
    overscan = 3,
    indent = 20,
    height = "100%",
    className,
    defaultExpandedKeys,
    expandedKeys: controlledExpanded,
    renderToggle,
    renderPlaceholder,
    onExpand,
    onCollapse,
    onNodeClick,
  } = options;

  // --- Expand state ---
  const internalExpanded = signal(new Set<Key>(defaultExpandedKeys ?? []));
  const expandedKeys = controlledExpanded ?? internalExpanded;

  // --- Flatten the tree into a visible list ---
  // Depends on: roots, expandedKeys, and whatever signals the caller's
  // getChildren/getChildCount/isLeaf read from.
  const flatList = computed<FlatEntry<Key>[]>(() => {
    const rootKeys = roots.get();
    const expanded = expandedKeys.get();
    const result: FlatEntry<Key>[] = [];

    const walk = (keys: Key[], depth: number, parentKey: Key | null) => {
      for (const key of keys) {
        result.push({
          key,
          realKey: key,
          depth,
          parentKey,
          isPlaceholder: false,
          placeholderIndex: -1,
        });

        if (isLeaf(key)) continue;
        if (!expanded.has(key)) continue;

        const children = getChildren(key);
        if (children !== undefined) {
          walk(children, depth + 1, key);
        } else {
          // Children not loaded: reserve space with placeholder entries
          const count = getChildCount(key);
          for (let i = 0; i < count; i++) {
            result.push({
              key: `${PLACEHOLDER_PREFIX}${key}__${i}`,
              realKey: null,
              depth: depth + 1,
              parentKey: key,
              isPlaceholder: true,
              placeholderIndex: i,
            });
          }
        }
      }
    };
    walk(rootKeys, 0, null);
    return result;
  });

  // --- Map from real key -> flat index (for scrollToNode) ---
  const keyToIndex = computed<Map<Key, number>>(() => {
    const flat = flatList.get();
    const map = new Map<Key, number>();
    for (let i = 0; i < flat.length; i++) {
      if (flat[i].realKey !== null) {
        map.set(flat[i].realKey as Key, i);
      }
    }
    return map;
  });

  // --- Per-node toggle effect disposers, keyed by flat entry key ---
  const nodeDisposers = new Map<string | number, () => void>();

  // --- Toggle logic ---
  function toggleNode(key: Key): void {
    if (isLeaf(key)) return;
    const current = expandedKeys.get();
    const next = new Set(current);
    const willExpand = !next.has(key);
    if (willExpand) {
      next.add(key);
    } else {
      next.delete(key);
    }
    expandedKeys.set(next);
    if (willExpand) {
      onExpand?.(key);
    } else {
      onCollapse?.(key);
    }
  }

  // --- Create a node row element (VirtualScroller's renderItem) ---
  function createNodeRow(entry: FlatEntry<Key>): HTMLElement {
    // --- Placeholder row (unloaded child slot) ---
    if (entry.isPlaceholder) {
      const row = h("div", {
        style: {
          display: "flex",
          alignItems: "center",
          width: "100%",
        },
      });
      row.setAttribute(DATA_VTREE_PLACEHOLDER, "");
      row.dataset.depth = String(entry.depth);
      if (entry.depth > 0) {
        row.appendChild(
          h("span", {
            style: { flexShrink: "0", width: `${entry.depth * indent}px` },
          }),
        );
      }
      if (renderPlaceholder && entry.parentKey !== null) {
        row.appendChild(
          renderPlaceholder(entry.parentKey, entry.placeholderIndex),
        );
      }
      return row;
    }

    // --- Real node row ---
    const nodeKey = entry.realKey as Key;
    // Reactive: re-evaluates when caller's isLeaf reads change. Acts as an
    // equality barrier so the toggle effect only re-runs when this node
    // flips between leaf/non-leaf (or expanded state changes).
    const hasChildren = computed(() => !isLeaf(nodeKey));
    const isExpanded = computed(() => expandedKeys.get().has(nodeKey));

    const row = h("div", {
      style: {
        display: "flex",
        alignItems: "center",
        width: "100%",
      },
    });
    row.setAttribute(DATA_VTREE_NODE, "");
    row.dataset.key = String(nodeKey);
    row.dataset.depth = String(entry.depth);

    // Indent
    if (entry.depth > 0) {
      row.appendChild(
        h("span", {
          style: { flexShrink: "0", width: `${entry.depth * indent}px` },
        }),
      );
    }

    // Toggle — created once, then updated reactively below.
    function buildToggleEl(): HTMLElement {
      const ctx = {
        key: nodeKey,
        isExpanded: isExpanded.get(),
        isLeaf: !hasChildren.get(),
      };
      const el = (
        renderToggle ? renderToggle(ctx) : defaultRenderToggle(ctx)
      ) as HTMLElement;
      el.setAttribute(DATA_VTREE_TOGGLE, "");
      el.style.flexShrink = "0";
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleNode(nodeKey);
      });
      return el;
    }

    let toggleEl = buildToggleEl();
    row.appendChild(toggleEl);

    // Reactive toggle state update (fine-grained: re-runs only when this node flips).
    const toggleDispose = effect(() => {
      const isExp = isExpanded.get();
      const hasKids = hasChildren.get();
      if (renderToggle) {
        const next = buildToggleEl();
        next.dataset.expanded = isExp ? "true" : "false";
        next.style.visibility = hasKids ? "visible" : "hidden";
        row.replaceChild(next, toggleEl);
        toggleEl = next;
      } else {
        toggleEl.dataset.expanded = isExp ? "true" : "false";
        toggleEl.style.visibility = hasKids ? "visible" : "hidden";
        updateDefaultToggle(toggleEl, isExp, hasKids);
      }
    });
    nodeDisposers.set(entry.key, toggleDispose);

    // Label / content (Item component, called once; use reactive
    // bindings inside Item for dynamic content).
    const labelEl = h("div", {
      style: { flex: "1", minWidth: "0", overflow: "hidden" },
    });
    labelEl.setAttribute(DATA_VTREE_LABEL, "");
    labelEl.appendChild(Item(nodeKey));
    row.appendChild(labelEl);

    // Click on row (not toggle)
    if (onNodeClick) {
      row.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        if (target.closest(`[${DATA_VTREE_TOGGLE}]`)) return;
        onNodeClick(nodeKey, e);
      });
    }

    return row;
  }

  // --- Build via VirtualScroller ---
  const handle = VirtualScroller<FlatEntry<Key>, string | number>(
    flatList,
    createNodeRow,
    {
      itemHeight,
      estimatedItemHeight,
      overscan,
      height,
      className,
      keyFn: (entry) => entry.key,
      onEvict: (key) => {
        const d = nodeDisposers.get(key);
        if (d) {
          d();
          nodeDisposers.delete(key);
        }
      },
      // Custom structure: scroll container with tree attribute.
      structure: ({ topSpacer, content, bottomSpacer }) => {
        const el = h("div", {
          className,
          style: {
            overflow: "auto",
            position: "relative",
            height: typeof height === "number" ? `${height}px` : height,
          },
        }) as HTMLElement;
        el.setAttribute(DATA_VTREE, "");
        el.appendChild(topSpacer);
        el.appendChild(content);
        el.appendChild(bottomSpacer);
        return el;
      },
      // Custom content: div with tree content attribute.
      content: () => {
        const el = h("div", {
          style: { position: "relative", width: "100%" },
        }) as HTMLElement;
        el.setAttribute(DATA_VTREE_CONTENT, "");
        return el;
      },
    },
  );

  // --- requestedKeys: pure computed (visible real keys + unloaded parents) ---
  // Reads flatList + the scroller's visibleRange (reactive). No side effects.
  const requestedKeys = computed<Set<Key>>(() => {
    const flat = flatList.get();
    const { start, end } = handle.visibleRange.get();
    const keys = new Set<Key>();
    const unloadedParents = new Set<Key>();
    for (let i = start; i < end; i++) {
      const entry = flat[i];
      if (!entry) continue;
      if (entry.isPlaceholder) {
        if (entry.parentKey !== null) unloadedParents.add(entry.parentKey);
      } else if (entry.realKey !== null) {
        keys.add(entry.realKey);
      }
    }
    for (const k of unloadedParents) keys.add(k);
    return keys;
  });

  // --- Public API ---
  const root = handle as unknown as VirtualTreeHandle<Key>;
  root.expandedKeys = expandedKeys;
  root.requestedKeys = requestedKeys;
  root.scrollToNode = (key, align) => {
    const idx = keyToIndex.get().get(key);
    if (idx == null) return;
    handle.scrollToIndex(idx, align);
  };
  root.expand = (key) => {
    if (isLeaf(key)) return;
    const current = expandedKeys.get();
    if (current.has(key)) return;
    const next = new Set(current);
    next.add(key);
    expandedKeys.set(next);
    onExpand?.(key);
  };
  root.collapse = (key) => {
    const current = expandedKeys.get();
    if (!current.has(key)) return;
    const next = new Set(current);
    next.delete(key);
    expandedKeys.set(next);
    onCollapse?.(key);
  };
  root.toggle = (key) => toggleNode(key);
  root.isExpanded = (key) => expandedKeys.get().has(key);

  // --- Cleanup wrapper (dispose node effects + scroller) ---
  const origDispose = handle.dispose.bind(handle);
  let disposed = false;
  root.dispose = () => {
    if (disposed) return;
    disposed = true;
    for (const d of nodeDisposers.values()) {
      try {
        d();
      } catch {
        // ignore
      }
    }
    nodeDisposers.clear();
    origDispose();
  };
  registerDisposable(root, () => root.dispose());

  return root;
}

// --- Helpers ---

/** Default toggle indicator: a small triangle that rotates when expanded. */
function defaultRenderToggle(ctx: { isExpanded: boolean }): Element {
  const el = h("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "16px",
      height: "16px",
      cursor: "pointer",
      transition: "transform 0.15s ease",
      transform: ctx.isExpanded ? "rotate(90deg)" : "rotate(0deg)",
      fontSize: "10px",
      lineHeight: "1",
      userSelect: "none",
    },
  });
  el.textContent = "\u25B6"; // ▶
  return el;
}

function updateDefaultToggle(
  el: HTMLElement,
  isExpanded: boolean,
  hasChildren: boolean,
): void {
  el.textContent = hasChildren ? "\u25B6" : "";
  el.style.transform = isExpanded ? "rotate(90deg)" : "rotate(0deg)";
}
