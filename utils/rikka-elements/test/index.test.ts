import { describe, it, expect, rs } from "@rstest/core";
import { css, span, input, h } from "rikka-dom";
import { toCamelCase, toPascalCase } from "../src/utils.js";

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
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-basic-${Date.now()}`;

    const TestEl = defineElement(tag);

    await new Promise((r) => setTimeout(r, 20));
    expect(customElements.get(tag)).toBe(TestEl);
  });
});

describe("defineElement attributes (Number)", () => {
  it("Number creates observedAttributes", async () => {
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-num-obs-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: { count: Number },
    });

    await new Promise((r) => setTimeout(r, 20));
    expect(TestEl.observedAttributes).toContain("count");
  });

  it("Number creates typed getter/setter", async () => {
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-num-rw-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: { count: Number },
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
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-num-nan-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: { count: Number },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(Number.isNaN(el.count)).toBe(true);

    el.remove();
  });

  it("Number with setAttribute syncs to signal", async () => {
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-num-sync-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: { count: Number },
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
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-str-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: { name: String },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(el.name).toBe("undefined");

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
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-bool-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: { active: Boolean },
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
});

describe("defineElement attributes (custom transform function)", () => {
  it("bare transform function works", async () => {
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-fn-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: {
        count: (v) => (v !== undefined ? Number(v) : 0),
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
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-custom-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: {
        items: {
          type: (v: string | undefined) => (v ? v.split(",") : ["default"]),
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
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-default-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: {
        count: { type: Number, default: 42 },
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
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-default-attr-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: {
        count: { type: Number, default: 42 },
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
});

describe("defineElement attributes ($signal accessors)", () => {
  it("creates $signal accessors", async () => {
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-sig-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: { count: Number },
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
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-sync-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: { value: Number },
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
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-attrrm-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: { count: (v) => (v !== undefined ? Number(v) : 0) },
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
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-evt-num-${Date.now()}`;

    const TestEl = defineElement(tag, {
      events: { change: Number },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    expect(typeof el.dispatchChange).toBe("function");
  });

  it("dispatches and receives events via addEventListener", async () => {
    const { defineElement } = await import("../src/defineElement.js");
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
    const { defineElement } = await import("../src/defineElement.js");
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
    const { defineElement } = await import("../src/defineElement.js");
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
    const { defineElement, event } = await import("../src/defineElement.js");
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
    const { defineElement, event } = await import("../src/defineElement.js");
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
    const { defineElement } = await import("../src/defineElement.js");
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
    const { defineElement, event } = await import("../src/defineElement.js");
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
    const { defineElement, event } = await import("../src/defineElement.js");
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
    const { defineElement, event } = await import("../src/defineElement.js");
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
    const { defineElement } = await import("../src/defineElement.js");
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
    expect((receivedEvent as CustomEvent).detail).toBe(42);
    expect(receivedEvent!.bubbles).toBe(true);
    expect(receivedEvent!.composed).toBe(true);

    el.remove();
  });

  it("void event dispatch works without detail", async () => {
    const { defineElement } = await import("../src/defineElement.js");
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
    const { defineElement, event } = await import("../src/defineElement.js");
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
    const { defineElement, event } = await import("../src/defineElement.js");
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
    const { defineElement } = await import("../src/defineElement.js");
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
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-evt-void-${Date.now()}`;

    const TestEl = defineElement(tag, {
      events: { reset: undefined },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    expect(typeof el.dispatchReset).toBe("function");
  });

  it("String creates string event", async () => {
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-evt-str-${Date.now()}`;

    const TestEl = defineElement(tag, {
      events: { "value-changed": String },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    expect(typeof el.dispatchValueChanged).toBe("function");
  });

  it("event<T>() for custom types", async () => {
    const { defineElement, event } = await import("../src/defineElement.js");
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
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-shadow-${Date.now()}`;

    const TestEl = defineElement(tag);

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));
    expect(el.shadowRoot).toBeTruthy();
    el.remove();
  });

  it("adopts styles into shadow root", async () => {
    const { defineElement } = await import("../src/defineElement.js");
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
    const { defineElement } = await import("../src/defineElement.js");
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
    const { defineElement } = await import("../src/defineElement.js");
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
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-combined-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: { count: Number },
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
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-mixed-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: {
        count: Number,
        name: String,
        active: Boolean,
        items: {
          type: (v: string | undefined) => (v ? v.split(",") : []),
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
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-render-this-${Date.now()}`;
    let thisValue: any = null;

    const TestEl = defineElement(tag, {
      render(this: any) {
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
    const { defineElement } = await import("../src/defineElement.js");
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
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-render-attr-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: { label: String },
      render(this: any) {
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
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-slot-text-${Date.now()}`;

    const tpl = document.createElement("template");
    tpl.innerHTML = `<span>{{name}}</span>`;

    const TestEl = defineElement(tag, {
      attributes: { name: String },
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
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-slot-attr-${Date.now()}`;

    const tpl = document.createElement("template");
    tpl.innerHTML = `<span class="{{theme}}">text</span>`;

    const TestEl = defineElement(tag, {
      attributes: { theme: String },
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
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-slot-dispatch-${Date.now()}`;

    const tpl = document.createElement("template");
    tpl.innerHTML = `<input onchange="{{@change}}" />`;

    const TestEl = defineElement(tag, {
      attributes: { value: String },
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
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-slot-bool-${Date.now()}`;

    const tpl = document.createElement("template");
    tpl.innerHTML = `<span data-active="{{active}}">click</span>`;

    const TestEl = defineElement(tag, {
      attributes: { active: Boolean },
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
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-slot-multi-${Date.now()}`;

    const tpl = document.createElement("template");
    tpl.innerHTML = `<span>{{first}} {{last}}</span>`;

    const TestEl = defineElement(tag, {
      attributes: { first: String, last: String },
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
  it("disconnectedCallback runs disposables", async () => {
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-disconnect-${Date.now()}`;
    let effectRuns = 0;

    const TestEl = defineElement(tag, {
      attributes: { count: Number },
      render(this: any) {
        effectRuns++;
        this.$count.get();
        return String(this.count);
      },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = document.createElement(tag) as InstanceType<typeof TestEl>;
    el.setAttribute("count", "1");
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 50));

    expect(effectRuns).toBeGreaterThanOrEqual(1);

    el.remove();
    await new Promise((r) => setTimeout(r, 50));

    const prevRuns = effectRuns;
    el.setAttribute("count", "2");
    await new Promise((r) => setTimeout(r, 50));
    expect(effectRuns).toBe(prevRuns);
  });
});

describe("defineElement dispatchXxx return value", () => {
  it("dispatchChange returns boolean", async () => {
    const { defineElement } = await import("../src/defineElement.js");
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
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-pre-attr-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: { count: { type: Number, default: 0 } },
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
    const { defineElement } = await import("../src/defineElement.js");
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
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-h-noargs-${Date.now()}`;

    const TestEl = defineElement(tag);

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
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-h-attrs-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: { count: { type: Number, default: 0 } },
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
    const { defineElement } = await import("../src/defineElement.js");
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
    const { defineElement, event } = await import("../src/defineElement.js");
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
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-ctor-prop-${Date.now()}`;

    const TestEl = defineElement(tag);

    await new Promise((r) => setTimeout(r, 20));

    expect(typeof TestEl).toBe("function");
    expect(customElements.get(tag)).toBe(TestEl);
  });
});

describe("defineElement h(TestEl) integration", () => {
  it("h(TestEl) creates an element via .h", async () => {
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-h-tagfn-${Date.now()}`;

    const TestEl = defineElement(tag);

    await new Promise((r) => setTimeout(r, 20));
    const el = h(TestEl);
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(el instanceof HTMLElement).toBe(true);
    expect(el.tagName.toLowerCase()).toBe(tag);

    el.remove();
  });

  it("h(TestEl, attrs, children) passes attributes and children", async () => {
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-h-tagfn-attrs-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: { label: String },
    });

    await new Promise((r) => setTimeout(r, 20));
    const el = h(TestEl, { label: "test" }, "child text");
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(el.getAttribute("label")).toBe("test");

    el.remove();
  });

  it("h(TestEl) with nested elements", async () => {
    const { defineElement } = await import("../src/defineElement.js");
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
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-new-basic-${Date.now()}`;

    const TestEl = defineElement(tag);

    await new Promise((r) => setTimeout(r, 20));
    const el = new TestEl();
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(el instanceof HTMLElement).toBe(true);
    expect(el.tagName.toLowerCase()).toBe(tag);

    el.remove();
  });

  it("new TestEl() element has attribute accessors", async () => {
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-new-attr-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: { count: { type: Number, default: 0 } },
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
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-new-signal-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: { value: { type: Number, default: 0 } },
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
    const { defineElement } = await import("../src/defineElement.js");
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
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-new-shadow-${Date.now()}`;

    const TestEl = defineElement(tag);

    await new Promise((r) => setTimeout(r, 20));
    const el = new TestEl();
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(el.shadowRoot).toBeTruthy();

    el.remove();
  });

  it("new TestEl() vs TestEl.h() produce equivalent elements", async () => {
    const { defineElement } = await import("../src/defineElement.js");
    const tag = `test-new-vs-h-${Date.now()}`;

    const TestEl = defineElement(tag, {
      attributes: { count: { type: Number, default: 0 } },
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
