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
  bindAttr,
  bindAttrs,
  unbindAttr,
  attachRange,
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
  svgscript,
  svgstyle,
  text as tagText,
  tspan as tagTspan,
  textPath as tagTextPath,
  abbr,
  address,
  area,
  audio,
  b,
  base,
  bdi,
  bdo,
  blockquote,
  body,
  canvas,
  caption,
  cite,
  col,
  colgroup,
  data,
  datalist,
  dd,
  del,
  details,
  dfn,
  dialog,
  dl,
  dt,
  em,
  embed,
  fieldset,
  figcaption,
  figure,
  head,
  hgroup,
  html,
  i,
  iframe,
  ins,
  kbd,
  legend,
  link,
  map,
  mark,
  menu,
  meta,
  meter,
  noscript,
  object,
  optgroup,
  output,
  picture,
  progress,
  q,
  rp,
  rt,
  ruby,
  s,
  samp,
  script,
  search,
  small,
  source,
  strong,
  style,
  sub,
  summary,
  sup,
  tfoot,
  time,
  title,
  track,
  u,
  var_,
  video,
  wbr,
  animate,
  animateMotion,
  animateTransform,
  desc,
  feBlend,
  feColorMatrix,
  feComponentTransfer,
  feComposite,
  feConvolveMatrix,
  feDiffuseLighting,
  feDisplacementMap,
  feDistantLight,
  feDropShadow,
  feFlood,
  feFuncA,
  feFuncB,
  feFuncG,
  feFuncR,
  feGaussianBlur,
  feImage,
  feMerge,
  feMergeNode,
  feMorphology,
  feOffset,
  fePointLight,
  feSpecularLighting,
  feSpotLight,
  feTile,
  feTurbulence,
  metadata,
  mpath,
  set,
  switch_,
  view,
  math,
  annotation,
  annotationXml,
  maction,
  menclose,
  merror,
  mfenced,
  mfrac,
  mglyph,
  mi,
  mlabeledtr,
  maligngroup,
  malignmark,
  mmultiscripts,
  mn,
  mo,
  mpadded,
  mphantom,
  mprescripts,
  mroot,
  mrow,
  ms,
  mspace,
  msqrt,
  mstyle,
  msub,
  msubsup,
  msup,
  mtable,
  mtd,
  mtext,
  mtr,
  munder,
  munderover,
  none,
  semantics,
} from "../src/tags.js";
import {
  isPlainObject,
  isSignal,
  isWritableSignal,
  unwrapSignal,
} from "../src/signal-utils.js";
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

  it("svgscript() creates an element with SVG namespace", () => {
    const el = svgscript("console.log(1)");
    expect(el.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(el.tagName).toBe("script");
  });

  it("svgstyle() creates an element with SVG namespace", () => {
    const el = svgstyle("circle { fill: red; }");
    expect(el.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(el.tagName).toBe("style");
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
    const content = When(cond, h("span", "yes"), h("span", "no"));
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
    const content = Switch(
      "b",
      [Match("a", h("span", "A")), Match("b", h("span", "B"))],
      h("span", "default"),
    );
    const container = h("div", content);
    expect(container.textContent).toBe("B");
    const fallbackContent = Switch(
      "z",
      [Match("a", h("span", "A"))],
      h("span", "default"),
    );
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
    const content = Switch(
      val,
      [Match("a", h("span", "A")), Match("b", null)],
      h("span", "default"),
    );
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

  it("does not leave data-rk-bind beacon attribute in DOM", async () => {
    const color = signal("red");
    const elements = h`<div style="color: ${color}">Text</div>`;
    const div = elements[0] as HTMLElement;
    expect(div.hasAttribute("data-rk-bind")).toBe(false);
    expect(div.style.color).toBe("red");
  });

  it("binds multiple signal attributes in template on same element", async () => {
    const color = signal("red");
    const title = signal("old");
    const elements = h`<div data-color="${color}" title="${title}">Text</div>`;
    const div = elements[0];
    expect(div.getAttribute("data-color")).toBe("red");
    expect(div.getAttribute("title")).toBe("old");
    expect(div.hasAttribute("data-rk-bind")).toBe(false);

    color.set("blue");
    title.set("new");
    await new Promise((r) => setTimeout(r, 50));
    expect(div.getAttribute("data-color")).toBe("blue");
    expect(div.getAttribute("title")).toBe("new");
  });

  it("handles template with signal attrs on some elements but not others", async () => {
    const color = signal("red");
    const elements = h`<span>static</span><div style="color: ${color}">dynamic</div>`;
    const span = elements[0];
    const div = elements[1] as HTMLElement;
    expect(span.hasAttribute("data-rk-bind")).toBe(false);
    expect(div.hasAttribute("data-rk-bind")).toBe(false);
    expect(div.style.color).toBe("red");
    color.set("blue");
    await new Promise((r) => setTimeout(r, 50));
    expect(div.style.color).toBe("blue");
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

  it("clear() removes many children efficiently via Range API", () => {
    const range = new ReactiveRange(() => {});
    const parent = document.createElement("div");
    range.attach(parent, null);
    for (let i = 0; i < 100; i++) {
      parent.insertBefore(document.createTextNode(`node-${i}`), range.end);
    }
    expect(parent.childNodes.length).toBe(102);
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

  it("reconcile() fast-path: appends all elements when range is empty", () => {
    const range = new ReactiveRange(() => {});
    const parent = document.createElement("div");
    range.attach(parent, null);

    const a = h("span", "A");
    const b = h("span", "B");
    const c = h("span", "C");
    range.reconcile([a, b, c]);

    const children = Array.from(parent.childNodes).filter(
      (n) => n instanceof Element,
    );
    expect(children.length).toBe(3);
    expect(children[0]).toBe(a);
    expect(children[1]).toBe(b);
    expect(children[2]).toBe(c);
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

  it("keeps numeric signal a number when bound to type=number input", async () => {
    const value = signal(0);
    const el = h("input", { type: "number", value }) as HTMLInputElement;
    document.body.appendChild(el);
    el.value = "42";
    el.dispatchEvent(new Event("input"));
    expect(typeof value.get()).toBe("number");
    expect(value.get()).toBe(42);
    el.remove();
  });

  it("keeps numeric signal a number when bound to type=range input", async () => {
    const value = signal(0);
    const el = h("input", {
      type: "range",
      min: "0",
      max: "255",
      value,
    }) as HTMLInputElement;
    document.body.appendChild(el);
    el.value = "200";
    el.dispatchEvent(new Event("input"));
    expect(typeof value.get()).toBe("number");
    expect(value.get()).toBe(200);
    el.remove();
  });

  it("falls back to string when signal is a string even on type=number input", async () => {
    const value = signal("0");
    const el = h("input", { type: "number", value }) as HTMLInputElement;
    document.body.appendChild(el);
    el.value = "7";
    el.dispatchEvent(new Event("input"));
    expect(typeof value.get()).toBe("string");
    expect(value.get()).toBe("7");
    el.remove();
  });

  it("binds Signal.State to checkbox checked and syncs back on change event", async () => {
    const checked = signal(false);
    const el = h("input", { type: "checkbox", checked });
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

describe("Batched signal attribute binding", () => {
  it("updates multiple signal attributes on the same element", async () => {
    const className = signal("a");
    const title = signal("old");
    const el = h("div", { class: className, title, id: "static" });
    expect(el.className).toBe("a");
    expect(el.getAttribute("title")).toBe("old");
    expect(el.id).toBe("static");

    className.set("b");
    title.set("new");
    await new Promise((r) => setTimeout(r, 50));
    expect(el.className).toBe("b");
    expect(el.getAttribute("title")).toBe("new");
    expect(el.id).toBe("static");
  });

  it("handles mix of signal and static attributes", async () => {
    const className = signal("initial");
    const el = h("div", { class: className, id: "fixed", "data-x": "y" });
    expect(el.className).toBe("initial");
    expect(el.id).toBe("fixed");
    expect(el.getAttribute("data-x")).toBe("y");

    className.set("updated");
    await new Promise((r) => setTimeout(r, 50));
    expect(el.className).toBe("updated");
    expect(el.id).toBe("fixed");
    expect(el.getAttribute("data-x")).toBe("y");
  });

  it("handles single signal attribute (non-batched path)", async () => {
    const className = signal("a");
    const el = h("div", { class: className, id: "static" });
    expect(el.className).toBe("a");
    className.set("b");
    await new Promise((r) => setTimeout(r, 50));
    expect(el.className).toBe("b");
  });

  it("handles three signal attributes on one element", async () => {
    const a = signal("1");
    const b = signal("2");
    const c = signal("3");
    const el = h("div", { "data-a": a, "data-b": b, "data-c": c });
    expect(el.getAttribute("data-a")).toBe("1");
    expect(el.getAttribute("data-b")).toBe("2");
    expect(el.getAttribute("data-c")).toBe("3");

    a.set("x");
    b.set("y");
    c.set("z");
    await new Promise((r) => setTimeout(r, 50));
    expect(el.getAttribute("data-a")).toBe("x");
    expect(el.getAttribute("data-b")).toBe("y");
    expect(el.getAttribute("data-c")).toBe("z");
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
    const el = h("div", false, "text");
    expect(el.textContent).toBe("text");
  });

  it("handles boolean true children (renders nothing)", () => {
    const el = h("div", true, "text");
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
    const s = signal<unknown[]>([
      h("span", "A"),
      "text-between",
      h("span", "B"),
    ]);
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

  it("handles escaped quotes inside CSS values", () => {
    const s = inlineStyle`content: "hello \\"world\\""; color: red`;
    expect(s.content).toBe('"hello \\"world\\""');
    expect(s.color).toBe("red");
  });

  it("handles single-quoted values with escaped quotes", () => {
    const s = inlineStyle`content: 'it\\'s here'; color: blue`;
    expect(s.content).toBe("'it\\'s here'");
    expect(s.color).toBe("blue");
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

describe("Batched two-way binding", () => {
  it("syncs back input value when batched with another signal attribute", async () => {
    const value = signal("hello");
    const title = signal("old");
    const el = h("input", { value, title }) as HTMLInputElement;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));
    expect(el.value).toBe("hello");
    expect(el.getAttribute("title")).toBe("old");

    value.set("world");
    title.set("new");
    await new Promise((r) => setTimeout(r, 50));
    expect(el.value).toBe("world");
    expect(el.getAttribute("title")).toBe("new");

    el.value = "typed";
    el.dispatchEvent(new Event("input"));
    expect(value.get()).toBe("typed");
    el.remove();
  });

  it("syncs back checkbox checked when batched with another signal attribute", async () => {
    const checked = signal(false);
    const title = signal("cb");
    const el = h("input", {
      type: "checkbox",
      checked,
      title,
    }) as HTMLInputElement;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));
    expect(el.checked).toBe(false);
    expect(el.getAttribute("title")).toBe("cb");

    checked.set(true);
    await new Promise((r) => setTimeout(r, 50));
    expect(el.checked).toBe(true);

    el.checked = false;
    el.dispatchEvent(new Event("change"));
    expect(checked.get()).toBe(false);
    el.remove();
  });

  it("handles batched value + checked on same input", async () => {
    const value = signal("a");
    const checked = signal(true);
    const el = h("input", {
      type: "checkbox",
      value,
      checked,
    }) as HTMLInputElement;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));
    expect(el.value).toBe("a");
    expect(el.checked).toBe(true);

    value.set("b");
    checked.set(false);
    await new Promise((r) => setTimeout(r, 50));
    expect(el.value).toBe("b");
    expect(el.checked).toBe(false);

    el.value = "c";
    el.dispatchEvent(new Event("input"));
    expect(value.get()).toBe("c");

    el.checked = true;
    el.dispatchEvent(new Event("change"));
    expect(checked.get()).toBe(true);
    el.remove();
  });
});

describe("h`` template tag: attribute binding edge cases", () => {
  it("binds signal in single-quoted attribute", async () => {
    const color = signal("red");
    const elements = h`<div data-color='${color}'>Text</div>`;
    const div = elements[0];
    expect(div.getAttribute("data-color")).toBe("red");
    color.set("blue");
    await new Promise((r) => setTimeout(r, 50));
    expect(div.getAttribute("data-color")).toBe("blue");
  });

  it("binds multiple signal attributes with mixed quote styles", async () => {
    const color = signal("red");
    const title = signal("tip");
    const elements = h`<div data-color='${color}' title="${title}">Text</div>`;
    const div = elements[0];
    expect(div.getAttribute("data-color")).toBe("red");
    expect(div.getAttribute("title")).toBe("tip");
    color.set("blue");
    title.set("new");
    await new Promise((r) => setTimeout(r, 50));
    expect(div.getAttribute("data-color")).toBe("blue");
    expect(div.getAttribute("title")).toBe("new");
  });

  it("binds signal attribute with static prefix and suffix", async () => {
    const size = signal("16");
    const elements = h`<div style="font-size: ${size}px; color: red">Text</div>`;
    const div = elements[0] as HTMLElement;
    expect(div.style.fontSize).toBe("16px");
    expect(div.style.color).toBe("red");
    size.set("20");
    await new Promise((r) => setTimeout(r, 50));
    expect(div.style.fontSize).toBe("20px");
  });

  it("binds multiple signals in the same attribute value", async () => {
    const x = signal("10");
    const y = signal("20");
    const elements = h`<div style="top: ${x}px; left: ${y}px">Pos</div>`;
    const div = elements[0] as HTMLElement;
    expect(div.style.top).toBe("10px");
    expect(div.style.left).toBe("20px");
    x.set("30");
    y.set("40");
    await new Promise((r) => setTimeout(r, 50));
    expect(div.style.top).toBe("30px");
    expect(div.style.left).toBe("40px");
  });

  it("updates signal text between static text", async () => {
    const name = signal("Alice");
    const elements = h`<span>Hello ${name}!</span>`;
    const container = document.createElement("div");
    for (const el of elements) container.appendChild(el);
    expect(container.textContent).toBe("Hello Alice!");
    name.set("Bob");
    await new Promise((r) => setTimeout(r, 50));
    expect(container.textContent).toBe("Hello Bob!");
  });

  it("handles signal attribute on nested element", async () => {
    const color = signal("red");
    const elements = h`<div><span style="color: ${color}">inner</span></div>`;
    const div = elements[0];
    const span = div.querySelector("span")!;
    expect(span.style.color).toBe("red");
    color.set("blue");
    await new Promise((r) => setTimeout(r, 50));
    expect(span.style.color).toBe("blue");
  });

  it("handles signal attribute on self-closing tag", async () => {
    const src = signal("a.png");
    const elements = h`<img src="${src}" />`;
    const img = elements[0];
    expect(img.getAttribute("src")).toBe("a.png");
    src.set("b.png");
    await new Promise((r) => setTimeout(r, 50));
    expect(img.getAttribute("src")).toBe("b.png");
  });

  it("handles null signal value in template text position", async () => {
    const name = signal<string | null>("Alice");
    const elements = h`<span>Hello ${name}!</span>`;
    const container = document.createElement("div");
    for (const el of elements) container.appendChild(el);
    expect(container.textContent).toBe("Hello Alice!");
    name.set(null);
    await new Promise((r) => setTimeout(r, 50));
    expect(container.textContent).toBe("Hello !");
  });
});

describe("ReactiveRange edge cases", () => {
  it("clear() is no-op when range has no parent", () => {
    const range = new ReactiveRange(() => {});
    // Not attached, so parent is null — clear should not throw
    range.clear();
  });

  it("reconcile() is no-op when range is not alive", () => {
    const range = new ReactiveRange(() => {});
    const parent = document.createElement("div");
    range.attach(parent, null);
    range.detach();
    // After detach, alive is false — reconcile should not throw
    range.reconcile([h("span", "A")]);
    expect(parent.childNodes.length).toBe(0);
  });

  it("reconcile() is no-op when range has no parent", () => {
    const range = new ReactiveRange(() => {});
    // Not attached, so parent is null — reconcile should not throw
    range.reconcile([h("span", "A")]);
  });

  it("detach() called twice does not throw", () => {
    const range = new ReactiveRange(() => {});
    const parent = document.createElement("div");
    range.attach(parent, null);
    range.detach();
    // Second detach should be safe
    range.detach();
    expect(parent.childNodes.length).toBe(0);
  });

  it("attach() runs setup exactly once", () => {
    let setupCalls = 0;
    const range = new ReactiveRange(() => {
      setupCalls++;
    });
    const parent = document.createElement("div");
    range.attach(parent, null);
    expect(setupCalls).toBe(1);
  });
});

describe("h() with boolean signal attributes", () => {
  it("toggles hidden attribute via signal", async () => {
    const hidden = signal(false);
    const el = h("div", { hidden });
    expect(el.hasAttribute("hidden")).toBe(false);
    hidden.set(true);
    await new Promise((r) => setTimeout(r, 50));
    expect(el.hasAttribute("hidden")).toBe(true);
    hidden.set(false);
    await new Promise((r) => setTimeout(r, 50));
    expect(el.hasAttribute("hidden")).toBe(false);
  });
});

describe("For with empty initial list", () => {
  it("renders nothing for empty array", () => {
    const items = signal<string[]>([]);
    const list = For(items, (item) => h("li", item));
    const container = h("div", list);
    expect(container.querySelectorAll("li").length).toBe(0);
  });

  it("adds items from empty to non-empty", async () => {
    const items = signal<string[]>([]);
    const list = For(items, (item) => h("li", item));
    const container = h("div", list);
    expect(container.querySelectorAll("li").length).toBe(0);
    items.set(["a", "b"]);
    await new Promise((r) => setTimeout(r, 50));
    expect(container.querySelectorAll("li").length).toBe(2);
  });
});

describe("Signal child with nested signal in style object", () => {
  it("updates individual style property signal without clearing others", async () => {
    const color = signal("red");
    const el = h("div", { style: { color, fontSize: "16px" } });
    expect(el.style.color).toBe("red");
    expect(el.style.fontSize).toBe("16px");
    color.set("blue");
    await new Promise((r) => setTimeout(r, 50));
    expect(el.style.color).toBe("blue");
    expect(el.style.fontSize).toBe("16px");
  });
});

describe("Comprehensive HTML tag helpers", () => {
  const cases: Array<
    [
      string,
      (attrs?: Record<string, unknown>, ...children: unknown[]) => Element,
      string,
    ]
  > = [
    ["abbr", (a, ...c) => abbr(a as never, ...(c as never[])), "abbr"],
    ["address", (a, ...c) => address(a as never, ...(c as never[])), "address"],
    ["area", (a, ...c) => area(a as never, ...(c as never[])), "area"],
    ["audio", (a, ...c) => audio(a as never, ...(c as never[])), "audio"],
    ["b", (a, ...c) => b(a as never, ...(c as never[])), "b"],
    ["base", (a, ...c) => base(a as never, ...(c as never[])), "base"],
    ["bdi", (a, ...c) => bdi(a as never, ...(c as never[])), "bdi"],
    ["bdo", (a, ...c) => bdo(a as never, ...(c as never[])), "bdo"],
    [
      "blockquote",
      (a, ...c) => blockquote(a as never, ...(c as never[])),
      "blockquote",
    ],
    ["body", (a, ...c) => body(a as never, ...(c as never[])), "body"],
    ["canvas", (a, ...c) => canvas(a as never, ...(c as never[])), "canvas"],
    ["caption", (a, ...c) => caption(a as never, ...(c as never[])), "caption"],
    ["cite", (a, ...c) => cite(a as never, ...(c as never[])), "cite"],
    ["col", (a, ...c) => col(a as never, ...(c as never[])), "col"],
    [
      "colgroup",
      (a, ...c) => colgroup(a as never, ...(c as never[])),
      "colgroup",
    ],
    ["data", (a, ...c) => data(a as never, ...(c as never[])), "data"],
    [
      "datalist",
      (a, ...c) => datalist(a as never, ...(c as never[])),
      "datalist",
    ],
    ["dd", (a, ...c) => dd(a as never, ...(c as never[])), "dd"],
    ["del", (a, ...c) => del(a as never, ...(c as never[])), "del"],
    ["details", (a, ...c) => details(a as never, ...(c as never[])), "details"],
    ["dfn", (a, ...c) => dfn(a as never, ...(c as never[])), "dfn"],
    ["dialog", (a, ...c) => dialog(a as never, ...(c as never[])), "dialog"],
    ["dl", (a, ...c) => dl(a as never, ...(c as never[])), "dl"],
    ["dt", (a, ...c) => dt(a as never, ...(c as never[])), "dt"],
    ["em", (a, ...c) => em(a as never, ...(c as never[])), "em"],
    ["embed", (a, ...c) => embed(a as never, ...(c as never[])), "embed"],
    [
      "fieldset",
      (a, ...c) => fieldset(a as never, ...(c as never[])),
      "fieldset",
    ],
    [
      "figcaption",
      (a, ...c) => figcaption(a as never, ...(c as never[])),
      "figcaption",
    ],
    ["figure", (a, ...c) => figure(a as never, ...(c as never[])), "figure"],
    ["head", (a, ...c) => head(a as never, ...(c as never[])), "head"],
    ["hgroup", (a, ...c) => hgroup(a as never, ...(c as never[])), "hgroup"],
    ["html", (a, ...c) => html(a as never, ...(c as never[])), "html"],
    ["i", (a, ...c) => i(a as never, ...(c as never[])), "i"],
    ["iframe", (a, ...c) => iframe(a as never, ...(c as never[])), "iframe"],
    ["ins", (a, ...c) => ins(a as never, ...(c as never[])), "ins"],
    ["kbd", (a, ...c) => kbd(a as never, ...(c as never[])), "kbd"],
    ["legend", (a, ...c) => legend(a as never, ...(c as never[])), "legend"],
    ["link", (a, ...c) => link(a as never, ...(c as never[])), "link"],
    ["map", (a, ...c) => map(a as never, ...(c as never[])), "map"],
    ["mark", (a, ...c) => mark(a as never, ...(c as never[])), "mark"],
    ["menu", (a, ...c) => menu(a as never, ...(c as never[])), "menu"],
    ["meta", (a, ...c) => meta(a as never, ...(c as never[])), "meta"],
    ["meter", (a, ...c) => meter(a as never, ...(c as never[])), "meter"],
    [
      "noscript",
      (a, ...c) => noscript(a as never, ...(c as never[])),
      "noscript",
    ],
    ["object", (a, ...c) => object(a as never, ...(c as never[])), "object"],
    [
      "optgroup",
      (a, ...c) => optgroup(a as never, ...(c as never[])),
      "optgroup",
    ],
    ["output", (a, ...c) => output(a as never, ...(c as never[])), "output"],
    ["picture", (a, ...c) => picture(a as never, ...(c as never[])), "picture"],
    [
      "progress",
      (a, ...c) => progress(a as never, ...(c as never[])),
      "progress",
    ],
    ["q", (a, ...c) => q(a as never, ...(c as never[])), "q"],
    ["rp", (a, ...c) => rp(a as never, ...(c as never[])), "rp"],
    ["rt", (a, ...c) => rt(a as never, ...(c as never[])), "rt"],
    ["ruby", (a, ...c) => ruby(a as never, ...(c as never[])), "ruby"],
    ["s", (a, ...c) => s(a as never, ...(c as never[])), "s"],
    ["samp", (a, ...c) => samp(a as never, ...(c as never[])), "samp"],
    ["script", (a, ...c) => script(a as never, ...(c as never[])), "script"],
    ["search", (a, ...c) => search(a as never, ...(c as never[])), "search"],
    ["small", (a, ...c) => small(a as never, ...(c as never[])), "small"],
    ["source", (a, ...c) => source(a as never, ...(c as never[])), "source"],
    ["strong", (a, ...c) => strong(a as never, ...(c as never[])), "strong"],
    ["style", (a, ...c) => style(a as never, ...(c as never[])), "style"],
    ["sub", (a, ...c) => sub(a as never, ...(c as never[])), "sub"],
    ["summary", (a, ...c) => summary(a as never, ...(c as never[])), "summary"],
    ["sup", (a, ...c) => sup(a as never, ...(c as never[])), "sup"],
    ["tfoot", (a, ...c) => tfoot(a as never, ...(c as never[])), "tfoot"],
    ["time", (a, ...c) => time(a as never, ...(c as never[])), "time"],
    ["title", (a, ...c) => title(a as never, ...(c as never[])), "title"],
    ["track", (a, ...c) => track(a as never, ...(c as never[])), "track"],
    ["u", (a, ...c) => u(a as never, ...(c as never[])), "u"],
    ["var_", (a, ...c) => var_(a as never, ...(c as never[])), "var"],
    ["video", (a, ...c) => video(a as never, ...(c as never[])), "video"],
    ["wbr", (a, ...c) => wbr(a as never, ...(c as never[])), "wbr"],
  ];

  for (const [name, factory, expectedTag] of cases) {
    it(`creates ${name} element with the correct tag name`, () => {
      const el = factory();
      expect(el.tagName.toLowerCase()).toBe(expectedTag);
      expect(el.namespaceURI).toBe("http://www.w3.org/1999/xhtml");
    });

    it(`${name} supports attrs and children`, () => {
      const child = tagDiv("child");
      const el = factory({ class: "x" }, child);
      expect(el.getAttribute("class")).toBe("x");
      expect(el.children.length).toBe(1);
      expect(el.firstElementChild).toBe(child);
    });
  }
});

describe("Comprehensive SVG tag helpers", () => {
  const SVG_NS = "http://www.w3.org/2000/svg";

  const cases: Array<
    [
      string,
      (attrs?: Record<string, unknown>, ...children: unknown[]) => Element,
      string,
    ]
  > = [
    ["animate", (a, ...c) => animate(a as never, ...(c as never[])), "animate"],
    [
      "animateMotion",
      (a, ...c) => animateMotion(a as never, ...(c as never[])),
      "animatemotion",
    ],
    [
      "animateTransform",
      (a, ...c) => animateTransform(a as never, ...(c as never[])),
      "animatetransform",
    ],
    ["desc", (a, ...c) => desc(a as never, ...(c as never[])), "desc"],
    ["feBlend", (a, ...c) => feBlend(a as never, ...(c as never[])), "feblend"],
    [
      "feColorMatrix",
      (a, ...c) => feColorMatrix(a as never, ...(c as never[])),
      "fecolormatrix",
    ],
    [
      "feComponentTransfer",
      (a, ...c) => feComponentTransfer(a as never, ...(c as never[])),
      "fecomponenttransfer",
    ],
    [
      "feComposite",
      (a, ...c) => feComposite(a as never, ...(c as never[])),
      "fecomposite",
    ],
    [
      "feConvolveMatrix",
      (a, ...c) => feConvolveMatrix(a as never, ...(c as never[])),
      "feconvolvematrix",
    ],
    [
      "feDiffuseLighting",
      (a, ...c) => feDiffuseLighting(a as never, ...(c as never[])),
      "fediffuselighting",
    ],
    [
      "feDisplacementMap",
      (a, ...c) => feDisplacementMap(a as never, ...(c as never[])),
      "fedisplacementmap",
    ],
    [
      "feDistantLight",
      (a, ...c) => feDistantLight(a as never, ...(c as never[])),
      "fedistantlight",
    ],
    [
      "feDropShadow",
      (a, ...c) => feDropShadow(a as never, ...(c as never[])),
      "fedropshadow",
    ],
    ["feFlood", (a, ...c) => feFlood(a as never, ...(c as never[])), "feflood"],
    ["feFuncA", (a, ...c) => feFuncA(a as never, ...(c as never[])), "fefunca"],
    ["feFuncB", (a, ...c) => feFuncB(a as never, ...(c as never[])), "fefuncb"],
    ["feFuncG", (a, ...c) => feFuncG(a as never, ...(c as never[])), "fefuncg"],
    ["feFuncR", (a, ...c) => feFuncR(a as never, ...(c as never[])), "fefuncr"],
    [
      "feGaussianBlur",
      (a, ...c) => feGaussianBlur(a as never, ...(c as never[])),
      "fegaussianblur",
    ],
    ["feImage", (a, ...c) => feImage(a as never, ...(c as never[])), "feimage"],
    ["feMerge", (a, ...c) => feMerge(a as never, ...(c as never[])), "femerge"],
    [
      "feMergeNode",
      (a, ...c) => feMergeNode(a as never, ...(c as never[])),
      "femergenode",
    ],
    [
      "feMorphology",
      (a, ...c) => feMorphology(a as never, ...(c as never[])),
      "femorphology",
    ],
    [
      "feOffset",
      (a, ...c) => feOffset(a as never, ...(c as never[])),
      "feoffset",
    ],
    [
      "fePointLight",
      (a, ...c) => fePointLight(a as never, ...(c as never[])),
      "fepointlight",
    ],
    [
      "feSpecularLighting",
      (a, ...c) => feSpecularLighting(a as never, ...(c as never[])),
      "fespecularlighting",
    ],
    [
      "feSpotLight",
      (a, ...c) => feSpotLight(a as never, ...(c as never[])),
      "fespotlight",
    ],
    ["feTile", (a, ...c) => feTile(a as never, ...(c as never[])), "fetile"],
    [
      "feTurbulence",
      (a, ...c) => feTurbulence(a as never, ...(c as never[])),
      "feturbulence",
    ],
    [
      "metadata",
      (a, ...c) => metadata(a as never, ...(c as never[])),
      "metadata",
    ],
    ["mpath", (a, ...c) => mpath(a as never, ...(c as never[])), "mpath"],
    ["set", (a, ...c) => set(a as never, ...(c as never[])), "set"],
    ["switch_", (a, ...c) => switch_(a as never, ...(c as never[])), "switch"],
    ["view", (a, ...c) => view(a as never, ...(c as never[])), "view"],
  ];

  for (const [name, factory, expectedTag] of cases) {
    it(`creates ${name} element in SVG namespace`, () => {
      const el = factory();
      expect(el.tagName.toLowerCase()).toBe(expectedTag);
      expect(el.namespaceURI).toBe(SVG_NS);
    });
  }
});

describe("Comprehensive MathML tag helpers", () => {
  const MATHML_NS = "http://www.w3.org/1998/Math/MathML";

  const cases: Array<
    [
      string,
      (attrs?: Record<string, unknown>, ...children: unknown[]) => Element,
      string,
    ]
  > = [
    ["math", (a, ...c) => math(a as never, ...(c as never[])), "math"],
    [
      "annotation",
      (a, ...c) => annotation(a as never, ...(c as never[])),
      "annotation",
    ],
    [
      "annotationXml",
      (a, ...c) => annotationXml(a as never, ...(c as never[])),
      "annotation-xml",
    ],
    ["maction", (a, ...c) => maction(a as never, ...(c as never[])), "maction"],
    [
      "menclose",
      (a, ...c) => menclose(a as never, ...(c as never[])),
      "menclose",
    ],
    ["merror", (a, ...c) => merror(a as never, ...(c as never[])), "merror"],
    ["mfenced", (a, ...c) => mfenced(a as never, ...(c as never[])), "mfenced"],
    ["mfrac", (a, ...c) => mfrac(a as never, ...(c as never[])), "mfrac"],
    ["mglyph", (a, ...c) => mglyph(a as never, ...(c as never[])), "mglyph"],
    ["mi", (a, ...c) => mi(a as never, ...(c as never[])), "mi"],
    [
      "mlabeledtr",
      (a, ...c) => mlabeledtr(a as never, ...(c as never[])),
      "mlabeledtr",
    ],
    [
      "maligngroup",
      (a, ...c) => maligngroup(a as never, ...(c as never[])),
      "maligngroup",
    ],
    [
      "malignmark",
      (a, ...c) => malignmark(a as never, ...(c as never[])),
      "malignmark",
    ],
    [
      "mmultiscripts",
      (a, ...c) => mmultiscripts(a as never, ...(c as never[])),
      "mmultiscripts",
    ],
    ["mn", (a, ...c) => mn(a as never, ...(c as never[])), "mn"],
    ["mo", (a, ...c) => mo(a as never, ...(c as never[])), "mo"],
    ["mpadded", (a, ...c) => mpadded(a as never, ...(c as never[])), "mpadded"],
    [
      "mphantom",
      (a, ...c) => mphantom(a as never, ...(c as never[])),
      "mphantom",
    ],
    [
      "mprescripts",
      (a, ...c) => mprescripts(a as never, ...(c as never[])),
      "mprescripts",
    ],
    ["mroot", (a, ...c) => mroot(a as never, ...(c as never[])), "mroot"],
    ["mrow", (a, ...c) => mrow(a as never, ...(c as never[])), "mrow"],
    ["ms", (a, ...c) => ms(a as never, ...(c as never[])), "ms"],
    ["mspace", (a, ...c) => mspace(a as never, ...(c as never[])), "mspace"],
    ["msqrt", (a, ...c) => msqrt(a as never, ...(c as never[])), "msqrt"],
    ["mstyle", (a, ...c) => mstyle(a as never, ...(c as never[])), "mstyle"],
    ["msub", (a, ...c) => msub(a as never, ...(c as never[])), "msub"],
    ["msubsup", (a, ...c) => msubsup(a as never, ...(c as never[])), "msubsup"],
    ["msup", (a, ...c) => msup(a as never, ...(c as never[])), "msup"],
    ["mtable", (a, ...c) => mtable(a as never, ...(c as never[])), "mtable"],
    ["mtd", (a, ...c) => mtd(a as never, ...(c as never[])), "mtd"],
    ["mtext", (a, ...c) => mtext(a as never, ...(c as never[])), "mtext"],
    ["mtr", (a, ...c) => mtr(a as never, ...(c as never[])), "mtr"],
    ["munder", (a, ...c) => munder(a as never, ...(c as never[])), "munder"],
    [
      "munderover",
      (a, ...c) => munderover(a as never, ...(c as never[])),
      "munderover",
    ],
    ["none", (a, ...c) => none(a as never, ...(c as never[])), "none"],
    [
      "semantics",
      (a, ...c) => semantics(a as never, ...(c as never[])),
      "semantics",
    ],
  ];

  for (const [name, factory, expectedTag] of cases) {
    it(`creates ${name} element in MathML namespace`, () => {
      const el = factory();
      expect(el.tagName.toLowerCase()).toBe(expectedTag);
      expect(el.namespaceURI).toBe(MATHML_NS);
    });
  }
});

describe("h`` template: <template> container", () => {
  it("parses <tr> correctly (not mangled by <div> container)", () => {
    const elements = h`<tr><td>cell</td></tr>`;
    expect(elements.length).toBe(1);
    expect(elements[0].tagName).toBe("TR");
    const td = elements[0].querySelector("td");
    expect(td).not.toBe(null);
    expect(td?.textContent).toBe("cell");
  });

  it("parses <td> as standalone element", () => {
    const elements = h`<td>data</td>`;
    expect(elements.length).toBe(1);
    expect(elements[0].tagName).toBe("TD");
  });

  it("parses <col> element", () => {
    const elements = h`<col span="2" />`;
    expect(elements.length).toBe(1);
    expect(elements[0].tagName).toBe("COL");
  });

  it("parses <thead>, <tbody>, <tfoot> correctly", () => {
    const elements = h`<thead><tr><td>h</td></tr></thead>`;
    expect(elements.length).toBe(1);
    expect(elements[0].tagName).toBe("THEAD");
  });

  it("creates <a> as SVGAElement inside <svg>", () => {
    const elements = h`<svg><a href="#">link</a></svg>`;
    const svg = elements[0];
    expect(svg.namespaceURI).toBe("http://www.w3.org/2000/svg");
    const a = svg.querySelector("a");
    expect(a?.namespaceURI).toBe("http://www.w3.org/2000/svg");
  });

  it("creates nested SVG elements with correct namespace", () => {
    const elements = h`<svg><g><circle cx="10" cy="10" r="5" /></g></svg>`;
    const svg = elements[0];
    const circle = svg.querySelector("circle");
    expect(circle?.namespaceURI).toBe("http://www.w3.org/2000/svg");
  });

  it("parses <template> element inside template literal", () => {
    const elements = h`<template><div>shadow</div></template>`;
    expect(elements.length).toBe(1);
    expect(elements[0].tagName).toBe("TEMPLATE");
    const tpl = elements[0] as HTMLTemplateElement;
    expect(tpl.content.querySelector("div")?.textContent).toBe("shadow");
  });

  it("parses nested <template> elements", () => {
    const elements = h`<template><template id="inner"><span>deep</span></template></template>`;
    expect(elements.length).toBe(1);
    const outer = elements[0] as HTMLTemplateElement;
    const inner = outer.content.querySelector(
      "template",
    ) as HTMLTemplateElement;
    expect(inner).not.toBe(null);
    expect(inner.content.querySelector("span")?.textContent).toBe("deep");
  });

  it("repeated calls with nested <template> produce independent results", () => {
    const els1 = h`<template><div>A</div></template>`;
    const els2 = h`<template><div>B</div></template>`;
    const tpl1 = els1[0] as HTMLTemplateElement;
    const tpl2 = els2[0] as HTMLTemplateElement;
    expect(tpl1.content.querySelector("div")?.textContent).toBe("A");
    expect(tpl2.content.querySelector("div")?.textContent).toBe("B");
  });
});

describe("h`` template: caching", () => {
  it("returns independent elements on repeated calls with same template", () => {
    const a = h`<div class="x">A</div>`;
    const b = h`<div class="x">B</div>`;
    expect(a[0]).not.toBe(b[0]);
    expect(a[0].textContent).toBe("A");
    expect(b[0].textContent).toBe("B");
  });

  it("correctly binds signals on cached template second invocation", async () => {
    const color1 = signal("red");
    const elements1 = h`<div style="color: ${color1}">First</div>`;
    const color2 = signal("blue");
    const elements2 = h`<div style="color: ${color2}">Second</div>`;
    expect((elements1[0] as HTMLElement).style.color).toBe("red");
    expect((elements2[0] as HTMLElement).style.color).toBe("blue");
    color1.set("green");
    await new Promise((r) => setTimeout(r, 50));
    expect((elements1[0] as HTMLElement).style.color).toBe("green");
    expect((elements2[0] as HTMLElement).style.color).toBe("blue");
  });

  it("correctly binds text signals on cached template second invocation", async () => {
    const name1 = signal("Alice");
    const els1 = h`<span>Hello ${name1}!</span>`;
    const name2 = signal("Bob");
    const els2 = h`<span>Hello ${name2}!</span>`;
    const c1 = document.createElement("div");
    const c2 = document.createElement("div");
    for (const el of els1) c1.appendChild(el);
    for (const el of els2) c2.appendChild(el);
    expect(c1.textContent).toBe("Hello Alice!");
    expect(c2.textContent).toBe("Hello Bob!");
    name1.set("Carol");
    await new Promise((r) => setTimeout(r, 50));
    expect(c1.textContent).toBe("Hello Carol!");
    expect(c2.textContent).toBe("Hello Bob!");
  });

  it("correctly binds element interpolation on cached template", () => {
    const child1 = document.createElement("em");
    child1.textContent = "first";
    const els1 = h`<p>${child1}</p>`;
    const child2 = document.createElement("strong");
    child2.textContent = "second";
    const els2 = h`<p>${child2}</p>`;
    const c1 = document.createElement("div");
    const c2 = document.createElement("div");
    for (const el of els1) c1.appendChild(el);
    for (const el of els2) c2.appendChild(el);
    expect(c1.querySelector("em")?.textContent).toBe("first");
    expect(c2.querySelector("strong")?.textContent).toBe("second");
  });

  it("correctly binds mixed text + attr signals on cached template", async () => {
    const name1 = signal("X");
    const color1 = signal("red");
    const els1 = h`<span style="color: ${color1}">${name1}</span>`;
    const name2 = signal("Y");
    const color2 = signal("blue");
    const els2 = h`<span style="color: ${color2}">${name2}</span>`;
    const c1 = document.createElement("div");
    const c2 = document.createElement("div");
    for (const el of els1) c1.appendChild(el);
    for (const el of els2) c2.appendChild(el);
    expect(c1.textContent).toBe("X");
    expect(c2.textContent).toBe("Y");
    expect((c1.firstChild as HTMLElement).style.color).toBe("red");
    expect((c2.firstChild as HTMLElement).style.color).toBe("blue");
    name1.set("Z");
    color1.set("green");
    await new Promise((r) => setTimeout(r, 50));
    expect(c1.textContent).toBe("Z");
    expect((c1.firstChild as HTMLElement).style.color).toBe("green");
    expect(c2.textContent).toBe("Y");
    expect((c2.firstChild as HTMLElement).style.color).toBe("blue");
  });

  it("different template structures use separate cache entries", async () => {
    const a = signal("1");
    const els1 = h`<div>${a}</div>`;
    const b = signal("2");
    const els2 = h`<span>${b}</span>`;
    const c1 = document.createElement("div");
    const c2 = document.createElement("div");
    for (const el of els1) c1.appendChild(el);
    for (const el of els2) c2.appendChild(el);
    expect(c1.firstChild?.nodeName).toBe("DIV");
    expect(c2.firstChild?.nodeName).toBe("SPAN");
    a.set("updated");
    await new Promise((r) => setTimeout(r, 50));
    expect(c1.textContent).toBe("updated");
    expect(c2.textContent).toBe("2");
  });

  it("cached template with multiple signals on same element", async () => {
    const x = signal("a");
    const y = signal("b");
    const els1 = h`<div data-x="${x}" data-y="${y}">first</div>`;
    const x2 = signal("c");
    const y2 = signal("d");
    const els2 = h`<div data-x="${x2}" data-y="${y2}">second</div>`;
    expect(els1[0].getAttribute("data-x")).toBe("a");
    expect(els1[0].getAttribute("data-y")).toBe("b");
    expect(els2[0].getAttribute("data-x")).toBe("c");
    expect(els2[0].getAttribute("data-y")).toBe("d");
    x.set("updated");
    await new Promise((r) => setTimeout(r, 50));
    expect(els1[0].getAttribute("data-x")).toBe("updated");
    expect(els2[0].getAttribute("data-x")).toBe("c");
  });

  it("same template called N times with different signals all bind independently", async () => {
    const names = ["Alice", "Bob", "Carol", "Dave", "Eve"];
    const signals = names.map((n) => signal(n));
    const containers = signals.map((s) => {
      const els = h`<span>${s}</span>`;
      const c = document.createElement("div");
      for (const el of els) c.appendChild(el);
      return c;
    });
    // Initial values correct
    for (let i = 0; i < names.length; i++) {
      expect(containers[i].textContent).toBe(names[i]);
    }
    // Update one signal, only its container changes
    signals[2].set("Changed");
    await new Promise((r) => setTimeout(r, 50));
    expect(containers[0].textContent).toBe("Alice");
    expect(containers[1].textContent).toBe("Bob");
    expect(containers[2].textContent).toBe("Changed");
    expect(containers[3].textContent).toBe("Dave");
    expect(containers[4].textContent).toBe("Eve");
    // Update all signals
    for (const s of signals) s.set("updated");
    await new Promise((r) => setTimeout(r, 50));
    for (const c of containers) {
      expect(c.textContent).toBe("updated");
    }
  });

  it("same template with attr signals called N times all bind independently", async () => {
    const colors = ["red", "green", "blue"];
    const signals = colors.map((c) => signal(c));
    const elements = signals.map((s) => h`<div style="color: ${s}">item</div>`);
    // Initial values
    for (let i = 0; i < colors.length; i++) {
      expect((elements[i][0] as HTMLElement).style.color).toBe(colors[i]);
    }
    // Change one
    signals[1].set("orange");
    await new Promise((r) => setTimeout(r, 50));
    expect((elements[0][0] as HTMLElement).style.color).toBe("red");
    expect((elements[1][0] as HTMLElement).style.color).toBe("orange");
    expect((elements[2][0] as HTMLElement).style.color).toBe("blue");
  });

  it("same template with mixed signals called N times all bind independently", async () => {
    const items = [
      { name: signal("A"), color: signal("red") },
      { name: signal("B"), color: signal("green") },
      { name: signal("C"), color: signal("blue") },
    ];
    const containers = items.map(({ name, color }) => {
      const els = h`<div style="color: ${color}">${name}</div>`;
      const c = document.createElement("div");
      for (const el of els) c.appendChild(el);
      return c;
    });
    for (let i = 0; i < items.length; i++) {
      expect(containers[i].textContent).toBe(["A", "B", "C"][i]);
      expect((containers[i].firstChild as HTMLElement).style.color).toBe(
        ["red", "green", "blue"][i],
      );
    }
    items[0].name.set("X");
    items[1].color.set("yellow");
    await new Promise((r) => setTimeout(r, 50));
    expect(containers[0].textContent).toBe("X");
    expect((containers[0].firstChild as HTMLElement).style.color).toBe("red");
    expect(containers[1].textContent).toBe("B");
    expect((containers[1].firstChild as HTMLElement).style.color).toBe(
      "yellow",
    );
    expect(containers[2].textContent).toBe("C");
    expect((containers[2].firstChild as HTMLElement).style.color).toBe("blue");
  });
});

describe("h`` template: no beacon attribute", () => {
  it("does not leave data-rk-bind beacon on elements with signal attrs", async () => {
    const color = signal("red");
    const elements = h`<div style="color: ${color}">Text</div>`;
    const div = elements[0];
    expect(div.hasAttribute("data-rk-bind")).toBe(false);
    expect((div as HTMLElement).style.color).toBe("red");
    color.set("blue");
    await new Promise((r) => setTimeout(r, 50));
    expect((div as HTMLElement).style.color).toBe("blue");
    expect(div.hasAttribute("data-rk-bind")).toBe(false);
  });

  it("does not leave beacon on elements without signal attrs", () => {
    const elements = h`<div class="static">Text</div>`;
    expect(elements[0].hasAttribute("data-rk-bind")).toBe(false);
  });
});

describe("bindAttrs()", () => {
  it("applies static attributes to an existing element", () => {
    const el = document.createElement("div");
    bindAttrs(el, { class: "container", id: "main" });
    expect(el.className).toBe("container");
    expect(el.id).toBe("main");
  });

  it("reactively updates a signal attribute", async () => {
    const className = signal("a");
    const el = document.createElement("div");
    bindAttrs(el, { class: className });
    await new Promise((r) => setTimeout(r, 10));
    expect(el.className).toBe("a");
    className.set("b");
    await new Promise((r) => setTimeout(r, 50));
    expect(el.className).toBe("b");
  });

  it("handles style string", () => {
    const el = document.createElement("div");
    bindAttrs(el, { style: "color: red" });
    expect(el.style.color).toBe("red");
  });

  it("handles style object", () => {
    const el = document.createElement("div");
    bindAttrs(el, { style: { color: "red", fontSize: "16px" } });
    expect(el.style.color).toBe("red");
    expect(el.style.fontSize).toBe("16px");
  });

  it("assigns event handlers", () => {
    let clicked = false;
    const el = document.createElement("button");
    bindAttrs(el, {
      onclick: () => {
        clicked = true;
      },
    });
    el.click();
    expect(clicked).toBe(true);
  });

  it("two-way binds value on input", async () => {
    const value = signal("hello");
    const el = document.createElement("input");
    bindAttrs(el, { value });
    await new Promise((r) => setTimeout(r, 10));
    expect(el.value).toBe("hello");

    el.value = "world";
    el.dispatchEvent(new Event("input"));
    await new Promise((r) => setTimeout(r, 10));
    expect(value.get()).toBe("world");
  });

  it("two-way binds value on textarea", async () => {
    const value = signal("hello");
    const el = document.createElement("textarea");
    bindAttrs(el, { value });
    await new Promise((r) => setTimeout(r, 10));
    expect(el.value).toBe("hello");

    el.value = "world";
    el.dispatchEvent(new Event("input"));
    await new Promise((r) => setTimeout(r, 10));
    expect(value.get()).toBe("world");
  });

  it("two-way binds value on select", async () => {
    const value = signal("a");
    const el = document.createElement("select");
    el.appendChild(document.createElement("option")).value = "a";
    el.appendChild(document.createElement("option")).value = "b";
    bindAttrs(el, { value });
    await new Promise((r) => setTimeout(r, 10));
    expect(el.value).toBe("a");

    el.value = "b";
    el.dispatchEvent(new Event("change"));
    await new Promise((r) => setTimeout(r, 10));
    expect(value.get()).toBe("b");
  });

  it("two-way binds checked on checkbox", async () => {
    const checked = signal(false);
    const el = document.createElement("input");
    el.type = "checkbox";
    bindAttrs(el, { checked });
    await new Promise((r) => setTimeout(r, 10));
    expect(el.checked).toBe(false);

    el.checked = true;
    el.dispatchEvent(new Event("change"));
    await new Promise((r) => setTimeout(r, 10));
    expect(checked.get()).toBe(true);
  });

  it("two-way binds selectedIndex on select", async () => {
    const selectedIndex = signal(0);
    const el = document.createElement("select");
    el.appendChild(document.createElement("option"));
    el.appendChild(document.createElement("option"));
    bindAttrs(el, { selectedIndex });
    await new Promise((r) => setTimeout(r, 10));
    expect(el.selectedIndex).toBe(0);

    el.selectedIndex = 1;
    el.dispatchEvent(new Event("change"));
    await new Promise((r) => setTimeout(r, 10));
    expect(selectedIndex.get()).toBe(1);
  });

  it("reads valueAsNumber for number input", async () => {
    const value = signal(0);
    const el = document.createElement("input");
    el.type = "number";
    bindAttrs(el, { value });
    await new Promise((r) => setTimeout(r, 10));
    expect(el.valueAsNumber).toBe(0);

    el.value = "42";
    el.dispatchEvent(new Event("input"));
    await new Promise((r) => setTimeout(r, 10));
    expect(value.get()).toBe(42);
    expect(typeof value.get()).toBe("number");
  });

  it("does not set up two-way binding for non-form attributes", async () => {
    const disabled = signal(false);
    const el = document.createElement("button");
    bindAttrs(el, { disabled });
    await new Promise((r) => setTimeout(r, 10));
    expect(el.disabled).toBe(false);

    el.disabled = true;
    el.dispatchEvent(new Event("input"));
    await new Promise((r) => setTimeout(r, 10));
    expect(disabled.get()).toBe(false);
  });

  it("binds nested signal inside style object", async () => {
    const color = signal("red");
    const el = document.createElement("div");
    bindAttrs(el, { style: { color, fontSize: "16px" } });
    await new Promise((r) => setTimeout(r, 10));
    expect(el.style.color).toBe("red");
    expect(el.style.fontSize).toBe("16px");

    color.set("blue");
    await new Promise((r) => setTimeout(r, 50));
    expect(el.style.color).toBe("blue");
    expect(el.style.fontSize).toBe("16px");
  });

  it("two-way binds checked on radio", async () => {
    const checked = signal(false);
    const el = document.createElement("input");
    el.type = "radio";
    bindAttrs(el, { checked });
    await new Promise((r) => setTimeout(r, 10));
    expect(el.checked).toBe(false);

    el.checked = true;
    el.dispatchEvent(new Event("change"));
    await new Promise((r) => setTimeout(r, 10));
    expect(checked.get()).toBe(true);
  });

  it("reads valueAsNumber for range input", async () => {
    const value = signal(0);
    const el = document.createElement("input");
    el.type = "range";
    bindAttrs(el, { value });
    await new Promise((r) => setTimeout(r, 10));
    expect(el.valueAsNumber).toBe(0);

    el.value = "42";
    el.dispatchEvent(new Event("input"));
    await new Promise((r) => setTimeout(r, 10));
    expect(value.get()).toBe(42);
    expect(typeof value.get()).toBe("number");
  });

  it("does not two-way bind value on non-input element", async () => {
    const value = signal("hello");
    const el = document.createElement("div");
    bindAttrs(el, { value });
    await new Promise((r) => setTimeout(r, 10));
    expect(el.getAttribute("value")).toBe("hello");

    el.dispatchEvent(new Event("input"));
    await new Promise((r) => setTimeout(r, 10));
    expect(value.get()).toBe("hello");
  });

  it("does not two-way bind computed signal on input", async () => {
    const count = signal(1);
    const doubled = computed(() => count.get() * 2);
    const el = document.createElement("input");
    bindAttrs(el, { value: doubled });
    await new Promise((r) => setTimeout(r, 10));
    expect(el.value).toBe("2");

    el.value = "99";
    el.dispatchEvent(new Event("input"));
    await new Promise((r) => setTimeout(r, 10));
    expect(doubled.get()).toBe(2);

    count.set(5);
    await new Promise((r) => setTimeout(r, 50));
    expect(el.value).toBe("10");
  });
});

describe("bindAttr()", () => {
  it("applies a static attribute to an existing element", () => {
    const el = document.createElement("div");
    bindAttr(el, "class", "container");
    bindAttr(el, "id", "main");
    expect(el.className).toBe("container");
    expect(el.id).toBe("main");
  });

  it("reactively updates a signal attribute", async () => {
    const className = signal("a");
    const el = document.createElement("div");
    bindAttr(el, "class", className);
    await new Promise((r) => setTimeout(r, 10));
    expect(el.className).toBe("a");
    className.set("b");
    await new Promise((r) => setTimeout(r, 10));
    expect(el.className).toBe("b");
  });

  it("handles style string", () => {
    const el = document.createElement("div");
    bindAttr(el, "style", "color: red");
    expect(el.style.color).toBe("red");
  });

  it("assigns event handlers", () => {
    let clicked = false;
    const el = document.createElement("button");
    bindAttr(el, "onclick", () => {
      clicked = true;
    });
    el.click();
    expect(clicked).toBe(true);
  });

  it("on* key with non-function value does not fall through to setAttribute", () => {
    const el = document.createElement("button");
    bindAttr(el, "onclick", null);
    expect(el.hasAttribute("onclick")).toBe(false);
    bindAttr(el, "onclick", undefined);
    expect(el.hasAttribute("onclick")).toBe(false);
    bindAttr(el, "onclick", "not a function");
    expect(el.hasAttribute("onclick")).toBe(false);
  });

  it("two-way binds value on input", async () => {
    const value = signal("hello");
    const el = document.createElement("input");
    bindAttr(el, "value", value);
    await new Promise((r) => setTimeout(r, 10));
    expect(el.value).toBe("hello");

    el.value = "world";
    el.dispatchEvent(new Event("input"));
    await new Promise((r) => setTimeout(r, 10));
    expect(value.get()).toBe("world");
  });

  it("removes attribute for null/false static values", () => {
    const el = document.createElement("div");
    el.setAttribute("data-x", "1");
    bindAttr(el, "data-x", null);
    expect(el.getAttribute("data-x")).toBe(null);
    bindAttr(el, "data-y", false);
    expect(el.hasAttribute("data-y")).toBe(false);
  });

  it("sets boolean attribute for true", () => {
    const el = document.createElement("button");
    bindAttr(el, "disabled", true);
    expect(el.hasAttribute("disabled")).toBe(true);
  });

  it("unbindAttr stops reactive updates for a signal binding", async () => {
    const className = signal("a");
    const el = document.createElement("div");
    bindAttr(el, "class", className);
    await new Promise((r) => setTimeout(r, 10));
    expect(el.className).toBe("a");

    unbindAttr(el, "class");
    className.set("b");
    await new Promise((r) => setTimeout(r, 20));
    expect(el.className).toBe("a");
  });

  it("unbindAttr on a missing key is a no-op", () => {
    const el = document.createElement("div");
    expect(() => unbindAttr(el, "class")).not.toThrow();
  });

  it("unbindAttr removes two-way listener", async () => {
    const value = signal("hello");
    const el = document.createElement("input");
    bindAttr(el, "value", value);
    await new Promise((r) => setTimeout(r, 10));

    unbindAttr(el, "value");
    el.value = "world";
    el.dispatchEvent(new Event("input"));
    await new Promise((r) => setTimeout(r, 10));
    expect(value.get()).toBe("hello");
  });

  it("re-binding same key replaces the previous signal binding", async () => {
    const a = signal("a");
    const b = signal("b");
    const el = document.createElement("div");
    bindAttr(el, "class", a);
    await new Promise((r) => setTimeout(r, 10));
    expect(el.className).toBe("a");

    bindAttr(el, "class", b);
    await new Promise((r) => setTimeout(r, 10));
    expect(el.className).toBe("b");

    a.set("a2");
    await new Promise((r) => setTimeout(r, 20));
    expect(el.className).toBe("b");

    b.set("b2");
    await new Promise((r) => setTimeout(r, 20));
    expect(el.className).toBe("b2");
  });

  it("re-binding two-way attr does not double-write the signal", async () => {
    const first = signal("x");
    const second = signal("y");
    const el = document.createElement("input");
    bindAttr(el, "value", first);
    await new Promise((r) => setTimeout(r, 10));

    bindAttr(el, "value", second);
    await new Promise((r) => setTimeout(r, 10));
    expect(el.value).toBe("y");

    el.value = "typed";
    el.dispatchEvent(new Event("input"));
    await new Promise((r) => setTimeout(r, 10));
    expect(second.get()).toBe("typed");
    expect(first.get()).toBe("x");
  });

  it("two-way binding survives multiple signal changes", async () => {
    const value = signal("a");
    const el = document.createElement("input");
    bindAttr(el, "value", value);
    await new Promise((r) => setTimeout(r, 10));

    for (const next of ["b", "c", "d", "e"]) {
      value.set(next);
      await new Promise((r) => setTimeout(r, 10));
      expect(el.value).toBe(next);
      el.value = next + "!";
      el.dispatchEvent(new Event("input"));
      await new Promise((r) => setTimeout(r, 10));
      expect(value.get()).toBe(next + "!");
    }
  });

  it("unbindAttr disposes nested style signal effects", async () => {
    const color = signal("red");
    const el = document.createElement("div");
    bindAttr(el, "style", { color });
    await new Promise((r) => setTimeout(r, 10));
    expect(el.style.color).toBe("red");

    unbindAttr(el, "style");
    color.set("blue");
    await new Promise((r) => setTimeout(r, 20));
    expect(el.style.color).toBe("red");
  });

  it("repeated rebind does not accumulate active effects", async () => {
    const el = document.createElement("div");
    const sigs = Array.from({ length: 10 }, (_, i) => signal(`v${i}`));

    for (const s of sigs) {
      bindAttr(el, "class", s);
      await new Promise((r) => setTimeout(r, 5));
    }

    await new Promise((r) => setTimeout(r, 10));
    expect(el.className).toBe("v9");

    for (let i = 0; i < 9; i++) {
      sigs[i].set("changed");
      await new Promise((r) => setTimeout(r, 10));
      expect(el.className).toBe("v9");
    }

    sigs[9].set("v9-updated");
    await new Promise((r) => setTimeout(r, 10));
    expect(el.className).toBe("v9-updated");
  });
});

describe("attachRange()", () => {
  it("mounts a ReactiveRange into an existing parent", () => {
    const parent = document.createElement("div");
    const range = new ReactiveRange((range) => {
      const p = range.parent;
      if (!p) return;
      const span = document.createElement("span");
      span.textContent = "hi";
      p.insertBefore(span, range.end);
    });
    attachRange(parent, range);
    expect(parent.textContent).toBe("hi");
  });

  it("respects the ref insertion point", () => {
    const parent = document.createElement("div");
    const first = document.createElement("p");
    first.textContent = "first";
    parent.appendChild(first);

    const range = new ReactiveRange((range) => {
      const p = range.parent;
      if (!p) return;
      const span = document.createElement("span");
      span.textContent = "middle";
      p.insertBefore(span, range.end);
    });
    attachRange(parent, range, first);
    expect(parent.textContent).toBe("middlefirst");
  });

  it("detaches cleanly", () => {
    const parent = document.createElement("div");
    const range = new ReactiveRange((range) => {
      const p = range.parent;
      if (!p) return;
      const span = document.createElement("span");
      span.textContent = "hi";
      p.insertBefore(span, range.end);
    });
    attachRange(parent, range);
    range.detach();
    expect(parent.textContent).toBe("");
    expect(range.alive).toBe(false);
  });
});
