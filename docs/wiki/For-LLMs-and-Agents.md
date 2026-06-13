# For LLMs and Agents

Rikka 在设计上特别考虑了被 AI / LLM / coding-agent 使用时的可发现性与可预测性。除了常规文档以外，本项目还维护了以下面向 agent 的入口：

## 1. `llms.txt`

根目录 `llms.txt` 是面向 LLM crawler 的入口文件，类似于 `robots.txt`，但服务于模型。列出了：

- 项目意图
- 所有 API 入口 (`utils/*/src/index.ts`)
- 示例目录
- agent skill 目录
- 测试入口

LLM 可以直接抓取 `https://your-domain/llms.txt` 来获得整个项目的 API 概览。

## 2. Skills（`skills/*/SKILL.md`）

项目维护了 14+ 份 `SKILL.md`，以 [agentskills.io](https://agentskills.io) 格式编写。每个 SKILL.md 讲解一个特定能力，并给出可直接使用的模式：

| Skill | 说明 |
|-------|------|
| `overview` | 项目总览，面向 agent 第一次接触时的 briefing |
| `reactive-state` | `signal / computed / effect` 使用模式与坑 |
| `dom-creation` | `h()` / tag helpers / `applyChild` |
| `control-flow` | `For / Show / When / Switch / Match` |
| `template-binding` | `h\`...\`` 模板字面量 + 属性/文本绑定 |
| `signal-binding` | 把 signal 直接写入属性、children、style |
| `custom-element` | `defineElement` 全配置：attributes/dataset/events/methods/styles/template/render |
| `shadow-dom-styling` | `css\`...\`` / `inlineStyle\`...\`` / Shadow DOM 封装 |
| `svg` | SVG 与 MathML tag helpers 使用 |
| `form-binding` | `value` / `checked` 的双向绑定 |
| `common-pitfalls` | 易错点：不要在 computed 做副作用、不要同名属性/自定义事件冲突等 |
| `rikka` | 综合 skill —— 对 agent 的一站式 briefing |
| `browser-compatibility` | 支持的浏览器与最小特性要求 |
| `composition` | 自定义元素组合、父子通信、事件冒泡模式 |

在本地安装它们（让你的 agent 自动识别）：

```bash
npx skills add yw662/rikka
```

> 注：`AGENTS.md` 同样总结了面向 agent 的开发约定，建议在交给 agent 一个 Rikka 任务前先让它读一遍。

## 3. WebMCP (Web Model-Context Protocol)

`utils/rikka-elements/src/webmcp.ts` 实现了一个小型协议：把页面上活跃的自定义元素实例暴露为 LLM 可调用的能力集合。

关键 API：

```ts
import {
  listInstances,
  resolveInstance,
  getModelContext,
  getDomPath,
  isWebMCPSupported,
} from "@takanashi/rikka-elements";

// 列出所有已注册的 rikka 元素
const list = listInstances();
// [{ tagName, domPath, element, tools, context }]

// 解析某元素 domPath → 实例
const el = resolveInstance("/HTML/BODY/MY-COUNTER[1]");

// 为某元素生成供 LLM 调用的上下文 (JSON)
const ctx = getModelContext(el);
// { tagName, domPath, attributes: {...}, signals: {...}, ... }
```

在自定义元素定义中启用：

```ts
defineElement("todo-list", {
  attributes: { items: /* JSON-ish */ ... },
  tools: {
    add: {
      description: "Append an item",
      parameters: { text: { type: "string" } },
      execute: (el, { text }) => el.add(text),
    },
  },
  toolContext: { items: "$items" },
  methods: { add(text) { /* ... */ } },
  render() { /* ... */ },
});
```

> `toolContext` 中 `"$xxx"` 表示引用 `this.$xxx` signal，每次读取都会返回当前值；普通键名引用 `this.xxx`。

## 4. AI 代码生成的最佳实践

当你交给一个 agent 写 Rikka 代码时，请让它遵守：

1. **先在顶部显式 import**：`import { signal, computed, effect } from "@takanashi/rikka-signal"`；`import { div, button, h } from "@takanashi/rikka-dom"`；`import { defineElement, NumberAttr, BooleanAttr, event } from "@takanashi/rikka-elements"`。
2. **用信号驱动视图**：不要直接操作 `document.getElementById` 去改文本，而是把 signal 作为 child / attribute 传入。
3. **使用内置的控制流**：优先 `For(list, render, keyFn)` 而不是手动 `.map` + 重建。
4. **自定义元素使用 `this.$xxx`**：在 render 中使用 `this.$count`（信号）而不是 `this.count`（普通值）以获得响应式更新。
5. **优先使用 `NumberAttr` / `StringAttr` / `BooleanAttr`** 作为属性规格；需要自定义时再写自己的 `toProp/toAttribute`。
6. **事件名使用 kebab-case 或 camelCase**：`events: { 'item-selected': event<Item>() }` → `this.dispatchItemSelected(detail)` / `el.onitemselected = fn`。
7. **`render()` 返回单个 Element**：内部用 `div(children...)` 包裹多个子节点。
8. **组件销毁 / 清理**：effect 总是返回清理函数，或把它挂到 `registerDisposable(el, dispose)`，Rikka 会在元素 disconnect 时自动清理。

## 5. 推荐的 agent 任务流程

```
  1) 安装 skills → npx skills add yw662/rikka
  2) 加载 llms.txt (项目根目录) 做 briefing
  3) 根据需求匹配 skills (reactive-state / dom-creation / custom-element ...)
  4) 先写最小运行的 TypeScript 代码 (examples/* 风格)
  5) 在 examples/<name>/src/ 或 docs/rikka-homepage/src/pages/* 调试
  6) 最后写单元测试: utils/*/test/*.test.ts
```

## 相关文档

- [Architecture Overview](Architecture-Overview) — 给 agent 的整体架构图
- [Examples & Patterns](Examples-and-Patterns) — 常见代码模式
