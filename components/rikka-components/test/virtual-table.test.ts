import { describe, it, expect, afterEach } from "@rstest/core";
import { signal } from "@takanashi/rikka-signal";
import { virtualTable } from "../src/index.js";
import type { VirtualTableHandle } from "../src/index.js";

function waitFor(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Set clientHeight on an element (happy-dom doesn't compute layout). */
function mockHeight(el: HTMLElement, clientHeight: number) {
  Object.defineProperty(el, "clientHeight", {
    configurable: true,
    value: clientHeight,
  });
}

/** Trigger a scroll event on an element. */
function triggerScroll(el: HTMLElement, scrollTop: number) {
  Object.defineProperty(el, "scrollTop", {
    configurable: true,
    value: scrollTop,
  });
  el.dispatchEvent(new Event("scroll"));
}

interface Row {
  id: number;
  name: string;
  age: number;
}

describe("virtualTable", () => {
  let table: VirtualTableHandle;

  afterEach(() => {
    table?.remove();
  });

  it("creates a table with data-r-vtable attribute", () => {
    const data = signal<Row[]>([]);
    table = virtualTable({
      columns: [
        { key: "name", label: "Name" },
        { key: "age", label: "Age" },
      ],
      data,
      rowHeight: 40,
      height: 300,
    });

    expect(table.getAttribute("data-r-vtable")).toBe("");
  });

  it("renders header cells", () => {
    const data = signal<Row[]>([]);
    table = virtualTable({
      columns: [
        { key: "name", label: "Name", width: 200 },
        { key: "age", label: "Age", width: 100, align: "right" },
      ],
      data,
      rowHeight: 40,
    });

    const headerCells = table.querySelectorAll("[data-r-vtable-header-cell]");
    expect(headerCells.length).toBe(2);
    expect(headerCells[0].textContent).toBe("Name");
    expect(headerCells[1].textContent).toBe("Age");
  });

  it("uses column key as label when label is not provided", () => {
    const data = signal<Row[]>([]);
    table = virtualTable({
      columns: [{ key: "name" }, { key: "age" }],
      data,
      rowHeight: 40,
    });

    const headerCells = table.querySelectorAll("[data-r-vtable-header-cell]");
    expect(headerCells[0].textContent).toBe("name");
    expect(headerCells[1].textContent).toBe("age");
  });

  it("renders rows with cells", async () => {
    const data = signal<Row[]>(
      Array.from({ length: 10 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        age: 20 + i,
      })),
    );

    table = virtualTable({
      columns: [
        { key: "name", label: "Name" },
        { key: "age", label: "Age", align: "right" },
      ],
      data,
      rowKey: (item) => item.id,
      rowHeight: 40,
      height: 300,
    });

    mockHeight(table, 300);
    document.body.appendChild(table);
    await waitFor(50);

    const rows = table.querySelectorAll("[data-r-vtable-row]");
    expect(rows.length).toBeGreaterThan(0);

    const firstRow = rows[0];
    const cells = firstRow.querySelectorAll("[data-r-vtable-cell]");
    expect(cells.length).toBe(2);
  });

  it("uses accessor for cell content", async () => {
    const data = signal<Row[]>([
      { id: 1, name: "Alice", age: 30 },
    ]);

    table = virtualTable({
      columns: [
        { key: "name", label: "Name", accessor: (item) => item.name },
        { key: "age", label: "Age", accessor: (item) => item.age },
      ],
      data,
      rowKey: (item) => item.id,
      rowHeight: 40,
      height: 300,
    });

    mockHeight(table, 300);
    document.body.appendChild(table);
    await waitFor(50);

    const cells = table.querySelectorAll("[data-r-vtable-cell]");
    expect(cells[0].textContent).toBe("Alice");
    expect(cells[1].textContent).toBe("30");
  });

  it("uses custom render for cell content", async () => {
    const data = signal<Row[]>([
      { id: 1, name: "Alice", age: 30 },
    ]);

    table = virtualTable({
      columns: [
        {
          key: "name",
          label: "Name",
          render: (item) => {
            const el = document.createElement("span");
            el.textContent = `**${item.name}**`;
            return el;
          },
        },
      ],
      data,
      rowKey: (item) => item.id,
      rowHeight: 40,
      height: 300,
    });

    mockHeight(table, 300);
    document.body.appendChild(table);
    await waitFor(50);

    const cell = table.querySelector("[data-r-vtable-cell]");
    expect(cell?.textContent).toBe("**Alice**");
    expect(cell?.querySelector("span")).toBeTruthy();
  });

  it("uses grid-template-columns for header and rows", async () => {
    const data = signal<Row[]>([
      { id: 1, name: "Alice", age: 30 },
    ]);

    table = virtualTable({
      columns: [
        { key: "name", label: "Name", width: 200 },
        { key: "age", label: "Age", width: 100 },
      ],
      data,
      rowKey: (item) => item.id,
      rowHeight: 40,
      height: 300,
    });

    mockHeight(table, 300);
    document.body.appendChild(table);
    await waitFor(50);

    const header = table.querySelector("[data-r-vtable-header]") as HTMLElement;
    const row = table.querySelector("[data-r-vtable-row]") as HTMLElement;

    expect(header.style.gridTemplateColumns).toBe("200px 100px");
    expect(row.style.gridTemplateColumns).toBe("200px 100px");
  });

  it("supports row selection via click", async () => {
    const data = signal<Row[]>([
      { id: 1, name: "Alice", age: 30 },
      { id: 2, name: "Bob", age: 25 },
    ]);
    const selection = signal(new Set<unknown>());

    table = virtualTable({
      columns: [{ key: "name", label: "Name" }],
      data,
      rowKey: (item) => item.id,
      rowHeight: 40,
      height: 300,
      selectable: true,
      selection,
    });

    mockHeight(table, 300);
    document.body.appendChild(table);
    await waitFor(50);

    const firstRow = table.querySelector("[data-r-vtable-row]") as HTMLElement;
    firstRow.click();
    await waitFor(50);

    expect(selection.get().size).toBe(1);
    expect(selection.get().has(1)).toBe(true);

    // Click again to deselect
    firstRow.click();
    await waitFor(50);

    expect(selection.get().size).toBe(0);
  });

  it("sets data-selected attribute on selected rows", async () => {
    const data = signal<Row[]>([
      { id: 1, name: "Alice", age: 30 },
    ]);
    const selection = signal(new Set<unknown>([1]));

    table = virtualTable({
      columns: [{ key: "name", label: "Name" }],
      data,
      rowKey: (item) => item.id,
      rowHeight: 40,
      height: 300,
      selectable: true,
      selection,
    });

    mockHeight(table, 300);
    document.body.appendChild(table);
    await waitFor(50);

    const row = table.querySelector("[data-r-vtable-row]") as HTMLElement;
    expect(row.dataset.selected).toBe("");
  });

  it("supports sorting via header click", async () => {
    const data = signal<Row[]>([
      { id: 1, name: "Alice", age: 30 },
    ]);
    const sortKey = signal<string | null>(null);
    const sortDirection = signal<"asc" | "desc" | null>(null);

    table = virtualTable({
      columns: [
        { key: "name", label: "Name", sortable: true },
        { key: "age", label: "Age", sortable: true },
      ],
      data,
      rowKey: (item) => item.id,
      rowHeight: 40,
      height: 300,
      sortable: true,
      sortKey,
      sortDirection,
    });

    mockHeight(table, 300);
    document.body.appendChild(table);
    await waitFor(50);

    const headerCells = table.querySelectorAll("[data-r-vtable-header-cell]");
    const nameHeader = headerCells[0] as HTMLElement;

    // Click to sort ascending
    nameHeader.click();
    await waitFor(50);
    expect(sortKey.get()).toBe("name");
    expect(sortDirection.get()).toBe("asc");
    expect(nameHeader.dataset.sort).toBe("asc");

    // Click again to sort descending
    nameHeader.click();
    await waitFor(50);
    expect(sortDirection.get()).toBe("desc");
    expect(nameHeader.dataset.sort).toBe("desc");

    // Click again to clear sort
    nameHeader.click();
    await waitFor(50);
    expect(sortKey.get()).toBe(null);
    expect(sortDirection.get()).toBe(null);
  });

  it("calls onRowClick when a row is clicked", async () => {
    const data = signal<Row[]>([
      { id: 1, name: "Alice", age: 30 },
    ]);
    let clickedItem: Row | null = null;
    let clickedIndex = -1;

    table = virtualTable({
      columns: [{ key: "name", label: "Name" }],
      data,
      rowKey: (item) => item.id,
      rowHeight: 40,
      height: 300,
      onRowClick: (item, index) => {
        clickedItem = item;
        clickedIndex = index;
      },
    });

    mockHeight(table, 300);
    document.body.appendChild(table);
    await waitFor(50);

    const row = table.querySelector("[data-r-vtable-row]") as HTMLElement;
    row.click();
    await waitFor(50);

    expect(clickedItem).not.toBeNull();
    expect(clickedItem!.id).toBe(1);
    expect(clickedIndex).toBe(0);
  });

  it("virtualizes large datasets", async () => {
    const data = signal<Row[]>(
      Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        age: 20 + (i % 50),
      })),
    );

    table = virtualTable({
      columns: [
        { key: "name", label: "Name" },
        { key: "age", label: "Age" },
      ],
      data,
      rowKey: (item) => item.id,
      rowHeight: 40,
      height: 300,
    });

    mockHeight(table, 300);
    document.body.appendChild(table);
    await waitFor(50);

    const rows = table.querySelectorAll("[data-r-vtable-row]");
    // Should only render visible + overscan, not all 1000
    expect(rows.length).toBeLessThan(20);
    expect(rows.length).toBeGreaterThan(0);
  });

  it("updates rows on scroll", async () => {
    const data = signal<Row[]>(
      Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        age: 20 + i,
      })),
    );

    table = virtualTable({
      columns: [
        { key: "name", label: "Name" },
        { key: "age", label: "Age" },
      ],
      data,
      rowKey: (item) => item.id,
      rowHeight: 40,
      height: 300,
    });

    mockHeight(table, 300);
    document.body.appendChild(table);
    await waitFor(50);

    // Scroll to row 50 (50 * 40 = 2000)
    triggerScroll(table, 2000);
    await waitFor(50);

    const rows = table.querySelectorAll("[data-r-vtable-row]");
    const texts = Array.from(rows).map((r) => r.textContent);
    expect(texts.some((t) => t?.includes("User 50"))).toBe(true);
  });

  it("handles empty data", async () => {
    const data = signal<Row[]>([]);

    table = virtualTable({
      columns: [{ key: "name", label: "Name" }],
      data,
      rowHeight: 40,
      height: 300,
    });

    mockHeight(table, 300);
    document.body.appendChild(table);
    await waitFor(50);

    const rows = table.querySelectorAll("[data-r-vtable-row]");
    expect(rows.length).toBe(0);

    // Header should still be present
    const headerCells = table.querySelectorAll("[data-r-vtable-header-cell]");
    expect(headerCells.length).toBe(1);
  });

  it("scrollToIndex scrolls to the correct position", async () => {
    const data = signal<Row[]>(
      Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        age: 20 + i,
      })),
    );

    table = virtualTable({
      columns: [{ key: "name", label: "Name" }],
      data,
      rowKey: (item) => item.id,
      rowHeight: 40,
      height: 300,
    });

    mockHeight(table, 300);
    document.body.appendChild(table);
    await waitFor(50);

    table.scrollToIndex(50);
    // 50 * 40 = 2000
    expect(table.scrollTop).toBe(2000);
  });
});
