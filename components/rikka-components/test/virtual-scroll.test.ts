import { describe, it, expect, afterEach } from "@rstest/core";
import { signal } from "@takanashi/rikka-signal";
import { virtualScroll } from "../src/index.js";
import type { VirtualScrollHandle } from "../src/index.js";

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

describe("virtualScroll", () => {
  let container: VirtualScrollHandle;

  afterEach(() => {
    container?.remove();
  });

  it("creates a container with data-r-vscroll attribute", () => {
    const items = signal<number[]>([]);
    container = virtualScroll(
      items,
      (item) => {
        const el = document.createElement("div");
        el.textContent = String(item);
        return el;
      },
      { itemHeight: 40, height: 300 },
    );

    expect(container.getAttribute("data-r-vscroll")).toBe("");
    expect(container.style.overflow).toBe("auto");
  });

  it("renders items in fixed-height mode", async () => {
    const items = signal(Array.from({ length: 100 }, (_, i) => i));
    container = virtualScroll(
      items,
      (item) => {
        const el = document.createElement("div");
        el.textContent = `Item ${item}`;
        el.style.height = "40px";
        return el;
      },
      { itemHeight: 40, height: 300 },
    );

    mockHeight(container, 300);
    document.body.appendChild(container);
    await waitFor(50);

    const rendered = container.querySelectorAll("[data-r-vscroll-item]");
    expect(rendered.length).toBeGreaterThan(0);
    expect(rendered.length).toBeLessThan(20);
  });

  it("positions items in normal flow (spacer-based)", async () => {
    const items = signal([0, 1, 2, 3, 4]);
    container = virtualScroll(
      items,
      (item) => {
        const el = document.createElement("div");
        el.textContent = String(item);
        return el;
      },
      { itemHeight: 50, height: 200 },
    );

    mockHeight(container, 200);
    document.body.appendChild(container);
    await waitFor(50);

    const itemEls = container.querySelectorAll("[data-r-vscroll-item]");
    expect(itemEls.length).toBeGreaterThan(0);

    // Items should NOT be absolutely positioned (normal flow, positioned via spacers)
    const firstItem = itemEls[0] as HTMLElement;
    expect(firstItem.style.position).not.toBe("absolute");
  });

  it("updates visible items on scroll", async () => {
    const items = signal(Array.from({ length: 100 }, (_, i) => i));
    container = virtualScroll(
      items,
      (item) => {
        const el = document.createElement("div");
        el.textContent = `Item ${item}`;
        el.style.height = "40px";
        return el;
      },
      { itemHeight: 40, height: 300 },
    );

    mockHeight(container, 300);
    document.body.appendChild(container);
    await waitFor(50);

    // Scroll to item 50 (50 * 40 = 2000)
    triggerScroll(container, 2000);
    await waitFor(50);

    const itemEls = container.querySelectorAll("[data-r-vscroll-item]");
    expect(itemEls.length).toBeGreaterThan(0);

    const texts = Array.from(itemEls).map((el) => el.textContent);
    expect(texts.some((t) => t?.includes("Item 50"))).toBe(true);
  });

  it("keeps DOM stable on repeated scrolls (no item recreation)", async () => {
    const items = signal(Array.from({ length: 200 }, (_, i) => i));
    container = virtualScroll(
      items,
      (item) => {
        const el = document.createElement("div");
        el.textContent = `Item ${item}`;
        return el;
      },
      { itemHeight: 40, height: 300 },
    );

    mockHeight(container, 300);
    document.body.appendChild(container);
    await waitFor(50);

    const content = container.querySelector(
      "[data-r-vscroll-content]",
    ) as HTMLElement;

    // With the spacer approach, spacers are siblings of content (inside the
    // scroll container), so content children are just visible items + loading.
    // Record the first visible item element and verify it persists across
    // scrolls (cached, not recreated).
    const firstItem = content.querySelector(
      "[data-r-vscroll-item]",
    ) as HTMLElement;
    expect(firstItem).toBeTruthy();

    // Scroll a small amount so the first item is still visible (cached)
    triggerScroll(container, 40);
    await waitFor(30);

    // The same item element should still be in the DOM (cached, not recreated)
    const stillPresent = content.contains(firstItem);
    expect(stillPresent).toBe(true);

    // Content should never have spacer children (spacers are siblings, not children)
    const spacers = content.querySelectorAll(":scope > div:not([data-r-vscroll-item]):not([data-r-vscroll-loading])");
    expect(spacers.length).toBe(0);
  });

  it("re-renders when source changes", async () => {
    const items = signal<number[]>([1, 2, 3]);
    container = virtualScroll(
      items,
      (item) => {
        const el = document.createElement("div");
        el.textContent = `Item ${item}`;
        return el;
      },
      { itemHeight: 40, height: 200 },
    );

    mockHeight(container, 200);
    document.body.appendChild(container);
    await waitFor(50);

    let itemEls = container.querySelectorAll("[data-r-vscroll-item]");
    expect(itemEls.length).toBe(3);

    // Add more items
    items.set(Array.from({ length: 50 }, (_, i) => i + 100));
    await waitFor(50);

    itemEls = container.querySelectorAll("[data-r-vscroll-item]");
    expect(itemEls.length).toBeGreaterThan(0);

    const texts = Array.from(itemEls).map((el) => el.textContent);
    expect(texts.some((t) => t?.includes("100"))).toBe(true);
  });

  it("uses keyFn for caching", async () => {
    const items = signal([
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
      { id: 3, name: "Charlie" },
    ]);

    const rendered: number[] = [];
    container = virtualScroll(
      items,
      (item) => {
        rendered.push(item.id);
        const el = document.createElement("div");
        el.textContent = item.name;
        return el;
      },
      {
        itemHeight: 40,
        height: 200,
        keyFn: (item) => item.id,
      },
    );

    mockHeight(container, 200);
    document.body.appendChild(container);
    await waitFor(50);

    // Re-set with same items but different order — should reuse cached elements
    items.set([
      { id: 3, name: "Charlie" },
      { id: 2, name: "Bob" },
      { id: 1, name: "Alice" },
    ]);
    await waitFor(50);

    // Each item should only be rendered once (cached on second pass)
    const uniqueRenders = new Set(rendered);
    expect(uniqueRenders.size).toBe(3);
  });

  it("calls onLoadMore when scrolling near bottom", async () => {
    const items = signal(Array.from({ length: 20 }, (_, i) => i));
    let loadMoreCalled = false;

    container = virtualScroll(
      items,
      (item) => {
        const el = document.createElement("div");
        el.textContent = String(item);
        return el;
      },
      {
        itemHeight: 40,
        height: 200,
        loadMoreThreshold: 100,
        onLoadMore: () => {
          loadMoreCalled = true;
        },
      },
    );

    mockHeight(container, 200);
    document.body.appendChild(container);
    await waitFor(50);

    // Scroll near bottom (20 * 40 = 800 total, scroll to 600)
    triggerScroll(container, 600);
    await waitFor(50);

    expect(loadMoreCalled).toBe(true);
  });

  it("does not call onLoadMore when hasMore is false", async () => {
    const items = signal(Array.from({ length: 20 }, (_, i) => i));
    let loadMoreCalled = false;

    container = virtualScroll(
      items,
      (item) => {
        const el = document.createElement("div");
        el.textContent = String(item);
        return el;
      },
      {
        itemHeight: 40,
        height: 200,
        hasMore: false,
        onLoadMore: () => {
          loadMoreCalled = true;
        },
      },
    );

    mockHeight(container, 200);
    document.body.appendChild(container);
    await waitFor(50);

    triggerScroll(container, 600);
    await waitFor(50);

    expect(loadMoreCalled).toBe(false);
  });

  it("shows/hides loading indicator based on isLoading", async () => {
    const items = signal([1, 2, 3]);
    const loading = signal(false);

    container = virtualScroll(
      items,
      (item) => {
        const el = document.createElement("div");
        el.textContent = String(item);
        return el;
      },
      {
        itemHeight: 40,
        height: 200,
        isLoading: loading,
        loadingIndicator: () => {
          const el = document.createElement("div");
          el.textContent = "Loading...";
          return el;
        },
      },
    );

    mockHeight(container, 200);
    document.body.appendChild(container);
    await waitFor(50);

    const loadingEl = container.querySelector(
      "[data-r-vscroll-loading]",
    ) as HTMLElement;
    expect(loadingEl).toBeTruthy();
    expect(loadingEl.style.display).toBe("none");

    loading.set(true);
    await waitFor(50);
    expect(loadingEl.style.display).toBe("");
  });

  it("scrollToIndex scrolls to the correct position", async () => {
    const items = signal(Array.from({ length: 100 }, (_, i) => i));
    container = virtualScroll(
      items,
      (item) => {
        const el = document.createElement("div");
        el.textContent = String(item);
        return el;
      },
      { itemHeight: 40, height: 300 },
    );

    mockHeight(container, 300);
    document.body.appendChild(container);
    await waitFor(50);

    container.scrollToIndex(50);
    // scrollTop should be 50 * 40 = 2000
    expect(container.scrollTop).toBe(2000);
  });

  it("handles empty source", async () => {
    const items = signal<number[]>([]);
    container = virtualScroll(
      items,
      (item) => {
        const el = document.createElement("div");
        el.textContent = String(item);
        return el;
      },
      { itemHeight: 40, height: 200 },
    );

    mockHeight(container, 200);
    document.body.appendChild(container);
    await waitFor(50);

    const itemEls = container.querySelectorAll("[data-r-vscroll-item]");
    expect(itemEls.length).toBe(0);
  });

  it("applies className to container", () => {
    const items = signal<number[]>([]);
    container = virtualScroll(
      items,
      (item) => {
        const el = document.createElement("div");
        return el;
      },
      { itemHeight: 40, className: "my-list" },
    );

    expect(container.className).toBe("my-list");
  });
});
