# rikka-signal

> 基于 TC39 Signals 提案的响应式原语。

## 背景

rikka-signal 构建在 [TC39 Signals proposal](https://github.com/tc39/proposal-signals)（Stage 1）之上。该提案由 Angular、Vue、Solid、Preact、Ember、MobX 等框架维护者共同推动，旨在为 JavaScript 标准化响应式原语。

规范定义了三个核心类型：

- **`Signal.State<T>`** — 可写响应式容器。`.set()` 时通知依赖方，通过 `.get()` 读取。
- **`Signal.Computed<T>`** — 只读派生信号。依赖变更时惰性重算。通过 `.get()` 读取。
- **`Signal.subtle.Watcher`** — 底层观察原语。当被观察的 computed signal 变脏时触发回调。`effect()` 内部使用此机制。

rikka-signal 封装原始 TC39 API 为更易用的函数，并重新导出完整的 `Signal` 命名空间：

| rikka-signal API     | 底层 TC39 API                                                     |
| -------------------- | ----------------------------------------------------------------- |
| `signal(v)`          | `new Signal.State(v)`                                             |
| `computed(fn)`       | `new Signal.Computed(fn)`                                         |
| `effect(fn)`         | `Signal.subtle.Watcher` + `Signal.Computed`（通过微任务队列编排） |
| `store(obj)`         | `Proxy` + 每属性 `Signal.State`（对象的细粒度响应式）             |
| `signalOf(store, ...path)` | 获取 store 属性的底层 `Signal.State`，支持多级路径 |
| `raw(store)`         | 获取底层原始对象，无响应式追踪                                    |
| `Signal` (re-export) | 来自 `signal-polyfill` 的完整 `Signal` 命名空间                   |

运行时依赖 [`signal-polyfill`](https://github.com/proposal-signals/signal-polyfill) 包提供实现。一旦提案进入 Stage 4，rikka-signal 可以零 API 变更地移除 polyfill。

## 核心 API

### `signal<T>(initialValue): Signal.State<T>`

创建可写信号。

```typescript
import { signal } from "rikka-signal";

const count = signal(0);
count.get(); // 0
count.set(5);
count.get(); // 5
```

### `computed<T>(fn): Signal.Computed<T>`

创建派生信号。自动追踪依赖。惰性求值 —— 值被缓存，直到依赖变更才重算。

```typescript
import { signal, computed } from "rikka-signal";

const count = signal(0);
const doubled = computed(() => count.get() * 2);

doubled.get(); // 0
count.set(5);
doubled.get(); // 10
```

### `effect(fn): () => void`

立即执行 `fn`，当依赖的 signal 变更时重新执行。返回销毁函数。

回调可以返回一个清理函数（cleanup function）。清理函数在以下两种情况下被调用：

1. **依赖变更触发重执行前**：effect 回调重新执行前，先调用上一次返回的清理函数，再执行新的回调。执行顺序始终是：`cleanup → 新的 effect 回调`。
2. **effect 被销毁时**：调用 `dispose()` 时执行清理函数。

典型用途：移除事件监听器、清除定时器、中止 fetch 请求等。

```typescript
import { signal, effect } from "rikka-signal";

const count = signal(0);
const dispose = effect(() => {
  console.log("effect:", count.get()); // 首次输出: effect: 0
  return () => console.log("cleanup");
});

count.set(5);
// 微任务中执行顺序: "cleanup" → "effect: 5"

dispose(); // 输出 "cleanup"
```

**销毁行为**: 调用 `dispose()` 时：

1. 设置 `disposed` 标志，防止过期的微任务回调执行
2. 调用 `watcher.unwatch(computed)` 停止追踪
3. 执行清理函数（如果存在）
4. 将清理函数设为 `undefined`

**批量更新**: 同一微任务内的多次同步 signal set 只触发一次 effect 重执行。通过 `queueMicrotask` + `pending` flag 实现 —— 只有第一次通知会调度微任务，后续更新在同一微任务内合并。

**错误处理**: effect 回调中的错误不会中断响应式系统。错误会被 try/catch 捕获并输出到 `console.error`，effect 会在下次依赖变更时继续尝试重新执行。

### `store<T>(initial): Store<T>`

从普通对象或数组创建响应式 store。属性读取会被 computed/effect 追踪；属性写入触发依赖重算。提供**细粒度响应式** —— 只有依赖被修改属性的 effect 才会重跑。

底层每个属性都有自己懒创建的 `Signal.State`。嵌套普通对象和数组会被递归包装为嵌套 proxy。非普通对象（如 `Date`、`RegExp`、class 实例）直接返回，不做代理包装。

```typescript
import { store, computed, effect } from "rikka-signal";

const state = store({
  user: { name: "Alice", age: 30 },
  items: [1, 2, 3],
});

// 读取 —— 在属性粒度上追踪依赖
state.user.name; // "Alice"

// 写入 —— 只触发依赖了该属性的 effect
state.user.name = "Bob";

// 配合 computed 使用
const greeting = computed(() => `Hello, ${state.user.name}!`);
greeting.get(); // "Hello, Bob!"

// 数组方法自然可用
state.items.push(4);
```

**signalOf() 访问信号**

Store 属性默认返回原始值。使用 `signalOf()` 可以访问底层的 `Signal.State`，用于模板绑定等需要信号本身的场景：

```typescript
import { store, signalOf } from 'rikka-signal';

const user = store({ name: 'Alice', age: 25 });

user.name               // string ("Alice") —— 原始值
signalOf(user, 'name')  // Signal.State<string> —— 底层信号

// 在 rikka-dom 中：
import { p } from 'rikka-dom';
p({}, signalOf(user, 'name'))   // 细粒度：文本节点随信号变化自动更新
p({}, user.name)                // 静态：永远不会更新

// 日常非绑定场景用 .name 更自然：
console.log(user.name);  // "Alice"
if (user.age > 18) { ... }
```

**嵌套属性访问**: `signalOf()` 支持多级键访问嵌套属性：

```typescript
const state = store({ user: { name: 'Alice' } });

signalOf(state, 'user', 'name')  // Signal.State<string> —— 直接访问嵌套属性信号
```

**嵌套响应式**: 修改 `state.user.name` 不会重跑只依赖 `state.user.age` 的 effect。每个属性是独立的响应式节点。

**Proxy 陷阱支持**: Store 的 Proxy 实现了完整的陷阱：

- `'name' in state` —— `has` 陷阱，支持 `in` 操作符
- `Object.keys(state)` —— `ownKeys` 陷阱，返回原始对象的所有属性名
- `Object.getOwnPropertyDescriptors(state)` —— `getOwnPropertyDescriptor` 陷阱
- `delete state.prop` —— `deleteProperty` 陷阱，将属性值设为 `undefined`

**替换嵌套对象**: 给属性赋新值会正确工作 —— 嵌套 proxy 通过委托代理自动同步，引用始终有效：

```typescript
state.user = { name: "Charlie", age: 25 };
// 依赖 state.user.name 的 effect 用 "Charlie" 重跑
// 之前保存的 const oldUser = state.user 仍然有效
// oldUser.name === "Charlie"
```

### `raw<T>(store): T`

返回 store 的底层原始对象，无响应式代理。适用于序列化或调试。

```typescript
import { store, raw } from "rikka-signal";

const state = store({ name: "Alice" });
const data = raw(state); // { name: "Alice" }
JSON.stringify(data); // '{"name":"Alice"}'
data.name = "Bob"; // 无响应式
```

### `Store<T>` 类型

`store()` 返回的类型，是原始对象类型与品牌标记的交叉类型：

```typescript
type Store<T extends object> = T & { readonly [__storeBrand]?: undefined };

const state = store({ name: "Alice", age: 25 });
// state 的类型是 Store<{ name: string; age: number }>
// 即 { name: string; age: number; readonly [__storeBrand]?: undefined }
```

### `signalOf()` 签名

`signalOf()` 使用 rest 参数支持多级路径访问：

```typescript
signalOf<T extends object, P extends readonly PropertyKey[]>(
  store: Store<T>,
  ...path: P
): Signal.State<PathValue<T, P>>
```

`PathValue` 是递归类型，根据路径元组自动推导最终属性类型。

## effect() 内部工作原理

1. 回调被包裹在 `Signal.Computed` 中 —— 自动追踪回调读取了哪些 signal
2. `Signal.subtle.Watcher` 观察该 computed signal
3. 当依赖变更时，watcher 回调检查 `pending` flag。若未 pending 则设置 flag 并调度微任务
4. 微任务清除 flag，重新求值 computed signal（即重新执行 effect 回调），然后重新 watch
5. `pending` flag 确保多次同步更新只触发一次重执行

```typescript
// effect() 的简化实现逻辑：
const watcher = new Signal.subtle.Watcher(() => {
  queueMicrotask(() => {
    computed.get(); // 重新执行回调
    watcher.watch(computed); // 重新监听
  });
});
```

## 使用模式

### 与 DOM 配合

```typescript
import { signal, effect } from "rikka-signal";

const color = signal("red");
effect(() => {
  element.style.color = color.get();
});
```

### 与 rikka-dom 配合

```typescript
import { signal } from "rikka-signal";
import { div, p, button } from "rikka-dom";

const count = signal(0);

// 细粒度：signal 作为子元素传入 h()
const app = div(
  p("Count: ", count), // 自动创建 effect，只更新文本节点
  button({ onclick: () => count.set(count.get() + 1) }, "+"),
);
```

### 与 defineElement 配合

```typescript
import { defineElement } from "rikka-elements";
import { computed } from "rikka-signal";

const MyComponent = defineElement("my-component", {
  attributes: { count: Number },
  render() {
    // this.count 是 getter/setter
    // this.$count 是 Signal.State<number>
    const doubled = computed(() => this.count * 2);
    return div();
  },
});
```

## 注意事项

- 基于 TC39 Signals 提案（Stage 1），使用 [`signal-polyfill`](https://github.com/proposal-signals/signal-polyfill) 实现
- `Signal.State` 和 `Signal.Computed` 已 re-export，可直接使用
- 所有 computed signal 惰性求值 —— 直到被访问才会计算
- Effect 通过 `Signal.Computed` 依赖图在运行时自动追踪依赖
- Effect 回调通过微任务调度批量执行 —— 同步多次 set 只触发一次 effect
- Effect 清理函数在下一次 effect 执行前和 effect 销毁时运行
- Store 使用 `Proxy` 拦截属性访问 —— 每个属性有独立的懒创建 `Signal.State`
- `signalOf()` 用于访问底层信号，适合模板绑定和 rikka-dom 子元素场景
- Store 只包装普通对象（原型为 `Object.prototype` 或 `null`）和数组 —— `Date` 等 class 实例直接返回
- 通过 proxy 修改 store 会同步修改原始对象；用 `raw()` 可获取无追踪的底层数据

## 常见陷阱

### 1. store 属性返回原始值，不是信号

这是最容易犯的错误。store 的 Proxy getter 返回的是 **signal 的当前值**，不是 signal 本身。

```typescript
import { store, signalOf } from 'rikka-signal';

const user = store({ name: "Alice" });

// ❌ 错误：user.name 是 string，不是 Signal
p({}, user.name); // 永远显示 "Alice"，不会更新

// ✅ 正确：用 signalOf() 获取 Signal.State
p({}, signalOf(user, 'name')); // 细粒度响应式更新
```

**为什么这样设计？** 因为日常代码中直接读值更自然（`if (user.age > 18)`、`console.log(user.name)`），只有需要响应式绑定的场景才需要信号。

### 2. signal.get() 在 computed 外部使用会失去响应性

```typescript
const count = signal(0);

// ❌ 失去响应性：get() 的结果是一个普通数字
const value = count.get(); // 0（静态值）
p({}, value); // 永远是 0

// ✅ 细粒度：直接传 signal
p({}, count); // 随 count 变化自动更新
```

在 `h()` 子元素或 `h\`` 插值中：

- `${signal}` → 细粒度（推荐）
- `${signal.get()}` → 失去响应性（只在不需要更新的场景使用）
- `computed(() => h\`...\`)` → 粗粒度（整个模板重建）

### 3. defineElement 中 this.xxx 不是信号

```typescript
defineElement("my-el", {
  attributes: { count: Number },
  render() {
    // ❌ this.count 是 number（getter 读的是 signal.get()）
    p({}, this.count); // 静态，不会更新

    // ✅ 用 $-prefix 访问底层信号
    p({}, this.$count); // 细粒度响应式
    return div();
  },
});
```

### 4. store 嵌套对象替换后引用自动同步

嵌套 proxy 采用委托代理架构，通过父级 `Signal.State` 动态读取当前数据。替换嵌套对象后，之前保存的引用会自动同步到新数据：

```typescript
import { store, signalOf } from 'rikka-signal';

const state = store({ user: { name: "Alice" } });
const userRef = state.user; // 保存了嵌套 proxy 引用
const nameSignal = signalOf(userRef, 'name'); // 保存了嵌套 Signal

state.user = { name: "Bob" }; // 替换了整个对象

userRef.name; // "Bob"（自动同步）
nameSignal.get(); // "Bob"（自动同步）
state.user.name; // "Bob"

// 同一个 proxy 实例
state.user === userRef; // true
```

**实现原理**：嵌套 proxy 通过 `readTarget` 从父级 `Signal.State` 动态读取当前值。当父级属性被替换时，`syncNestedProxy` 递归同步所有子级 Signal，确保持有的任何引用都反映最新数据。

### 5. raw() 返回的对象修改不会触发响应式

```typescript
const state = store({ items: [] });
const plain = raw(state);

plain.items.push("item"); // ❌ 不会触发任何 effect
state.items.push("item"); // ✅ 触发依赖该属性的 effect
```

`raw()` 主要用于序列化（`JSON.stringify(raw(state))`）或调试，不要修改其返回值并期望响应式更新。
