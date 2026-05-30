# rikka-elements

> 声明式 Custom Elements，支持响应式属性、事件转换、Shadow DOM、样式和模板绑定。

## 核心概念

rikka-elements 提供唯一的 `defineElement` 函数，以配置对象的方式声明式定义自定义元素，具有完整的 TypeScript 类型推断。无需装饰器、无需基类。

## 两种组件模式

### 1. 组合式组件

用普通函数返回 `Element`。使用 `h()` 或 tag helper 组合：

```typescript
import { div, p, button } from 'rikka-dom';

const Card = (title) => div({ class: 'card' }, p(title));
const Counter = (initial = 0) => {
  let count = initial;
  return div(p(`Count: ${count}`), button({ onclick: () => count++ }, '+'));
};
```

详见 [rikka-dom](./rikka-dom.md)。

### 2. Custom Elements

使用 `defineElement()` 创建可复用的自定义元素，注册到浏览器：

```typescript
import { defineElement } from 'rikka-elements';
import { css, div, p, button } from 'rikka-dom';

const MyCounter = defineElement('my-counter', {
  attributes: { count: Number },
  events: { change: (e) => e.detail },
  styles: css`:host { display: block; }`,
  render() {
    // this 是完全类型化的实例
    return div({}, 'Hello!');
  }
});
```

自定义元素独立、可复用，可在任何 HTML 页面中使用。根据场景选择合适的模式。

## API 参考

### `defineElement<C>(tagName, config?): ElementConstructor<C>`

定义并注册一个自定义元素。返回元素构造函数，附带 `.h` 标签函数。

```typescript
import { defineElement } from 'rikka-elements';
import { css } from 'rikka-dom';

const MyCard = defineElement('my-card', {
  attributes: {
    title: String,
    count: Number,
    active: Boolean,
  },
  events: {
    click: (e: MouseEvent) => ({ x: e.clientX, y: e.clientY }),
    reset: undefined,
  },
  shadow: { mode: 'open' },
  styles: css`:host { display: block; padding: 16px; }`,
  render() {
    return div({}, 'Hello!');
  }
});
```

**类型推断：** 所有类型从 config 对象自动推导：

| Config | 生成的实例成员 |
|--------|---------------|
| `title: String` | `el.title: string`, `el.$title: Signal.State<string>` |
| `count: Number` | `el.count: number`, `el.$count: Signal.State<number>` |
| `active: Boolean` | `el.active: boolean`, `el.$active: Signal.State<boolean>` |
| `click: (e) => detail` | `el.dispatchClick(detail?): boolean` |
| `reset: undefined` | `el.dispatchReset(): boolean`（无 detail） |
| `shadow: false` | 无 `shadowRoot` 属性 |
| 默认 / `{ mode: 'open' }` | `el.shadowRoot: ShadowRoot` |

### 配置选项

#### `attributes`

声明响应式属性，底层由 Signal 驱动。三种形式：

```typescript
attributes: {
  // 构造函数作为解析器：(attr: string | undefined) => T
  count: Number,     // Number("5") → 5, Number(undefined) → NaN
  name: String,      // String("hello") → "hello"
  active: Boolean,   // 属性存在 → true, 缺失 → false

  // 自定义解析函数
  count: (v) => (v !== undefined ? Number(v) : 0),

  // 对象形式：自定义 type 解析 + 默认值
  items: {
    type: (v) => v ? v.split(",") : [],
    default: [],
  },
}
```

每个属性创建：
- **getter/setter 属性** (`el.name`) —— 读写原始值，setter 同步 HTML attribute
- **$-prefix 信号访问器** (`el.$name`) —— 底层 `Signal.State<T>`，用于响应式绑定
- **observedAttributes 条目**
- **attributeChangedCallback 处理**

getter 从 signal 读取，setter 写入 signal 并同步 HTML attribute。外部 `setAttribute` 触发时 signal 也被更新。

**$-prefix 的用途：**

```typescript
// 在 rikka-dom 中使用：
p({}, this.$name);        // 细粒度：文本节点随 name 变化自动更新

// 在模板绑定中自动检测：
// <p>{{name}}</p>  → 自动优先检查 $name 信号
```

#### `events`

声明自定义事件。值是 **DOM Event → detail 的转换函数**：

```typescript
events: {
  // 转换函数：接收 DOM 事件，返回 custom event 的 detail
  click: (domEvent: MouseEvent) => ({
    x: domEvent.clientX,
    y: domEvent.clientY,
  }),

  // undefined：无 detail 的 void 事件
  reset: undefined,

  // 提取 input 值
  submit: (domEvent) => {
    const form = domEvent.target.closest('form');
    return Object.fromEntries(new FormData(form));
  },
}
```

每个事件生成：
- **`dispatchXxx(detail?)`** —— 派发 `CustomEvent`。有转换函数时 detail 由转换结果决定
- **`onXxx`** —— 事件处理器 property（类似 `onclick` 语义）。自动包装防止无限循环

方法名使用 PascalCase：`value-changed` → `dispatchValueChanged`，`onValueChanged`。

**事件数据流：**

```
用户点击 <button onclick="{{@click}}">
  ↓ DOM click 事件
  ↓ 调用 events.click(clickEvent) 转换函数
  ↓ 得到 detail: { x: 100, y: 200 }
  ↓ el.dispatchClick({ x: 100, y: 200 })
  ↓ 派发 CustomEvent('click', { detail: { x, y } })
  ↓ 外部 el.addEventListener('click', handler)
  ↓ handler 收到 ev.detail: { x, y }
```

#### `styles`

通过 `adoptedStyleSheets` 注入 CSS 到 shadow root：

```typescript
styles: css`:host { display: block; }`,
// 或多个：
styles: [css`:host { color: red; }`, css`:host { background: blue; }`],
```

#### `template`

传入 `HTMLTemplateElement`，在 `connectedCallback` 时克隆其内容到 shadow DOM 并绑定 `{{slot}}` 占位符：

```typescript
// 使用 h`<template>`[0] 创建 HTMLTemplateElement
template: h`<template>
  <div class="card">
    <h2>{{title}}</h2>
    <p>{{description}}</p>
    <button onclick="{{@action}}">{{label}}</button>
  </div>
</template>`[0],
```

`template` 和 `render` 互斥，只能传入其中一个。

**模板绑定语法：**

| 语法 | 绑定类型 | 行为 |
|------|---------|------|
| `{{name}}` | 文本绑定 | textContent，优先检查 `$name` 信号实现细粒度更新 |
| `attr="{{name}}"` | 属性绑定 | setAttribute，若值为信号则响应式更新 |
| `onclick="{{@action}}"` | 事件派发 | DOM 事件 → 转换函数(detail) → `dispatchAction(detail)` |

文本绑定的信号优先级：系统先检查 `$name`（信号），若不是信号则回退到 `name`（原始值）。

```typescript
// 模板中的 {{clickCount}}
// 等价于：
let value = element.$clickCount;        // 优先检查信号
if (!isSignal(value)) value = element.clickCount;  // 回退原始值
if (isSignal(value)) {
  effect(() => { node.textContent = String(value.get()); });
}
```

#### `shadow`

控制 shadow DOM 创建：

```typescript
shadow: { mode: 'open' },   // 默认
shadow: { mode: 'closed' },
shadow: false,              // 不创建 shadow DOM
```

#### `render`

`defineElement` 配置中的函数，挂载到元素 prototype 上，在 `connectedCallback` 时调用。`this` 为元素实例，返回 Element：

```typescript
defineElement('my-el', {
  attributes: { count: Number },
  events: { change: (e) => e.detail },
  render() {
    return div(
      p(() => `Count: ${this.count}`),
      button({ onclick: () => this.count++ }, '+'),
    );
  }
});
```

#### `methods`

自定义方法，挂载到元素 prototype 上。`this` 为元素实例，类型自动反映到 `RikkaElement<C>`：

```typescript
defineElement('my-editor', {
  attributes: { code: String },
  methods: {
    run(this: any) {
      const result = eval(this.code);
      console.log(result);
    },
    reset(this: any) {
      this.code = '';
    },
  },
  render() {
    return div(
      textarea({ value: this.code }),
      button({ onclick: () => this.run() }, 'Run'),
    );
  }
});
```

### `event<T>()`: 类型标记

用于标记事件的 detail 类型。运行时返回 `undefined`（零开销）：

```typescript
import { event } from 'rikka-elements';

events: {
  // event<T>() 标记 detail 类型为 T
  // 运行时值是 undefined
  move: event<{ x: number; y: number }>(),
}
```

> 注意：`event()` 主要用于无转换函数时的类型标注。推荐直接写转换函数 `(domEvent) => detail`，类型自动推导。

### `css`

从 `rikka-dom` re-export 的标签模板，创建 `CSSStyleSheet`：

```typescript
import { css } from 'rikka-elements';  // re-exported for convenience

const base = css`:host { display: block; }`;
const theme = css`${base} :host { color: red; }`;
```

## 完整示例

```typescript
import { defineElement } from 'rikka-elements';
import { css, div, p, button } from 'rikka-dom';

const MyCard = defineElement('my-card', {
  attributes: {
    count: Number,
  },
  events: {
    action: (clickEvent: MouseEvent) => ({
      x: clickEvent.clientX,
      y: clickEvent.clientY,
    }),
  },
  styles: css`:host { display: block; }`,
  render() {
    return div({ class: 'card' },
      p(() => `Clicks: ${this.count}`),
      button({ onclick: () => this.count++ }, '+'),
    );
  }
});
```

## 在 HTML 中使用

```html
<script type="module" src="./my-card.js"></script>

<my-card title="Hello" description="World"></my-card>

<script>
  const card = document.querySelector('my-card');
  card.addEventListener('action', (ev) => {
    console.log('Clicked at:', ev.detail);
  });
</script>
```

## 在组合式组件中使用 Custom Element

自定义元素可以包含组合式组件 —— 任何返回 `Element` 的函数：

```typescript
import { defineElement } from 'rikka-elements';
import { css, div, h2, p } from 'rikka-dom';

const Card = (title, content) => div(
  { class: 'card' },
  h2(title),
  p(content),
);

const MyPage = defineElement('my-page', {
  styles: css`:host { display: block; padding: 16px; }`,
  render() {
    return div({}, Card('Title', 'Content'), Card('Another', 'More'));
  }
});
```

## 类型导出

```typescript
// 核心类型
type AttributeSpec<T> =
  | ((attr: string | undefined) => T)
  | { type: (attr: string | undefined) => T; default?: T };

type EventSpec = ((domEvent: Event) => any) | undefined;

```typescript
type BaseConfig = {
  shadow?: ShadowRootInit | false;
  styles?: CSSStyleSheet | CSSStyleSheet[];
  attributes?: Record<string, AttributeSpec<any>>;
  events?: Record<string, EventSpec>;
  methods?: Record<string, (...args: any[]) => any>;
};

type ElementConfig =
  | (BaseConfig & { template: HTMLTemplateElement; render?: never })
  | (BaseConfig & { template?: never; render?: (this: any) => Element })
  | BaseConfig;
```

`template` 和 `render` 互斥，只能传入其中一个。

```typescript
type RikkaElement<C extends ElementConfig> = HTMLElement
  & AttributeProps<C>       // el.name: T
  & SignalProps<C>          // el.$name: Signal.State<T>
  & EventProps<C>           // el.dispatchName(), el.onName
  & ShadowProp<C>           // el.shadowRoot?
  & MethodProps<C>;         // el.methodName()

type ElementConstructor<C extends ElementConfig> =
  C["attributes"] extends Record<string, AttributeSpec<any>>
    ? (new (...args: any[]) => RikkaElement<C>) & {
        observedAttributes: (keyof C["attributes"] & string)[];
        readonly h: TagFunctionH<C>;
      }
    : (new (...args: any[]) => RikkaElement<C>) & {
        readonly h: TagFunctionH<C>;
      };

interface TagFunctionH<C extends ElementConfig = ElementConfig> {
  (...children: Child[]): RikkaElement<C>;
  (attrs: TagFunctionProps<C> & CommonHTMLAttributes, ...children: Child[]): RikkaElement<C>;
}

type TagFunctionProps<C extends ElementConfig> = AttributeProps<C> & EventListenerProps<C>;
```

## 注意事项

- 无需装饰器 —— 纯函数 API + 完整 TypeScript 类型推断
- 无需基类 —— `defineElement` 返回继承自 `HTMLElement` 的 class
- `render` 是 config 成员，返回 Element 渲染到 shadow root，挂载到 prototype 上，`this` 为元素实例
- `methods` 是 config 成员，自定义方法挂载到 prototype 上，`this` 为元素实例
- `defineElement` 使用 `queueMicrotask` 延迟注册，确保 config 已完全处理
- Shadow DOM 默认开启（`{ mode: 'open' }`）
- `css` 标签模板返回 `CSSStyleSheet`（非字符串），来自 `rikka-dom`
- `event<T>()` 是零成本类型标记 —— 运行时为 `undefined`
- 事件值是 **转换函数** `(domEvent: Event) => detail`，不是构造器或类型标记
- `{{@event}}` 语法在模板中将 DOM 事件转换为 custom event dispatch
- 模板文本绑定自动优先检查 `$name` 信号，回退到原始值
- `$-prefix` 属性访问器提供底层 `Signal.State`，适合细粒度响应式场景
- 元素 `disconnectedCallback` 时自动运行 `runDisposables()` 清理所有绑定到元素的 effect

## 常见陷阱

### 1. events 使用转换函数

```typescript
// ✅ 正确：转换函数 (DOM Event → detail)
events: {
  change: (e) => e.detail,        // 从 DOM 事件提取 detail
  click: (e: MouseEvent) => ({    // 提取坐标
    x: e.clientX,
    y: e.clientY,
  }),
  reset: undefined,              // 无 detail 的 void 事件
},
```

`{{@event}}` 语法在模板中将 DOM 事件通过转换函数提取信息作为 custom event 的 detail。

### 2. render() 必须返回 Element

```typescript
defineElement('my-el', {
  render() {
    // ❌ 错误：不能返回字符串
    return '<p>Hello</p>';

    // ✅ 正确：返回 Element
    return div(p('Hello'));
  }
});
```

### 3. render 中读取属性 vs $-prefix

```typescript
defineElement('my-el', {
  attributes: { count: Number },
  render() {
    // this.count → getter，返回 signal.get() 的结果（number）
    // this.$count → Signal.State<number> 本身

    console.log(this.count);     // 当前值（如 NaN 或初始值）
    console.log(this.$count.get()); // 同上，但是信号引用

    // 在 rikka-dom 中：
    p({}, this.count);      // ❌ 静态值，不更新
    p({}, this.$count);     // ✅ 细粒度响应式更新
  }
});
```

### 4. 模板绑定中 {{name}} 自动检查 $-prefix

你不需要在模板中手动写 `$clickCount`。系统会自动先检查 `$clickCount`（信号），再回退到 `clickCount`（原始值）。

```typescript
// 模板：<p>{{clickCount}}</p>
// 等价运行时逻辑：
let value = element.$clickCount;          // 1. 先查信号
if (!isSignal(value)) value = element.clickCount;  // 2. 回退原始值
if (isSignal(value)) {
  effect(() => { node.textContent = String(value.get()); });  // 细粒度更新
}
```

所以 **attributes 中定义了 clickCount 就足够了**，模板直接用 `{{clickCount}}` 即可自动获得响应性。

### 5. connectedCallback 只执行一次

`defineElement` 内部用 `#initialized` flag 确保 `connectedCallback`（和 `render`）只执行一次。如果元素被移动 DOM（appendChild 到新位置），不会重新执行 render。

```typescript
defineElement('my-el', {
  render() {
    console.log('render runs once');  // 只打印一次

    // 即使元素被移动：
    const parent = document.createElement('div');
    parent.appendChild(this);  // 不触发重新 render
    return div('content');
  }
});
```

如果需要在每次连接时执行逻辑，监听 `connectedCallback` 事件或使用 `disconnectedCallback` 清理后重建。

### 6. 自定义事件的 listener 无限循环防护

`onXxx` property setter 会自动包装 handler 防止无限循环：

```typescript
el.onChange = (ev) => {
  el.count++;           // 触发 attributeChangedCallback
  el.dispatchChange(1); // 如果没有包装，这里可能触发 onChange → 无限循环
};
```

内部使用 `WeakSet<Event>` 标记已处理的事件，同一事件对象只处理一次。

**注意：** 此防护仅适用于自定义事件（HTMLElement 上不存在的 `onXxx` 属性对应的事件）。原生 DOM 事件（如 `click`、`change`）声明在 `events` 中时不会获得此防护，因为它们的 `onXxx` 属性已存在于 HTMLElement.prototype 上。

### 7. render() 中使用事件处理

```typescript
defineElement('my-el', {
  attributes: { label: String },
  events: {
    action: (e) => e.detail,  // 转换函数
  },
  render() {
    // 使用 onclick 属性直接处理
    return button({ onclick: () => this.dispatchAction('clicked') }, this.label);
  }
});
```
