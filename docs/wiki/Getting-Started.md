# Getting Started

从 0 到 1，快速上手 Rikka。

## 环境要求

- **Node.js** ≥ 18 (推荐 20+)
- **pnpm** ≥ 8 (使用 workspace + catalog)
- **TypeScript** ≥ 5.0 (严格模式推荐)
- 浏览器支持原生 **Custom Elements v1**、**Shadow DOM v1**、**CSS 嵌套**

## 克隆与安装

```bash
git clone https://github.com/yw662/rikka.git
cd rikka
pnpm install
```

## 启动文档站点 (demo)

```bash
pnpm demo
# 默认监听 http://localhost:3000
```

文档站点 `docs/rikka-homepage/` 完全用 rikka 自举实现，是最佳学习范例。

## 编写第一个计数器

### 1. 响应式信号

```ts
import { signal, computed, effect } from "@takanashi/rikka-signal";

const count = signal(0);
const doubled = computed(() => count.get() * 2);

effect(() => console.log("doubled =", doubled.get()));
// → doubled = 0

count.set(3);
// (下一微任务) → doubled = 6
```

### 2. 直接 DOM 操作

```ts
import { div, button, span, applyChild } from "@takanashi/rikka-dom";

const app = div(
  { style: "display: flex; gap: 0.5rem;" },
  span("Count: ", count), // 直接传 signal，自动响应更新
  button({ onclick: () => count.set(count.get() + 1) }, "+"),
  button({ onclick: () => count.set(count.get() - 1) }, "-"),
);

applyChild(document.getElementById("app")!, app);
```

### 3. 定义自定义元素

```ts
import { defineElement, NumberAttr } from "@takanashi/rikka-elements";
import { div, button, span, css } from "@takanashi/rikka-dom";

defineElement("my-counter", {
  shadow: { mode: "open" },
  attributes: {
    count: { ...NumberAttr, default: 0 },
  },
  styles: css`
    .wrap { display: flex; gap: 0.5rem; }
    button { padding: 0.25rem 0.75rem; }
  `,
  render() {
    return div(
      { class: "wrap" },
      span("Count: ", this.$count), // this.$count 为 signal，响应式
      button({ onclick: () => this.count++ }, "+"),
      button({ onclick: () => this.count-- }, "-"),
    );
  },
});
```

在 HTML 中使用：

```html
<my-counter count="10"></my-counter>
```

或在 JS 中调用 tag helper：

```ts
import { h } from "@takanashi/rikka-dom";
const el = h("my-counter", { count: 5 });
document.body.appendChild(el);
```

## 交互式 Playground

Rikka 自带一个自定义元素 `<rikka-live-playground>`，可以直接嵌入到任何 HTML 页面中作为交互代码示例：

```html
<script type="module">
  import "@takanashi/rikka-live-playground";
</script>

<rikka-live-playground
  title="Counter Demo"
  height="320"
  layout="horizontal"
  panel="both"
>
  const count = signal(0);
  div(
    button({ onclick: () => count.set(count.get() + 1) }, "+"),
    span(" count = ", count),
  );
</rikka-live-playground>
```

## 常用命令速查

```bash
pnpm build         # 构建所有包
pnpm test          # 单测 (Vitest + happy-dom)
pnpm test:all      # 完整 CI 流水线: lint + typecheck + test + browser-test
pnpm typecheck     # 仅类型检查
pnpm demo          # 启动文档站点
pnpm changeset     # 创建 changeset 条目
```

## 下一步

- 阅读 [Architecture Overview](Architecture-Overview) 了解三层架构
- 深入 [rikka-signal](rikka-signal) / [rikka-dom](rikka-dom) / [rikka-elements](rikka-elements) API
- 查看 [Examples & Patterns](Examples-and-Patterns) 学习常见模式
