import { describe, it, expect, rs } from "@rstest/core";
import { css, span, input, h } from "@takanashi/rikka-dom";
import { toCamelCase, toPascalCase } from "../src/utils.js";
import { signal as createSignal } from "@takanashi/rikka-signal";

describe("css", () => {
  it("creates a CSSStyleSheet from a template string", () => {
    const sheet = css`
      :host {
        color: red;
      }
    `;
    expect(sheet instanceof CSSStyleSheet).toBe(true);
  });

  it("creates an empty stylesheet", () => {
    const sheet = css``;
    expect(sheet instanceof CSSStyleSheet).toBe(true);
  });
});

describe("toPascalCase", () => {
  it("converts kebab-case to PascalCase", () => {
    expect(toPascalCase("my-element")).toBe("MyElement");
  });

  it("converts single word to PascalCase", () => {
    expect(toPascalCase("count")).toBe("Count");
  });

  it("handles already PascalCase", () => {
    expect(toPascalCase("MyElement")).toBe("MyElement");
  });
});

describe("toCamelCase", () => {
  it("converts kebab-case to camelCase", () => {
    expect(toCamelCase("value-changed")).toBe("valueChanged");
  });

  it("converts single word to lowercase", () => {
    expect(toCamelCase("change")).toBe("change");
  });

  it("handles multi-segment kebab-case", () => {
    expect(toCamelCase("my-custom-event")).toBe("myCustomEvent");
  });
});

describe("defineElement", () => {
  it("registers a custom element with no config", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-basic-${Date.now()}`;

    const TestEl = defineElement(tag).build();

    await new Promise((r) => setTimeout(r, 20));
    expect(customElements.get(tag)).toBe(TestEl);
  });
});

describe("defineElement attributes (Number)", () => {
  it("Number creates observedAttributes", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-num-obs-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: { count: NumberAttr },
    });

    await new Promise((r) => setTimeout(r, 20));
    expect(TestEl.observedAttributes).toContain("count");
  });

  it("Number creates typed getter/setter", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-num-rw-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: { count: NumberAttr },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(el.count).toBeNaN();

    el.count = 5;
    expect(el.count).toBe(5);
    expect(el.getAttribute("count")).toBe("5");

    el.setAttribute("count", "10");
    expect(el.count).toBe(10);

    el.remove();
  });

  it("Number(undefined) returns NaN for missing attribute", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-num-nan-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: { count: NumberAttr },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(Number.isNaN(el.count)).toBe(true);

    el.remove();
  });

  it("Number with setAttribute syncs to signal", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-num-sync-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: { count: NumberAttr },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    el.setAttribute("count", "42");
    expect(el.count).toBe(42);
    expect(el.$count.get()).toBe(42);

    el.remove();
  });
});

describe("defineElement attributes (String)", () => {
  it("String creates string attribute", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-str-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: { name: StringAttr },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(el.name).toBe("");

    el.name = "hello";
    expect(el.name).toBe("hello");
    expect(el.getAttribute("name")).toBe("hello");

    el.setAttribute("name", "world");
    expect(el.name).toBe("world");

    el.remove();
  });
});

describe("defineElement attributes (Boolean)", () => {
  it("Boolean creates boolean attribute", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-bool-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: { active: { toProp: Boolean } },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(el.active).toBe(false);

    el.active = true;
    expect(el.getAttribute("active")).toBe("true");

    el.active = false;
    expect(el.getAttribute("active")).toBe("false");

    el.remove();
  });

  it("BooleanAttr spec parses 'true' as true, others as false; serializes true as '' (present), false as undefined (removed)", async () => {
    const { defineElement, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-boolattr-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: { active: BooleanAttr },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as any;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(el.active).toBe(false);
    expect(el.hasAttribute("active")).toBe(false);

    el.active = true;
    expect(el.getAttribute("active")).toBe("");

    el.active = false;
    expect(el.hasAttribute("active")).toBe(false);

    el.remove();
  });
});

describe("defineElement attributes (custom transform function)", () => {
  it("bare transform function works", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-fn-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: {
        count: { toProp: (v) => (v !== undefined ? Number(v) : 0) },
      },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(el.count).toBe(0);
    el.count = 5;
    expect(el.getAttribute("count")).toBe("5");

    el.remove();
  });

  it("object form with type works", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-custom-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: {
        items: {
          toProp: (v) => (v ? v.split(",") : ["default"]),
        },
      },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(el.items).toEqual(["default"]);

    el.items = ["x", "y", "z"];
    expect(el.getAttribute("items")).toBe("x,y,z");

    el.setAttribute("items", "1,2,3");
    expect(el.items).toEqual(["1", "2", "3"]);

    el.remove();
  });

  it("default value is used when attribute is missing", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-default-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: {
        count: { toProp: Number, default: 42 },
      },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(el.count).toBe(42);
    expect(el.getAttribute("count")).toBeNull();

    el.count = 5;
    expect(el.count).toBe(5);
    expect(el.getAttribute("count")).toBe("5");

    el.remove();
  });

  it("default value is overridden by attribute", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-default-attr-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: {
        count: { toProp: Number, default: 42 },
      },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    el.setAttribute("count", "100");
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(el.count).toBe(100);

    el.remove();
  });

  it("default value is restored after removeAttribute", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-default-remove-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: {
        count: { toProp: Number, default: 42 },
      },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(el.count).toBe(42);

    el.count = 5;
    expect(el.count).toBe(5);

    el.removeAttribute("count");
    await new Promise((r) => setTimeout(r, 10));
    expect(el.count).toBe(42);

    el.remove();
  });
});

describe("defineElement attributes ($signal accessors)", () => {
  it("creates $signal accessors", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-sig-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: { count: NumberAttr },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    const sig = el.$count;
    expect(sig).toBeTruthy();
    expect(typeof sig.get).toBe("function");
    expect(typeof sig.set).toBe("function");

    el.remove();
  });

  it("attributeChangedCallback syncs to signal", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-sync-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: { value: NumberAttr },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    el.setAttribute("value", "99");
    expect(el.value).toBe(99);
    expect(el.$value.get()).toBe(99);

    el.remove();
  });

  it("removing attribute calls transform with undefined", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-attrrm-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: { count: { toProp: (v) => (v !== undefined ? Number(v) : 0) } },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    el.count = 5;
    expect(el.count).toBe(5);

    el.removeAttribute("count");
    expect(el.count).toBe(0);

    el.remove();
  });
});

describe("defineElement events", () => {
  it("Number creates dispatch method", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-evt-num-${Date.now()}`;

    const TestEl = defineElement(tag, {
      events: { change: Number },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    expect(typeof el.dispatchChange).toBe("function");
  });

  it("dispatches and receives events via addEventListener", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-evt-disp-${Date.now()}`;

    const TestEl = defineElement(tag, {
      events: { change: Number },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);

    const handler = rs.fn();
    el.addEventListener("change", handler);
    el.dispatchChange(42);
    expect(handler).toHaveBeenCalledTimes(1);

    el.remove();
  });

  it("native event onchange property works", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-evt-native-${Date.now()}`;

    const TestEl = defineElement(tag, {
      events: { change: Number },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);

    const handler = rs.fn();
    el.onchange = handler;
    el.dispatchChange(42);
    expect(handler).toHaveBeenCalledTimes(1);

    el.onchange = null;
    el.dispatchChange(99);
    expect(handler).toHaveBeenCalledTimes(1);

    el.remove();
  });

  it("native event onchange receives correct detail", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-evt-native-detail-${Date.now()}`;

    const TestEl = defineElement(tag, {
      events: { change: Number },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);

    let received: CustomEvent<number> | null = null;
    el.onchange = (ev: CustomEvent<number>) => {
      received = ev;
    };
    el.dispatchChange(42);
    expect(received).toBeTruthy();
    expect(received!.detail).toBe(42);

    el.remove();
  });

  it("custom event onmove property works", async () => {
    const { defineElement, event, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-evt-custom-prop-${Date.now()}`;

    interface Payload {
      x: number;
      y: number;
    }

    const TestEl = defineElement(tag, {
      events: { move: event<Payload>() },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    let onmoveCallCount = 0;
    let receivedDetail: any = null;
    (el as any).onmove = (ev: CustomEvent<Payload>) => {
      onmoveCallCount++;
      receivedDetail = ev.detail;
    };

    el.dispatchEvent(new CustomEvent("move", { detail: { x: 10, y: 20 } }));
    expect(onmoveCallCount).toBe(1);
    expect(receivedDetail).toEqual({ x: 10, y: 20 });

    (el as any).onmove = null;
    el.dispatchEvent(new CustomEvent("move", { detail: { x: 30, y: 40 } }));
    expect(onmoveCallCount).toBe(1);

    el.remove();
  });

  it("custom event onmove receives correct detail", async () => {
    const { defineElement, event, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-evt-custom-detail-${Date.now()}`;

    interface Payload {
      x: number;
      y: number;
    }

    const TestEl = defineElement(tag, {
      events: { move: event<Payload>() },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);

    let received: CustomEvent<Payload> | null = null;
    (el as any).onmove = (ev: CustomEvent<Payload>) => {
      received = ev;
    };
    el.dispatchMove({ x: 10, y: 20 });
    expect(received).toBeTruthy();
    expect(received!.detail).toEqual({ x: 10, y: 20 });

    el.remove();
  });

  it("native events do not register extra listeners", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-evt-native-noextra-${Date.now()}`;

    const TestEl = defineElement(tag, {
      events: { change: Number },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    let changeListenerCount = 0;
    const origAddEventListener = el.addEventListener.bind(el);
    (el as any).addEventListener = function (
      type: string,
      listener: any,
      options?: any,
    ) {
      if (type === "change") changeListenerCount++;
      return origAddEventListener(type, listener, options);
    };

    el.onchange = () => {};
    expect(changeListenerCount).toBe(0);

    el.remove();
  });

  it("custom events register addEventListener via setter", async () => {
    const { defineElement, event, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-evt-custom-addlistener-${Date.now()}`;

    const TestEl = defineElement(tag, {
      events: { move: event<{ x: number; y: number }>() },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    let moveListenerCount = 0;
    const origAddEventListener = el.addEventListener.bind(el);
    (el as any).addEventListener = function (
      type: string,
      listener: any,
      options?: any,
    ) {
      if (type === "move") moveListenerCount++;
      return origAddEventListener(type, listener, options);
    };

    (el as any).onmove = () => {};
    expect(moveListenerCount).toBe(1);

    el.remove();
  });

  it("replacing onmove removes old listener and adds new one", async () => {
    const { defineElement, event, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-evt-replace-${Date.now()}`;

    const TestEl = defineElement(tag, {
      events: { move: event<{ x: number; y: number }>() },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    const handler1 = rs.fn();
    const handler2 = rs.fn();
    (el as any).onmove = handler1;
    el.dispatchMove({ x: 1, y: 2 });
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(0);

    (el as any).onmove = handler2;
    el.dispatchMove({ x: 3, y: 4 });
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);

    el.remove();
  });

  it("onmove getter returns the wrapper function", async () => {
    const { defineElement, event, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-evt-getter-${Date.now()}`;

    const TestEl = defineElement(tag, {
      events: { move: event<{ x: number; y: number }>() },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect((el as any).onmove).toBeNull();

    const handler = () => {};
    (el as any).onmove = handler;
    expect(typeof (el as any).onmove).toBe("function");

    (el as any).onmove = null;
    expect((el as any).onmove).toBeNull();

    el.remove();
  });

  it("dispatchXxx with options", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-evt-options-${Date.now()}`;

    const TestEl = defineElement(tag, {
      events: { change: Number },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);

    let receivedEvent: Event | null = null;
    el.addEventListener("change", (ev) => {
      receivedEvent = ev;
    });
    el.dispatchChange(42, { bubbles: true, composed: true });
    expect(receivedEvent).toBeTruthy();
    expect((receivedEvent! as CustomEvent).detail).toBe(42);
    expect(receivedEvent!.bubbles).toBe(true);
    expect(receivedEvent!.composed).toBe(true);

    el.remove();
  });

  it("void event dispatch works without detail", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-evt-void-dispatch-${Date.now()}`;

    const TestEl = defineElement(tag, {
      events: { reset: undefined },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);

    let receivedDetail: unknown = "NOT_CALLED";
    el.addEventListener("reset", (ev: Event) => {
      receivedDetail = (ev as CustomEvent).detail;
    });
    el.dispatchReset();
    expect(receivedDetail).toBeNull();

    el.remove();
  });

  it("multiple events on same element work independently", async () => {
    const { defineElement, event, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-evt-multi-${Date.now()}`;

    const TestEl = defineElement(tag, {
      events: {
        change: Number,
        move: event<{ x: number; y: number }>(),
      },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    const changeHandler = rs.fn();
    const moveHandler = rs.fn();
    el.onchange = changeHandler;
    (el as any).onmove = moveHandler;

    el.dispatchChange(42);
    expect(changeHandler).toHaveBeenCalledTimes(1);
    expect(moveHandler).toHaveBeenCalledTimes(0);

    el.dispatchMove({ x: 1, y: 2 });
    expect(changeHandler).toHaveBeenCalledTimes(1);
    expect(moveHandler).toHaveBeenCalledTimes(1);

    el.remove();
  });

  it("setting onmove to null removes the listener", async () => {
    const { defineElement, event, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-evt-null-${Date.now()}`;

    const TestEl = defineElement(tag, {
      events: { move: event<{ x: number; y: number }>() },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);

    const handler = rs.fn();
    (el as any).onmove = handler;
    el.dispatchMove({ x: 1, y: 2 });
    expect(handler).toHaveBeenCalledTimes(1);

    (el as any).onmove = null;
    el.dispatchMove({ x: 3, y: 4 });
    expect(handler).toHaveBeenCalledTimes(1);

    el.remove();
  });

  it("kebab-case custom event works", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-evt-kebab-custom-${Date.now()}`;

    const TestEl = defineElement(tag, {
      events: { "value-changed": String },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);

    const handler = rs.fn();
    (el as any).onvalueChanged = handler;
    el.dispatchValueChanged("hello");
    expect(handler).toHaveBeenCalledTimes(1);

    el.remove();
  });

  it("undefined creates void event", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-evt-void-${Date.now()}`;

    const TestEl = defineElement(tag, {
      events: { reset: undefined },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    expect(typeof el.dispatchReset).toBe("function");
  });

  it("String creates string event", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-evt-str-${Date.now()}`;

    const TestEl = defineElement(tag, {
      events: { "value-changed": String },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    expect(typeof el.dispatchValueChanged).toBe("function");
  });

  it("event<T>() for custom types", async () => {
    const { defineElement, event, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-evt-custom-${Date.now()}`;

    interface Payload {
      x: number;
      y: number;
    }

    const TestEl = defineElement(tag, {
      events: { move: event<Payload>() },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    expect(typeof el.dispatchMove).toBe("function");
  });
});

describe("defineElement shadow & styles", () => {
  it("creates shadow root by default", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-shadow-${Date.now()}`;

    const TestEl = defineElement(tag).build();

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));
    expect(el.shadowRoot).toBeTruthy();
    el.remove();
  });

  it("adopts styles into shadow root", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-styles-${Date.now()}`;

    const sheet = css`
      :host {
        color: red;
      }
    `;

    const TestEl = defineElement(tag, { styles: sheet });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));
    expect(el.shadowRoot).toBeTruthy();
    expect(el.shadowRoot.adoptedStyleSheets.length).toBe(1);
    el.remove();
  });

  it("adopts multiple styles", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-multistyle-${Date.now()}`;

    const TestEl = defineElement(tag, {
      styles: [
        css`
          :host {
            color: red;
          }
        `,
        css`
          :host {
            background: blue;
          }
        `,
      ],
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));
    expect(el.shadowRoot.adoptedStyleSheets.length).toBe(2);
    el.remove();
  });

  it("does not create shadow root when shadow: false", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-noshadow-${Date.now()}`;

    const TestEl = defineElement(tag, { shadow: false });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));
    expect(el.shadowRoot).toBeNull();
    el.remove();
  });
});

describe("defineElement combined", () => {
  it("works with attributes + events + shadow + styles", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-combined-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: { count: NumberAttr },
      events: { change: Number },
      styles: css`
        :host {
          display: block;
        }
      `,
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(typeof el.dispatchChange).toBe("function");
    expect(el.$count).toBeTruthy();
    expect(el.shadowRoot).toBeTruthy();
    expect(el.shadowRoot.adoptedStyleSheets.length).toBe(1);
    el.count = 5;
    el.dispatchChange(5);

    el.remove();
  });

  it("mixed attribute spec styles work together", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-mixed-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: {
        count: NumberAttr,
        name: StringAttr,
        active: { toProp: Boolean },
        items: {
          toProp: (v) => (v ? v.split(",") : []),
        },
      },
      events: {
        change: Number,
      },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    el.count = 5;
    expect(el.getAttribute("count")).toBe("5");

    el.name = "hello";
    expect(el.getAttribute("name")).toBe("hello");

    expect(el.active).toBe(false);

    expect(el.items).toEqual([]);
    el.items = ["a", "b"];
    expect(el.getAttribute("items")).toBe("a,b");

    el.remove();
  });
});

describe("defineElement render function", () => {
  it("render function receives element as this", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-render-this-${Date.now()}`;
    let thisValue: any = null;

    const TestEl = defineElement(tag, {
      render() {
        thisValue = this;
        return span();
      },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(thisValue).toBe(el);
    el.remove();
  });

  it("render function output is inserted into shadow root", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-render-output-${Date.now()}`;

    const TestEl = defineElement(tag, {
      render() {
        return span("hello from render");
      },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(el.shadowRoot?.textContent).toContain("hello from render");
    el.remove();
  });

  it("render function can access attributes via this", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-render-attr-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: { label: StringAttr },
      render() {
        return span(this.label);
      },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    el.setAttribute("label", "test-label");
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(el.shadowRoot?.textContent).toContain("test-label");
    el.remove();
  });
});

describe("defineElement slot binding ({{name}})", () => {
  it("text slot with attribute signal updates reactively", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-slot-text-${Date.now()}`;

    const tpl = document.createElement("template");
    tpl.innerHTML = `<span>{{name}}</span>`;

    const TestEl = defineElement(tag, {
      attributes: { name: StringAttr },
      template: tpl,
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    el.setAttribute("name", "Alice");
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 50));

    const spanEl = el.shadowRoot?.querySelector("span");
    expect(spanEl?.textContent).toBe("Alice");

    el.setAttribute("name", "Bob");
    await new Promise((r) => setTimeout(r, 50));
    expect(spanEl?.textContent).toBe("Bob");

    el.remove();
  });

  it("attribute slot with signal updates reactively", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-slot-attr-${Date.now()}`;

    const tpl = document.createElement("template");
    tpl.innerHTML = `<span class="{{theme}}">text</span>`;

    const TestEl = defineElement(tag, {
      attributes: { theme: StringAttr },
      template: tpl,
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    el.setAttribute("theme", "dark");
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 50));

    const spanEl = el.shadowRoot?.querySelector("span");
    expect(spanEl?.className).toBe("dark");

    el.setAttribute("theme", "light");
    await new Promise((r) => setTimeout(r, 50));
    expect(spanEl?.className).toBe("light");

    el.remove();
  });

  it("{{@event}} dispatch binding bridges DOM event to custom event", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-slot-dispatch-${Date.now()}`;

    const tpl = document.createElement("template");
    tpl.innerHTML = `<input onchange="{{@change}}" />`;

    const TestEl = defineElement(tag, {
      attributes: { value: StringAttr },
      events: { change: String },
      template: tpl,
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 50));

    let receivedDetail: string | null = null;
    el.addEventListener("change", ((ev: CustomEvent) => {
      receivedDetail = ev.detail;
    }) as EventListener);

    const inputEl = el.shadowRoot?.querySelector("input");
    inputEl?.dispatchEvent(new Event("change"));
    await new Promise((r) => setTimeout(r, 50));

    expect(receivedDetail).not.toBeNull();

    el.remove();
  });

  it("slot with boolean attribute value reflects signal", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-slot-bool-${Date.now()}`;

    const tpl = document.createElement("template");
    tpl.innerHTML = `<span data-active="{{active}}">click</span>`;

    const TestEl = defineElement(tag, {
      attributes: { active: { toProp: Boolean } },
      template: tpl,
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    el.active = true;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 50));

    const spanEl = el.shadowRoot?.querySelector("span");
    expect(spanEl?.getAttribute("data-active")).toBe("true");

    el.$active.set(false);
    await new Promise((r) => setTimeout(r, 50));
    expect(spanEl?.hasAttribute("data-active")).toBe(false);

    el.remove();
  });

  it("mixed text with multiple slots", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-slot-multi-${Date.now()}`;

    const tpl = document.createElement("template");
    tpl.innerHTML = `<span>{{first}} {{last}}</span>`;

    const TestEl = defineElement(tag, {
      attributes: { first: StringAttr, last: StringAttr },
      template: tpl,
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    el.setAttribute("first", "John");
    el.setAttribute("last", "Doe");
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 50));

    const spanEl = el.shadowRoot?.querySelector("span");
    expect(spanEl?.textContent).toContain("John");
    expect(spanEl?.textContent).toContain("Doe");

    el.remove();
  });
});

describe("defineElement disconnectedCallback cleanup", () => {
  it("disconnectedCallback runs registered disposables (template binding)", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-disconnect-${Date.now()}`;

    const tpl = document.createElement("template");
    tpl.innerHTML = `<span data-count="{{count}}">x</span>`;

    const TestEl = defineElement(tag, {
      attributes: { count: NumberAttr },
      template: tpl,
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    el.setAttribute("count", "1");
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 50));

    const span = el.shadowRoot!.querySelector("span")!;
    expect(span.getAttribute("data-count")).toBe("1");

    el.remove();
    await new Promise((r) => setTimeout(r, 20));

    el.setAttribute("count", "2");
    await new Promise((r) => setTimeout(r, 50));

    expect(span.getAttribute("data-count")).toBe("1");
  });
});

describe("defineElement dispatchXxx return value", () => {
  it("dispatchChange returns boolean", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-dispatch-ret-${Date.now()}`;

    const TestEl = defineElement(tag, {
      events: { change: Number },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);

    const result = el.dispatchChange(42);
    expect(typeof result).toBe("boolean");

    el.remove();
  });
});

describe("defineElement attribute before connectedCallback", () => {
  it("setting attribute before connecting initializes signal correctly", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-pre-attr-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: { count: { toProp: Number, default: 0 } },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    el.setAttribute("count", "99");
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(el.count).toBe(99);
    expect(el.$count.get()).toBe(99);

    el.remove();
  });
});

describe("defineElement shadow mode closed", () => {
  it("creates closed shadow root", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-closed-shadow-${Date.now()}`;

    const TestEl = defineElement(tag, {
      shadow: { mode: "closed" },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(el.shadowRoot).toBeNull();

    el.remove();
  });
});

describe("defineElement .h tag function", () => {
  it("TestEl.h() creates an element with no args", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-h-noargs-${Date.now()}`;

    const TestEl = defineElement(tag).build();

    await new Promise((r) => setTimeout(r, 20));
    const el = TestEl.h();
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(el instanceof HTMLElement).toBe(true);
    expect(el.tagName.toLowerCase()).toBe(tag);
    expect(el.shadowRoot).toBeTruthy();

    el.remove();
  });

  it("TestEl.h(attrs, ...children) creates element with attributes and children", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-h-attrs-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: { count: { toProp: Number, default: 0 } },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = TestEl.h({ count: 42 }, "hello");
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(el.count).toBe(42);
    expect(el.getAttribute("count")).toBe("42");

    el.remove();
  });

  it("TestEl.h(children) with plain children only", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-h-children-${Date.now()}`;

    const TestEl = defineElement(tag, { shadow: false });

    await new Promise((r) => setTimeout(r, 20));
    const el = TestEl.h("text content");
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(el.textContent).toContain("text content");

    el.remove();
  });

  it("TestEl.h with event listener props", async () => {
    const { defineElement, event, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-h-events-${Date.now()}`;

    const TestEl = defineElement(tag, {
      events: { move: event<{ x: number; y: number }>() },
    });

    await new Promise((r) => setTimeout(r, 20));

    let receivedDetail: any = null;
    const el = TestEl.h({
      onmove: (ev: CustomEvent<void | { x: number; y: number }>) => {
        receivedDetail = ev.detail;
      },
    });
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    el.dispatchMove({ x: 1, y: 2 });
    expect(receivedDetail).toEqual({ x: 1, y: 2 });

    el.remove();
  });

  it("TestEl is the element constructor", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-ctor-prop-${Date.now()}`;

    const TestEl = defineElement(tag).build();

    await new Promise((r) => setTimeout(r, 20));

    expect(typeof TestEl).toBe("function");
    expect(customElements.get(tag)).toBe(TestEl);
  });
});

describe("defineElement h(TestEl) integration", () => {
  it("h(TestEl) creates an element via .h", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-h-tagfn-${Date.now()}`;

    const TestEl = defineElement(tag).build();

    await new Promise((r) => setTimeout(r, 20));
    const el = h(TestEl);
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(el instanceof HTMLElement).toBe(true);
    expect(el.tagName.toLowerCase()).toBe(tag);

    el.remove();
  });

  it("h(TestEl, attrs, children) passes attributes and children", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-h-tagfn-attrs-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: { label: StringAttr },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = h(TestEl, { label: "test" }, "child text");
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(el.getAttribute("label")).toBe("test");

    el.remove();
  });

  it("h(TestEl) with nested elements", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-h-nested-${Date.now()}`;

    const TestEl = defineElement(tag, { shadow: false });

    await new Promise((r) => setTimeout(r, 20));
    const el = h(TestEl, span("inner"));
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    const innerSpan = el.querySelector("span");
    expect(innerSpan).toBeTruthy();
    expect(innerSpan?.textContent).toBe("inner");

    el.remove();
  });
});

describe("defineElement new TestEl()", () => {
  it("new TestEl() creates an element instance", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-new-basic-${Date.now()}`;

    const TestEl = defineElement(tag).build();

    await new Promise((r) => setTimeout(r, 20));
    const el = new TestEl();
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(el instanceof HTMLElement).toBe(true);
    expect(el.tagName.toLowerCase()).toBe(tag);

    el.remove();
  });

  it("new TestEl() element has attribute accessors", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-new-attr-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: { count: { toProp: Number, default: 0 } },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = new TestEl();
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(el.count).toBe(0);
    el.count = 10;
    expect(el.count).toBe(10);
    expect(el.getAttribute("count")).toBe("10");

    el.remove();
  });

  it("new TestEl() element has signal accessors", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-new-signal-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: { value: { toProp: Number, default: 0 } },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = new TestEl();
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(el.$value).toBeTruthy();
    expect(typeof el.$value.get).toBe("function");
    expect(typeof el.$value.set).toBe("function");
    expect(el.$value.get()).toBe(0);

    el.remove();
  });

  it("new TestEl() element has dispatch methods", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-new-dispatch-${Date.now()}`;

    const TestEl = defineElement(tag, {
      events: { change: Number },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = new TestEl();
    document.body.appendChild(el);

    expect(typeof el.dispatchChange).toBe("function");

    const handler = rs.fn();
    el.addEventListener("change", handler);
    el.dispatchChange(42);
    expect(handler).toHaveBeenCalledTimes(1);

    el.remove();
  });

  it("new TestEl() element has shadow root", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-new-shadow-${Date.now()}`;

    const TestEl = defineElement(tag).build();

    await new Promise((r) => setTimeout(r, 20));
    const el = new TestEl();
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(el.shadowRoot).toBeTruthy();

    el.remove();
  });

  it("new TestEl() vs TestEl.h() produce equivalent elements", async () => {
    const { defineElement, NumberAttr, StringAttr, BooleanAttr } = await import("../src/defineElement.js");
    const tag = `test-new-vs-h-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: { count: { toProp: Number, default: 0 } },
      events: { change: Number },
    });

    await new Promise((r) => setTimeout(r, 20));

    const elFromH = TestEl.h({ count: 5 }) as any;
    const elFromNew = new TestEl();
    elFromNew.count = 5;

    document.body.appendChild(elFromH);
    document.body.appendChild(elFromNew);
    await new Promise((r) => setTimeout(r, 10));

    expect(elFromH.count).toBe(elFromNew.count);
    expect(elFromH.getAttribute("count")).toBe(elFromNew.getAttribute("count"));
    expect(typeof elFromH.dispatchChange).toBe(typeof elFromNew.dispatchChange);
    expect(elFromH.shadowRoot).toBeTruthy();
    expect(elFromNew.shadowRoot).toBeTruthy();

    elFromH.remove();
    elFromNew.remove();
  });
});

describe("defineElement config.methods", () => {
  it("attaches a single method to the element prototype", async () => {
    const { defineElement, StringAttr } = await import("../src/defineElement.js");
    const tag = `test-methods-single-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: { name: StringAttr },
      methods: {
        greet() {
          return `Hello, ${this.getAttribute("name") || "world"}`;
        },
      },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as any;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(typeof el.greet).toBe("function");
    expect(el.greet()).toBe("Hello, world");
    el.setAttribute("name", "Alice");
    expect(el.greet()).toBe("Hello, Alice");

    el.remove();
  });

  it("attaches multiple methods to the element prototype", async () => {
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-methods-multi-${Date.now()}`;

    const TestEl = defineElement(tag, {
      methods: {
        foo() { return 1; },
        bar() { return "two"; },
      },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as any;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(el.foo()).toBe(1);
    expect(el.bar()).toBe("two");

    el.remove();
  });
});

describe("defineElement non-signal prop in {{name}} attribute slot", () => {
  it("sets the attribute from a non-signal string property", async () => {
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-slot-nonsignal-${Date.now()}`;
    const tpl = document.createElement("template");
    tpl.innerHTML = `<span class="{{label}}">text</span>`;

    const TestEl = defineElement(tag, { template: tpl });
    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as any;
    el.label = "hello";
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 30));

    const spanEl = el.shadowRoot?.querySelector("span");
    expect(spanEl?.getAttribute("class")).toBe("hello");
    el.remove();
  });

  it("removes the attribute when the non-signal property is null", async () => {
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-slot-null-prop-${Date.now()}`;
    const tpl = document.createElement("template");
    tpl.innerHTML = `<span class="{{label}}">text</span>`;

    const TestEl = defineElement(tag, { template: tpl });
    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as any;
    el.label = null;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 30));

    const spanEl = el.shadowRoot?.querySelector("span");
    expect(spanEl?.hasAttribute("class")).toBe(false);
    el.remove();
  });

  it("removes the attribute when the non-signal property is false", async () => {
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-slot-false-prop-${Date.now()}`;
    const tpl = document.createElement("template");
    tpl.innerHTML = `<span class="{{label}}">text</span>`;

    const TestEl = defineElement(tag, { template: tpl });
    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as any;
    el.label = false;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 30));

    const spanEl = el.shadowRoot?.querySelector("span");
    expect(spanEl?.hasAttribute("class")).toBe(false);
    el.remove();
  });
});

describe("defineElement mixed content in attribute slot", () => {
  it("substitutes multiple signal markers in a single attribute value", async () => {
    const { defineElement, StringAttr } = await import("../src/defineElement.js");
    const tag = `test-slot-mixed-signal-${Date.now()}`;
    const tpl = document.createElement("template");
    tpl.innerHTML = `<span data-prefix="{{first}}-{{last}}">text</span>`;

    const TestEl = defineElement(tag, {
      attributes: { first: StringAttr, last: StringAttr },
      template: tpl,
    });
    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as any;
    el.setAttribute("first", "John");
    el.setAttribute("last", "Doe");
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 30));

    const spanEl = el.shadowRoot?.querySelector("span");
    expect(spanEl?.getAttribute("data-prefix")).toBe("John-Doe");
    el.remove();
  });

  it("substitutes a mix of signal and non-signal markers", async () => {
    const { defineElement, StringAttr } = await import("../src/defineElement.js");
    const tag = `test-slot-mixed-signal-value-${Date.now()}`;
    const tpl = document.createElement("template");
    tpl.innerHTML = `<span data-prefix="{{first}}-{{literal}}">text</span>`;

    const TestEl = defineElement(tag, {
      attributes: { first: StringAttr },
      template: tpl,
    });
    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as any;
    el.setAttribute("first", "John");
    el.literal = "const";
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 30));

    const spanEl = el.shadowRoot?.querySelector("span");
    expect(spanEl?.getAttribute("data-prefix")).toBe("John-const");
    el.remove();
  });

  it("substitutes a non-signal null value as empty string", async () => {
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-slot-mixed-null-value-${Date.now()}`;
    const tpl = document.createElement("template");
    tpl.innerHTML = `<span data-prefix="x-{{nullable}}-y">text</span>`;

    const TestEl = defineElement(tag, { template: tpl });
    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as any;
    el.nullable = null;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 30));

    const spanEl = el.shadowRoot?.querySelector("span");
    expect(spanEl?.getAttribute("data-prefix")).toBe("x--y");
    el.remove();
  });

  it("substitutes an absent marker as empty string", async () => {
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-slot-absent-marker-${Date.now()}`;
    const tpl = document.createElement("template");
    tpl.innerHTML = `<span data-prefix="before-{{absent}}">text</span>`;

    const TestEl = defineElement(tag, { template: tpl });
    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as any;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 30));

    const spanEl = el.shadowRoot?.querySelector("span");
    expect(spanEl?.getAttribute("data-prefix")).toBe("before-");
    el.remove();
  });
});

describe("defineElement text content binding (single {{name}} + mixed)", () => {
  it("replaces a single {{name}} text node with a non-signal string value", async () => {
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-text-singleslot-${Date.now()}`;
    const tpl = document.createElement("template");
    tpl.innerHTML = `<span>{{who}}</span>`;

    const TestEl = defineElement(tag, { template: tpl });
    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as any;
    el.who = "World";
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 30));

    const spanEl = el.shadowRoot?.querySelector("span");
    expect(spanEl?.textContent).toBe("World");
    el.remove();
  });

  it("replaces a non-signal marker in mixed text as String(value)", async () => {
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-text-mixed-nonsignal-${Date.now()}`;
    const tpl = document.createElement("template");
    tpl.innerHTML = `<span>Hi {{name}}, welcome!</span>`;

    const TestEl = defineElement(tag, { template: tpl });
    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as any;
    el.name = "Alice";
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 30));

    const spanEl = el.shadowRoot?.querySelector("span");
    expect(spanEl?.textContent).toBe("Hi Alice, welcome!");
    el.remove();
  });

  it("renders a signal + absent marker in mixed text (covers readTemplateVar absent branch)", async () => {
    const { defineElement, StringAttr } = await import("../src/defineElement.js");
    const tag = `test-text-mixed-absent-${Date.now()}`;
    const tpl = document.createElement("template");
    tpl.innerHTML = `<span>{{first}} {{absent}}</span>`;

    const TestEl = defineElement(tag, {
      attributes: { first: StringAttr },
      template: tpl,
    });
    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as any;
    el.setAttribute("first", "John");
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 30));

    const spanEl = el.shadowRoot?.querySelector("span");
    // The effect re-runs the replace; the absent marker falls into the
    // readTemplateVar "absent" branch and returns "".
    expect(spanEl?.textContent).toBe("John ");
    el.remove();
  });
});

describe("defineElement on{{name}} non-signal event handler binding", () => {
  it("binds a non-signal function property to the element's event name", async () => {
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-on-handler-nonsignal-${Date.now()}`;
    const tpl = document.createElement("template");
    tpl.innerHTML = `<button onclick="{{onClick}}">Click</button>`;

    const TestEl = defineElement(tag, { template: tpl });
    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as any;
    let clicked = 0;
    el.onClick = function (this: HTMLElement) { clicked++; };
    document.body.appendChild(el);
    // queueMicrotask inside bindSlots defers the binding; wait for it.
    await new Promise((r) => setTimeout(r, 30));

    const btn = el.shadowRoot?.querySelector("button") as HTMLElement;
    btn?.click();
    expect(clicked).toBe(1);
    el.remove();
  });

  it("binds a signal-valued handler (reactive) to the element's event name", async () => {
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-on-handler-signal-${Date.now()}`;
    const tpl = document.createElement("template");
    tpl.innerHTML = `<button onclick="{{onClick}}">Click</button>`;

    // onClick is declared as an attribute → element gets a $onClick signal.
    // The parse function ignores the raw attribute value and returns a sentinel;
    // the real handler is set via $onClick.set().
    const noop = () => {};
    const TestEl = defineElement(tag, {
      attributes: { onClick: { toProp: () => noop, default: noop } },
      template: tpl,
    });
    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as any;
    let clicks = 0;
    const handler = function (this: HTMLElement) { clicks++; };
    el.$onClick.set(handler as any);
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 30));

    const btn = el.shadowRoot?.querySelector("button") as HTMLElement;
    btn?.click();
    expect(clicks).toBe(1);

    // Update the signal; effect should rebind.
    let clicks2 = 0;
    el.$onClick.set(function (this: HTMLElement) { clicks2++; } as any);
    await new Promise((r) => setTimeout(r, 30));
    btn?.click();
    expect(clicks2).toBe(1);
    el.remove();
  });
});

describe("defineElement property setter: null serialization removes attribute", () => {
  it("removes the attribute when the property is set to null", async () => {
    const { defineElement, NumberAttr } = await import("../src/defineElement.js");
    const tag = `test-setter-null-${Date.now()}`;
    const TestEl = defineElement(tag, {
      attributes: { count: NumberAttr },
    });
    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as any;
    el.setAttribute("count", "42");
    expect(el.getAttribute("count")).toBe("42");
    el.count = null;
    expect(el.hasAttribute("count")).toBe(false);
    el.remove();
  });
});

describe("defineElement dataset", () => {
  it("registers data-* attributes as observed", async () => {
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-ds-obs-${Date.now()}`;
    const TestEl = defineElement(tag, {
      dataset: {
        role: { default: "guest" },
        userId: { default: "" },
      },
    });
    await new Promise((r) => setTimeout(r, 20));
    expect(TestEl.observedAttributes).toContain("data-role");
    expect(TestEl.observedAttributes).toContain("data-user-id");
  });

  it("default is used when the attribute is absent", async () => {
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-ds-default-${Date.now()}`;
    const TestEl = defineElement(tag, {
      dataset: { role: { default: "guest" } },
    });
    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as any;
    expect(el.role).toBe("guest");
    expect(el.$role.get()).toBe("guest");
    expect(el.getAttribute("data-role")).toBe(null);
    el.remove();
  });

  it("attribute presence overrides the default", async () => {
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-ds-override-${Date.now()}`;
    const TestEl = defineElement(tag, {
      dataset: { role: { default: "guest" } },
    });
    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as any;
    el.setAttribute("data-role", "admin");
    expect(el.role).toBe("admin");
    expect(el.$role.get()).toBe("admin");
    el.remove();
  });

  it("property setter writes to data-* attribute", async () => {
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-ds-set-${Date.now()}`;
    const TestEl = defineElement(tag, {
      dataset: { role: { default: "guest" } },
    });
    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as any;
    el.role = "admin";
    expect(el.getAttribute("data-role")).toBe("admin");
    expect(el.$role.get()).toBe("admin");
    el.remove();
  });

  it("signal .get() reflects the latest set value; signal .set() does NOT write the attribute (matches attributes behavior)", async () => {
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-ds-sigset-${Date.now()}`;
    const TestEl = defineElement(tag, {
      dataset: { role: { default: "guest" } },
    });
    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as any;
    el.$role.set("admin");
    expect(el.$role.get()).toBe("admin");
    expect(el.role).toBe("admin");
    // $role.set does not call setAttribute — the attribute is the property-setter's
    // responsibility. To push the new value to the DOM, set via `el.role = ...` or
    // call setAttribute directly.
    expect(el.getAttribute("data-role")).toBe(null);
    el.remove();
  });

  it("coerces non-string values to strings", async () => {
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-ds-coerce-${Date.now()}`;
    const TestEl = defineElement(tag, {
      dataset: { count: { default: "" } },
    });
    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as any;
    el.count = 42;
    expect(el.getAttribute("data-count")).toBe("42");
    expect(el.count).toBe("42");
    el.remove();
  });

  it("null or undefined value removes the attribute", async () => {
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-ds-remove-${Date.now()}`;
    const TestEl = defineElement(tag, {
      dataset: { role: { default: "" } },
    });
    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as any;
    el.setAttribute("data-role", "admin");
    el.role = null;
    expect(el.hasAttribute("data-role")).toBe(false);
    el.remove();
  });

  it("camelCase key maps to kebab-case attribute", async () => {
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-ds-camel-${Date.now()}`;
    const TestEl = defineElement(tag, {
      dataset: { userId: { default: "" } },
    });
    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as any;
    el.userId = "abc";
    expect(el.getAttribute("data-user-id")).toBe("abc");
    expect(el.userId).toBe("abc");
    el.remove();
  });

  it("native el.dataset still returns the string (DOM behavior preserved)", async () => {
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-ds-native-${Date.now()}`;
    const TestEl = defineElement(tag, {
      dataset: { role: { default: "" } },
    });
    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as any;
    el.role = "admin";
    expect(el.dataset.role).toBe("admin");
    el.remove();
  });

  it("throws when a dataset key collides with an attributes key", async () => {
    const { defineElement, StringAttr } = await import("../src/defineElement.js");
    const tag = `test-ds-collision-${Date.now()}`;
    expect(() =>
      defineElement(tag, {
        attributes: { 'data-foo': StringAttr },
        dataset: { foo: { default: "" } },
      }),
    ).toThrow(/dataset key "foo" produces attribute "data-foo"/);
  });
});

describe("defineElement builder API (strict this typing)", () => {
  it("Builder: render() receives RikkaElement as this", async () => {
    const { defineElement, StringAttr } = await import("../src/defineElement.js");
    const tag = `test-builder-render-${Date.now()}`;
    let capturedThis: any = null;

    const TestEl = defineElement(tag)
      .attrs({ label: StringAttr })
      .render(function () {
        // No `this: any` annotation — this must be typed as RikkaElement<C>.
        const s: string = this.label;
        capturedThis = this;
        return document.createElement("span");
      })
      .build();

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(capturedThis).toBe(el);
    expect(typeof (el as any).label).toBe("string");

    el.remove();
  });

  it("Builder: methods() receives RikkaElement as this", async () => {
    const { defineElement, StringAttr } = await import("../src/defineElement.js");
    const tag = `test-builder-methods-${Date.now()}`;

    const TestEl = defineElement(tag)
      .attrs({ name: StringAttr })
      .methods({
        greet() {
          // this.name is typed as string
          const n: string = this.name;
          return `Hello, ${n || "world"}`;
        },
      })
      .build();

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(typeof el.greet).toBe("function");
    expect(el.greet()).toBe("Hello, world");
    el.setAttribute("name", "Alice");
    expect(el.greet()).toBe("Hello, Alice");

    el.remove();
  });

  it("Builder: instance type exposes $signal accessors", async () => {
    const { defineElement, NumberAttr } = await import("../src/defineElement.js");
    const tag = `test-builder-sig-${Date.now()}`;

    const TestEl = defineElement(tag)
      .attrs({ count: { ...NumberAttr, default: 0 } })
      .build();

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    el.count = 5;
    expect(el.count).toBe(5);
    expect(el.$count.get()).toBe(5);

    el.remove();
  });

  it("Builder: event dispatch methods are typed", async () => {
    const { defineElement, event, NumberAttr, StringAttr } = await import("../src/defineElement.js");
    const tag = `test-builder-evt-${Date.now()}`;

    interface Payload { x: number; y: number; }

    const TestEl = defineElement(tag)
      .events({ change: Number, move: event<Payload>() })
      .attrs({ name: StringAttr })
      .build();

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    // dispatchChange accepts a number; dispatchMove accepts Payload.
    el.dispatchChange(42);
    el.dispatchMove({ x: 1, y: 2 });

    el.remove();
  });

  it("Builder: render accesses this.$signal for reactivity", async () => {
    const { defineElement, NumberAttr } = await import("../src/defineElement.js");
    const { span } = await import("@takanashi/rikka-dom");
    const tag = `test-builder-rendersig-${Date.now()}`;

    const TestEl = defineElement(tag)
      .attrs({ count: { ...NumberAttr, default: 0 } })
      .render(function () {
        // $count.get() should be number
        const n: number = this.$count.get();
        return span(`Count: ${n}`);
      })
      .build();

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(el.shadowRoot?.textContent).toContain("Count: 0");

    el.remove();
  });
});

describe("defineElement builder phased state machine (type-level)", () => {
  // These tests verify compile-time state transitions using @ts-expect-error.
  // The forbidden calls are wrapped in a function that we never invoke at
  // runtime — they exist purely for the type checker.
  // If a forbidden call somehow compiles, the @ts-expect-error will fail.

  it("BuilderFresh: only .attrs/.dataset/.events are available (no .methods/.render/.template)", async () => {
    const { defineElement, StringAttr } = await import("../src/defineElement.js");
    const b = defineElement("test-bs-1");

    // ✅ Allowed (executed at runtime)
    b.styles(new CSSStyleSheet());
    b.shadow({ mode: "open" });
    b.tools({});
    b.toolContext({});
    b.attrs({ name: StringAttr });
    b.dataset({ role: { default: "" } });
    b.events({ change: Number });

    // Wrap the rest in a function we never call so the @ts-expect-error
    // markers are checked without producing runtime errors.
    const _typeCheck = () => {
      const x = b;
      // @ts-expect-error — methods not on BuilderFresh
      x.methods({ greet() {} });
      // @ts-expect-error — template not on BuilderFresh
      x.template(document.createElement("template"));
      // @ts-expect-error — render not on BuilderFresh
      x.render(() => document.createElement("div"));
      return x;
    };
    // Just type-check; do not invoke.
    void _typeCheck;
  });

  it("BuilderWithBindings: first-phase bindings still callable; .methods/.template/.render available", async () => {
    const { defineElement, StringAttr } = await import("../src/defineElement.js");
    const b = defineElement("test-bs-2").attrs({ name: StringAttr });

    // ✅ Allowed (executed at runtime)
    b.dataset({ role: { default: "" } });
    b.events({ change: Number });
    b.methods({ greet() {} });
    b.template(document.createElement("template"));
    b.render(() => document.createElement("div"));

    // First-phase bindings are STILL callable on WithBindings (so the user
    // can pick them up in any order). Last call wins for the runtime value.
    const _typeCheck = () => {
      const x = b;
      x.attrs({ other: StringAttr });
      x.dataset({ other: { default: "" } });
      x.events({ other: Number });
      return x;
    };
    void _typeCheck;
  });

  it("BuilderWithMethods: .attrs/.dataset/.events/.methods hidden; .template/.render available", async () => {
    const { defineElement, StringAttr } = await import("../src/defineElement.js");
    const b = defineElement("test-bs-3")
      .attrs({ name: StringAttr })
      .dataset({ role: { default: "" } })
      .events({ change: Number })
      .methods({ greet() {} });

    // ✅ Allowed
    b.template(document.createElement("template"));
    b.render(() => document.createElement("div"));

    const _typeCheck = () => {
      const x = b;
      // @ts-expect-error — attrs hidden
      x.attrs({ other: StringAttr });
      // @ts-expect-error — dataset hidden
      x.dataset({ other: { default: "" } });
      // @ts-expect-error — events hidden
      x.events({ other: Number });
      // @ts-expect-error — methods already called
      x.methods({ other() {} });
      return x;
    };
    void _typeCheck;
  });

  it("BuilderWithTemplate: terminal — only meta + .build", async () => {
    const { defineElement, StringAttr } = await import("../src/defineElement.js");
    const tpl = document.createElement("template");
    const b = defineElement("test-bs-4")
      .attrs({ name: StringAttr })
      .template(tpl);

    // ✅ Allowed (meta still works)
    b.styles(new CSSStyleSheet());
    b.shadow({ mode: "open" });

    const _typeCheck = () => {
      const x = b;
      // @ts-expect-error — attrs hidden
      x.attrs({ other: StringAttr });
      // @ts-expect-error — dataset hidden
      x.dataset({ role: { default: "" } });
      // @ts-expect-error — events hidden
      x.events({ change: Number });
      // @ts-expect-error — methods hidden
      x.methods({ other() {} });
      // @ts-expect-error — template already called
      x.template(document.createElement("template"));
      // @ts-expect-error — render forbidden with template
      x.render(() => document.createElement("div"));
      return x;
    };
    void _typeCheck;
  });

  it("BuilderWithRender: terminal — only meta + .build", async () => {
    const { defineElement, StringAttr } = await import("../src/defineElement.js");
    const b = defineElement("test-bs-5")
      .attrs({ name: StringAttr })
      .render(function () {
        return document.createElement("div");
      });

    // ✅ Allowed
    b.styles(new CSSStyleSheet());
    b.shadow({ mode: "open" });

    const _typeCheck = () => {
      const x = b;
      // @ts-expect-error — attrs hidden
      x.attrs({ other: StringAttr });
      // @ts-expect-error — dataset hidden
      x.dataset({ role: { default: "" } });
      // @ts-expect-error — events hidden
      x.events({ change: Number });
      // @ts-expect-error — methods hidden
      x.methods({ other() {} });
      // @ts-expect-error — render already called
      x.render(() => document.createElement("div"));
      // @ts-expect-error — template forbidden with render
      x.template(document.createElement("template"));
      return x;
    };
    void _typeCheck;
  });

  it("phase chain: .attrs → .events → .methods → .render → .build() preserves the full C in build", async () => {
    const { defineElement, StringAttr, NumberAttr, event } = await import("../src/defineElement.js");
    const { span } = await import("@takanashi/rikka-dom");

    interface Move { x: number; y: number; }

    // .events must come before .attrs/.methods
    const M = defineElement("test-bs-6")
      .events({ move: event<Move>() })
      .attrs({ name: StringAttr, count: { ...NumberAttr, default: 0 } })
      .methods({
        inc() { this.count++; },
        getName() { return this.name; },
      })
      .render(function () {
        // `this` should know about name (string), count (number), $count (signal),
        // dispatchMove(payload), inc() and getName() methods.
        const n: string = this.name;
        const c: number = this.count;
        this.dispatchMove({ x: 1, y: 2 });
        this.inc();
        const g: string = this.getName();
        return span(`${n} ${c} ${g}`);
      })
      .build();

    type Inst = InstanceType<typeof M>;
    const el = document.createElement("test-bs-6") as Inst;
    // Every field is typed.
    const _checks = [
      el.name,
      el.count,
      el.$count,
      el.dispatchMove,
      el.inc,
      el.getName,
    ];
    void _checks;
  });

  it("phase chain: .attrs → .template → .build() (skip methods)", async () => {
    const { defineElement, StringAttr } = await import("../src/defineElement.js");
    const tpl = document.createElement("template");
    tpl.innerHTML = `<span></span>`;

    const M = defineElement("test-bs-7")
      .attrs({ name: StringAttr })
      .template(tpl)
      .build();

    type Inst = InstanceType<typeof M>;
    const el = document.createElement("test-bs-7") as Inst;
    // name is typed
    const _check: string = el.name;
    void _check;
  });

  it("phase chain: .attrs → .render → .build() (skip methods)", async () => {
    const { defineElement, StringAttr } = await import("../src/defineElement.js");

    const M = defineElement("test-bs-8")
      .attrs({ name: StringAttr })
      .render(function () {
        // this.name is typed without needing methods
        return document.createElement("div");
      })
      .build();

    type Inst = InstanceType<typeof M>;
    const el = document.createElement("test-bs-8") as Inst;
    const _check: string = el.name;
    void _check;
  });

  it("phase chain: empty .build() produces an element with no bindings", async () => {
    const { defineElement } = await import("../src/defineElement.js");
    const M = defineElement("test-bs-9").build();
    type Inst = InstanceType<typeof M>;
    const el = document.createElement("test-bs-9") as Inst;
    void el;
  });
});
