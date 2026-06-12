# rikka-live-playground — 交互式代码编辑组件

`@takanashi/rikka-live-playground` 提供一个可嵌入的自定义元素 `<rikka-live-playground>`，用于在任意页面中运行 Rikka 代码片段，非常适合文档、教程、演示、技术博客等场景。

## 最简使用

```html
<script type="module">
  import "@takanashi/rikka-live-playground";
</script>

<rikka-live-playground
  title="Counter Demo"
  height="240"
  layout="horizontal"
  panel="both"
  code="const count = signal(0);&#10;div(button({ onclick: () =&gt; count.set(count.get()+1) }, '+'), ' count = ', count);"
></rikka-live-playground>
```

通过元素内容提供代码（注意需要 HTML-unescape）：

```html
<rikka-live-playground title="Quick Demo" height="260">
  const count = signal(0);
  document.getElementById("app").appendChild(
    div(
      button({ onclick: () =&gt; count.set(count.get() + 1) }, "+"),
      " count = ", count,
    ),
  );
</rikka-live-playground>
```

在 JS 中以 tag helper 创建：

```ts
import { RikkaLivePlayground } from "@takanashi/rikka-live-playground";

const pg = RikkaLivePlayground.h({
  title: "API demo",
  height: "300",
  layout: "vertical",
  code: `console.log("Hello Rikka");`,
});
document.body.appendChild(pg);
```

## 属性 (attributes)

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `code` | `string` | `""` | 可执行的 TypeScript/JavaScript 代码 |
| `height` | `string` | `"320"` | 整个 playground 高度 (px) |
| `title` | `string` | `"Example"` | 头部标题 |
| `layout` | `"vertical"` \| `"horizontal"` | `"horizontal"` | 编辑器与预览的排布方向 |
| `panel` | `"both"` \| `"editor"` \| `"preview"` | `"both"` | 显示哪些面板 |
| `theme` | `"auto"` \| `"light"` \| `"dark"` | `"auto"` | 颜色主题；`auto` 跟随系统或页面 `data-theme` |

属性变更会立即反应到 UI（都是响应式 signal）。

## 事件

| 事件 | detail | 说明 |
|------|--------|------|
| `error` | `string` | 编译、执行或运行时错误，携带错误信息 |

```ts
const pg = document.querySelector("rikka-live-playground")!;
pg.addEventListener("error", (e) => console.error("Runtime error:", e.detail));
```

## 实例方法

| 方法 | 作用 |
|------|------|
| `pg.run()` | 立即编译并执行当前代码 |
| `pg.reset()` | 恢复到初始代码并重新运行 |
| `pg.toggleLayout()` | 水平/垂直布局切换 |
| `pg.setLayout("vertical" | "horizontal")` | 设置布局 |
| `pg.togglePanel("editor" | "preview")` | 切换显示某个面板 |
| `pg.setPanel("both" | "editor" | "preview")` | 设置面板 |
| `pg.setTheme("auto" | "light" | "dark")` | 设置主题 |
| `pg.toggleTheme()` | 明暗主题切换 |
| `pg.toggleFullscreen()` | 全屏切换 |
| `pg.exitFullscreen()` | 退出全屏 |

## 用户代码的运行环境

用户代码在一个**独立的 `<iframe sandbox="allow-scripts allow-same-origin">`** 中执行，具有以下全局：

```ts
// 响应式
window.signal    // @takanashi/rikka-signal
window.computed
window.effect

// DOM
window.h
window.div, window.span, window.p, window.button, window.input,
window.h1~h6, window.section, window.article, window.aside,
window.nav, window.header, window.footer, window.main,
window.ul, window.ol, window.li, window.table, window.thead,
window.tbody, window.tr, window.th, window.td,
window.form, window.select, window.option, window.label,
window.textarea, window.pre, window.code, window.br, window.hr,
window.img, window.slot, window.template,
window.svg, window.circle, window.path, window.rect, window.line,
window.polygon, window.polyline, window.g, window.defs,
window.use, window.foreignObject, window.clipPath, window.pattern,
window.marker, window.mask, window.image, window.linearGradient,
window.radialGradient, window.stop, window.symbol, window.filter,
window.ellipse, window.text, window.tspan, window.textPath,
window.svga, window.svgscript, window.svgstyle, window.svgtitle,
window.css, window.inlineStyle

// 控制流
window.For, window.Show, window.When, window.Switch, window.Match

// 自定义元素
window.defineElement, window.event,
window.StringAttr, window.NumberAttr, window.BooleanAttr
```

iframe 内预生成了两个容器：

- `<div id="app"></div>` — 供用户挂载 UI
- `<div id="console-output"></div>` — 自动镜像 `console.log/warn/error/info` 的输出

用户代码中的 `import` 语句会被自动剥离（静态字符串 import 是为了给 IDE 提供类型提示；playground 的全局已提供相同能力）。

## 编译流程

1. 读取 editor 中代码（通过 CodeJar + highlight.js 提供高亮与编辑）
2. 用 `sucrase` 以 `transform(code, { transforms: ["typescript"] })` 做 TypeScript → JS 转换
3. 生成一个 `<iframe>`，写入脚本：
   - 加载 Rikka 各包到 `window`
   - 执行编译后的用户代码
4. 启动 ResizeObserver，让 iframe 高度自适应内容

## 主题与 CSS 变量

Playground 通过以下 CSS 变量驱动样式（均在 `:host` 层可覆盖）：

```css
:host {
  --pg-bg: #0d1117;
  --pg-surface: #161b22;
  --pg-surface-elevated: #1a1a2e;
  --pg-border: #334155;
  --pg-text: #e6edf3;
  --pg-text-muted: #94a3b8;
  --pg-accent: #6366f1;
  --pg-accent-soft: rgba(99, 102, 241, 0.12);
  --pg-success: #238636;
  --pg-error: #f85149;
  --pg-handle-grip: #475569;
  --pg-syntax-comment: #6b7280;
  --pg-syntax-keyword: #c084fc;
  /* ... 更多变量见 src/index.ts 中的 livePlaygroundStyles */
}
```

Playground 在 `connectedCallback` 时会把这些 CSS 变量的当前值**发送到 iframe 内部**，保证用户代码也能看到一致的主题（postMessage 通过 `__rikka_playground_theme` 类型通信）。

`theme="auto"` 同时监听两个信号：

1. 系统 `prefers-color-scheme: dark`
2. 页面 `<html data-theme="...">` 的属性变化（基于 `MutationObserver`）

## 完整示例

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>My Docs</title>
  </head>
  <body>
    <h1>Documentation</h1>
    <rikka-live-playground
      title="Counter"
      height="280"
      layout="horizontal"
      panel="both"
      theme="dark"
    >
      const count = signal(0);
      const app = div(
        { style: "display: flex; gap: .5rem; align-items: center" },
        button({ onclick: () => count.set(count.get() - 1) }, "-"),
        span("count = ", count),
        button({ onclick: () => count.set(count.get() + 1) }, "+"),
      );
      document.getElementById("app").appendChild(app);
    </rikka-live-playground>

    <script type="module" src="/playground.js"></script>
  </body>
</html>
```

## 作为组件嵌入到其它自定义元素

```ts
import { defineElement } from "@takanashi/rikka-elements";
import { RikkaLivePlayground } from "@takanashi/rikka-live-playground";
import { div, h2 } from "@takanashi/rikka-dom";

defineElement("doc-section", {
  shadow: { mode: "open" },
  render() {
    return div(
      h2("Live Example"),
      RikkaLivePlayground.h({
        title: "Counter",
        height: "280",
        code: `const count = signal(0);
div(button({ onclick: () => count.set(count.get()+1) }, "+"), ' count = ', count);`,
      }),
    );
  },
});
```

## 源码结构

| 文件 | 作用 |
|------|------|
| `components/rikka-live-playground/src/index.ts` | 核心 — playground 元素定义、样式、主题、编译与执行管线 |
| `components/rikka-live-playground/src/content.ts` | i18n 文案表 |
| `components/rikka-live-playground/src/i18n.ts` | 本地化工具（locale signal + `tr`） |

## 相关阅读

- [rikka-elements](rikka-elements) — 如何自定义 `defineElement`
- [rikka-dom](rikka-dom) — playground 内部使用的 DOM 原语
