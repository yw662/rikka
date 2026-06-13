# rikka-elements — 自定义元素定义

`@takanashi/rikka-elements` 基于 rikka-dom 提供 **声明式的 Web Components 定义 API**。无需继承基类，使用简单的配置对象即可定义带响应式属性、事件、方法、样式、Shadow DOM 的完整自定义元素。

## 最简示例

```ts
import { defineElement, NumberAttr } from "@takanashi/rikka-elements";
import { div, button, span, css } from "@takanashi/rikka-dom";

defineElement("my-counter", {
  shadow: { mode: "open" },
  attributes: {
    count: { ...NumberAttr, default: 0 },
  },
  styles: css`
    .wrap { display: flex; gap: .5rem; }
  `,
  render() {
    return div(
      { class: "wrap" },
      span("Count: ", this.$count),      // signal 访问 — 响应式
      button({ onclick: () => this.count++ }, "+"),
      button({ onclick: () => this.count-- }, "-"),
    );
  },
});
```

```html
<!-- HTML 中直接使用 -->
<my-counter count="5"></my-counter>
```

```ts
// JS 中通过 tag helper 创建
import { h } from "@takanashi/rikka-dom";
document.body.appendChild(h("my-counter", { count: 10 }));
```

## `defineElement(tagName, config?)`

完整的 config 类型：

```ts
type ElementConfig = {
  shadow?:   ShadowRootInit | false;     // 启用/禁用 Shadow DOM；默认 open
  styles?:   CSSStyleSheet | CSSStyleSheet[];
  attributes?: {
    [name: string]: {
      toProp: (attr: string | undefined) => T;
      toAttribute?: (prop: T) => string | undefined;
      default?: T;
    };
  };
  dataset?: {
    [name: string]: { default?: string };
  };
  events?:   { [name: string]: event<T>() | undefined };
  methods?:  { [name: string]: Function };
  render?:   (this: HTMLElement & ...) => Element;   // 与 template 互斥
  template?: HTMLTemplateElement;                     // 与 render 互斥
  tools?:    Record<string, ToolDefinition>;          // WebMCP: agent tools
  toolContext?: ToolContextMapping;                   // WebMCP: context
};
```

### 返回值

返回的是一个扩展了 `HTMLElement` 的**类**，也同时拥有静态属性和 tag helper：

```ts
const MyCounter = defineElement("my-counter", { ... });

// 静态
MyCounter.observedAttributes;     // ["count"]
MyCounter.h({ count: 5 });         // tag helper，返回 HTMLElement

// 实例
const el = new MyCounter();        // 等价于 document.createElement("my-counter")
el.count = 10;                     // 属性 setter → 同步信号 + setAttribute
console.log(el.$count.get());      // 10 — Signal.State<number>
document.body.appendChild(el);
```

## 阶段式 Builder API (类型安全)

当需要 TypeScript 在 `render` / `methods` 中对 `this` 的强类型推导时，可使用流式 builder：

```ts
import { BuilderFresh } from "@takanashi/rikka-elements";

defineElement("todo-card")
  .attrs({ title: StringAttr, done: BooleanAttr })
  .methods({
    toggle() { this.done = !this.done; }   // this.title / this.done 完全类型化
  })
  .render(function() {
    return div(
      { style: { textDecoration: this.done ? "line-through" : "none" } },
      span(this.$title),
      button({ onclick: () => this.toggle() }, "Toggle"),
    );
  })
  .build();
```

阶段：`attrs | dataset | events (任一顺序，任意组合)` → `methods (可选)` → `render | template (二选一)` → `.build()`。

> **类型设计要点**：`BuilderWithBindings<C>` 保留累计配置类型 `C`，并在 `.render(fn)` 中把 `this` 推断为 `HTMLElement & { title: string; done: boolean; $title: Signal.State<string>; $done: Signal.State<boolean>; ... }`。

## 属性 (attributes)

### 内置属性规格

| 规格 | 解析 | 序列化 | 默认值 |
|------|------|--------|--------|
| `StringAttr` | `attr ?? ""` | 原值 | `""` |
| `NumberAttr` | `Number(attr)` | `String(v)` | `NaN` |
| `BooleanAttr` | `attr !== null && attr !== "false"` | `""` / 移除属性 | — |

自定义规格：

```ts
const JsonAttr: AttributeSpec<unknown> = {
  toProp:   (v) => v ? JSON.parse(v) : null,
  toAttribute: (v) => v == null ? undefined : JSON.stringify(v),
  default:  null,
};
```

### `$` 前缀的 Signal 访问器

对每个属性 `foo`，同时生成：

- `this.foo` — 普通 prop，getter/setter，读取值
- `this.$foo` — `Signal.State<T>`，可在 render / computed / effect 中直接订阅

```ts
render() {
  return div(
    "name = ", this.$name,       // 响应式：name 变 → DOM 文本变
    "len = ", computed(() => this.$name.get().length),
  );
}
```

> **实现要点**：`defineElement` 为每个属性调用 `applyBinding(proto, attrName, propName, parse, serialize, defaultValue)` —— 在原型上定义 getter/setter 与 `$attr` 访问器，信号通过 `Symbol.for("rikka.signals")` 挂在实例上的 `WeakMap` 中，首次访问时懒创建。

### dataset 属性 (`data-*`)

```ts
defineElement("user-card", {
  dataset: {
    role:   { default: "guest" },
    userId: { default: "" },
  },
  render() {
    return div(`role=${this.$role} · id=${this.$userId}`);
  },
});
```

等价于：

```html
<user-card data-role="admin" data-user-id="42"></user-card>
```

注意驼峰 ↔ kebab-case 的自动转换。

## 事件 (events)

```ts
import { event } from "@takanashi/rikka-elements";

defineElement("color-picker", {
  attributes: { value: StringAttr },
  events: {
    change: event<string>(),           // 派发 CustomEvent<string>
    close:  undefined,                  // 派发无 detail 事件 (仅声明)
  },
  render() {
    return input({
      type: "color",
      value: this.$value,
      onchange: (e) => this.dispatchChange((e.target as HTMLInputElement).value),
    });
  },
});
```

对每个事件 `change`，自动生成：

- `this.dispatchChange(detail?, init?: CustomEventInit)` — 派发事件
- `el.onchange = (e: CustomEvent<string>) => { ... }` — 监听（覆盖原生 `on*`）

外部监听：

```ts
const picker = document.querySelector("color-picker")!;
picker.addEventListener("change", (e) => console.log(e.detail)); // string
picker.onchange = (e) => console.log("selected:", e.detail);
```

## 方法 (methods)

方法挂在元素原型上，可在外部 JS 直接调用：

```ts
defineElement("video-player", {
  attributes: { src: StringAttr, playing: BooleanAttr },
  methods: {
    play()  { this.playing = true;  },
    pause() { this.playing = false; },
    toggle() { this.playing = !this.playing; },
  },
  render() { /* ... */ },
});

// 外部使用
document.querySelector("video-player")!.toggle();
```

## 模板渲染 (二选一)

### 方式 A：`render()` — 推荐

返回由 rikka-dom `h()` / tag helpers 构造的 `Element`，注入到 Shadow DOM。每次属性 signal 变化 → render 中使用的 `this.$xxx` 驱动局部更新（不会重跑整个 render）。

### 方式 B：`template` + 声明式绑定

```ts
const tpl = document.createElement("template");
tpl.innerHTML = `
  <h1>{{ title }}</h1>
  <p>Status: {{ status }}</p>
  <button onclick="{{@click}}">Go</button>
  <a href="{{ url }}">link</a>
`;

defineElement("my-card", {
  attributes: { title: StringAttr, status: StringAttr, url: StringAttr },
  events:     { click: event<void>() },
  template:   tpl,
});
```

支持的绑定语法：

| 语法 | 位置 | 行为 |
|------|------|------|
| `{{ name }}` | 文本节点 | 响应式文本替换；若 `name` 是 signal（`this.$name`）则订阅并响应更新 |
| `{{ name }}` | 属性值（非 `on*`） | 响应式属性更新 |
| `{{ name }}` | `onclick="{{ handler }}"` | 绑定为事件处理器（支持 signal） |
| `{{@name}}`  | `onclick="{{@name}}"` | 派发 `name` 事件（即调用 `this.dispatchName(domEvent)`） |

> **实现要点**：在 `connectedCallback` 中克隆 `template.content` 到 shadow root，然后：
> 1. 遍历文本节点，匹配 `SLOT_REGEX`，用 `effect` + `ReactiveRange` 实现响应式替换
> 2. 遍历所有元素的属性，区分普通属性绑定、事件处理器、事件派发三种形式
> 3. 所有订阅注册到 `Symbol.for("rikka.disposables")` 并在 `disconnectedCallback` 清理

## Shadow DOM 与样式

- `shadow: { mode: "open" }`（默认）：启用 Shadow DOM
- `shadow: false`：直接写入 host 光 DOM（无样式隔离）
- `styles: css\`...\``：通过 `shadowRoot.adoptedStyleSheets = [...sheets]` 注入；多个 sheets 可用数组

```ts
const shared = css` :host { display: block; } `;
const card   = css` .card { padding: 1rem; border: 1px solid; } `;

defineElement("fancy-card", {
  styles: [shared, card],
  render() { return div({ class: "card" }, this.$label); },
});
```

## 生命周期

| Hook | 触发时机 | Rikka 自动做的事 |
|------|----------|----------------|
| `constructor` | 实例创建 | 预留内部 symbol 属性槽 |
| `connectedCallback` | 首次插入文档 | 初始化 Shadow DOM，运行 `render()` 或克隆 `template`，注册 disposables，WebMCP 注册 |
| `attributeChangedCallback` | 观察属性变化 | 同步到内部 signal |
| `disconnectedCallback` | 从文档移除 | 运行 disposables (effect / listener 清理)，WebMCP 反注册 |

> ⚠️ **注意**：`defineElement` 注册过的 tag 不可再次用同名调用 `defineElement`（浏览器 `customElements.define` 规则）。

## WebMCP (Web Model-Context Protocol)

Rikka 元素可选地暴露 `tools` 给外部代理，把自定义元素变成 AI-agent 可调用的远程能力：

```ts
defineElement("todo-list", {
  attributes: { items: /* JSON-ish string */ ... },
  tools: {
    addItem: {
      description: "Append an item",
      parameters: { text: { type: "string" } },
      execute: (el, args) => { el.addItem(args.text); },
    },
  },
  toolContext: { listItems: "$items" },   // "$xxx" 映射到 this.$xxx 的信号值
  methods: { addItem(text) { /* ... */ } },
  render() { /* ... */ },
});
```

通过 `listInstances()` / `resolveInstance()` / `getModelContext()` 可遍历、操作元素实例并获取其供 LLM 使用的上下文。见 `utils/rikka-elements/src/webmcp.ts`。

## 关键文件

| 文件 | 职责 |
|------|------|
| `utils/rikka-elements/src/defineElement.ts` | `defineElement` 主函数、builder、属性/事件/方法/模板运行时 |
| `utils/rikka-elements/src/utils.ts` | `toPascalCase` / `toCamelCase` / `toKebabCase` + PascalCase 类型工具 |
| `utils/rikka-elements/src/index.ts` | 聚合导出 |
| `utils/rikka-elements/src/webmcp.ts` | 为 AI agent 暴露的工具协议 |
| `utils/rikka-elements/test/index.test.ts` | 单测（学习 API 的好材料） |

## 下一步

- [rikka-live-playground](rikka-live-playground) — 如何在文档/演示中嵌入交互式代码
- [Examples & Patterns](Examples-and-Patterns) — 实际项目常见模式
