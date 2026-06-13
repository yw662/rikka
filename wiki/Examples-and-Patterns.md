# Examples & Patterns

Rikka 的每个示例都在独立的 `examples/*/` workspace 包中，全部采用 Rikka 自举实现 — 是学习 Rikka 最好的起点。

## 现有示例

| 示例 | 路径 | 说明 |
|------|------|------|
| **2048 Game** | `examples/2048-game/` | 基于 signals 管理状态，tag helpers 渲染经典 2048 游戏 |
| **Bookmark Manager** | `examples/bookmark-manager/` | 完整的 CRUD 应用：搜索、tag 过滤、统计 |
| **Code Editor** | `examples/code-editor/` | 带 preview iframe 的在线编辑器（类 playground 组件） |
| **Drawing Pad** | `examples/drawing-pad/` | Canvas 绘图演示，signal 管理笔色/粗细/撤销栈 |
| **Finance Tracker** | `examples/finance-tracker/` | 带分类统计的账单追踪器，展示 computed 派生统计 |
| **Pomodoro Timer** | `examples/pomodoro-timer/` | 番茄钟（工作/休息模式切换、统计面板） |
| **Snake Game** | `examples/snake-game/` | 经典贪吃蛇，展示高频信号更新与 DOM 绘制 |
| **Todo List** | `examples/todo-list/` | 最简 CRUD — 通常作为学习 Rikka 的第一个范例 |

运行单个示例：

```bash
cd examples/todo-list
pnpm dev
# 或用顶层命令： pnpm --filter rikka-todo-list dev
```

## 模式速览

### 模式 1：Single-Signal 状态

适用：单一状态（开关、计数）。

```ts
const open = signal(false);
defineElement("my-toggle", {
  render() {
    return div(
      button({ onclick: () => open.set(!open.get()) }, "Toggle"),
      Show(open, () => div("Hello!")),
    );
  },
});
```

### 模式 2：计算派生 (computed)

适用：派生值、过滤/汇总数据。

```ts
const items = signal<Todo[]>([]);
const doneCount = computed(() => items.get().filter(t => t.done).length);
const percent   = computed(() => {
  const total = items.get().length;
  return total === 0 ? 0 : Math.round(100 * doneCount.get() / total);
});

div("完成: ", doneCount, " / ", () => items.get().length, " (", percent, "%)");
```

### 模式 3：For + keyFn 列表

适用：长列表 / 可重排列表（启用 keyed reconcile 以复用 DOM）。

```ts
For(items,
  (t) => li({ class: t.done ? "done" : "" }, t.text),
  (t) => t.id,    // keyFn —— 关键：启用缓存与最小移动
);
```

### 模式 4：Shadow DOM 样式隔离

适用：可复用组件。

```ts
const style = css`
  :host { display: block; border: 1px solid #ddd; padding: 1rem; border-radius: 6px; }
  .title { font-weight: 600; }
`;

defineElement("fancy-card", {
  attributes: { title: StringAttr, subtitle: { ...StringAttr, default: "" } },
  styles: style,
  render() {
    return div(
      div({ class: "title" }, this.$title),
      div(this.$subtitle),
    );
  },
});
```

### 模式 5：自定义事件 (父→子→父通信)

```ts
defineElement("todo-item", {
  attributes: { text: StringAttr, done: BooleanAttr },
  events: { toggle: event<void>(), remove: event<void>() },
  render() {
    return div(
      input({ type: "checkbox", checked: this.$done, onchange: () => this.dispatchToggle() }),
      span(this.$text),
      button({ onclick: () => this.dispatchRemove() }, "×"),
    );
  },
});

// 父级
div(
  For(list, (t) => h("todo-item", {
    text: t.text, done: t.done,
    ontoggle: () => { t.done = !t.done; list.set([...list.get()]); },
    onremove: () => list.set(list.get().filter(x => x.id !== t.id)),
  }, (t) => t.id)),
);
```

### 模式 6：基于 data-* 的 dataset 属性

适用：集成外部库 / 数据属性驱动。

```ts
defineElement("analytics-card", {
  dataset: { eventName: { default: "card_view" }, trackId: { default: "" } },
  render() {
    return div({
      "data-event": this.$eventName,
      "data-id":    this.$trackId,
    }, "Hello");
  },
});
```

### 模式 7：模板字符串 (`h\`...\``)

适用：已有 HTML 片段或更自然的书写。

```ts
const nodes = h`
  <div class="card" data-id="${id}">
    <h3>${title}</h3>
    <p>${body}</p>
    ${button({ onclick: () => console.log("clicked") }, "Action")}
  </div>
`;
applyChild(container, nodes);
```

### 模式 8：Template 模式 (声明式 + 指令)

适用：已有 `<template>`，或希望完全由标记驱动时。

```ts
const tpl = document.createElement("template");
tpl.innerHTML = `
  <h2>{{ title }}</h2>
  <p>price: {{ price }}</p>
  <button onclick="{{@buy}}">Buy</button>
`;

defineElement("product-card", {
  attributes: { title: StringAttr, price: NumberAttr },
  events:     { buy: event<number>() },
  methods:    { buy() { this.dispatchBuy(this.price); } },
  template:   tpl,
});
```

### 模式 9：Effect 用于 DOM 副作用

适用：订阅信号做非渲染副作用（日志、网络、保存）。

```ts
import { effect } from "@takanashi/rikka-signal";

const query = signal("");

defineElement("search-box", {
  render() {
    return div(input({ value: query, placeholder: "type to search" }), results);
  },
});

const debounced = computed(() => query.get().trim());
effect(() => {
  const q = debounced.get();
  if (q.length < 2) { results.set([]); return; }
  fetch(`/api/search?q=${encodeURIComponent(q)}`)
    .then(r => r.json())
    .then(data => results.set(data));
});
```

## 示例目录结构

每个 `examples/<name>/` 都遵循：

```
src/
 ├─ index.ts         # 入口（attach 到 document.getElementById("app")）
 ├─ i18n.ts          # (可选) locale signal + 文案
 ├─ content.ts       # (可选) 静态文案
 ├─ components/      # (可选) 页面级组件定义
 └─ store.ts         # (可选) 顶层应用 state —— 纯 signals
index.html           # 容器页
package.json         # 声明 workspace 包
rsbuild.config.ts    # 构建配置
tsconfig.json
```

> 推荐以 `examples/todo-list` 为入门模板 —— 它用最少代码展示了 state + render 模式。

## 下一步

- 回到 [Getting Started](Getting-Started) 了解项目启动
- 查看 [Development & CI](Development-and-CI) 了解如何构建、测试、发布
