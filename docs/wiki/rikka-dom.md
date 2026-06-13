# rikka-dom — DOM 创建与响应式渲染

`@takanashi/rikka-dom` 提供声明式、直接操作真实 DOM 的渲染原语。它没有虚拟 DOM，所有操作最终都落到标准 Web API。

## 核心能力速览

| 类别 | 函数 | 作用 |
|------|------|------|
| Hyperscript | `h(tag, attrs?, ...children)` | 创建单个元素 |
| Tag helpers | `div / p / button / input / svg / ...` | 预生成的快捷函数 |
| 挂载 | `applyChild(parent, child)` | 将子节点插入父元素 |
| 条件渲染 | `Show / When / Switch / Match` | 响应式条件块 |
| 列表渲染 | `For(source, render, keyFn?)` | 响应式列表（可 key 化） |
| 范围 | `ReactiveRange` | 底层原语：一对注释标记间的节点 |
| 模板 | `h\`...\`` (tagged template) | HTML 模板字面量 |
| 样式 | `css\`...\`` / `inlineStyle\`...\`` | 样式表与 style 对象 |

## `h(tag, attrs?, ...children)` — Hyperscript

```ts
import { h } from "@takanashi/rikka-dom";

const btn = h("button", {
  class: "primary",
  onclick: (e) => console.log(e),
  disabled: false,
}, "Click me");
// → <button class="primary">Click me</button>
```

### 属性的特殊规则

- `class` / `className` — 均指向 HTML `class`
- `style` 接受字符串或对象（`{ color: "red", "--bg": "#fff" }`）
- `dataset` 接受对象，展开为 `data-*`
- `on*` 事件处理器 — 大小写不敏感
- `true` / `false` / `null` / `undefined` — 布尔属性，按 HTML 语义处理
- signal 值自动订阅，更新时只改该属性的局部 DOM

### 双向绑定 (表单)

当你把 `Signal.State` 传给 `value` / `checked` / `selectedIndex` 时，`rikka-dom` 会同时：

1. 信号变化 → 更新 DOM 属性（向下）
2. 用户输入 / 选择 → 调用 `signal.set(新值)`（向上）

```ts
const name = signal("");
h("input", { value: name, type: "text" });
// 用户输入 → name.set(用户输入值) → 同步回其它订阅点
```

> **内部实现**：`applyAttrSignal` 为双向属性额外绑定 `input` / `change` / `select` 事件监听器，用 `readTwoWayValue` 从 DOM 读回新值，然后 `signal.set()`。

### children 接受的类型

```ts
// 文本 / 数字
h("div", "hello", 42);

// 元素 / fragment
h("div", h("span", "nested"));

// Signal —— 自动响应式
h("div", "count = ", countSignal);

// computed —— 自动响应式
h("div", computed(() => `x = ${x.get()}`));

// 函数 —— 隐式 computed
h("div", () => `x = ${x.get()}`);

// 数组 (静态或 signal)
h("ul", items.get().map(t => h("li", t)));
h("div", itemsSignal); // itemsSignal.get() -> Element[]

// 另一个 ReactiveRange
h("div", For(items, (item) => h("li", item.text)));
```

## 预生成的 Tag Helpers

为所有常见的 HTML / SVG / MathML 元素预生成了快捷函数：

```ts
import { div, p, button, input, span, img, svg, path, circle, g } from "@takanashi/rikka-dom";

const hello = div(
  { class: "hero" },
  p("Welcome, ", span({ style: { color: "red" } }, "user"), "!"),
  button({ onclick: () => alert("hi") }, "Click"),
);
```

完整列表（源码生成于 `utils/rikka-dom/src/tags.ts`）：

- HTML：`a abbr address area article aside audio b base bdi bdo blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd label legend li link main map mark menu meta meter nav noscript object ol optgroup option output p picture pre progress q rp rt ruby s samp script search section select slot small source span strong style sub summary sup table tbody td template textarea tfoot th thead time title tr track u ul var video wbr`
- SVG：`svg animate animateMotion animateTransform circle clipPath defs desc ellipse feBlend feColorMatrix feComponentTransfer feComposite feConvolveMatrix feDiffuseLighting feDisplacementMap feDistantLight feDropShadow feFlood feFuncA feFuncB feFuncG feFuncR feGaussianBlur feImage feMerge feMergeNode feMorphology feOffset fePointLight feSpecularLighting feSpotLight feTile feTurbulence filter foreignObject g image line linearGradient marker mask metadata mpath path pattern polygon polyline radialGradient rect set stop style symbol switch text textPath title tspan use view`
- MathML：`math annotation annotation-xml maction menclose merror mfenced mfrac mglyph mi mlabeledtr maligngroup malignmark mmultiscripts mn mo mpadded mphantom mprescripts mroot mrow ms mspace msqrt mstyle msub msubsup msup mtable mtd mtext mtr munder munderover none semantics`

自定义元素也可以用 `h("my-counter", { count: 10 })` 创建。

## `applyChild(parent, child)` — 挂载

把任意 child（`Element | string | Signal<...> | ReactiveRange | Child[]`）插入到 `parent` 最后。

```ts
import { applyChild, div } from "@takanashi/rikka-dom";
applyChild(document.getElementById("app")!, div("hello"));
```

> **内部实现**：`applyChild` 只是 `insertChildBefore(parent, child, null)` 的语法糖。信号/函数/数组等会被包装为 `ReactiveRange`，从而获得响应式更新能力。

## 条件渲染

### `Show(condition, render)` — 单分支

```ts
import { signal } from "@takanashi/rikka-signal";
import { Show, div, button } from "@takanashi/rikka-dom";

const visible = signal(true);
div(
  button({ onclick: () => visible.set(!visible.get()) }, "Toggle"),
  Show(visible, () => div("I'm visible!")),
);
```

### `When(condition, trueRender, falseRender)` — 二选一

```ts
When(loggedIn,
  () => div("Welcome"),
  () => div("Please log in"),
);
```

### `Switch` / `Match` — 多路分支

```ts
Switch(status, [
  Match("loading", () => div("Loading...")),
  Match("error",   () => div("Error")),
  Match("done",    () => div(content)),
], () => div("unknown"));
```

`Match` 的第一个参数可以是值或谓词函数 `(v) => boolean`。

## 列表渲染 `For`

```ts
import { signal } from "@takanashi/rikka-signal";
import { For, ul, li, button, div } from "@takanashi/rikka-dom";

type Todo = { id: number; text: string; done: boolean };
const todos = signal<Todo[]>([
  { id: 1, text: "Buy milk",  done: false },
  { id: 2, text: "Write code", done: true },
]);

const list = div(
  button({ onclick: () => todos.set([...todos.get(), { id: Date.now(), text: "new", done: false }]) }, "Add"),
  ul(
    For(todos,
      (todo) => li({ style: { textDecoration: todo.done ? "line-through" : "none" } }, todo.text),
      (todo) => todo.id, // 可选 keyFn — 有则启用缓存，复用 DOM 节点
    ),
  ),
);
```

- 传 `keyFn` 时启用节点缓存 — 复用已有节点以提升性能
- 不传时每次重建所有节点

## `ReactiveRange` — 底层原语

每一对 `<!-- start --> ... <!-- end -->` 注释节点标记一个响应式的 DOM 范围。`ReactiveRange` 暴露：

| API | 作用 |
|-----|------|
| `attach(parent, ref)` | 在 `ref` 前插入注释标记 |
| `clear()` | 清空范围内所有节点 |
| `reconcile(newNodes)` | 与新节点集合做最小差异合并 |
| `detach()` | 移除注释 + 清理 disposables |

**手动构建响应式块**：

```ts
import { effect } from "@takanashi/rikka-signal";
import { ReactiveRange, applyChild, div } from "@takanashi/rikka-dom";

const range = new ReactiveRange((r) =>
  effect(() => {
    if (!r.alive) return;
    r.reconcile([div(`tick=${tick.get()}`)]);
  }),
);
applyChild(app, range);
```

> 这正是 `Show` / `When` / `Switch` / `For` 内部使用的原语。

## `css\`...\`` — 构造样式表

返回 `CSSStyleSheet`，可传入 `defineElement({ styles })` 或 `adoptedStyleSheets`。

```ts
const sheet = css`
  :host { display: block; }
  .title { color: ${titleColor}; }  // 动态插值 (CSS 变量推荐)
`;

// 应用到自定义元素
defineElement("my-card", {
  shadow: { mode: "open" },
  styles: sheet,
  render() { return div({ class: "title" }, "Hello"); },
});
```

`css` 会把信号 / computed 值识别为动态段，并用 `effect` 重新生成样式表。

## `inlineStyle\`...\`` — 样式对象

返回对象（而非字符串），可直接作为 `style` 属性值：

```ts
div({
  style: inlineStyle`
    color: ${textColor};
    padding: 1rem;
    font-size: ${computedSize}px;
  `,
}, "Hello");
```

内部会将模板字符串解析为 `{ key: value | signal, ... }`。

## HTML 模板字符串 `h\`...\``

Rikka 支持用模板字符串直接书写 HTML，内部包含 signal 和元素都会被替换为响应式节点：

```ts
const nodes = h`
  <div class="card">
    <h3>${title}</h3>
    <p>count = ${count}</p>
    ${button({ onclick: () => count.set(count.get() + 1) }, "+")}
  </div>
`;
// nodes: Element[] —— 作为子元素可直接传入 h(tag, ...children)
```

- `${signal}` 在文本位置 → 响应式文本节点
- `${signal}` 在属性值位置 → 响应式属性（例如 `class="${cls}"`）
- `${element}` → 直接嵌入子元素
- 自动缓存相同模板的编译结果，避免重复 innerHTML 解析

## 信号到 DOM 的绑定机制总览

```
  signal.set(v)  ──┐
                   ▼
  effect() 订阅 ──▶ 读信号值 ──▶  局部 DOM 更新
                      │
                      ├─ child 是文本/数字 → node.textContent = v
                      ├─ child 是 Element  → replaceChild
                      ├─ child 是 []/range → ReactiveRange.reconcile
                      ├─ 属性: style/attr  → el.setProperty / setAttribute
                      └─ value/checked      → 双向绑定反向
```

## 关键文件索引

| 文件 | 职责 |
|------|------|
| `utils/rikka-dom/src/index.ts` | 导出聚合 + 类型 |
| `utils/rikka-dom/src/h.ts` | `ReactiveRange`, `applyChild`, `h`, `createElement`, `applyAttr*`, `registerDisposable`, 双向绑定 |
| `utils/rikka-dom/src/tags.ts` | 所有 HTML/SVG/MathML tag helpers |
| `utils/rikka-dom/src/control-flow.ts` | `For` / `Show` / `When` / `Switch` / `Match` |
| `utils/rikka-dom/src/template.ts` | `css`, `inlineStyle`, HTML 模板解析 (`h\`...\``) |
| `utils/rikka-dom/src/attributes.ts` | 属性 / 样式的完整类型映射 (`AttrTagNameMap`) |
| `utils/rikka-dom/src/signal-utils.ts` | `isSignal / isWritableSignal / unwrapSignal / isPlainObject` |
| `utils/rikka-dom/src/constants.ts` | Namespace + tag 名称常量 |

## 相关阅读

- [rikka-signal](rikka-signal) — 信号原语
- [rikka-elements](rikka-elements) — 如何在自定义元素中使用 rikka-dom
