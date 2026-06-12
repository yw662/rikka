# rikka-signal — 响应式原语

`@takanashi/rikka-signal` 基于 [TC39 Signals 提案](https://github.com/tc39/proposal-signals) 与 [signal-polyfill](https://github.com/proposal-signals/signal-polyfill) 实现，提供细粒度响应式能力。

## 为什么用 Signals?

与 Vue / React / Svelte 等框架各自拥有响应式实现不同，Rikka 的 `signal()` 直接构建在正在成为 Web 标准的提案之上。当浏览器原生实现该提案时，Rikka 只需：

1. 移除 `signal-polyfill` 依赖
2. 保留 API 不变

即获得原生性能和更小体积，**用户代码无需任何改动**。

## API 概览

| 函数 | 说明 | 位置 |
|------|------|------|
| `signal<T>(initial: T): Signal.State<T>` | 创建可变信号 | `src/index.ts` |
| `computed<T>(fn: () => T): Signal.Computed<T>` | 创建派生（计算）信号 | `src/index.ts` |
| `effect(fn: () => void | (()=>void)): () => void` | 创建副作用，返回清理函数 | `src/effect.ts` |
| `untracked<T>(fn: () => T): T` | 读取信号但不追踪 | `src/index.ts` |
| `Signal` 命名空间 | 底层 polyfill 原语，`Signal.State` / `Signal.Computed` / `Signal.subtle.Watcher` | (re-export) |

## 详细 API

### `signal<T>(initialValue: T): Signal.State<T>`

创建一个响应式状态容器。使用 `.get()` 读取，`.set(v)` 更新。

```ts
const count = signal(0);
console.log(count.get()); // 0
count.set(5);
console.log(count.get()); // 5
```

> **内部实现**：直接代理 `new Signal.State<T>(initialValue)`。`Signal.State` 维护一个版本号，每次 `.set()` 递增，订阅者感知变化并在下一微任务运行。

### `computed<T>(fn: () => T): Signal.Computed<T>`

创建一个**派生信号**，它的值由其他信号 `fn()` 自动计算得到。computed 是**惰性**的：只有在 `.get()` 时才计算，且会缓存结果直到依赖变化。

```ts
const a = signal(1);
const b = signal(2);
const sum = computed(() => a.get() + b.get());

console.log(sum.get()); // 3
a.set(10);
console.log(sum.get()); // 12
```

### `effect(fn: () => void | (() => void)): () => void`

在响应式上下文中执行 `fn`，自动追踪其读取的信号，当任一信号变化时重新执行。`fn` 可以返回一个清理函数，用于下一次执行前或 effect 销毁时清理资源。

```ts
const dispose = effect(() => {
  console.log("count =", count.get());
  return () => console.log("cleanup");
});

count.set(1);   // logs: cleanup, count = 1
count.set(2);   // logs: cleanup, count = 2
dispose();      // logs: cleanup (最终)
count.set(3);   // 无输出 (已注销)
```

> **内部实现**：`effect` 通过 `Signal.subtle.Watcher` 注册到 polyfill。每次执行时，它包装 `Signal.Computed` 用于依赖追踪，并用 `queueMicrotask` 异步调度。通过 `disposed` 标志防止销毁后仍被调度。`effect.ts` 还提供 `onError` 重载以捕获执行期错误。

### `untracked<T>(fn: () => T): T`

```ts
effect(() => {
  // 订阅 log，不订阅 count
  const snapshot = untracked(() => count.get());
  console.log(log.get(), "count was", snapshot);
});
```

> **设计意图**：某些副作用只关心「触发条件」信号而不关心「数据读取」信号时，`untracked` 可以降低响应面，减少不必要的重跑。

## 常见模式

### 模式 1 — 计数器

```ts
const count = signal(0);
count.set(count.get() + 1);
```

### 模式 2 — 派生值

```ts
const todos = signal<Todo[]>([]);
const doneCount = computed(() =>
  todos.get().filter(t => t.done).length
);
```

### 模式 3 — 条件依赖

```ts
const show = signal(true);
const a = signal(10);

effect(() => {
  if (show.get()) {
    console.log("a =", a.get()); // 仅当 show 为 true 时追踪 a
  } else {
    console.log("hidden");        // 不再追踪 a
  }
});
```

依赖关系会随着代码路径而动态建立 / 解除——这是 Signals 相对传统观察者模式的关键优势。

## 与 rikka-dom 的集成

`rikka-dom` 的 `h()` / tag helpers / `applyChild()` 接受 `Signal.State<T>` / `Signal.Computed<T>` 作为 children 和大部分属性值（`text`、`style`、`value`、`checked` 等）。

当信号变化时，**只有对应节点被更新**，不会重建整个子树：

```ts
import { div, button } from "@takanashi/rikka-dom";
import { signal } from "@takanashi/rikka-signal";

const count = signal(0);

div(
  button({ onclick: () => count.set(count.get() + 1) }, "+"),
  " count = ", count, // 仅更新文本节点
);
```

## 注意事项

1. **不要在 effect 内直接 set 订阅中的信号** — 可能导致无限循环
2. **保持 `fn` 纯** — `computed(fn)` 的 `fn` 不应有副作用
3. **避免循环依赖** — A 依赖 B 且 B 依赖 A 会导致求值顺序问题
4. **显式清理 effect** — 组件销毁时调用返回的 `dispose()`

## 文件与源码位置

- `utils/rikka-signal/src/index.ts` — 主 API
- `utils/rikka-signal/src/effect.ts` — 带清理的 effect 实现
- `utils/rikka-signal/test/index.test.ts` — 单元测试

## 相关阅读

- [TC39 Signals Proposal explainer](https://github.com/tc39/proposal-signals)
- [rikka-dom API](rikka-dom) — 如何在 DOM 中使用信号
- [rikka-elements API](rikka-elements) — 如何在自定义元素中使用信号
