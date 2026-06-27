import { describe, it, expect, afterEach } from "@rstest/core";
import { signal } from "@takanashi/rikka-signal";
import { virtualTree } from "../src/index.js";
import type { VirtualTreeHandle } from "../src/index.js";

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

/**
 * Test store: holds loaded children (Map) and expected child counts for
 * unloaded nodes (Map). Both are reactive signals so the tree re-flattens
 * when data changes.
 */
function createStore<Key extends string>() {
  const children = signal(new Map<Key, Key[]>());
  const childCounts = signal(new Map<Key, number>());
  const leaves = new Set<Key>();

  return {
    children,
    childCounts,
    leaves,
    getChildren: (key: Key) => children.get().get(key),
    getChildCount: (key: Key) =>
      children.get().get(key)?.length ?? childCounts.get().get(key) ?? 0,
    isLeaf: (key: Key) => leaves.has(key),
    /** Set loaded children for a key. */
    setChildren(key: Key, kids: Key[]) {
      const next = new Map(children.get());
      next.set(key, kids);
      children.set(next);
    },
    /** Set expected child count for an unloaded key. */
    setChildCount(key: Key, count: number) {
      const next = new Map(childCounts.get());
      next.set(key, count);
      childCounts.set(next);
    },
    /** Mark keys as leaves. */
    markLeaves(...keys: Key[]) {
      for (const k of keys) leaves.add(k);
    },
  };
}

/** Simple Item that renders the key as text. */
function simpleItem(key: string) {
  const el = document.createElement("span");
  el.textContent = key;
  return el;
}

describe("virtualTree", () => {
  let tree: VirtualTreeHandle<string>;

  afterEach(() => {
    tree?.dispose();
    tree?.remove();
  });

  it("creates a tree with data-r-vtree attribute", () => {
    const store = createStore<string>();
    store.setChildren("root", ["a", "b"]);
    store.markLeaves("a", "b");

    tree = virtualTree<string>({
      roots: signal(["root"]),
      getChildren: store.getChildren,
      getChildCount: store.getChildCount,
      isLeaf: store.isLeaf,
      Item: simpleItem,
      itemHeight: 28,
      height: 300,
    });

    expect(tree.getAttribute("data-r-vtree")).toBe("");
  });

  it("renders only root nodes when collapsed", async () => {
    const store = createStore<string>();
    store.setChildren("src", ["src/index.ts", "src/utils"]);
    store.setChildren("src/utils", ["src/utils/helpers.ts"]);
    store.markLeaves("README.md", "src/index.ts", "src/utils/helpers.ts");

    tree = virtualTree<string>({
      roots: signal(["src", "README.md"]),
      getChildren: store.getChildren,
      getChildCount: store.getChildCount,
      isLeaf: store.isLeaf,
      Item: simpleItem,
      itemHeight: 28,
      height: 300,
    });

    const scrollContainer = tree.querySelector(
      "[data-r-vtree-scroll]",
    ) as HTMLElement;
    mockHeight(scrollContainer, 300);
    document.body.appendChild(tree);
    await waitFor(50);

    const nodeEls = tree.querySelectorAll("[data-r-vtree-node]");
    // Only root nodes: "src" and "README.md"
    expect(nodeEls.length).toBe(2);
    expect(nodeEls[0].textContent).toContain("src");
    expect(nodeEls[1].textContent).toContain("README.md");
  });

  it("renders children when expanded via defaultExpandedKeys", async () => {
    const store = createStore<string>();
    store.setChildren("src", ["src/index.ts", "src/utils"]);
    store.setChildren("src/utils", ["src/utils/helpers.ts"]);
    store.markLeaves("README.md", "src/index.ts", "src/utils/helpers.ts");

    tree = virtualTree<string>({
      roots: signal(["src", "README.md"]),
      getChildren: store.getChildren,
      getChildCount: store.getChildCount,
      isLeaf: store.isLeaf,
      Item: simpleItem,
      itemHeight: 28,
      height: 300,
      defaultExpandedKeys: ["src"],
    });

    const scrollContainer = tree.querySelector(
      "[data-r-vtree-scroll]",
    ) as HTMLElement;
    mockHeight(scrollContainer, 300);
    document.body.appendChild(tree);
    await waitFor(50);

    const nodeEls = tree.querySelectorAll("[data-r-vtree-node]");
    // src, src/index.ts, src/utils, README.md
    expect(nodeEls.length).toBe(4);
    const names = Array.from(nodeEls).map((el) => el.textContent);
    expect(names.some((n) => n?.includes("index.ts"))).toBe(true);
    expect(names.some((n) => n?.includes("utils"))).toBe(true);
  });

  it("expands and collapses on toggle click", async () => {
    const store = createStore<string>();
    store.setChildren("src", ["src/index.ts"]);
    store.markLeaves("src/index.ts", "README.md");

    tree = virtualTree<string>({
      roots: signal(["src", "README.md"]),
      getChildren: store.getChildren,
      getChildCount: store.getChildCount,
      isLeaf: store.isLeaf,
      Item: simpleItem,
      itemHeight: 28,
      height: 300,
    });

    const scrollContainer = tree.querySelector(
      "[data-r-vtree-scroll]",
    ) as HTMLElement;
    mockHeight(scrollContainer, 300);
    document.body.appendChild(tree);
    await waitFor(50);

    // Initially collapsed: 2 nodes
    expect(tree.querySelectorAll("[data-r-vtree-node]").length).toBe(2);

    // Click the toggle on the first node ("src")
    const firstToggle = tree.querySelector(
      "[data-r-vtree-toggle]",
    ) as HTMLElement;
    firstToggle.click();
    await waitFor(50);

    // Now expanded: src, src/index.ts, README.md
    expect(tree.querySelectorAll("[data-r-vtree-node]").length).toBe(3);
    expect(tree.isExpanded("src")).toBe(true);

    // Click again to collapse
    firstToggle.click();
    await waitFor(50);

    expect(tree.querySelectorAll("[data-r-vtree-node]").length).toBe(2);
    expect(tree.isExpanded("src")).toBe(false);
  });

  it("applies indentation based on depth", async () => {
    const store = createStore<string>();
    store.setChildren("src", ["src/index.ts", "src/utils"]);
    store.setChildren("src/utils", ["src/utils/helpers.ts"]);
    store.markLeaves("README.md", "src/index.ts", "src/utils/helpers.ts");

    tree = virtualTree<string>({
      roots: signal(["src", "README.md"]),
      getChildren: store.getChildren,
      getChildCount: store.getChildCount,
      isLeaf: store.isLeaf,
      Item: simpleItem,
      itemHeight: 28,
      height: 300,
      indent: 20,
      defaultExpandedKeys: ["src", "src/utils"],
    });

    const scrollContainer = tree.querySelector(
      "[data-r-vtree-scroll]",
    ) as HTMLElement;
    mockHeight(scrollContainer, 300);
    document.body.appendChild(tree);
    await waitFor(50);

    const nodeEls = tree.querySelectorAll("[data-r-vtree-node]");
    // src (depth 0), src/index.ts (depth 1), src/utils (depth 1),
    // src/utils/helpers.ts (depth 2), README.md (depth 0)
    expect(nodeEls.length).toBe(5);

    const depths = Array.from(nodeEls).map(
      (el) => (el as HTMLElement).dataset.depth,
    );
    expect(depths).toEqual(["0", "1", "1", "2", "0"]);
  });

  it("calls onExpand and onCollapse", async () => {
    const store = createStore<string>();
    store.setChildren("src", ["src/index.ts"]);
    store.markLeaves("src/index.ts", "README.md");

    const expandedKeys: string[] = [];
    const collapsedKeys: string[] = [];
    tree = virtualTree<string>({
      roots: signal(["src", "README.md"]),
      getChildren: store.getChildren,
      getChildCount: store.getChildCount,
      isLeaf: store.isLeaf,
      Item: simpleItem,
      itemHeight: 28,
      height: 300,
      onExpand: (key) => expandedKeys.push(key),
      onCollapse: (key) => collapsedKeys.push(key),
    });

    const scrollContainer = tree.querySelector(
      "[data-r-vtree-scroll]",
    ) as HTMLElement;
    mockHeight(scrollContainer, 300);
    document.body.appendChild(tree);
    await waitFor(50);

    const firstToggle = tree.querySelector(
      "[data-r-vtree-toggle]",
    ) as HTMLElement;
    firstToggle.click();
    await waitFor(50);
    expect(expandedKeys).toEqual(["src"]);

    firstToggle.click();
    await waitFor(50);
    expect(collapsedKeys).toEqual(["src"]);
  });

  it("supports controlled expandedKeys", async () => {
    const store = createStore<string>();
    store.setChildren("src", ["src/index.ts"]);
    store.markLeaves("src/index.ts", "README.md");

    const expanded = signal(new Set<string>(["src"]));
    tree = virtualTree<string>({
      roots: signal(["src", "README.md"]),
      getChildren: store.getChildren,
      getChildCount: store.getChildCount,
      isLeaf: store.isLeaf,
      Item: simpleItem,
      itemHeight: 28,
      height: 300,
      expandedKeys: expanded,
    });

    const scrollContainer = tree.querySelector(
      "[data-r-vtree-scroll]",
    ) as HTMLElement;
    mockHeight(scrollContainer, 300);
    document.body.appendChild(tree);
    await waitFor(50);

    // Initially expanded
    expect(tree.querySelectorAll("[data-r-vtree-node]").length).toBe(3);

    // Collapse via the controlled signal
    const next = new Set(expanded.get());
    next.delete("src");
    expanded.set(next);
    await waitFor(50);

    expect(tree.querySelectorAll("[data-r-vtree-node]").length).toBe(2);
  });

  it("exposes expandedKeys and requestedKeys on the handle", async () => {
    const store = createStore<string>();
    store.setChildren("root", ["a", "b"]);
    store.markLeaves("a", "b");

    tree = virtualTree<string>({
      roots: signal(["root"]),
      getChildren: store.getChildren,
      getChildCount: store.getChildCount,
      isLeaf: store.isLeaf,
      Item: simpleItem,
      itemHeight: 28,
      height: 300,
      defaultExpandedKeys: ["root"],
    });

    const scrollContainer = tree.querySelector(
      "[data-r-vtree-scroll]",
    ) as HTMLElement;
    mockHeight(scrollContainer, 300);
    document.body.appendChild(tree);
    await waitFor(50);

    // expandedKeys is accessible
    expect(tree.expandedKeys.get().has("root")).toBe(true);

    // requestedKeys includes visible real keys
    const keys = tree.requestedKeys.get();
    expect(keys.has("root")).toBe(true);
    expect(keys.has("a")).toBe(true);
    expect(keys.has("b")).toBe(true);
  });

  it("requestedKeys includes expanded parent when children are unloaded", async () => {
    const store = createStore<string>();
    // "root" is expanded but children not loaded; expect 2 children
    store.setChildCount("root", 2);

    tree = virtualTree<string>({
      roots: signal(["root"]),
      getChildren: store.getChildren,
      getChildCount: store.getChildCount,
      isLeaf: store.isLeaf,
      Item: simpleItem,
      itemHeight: 28,
      height: 300,
      defaultExpandedKeys: ["root"],
    });

    const scrollContainer = tree.querySelector(
      "[data-r-vtree-scroll]",
    ) as HTMLElement;
    mockHeight(scrollContainer, 300);
    document.body.appendChild(tree);
    await waitFor(50);

    // Placeholders should be rendered for unloaded children
    const placeholders = tree.querySelectorAll("[data-r-vtree-placeholder]");
    expect(placeholders.length).toBe(2);

    // requestedKeys includes "root" (parent with unloaded children)
    const keys = tree.requestedKeys.get();
    expect(keys.has("root")).toBe(true);

    // Now load children
    store.setChildren("root", ["child1", "child2"]);
    store.markLeaves("child1", "child2");
    await waitFor(50);

    // Placeholders replaced by real nodes
    const placeholdersAfter = tree.querySelectorAll(
      "[data-r-vtree-placeholder]",
    );
    expect(placeholdersAfter.length).toBe(0);

    // requestedKeys now includes the child keys
    const keysAfter = tree.requestedKeys.get();
    expect(keysAfter.has("root")).toBe(true);
    expect(keysAfter.has("child1")).toBe(true);
    expect(keysAfter.has("child2")).toBe(true);
  });

  it("renders placeholders with custom renderPlaceholder", async () => {
    const store = createStore<string>();
    store.setChildCount("root", 3);

    const placeholderTexts: string[] = [];
    tree = virtualTree<string>({
      roots: signal(["root"]),
      getChildren: store.getChildren,
      getChildCount: store.getChildCount,
      isLeaf: store.isLeaf,
      Item: simpleItem,
      itemHeight: 28,
      height: 300,
      defaultExpandedKeys: ["root"],
      renderPlaceholder: (parentKey, index) => {
        const el = document.createElement("span");
        el.textContent = `loading ${parentKey}[${index}]`;
        placeholderTexts.push(el.textContent ?? "");
        return el;
      },
    });

    const scrollContainer = tree.querySelector(
      "[data-r-vtree-scroll]",
    ) as HTMLElement;
    mockHeight(scrollContainer, 300);
    document.body.appendChild(tree);
    await waitFor(50);

    const placeholders = tree.querySelectorAll("[data-r-vtree-placeholder]");
    expect(placeholders.length).toBe(3);
    expect(placeholderTexts).toEqual([
      "loading root[0]",
      "loading root[1]",
      "loading root[2]",
    ]);
  });

  it("virtualizes large trees", async () => {
    const store = createStore<string>();
    // 1000 roots, each with 5 leaf children
    const roots: string[] = [];
    for (let i = 0; i < 1000; i++) {
      const key = `root-${i}`;
      roots.push(key);
      const kids = Array.from({ length: 5 }, (_, j) => `${key}-${j}`);
      store.setChildren(key, kids);
      store.markLeaves(...kids);
    }

    tree = virtualTree<string>({
      roots: signal(roots),
      getChildren: store.getChildren,
      getChildCount: store.getChildCount,
      isLeaf: store.isLeaf,
      Item: simpleItem,
      itemHeight: 28,
      height: 300,
    });

    const scrollContainer = tree.querySelector(
      "[data-r-vtree-scroll]",
    ) as HTMLElement;
    mockHeight(scrollContainer, 300);
    document.body.appendChild(tree);
    await waitFor(50);

    // Collapsed: 1000 roots, but only ~11 visible (300/28 + overscan)
    const nodeEls = tree.querySelectorAll("[data-r-vtree-node]");
    expect(nodeEls.length).toBeLessThan(30);
    expect(nodeEls.length).toBeGreaterThan(0);
  });

  it("scrollToNode scrolls to the correct position", async () => {
    const store = createStore<string>();
    const roots: string[] = [];
    for (let i = 0; i < 100; i++) {
      const key = `n-${i}`;
      roots.push(key);
      store.markLeaves(key);
    }

    tree = virtualTree<string>({
      roots: signal(roots),
      getChildren: store.getChildren,
      getChildCount: store.getChildCount,
      isLeaf: store.isLeaf,
      Item: simpleItem,
      itemHeight: 28,
      height: 300,
    });

    const scrollContainer = tree.querySelector(
      "[data-r-vtree-scroll]",
    ) as HTMLElement;
    mockHeight(scrollContainer, 300);
    document.body.appendChild(tree);
    await waitFor(50);

    tree.scrollToNode("n-50");
    // 50 * 28 = 1400
    expect(scrollContainer.scrollTop).toBe(1400);
  });

  it("updates visible nodes on scroll", async () => {
    const store = createStore<string>();
    const roots: string[] = [];
    for (let i = 0; i < 100; i++) {
      const key = `n-${i}`;
      roots.push(key);
      store.markLeaves(key);
    }

    tree = virtualTree<string>({
      roots: signal(roots),
      getChildren: store.getChildren,
      getChildCount: store.getChildCount,
      isLeaf: store.isLeaf,
      Item: simpleItem,
      itemHeight: 28,
      height: 300,
    });

    const scrollContainer = tree.querySelector(
      "[data-r-vtree-scroll]",
    ) as HTMLElement;
    mockHeight(scrollContainer, 300);
    document.body.appendChild(tree);
    await waitFor(50);

    // Initial: first few nodes
    let nodeEls = tree.querySelectorAll("[data-r-vtree-node]");
    expect(nodeEls.length).toBeGreaterThan(0);
    expect(nodeEls[0].textContent).toContain("n-0");

    // Scroll to node 50 (50 * 28 = 1400)
    triggerScroll(scrollContainer, 1400);
    await waitFor(50);

    nodeEls = tree.querySelectorAll("[data-r-vtree-node]");
    expect(nodeEls.length).toBeGreaterThan(0);
    // First visible node should be around n-47 (50 - overscan 3)
    expect(nodeEls[0].textContent).toMatch(/n-4\d/);
  });

  it("expand and collapse via handle API", async () => {
    const store = createStore<string>();
    store.setChildren("src", ["src/index.ts"]);
    store.markLeaves("src/index.ts", "README.md");

    tree = virtualTree<string>({
      roots: signal(["src", "README.md"]),
      getChildren: store.getChildren,
      getChildCount: store.getChildCount,
      isLeaf: store.isLeaf,
      Item: simpleItem,
      itemHeight: 28,
      height: 300,
    });

    const scrollContainer = tree.querySelector(
      "[data-r-vtree-scroll]",
    ) as HTMLElement;
    mockHeight(scrollContainer, 300);
    document.body.appendChild(tree);
    await waitFor(50);

    expect(tree.querySelectorAll("[data-r-vtree-node]").length).toBe(2);

    tree.expand("src");
    await waitFor(50);
    expect(tree.isExpanded("src")).toBe(true);
    expect(tree.querySelectorAll("[data-r-vtree-node]").length).toBe(3);

    tree.collapse("src");
    await waitFor(50);
    expect(tree.isExpanded("src")).toBe(false);
    expect(tree.querySelectorAll("[data-r-vtree-node]").length).toBe(2);
  });

  it("does not inspect node data — Item receives only the key", async () => {
    const store = createStore<string>();
    store.setChildren("root", ["child"]);
    store.markLeaves("child");

    const receivedKeys: string[] = [];
    tree = virtualTree<string>({
      roots: signal(["root"]),
      getChildren: store.getChildren,
      getChildCount: store.getChildCount,
      isLeaf: store.isLeaf,
      Item: (key) => {
        receivedKeys.push(key);
        const el = document.createElement("span");
        el.textContent = `item:${key}`;
        return el;
      },
      itemHeight: 28,
      height: 300,
      defaultExpandedKeys: ["root"],
    });

    const scrollContainer = tree.querySelector(
      "[data-r-vtree-scroll]",
    ) as HTMLElement;
    mockHeight(scrollContainer, 300);
    document.body.appendChild(tree);
    await waitFor(50);

    // Item was called for "root" and "child" — keys only, no node objects
    expect(receivedKeys).toContain("root");
    expect(receivedKeys).toContain("child");
  });

  it("re-flattens when external children store updates", async () => {
    const store = createStore<string>();
    // Initially "root" has no loaded children and no expected count
    tree = virtualTree<string>({
      roots: signal(["root"]),
      getChildren: store.getChildren,
      getChildCount: store.getChildCount,
      isLeaf: store.isLeaf,
      Item: simpleItem,
      itemHeight: 28,
      height: 300,
      defaultExpandedKeys: ["root"],
    });

    const scrollContainer = tree.querySelector(
      "[data-r-vtree-scroll]",
    ) as HTMLElement;
    mockHeight(scrollContainer, 300);
    document.body.appendChild(tree);
    await waitFor(50);

    // Expanded but no children loaded: just "root" itself
    expect(tree.querySelectorAll("[data-r-vtree-node]").length).toBe(1);
    expect(tree.querySelectorAll("[data-r-vtree-placeholder]").length).toBe(0);

    // Load children reactively
    store.setChildren("root", ["a", "b"]);
    store.markLeaves("a", "b");
    await waitFor(50);

    // Now "root" + 2 children
    expect(tree.querySelectorAll("[data-r-vtree-node]").length).toBe(3);
  });

  it("uses custom renderToggle", async () => {
    const store = createStore<string>();
    store.setChildren("root", ["a"]);
    store.markLeaves("a");

    tree = virtualTree<string>({
      roots: signal(["root"]),
      getChildren: store.getChildren,
      getChildCount: store.getChildCount,
      isLeaf: store.isLeaf,
      Item: simpleItem,
      itemHeight: 28,
      height: 300,
      defaultExpandedKeys: ["root"],
      renderToggle: (ctx) => {
        const el = document.createElement("span");
        el.textContent = ctx.isExpanded ? "-" : "+";
        el.className = "custom-toggle";
        return el;
      },
    });

    const scrollContainer = tree.querySelector(
      "[data-r-vtree-scroll]",
    ) as HTMLElement;
    mockHeight(scrollContainer, 300);
    document.body.appendChild(tree);
    await waitFor(50);

    const toggle = tree.querySelector(".custom-toggle") as HTMLElement;
    expect(toggle).toBeTruthy();
    expect(toggle.textContent).toBe("-");
  });
});
