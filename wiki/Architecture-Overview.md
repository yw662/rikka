# Architecture Overview

Rikka 采用清晰的三层架构：**响应式层 → DOM 层 → 自定义元素层**，每一层可独立使用，上层构建于下层之上。

## 整体架构图

```
  ┌────────────────────────────────────────────────────┐
  │              Application / Components              │
  │        (examples/*, rikka-homepage, user code)     │
  └─────────────┬──────────────────┬───────────────────┘
                │                  │
  ┌─────────────▼──────────┐  ┌────▼───────────────────┐
  │ rikka-live-playground  │  │  rikka-elements        │
  │  (基于 rikka-elements  │  │  defineElement,         │
  │    构建的高级组件)     │  │   属性/事件/方法/模板   │
  └─────────────┬──────────┘  └────┬───────────────────┘
                │                   │
  ┌─────────────▼───────────────────▼───────────────────┐
  │                    rikka-dom                         │
  │  h(), tag helpers, ReactiveRange, For/Show/Switch,  │
  │           css(), inlineStyle, 模板解析               │
  └─────────────┬───────────────────────────────────────┘
                │
  ┌─────────────▼───────────────────────────────────────┐
  │                  rikka-signal                        │
  │     signal(v), computed(fn), effect(fn), untracked   │
  │     基于 signal-polyfill (TC39 Signals 提案)         │
  └──────────────────────────────────────────────────────┘
                │
  ┌─────────────▼───────────────────────────────────────┐
  │          Native Web Platform / signal-polyfill       │
  │  Custom Elements v1 · Shadow DOM · CSS 嵌套 ·        │
  │  ES Modules · HTMLTemplateElement · WeakRef         │
  └──────────────────────────────────────────────────────┘
```

## 关键架构原则

### 1. 逐层构建，每层独立可用

- 只需要响应式 → 用 `rikka-signal`
- 需要声明式 DOM 创建 → 用 `rikka-dom`
- 需要可复用 Web Component → 用 `rikka-elements`

### 2. 零运行时依赖

- 核心包 `@takanashi/rikka-signal`、`@takanashi/rikka-dom`、`@takanashi/rikka-elements` 除了 `signal-polyfill` 没有运行时依赖
- 产物通过 `rslib` 构建，可 Tree-shake，单包 gzipped 约 1-6KB

### 3. Tag 函数返回真实 DOM

`h(tag, attrs, children)` 和所有预生成的 `div / button / ...` 函数都返回真实的 `HTMLElement`，没有虚拟 DOM 层，没有 diff 算法。

### 4. Signal 驱动细粒度更新

- 响应式订阅在 `effect` / `ReactiveRange` 内部建立
- 每次 `.set()` 触发订阅节点的**局部**更新，而不是整棵树重渲染
- 使用 `WeakMap` + `FinalizationRegistry` 做自动清理，避免内存泄漏

### 5. Web Component 友好而非框架锁定

`defineElement()` 产生的是标准 `HTMLElement` 子类，可在 React / Vue / Angular / Svelte 中直接使用，也可裸 HTML 使用。

## 模块依赖关系

```
@takanashi/rikka-signal       # 无内部依赖 (仅 peer: signal-polyfill)
        ▲
        │  导入
        │
@takanashi/rikka-dom          # 依赖 rikka-signal
        ▲
        │  导入
        │
@takanashi/rikka-elements     # 依赖 rikka-dom + rikka-signal
        ▲
        │  导入
        │
@takanashi/rikka-live-playground  # 依赖 rikka-elements
```

## 响应式执行模型

```
 signal.set(newValue)
        │
        ▼
 Signal.State 的版本号 ++
        │
        ▼
 signal-polyfill 通知所有订阅者
        │
        ▼
 effect(fn) 注册的 Watcher 触发
  (queueMicrotask 中异步执行)
        │
        ▼
 fn() 执行时读取信号 → 重新建立依赖 → 局部 DOM 更新
        │
        ▼
 Signal.Computed 延迟求值（按需）
```

关键实现文件：
- `utils/rikka-signal/src/index.ts` — `signal/computed/untracked`
- `utils/rikka-signal/src/effect.ts` — 带清理的 effect 实现

## DOM 更新模型

`rikka-dom` 通过 `ReactiveRange` 标记一组可替换节点，配合 `effect` 监听信号变化并只对范围内的 DOM 进行**最小修改**：

1. `applyChild(parent, child)` 将 child 挂载到父元素
2. 当 child 是 `Signal` 或 `computed`，会自动创建 `ReactiveRange` 包装
3. 信号变化时 `range.reconcile(newNodes)` 做最小差异 diff
4. 元素销毁时 `WeakRef + FinalizationRegistry` 自动清理 effect 订阅

关键文件：
- `utils/rikka-dom/src/h.ts` — `ReactiveRange` / `applyChild` / `h()` / `createElement`
- `utils/rikka-dom/src/tags.ts` — 预生成的 HTML/SVG/MathML tag helpers
- `utils/rikka-dom/src/control-flow.ts` — `For / Show / When / Switch / Match`
- `utils/rikka-dom/src/template.ts` — HTML 模板字符串解析、`css()`、`inlineStyle`
- `utils/rikka-dom/src/attributes.ts` — 类型属性映射

## 自定义元素模型

`defineElement(tagName, config)` 完成：

1. 为 `attributes` 生成 getter/setter，其中 setter ≡ `signal.set()` + `setAttribute()`
2. 为每个属性生成 `this.$attrName` 的 signal 访问器（供 render 响应式使用）
3. 为 `events` 生成 `dispatchEventName(detail)` 分发器
4. 将 `methods` 直接挂到原型
5. `connectedCallback` 中 attach Shadow DOM、应用 `styles`、调用 `render()` 或克隆 `template`
6. `disconnectedCallback` 清理 effect / 事件监听器

关键文件：
- `utils/rikka-elements/src/defineElement.ts` — 核心
- `utils/rikka-elements/src/utils.ts` — PascalCase / camelCase 工具

## 项目工作流架构

```
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│   pnpm install   │──▶│  pnpm build       │──▶│  pnpm test:all    │
│ (catalog deps)   │   │ (rslib 构建 ESM)  │   │(lint+type+unit+e2e)│
└──────────────────┘   └──────────────────┘   └──────────────────┘
                                                         │
                                                  ┌──────▼──────┐
                                                  │ Changeset    │
                                                  │ version bump │
                                                  └──────┬──────┘
                                                         │
                                                  ┌──────▼──────┐
                                                  │ npm publish  │
                                                  └─────────────┘
```

## 下一步

- [rikka-signal API](rikka-signal) — 响应式原语详解
- [rikka-dom API](rikka-dom) — DOM 创建与响应式渲染
- [rikka-elements API](rikka-elements) — 自定义元素定义
