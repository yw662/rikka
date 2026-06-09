import { describe, it, expect, beforeEach, afterEach } from "@rstest/core";
import {
  getDomPath,
  resolveInstance,
  listInstances,
  registerInstance,
  unregisterInstance,
  isWebMCPSupported,
  registerToolsToWebMCP,
  provideInstanceContext,
} from "../src/webmcp.js";
import type { ToolDefinition, ToolContextMapping } from "../src/webmcp.js";
import { signal, effect } from "@takanashi/rikka-signal";
import { defineElement, NumberAttr, StringAttr } from "../src/defineElement.js";

// ---------------------------------------------------------------------------
// getDomPath
// ---------------------------------------------------------------------------

describe("getDomPath", () => {
  it("returns a path with the element tag name", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const path = getDomPath(el);
    expect(path).toContain("div");
    el.remove();
  });

  it("includes id in the path", () => {
    const el = document.createElement("div");
    el.id = "my-id";
    document.body.appendChild(el);
    const path = getDomPath(el);
    expect(path).toContain("#my-id");
    el.remove();
  });

  it("includes aria-label in the path", () => {
    const el = document.createElement("section");
    el.setAttribute("aria-label", "Shopping Cart");
    document.body.appendChild(el);
    const path = getDomPath(el);
    expect(path).toContain('[aria-label="Shopping Cart"]');
    el.remove();
  });

  it("includes role in the path", () => {
    const el = document.createElement("div");
    el.setAttribute("role", "main");
    document.body.appendChild(el);
    const path = getDomPath(el);
    expect(path).toContain('[role="main"]');
    el.remove();
  });

  it("includes nth-of-type for sibling disambiguation", () => {
    const parent = document.createElement("div");
    parent.id = "parent";
    const child1 = document.createElement("span");
    const child2 = document.createElement("span");
    parent.appendChild(child1);
    parent.appendChild(child2);
    document.body.appendChild(parent);

    const path1 = getDomPath(child1);
    const path2 = getDomPath(child2);
    expect(path1).toContain(":nth-of-type(1)");
    expect(path2).toContain(":nth-of-type(2)");

    parent.remove();
  });

  it("does not include nth-of-type for a single child", () => {
    const parent = document.createElement("div");
    parent.id = "parent";
    const child = document.createElement("span");
    parent.appendChild(child);
    document.body.appendChild(parent);

    const path = getDomPath(child);
    expect(path).not.toContain(":nth-of-type");

    parent.remove();
  });

  it("builds a full path from element to body", () => {
    const outer = document.createElement("main");
    outer.id = "outer";
    const inner = document.createElement("section");
    inner.setAttribute("aria-label", "Content");
    const target = document.createElement("rikka-counter");
    inner.appendChild(target);
    outer.appendChild(target);
    document.body.appendChild(outer);

    const path = getDomPath(target);
    expect(path).toContain("rikka-counter");
    expect(path).toContain("#outer");

    outer.remove();
  });
});

// ---------------------------------------------------------------------------
// Instance registry
// ---------------------------------------------------------------------------

describe("instance registry", () => {
  const testTag = `test-registry-${Date.now()}`;

  afterEach(() => {
    // Clean up any registered instances
    const instances = listInstances(testTag);
    for (const inst of instances) {
      const el = document.querySelector(`[data-test-reg="${testTag}"]`);
      el?.remove();
    }
  });

  it("registerInstance returns a DOM path", () => {
    const el = document.createElement("div");
    el.id = `reg-test-1`;
    document.body.appendChild(el);
    const path = registerInstance(testTag, el);
    expect(path).toBeTruthy();
    expect(typeof path).toBe("string");
    unregisterInstance(testTag, el);
    el.remove();
  });

  it("resolveInstance returns null when no instances are registered", () => {
    expect(resolveInstance("nonexistent-tag")).toBeNull();
  });

  it("resolveInstance returns the instance when only one exists", () => {
    const el = document.createElement("div");
    el.id = "single-instance";
    document.body.appendChild(el);
    registerInstance(testTag, el);

    const result = resolveInstance(testTag);
    expect(result).toBe(el);

    unregisterInstance(testTag, el);
    el.remove();
  });

  it("resolveInstance returns null when multiple instances exist and no target specified", () => {
    const el1 = document.createElement("div");
    el1.id = "multi-1";
    const el2 = document.createElement("div");
    el2.id = "multi-2";
    document.body.appendChild(el1);
    document.body.appendChild(el2);
    const path1 = registerInstance(testTag, el1);
    registerInstance(testTag, el2);

    const result = resolveInstance(testTag);
    // Multiple instances without target → null
    expect(result).toBeNull();

    unregisterInstance(testTag, el1);
    unregisterInstance(testTag, el2);
    el1.remove();
    el2.remove();
  });

  it("resolveInstance finds instance by DOM path target", () => {
    const el1 = document.createElement("div");
    el1.id = "target-1";
    const el2 = document.createElement("div");
    el2.id = "target-2";
    document.body.appendChild(el1);
    document.body.appendChild(el2);
    const path1 = registerInstance(testTag, el1);
    registerInstance(testTag, el2);

    const result = resolveInstance(testTag, path1);
    expect(result).toBe(el1);

    unregisterInstance(testTag, el1);
    unregisterInstance(testTag, el2);
    el1.remove();
    el2.remove();
  });

  it("resolveInstance returns null for a disconnected element", () => {
    const el = document.createElement("div");
    el.id = "disconnected";
    document.body.appendChild(el);
    registerInstance(testTag, el);
    el.remove();

    const result = resolveInstance(testTag);
    expect(result).toBeNull();

    unregisterInstance(testTag, el);
  });

  it("listInstances returns all connected instances", () => {
    const el1 = document.createElement("div");
    el1.id = "list-1";
    el1.setAttribute("aria-label", "First");
    const el2 = document.createElement("div");
    el2.id = "list-2";
    el2.setAttribute("aria-label", "Second");
    document.body.appendChild(el1);
    document.body.appendChild(el2);
    registerInstance(testTag, el1);
    registerInstance(testTag, el2);

    const instances = listInstances(testTag);
    expect(instances.length).toBe(2);
    expect(instances.some((i) => i.id === "list-1")).toBe(true);
    expect(instances.some((i) => i.id === "list-2")).toBe(true);

    unregisterInstance(testTag, el1);
    unregisterInstance(testTag, el2);
    el1.remove();
    el2.remove();
  });

  it("listInstances excludes disconnected elements", () => {
    const el1 = document.createElement("div");
    el1.id = "connected";
    const el2 = document.createElement("div");
    el2.id = "disconnected-2";
    document.body.appendChild(el1);
    document.body.appendChild(el2);
    registerInstance(testTag, el1);
    registerInstance(testTag, el2);
    el2.remove();

    const instances = listInstances(testTag);
    expect(instances.length).toBe(1);
    expect(instances[0].id).toBe("connected");

    unregisterInstance(testTag, el1);
    unregisterInstance(testTag, el2);
    el1.remove();
  });
});

// ---------------------------------------------------------------------------
// isWebMCPSupported
// ---------------------------------------------------------------------------

describe("isWebMCPSupported", () => {
  it("returns false in happy-dom (no WebMCP)", () => {
    expect(isWebMCPSupported()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// registerToolsToWebMCP (no-op when WebMCP not available)
// ---------------------------------------------------------------------------

describe("registerToolsToWebMCP", () => {
  it("does not throw when WebMCP is not available", () => {
    const tools: Record<string, ToolDefinition> = {
      increment: {
        description: "Increment",
        execute: async () => ({ content: [{ type: "text", text: "ok" }] }),
      },
    };
    expect(() => registerToolsToWebMCP("test-tag", tools)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// provideInstanceContext (no-op when WebMCP not available)
// ---------------------------------------------------------------------------

describe("provideInstanceContext", () => {
  it("returns a no-op dispose function when WebMCP is not available", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const toolContext: ToolContextMapping = { value: "$count" };
    const dispose = provideInstanceContext(
      "test-tag",
      el,
      "div",
      toolContext,
      (fn) => effect(fn),
    );
    expect(typeof dispose).toBe("function");
    dispose();
    el.remove();
  });

  it("returns a no-op dispose when toolContext is empty", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const dispose = provideInstanceContext(
      "test-tag",
      el,
      "div",
      {},
      (fn) => effect(fn),
    );
    expect(typeof dispose).toBe("function");
    dispose();
    el.remove();
  });

  it("returns a no-op dispose when toolContext is undefined", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const dispose = provideInstanceContext(
      "test-tag",
      el,
      "div",
      undefined,
      (fn) => effect(fn),
    );
    expect(typeof dispose).toBe("function");
    dispose();
    el.remove();
  });
});

// ---------------------------------------------------------------------------
// defineElement with tools config (integration)
// ---------------------------------------------------------------------------

describe("defineElement with tools config", () => {
  it("accepts tools config without throwing", async () => {
    const tag = `test-tools-${Date.now()}`;
    expect(() =>
      defineElement(tag, {
        attributes: { count: NumberAttr },
        tools: {
          increment: {
            description: "Increment the counter",
            inputSchema: {
              type: "object",
              properties: { amount: { type: "number" } },
            },
            execute: async (instance, { amount = 1 }) => {
              (instance as any).count += amount;
              return { content: [{ type: "text", text: `${(instance as any).count}` }] };
            },
          },
        },
      }),
    ).not.toThrow();
  });

  it("accepts toolContext config without throwing", async () => {
    const tag = `test-toolctx-${Date.now()}`;
    expect(() =>
      defineElement(tag, {
        attributes: { count: NumberAttr, label: StringAttr },
        toolContext: {
          label: "$label",
          value: "$count",
        },
      }),
    ).not.toThrow();
  });

  it("element with tools config connects and disconnects without errors", async () => {
    const tag = `test-tools-lifecycle-${Date.now()}`;
    defineElement(tag, {
      attributes: { count: NumberAttr },
      tools: {
        increment: {
          description: "Increment",
          execute: async (instance) => {
            return { content: [{ type: "text", text: "ok" }] };
          },
        },
      },
      toolContext: { value: "$count" },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as any;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(el.count).toBeNaN(); // NumberAttr default
    el.count = 5;
    expect(el.count).toBe(5);

    el.remove();
  });

  it("multiple instances of the same element with tools work correctly", async () => {
    const tag = `test-tools-multi-${Date.now()}`;
    defineElement(tag, {
      attributes: { count: { toProp: Number, default: 0 } },
      tools: {
        increment: {
          description: "Increment",
          execute: async (instance, { amount = 1 }: any) => {
            (instance as any).count += amount;
            return { content: [{ type: "text", text: `${(instance as any).count}` }] };
          },
        },
      },
      toolContext: { value: "$count" },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el1 = document.createElement(tag) as any;
    el1.id = "counter-1";
    const el2 = document.createElement(tag) as any;
    el2.id = "counter-2";
    document.body.appendChild(el1);
    document.body.appendChild(el2);
    await new Promise((r) => setTimeout(r, 10));

    // Each instance has independent state
    el1.count = 10;
    el2.count = 20;
    expect(el1.count).toBe(10);
    expect(el2.count).toBe(20);

    el1.remove();
    el2.remove();
  });

  it("element without tools config works as before", async () => {
    const tag = `test-no-tools-${Date.now()}`;
    defineElement(tag, {
      attributes: { value: StringAttr },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as any;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    el.value = "hello";
    expect(el.value).toBe("hello");

    el.remove();
  });
});
