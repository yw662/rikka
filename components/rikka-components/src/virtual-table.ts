import {
  signal,
  computed,
  effect,
  untracked,
  type Signal,
} from "@takanashi/rikka-signal";
import { h, registerDisposable, disposeElement } from "@takanashi/rikka-dom";
import {
  VirtualScroller,
  type ReadableSignal,
} from "./virtual-scroll.js";

const DATA_VTABLE = "data-r-vtable";
const DATA_VTABLE_TABLE = "data-r-vtable-table";
const DATA_VTABLE_HEADER = "data-r-vtable-header";
const DATA_VTABLE_HEADER_CELL = "data-r-vtable-header-cell";
const DATA_VTABLE_SCROLL = "data-r-vtable-scroll";
const DATA_VTABLE_BODY = "data-r-vtable-body";
const DATA_VTABLE_ROW = "data-r-vtable-row";
const DATA_VTABLE_CELL = "data-r-vtable-cell";
const DATA_VTABLE_LOADING = "data-r-vtable-loading";

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
   * the table is removed from the DOM to prevent effect leaks.
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
 * Creates a virtual-scrolling data table.
 *
 * Built on top of `VirtualScroller`. The table provides:
 * - Two layout modes: "grid" (CSS Grid divs, default) or "table" (native `<table>`)
 * - Virtual scrolling (via VirtualScroller's core)
 * - Optional horizontal virtual scrolling for wide tables
 * - CSS Grid column alignment (grid mode) or `<colgroup>` (table mode)
 * - Optional sorting (via sortKey/sortDirection signals — table emits, user sorts)
 * - Optional row selection (via selection signal)
 * - Optional lazy loading
 * - Sticky header (inside scroll container, stays visible during vertical scroll)
 *
 * The DOM structure is assembled by caller-provided component functions passed
 * to `VirtualScroller`: `structure`, `content`, `topSpacer`, `bottomSpacer`,
 * `loading`. Grid mode uses `<div>` elements; table mode uses `<table>/<tbody>`.
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

  // --- Header element references (assigned inside structure) ---
  let headerEl: HTMLElement | null = null; // grid mode header div
  let headerRowEl: HTMLElement | null = null; // table mode header row
  let colgroupEl: HTMLElement | null = null; // table mode colgroup

  // --- Header cell builder ---
  function createHeaderCell(col: VirtualTableColumn<T>): HTMLElement {
    const cell = h(isTableMode ? "th" : "div", {
      className: col.headerClassName,
      style: isTableMode
        ? undefined
        : { justifySelf: alignToJustify(col.align) },
    }) as HTMLElement;
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
      const sk = sortKey;
      const sd = sortDirection;
      const colKey = col.key;

      cell.style.cursor = "pointer";
      cell.style.userSelect = "none";

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

  // --- Header render (for horizontal virtual scroll updates) ---
  function renderHeader(): void {
    if (isTableMode) {
      if (!headerRowEl) return;
      // Dispose old header cells to clean up sort effects before clearing
      for (let i = headerRowEl.children.length - 1; i >= 0; i--) {
        disposeElement(headerRowEl.children[i]);
      }
      headerRowEl.innerHTML = "";
      if (canHScroll) {
        const { start, end, leftOffset, rightOffset } = visibleColRange.get();
        if (leftOffset > 0) {
          headerRowEl.appendChild(
            h("th", { style: { padding: "0", border: "none" } }),
          );
        }
        for (let c = start; c < end; c++) {
          headerRowEl.appendChild(createHeaderCell(columns[c]));
        }
        if (rightOffset > 0) {
          headerRowEl.appendChild(
            h("th", { style: { padding: "0", border: "none" } }),
          );
        }
      } else {
        for (const col of columns) {
          headerRowEl.appendChild(createHeaderCell(col));
        }
      }
    } else {
      if (!headerEl) return;
      for (let i = headerEl.children.length - 1; i >= 0; i--) {
        disposeElement(headerEl.children[i]);
      }
      headerEl.innerHTML = "";
      if (canHScroll) {
        const { start, end, leftOffset } = visibleColRange.get();
        if (leftOffset > 0) {
          headerEl.appendChild(
            h("div", { style: { width: `${leftOffset}px` } }),
          );
        }
        for (let c = start; c < end; c++) {
          const cell = createHeaderCell(columns[c]);
          cell.style.position = "absolute";
          cell.style.left = `${colOffsets[c]}px`;
          cell.style.width = `${colWidths[c]}px`;
          headerEl.appendChild(cell);
        }
      } else {
        for (const col of columns) {
          headerEl.appendChild(createHeaderCell(col));
        }
      }
    }
  }

  function renderColgroup(): void {
    if (!colgroupEl) return;
    colgroupEl.innerHTML = "";
    if (canHScroll) {
      const { start, end, leftOffset, rightOffset } = visibleColRange.get();
      if (leftOffset > 0) {
        colgroupEl.appendChild(h("col", { style: { width: `${leftOffset}px` } }));
      }
      for (let c = start; c < end; c++) {
        colgroupEl.appendChild(h("col", { style: { width: `${colWidths[c]}px` } }));
      }
      if (rightOffset > 0) {
        colgroupEl.appendChild(h("col", { style: { width: `${rightOffset}px` } }));
      }
    } else {
      for (const col of columns) {
        const w = col.width;
        colgroupEl.appendChild(
          h("col", {
            style: {
              width:
                w == null
                  ? "auto"
                  : typeof w === "number"
                    ? `${w}px`
                    : w,
            },
          }),
        );
      }
    }
  }

  // --- Row builder (VirtualScroller's renderItem) ---
  const elementKeys = new WeakMap<HTMLElement, unknown>();

  function createRow(item: T, index: number): HTMLElement {
    const key = rowKey ? rowKey(item, index) : item;
    const row = h(isTableMode ? "tr" : "div", {
      style: isTableMode
        ? undefined
        : {
            display: canHScroll ? "block" : "grid",
            gridTemplateColumns: canHScroll ? undefined : gridTemplate,
            width: canHScroll ? `${totalWidth}px` : "100%",
          },
    }) as HTMLElement;
    row.setAttribute(DATA_VTABLE_ROW, "");
    elementKeys.set(row, key);

    const { start, end } = canHScroll
      ? visibleColRange.get()
      : { start: 0, end: columns.length };

    if (canHScroll) {
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
        }) as HTMLElement;
        cell.setAttribute(DATA_VTABLE_CELL, "");
        cell.dataset.column = col.key;
        appendContent(cell, getCellContent(col, item, index));
        row.appendChild(cell);
      }
    } else {
      for (const col of columns) {
        const cell = h(isTableMode ? "td" : "div", {
          className: col.cellClassName,
          style: isTableMode
            ? undefined
            : { justifySelf: alignToJustify(col.align) },
        }) as HTMLElement;
        cell.setAttribute(DATA_VTABLE_CELL, "");
        cell.dataset.column = col.key;
        appendContent(cell, getCellContent(col, item, index));
        row.appendChild(cell);
      }
    }

    return row;
  }

  // --- Update row cells for horizontal virtual scroll (cached rows) ---
  function updateRowCells(row: HTMLElement, item: T, index: number): void {
    if (!canHScroll) return;
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
      }) as HTMLElement;
      cell.setAttribute(DATA_VTABLE_CELL, "");
      cell.dataset.column = col.key;
      appendContent(cell, getCellContent(col, item, index));
      row.appendChild(cell);
    }
  }

  // --- Build via VirtualScroller ---
  const handle = VirtualScroller<T, unknown>(data, createRow, {
    itemHeight: rowHeight,
    estimatedItemHeight: estimatedRowHeight,
    overscan,
    height,
    className,
    keyFn: rowKey as ((item: T, index: number) => unknown) | undefined,
    onLoadMore,
    loadMoreThreshold,
    isLoading,
    hasMore,
    // Custom structure: scroll container + header + spacers + content.
    structure: ({ topSpacer, content, bottomSpacer }) => {
      const scroller = h("div", {
        className,
        style: {
          overflow: "auto",
          position: "relative",
          height: typeof height === "number" ? `${height}px` : height,
        },
      }) as HTMLElement;
      scroller.setAttribute(DATA_VTABLE, "");
      scroller.setAttribute(DATA_VTABLE_SCROLL, "");

      if (isTableMode) {
        const table = h("table", {
          style: {
            tableLayout: "fixed",
            width: canHScroll ? `${totalWidth}px` : "100%",
            borderCollapse: "collapse",
          },
        });
        table.setAttribute(DATA_VTABLE_TABLE, "");
        scroller.appendChild(table);

        const colgroup = h("colgroup");
        table.appendChild(colgroup);

        const thead = h("thead", {
          style: { position: "sticky", top: "0", zIndex: "1" },
        });
        thead.setAttribute(DATA_VTABLE_HEADER, "");
        table.appendChild(thead);

        const headerRow = h("tr");
        thead.appendChild(headerRow);

        table.appendChild(topSpacer);
        table.appendChild(content);
        table.appendChild(bottomSpacer);

        colgroupEl = colgroup;
        headerRowEl = headerRow;
        renderColgroup();
        renderHeader();
      } else {
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
        scroller.appendChild(header);

        scroller.appendChild(topSpacer);
        scroller.appendChild(content);
        scroller.appendChild(bottomSpacer);

        headerEl = header;
        renderHeader();
      }

      return scroller;
    },
    // Custom content: body div (grid) or tbody (table).
    content: () => {
      const el = isTableMode
        ? h("tbody")
        : h("div", { style: { position: "relative", width: "100%" } });
      el.setAttribute(DATA_VTABLE_BODY, "");
      return el as HTMLElement;
    },
    // Table mode: spacer is a <tbody> with a single <tr>/<td> (colSpan=N).
    // Grid mode: use default (div with height).
    ...(isTableMode
      ? {
          topSpacer: (heightSig: ReadableSignal<string>): HTMLElement => {
            const td = h("td", {
              style: { padding: "0", border: "none", height: heightSig },
            }) as HTMLTableCellElement;
            td.colSpan = columns.length;
            return h("tbody", {}, h("tr", {}, td)) as HTMLElement;
          },
          bottomSpacer: (heightSig: ReadableSignal<string>): HTMLElement => {
            const td = h("td", {
              style: { padding: "0", border: "none", height: heightSig },
            }) as HTMLTableCellElement;
            td.colSpan = columns.length;
            return h("tbody", {}, h("tr", {}, td)) as HTMLElement;
          },
        }
      : {}),
    // Loading indicator (table mode: <tr>/<td> wrapper; grid mode: bare element).
    loading: loadingIndicator
      ? () => {
          const indicator = loadingIndicator() as HTMLElement;
          indicator.setAttribute(DATA_VTABLE_LOADING, "");
          if (isTableMode) {
            const td = h("td", {
              style: { textAlign: "center", padding: "8px" },
            }) as HTMLTableCellElement;
            td.colSpan = columns.length;
            td.appendChild(indicator);
            return h("tr", {}, td) as HTMLElement;
          }
          indicator.style.width = "100%";
          return indicator;
        }
      : undefined,
    // Per-item hook: hScroll cell updates + selection state.
    // Uses untracked to avoid subscribing the render effect to
    // visibleColRange/selection — those have their own effects below.
    onItem: (item, index, key, element, isNew) => {
      if (canHScroll && !isNew) {
        untracked(() => updateRowCells(element, item, index));
      }
      if (selectable && selection) {
        untracked(() => {
          const currentSelection = selection.get();
          if (currentSelection.has(key)) {
            element.dataset.selected = "";
          } else {
            delete element.dataset.selected;
          }
        });
      }
    },
    onReconcile: undefined,
  });

  // --- Separate effects for hscroll and selection ---
  // These subscribe to visibleColRange/selection independently so that
  // horizontal scroll or selection changes don't re-run the vertical render.
  const disposers: Array<() => void> = [];
  if (canHScroll) {
    disposers.push(
      effect(() => {
        visibleColRange.get();
        untracked(() => {
          renderHeader();
          if (isTableMode) renderColgroup();
          const rows = handle.querySelectorAll(`[${DATA_VTABLE_ROW}]`);
          rows.forEach((row) => {
            const key = elementKeys.get(row as HTMLElement);
            if (key === undefined) return;
            const items = data.get();
            const idx = items.findIndex((it, i) =>
              rowKey ? rowKey(it, i) === key : (it as unknown) === key,
            );
            if (idx !== -1) updateRowCells(row as HTMLElement, items[idx], idx);
          });
        });
      }),
    );
  }

  if (selectable && selection) {
    disposers.push(
      effect(() => {
        const currentSelection = selection.get();
        untracked(() => {
          const rows = handle.querySelectorAll(`[${DATA_VTABLE_ROW}]`);
          rows.forEach((row) => {
            const key = elementKeys.get(row as HTMLElement);
            if (key === undefined) return;
            if (currentSelection.has(key)) {
              (row as HTMLElement).dataset.selected = "";
            } else {
              delete (row as HTMLElement).dataset.selected;
            }
          });
        });
      }),
    );
  }

  // --- Horizontal scroll listener ---
  let hRafId = 0;
  function updateViewportWidth() {
    const w = handle.clientWidth;
    if (w > 0) viewportWidth.set(w);
  }
  if (canHScroll) {
    const onHScroll = () => {
      if (hRafId) return;
      hRafId = requestAnimationFrame(() => {
        hRafId = 0;
        scrollLeft.set(handle.scrollLeft);
        updateViewportWidth();
      });
    };
    handle.addEventListener("scroll", onHScroll, { passive: true });
    updateViewportWidth();
    requestAnimationFrame(updateViewportWidth);

    if (typeof ResizeObserver !== "undefined") {
      const wObserver = new ResizeObserver(() => updateViewportWidth());
      wObserver.observe(handle);
      disposers.push(() => wObserver.disconnect());
    }
    disposers.push(() => {
      if (hRafId) cancelAnimationFrame(hRafId);
      handle.removeEventListener("scroll", onHScroll);
    });
  }

  // --- Row click (selection + onRowClick) ---
  if (selectable || onRowClick) {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const row = target.closest(`[${DATA_VTABLE_ROW}]`) as HTMLElement | null;
      if (!row || !handle.contains(row)) return;

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
    handle.addEventListener("click", onClick);
    disposers.push(() => handle.removeEventListener("click", onClick));
  }

  // --- Public API ---
  const root = handle as unknown as VirtualTableHandle;

  // --- Cleanup wrapper (table-specific disposers + scroller) ---
  const origDispose = handle.dispose.bind(handle);
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
    origDispose();
  };
  registerDisposable(root, () => root.dispose());

  return root;
}
