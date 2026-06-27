import {
  signal,
  computed,
  effect,
  type Signal,
} from "@takanashi/rikka-signal";
import { h, registerDisposable } from "@takanashi/rikka-dom";
import {
  createVirtualScrollCore,
  readBool,
  type ReadableSignal,
  type VirtualScrollCore,
} from "./virtual-scroll-core.js";
import { createReconciler, type Reconciler } from "./reconcile.js";

const DATA_VTABLE = "data-r-vtable";
const DATA_VTABLE_TABLE = "data-r-vtable-table";
const DATA_VTABLE_HEADER = "data-r-vtable-header";
const DATA_VTABLE_HEADER_CELL = "data-r-vtable-header-cell";
const DATA_VTABLE_SCROLL = "data-r-vtable-scroll";
const DATA_VTABLE_BODY = "data-r-vtable-body";
const DATA_VTABLE_ROW = "data-r-vtable-row";
const DATA_VTABLE_CELL = "data-r-vtable-cell";
const DATA_VTABLE_LOADING = "data-r-vtable-loading";

/** Max cached row elements. Prevents unbounded memory growth. */
const MAX_CACHE = 200;

export interface VirtualTableColumn<T> {
  /** Unique column key. Used for data-column attribute and sorting. */
  key: string;
  /** Header label. String or Element. Defaults to the key. */
  label?: string | Element;
  /** Column width. Number = px, string = any CSS grid track size. Default "1fr". */
  width?: number | string;
  /** Cell content alignment. Default "left". */
  align?: "left" | "center" | "right";
  /** Custom cell renderer. Receives the row item and index. */
  render?: (item: T, index: number) => Element | string;
  /** Accessor for default cell content (when render is not provided). */
  accessor?: (item: T) => string | number | null | undefined;
  /** Whether this column is sortable. Requires sortable: true on the table. */
  sortable?: boolean;
  /** Additional class for the header cell element. */
  headerClassName?: string;
  /** Additional class for the body cell elements. */
  cellClassName?: string;
}

export interface VirtualTableOptions<T> {
  /** Column definitions. */
  columns: VirtualTableColumn<T>[];
  /** Reactive data source. */
  data: ReadableSignal<T[]>;
  /** Layout mode: "grid" (CSS Grid divs) or "table" (native <table> elements). Default "grid". */
  layout?: "grid" | "table";
  /** Function to derive a stable key from each row item. Defaults to the item itself. */
  rowKey?: (item: T, index: number) => unknown;
  /** Fixed row height in pixels. Enables fast fixed-height mode. */
  rowHeight?: number;
  /** Estimated row height for variable-height mode. Default 40. */
  estimatedRowHeight?: number;
  /** Extra rows to render above/below the viewport. Default 3. */
  overscan?: number;
  /** Height of the table. Number = px, string = any CSS length. Default "100%". */
  height?: number | string;
  /** Additional class for the table root element. */
  className?: string;
  /** Whether rows are selectable (click to toggle). Default false. */
  selectable?: boolean;
  /** Selection state signal. Updated on row click. */
  selection?: Signal.State<Set<unknown>>;
  /** Whether sorting is enabled. Individual columns must also set sortable: true. */
  sortable?: boolean;
  /** Sort key signal. Updated when a sortable header is clicked. */
  sortKey?: Signal.State<string | null>;
  /** Sort direction signal. Updated when a sortable header is clicked. */
  sortDirection?: Signal.State<"asc" | "desc" | null>;
  /** Called when a row is clicked. */
  onRowClick?: (item: T, index: number, event: MouseEvent) => void;
  /** Called when the user scrolls near the bottom. */
  onLoadMore?: (info: { lastIndex: number; total: number }) => void;
  /** Distance from bottom (px) to trigger onLoadMore. Default 100. */
  loadMoreThreshold?: number;
  /** Loading indicator render function. */
  loadingIndicator?: () => Element;
  /** Whether data is currently loading. */
  isLoading?: ReadableSignal<boolean> | boolean;
  /** Whether more data can be loaded. Default true. */
  hasMore?: ReadableSignal<boolean> | boolean;
  /** Enable horizontal virtual scrolling for wide tables. Requires all columns to have px widths. Default false. */
  horizontalVirtualScroll?: boolean;
  /** Extra columns to render left/right of the horizontal viewport. Default 3. */
  columnOverscan?: number;
}

export interface VirtualTableHandle extends HTMLElement {
  /** Scroll to a specific row index. */
  scrollToIndex(index: number, align?: "start" | "center" | "end"): void;
  /**
   * Dispose all internal effects, listeners, and observers. Call this when
   * the table is removed from the DOM to prevent effect leaks (especially
   * in test environments where GC may not run promptly).
   */
  dispose(): void;
}

function buildGridTemplate<T>(columns: VirtualTableColumn<T>[]): string {
  return columns
    .map((col) => {
      if (col.width == null) return "1fr";
      if (typeof col.width === "number") return `${col.width}px`;
      return col.width;
    })
    .join(" ");
}

function parsePxWidth(width: number | string | undefined): number | null {
  if (width == null) return null;
  if (typeof width === "number") return width;
  const m = width.match(/^(\d+(?:\.\d+)?)px$/);
  return m ? parseFloat(m[1]) : null;
}

function alignToJustify(align: "left" | "center" | "right" | undefined): string {
  if (align === "center") return "center";
  if (align === "right") return "end";
  return "start";
}

function getCellContent<T>(
  col: VirtualTableColumn<T>,
  item: T,
  index: number,
): Element | string {
  if (col.render) {
    return col.render(item, index);
  }
  if (col.accessor) {
    const val = col.accessor(item);
    return val == null ? "" : String(val);
  }
  const val = (item as Record<string, unknown>)[col.key];
  return val == null ? "" : String(val);
}

/** Append content (Element or string) to a parent element. */
function appendContent(parent: HTMLElement, content: Element | string): void {
  if (content instanceof Element) {
    parent.appendChild(content);
  } else {
    parent.appendChild(document.createTextNode(content));
  }
}

/**
 * Strategy for positioning rows and reconciling the DOM in a specific layout
 * mode. Decouples the shared render effect from mode-specific DOM concerns:
 *
 * - **Table mode**: rows live in normal flow inside `<tbody>`; spacer `<tr>`
 *   elements control total height; DOM is cleared and re-appended each render.
 * - **Grid mode**: rows are absolutely positioned with `top`; the body div
 *   height controls total height; DOM is reordered in place by the reconciler.
 *
 * The render effect is written once and delegates positioning + DOM
 * finalization to the strategy, eliminating the duplicated render paths.
 */
interface TableLayoutStrategy {
  /** Reconciler cleanup strategy: `"source"` keeps off-screen cached rows,
   * `"visible"` evicts all non-visible rows. */
  cleanupStrategy: "source" | "visible";
  /** Whether the reconciler should reorder DOM children. `false` when the
   * strategy handles DOM manipulation itself (table mode with spacers). */
  reorder: boolean;
  /** Position a row at the given pixel offset from the top. */
  positionRow(row: HTMLElement, offset: number): void;
  /**
   * Perform mode-specific DOM finalization after the reconciler has cleaned
   * up the cache. For table mode: build children with spacer rows, clear the
   * tbody, and append. For grid mode: no-op (reconciler already reordered).
   */
  finalizeDOM(
    visibleRows: HTMLElement[],
    start: number,
    end: number,
    offsets: number[],
    total: number,
    itemCount: number,
  ): void;
}

/**
 * Creates a virtual-scrolling data table.
 *
 * Features:
 * - Two layout modes: "grid" (CSS Grid divs, default) or "table" (native `<table>` elements)
 * - Virtual scrolling via shared core (fixed-height or variable-height mode)
 * - Optional horizontal virtual scrolling for wide tables
 * - CSS Grid column alignment (grid mode) or `<colgroup>` (table mode)
 * - Optional sorting (via sortKey/sortDirection signals — table emits, user sorts)
 * - Optional row selection (via selection signal)
 * - Optional lazy loading
 * - Sticky header (inside scroll container, stays visible during vertical scroll)
 *
 * No Shadow DOM. Uses `data-r-vtable*` attributes for styling hooks.
 *
 * @example
 * ```ts
 * const data = signal(Array.from({ length: 1000 }, (_, i) => ({
 *   id: i, name: `User ${i}`, age: 20 + (i % 50)
 * })));
 *
 * const table = virtualTable({
 *   columns: [
 *     { key: "name", label: "Name", width: 200 },
 *     { key: "age", label: "Age", width: 100, align: "right" },
 *   ],
 *   data,
 *   rowKey: (item) => item.id,
 *   rowHeight: 40,
 * });
 * document.body.appendChild(table);
 * ```
 */
export function virtualTable<T>(
  options: VirtualTableOptions<T>,
): VirtualTableHandle {
  const {
    columns,
    data,
    layout = "grid",
    rowKey,
    rowHeight,
    estimatedRowHeight = 40,
    overscan = 3,
    height = "100%",
    className,
    selectable = false,
    selection,
    sortable = false,
    sortKey,
    sortDirection,
    onRowClick,
    onLoadMore,
    loadMoreThreshold = 100,
    loadingIndicator,
    isLoading,
    hasMore,
    horizontalVirtualScroll = false,
    columnOverscan = 3,
  } = options;

  const isTableMode = layout === "table";
  const fixedMode = rowHeight != null && rowHeight > 0;
  const gridTemplate = buildGridTemplate(columns);

  // --- Horizontal virtual scroll setup ---
  const colWidths = columns.map((c) => parsePxWidth(c.width));
  const canHScroll =
    horizontalVirtualScroll && colWidths.every((w) => w != null && w > 0);

  const colOffsets: number[] = [0];
  for (const w of colWidths) colOffsets.push(colOffsets[colOffsets.length - 1] + (w ?? 0));
  const totalWidth = colOffsets[colOffsets.length - 1];

  const scrollLeft = signal(0);
  const viewportWidth = signal(0);

  const visibleColRange = computed(() => {
    if (!canHScroll) {
      return { start: 0, end: columns.length, leftOffset: 0, rightOffset: 0 };
    }
    const sl = scrollLeft.get();
    const vw = viewportWidth.get();
    if (vw === 0) return { start: 0, end: 0, leftOffset: 0, rightOffset: 0 };

    let lo = 0;
    let hi = columns.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (colOffsets[mid + 1] <= sl) lo = mid + 1;
      else hi = mid;
    }
    const rawStart = lo;

    const right = sl + vw;
    lo = rawStart;
    hi = columns.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (colOffsets[mid] < right) lo = mid + 1;
      else hi = mid;
    }
    const rawEnd = lo;

    const start = Math.max(0, rawStart - columnOverscan);
    const end = Math.min(columns.length, rawEnd + columnOverscan);

    return {
      start,
      end,
      leftOffset: colOffsets[start],
      rightOffset: totalWidth - colOffsets[end],
    };
  });

  // --- Create virtual scroll core ---
  const core: VirtualScrollCore<T, unknown> = createVirtualScrollCore({
    source: data,
    itemHeight: rowHeight,
    estimatedItemHeight: estimatedRowHeight,
    overscan,
    keyFn: rowKey,
    onLoadMore,
    loadMoreThreshold,
    isLoading,
    hasMore,
    hasLoadingIndicator: !!loadingIndicator,
  });

  // --- Build root + scroll container ---
  const root = h("div", {
    className,
    style: {
      height: typeof height === "number" ? `${height}px` : height,
      overflow: "hidden",
    },
  }) as unknown as VirtualTableHandle;
  root.setAttribute(DATA_VTABLE, "");

  const scrollContainer = h("div", {
    style: {
      overflow: "auto",
      height: "100%",
      position: "relative",
    },
  });
  scrollContainer.setAttribute(DATA_VTABLE_SCROLL, "");
  root.appendChild(scrollContainer);

  core.attach(scrollContainer);

  // Collect all effect/listener/observer disposers for explicit cleanup.
  const disposers: Array<() => void> = [];

  // --- Horizontal scroll listener ---
  let hRafId = 0;
  function updateViewportWidth() {
    const w = scrollContainer.clientWidth;
    if (w > 0) viewportWidth.set(w);
  }
  if (canHScroll) {
    const onHScroll = () => {
      if (hRafId) return;
      hRafId = requestAnimationFrame(() => {
        hRafId = 0;
        scrollLeft.set(scrollContainer.scrollLeft);
        updateViewportWidth();
      });
    };
    scrollContainer.addEventListener("scroll", onHScroll, { passive: true });
    updateViewportWidth();
    requestAnimationFrame(updateViewportWidth);

    if (typeof ResizeObserver !== "undefined") {
      const wObserver = new ResizeObserver(() => updateViewportWidth());
      wObserver.observe(scrollContainer);
      disposers.push(() => wObserver.disconnect());
    }
    disposers.push(() => {
      if (hRafId) cancelAnimationFrame(hRafId);
      scrollContainer.removeEventListener("scroll", onHScroll);
    });
  }

  // --- Element cache + reconciler ---
  // The reconciler is created per layout mode (different parent elements).
  // `reconciler` is assigned inside the mode branch below.
  let reconciler: Reconciler<unknown> | null = null;
  const elementKeys = new WeakMap<HTMLElement, unknown>();

  // O(1) source-key lookup for cache cleanup (replaces O(n·m) scan).
  // Recomputes only when the data array changes.
  const sourceKeySet = computed<Set<unknown>>(() => {
    const items = data.get();
    const set = new Set<unknown>();
    for (let i = 0; i < items.length; i++) {
      set.add(rowKey ? rowKey(items[i], i) : items[i]);
    }
    return set;
  });

  // --- Build header ---
  // Returns a function to update header cells (for horizontal virtual scroll)
  function createHeaderCell(col: VirtualTableColumn<T>): HTMLElement {
    const cell = h(isTableMode ? "th" : "div", {
      className: col.headerClassName,
      style: isTableMode
        ? undefined
        : { justifySelf: alignToJustify(col.align) },
    });
    cell.setAttribute(DATA_VTABLE_HEADER_CELL, "");
    cell.dataset.column = col.key;

    const label = col.label ?? col.key;
    if (label instanceof Element) {
      cell.appendChild(label);
    } else {
      cell.appendChild(document.createTextNode(String(label)));
    }

    // Sort
    const colSortable =
      sortable && col.sortable === true && !!sortKey && !!sortDirection;
    if (colSortable && sortKey && sortDirection) {
      cell.style.cursor = "pointer";
      const sk = sortKey;
      const sd = sortDirection;
      const colKey = col.key;

      const sortDispose = effect(() => {
        if (sk.get() === colKey) {
          cell.dataset.sort = sd.get() ?? "none";
        } else {
          delete cell.dataset.sort;
        }
      });
      registerDisposable(cell, sortDispose);

      cell.addEventListener("click", () => {
        if (sk.get() === colKey) {
          if (sd.get() === "asc") {
            sd.set("desc");
          } else if (sd.get() === "desc") {
            sk.set(null);
            sd.set(null);
          } else {
            sd.set("asc");
          }
        } else {
          sk.set(colKey);
          sd.set("asc");
        }
      });
    }

    return cell;
  }

  // --- Build a row element ---
  function createRow(item: T, index: number, key: unknown): HTMLElement {
    const row = h(isTableMode ? "tr" : "div", {
      style: isTableMode
        ? undefined
        : {
            display: canHScroll ? "block" : "grid",
            gridTemplateColumns: canHScroll ? undefined : gridTemplate,
            width: canHScroll ? `${totalWidth}px` : "100%",
          },
    });
    row.setAttribute(DATA_VTABLE_ROW, "");
    elementKeys.set(row, key);

    const { start, end } = canHScroll ? visibleColRange.get() : { start: 0, end: columns.length };

    if (canHScroll) {
      // Absolute-positioned cells for horizontal virtual scroll
      for (let c = start; c < end; c++) {
        const col = columns[c];
        const cell = h(isTableMode ? "td" : "div", {
          className: col.cellClassName,
          style: isTableMode
            ? undefined
            : {
                position: "absolute",
                left: `${colOffsets[c]}px`,
                width: `${colWidths[c]}px`,
                justifySelf: alignToJustify(col.align),
              },
        });
        cell.setAttribute(DATA_VTABLE_CELL, "");
        cell.dataset.column = col.key;
        appendContent(cell, getCellContent(col, item, index));
        row.appendChild(cell);
      }
    } else {
      // Normal grid/table cells
      for (const col of columns) {
        const cell = h(isTableMode ? "td" : "div", {
          className: col.cellClassName,
          style: isTableMode
            ? undefined
            : { justifySelf: alignToJustify(col.align) },
        });
        cell.setAttribute(DATA_VTABLE_CELL, "");
        cell.dataset.column = col.key;
        appendContent(cell, getCellContent(col, item, index));
        row.appendChild(cell);
      }
    }

    return row;
  }

  // --- Update row cells for horizontal virtual scroll ---
  function updateRowCells(row: HTMLElement, item: T, index: number): void {
    if (!canHScroll) return;
    // Clear existing cells
    let child = row.firstChild;
    while (child) {
      const next = child.nextSibling;
      if (child.nodeType === 1) row.removeChild(child);
      child = next;
    }
    const { start, end } = visibleColRange.get();
    for (let c = start; c < end; c++) {
      const col = columns[c];
      const cell = h(isTableMode ? "td" : "div", {
        className: col.cellClassName,
        style: isTableMode
          ? undefined
          : {
              position: "absolute",
              left: `${colOffsets[c]}px`,
              width: `${colWidths[c]}px`,
              justifySelf: alignToJustify(col.align),
            },
      });
      cell.setAttribute(DATA_VTABLE_CELL, "");
      cell.dataset.column = col.key;
      appendContent(cell, getCellContent(col, item, index));
      row.appendChild(cell);
    }
  }

  // --- Build DOM based on layout mode ---
  let loadingEl: HTMLElement | null = null;

  // Header render function (for horizontal virtual scroll updates)
  let updateHeader: (() => void) | null = null;

  // Layout strategy (assigned inside the mode branch below). Unifies the
  // render effect so it is written once, delegating mode-specific DOM work.
  let strategy: TableLayoutStrategy | null = null;

  if (isTableMode) {
    // --- Table mode ---
    const table = h("table", {
      style: {
        tableLayout: "fixed",
        width: canHScroll ? `${totalWidth}px` : "100%",
        borderCollapse: "collapse",
      },
    });
    table.setAttribute(DATA_VTABLE_TABLE, "");
    scrollContainer.appendChild(table);

    // Colgroup
    const colgroup = h("colgroup");
    table.appendChild(colgroup);

    function renderColgroup(): void {
      colgroup.innerHTML = "";
      if (canHScroll) {
        const { start, end, leftOffset, rightOffset } = visibleColRange.get();
        if (leftOffset > 0) {
          const col = h("col", { style: { width: `${leftOffset}px` } });
          colgroup.appendChild(col);
        }
        for (let c = start; c < end; c++) {
          const col = h("col", { style: { width: `${colWidths[c]}px` } });
          colgroup.appendChild(col);
        }
        if (rightOffset > 0) {
          const col = h("col", { style: { width: `${rightOffset}px` } });
          colgroup.appendChild(col);
        }
      } else {
        for (const col of columns) {
          const w = col.width;
          const colEl = h("col", {
            style: {
              width:
                w == null
                  ? "1fr"
                  : typeof w === "number"
                    ? `${w}px`
                    : w,
            },
          });
          colgroup.appendChild(colEl);
        }
      }
    }

    // Header
    const thead = h("thead", { style: { position: "sticky", top: "0", zIndex: "1" } });
    thead.setAttribute(DATA_VTABLE_HEADER, "");
    table.appendChild(thead);

    const headerRow = h("tr");
    thead.appendChild(headerRow);

    function renderHeader(): void {
      headerRow.innerHTML = "";
      if (canHScroll) {
        const { start, end, leftOffset, rightOffset } = visibleColRange.get();
        if (leftOffset > 0) {
          const spacer = h("th", { style: { padding: "0", border: "none" } });
          headerRow.appendChild(spacer);
        }
        for (let c = start; c < end; c++) {
          headerRow.appendChild(createHeaderCell(columns[c]));
        }
        if (rightOffset > 0) {
          const spacer = h("th", { style: { padding: "0", border: "none" } });
          headerRow.appendChild(spacer);
        }
      } else {
        for (const col of columns) {
          headerRow.appendChild(createHeaderCell(col));
        }
      }
    }

    renderColgroup();
    renderHeader();

    if (canHScroll) {
      updateHeader = () => {
        renderColgroup();
        renderHeader();
      };
    }

    // Body
    const tbody = h("tbody");
    tbody.setAttribute(DATA_VTABLE_BODY, "");
    table.appendChild(tbody);

    // Loading indicator
    let loadingTr: HTMLElement | null = null;
    if (loadingIndicator) {
      loadingEl = loadingIndicator() as HTMLElement;
      loadingEl.setAttribute(DATA_VTABLE_LOADING, "");
      loadingEl.style.display = "none";
      loadingTr = h("tr", {}, loadingEl);
      loadingTr.style.display = "none";
      tbody.appendChild(loadingTr);

      const loadingDispose = effect(() => {
        const loading = readBool(isLoading, false);
        loadingTr!.style.display = loading ? "" : "none";
        if (loading && loadingEl) {
          (loadingEl as unknown as HTMLTableCellElement).colSpan =
            columns.length;
        }
      });
      disposers.push(loadingDispose);
    }

    // Reconciler (table mode: visible-strategy cleanup, no DOM reorder —
    // the strategy's finalizeDOM handles DOM manipulation with spacer rows).
    reconciler = createReconciler<unknown>({
      parent: tbody,
      keepLast: loadingTr,
      maxCache: MAX_CACHE,
      onEvict: (_key, el) => core.unmeasureElement(el),
    });

    // Table mode strategy: rows in normal flow, spacer trs for height,
    // clear-and-append DOM reconciliation.
    strategy = {
      cleanupStrategy: "visible",
      reorder: false,
      positionRow: () => {
        // Rows are in normal flow; spacers control vertical positioning.
      },
      finalizeDOM: (visibleRows, start, end, offsets, total, itemCount) => {
        const children: HTMLElement[] = [];

        // Top spacer
        if (start > 0) {
          const spacer = h("tr", { style: { height: `${offsets[start]}px` } });
          const td = h("td", {
            style: { padding: "0", border: "none", height: `${offsets[start]}px` },
          });
          (td as HTMLTableCellElement).colSpan = columns.length;
          spacer.appendChild(td);
          children.push(spacer);
        }

        children.push(...visibleRows);

        // Bottom spacer
        if (end < itemCount) {
          const remaining = total - offsets[end];
          const spacer = h("tr", { style: { height: `${remaining}px` } });
          const td = h("td", {
            style: { padding: "0", border: "none", height: `${remaining}px` },
          });
          (td as HTMLTableCellElement).colSpan = columns.length;
          spacer.appendChild(td);
          children.push(spacer);
        }

        // Remove all non-loading children, then append new ones
        const toRemove: Node[] = [];
        let child = tbody.firstChild;
        while (child) {
          const next = child.nextSibling;
          if (child !== loadingTr) {
            toRemove.push(child);
          }
          child = next;
        }
        for (const c of toRemove) tbody.removeChild(c);

        for (const el of children) {
          if (loadingTr) {
            tbody.insertBefore(el, loadingTr);
          } else {
            tbody.appendChild(el);
          }
        }
      },
    };
  } else {
    // --- Grid mode ---
    const header = h("div", {
      style: {
        position: "sticky",
        top: "0",
        zIndex: "1",
        display: canHScroll ? "block" : "grid",
        gridTemplateColumns: canHScroll ? undefined : gridTemplate,
        width: canHScroll ? `${totalWidth}px` : "100%",
      },
    });
    header.setAttribute(DATA_VTABLE_HEADER, "");
    scrollContainer.appendChild(header);

    function renderHeader(): void {
      header.innerHTML = "";
      if (canHScroll) {
        const { start, end, leftOffset, rightOffset } = visibleColRange.get();
        if (leftOffset > 0) {
          const spacer = h("div", { style: { width: `${leftOffset}px` } });
          header.appendChild(spacer);
        }
        for (let c = start; c < end; c++) {
          const cell = createHeaderCell(columns[c]);
          cell.style.position = "absolute";
          cell.style.left = `${colOffsets[c]}px`;
          cell.style.width = `${colWidths[c]}px`;
          header.appendChild(cell);
        }
      } else {
        for (const col of columns) {
          header.appendChild(createHeaderCell(col));
        }
      }
    }

    renderHeader();

    if (canHScroll) {
      updateHeader = renderHeader;
    }

    // Body
    const body = h("div", {
      style: {
        position: "relative",
        width: "100%",
      },
    });
    body.setAttribute(DATA_VTABLE_BODY, "");
    scrollContainer.appendChild(body);

    // Loading indicator
    if (loadingIndicator) {
      loadingEl = loadingIndicator() as HTMLElement;
      loadingEl.setAttribute(DATA_VTABLE_LOADING, "");
      loadingEl.style.width = "100%";
      body.appendChild(loadingEl);

      const loadingDispose = effect(() => {
        if (!loadingEl) return;
        loadingEl.style.display = readBool(isLoading, false) ? "" : "none";
      });
      disposers.push(loadingDispose);
    }

    // Reconciler (grid mode: source-strategy cleanup, no DOM reorder —
    // the strategy's finalizeDOM handles DOM with spacer divs).
    reconciler = createReconciler<unknown>({
      parent: body,
      keepLast: loadingEl,
      maxCache: MAX_CACHE,
      onEvict: (_key, el) => core.unmeasureElement(el),
    });

    // Grid mode strategy: normal flow with spacer divs (same pattern as
    // table mode, just with <div> instead of <tr>).
    strategy = {
      cleanupStrategy: "source",
      reorder: false,
      positionRow: () => {
        // Rows are in normal flow; spacers control vertical positioning.
      },
      finalizeDOM: (visibleRows, start, end, offsets, total, itemCount) => {
        const children: HTMLElement[] = [];

        // Top spacer
        if (start > 0) {
          children.push(
            h("div", { style: { height: `${offsets[start]}px` } }),
          );
        }

        children.push(...visibleRows);

        // Bottom spacer
        if (end < itemCount) {
          const remaining = total - offsets[end];
          children.push(
            h("div", { style: { height: `${remaining}px` } }),
          );
        }

        // Remove all non-loading children, then append new ones
        const toRemove: Node[] = [];
        let child = body.firstChild;
        while (child) {
          const next = child.nextSibling;
          if (child !== loadingEl) {
            toRemove.push(child);
          }
          child = next;
        }
        for (const c of toRemove) body.removeChild(c);

        for (const el of children) {
          if (loadingEl) {
            body.insertBefore(el, loadingEl);
          } else {
            body.appendChild(el);
          }
        }
      },
    };
  }

  // --- Shared render effect (unified via layout strategy) ---
  const renderDispose = effect(() => {
    const items = data.get();
    const { start, end } = core.visibleRange.get();
    const { offsets, total } = core.layout.get();
    const currentSelection = selectable && selection ? selection.get() : null;
    const keys = sourceKeySet.get();

    const visible: Array<{ key: unknown; element: HTMLElement }> = [];

    for (let i = start; i < end; i++) {
      const item = items[i];
      const key = rowKey ? rowKey(item, i) : item;

      let rowEl = reconciler!.get(key);
      if (!rowEl) {
        rowEl = createRow(item, i, key);
        reconciler!.set(key, rowEl);
        core.measureElement(rowEl, key);
      } else if (canHScroll) {
        updateRowCells(rowEl, item, i);
      }

      strategy!.positionRow(rowEl, offsets[i]);

      if (selectable && currentSelection) {
        if (currentSelection.has(key)) {
          rowEl.dataset.selected = "";
        } else {
          delete rowEl.dataset.selected;
        }
      }

      visible.push({ key, element: rowEl });
    }

    // Reconciler handles cache cleanup + eviction. DOM reorder is delegated
    // to the strategy (table mode: reorder=false, grid mode: reorder=true).
    reconciler!.reconcile(visible, (key) => keys.has(key), {
      cleanupStrategy: strategy!.cleanupStrategy,
      reorder: strategy!.reorder,
    });

    // Mode-specific DOM finalization (table mode: spacers + clear+append).
    strategy!.finalizeDOM(
      visible.map((v) => v.element),
      start,
      end,
      offsets,
      total,
      items.length,
    );

    // Update header for horizontal virtual scroll
    if (canHScroll) updateHeader?.();
  });
  disposers.push(renderDispose);

  // --- Row click (selection + onRowClick) ---
  if (selectable || onRowClick) {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const row = target.closest(`[${DATA_VTABLE_ROW}]`) as HTMLElement | null;
      if (!row || !scrollContainer.contains(row)) return;

      const key = elementKeys.get(row);
      if (key === undefined) return;

      const items = data.get();
      let item: T | undefined;
      let index = -1;
      for (let i = 0; i < items.length; i++) {
        const k = rowKey ? rowKey(items[i], i) : items[i];
        if (k === key) {
          item = items[i];
          index = i;
          break;
        }
      }
      if (item === undefined || index === -1) return;

      if (selectable && selection) {
        const current = selection.get();
        const next = new Set(current);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        selection.set(next);
      }

      onRowClick?.(item, index, e);
    };
    scrollContainer.addEventListener("click", onClick);
    disposers.push(() =>
      scrollContainer.removeEventListener("click", onClick),
    );
  }

  // --- scrollToIndex ---
  root.scrollToIndex = (index, align) => core.scrollToIndex(index, align);

  // --- Cleanup ---
  // Explicit dispose (primary path) + registerDisposable (GC safety net).
  let disposed = false;
  root.dispose = () => {
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
    reconciler?.dispose();
    core.dispose();
  };
  registerDisposable(root, () => root.dispose());

  return root;
}
