import { describe, it, expect, rs } from "@rstest/core";
import {
  For,
  insertChildBefore,
  Show,
  When,
  Switch,
  Match,
  ReactiveRange,
  applyChild,
} from "../src/index.js";
import { h } from "../src/h.js";
import { css, inlineStyle } from "../src/template.js";
import {
  div as tagDiv,
  span as tagSpan,
  button as tagButton,
  input as tagInput,
  textarea as tagTextarea,
  a as tagA,
  img as tagImg,
  header as tagHeader,
  h1 as tagH1,
  main as tagMain,
  svg as tagSvg,
  circle as tagCircle,
  svga,
  svgtitle,
  text as tagText,
  tspan as tagTspan,
  textPath as tagTextPath,
} from "../src/tags.js";
import { isPlainObject, isSignal, isWritableSignal, unwrapSignal } from "../src/signal-utils.js";
import { signal, computed, effect, Signal } from "@takanashi/rikka-signal";

describe("h()", () => {
  it("creates an element with tag name", () => {
    const el = h("div");
    expect(el.tagName).toBe("DIV");
  });

  it("creates an element with attributes", () => {
    const el = h("div", { class: "container", id: "main" });
    expect(el.className).toBe("container");
    expect(el.id).toBe("main");
  });

  it("creates an element with text children", () => {
    const el = h("p", "Hello", " ", "World");
    expect(el.textContent).toBe("Hello World");
  });

  it("creates an element with number children", () => {
    const el = h("span", 42);
    expect(el.textContent).toBe("42");
  });

  it("creates an element with element children", () => {
    const el = h("div", h("span", "A"), h("span", "B"));
    expect(el.children.length).toBe(2);
    expect(el.children[0].textContent).toBe("A");
    expect(el.children[1].textContent).toBe("B");
  });

  it("creates an element with attrs and children", () => {
    const el = h("div", { class: "box" }, "content");
    expect(el.className).toBe("box");
    expect(el.textContent).toBe("content");
  });

  it("sets style from string", () => {
    const el = h("div", { style: "color: red" });
    expect(el.style.color).toBe("red");
  });

  it("sets style from object", () => {
    const el = h("div", { style: { color: "red", fontSize: "16px" } });
    expect(el.style.color).toBe("red");
    expect(el.style.fontSize).toBe("16px");
  });

  it("sets event handlers", () => {
    let clicked = false;
    const el = h("button", {
      onclick: () => {
        clicked = true;
      },
    });
    el.click();
    expect(clicked).toBe(true);
  });

  it("sets class attribute", () => {
    const el = h("div", { class: "test-class" });
    expect(el.getAttribute("class")).toBe("test-class");
  });

  it("creates SVG elements with correct namespace", () => {
    const el = h("svg", { viewBox: "0 0 100 100" });
    expect(el.namespaceURI).toBe("http://www.w3.org/2000/svg");
  });

  it("handles null children", () => {
    const el = h("div", null, "text", null);
    expect(el.textContent).toBe("text");
  });

  it("handles array children", () => {
    const el = h("div", [h("span", "A"), h("span", "B")]);
    expect(el.children.length).toBe(2);
  });
});

describe("Signal attribute binding", () => {
  it("binds Signal.State to text content", async () => {
    const count = signal(0);
    const el = h("span", count);
    expect(el.textContent).toBe("0");
    count.set(5);
    await new Promise((r) => setTimeout(r, 50));
    expect(el.textContent).toBe("5");
  });

  it("binds Signal.State to attribute", async () => {
    const className = signal("a");
    const el = h("div", { class: className });
    await new Promise((r) => setTimeout(r, 10));
    expect(el.className).toBe("a");
    className.set("b");
    await new Promise((r) => setTimeout(r, 50));
    expect(el.className).toBe("b");
  });

  it("binds Signal.State<Record> to style and updates on change", async () => {
    const styleSig = signal<Record<string, string>>({
      color: "red",
      fontSize: "16px",
    });
    const el = h("div", { style: styleSig });
    await new Promise((r) => setTimeout(r, 10));
    expect(el.style.color).toBe("red");
    expect(el.style.fontSize).toBe("16px");
    styleSig.set({ color: "blue", fontSize: "20px" });
    await new Promise((r) => setTimeout(r, 50));
    expect(el.style.color).toBe("blue");
    expect(el.style.fontSize).toBe("20px");
  });

  it("clears residual style properties when style Signal changes", async () => {
    const styleSig = signal<Record<string, string>>({
      color: "red",
      fontSize: "16px",
    });
    const el = h("div", { style: styleSig });
    await new Promise((r) => setTimeout(r, 10));
    expect(el.style.color).toBe("red");
    expect(el.style.fontSize).toBe("16px");
    styleSig.set({ color: "blue" });
    await new Promise((r) => setTimeout(r, 50));
    expect(el.style.color).toBe("blue");
    expect(el.style.fontSize).toBe("");
  });

  it("binds nested Signal inside style Signal object", async () => {
    const colorSig = signal("red");
    const styleSig = signal<Record<string, string | number | typeof colorSig>>({
      color: colorSig,
      fontSize: "16px",
    });
    const el = h("div", { style: styleSig });
    await new Promise((r) => setTimeout(r, 10));
    expect(el.style.color).toBe("red");
    expect(el.style.fontSize).toBe("16px");
    colorSig.set("green");
    await new Promise((r) => setTimeout(r, 50));
    expect(el.style.color).toBe("green");
    expect(el.style.fontSize).toBe("16px");
  });

  it("binds Signal.Computed to text content", async () => {
    const a = signal(1);
    const b = signal(2);
    const sum = computed(() => a.get() + b.get());
    const el = h("span", sum);
    expect(el.textContent).toBe("3");
    a.set(10);
    await new Promise((r) => setTimeout(r, 50));
    expect(el.textContent).toBe("12");
  });
});

describe("Signal children binding", () => {
  it("binds Signal.State<HTMLElement[]>", async () => {
    const items = signal([h("span", "A"), h("span", "B")]);
    const el = h("div", items);
    expect(el.children.length).toBe(2);
    items.set([h("span", "C"), h("span", "D"), h("span", "E")]);
    await new Promise((r) => setTimeout(r, 50));
    expect(el.children.length).toBe(3);
    expect(el.children[0].textContent).toBe("C");
  });

  it("handles Signal child becoming null", async () => {
    const visible = signal(true);
    const content = computed(() => (visible.get() ? "visible" : null));
    const el = h("div", content);
    expect(el.textContent).toBe("visible");
    visible.set(false);
    await new Promise((r) => setTimeout(r, 50));
    expect(el.textContent).toBe("");
  });

  it("handles Signal child switching between types", async () => {
    const mode = signal<"text" | "array">("text");
    const content = computed(() => {
      if (mode.get() === "text") return "hello";
      return [h("span", "A"), h("span", "B")];
    });
    const el = h("div", content);
    expect(el.textContent).toBe("hello");
    mode.set("array");
    await new Promise((r) => setTimeout(r, 50));
    expect(el.children.length).toBe(2);
    mode.set("text");
    await new Promise((r) => setTimeout(r, 50));
    expect(el.textContent).toBe("hello");
    expect(el.children.length).toBe(0);
  });

  it("maintains correct position when Signal child switches between types with siblings", async () => {
    const mode = signal<"text" | "array">("text");
    const content = computed(() => {
      if (mode.get() === "text") return "hello";
      return [h("span", "A"), h("span", "B")];
    });
    const before = h("p", "before");
    const after = h("p", "after");
    const el = h("div", before, content, after);
    expect(el.children[0]).toBe(before);
    expect(el.children[el.children.length - 1]).toBe(after);
    expect(el.textContent).toBe("beforehelloafter");
    mode.set("array");
    await new Promise((r) => setTimeout(r, 50));
    expect(el.children[0]).toBe(before);
    expect(el.children[el.children.length - 1]).toBe(after);
    expect(el.children.length).toBe(4);
    mode.set("text");
    await new Promise((r) => setTimeout(r, 50));
    expect(el.children[0]).toBe(before);
    expect(el.children[el.children.length - 1]).toBe(after);
    expect(el.textContent).toBe("beforehelloafter");
    expect(el.children.length).toBe(2);
  });
});

describe("Function child auto-wrapping", () => {
  it("renders a function child as a static value", () => {
    const el = h("div", () => "hello");
    expect(el.textContent).toBe("hello");
  });

  it("treats a function child as reactive by reading signals", async () => {
    const count = signal(1);
    const el = h("div", () => `count=${count.get()}`);
    expect(el.textContent).toBe("count=1");
    count.set(2);
    await new Promise((r) => setTimeout(r, 50));
    expect(el.textContent).toBe("count=2");
  });

  it("handles a function child returning null", async () => {
    const visible = signal(true);
    const el = h("div", () => (visible.get() ? "shown" : null));
    expect(el.textContent).toBe("shown");
    visible.set(false);
    await new Promise((r) => setTimeout(r, 50));
    expect(el.textContent).toBe("");
  });

  it("handles a function child returning an element", async () => {
    const mode = signal<"a" | "b">("a");
    const el = h("div", () => h("span", mode.get()));
    expect(el.textContent).toBe("a");
    mode.set("b");
    await new Promise((r) => setTimeout(r, 50));
    expect(el.textContent).toBe("b");
  });
});

describe("tag shortcuts via h()", () => {
  it('h("div") creates a HTMLDivElement', () => {
    const el = h("div", "hello");
    expect(el instanceof HTMLDivElement).toBe(true);
    expect(el.textContent).toBe("hello");
  });

  it('h("span") with attrs', () => {
    const el = h("span", { class: "test" }, "content");
    expect(el.className).toBe("test");
    expect(el.textContent).toBe("content");
  });

  it('h("button") with event', () => {
    const handler = rs.fn();
    const el = h("button", { onclick: handler }, "Click");
    el.click();
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe("tag shortcuts (named exports)", () => {
  it("creates element with no args", () => {
    const el = tagDiv();
    expect(el.tagName).toBe("DIV");
  });

  it("creates element with text child", () => {
    const el = tagDiv("hello");
    expect(el.textContent).toBe("hello");
  });

  it("creates element with attrs and children", () => {
    const el = tagDiv({ class: "container", id: "main" }, "content");
    expect(el.className).toBe("container");
    expect(el.id).toBe("main");
    expect(el.textContent).toBe("content");
  });

  it("creates element with attrs only (no children)", () => {
    const el = tagInput({ type: "text", name: "field" });
    expect(el.getAttribute("type")).toBe("text");
    expect(el.getAttribute("name")).toBe("field");
  });

  it("creates element with multiple children", () => {
    const el = tagDiv(tagSpan("A"), tagSpan("B"));
    expect(el.children.length).toBe(2);
    expect(el.children[0].textContent).toBe("A");
    expect(el.children[1].textContent).toBe("B");
  });

  it("creates element with attrs and element children", () => {
    const el = tagDiv({ class: "wrapper" }, tagSpan("inner"));
    expect(el.className).toBe("wrapper");
    expect(el.querySelector("span")?.textContent).toBe("inner");
  });

  it("creates element with style object", () => {
    const el = tagDiv({ style: { color: "red" } });
    expect(el.style.color).toBe("red");
  });

  it("creates element with event handler", () => {
    let clicked = false;
    const el = tagButton(
      {
        onclick: () => {
          clicked = true;
        },
      },
      "Click",
    );
    el.click();
    expect(clicked).toBe(true);
  });

  it("creates element with signal attribute", async () => {
    const className = signal("initial");
    const el = tagDiv({ class: className });
    await new Promise((r) => setTimeout(r, 10));
    expect(el.className).toBe("initial");
    className.set("updated");
    await new Promise((r) => setTimeout(r, 50));
    expect(el.className).toBe("updated");
  });

  it("creates element with signal child", async () => {
    const text = signal("hello");
    const el = tagSpan(text);
    expect(el.textContent).toBe("hello");
    text.set("world");
    await new Promise((r) => setTimeout(r, 50));
    expect(el.textContent).toBe("world");
  });

  it("creates textarea with attributes", () => {
    const el = tagTextarea({ class: "editor", rows: 10 });
    expect(el.className).toBe("editor");
    expect(el.getAttribute("rows")).toBe("10");
  });

  it("creates anchor with href attribute", () => {
    const el = tagA({ href: "https://example.com" }, "link");
    expect(el.getAttribute("href")).toBe("https://example.com");
    expect(el.textContent).toBe("link");
  });

  it("creates img with src attribute", () => {
    const el = tagImg({ src: "image.png", alt: "test" });
    expect(el.getAttribute("src")).toBe("image.png");
    expect(el.getAttribute("alt")).toBe("test");
  });

  it("creates nested tag structures", () => {
    const el = tagDiv(
      { class: "outer" },
      tagHeader({ class: "header" }, tagH1({ class: "title" }, "Title")),
      tagMain({ class: "content" }),
    );
    expect(el.className).toBe("outer");
    expect(el.querySelector(".header")?.className).toBe("header");
    expect(el.querySelector(".title")?.textContent).toBe("Title");
    expect(el.querySelector(".content")).toBeTruthy();
  });

  it("creates SVG elements with correct namespace via tags", () => {
    const el = tagSvg(
      { viewBox: "0 0 100 100" },
      tagCircle({ cx: 50, cy: 50, r: 40 }),
    );
    expect(el.namespaceURI).toBe("http://www.w3.org/2000/svg");
    const circle = el.querySelector("circle");
    expect(circle?.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(circle?.getAttribute("cx")).toBe("50");
  });

  it("preserves class attribute in deeply nested tag calls", () => {
    const el = tagDiv(
      { class: "a" },
      tagDiv({ class: "b" }, tagSpan({ class: "c" }, "deep")),
    );
    expect(el.className).toBe("a");
    const inner = el.querySelector(".b");
    expect(inner?.className).toBe("b");
    const span = el.querySelector(".c");
    expect(span?.className).toBe("c");
    expect(span?.textContent).toBe("deep");
  });

  it("does not leak namespace URI as text content", () => {
    const el = tagDiv({ class: "test" }, "text");
    expect(el.textContent).toBe("text");
    expect(el.textContent).not.toContain("http://");
  });

  it("does not leak namespace URI as text in SVG", () => {
    const el = tagSvg(tagCircle({ cx: 50, cy: 50, r: 40 }));
    expect(el.textContent).not.toContain("http://");
  });
});

describe("SVG namespaced tag shortcuts", () => {
  it("svga() creates an element with SVG namespace", () => {
    const el = svga({ href: "#" }, "link");
    expect(el.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(el.tagName).toBe("a");
  });

  it("svgtitle() creates an element with SVG namespace", () => {
    const el = svgtitle("My SVG");
    expect(el.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(el.tagName).toBe("title");
  });

  it("text() is exported and creates an SVG text element", () => {
    const el = tagText("hello");
    expect(el.tagName).toBe("text");
    expect(el.namespaceURI).toBe("http://www.w3.org/2000/svg");
  });

  it("tspan() is exported and creates an SVG tspan element", () => {
    const el = tagTspan("span");
    expect(el.tagName).toBe("tspan");
    expect(el.namespaceURI).toBe("http://www.w3.org/2000/svg");
  });

  it("textPath() is exported and creates an SVG textPath element", () => {
    const el = tagTextPath("path");
    expect(el.tagName).toBe("textPath");
    expect(el.namespaceURI).toBe("http://www.w3.org/2000/svg");
  });
});

describe("For", () => {
  it("renders a list from Signal", async () => {
    const items = signal(["a", "b", "c"]);
    const list = For(items, (item) => h("li", item));
    const container = h("div", list);
    expect(container.querySelectorAll("li").length).toBe(3);
  });

  it("updates when signal changes", async () => {
    const items = signal(["a", "b"]);
    const list = For(items, (item) => h("li", item));
    const container = h("div", list);
    expect(container.querySelectorAll("li").length).toBe(2);
    items.set(["a", "b", "c"]);
    await new Promise((r) => setTimeout(r, 50));
    expect(container.querySelectorAll("li").length).toBe(3);
  });

  it("caches DOM by reference by default", async () => {
    const items = signal(["x", "y"]);
    const list = For(items, (item) => h("li", item));
    const container = h("div", list);
    const firstLi = container.querySelector("li");
    items.set(["x", "y"]);
    await new Promise((r) => setTimeout(r, 50));
    expect(container.querySelector("li")).toBe(firstLi);
  });

  it("supports keyFn for object arrays", async () => {
    const items = signal([
      { id: 1, name: "A" },
      { id: 2, name: "B" },
    ]);
    const list = For(
      items,
      (item) => h("li", item.name),
      (item) => item.id,
    );
    const container = h("div", list);
    expect(container.querySelectorAll("li").length).toBe(2);
  });
});

describe("Show", () => {
  it("renders when condition is true", () => {
    const content = Show(true, () => h("span", "visible"));
    const container = h("div", content);
    expect(container.textContent).toBe("visible");
  });

  it("hides when condition is false", () => {
    const content = Show(false, () => h("span", "hidden"));
    const container = h("div", content);
    expect(container.textContent).toBe("");
  });

  it("reacts to Signal condition", async () => {
    const visible = signal(true);
    const content = Show(visible, () => h("span", "toggle"));
    const container = h("div", content);
    expect(container.textContent).toBe("toggle");
    visible.set(false);
    await new Promise((r) => setTimeout(r, 50));
    expect(container.textContent).toBe("");
    visible.set(true);
    await new Promise((r) => setTimeout(r, 50));
    expect(container.textContent).toBe("toggle");
  });

  it("preserves DOM state when toggling back", async () => {
    const visible = signal(true);
    const content = Show(visible, () => h("input", { type: "text" }));
    const container = h("div", content);
    const inp = container.querySelector("input") as HTMLInputElement;
    inp.value = "typed text";
    visible.set(false);
    await new Promise((r) => setTimeout(r, 50));
    visible.set(true);
    await new Promise((r) => setTimeout(r, 50));
    const restored = container.querySelector("input") as HTMLInputElement;
    expect(restored.value).toBe("typed text");
  });

  it("accepts a static Element directly", async () => {
    const visible = signal(false);
    const span = h("span", "static");
    const content = Show(visible, span);
    const container = h("div", content);
    expect(container.textContent).toBe("");
    visible.set(true);
    await new Promise((r) => setTimeout(r, 50));
    expect(container.textContent).toBe("static");
    visible.set(false);
    await new Promise((r) => setTimeout(r, 50));
    expect(container.textContent).toBe("");
  });

  it("accepts null directly", async () => {
    const visible = signal(true);
    const content = Show(visible, null);
    const container = h("div", content);
    expect(container.textContent).toBe("");
  });

  it("preserves DOM state across toggles with static Element", async () => {
    const visible = signal(true);
    const inp = h("input", { type: "text" });
    const content = Show(visible, inp);
    const container = h("div", content);
    const input = container.querySelector("input") as HTMLInputElement;
    input.value = "typed";
    visible.set(false);
    await new Promise((r) => setTimeout(r, 50));
    visible.set(true);
    await new Promise((r) => setTimeout(r, 50));
    const restored = container.querySelector("input") as HTMLInputElement;
    expect(restored.value).toBe("typed");
  });
});

describe("When", () => {
  it("renders true branch when condition is true", () => {
    const content = When(
      true,
      () => h("span", "yes"),
      () => h("span", "no"),
    );
    const container = h("div", content);
    expect(container.textContent).toBe("yes");
  });

  it("renders false branch when condition is false", () => {
    const content = When(
      false,
      () => h("span", "yes"),
      () => h("span", "no"),
    );
    const container = h("div", content);
    expect(container.textContent).toBe("no");
  });

  it("reacts to Signal condition", async () => {
    const cond = signal(true);
    const content = When(
      cond,
      () => h("span", "yes"),
      () => h("span", "no"),
    );
    const container = h("div", content);
    expect(container.textContent).toBe("yes");
    cond.set(false);
    await new Promise((r) => setTimeout(r, 50));
    expect(container.textContent).toBe("no");
  });

  it("accepts static Elements directly", async () => {
    const cond = signal(true);
    const content = When(
      cond,
      h("span", "yes"),
      h("span", "no"),
    );
    const container = h("div", content);
    expect(container.textContent).toBe("yes");
    cond.set(false);
    await new Promise((r) => setTimeout(r, 50));
    expect(container.textContent).toBe("no");
  });

  it("accepts null for either branch", async () => {
    const cond = signal(true);
    const content = When(cond, h("span", "yes"), null);
    const container = h("div", content);
    expect(container.textContent).toBe("yes");
    cond.set(false);
    await new Promise((r) => setTimeout(r, 50));
    expect(container.textContent).toBe("");
    cond.set(true);
    await new Promise((r) => setTimeout(r, 50));
    expect(container.textContent).toBe("yes");
  });
});

describe("Switch", () => {
  it("matches a case", () => {
    const content = Switch("b", [
      Match("a", () => h("span", "A")),
      Match("b", () => h("span", "B")),
      Match("c", () => h("span", "C")),
    ]);
    const container = h("div", content);
    expect(container.textContent).toBe("B");
  });

  it("uses fallback when no match", () => {
    const content = Switch("z", [Match("a", () => h("span", "A"))], () =>
      h("span", "default"),
    );
    const container = h("div", content);
    expect(container.textContent).toBe("default");
  });

  it("accepts static Element in Match and fallback", () => {
    const content = Switch("b", [
      Match("a", h("span", "A")),
      Match("b", h("span", "B")),
    ], h("span", "default"));
    const container = h("div", content);
    expect(container.textContent).toBe("B");
    const fallbackContent = Switch("z", [Match("a", h("span", "A"))], h("span", "default"));
    const fallbackContainer = h("div", fallbackContent);
    expect(fallbackContainer.textContent).toBe("default");
  });

  it("reacts to Signal value with static Element matches", async () => {
    const val = signal("a");
    const content = Switch(val, [
      Match("a", h("span", "A")),
      Match("b", h("span", "B")),
    ]);
    const container = h("div", content);
    expect(container.textContent).toBe("A");
    val.set("b");
    await new Promise((r) => setTimeout(r, 50));
    expect(container.textContent).toBe("B");
    val.set("a");
    await new Promise((r) => setTimeout(r, 50));
    expect(container.textContent).toBe("A");
  });

  it("accepts null in Match and fallback", async () => {
    const val = signal("b");
    const content = Switch(val, [
      Match("a", h("span", "A")),
      Match("b", null),
    ], h("span", "default"));
    const container = h("div", content);
    expect(container.textContent).toBe("");
    val.set("a");
    await new Promise((r) => setTimeout(r, 50));
    expect(container.textContent).toBe("A");
    val.set("z");
    await new Promise((r) => setTimeout(r, 50));
    expect(container.textContent).toBe("default");
  });

  it("returns null when no match and no fallback", () => {
    const content = Switch("z", [Match("a", () => h("span", "A"))]);
    const container = h("div", content);
    expect(container.textContent).toBe("");
  });

  it("reacts to Signal value", async () => {
    const val = signal("a");
    const content = Switch(val, [
      Match("a", () => h("span", "A")),
      Match("b", () => h("span", "B")),
    ]);
    const container = h("div", content);
    expect(container.textContent).toBe("A");
    val.set("b");
    await new Promise((r) => setTimeout(r, 50));
    expect(container.textContent).toBe("B");
  });

  it("caches DOM when switching back", async () => {
    const val = signal("a");
    const content = Switch(val, [
      Match("a", () => h("input", { type: "text" })),
      Match("b", () => h("span", "B")),
    ]);
    const container = h("div", content);
    const inp = container.querySelector("input") as HTMLInputElement;
    inp.value = "saved";
    val.set("b");
    await new Promise((r) => setTimeout(r, 50));
    val.set("a");
    await new Promise((r) => setTimeout(r, 50));
    const restored = container.querySelector("input") as HTMLInputElement;
    expect(restored.value).toBe("saved");
  });

  it("supports function matcher", () => {
    const content = Switch(5, [
      Match(
        (v: number) => v > 10,
        () => h("span", "big"),
      ),
      Match(
        (v: number) => v > 3,
        () => h("span", "medium"),
      ),
    ]);
    const container = h("div", content);
    expect(container.textContent).toBe("medium");
  });
});

describe("insertChildBefore", () => {
  it("inserts a text node", () => {
    const parent = document.createElement("div");
    insertChildBefore(parent, "hello", null);
    expect(parent.textContent).toBe("hello");
  });

  it("inserts an element", () => {
    const parent = document.createElement("div");
    const child = document.createElement("span");
    insertChildBefore(parent, child, null);
    expect(parent.children[0]).toBe(child);
  });

  it("inserts null without error", () => {
    const parent = document.createElement("div");
    insertChildBefore(parent, null, null);
    expect(parent.childNodes.length).toBe(0);
  });

  it("inserts an array of children", () => {
    const parent = document.createElement("div");
    insertChildBefore(parent, [h("span", "A"), h("span", "B")], null);
    expect(parent.children.length).toBe(2);
  });
});

describe("Namespace propagation (browser-consistent)", () => {
  it("creates SVG-only tags in SVG namespace at top level", () => {
    const el = h("circle");
    expect(el.namespaceURI).toBe("http://www.w3.org/2000/svg");
  });

  it("creates HTML tags in HTML namespace at top level", () => {
    const el = h("a", { href: "#" });
    expect(el.namespaceURI).toBe("http://www.w3.org/1999/xhtml");
  });

  it("creates <a> in SVG namespace using svga() tag", () => {
    const svg = h("svg", svga({ href: "#" }, "link"));
    const insertedA = svg.querySelector("a");
    expect(insertedA?.namespaceURI).toBe("http://www.w3.org/2000/svg");
  });

  it("creates <a> in HTML namespace when nested inside <div>", () => {
    const div = h("div", h("a", { href: "#" }, "link"));
    const insertedA = div.querySelector("a");
    expect(insertedA?.namespaceURI).toBe("http://www.w3.org/1999/xhtml");
  });

  it("creates <title> in SVG namespace using svgtitle() tag", () => {
    const svg = h("svg", svgtitle("My SVG"));
    const insertedTitle = svg.querySelector("title");
    expect(insertedTitle?.namespaceURI).toBe("http://www.w3.org/2000/svg");
  });

  it("switches to HTML namespace inside foreignObject", () => {
    const svg = h("svg", h("foreignObject", h("div", "Hello")));
    const insertedDiv = svg.querySelector("div");
    expect(insertedDiv?.namespaceURI).toBe("http://www.w3.org/1999/xhtml");
  });

  it("switches to HTML namespace inside SVG <desc>", () => {
    const svg = h("svg", h("desc", h("span", "description")));
    const insertedSpan = svg.querySelector("span");
    expect(insertedSpan?.namespaceURI).toBe("http://www.w3.org/1999/xhtml");
  });

  it("switches to HTML namespace inside MathML text integration points", () => {
    const math = h("math", h("mi", h("span", "text")));
    const insertedSpan = math.querySelector("span");
    expect(insertedSpan?.namespaceURI).toBe("http://www.w3.org/1999/xhtml");
  });

  it("creates MathML-only tags in MathML namespace at top level", () => {
    const el = h("mfrac");
    expect(el.namespaceURI).toBe("http://www.w3.org/1998/Math/MathML");
  });

  it("inserts pre-created HTML element into SVG as-is (user responsibility)", () => {
    const htmlDiv = h("div", "breakout");
    expect(htmlDiv.namespaceURI).toBe("http://www.w3.org/1999/xhtml");
    const svg = h("svg", htmlDiv);
    expect(svg.querySelector("div")?.namespaceURI).toBe(
      "http://www.w3.org/1999/xhtml",
    );
  });

  it("preserves attributes with namespace propagation", () => {
    const svg = h("svg", svga({ href: "https://example.com" }, "link"));
    const insertedA = svg.querySelector("a");
    expect(insertedA?.getAttribute("href")).toBe("https://example.com");
  });

  it("preserves children with namespace propagation", () => {
    const svg = h("svg", svga({ href: "#" }, h("circle")));
    const insertedA = svg.querySelector("a");
    expect(insertedA?.querySelector("circle")?.namespaceURI).toBe(
      "http://www.w3.org/2000/svg",
    );
  });

  it("creates nested SVG elements in correct namespace", () => {
    const svg = h("svg", h("g", h("circle"), h("rect")));
    const g = svg.querySelector("g");
    expect(g?.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(svg.querySelector("circle")?.namespaceURI).toBe(
      "http://www.w3.org/2000/svg",
    );
    expect(svg.querySelector("rect")?.namespaceURI).toBe(
      "http://www.w3.org/2000/svg",
    );
  });

  it("deeply nested namespace: svg > foreignObject > svg > circle", () => {
    const svg = h("svg", h("foreignObject", h("svg", h("circle"))));
    const circles = svg.querySelectorAll("circle");
    expect(circles.length).toBe(1);
    expect(circles[0].namespaceURI).toBe("http://www.w3.org/2000/svg");
  });
});

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

  it("interpolates strings", () => {
    const color = "red";
    const sheet = css`
      :host {
        color: ${color};
      }
    `;
    expect(sheet instanceof CSSStyleSheet).toBe(true);
    expect(Array.from(sheet.cssRules).length).toBe(1);
  });

  it("interpolates numbers", () => {
    const size = 16;
    const sheet = css`
      :host {
        font-size: ${size}px;
      }
    `;
    expect(sheet instanceof CSSStyleSheet).toBe(true);
  });

  it("interpolates CSSStyleSheet instances", () => {
    const base = css`
      :host {
        display: block;
      }
    `;
    const extended = css`
      ${base}.card {
        padding: 16px;
      }
    `;
    expect(extended instanceof CSSStyleSheet).toBe(true);
    expect(Array.from(extended.cssRules).length).toBe(2);
  });

  it("interpolates Signal.State and updates reactively", async () => {
    const color = signal("red");
    const sheet = css`
      :host {
        color: ${color};
      }
    `;
    expect(sheet instanceof CSSStyleSheet).toBe(true);
    expect((sheet.cssRules[0] as CSSStyleRule).style.color).toBe("red");
    color.set("blue");
    await new Promise((r) => setTimeout(r, 50));
    expect((sheet.cssRules[0] as CSSStyleRule).style.color).toBe("blue");
  });

  it("interpolates Signal.Computed and updates reactively", async () => {
    const size = signal(16);
    const fontSize = computed(() => `${size.get()}px`);
    const sheet = css`
      :host {
        font-size: ${fontSize};
      }
    `;
    expect((sheet.cssRules[0] as CSSStyleRule).style.fontSize).toBe("16px");
    size.set(20);
    await new Promise((r) => setTimeout(r, 50));
    expect((sheet.cssRules[0] as CSSStyleRule).style.fontSize).toBe("20px");
  });

  it("interpolates multiple signals in one rule", async () => {
    const color = signal("red");
    const bg = signal("white");
    const sheet = css`
      :host {
        color: ${color};
        background: ${bg};
      }
    `;
    expect((sheet.cssRules[0] as CSSStyleRule).style.color).toBe("red");
    expect((sheet.cssRules[0] as CSSStyleRule).style.background).toBe("white");
    color.set("blue");
    bg.set("black");
    await new Promise((r) => setTimeout(r, 50));
    expect((sheet.cssRules[0] as CSSStyleRule).style.color).toBe("blue");
    expect((sheet.cssRules[0] as CSSStyleRule).style.background).toBe("black");
  });

  it("interpolates signal with static suffix", async () => {
    const size = signal(16);
    const sheet = css`
      :host {
        font-size: ${size}px;
      }
    `;
    expect((sheet.cssRules[0] as CSSStyleRule).style.fontSize).toBe("16px");
    size.set(20);
    await new Promise((r) => setTimeout(r, 50));
    expect((sheet.cssRules[0] as CSSStyleRule).style.fontSize).toBe("20px");
  });
});

describe("inlineStyle", () => {
  it("creates a style object from a template string", () => {
    const s = inlineStyle`padding: 16px; color: red`;
    expect(s.padding).toBe("16px");
    expect(s.color).toBe("red");
  });

  it("converts CSS property names to camelCase", () => {
    const s = inlineStyle`font-size: 14px; background-color: red; border-top-left-radius: 4px`;
    expect(s.fontSize).toBe("14px");
    expect(s.backgroundColor).toBe("red");
    expect(s.borderTopLeftRadius).toBe("4px");
  });

  it("creates an empty object from empty template", () => {
    const s = inlineStyle``;
    expect(Object.keys(s).length).toBe(0);
  });

  it("interpolates strings", () => {
    const color = "blue";
    const s = inlineStyle`color: ${color}`;
    expect(s.color).toBe("blue");
  });

  it("interpolates numbers", () => {
    const size = 16;
    const s = inlineStyle`font-size: ${size}px`;
    expect(s.fontSize).toBe("16px");
  });

  it("parses string-quoted values inside the declaration", () => {
    const s = inlineStyle`content: "hello world"; color: red`;
    expect(s.content).toBe('"hello world"');
    expect(s.color).toBe("red");
  });

  it("can be used as inline style in h()", () => {
    const s = inlineStyle`color: red; font-size: 14px`;
    const el = h("div", { style: s });
    expect(el.style.color).toBe("red");
    expect(el.style.fontSize).toBe("14px");
  });
});

describe("h`` template tag", () => {
  it("creates Element[] from HTML", () => {
    const elements = h`<div>Hello</div>`;
    expect(Array.isArray(elements)).toBe(true);
    expect(elements.length).toBe(1);
    expect(elements[0].textContent).toBe("Hello");
  });

  it("creates multiple elements", () => {
    const elements = h`<span>A</span><span>B</span>`;
    expect(elements.length).toBe(2);
  });

  it("interpolates strings", () => {
    const name = "World";
    const elements = h`<span>Hello ${name}!</span>`;
    expect(elements[0].textContent).toBe("Hello World!");
  });

  it("interpolates numbers", () => {
    const count = 42;
    const elements = h`<span>Count: ${count}</span>`;
    expect(elements[0].textContent).toBe("Count: 42");
  });

  it("interpolates Signal for fine-grained text updates", async () => {
    const name = signal("Alice");
    const elements = h`<span>Hello ${name}!</span>`;
    const container = document.createElement("div");
    for (const el of elements) container.appendChild(el);
    expect(container.textContent).toBe("Hello Alice!");
    name.set("Bob");
    await new Promise((r) => setTimeout(r, 50));
    expect(container.textContent).toBe("Hello Bob!");
  });

  it("interpolates Signal in attribute values", async () => {
    const color = signal("red");
    const elements = h`<div style="color: ${color}">Text</div>`;
    const container = document.createElement("div");
    for (const el of elements) container.appendChild(el);
    const div = container.querySelector("div")!;
    expect(div.style.color).toBe("red");
    color.set("blue");
    await new Promise((r) => setTimeout(r, 50));
    expect(div.style.color).toBe("blue");
  });

  it("parses basic HTML template", () => {
    const elements = h`<p>Text <strong>bold</strong></p>`;
    expect(Array.isArray(elements)).toBe(true);
    expect(elements.length).toBe(1);
  });

  it("interpolates Element as child", () => {
    const child = h("span", "factory");
    const elements = h`<div>${child}</div>`;
    const container = document.createElement("div");
    for (const el of elements) container.appendChild(el);
    expect(container.querySelector("span")?.textContent).toBe("factory");
  });
});

describe("ReactiveRange", () => {
  it("attaches markers and runs setup on attach()", () => {
    let setupCalled = false;
    const range = new ReactiveRange(() => {
      setupCalled = true;
    });
    expect(setupCalled).toBe(false);
    const parent = document.createElement("div");
    range.attach(parent, null);
    expect(setupCalled).toBe(true);
    expect(parent.childNodes[0]).toBe(range.start);
    expect(parent.childNodes[1]).toBe(range.end);
  });

  it("stores dispose from setup and calls on detach()", () => {
    let disposed = false;
    const range = new ReactiveRange(() => () => {
      disposed = true;
    });
    const parent = document.createElement("div");
    range.attach(parent, null);
    expect(disposed).toBe(false);
    range.detach();
    expect(disposed).toBe(true);
  });

  it("clear() removes all children between markers", () => {
    const range = new ReactiveRange(() => {});
    const parent = document.createElement("div");
    range.attach(parent, null);
    parent.insertBefore(document.createTextNode("A"), range.end);
    parent.insertBefore(h("span", "B"), range.end);
    parent.insertBefore(document.createTextNode("C"), range.end);
    expect(parent.childNodes.length).toBe(5);
    range.clear();
    expect(parent.childNodes.length).toBe(2);
    expect(parent.firstChild).toBe(range.start);
    expect(parent.lastChild).toBe(range.end);
  });

  it("reconcile() moves existing elements into correct order", () => {
    const range = new ReactiveRange(() => {});
    const parent = document.createElement("div");
    range.attach(parent, null);
    const a = h("span", "A");
    const b = h("span", "B");
    const c = h("span", "C");
    parent.insertBefore(a, range.end);
    parent.insertBefore(b, range.end);
    parent.insertBefore(c, range.end);

    range.reconcile([c, a, b]);

    const children = Array.from(parent.childNodes).filter(
      (n) => n instanceof Element,
    );
    expect(children[0]).toBe(c);
    expect(children[1]).toBe(a);
    expect(children[2]).toBe(b);
  });

  it("reconcile() removes elements not in new list", () => {
    const range = new ReactiveRange(() => {});
    const parent = document.createElement("div");
    range.attach(parent, null);
    const a = h("span", "A");
    const b = h("span", "B");
    parent.insertBefore(a, range.end);
    parent.insertBefore(b, range.end);

    range.reconcile([a]);

    expect(a.parentNode).toBe(parent);
    expect(b.parentNode).toBe(null);
  });

  it("reconcile() adds new elements", () => {
    const range = new ReactiveRange(() => {});
    const parent = document.createElement("div");
    range.attach(parent, null);
    const a = h("span", "A");
    parent.insertBefore(a, range.end);

    const b = h("span", "B");
    range.reconcile([a, b]);

    const children = Array.from(parent.childNodes).filter(
      (n) => n instanceof Element,
    );
    expect(children.length).toBe(2);
    expect(children[0]).toBe(a);
    expect(children[1]).toBe(b);
  });

  it("reconcile() is no-op when order is already correct", () => {
    const range = new ReactiveRange(() => {});
    const parent = document.createElement("div");
    range.attach(parent, null);
    const a = h("span", "A");
    const b = h("span", "B");
    parent.insertBefore(a, range.end);
    parent.insertBefore(b, range.end);

    range.reconcile([a, b]);

    const children = Array.from(parent.childNodes).filter(
      (n) => n instanceof Element,
    );
    expect(children[0]).toBe(a);
    expect(children[1]).toBe(b);
  });

  it("detach() removes markers and clears content", () => {
    const range = new ReactiveRange(() => {});
    const parent = document.createElement("div");
    range.attach(parent, null);
    parent.insertBefore(h("span", "X"), range.end);
    range.detach();
    expect(parent.childNodes.length).toBe(0);
    expect(range.parent).toBe(null);
  });

  it("works as Child in h()", () => {
    const range = new ReactiveRange((range) => {
      const el = h("span", "from range");
      range.reconcile([el]);
    });
    const container = h("div", range);
    expect(container.textContent).toBe("from range");
  });
});

describe("For reconcile behavior", () => {
  it("moves DOM nodes when list is reordered", async () => {
    const items = signal(["a", "b", "c"]);
    const list = For(items, (item) => h("li", item));
    const container = h("div", list);

    const liA = container.querySelector("li:nth-child(1)")!;
    const liB = container.querySelector("li:nth-child(2)")!;
    const liC = container.querySelector("li:nth-child(3)")!;

    items.set(["c", "a", "b"]);
    await new Promise((r) => setTimeout(r, 50));

    const reordered = Array.from(container.querySelectorAll("li"));
    expect(reordered[0]).toBe(liC);
    expect(reordered[1]).toBe(liA);
    expect(reordered[2]).toBe(liB);
    expect(reordered[0].textContent).toBe("c");
    expect(reordered[1].textContent).toBe("a");
    expect(reordered[2].textContent).toBe("b");
  });

  it("removes DOM nodes when items are removed", async () => {
    const items = signal(["a", "b", "c"]);
    const list = For(items, (item) => h("li", item));
    const container = h("div", list);

    const liB = container.querySelector("li:nth-child(2)")!;
    expect(container.querySelectorAll("li").length).toBe(3);

    items.set(["a", "c"]);
    await new Promise((r) => setTimeout(r, 50));

    expect(container.querySelectorAll("li").length).toBe(2);
    expect(liB.parentNode).toBe(null);
  });

  it("adds new DOM nodes when items are inserted", async () => {
    const items = signal(["a", "c"]);
    const list = For(items, (item) => h("li", item));
    const container = h("div", list);

    const liA = container.querySelector("li:nth-child(1)")!;
    const liC = container.querySelector("li:nth-child(2)")!;

    items.set(["a", "b", "c"]);
    await new Promise((r) => setTimeout(r, 50));

    const lis = Array.from(container.querySelectorAll("li"));
    expect(lis.length).toBe(3);
    expect(lis[0]).toBe(liA);
    expect(lis[1].textContent).toBe("b");
    expect(lis[2]).toBe(liC);
  });

  it("preserves keyed elements across reorder", async () => {
    const items = signal([
      { id: 1, name: "A" },
      { id: 2, name: "B" },
      { id: 3, name: "C" },
    ]);
    const list = For(
      items,
      (item) => h("li", { id: `item-${item.id}` }, item.name),
      (item) => item.id,
    );
    const container = h("div", list);

    const li1 = container.querySelector("#item-1")!;
    const li2 = container.querySelector("#item-2")!;
    const li3 = container.querySelector("#item-3")!;

    items.set([
      { id: 3, name: "C" },
      { id: 1, name: "A" },
      { id: 2, name: "B" },
    ]);
    await new Promise((r) => setTimeout(r, 50));

    const reordered = Array.from(container.querySelectorAll("li"));
    expect(reordered[0]).toBe(li3);
    expect(reordered[1]).toBe(li1);
    expect(reordered[2]).toBe(li2);
  });

  it("preserves keyed element state across reorder", async () => {
    const items = signal([
      { id: 1, name: "A" },
      { id: 2, name: "B" },
    ]);
    const list = For(
      items,
      (item) => h("input", { type: "text", id: `inp-${item.id}` }),
      (item) => item.id,
    );
    const container = h("div", list);

    const inp1 = container.querySelector("#inp-1") as HTMLInputElement;
    const inp2 = container.querySelector("#inp-2") as HTMLInputElement;
    inp1.value = "typed-A";
    inp2.value = "typed-B";

    items.set([
      { id: 2, name: "B" },
      { id: 1, name: "A" },
    ]);
    await new Promise((r) => setTimeout(r, 50));

    const inputs = Array.from(container.querySelectorAll("input"));
    expect(inputs[0]).toBe(inp2);
    expect(inputs[1]).toBe(inp1);
    expect((inputs[0] as HTMLInputElement).value).toBe("typed-B");
    expect((inputs[1] as HTMLInputElement).value).toBe("typed-A");
  });

  it("removes keyed elements that are no longer in the list", async () => {
    const items = signal([
      { id: 1, name: "A" },
      { id: 2, name: "B" },
      { id: 3, name: "C" },
    ]);
    const list = For(
      items,
      (item) => h("li", { id: `item-${item.id}` }, item.name),
      (item) => item.id,
    );
    const container = h("div", list);

    const li2 = container.querySelector("#item-2")!;
    expect(container.querySelectorAll("li").length).toBe(3);

    items.set([
      { id: 1, name: "A" },
      { id: 3, name: "C" },
    ]);
    await new Promise((r) => setTimeout(r, 50));

    expect(container.querySelectorAll("li").length).toBe(2);
    expect(li2.parentNode).toBe(null);
  });

  it("maintains correct position with siblings", async () => {
    const items = signal(["a", "b"]);
    const list = For(items, (item) => h("li", item));
    const before = h("p", "before");
    const after = h("p", "after");
    const container = h("div", before, list, after);

    expect(container.children[0]).toBe(before);
    expect(container.children[container.children.length - 1]).toBe(after);

    items.set(["a", "b", "c"]);
    await new Promise((r) => setTimeout(r, 50));

    expect(container.children[0]).toBe(before);
    expect(container.children[container.children.length - 1]).toBe(after);
    expect(container.querySelectorAll("li").length).toBe(3);
  });
});

describe("Show with ReactiveRange", () => {
  it("preserves element reference when toggling back on", async () => {
    const visible = signal(true);
    const content = Show(visible, () => h("input", { type: "text" }));
    const container = h("div", content);
    const inp = container.querySelector("input") as HTMLInputElement;
    const originalNode = inp;

    visible.set(false);
    await new Promise((r) => setTimeout(r, 50));
    expect(container.querySelector("input")).toBe(null);

    visible.set(true);
    await new Promise((r) => setTimeout(r, 50));
    const restored = container.querySelector("input") as HTMLInputElement;
    expect(restored).toBe(originalNode);
  });

  it("clears DOM when condition becomes false", async () => {
    const visible = signal(true);
    const content = Show(visible, () => h("span", "hello"));
    const container = h("div", content);
    expect(container.textContent).toBe("hello");

    visible.set(false);
    await new Promise((r) => setTimeout(r, 50));
    expect(container.querySelectorAll("span").length).toBe(0);
  });
});

describe("When with ReactiveRange", () => {
  it("caches both branches and preserves element identity", async () => {
    const cond = signal(true);
    const content = When(
      cond,
      () => h("span", { id: "yes" }, "yes"),
      () => h("span", { id: "no" }, "no"),
    );
    const container = h("div", content);
    const yesEl = container.querySelector("#yes")!;

    cond.set(false);
    await new Promise((r) => setTimeout(r, 50));
    expect(container.querySelector("#yes")).toBe(null);
    const noEl = container.querySelector("#no")!;

    cond.set(true);
    await new Promise((r) => setTimeout(r, 50));
    expect(container.querySelector("#yes")).toBe(yesEl);

    cond.set(false);
    await new Promise((r) => setTimeout(r, 50));
    expect(container.querySelector("#no")).toBe(noEl);
  });
});

describe("Switch with ReactiveRange", () => {
  it("caches all matched cases and preserves identity", async () => {
    const val = signal("a");
    const content = Switch(val, [
      Match("a", () => h("span", { id: "a" }, "A")),
      Match("b", () => h("span", { id: "b" }, "B")),
      Match("c", () => h("span", { id: "c" }, "C")),
    ]);
    const container = h("div", content);
    const aEl = container.querySelector("#a")!;

    val.set("b");
    await new Promise((r) => setTimeout(r, 50));
    const bEl = container.querySelector("#b")!;

    val.set("c");
    await new Promise((r) => setTimeout(r, 50));
    const cEl = container.querySelector("#c")!;

    val.set("a");
    await new Promise((r) => setTimeout(r, 50));
    expect(container.querySelector("#a")).toBe(aEl);

    val.set("b");
    await new Promise((r) => setTimeout(r, 50));
    expect(container.querySelector("#b")).toBe(bEl);

    val.set("c");
    await new Promise((r) => setTimeout(r, 50));
    expect(container.querySelector("#c")).toBe(cEl);
  });

  it("clears DOM when no case matches", async () => {
    const val = signal("a");
    const content = Switch(val, [Match("a", () => h("span", "A"))]);
    const container = h("div", content);
    expect(container.textContent).toBe("A");

    val.set("z");
    await new Promise((r) => setTimeout(r, 50));
    expect(container.textContent).toBe("");
  });
});

describe("Signal child reconcile behavior", () => {
  it("reconciles Element[] without destroying existing elements", async () => {
    const a = h("span", "A");
    const b = h("span", "B");
    const items = signal([a, b]);
    const el = h("div", items);
    expect(el.children.length).toBe(2);

    const c = h("span", "C");
    items.set([a, c, b]);
    await new Promise((r) => setTimeout(r, 50));

    expect(el.children.length).toBe(3);
    expect(el.children[0]).toBe(a);
    expect(el.children[1]).toBe(c);
    expect(el.children[2]).toBe(b);
  });

  it("removes elements no longer in Signal array", async () => {
    const a = h("span", "A");
    const b = h("span", "B");
    const items = signal([a, b]);
    const el = h("div", items);

    items.set([a]);
    await new Promise((r) => setTimeout(r, 50));

    expect(el.children.length).toBe(1);
    expect(el.children[0]).toBe(a);
    expect(b.parentNode).toBe(null);
  });

  it("reconciles correctly with siblings", async () => {
    const a = h("span", "A");
    const b = h("span", "B");
    const items = signal([a, b]);
    const before = h("p", "before");
    const after = h("p", "after");
    const el = h("div", before, items, after);

    const c = h("span", "C");
    items.set([a, c]);
    await new Promise((r) => setTimeout(r, 50));

    expect(el.children[0]).toBe(before);
    expect(el.children[el.children.length - 1]).toBe(after);
    expect(el.querySelectorAll("span").length).toBe(2);
  });
});

describe("For error handling", () => {
  it("handles undefined key in cache gracefully", async () => {
    const items = signal(["a", "b"]);
    const list = For(items, (item) => h("li", item));
    const container = h("div", list);

    expect(container.querySelectorAll("li").length).toBe(2);

    items.set(["a", "b", "c"]);
    await new Promise((r) => setTimeout(r, 50));
    expect(container.querySelectorAll("li").length).toBe(3);
  });

  it("handles cache miss for first render", async () => {
    const items = signal<string[]>([]);
    const list = For(items, (item) => h("li", item));
    const container = h("div", list);

    expect(container.querySelectorAll("li").length).toBe(0);

    items.set(["a", "b"]);
    await new Promise((r) => setTimeout(r, 50));
    expect(container.querySelectorAll("li").length).toBe(2);
  });

  it("handles removed items with proper cleanup", async () => {
    const items = signal(["a", "b", "c"]);
    const list = For(items, (item) => h("li", item));
    const container = h("div", list);

    const liB = container.querySelector("li:nth-child(2)");
    expect(liB).not.toBe(null);

    items.set(["a", "c"]);
    await new Promise((r) => setTimeout(r, 50));

    expect(container.querySelectorAll("li").length).toBe(2);
    expect(liB!.parentNode).toBe(null);
  });
});

describe("Switch error handling", () => {
  it("handles undefined case gracefully", async () => {
    const val = signal("a");
    const content = Switch(val, [Match("a", () => h("span", "A"))]);
    const container = h("div", content);
    expect(container.textContent).toBe("A");

    val.set("z");
    await new Promise((r) => setTimeout(r, 50));
    expect(container.textContent).toBe("");
  });

  it("handles switch with no initial match", async () => {
    const val = signal("x");
    const content = Switch(val, [
      Match("a", () => h("span", "A")),
      Match("b", () => h("span", "B")),
    ]);
    const container = h("div", content);
    expect(container.textContent).toBe("");
  });

  it("handles rapid case changes", async () => {
    const val = signal("a");
    const content = Switch(val, [
      Match("a", () => h("span", "A")),
      Match("b", () => h("span", "B")),
      Match("c", () => h("span", "C")),
    ]);
    const container = h("div", content);
    expect(container.textContent).toBe("A");

    val.set("b");
    await new Promise((r) => setTimeout(r, 10));
    val.set("c");
    await new Promise((r) => setTimeout(r, 10));
    val.set("a");
    await new Promise((r) => setTimeout(r, 50));

    expect(container.textContent).toBe("A");
  });
});

describe("Two-way binding", () => {
  it("binds Signal.State to input value and syncs back on input event", async () => {
    const value = signal("hello");
    const el = h("input", { value }) as HTMLInputElement;
    document.body.appendChild(el);
    expect(el.value).toBe("hello");
    value.set("world");
    await new Promise((r) => setTimeout(r, 50));
    expect(el.value).toBe("world");
    el.value = "typed";
    el.dispatchEvent(new Event("input"));
    expect(value.get()).toBe("typed");
    el.remove();
  });

  it("binds Signal.State to checkbox checked and syncs back on change event", async () => {
    const checked = signal(false);
    const el = h("input", { type: "checkbox", checked }) as HTMLInputElement;
    document.body.appendChild(el);
    expect(el.checked).toBe(false);
    checked.set(true);
    await new Promise((r) => setTimeout(r, 50));
    expect(el.checked).toBe(true);
    el.checked = false;
    el.dispatchEvent(new Event("change"));
    expect(checked.get()).toBe(false);
    el.remove();
  });

  it("does not sync back for computed signal (read-only)", async () => {
    const src = signal("a");
    const derived = computed(() => src.get().toUpperCase());
    const el = h("input", { value: derived }) as HTMLInputElement;
    document.body.appendChild(el);
    expect(el.value).toBe("A");
    src.set("b");
    await new Promise((r) => setTimeout(r, 50));
    expect(el.value).toBe("B");
    el.value = "C";
    el.dispatchEvent(new Event("input"));
    expect(derived.get()).toBe("B");
    el.remove();
  });
});

describe("Signal boolean attribute binding", () => {
  it("binds Signal.State<boolean> to disabled attribute", async () => {
    const disabled = signal(false);
    const el = h("input", { disabled });
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));
    expect(el.hasAttribute("disabled")).toBe(false);
    disabled.set(true);
    await new Promise((r) => setTimeout(r, 50));
    expect(el.hasAttribute("disabled")).toBe(true);
    disabled.set(false);
    await new Promise((r) => setTimeout(r, 50));
    expect(el.hasAttribute("disabled")).toBe(false);
    el.remove();
  });
});

describe("h() edge cases", () => {
  it("handles undefined children", () => {
    const el = h("div", undefined as any, "text");
    expect(el.textContent).toBe("text");
  });

  it("handles boolean false children (renders nothing)", () => {
    const el = h("div", false as any, "text");
    expect(el.textContent).toBe("text");
  });

  it("handles boolean true children (renders nothing)", () => {
    const el = h("div", true as any, "text");
    expect(el.textContent).toBe("text");
  });

  it("handles deeply nested array children", () => {
    const el = h("div", [[["deep"]]]);
    expect(el.textContent).toBe("deep");
  });

  it("handles empty array children", () => {
    const el = h("div", []);
    expect(el.textContent).toBe("");
  });

  it("handles number child", () => {
    const el = h("div", 42);
    expect(el.textContent).toBe("42");
  });

  it("handles zero child", () => {
    const el = h("div", 0);
    expect(el.textContent).toBe("0");
  });

  it("sets defaultValue on input/textarea via the special attribute key", () => {
    const ta = h("textarea", { defaultValue: "hello" }) as HTMLTextAreaElement;
    expect(ta.defaultValue).toBe("hello");
  });

  it("handles null child", () => {
    const el = h("div", null, "visible");
    expect(el.textContent).toBe("visible");
  });

  it("flattens a DocumentFragment child into the parent", () => {
    const frag = document.createDocumentFragment();
    frag.appendChild(h("span", "A"));
    frag.appendChild(h("span", "B"));
    const el = h("div", frag as any);
    expect(el.children.length).toBe(2);
    expect(el.children[0].textContent).toBe("A");
    expect(el.children[1].textContent).toBe("B");
  });

  it("sets CSS custom property (--var) via Signal<StyleRecord>", async () => {
    const color = signal("#ff0000");
    const el = h("div", { style: { "--accent": color } }) as HTMLElement;
    expect(el.style.getPropertyValue("--accent")).toBe("#ff0000");
    color.set("#00ff00");
    await new Promise((r) => setTimeout(r, 30));
    expect(el.style.getPropertyValue("--accent")).toBe("#00ff00");
  });

  it("removes a CSS custom property when its Signal value goes null", async () => {
    const color = signal<string | null>("#ff0000");
    const el = h("div", { style: { "--accent": color } }) as HTMLElement;
    expect(el.style.getPropertyValue("--accent")).toBe("#ff0000");
    color.set(null);
    await new Promise((r) => setTimeout(r, 30));
    expect(el.style.getPropertyValue("--accent")).toBe("");
  });

  it("sets CSS custom property (--var) via static value", () => {
    const el = h("div", { style: { "--accent": "#ff0000" } }) as HTMLElement;
    expect(el.style.getPropertyValue("--accent")).toBe("#ff0000");
  });

  it("renders Signal<Child[]> whose array contains non-Element items", async () => {
    // When the array contains non-Element items, the non-Every-Element branch
    // in the signal child binding falls through to insertChildBefore per item.
    const s = signal<unknown[]>([h("span", "A"), "text-between", h("span", "B")]);
    const container = h("div", s as any);
    expect(container.querySelectorAll("span").length).toBe(2);
    expect(container.textContent).toContain("A");
    expect(container.textContent).toContain("text-between");
    expect(container.textContent).toContain("B");

    s.set([h("span", "X"), h("span", "Y"), h("span", "Z")]);
    await new Promise((r) => setTimeout(r, 30));
    expect(container.querySelectorAll("span").length).toBe(3);
    expect(container.textContent).toBe("XYZ");
  });
});

describe("For with Signal.Computed", () => {
  it("works with computed signal source", async () => {
    const base = signal([1, 2, 3]);
    const doubled = computed(() => base.get().map((x) => x * 2));
    const content = For(doubled, (item) => h("span", String(item)));
    const container = h("div", content);
    expect(container.textContent).toBe("246");
    base.set([4, 5]);
    await new Promise((r) => setTimeout(r, 50));
    expect(container.textContent).toBe("810");
  });
});

describe("inlineStyle edge cases", () => {
  it("handles camelCase style properties via object", () => {
    const el = h("div", { style: { backgroundColor: "red" } });
    expect((el as HTMLElement).style.backgroundColor).toBe("red");
  });

  it("handles Signal in style property via object", async () => {
    const color = signal("blue");
    const el = h("div", { style: { color } });
    expect((el as HTMLElement).style.color).toBe("blue");
    color.set("green");
    await new Promise((r) => setTimeout(r, 50));
    expect((el as HTMLElement).style.color).toBe("green");
  });

  it("handles multiple style properties via object", () => {
    const el = h("div", { style: { color: "red", fontSize: "16px" } });
    expect((el as HTMLElement).style.color).toBe("red");
    expect((el as HTMLElement).style.fontSize).toBe("16px");
  });

  it("handles inlineStyle template with Signal interpolation", async () => {
    const color = signal("red");
    const el = h("div", { style: inlineStyle`color: ${color}` });
    expect((el as HTMLElement).style.color).toBe("red");
    color.set("blue");
    await new Promise((r) => setTimeout(r, 50));
    expect((el as HTMLElement).style.color).toBe("blue");
  });

  it("handles null/undefined signal in inlineStyle mixed template", async () => {
    const value = signal<string | null>("red");
    const el = h("div", { style: inlineStyle`background: ${value}` });
    expect((el as HTMLElement).style.background).toBe("red");
    value.set(null);
    await new Promise((r) => setTimeout(r, 50));
    expect((el as HTMLElement).style.background).toBe("");
    value.set("blue");
    await new Promise((r) => setTimeout(r, 50));
    expect((el as HTMLElement).style.background).toBe("blue");
  });
});

describe("applyChild()", () => {
  it("appends a text child to element", () => {
    const el = document.createElement("div");
    applyChild(el, "hello");
    expect(el.textContent).toBe("hello");
  });

  it("appends an element child", () => {
    const el = document.createElement("div");
    const child = document.createElement("span");
    child.textContent = "child";
    applyChild(el, child);
    expect(el.querySelector("span")?.textContent).toBe("child");
  });

  it("appends null without error", () => {
    const el = document.createElement("div");
    applyChild(el, null);
    expect(el.childNodes.length).toBe(0);
  });

  it("appends an Element child", () => {
    const el = document.createElement("div");
    applyChild(el, h("span", "factory"));
    expect(el.querySelector("span")?.textContent).toBe("factory");
  });
});

describe("insertChildBefore()", () => {
  it("inserts a text child before a reference node", () => {
    const parent = document.createElement("div");
    const ref = document.createElement("span");
    ref.textContent = "ref";
    parent.appendChild(ref);
    insertChildBefore(parent, "before", ref);
    expect(parent.childNodes[0].textContent).toBe("before");
    expect(parent.childNodes[1].textContent).toBe("ref");
  });

  it("inserts an element child before a reference node", () => {
    const parent = document.createElement("div");
    const ref = document.createElement("span");
    ref.textContent = "ref";
    parent.appendChild(ref);
    const child = document.createElement("span");
    child.textContent = "child";
    insertChildBefore(parent, child, ref);
    expect(parent.childNodes.length).toBe(2);
    expect((parent.childNodes[0] as Element).textContent).toBe("child");
  });
});

describe("isPlainObject()", () => {
  it("returns true for plain object literal", () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ a: 1 })).toBe(true);
  });

  it("returns false for null and undefined", () => {
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject(undefined)).toBe(false);
  });

  it("returns false for primitive values", () => {
    expect(isPlainObject(0)).toBe(false);
    expect(isPlainObject("")).toBe(false);
    expect(isPlainObject(true)).toBe(false);
  });

  it("returns false for class instances (non-Object prototype)", () => {
    class Thing {
      x = 1;
    }
    expect(isPlainObject(new Thing())).toBe(false);
  });

  it("returns false for arrays", () => {
    expect(isPlainObject([])).toBe(false);
  });

  it("returns true for objects with null prototype", () => {
    expect(isPlainObject(Object.create(null))).toBe(true);
  });
});

describe("isSignal() / isWritableSignal() / unwrapSignal()", () => {
  it("isSignal returns true for Signal.State and Signal.Computed", () => {
    const s = signal(1);
    const c = computed(() => s.get() * 2);
    expect(isSignal(s)).toBe(true);
    expect(isSignal(c)).toBe(true);
  });

  it("isSignal returns false for null / undefined / primitives / plain objects", () => {
    // These would have thrown inside Signal.isState's `in` operator before
    // the object-guard was added; now they are returned as false.
    expect(isSignal(null)).toBe(false);
    expect(isSignal(undefined)).toBe(false);
    expect(isSignal(0)).toBe(false);
    expect(isSignal("")).toBe(false);
    expect(isSignal(true)).toBe(false);
    expect(isSignal({})).toBe(false);
    expect(isSignal([])).toBe(false);
  });

  it("isWritableSignal only matches Signal.State, not Computed", () => {
    const s = signal(1);
    const c = computed(() => s.get() * 2);
    expect(isWritableSignal(s)).toBe(true);
    expect(isWritableSignal(c)).toBe(false);
  });

  it("isWritableSignal returns false for null / undefined / primitives", () => {
    expect(isWritableSignal(null)).toBe(false);
    expect(isWritableSignal(undefined)).toBe(false);
    expect(isWritableSignal(0)).toBe(false);
    expect(isWritableSignal({})).toBe(false);
  });

  it("unwrapSignal extracts .get() from a signal, passes through non-signals", () => {
    const s = signal(42);
    expect(unwrapSignal(s)).toBe(42);
    expect(unwrapSignal(7)).toBe(7);
    expect(unwrapSignal("plain")).toBe("plain");
  });
});

describe("h() with TagFunction", () => {
  it("invokes the .h property when given a TagFunction", () => {
    // Minimal TagFunction: a callable with a self-referential .h property.
    const tagFn: any = (...args: any[]) => h("section", ...args);
    tagFn.h = tagFn;
    const el = h(tagFn, { id: "x" }, "child");
    expect(el.tagName).toBe("SECTION");
    expect(el.id).toBe("x");
    expect(el.textContent).toBe("child");
  });
});

describe("h() with custom element constructor", () => {
  it("uses the constructor's static tagName to create the element", () => {
    // h() accepts any { tagName: string } in addition to string tags.
    const Ctor: any = function () {};
    Ctor.tagName = "my-ctor-el";
    const el = h(Ctor, "hello");
    expect(el.tagName.toLowerCase()).toBe("my-ctor-el");
    expect(el.textContent).toBe("hello");
  });
});

describe("inlineStyle multi-marker substitution", () => {
  it("builds a computed for a single declaration containing multiple signal markers", async () => {
    const r = signal("255");
    const g = signal("128");
    const b = signal("0");
    // Multiple signals inside ONE declaration forces the computed path
    // (a single-signal declaration short-circuits to the raw signal).
    const s = inlineStyle`color: rgb(${r}, ${g}, ${b})`;
    const colorVal = s.color as Signal.Computed<string>;
    expect(Signal.isComputed(colorVal)).toBe(true);
    expect(colorVal.get()).toBe("rgb(255, 128, 0)");

    r.set("0");
    g.set("0");
    b.set("255");
    await new Promise((r) => setTimeout(r, 30));
    expect(colorVal.get()).toBe("rgb(0, 0, 255)");
  });

  it("renders empty string for null signal in a multi-marker declaration", async () => {
    const r = signal<string | null>("255");
    const g = signal<string | null>("128");
    const s = inlineStyle`color: rgb(${r}, ${g}, 0)`;
    const colorVal = s.color as Signal.Computed<string>;
    expect(colorVal.get()).toBe("rgb(255, 128, 0)");

    r.set(null);
    await new Promise((r) => setTimeout(r, 30));
    expect(colorVal.get()).toBe("rgb(, 128, 0)");
  });
});

describe("control-flow: detached range early-returns on re-run", () => {
  it("Show: detached range ignores subsequent signal changes", async () => {
    const cond = signal(true);
    const range = Show(cond, () => h("span", "A"));
    const container = h("div", range);
    expect(container.textContent).toBe("A");

    // Schedule a re-run, then detach synchronously. The effect body
    // (queued via queueMicrotask) will see range.alive === false and
    // return early without touching the DOM.
    cond.set(false);
    range.detach();
    await new Promise((r) => setTimeout(r, 30));
    // No throw means the early-return branch was exercised.
  });

  it("When: detached range ignores subsequent signal changes", async () => {
    const cond = signal(true);
    const range = When(
      cond,
      () => h("span", "T"),
      () => h("span", "F"),
    );
    const container = h("div", range);
    expect(container.textContent).toBe("T");

    cond.set(false);
    range.detach();
    await new Promise((r) => setTimeout(r, 30));
  });

  it("Switch: detached range ignores subsequent signal changes", async () => {
    const val = signal("a");
    const range = Switch(val, [
      Match("a", () => h("span", "A")),
      Match("b", () => h("span", "B")),
    ]);
    const container = h("div", range);
    expect(container.textContent).toBe("A");

    val.set("b");
    range.detach();
    await new Promise((r) => setTimeout(r, 30));
  });
});
