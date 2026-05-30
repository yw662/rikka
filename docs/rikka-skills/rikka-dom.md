# rikka-dom

> 创建真实 DOM 元素的 hyperscript `h()` 函数。无虚拟 DOM。

## 核心概念：直接返回 Element

`h()` 和所有 tag helper **直接返回 DOM 元素**，无需二次调用。

```typescript
import { h } from "rikka-dom";

const el = h("div", { class: "container" }, h("p", "Hello"));
// el 就是 HTMLDivElement，可以直接使用

document.body.appendChild(el); // 直接追加到 DOM
```

```typescript
// 嵌套组件模式：
const Card = (title) => div({ class: "card" }, h2(title));
const App = div(Card("Hello"), Card("World"));
document.body.appendChild(App);
```

## 组合式组件

任何返回 `Element` 的函数都是组件。无需注册：

```typescript
import { div, p, button, span } from "rikka-dom";

const Card = (title) => div({ class: "card" }, p(title));
const Badge = (label) => span({ class: "badge" }, label);

const App = div({ class: "container" }, Card("Hello"), Badge("New"));
```

### 在 h() 中使用 Custom Elements

`defineElement()` 创建的自定义元素可以直接作为 tag 传入 `h()`：

```typescript
import { defineElement } from "rikka-elements";
import { div, h1 } from "rikka-dom";

const MyCard = defineElement("my-card", {
  attributes: { title: String },
});

// 传入构造函数（带 .h 属性），h() 自动调用 .h
const app = div(h1("App"), MyCard.h({ title: "Hello" }));
```

## API 参考

### `h(tag, attrs?, ...children): Element`

创建 DOM 元素。重载形式：

```typescript
h<K extends keyof ElementTagNameMap>(tag: K, attrs?: Attributes<K>, ...children: Child[]): ElementTagNameMap[K]
h<T extends { new(): HTMLElement; tagName: string }>(tag: T, ...args: any[]): InstanceType<T>
h(tag: string, ...args: any[]): Element
h<T extends Element, A extends Record<string, unknown>>(tag: ElementConstructor<T, A>, ...children: Child[]): T
h<T extends Element, A extends Record<string, unknown>>(tag: ElementConstructor<T, A>, attrs: A & CommonHTMLAttributes, ...children: Child[]): T
```

### `h\`...\`: Element[]`

HTML 模板字面量，支持信号插值。返回 **Element 数组**（不是 DocumentFragment）。

```typescript
import { h } from "rikka-dom";
import { signal } from "rikka-signal";

const name = signal("World");
const elements = h`<span>Hello ${name}!</span>`;
// elements 是 Element[]
elements[0] instanceof HTMLSpanElement; // true
```

**获取 HTMLTemplateElement：**

```typescript
// h`<template>`[0] 得到真正的 HTMLTemplateElement
const tmpl = h`<template><div>{{name}}</div></template>`[0];
tmpl instanceof HTMLTemplateElement; // true
```

**信号插值的三种模式：**

| 写法                       | 模式                          | 行为                                                  |
| -------------------------- | ----------------------------- | ----------------------------------------------------- |
| `${signal}`                | 细粒度（Fine-grained）        | 创建 effect，只更新文本节点。保留焦点、光标、滚动位置 |
| `${signal.get()}`          | 失去响应性（Lost reactivity） | 立即解析为值，不建立响应绑定                          |
| `computed(() => h\`...\`)` | 粗粒度（Coarse-grained）      | 整个模板在依赖变更时重建                              |

```typescript
const count = signal(0);

// 细粒度：只更新数字文本节点
h`<span>Count: ${count}</span>`;

// 失去响应性：永远是初始值
h`<span>Count: ${count.get()}</span>`;

// 粗粒度：整个 <span> 重建
const template = computed(() => h`<span>Count: ${count.get()}</span>`);
```

**属性中的信号插值：**

```typescript
const color = signal("red");
h`<div style="color: ${color}">Text</div>`; // 属性随信号变化更新
```

**Element 插值：**

```typescript
const child = div("Hello");
h`<div>${child}</div>`; // 直接插入 DOM 元素
```

### Tag Helpers

69 个预定义的 tag 函数，签名与 `h()` 相同但省略 tag 参数。全部返回 `Element`：

```typescript
// HTML 标签
(div,
  span,
  p,
  a,
  button,
  input,
  form,
  ul,
  ol,
  li,
  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  header,
  footer,
  main,
  section,
  nav,
  article,
  aside,
  img,
  table,
  thead,
  tbody,
  tr,
  th,
  td,
  label,
  select,
  option,
  textarea,
  pre,
  code,
  br,
  hr,
  slot,
  template,
  // SVG 标签
  svg,
  circle,
  path,
  rect,
  line,
  polygon,
  polyline,
  g,
  defs,
  use,
  foreignObject,
  clipPath,
  pattern,
  marker,
  mask,
  image,
  linearGradient,
  radialGradient,
  stop,
  symbol,
  filter,
  ellipse,
  // SVG 命名空间标签（用于与 HTML 同名标签区分）
  svga,
  svgscript,
  svgstyle,
  svgtitle,
  svgtext,
  svgspan,
  svgtextPath);
```

```typescript
// 所有都直接返回 Element
div({ id: "app" }, h1({}, "Title")); // → HTMLDivElement
```

### SVG 命名空间标签

HTML 和 SVG 共有部分同名标签（`a`、`script`、`style`、`title`）。默认情况下这些标签在 HTML 命名空间创建，如果需要在 SVG 命名空间创建，使用带 `svg` 前缀的版本：

```typescript
import { a, svga, title, svgtitle } from "rikka-dom";

// HTML <a> —— HTMLAnchorElement
a({ href: "https://example.com" }, "Link");

// SVG <a> —— SVGAElement
svga({ href: "https://example.com" }, "Link");

// HTML <title> —— HTMLTitleElement
title("Page Title");

// SVG <title> —— SVGTitleElement
svgtitle("SVG Title");

// SVG <text> —— SVGTextElement
svgtext({ x: 50, y: 55 }, "Hello SVG");

// SVG <tspan> —— SVGTSpanElement（重命名以提高可读性）
svgspan({ dy: 20 }, "subscript");

// SVG <textPath> —— SVGTextPathElement（重命名以提高可读性）
svgtextPath({ href: "#myPath" }, "Text on path");
```

### `For(source, render, keyFn?): ReactiveRange`

从信号数组渲染列表。`source` 接受 `Signal.State<T[]>` 或 `Signal.Computed<T[]>`。提供 keyFn 时按 key 缓存 DOM 元素以实现高效更新。

```typescript
import { For } from "rikka-dom";
import { signal } from "rikka-signal";

const items = signal(["a", "b", "c"]);
const list = For(items, (item) => li({}, item));

// 带 keyFn：按 key 缓存，只增删变更的项
const users = signal([{ id: 1, name: "Alice" }]);
For(
  users,
  (user) => li({}, user.name),
  (user) => user.id,
);
```

无 keyFn 时按引用（`Object.is`）缓存。未使用的缓存条目在每次重算时清理。

### `Show(condition, render): ReactiveRange`

条件渲染。切换时缓存 DOM 元素。

```typescript
import { Show } from "rikka-dom";
import { signal } from "rikka-signal";

const visible = signal(true);
Show(visible, () => span({}, "visible"));
// visible.set(false) 时元素从 DOM 移除
```

### `When(condition, trueRender, falseRender): ReactiveRange`

二选一条件分支。两个分支都会被缓存。

```typescript
import { When } from "rikka-dom";
import { signal } from "rikka-signal";

const loggedIn = signal(false);
When(
  loggedIn,
  () => span({}, "Welcome!"),
  () => span({}, "Please log in"),
);
```

### `Switch(value, cases, fallback?): ReactiveRange`

多路匹配，每个 case 的 DOM 都会被缓存。

```typescript
import { Switch, Match } from "rikka-dom";
import { signal } from "rikka-signal";

const mode = signal("edit");
Switch(
  mode,
  Match("edit", () => textarea()),
  Match("preview", () => div({}, "Preview")),
  Match(
    (v) => v.startsWith("admin"),
    () => div({}, "Admin"),
  ),
);
```

### `Match(matcher, render): Case<T>`

为 `Switch` 定义一个 case。matcher 可以是值（`Object.is` 比较）或谓词函数。

## 属性

### 静态属性

```typescript
div({ id: "main", class: "container" }, "Content");
```

### 信号属性

```typescript
import { signal } from "rikka-signal";

const color = signal("red");
div({ style: { color: color } }, "Dynamic content");
// 颜色变化时属性自动更新
```

信号属性通过 `effect()` 创建响应式绑定。当信号值变化时属性自动更新。Effect 通过 `WeakRef` + `FinalizationRegistry` 与元素关联 —— 元素被 GC 时 effect 自动清理。

### 事件处理器

```typescript
button({ onclick: (e) => console.log("clicked!") }, "Click me");
```

事件处理器设置为 DOM event handler property（如 `el.onclick = fn`），非 addEventListener。

### 双向绑定

对 `<input>`、`<textarea>`、`<select>` 的 `value`、`checked`、`selectedIndex` 属性，使用可写 signal（`Signal.State`）时自动建立双向绑定：

```typescript
import { signal } from "rikka-signal";

const text = signal("");
input({ value: text }); // input 事件同步回 signal

const checked = signal(false);
input({ type: "checkbox", checked: checked }); // change 事件同步回

const index = signal(0);
select({ selectedIndex: index }, option("A"), option("B")); // change 事件同步回
```

反向方向使用 `addEventListener`（非 DOM 属性赋值）。事件类型自动判定：text/value 用 `input`，checked 和 selectedIndex 用 `change`。

## 子元素

`Child` 类型联合：

```typescript
type Child =
  | null
  | string
  | number
  | Element
  | DocumentFragment
  | ReactiveRange
  | Signal.State<Child>
  | Signal.Computed<Child>
  | Child[]
  | Signal.State<Child[]>
  | Signal.Computed<Child[]>;
```

### 字符串 / 数字

```typescript
p("Simple text");
span(42);
```

### 元素

```typescript
div({}, p("Child 1"), p("Child 2"));
```

### 信号

```typescript
import { signal } from "rikka-signal";

const text = signal("Hello");
div({}, text); // 自动追踪并更新文本节点
```

信号子元素使用 comment marker（`<!---->`) 实现高效细粒度更新 —— 只替换 marker 之间的内容，不影响兄弟节点。

### 数组

```typescript
div([span("A"), span("B")]);
```

## 样式

### `css\`...\`: CSSStyleSheet`

创建 `CSSStyleSheet` 对象的标签模板。用于 shadow DOM 样式表：

```typescript
import { css } from "rikka-dom";

const sheet = css`
  :host {
    display: block;
  }
  .card {
    padding: 16px;
    border-radius: 8px;
  }
`;
// sheet instanceof CSSStyleSheet === true
```

可以插值合并已有的 CSSStyleSheet：

```typescript
const base = css`
  :host {
    display: block;
    font-family: system-ui;
  }
`;
const component = css`
  ${base}
  .card {
    padding: 16px;
  }
`;
```

### `inlineStyle\`...\`: Record<string, string>`

创建内联样式对象。CSS 属性名自动转 camelCase：

```typescript
import { inlineStyle } from "rikka-dom";

const s = inlineStyle`
  padding: 16px;
  border-radius: 8px;
  background: #1a1a2e;
`;
// { padding: '16px', borderRadius: '8px', background: '#1a1a2e' }

div({ style: s }, "Hello");
```

**用途区分：**

- `css\`\` → `CSSStyleSheet`，用于 `defineElement` 的 `config.styles` 或 `adoptedStyleSheets`
- `inlineStyle\`\` → `Record<string, string>`，用于内联 `style` 属性

### 信号插值

`css` 和 `inlineStyle` 模板支持信号插值，信号变化时样式自动更新：

```typescript
import { signal } from "rikka-signal";

const theme = signal("dark");
const sheet = css`
  :host {
    color: ${theme};
  }
`;
// theme 变化时样式表自动更新

const s = inlineStyle`color: ${theme};`;
// theme 变化时内联样式自动更新
```

## 挂载应用

`h()` 和 tag 函数直接返回 `Element`，使用标准 DOM API 挂载：

```typescript
import { div, p, button } from "rikka-dom";
import { signal } from "rikka-signal";

const count = signal(0);

const app = div(
  {},
  p("Count: ", count),
  button({ onclick: () => count.set(count.get() + 1) }, "+"),
);

document.getElementById("app")!.appendChild(app);
```

## 命名空间处理

rikka-dom 自动处理 SVG 和 MathML 命名空间：

- SVG 专属标签（如 `circle`、`rect`、`path`、`g`、`defs`、`use` 等 22 个）在 SVG 命名空间中创建
- MathML 专属标签（如 `mfrac`、`mi`、`mo`）在 MathML 命名空间中创建
- HTML/SVG 同名标签（`a`、`script`、`style`、`title`）默认在 HTML 命名空间创建，使用 `svga`/`svgscript`/`svgstyle`/`svgtitle` 在 SVG 命名空间创建

## 注意事项

- `h()` 和 tag 函数直接返回 `Element` —— 无需二次调用
- `h\`` 返回 `Element[]`（数组），单个元素取 `[0]`
- `h\`<template>\``[0]` 可获取真正的 `HTMLTemplateElement`
- 信号属性和信号子元素自动创建响应式 `effect()` 绑定
- 信号子元素使用 comment marker 实现细粒度 DOM 更新
- `value`/`checked`/`selectedIndex` 在 input 元素上与 writable signal 自动双向绑定
- 无虚拟 DOM —— 变更直接应用到真实 DOM 节点
- 元素上的 effect 通过 `WeakRef` + `FinalizationRegistry` 在 GC 时自动清理

## 常见陷阱

### 1. `h\`` 返回数组，不是单个元素

```typescript
import { h } from "rikka-dom";

// ❌ 错误：elements 是数组，不是单个元素
const elements = h`<div>Hello</div>`;
document.body.appendChild(elements);
// TypeError: elements is not a Node (it's an Array)

// ✅ 正确：取 [0]
const el = h`<div>Hello</div>`[0];
document.body.appendChild(el); // HTMLDivElement
```

### 2. 获取 HTMLTemplateElement 需要特殊写法

模板绑定（defineElement 的 template 选项）需要真正的 `HTMLTemplateElement`：

```typescript
// ❌ 错误：这得到的是 <template> 元素的 Element[] 表示
const tmpl = h`<template><div>{{name}}</div></template>`;
tmpl[0]; // 是 <template> 本身，但内容可能不完整

// ✅ 正确：直接写 <template> 标签，[0] 就是 HTMLTemplateElement
const tmpl = h`<template><div>{{name}}</div></template>`[0];
tmpl instanceof HTMLTemplateElement; // true
tmpl.content; // DocumentFragment（含 <div>）
```

### 3. signal.get() 在 h\`` 中失去响应性

```typescript
const count = signal(0);

// ❌ 失去响应性：立即解析为 "0"，不再更新
h`<span>Count: ${count.get()}</span>`;

// ✅ 细粒度：创建 effect，只更新文本节点
h`<span>Count: ${count}</span>`;

// 粗粒度：整个模板重建（适合结构性变化）
const tpl = computed(() => h`<span>Count: ${count.get()}</span>`);
```

**选择指南：**

- 大多数场景用 `${signal}` —— 细粒度，保留焦点/光标/滚动位置
- 不需要更新的静态值用 `${signal.get()}`
- 模板结构本身需要变化时用 `computed(() => h\`...\`)`

### 4. 不要用 innerHTML，用 h() 替代

rikka-dom 提供了完整的声明式 API，不需要 innerHTML：

```typescript
// ❌ 不推荐：innerHTML 有 XSS 风险，且无法绑定信号
el.innerHTML = '<div class="card">' + title + "</div>";

// ✅ 推荐：使用 h() 或 tag helper
el.replaceChildren(div({ class: "card" }, title));
```

### 5. Number 属性默认值是 NaN —— 这是设计如此

```typescript
defineElement("my-el", {
  attributes: { count: Number },
  render() {
    console.log(this.count); // NaN（没有初始值）
    return div();
  },
});

// ✅ 通过 HTML 属性传初始值
// <my-el count="0"></my-el>

// ✅ 或通过 h() props 传初始值
h("my-el", { count: 0 });
```

`Number(undefined)` 返回 `NaN`，这是 JavaScript 的标准行为。如果需要自定义默认值，用自定义解析函数：`(v) => (v !== undefined ? Number(v) : 0)`。

### 6. HTML/SVG 同名标签需使用 svg 前缀版本

```typescript
import { a, svga, title, svgtitle } from "rikka-dom";

// ❌ 错误：在 SVG 上下文中使用 HTML 标签
svg(
  svga({ href: "#" }, "Link"), // ✅ SVG <a>
  a({ href: "#" }, "Link"), // ❌ 这是 HTML <a>，namespace 不对
);

// ✅ 正确：使用 svga/svgtitle/svgscript/svgstyle
svg(svga({ href: "#" }, "Link"), svgtitle("My SVG"));
```
