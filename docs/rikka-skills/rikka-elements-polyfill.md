# defineElement 浏览器降级指导

> rikka-elements 的 `defineElement` 依赖 Web Components 标准（Custom Elements、Shadow DOM、Constructable Stylesheet）。本文档说明在不支持这些 API 的浏览器上如何通过 polyfill 实现降级。

## 浏览器支持现状

| API                                              | Chrome | Firefox | Safari | Edge |
| ------------------------------------------------ | ------ | ------- | ------ | ---- |
| Custom Elements V1                               | 67+    | 63+     | 10.1+  | 79+  |
| Shadow DOM V1                                    | 53+    | 63+     | 10+    | 79+  |
| Constructable Stylesheet (`new CSSStyleSheet()`) | 73+    | 101+    | 16.4+  | 79+  |
| `adoptedStyleSheets`                             | 73+    | 101+    | 16.4+  | 79+  |

### 建议提高构建目标

建议将构建目标提升至 **Chrome 73+、Firefox 101+、Safari 16.4+、Edge 79+**（即所有 Web Components API 均原生支持的最低版本），这样目标范围内无需任何 polyfill。Safari 16.4 发布于 2023 年 3 月，至今已超过 3 年，作为最低目标版本是合理的。

## 需要降级的场景

1. **需要兼容旧浏览器**（Chrome < 73、Firefox < 101、Safari < 16.4、旧 Edge EdgeHTML）
2. **SSR 环境**（jsdom 不支持 Custom Elements；happy-dom 支持）
3. **受限 WebView**（部分嵌入式浏览器、小程序 WebView）

## 降级方案总览

```
                    ┌─────────────────────────────┐
                    │   defineElement 降级层级      │
                    └──────────┬──────────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
     Custom Elements      Shadow DOM      CSSStyleSheet
         降级               降级              降级
              │                │                │
              ▼                ▼                ▼
     @webcomponents/       Light DOM       <style> 元素
     custom-elements       回退             注入
     (~7KB gzip)        (无 CSS 隔离)     (无隔离但功能等价)
```

三层降级可以独立选择，按需组合。

---

## 一、Custom Elements 降级

### 问题

`defineElement` 内部调用 `customElements.define()` 注册自定义元素。在不支持 Custom Elements 的浏览器中，`window.customElements` 不存在，调用会抛出异常。

### 方案：引入 `@webcomponents/custom-elements`

这是 Web Components 官方 polyfill 的独立包，仅包含 Custom Elements V1 polyfill（~7KB gzip），不包含 Shadow DOM polyfill。

**安装：**

```bash
npm install @webcomponents/custom-elements
```

**使用：在所有 rikka 代码之前加载**

```typescript
// 入口文件最顶部
import "@webcomponents/custom-elements";

// 然后正常使用 rikka
import { defineElement } from "rikka-elements";
```

或通过 `<script>` 标签：

```html
<script src="node_modules/@webcomponents/custom-elements/custom-elements.min.js"></script>
<script type="module" src="./app.js"></script>
```

### polyfill 行为说明

`@webcomponents/custom-elements` 在原生支持 Custom Elements 的浏览器中为 **no-op**（零开销），仅在缺失时激活。激活后的行为：

| 能力                            | 实现方式                                 | 与原生的差异               |
| ------------------------------- | ---------------------------------------- | -------------------------- |
| `customElements.define()`       | 注册到内部 registry                      | 无                         |
| `customElements.get()`          | 从 registry 查找                         | 无                         |
| `customElements.whenDefined()`  | Promise + 回调队列                       | 无                         |
| `connectedCallback`             | MutationObserver 监听 DOM 插入           | **异步触发**（原生为同步） |
| `disconnectedCallback`          | MutationObserver 监听 DOM 移除           | **异步触发**（原生为同步） |
| `attributeChangedCallback`      | Patch `setAttribute` / `removeAttribute` | 无                         |
| `document.createElement()` 升级 | `Object.setPrototypeOf`                  | 有性能开销                 |

### 注意事项

1. **`connectedCallback` 异步触发**：polyfill 通过 MutationObserver 检测 DOM 变化，回调在微任务中执行。如果代码依赖 `connectedCallback` 的同步语义，需要适配。

2. **`Object.setPrototypeOf` 性能开销**：polyfill 通过修改原型链将普通 `HTMLElement` 实例"升级"为自定义元素。每次 `createElement` 都会触发，在高频创建场景下可能有性能影响。

3. **`adoptedCallback` 不支持**：polyfill 不实现 `adoptedCallback`（rikka-elements 当前也未使用此回调，无影响）。

4. **私有字段不可用**：`Object.setPrototypeOf` 后 ES2022 私有字段（`#field`）不可访问。rikka-elements 内部使用 `WeakSet` 替代私有字段，不受此影响。但如果你在 `methods` 中使用了私有字段，需要改为普通属性。

5. **加载顺序**：polyfill 必须在任何操作 DOM 的代码之前加载，否则已存在的自定义元素标签不会被升级。

### 替代方案：`@webcomponents/webcomponentsjs`

如果同时需要 Shadow DOM polyfill，可以使用完整套件：

```bash
npm install @webcomponents/webcomponentsjs
```

```html
<!-- 使用 loader 按需加载 -->
<script src="node_modules/@webcomponents/webcomponentsjs/webcomponents-loader.js"></script>
```

`webcomponents-loader.js` 会通过 feature detection 自动选择需要的 polyfill bundle。完整 bundle 约 88KB gzip。

---

## 二、Shadow DOM 降级

### 问题

`defineElement` 默认创建 Shadow DOM（`{ mode: 'open' }`）。在 `attachShadow` 不可用的浏览器中会抛出异常。

### 方案 A：Light DOM 回退（推荐）

不引入 Shadow DOM polyfill，而是在 `attachShadow` 不可用时将内容直接插入元素自身（light DOM）。

**实现方式**：在 `defineElement` 的 `connectedCallback` 中检测 `attachShadow` 是否可用：

```typescript
connectedCallback() {
  if (shadowOptions) {
    let root: HTMLElement | ShadowRoot;
    if (typeof this.attachShadow === 'function') {
      root = this.shadowRoot ?? this.attachShadow(shadowOptions);
    } else {
      root = this; // 降级：light DOM
    }

    // 注入样式和内容到 root
    if (styles.length > 0) injectStyles(root, styles);
    if (templateEl) root.appendChild(templateEl.content.cloneNode(true));
    else if (renderFn) { /* ... */ }
    bindSlots(this, root);
  }
}
```

**Light DOM 与 Shadow DOM 的差异：**

| 特性            | Shadow DOM            | Light DOM 降级                  |
| --------------- | --------------------- | ------------------------------- |
| CSS 隔离        | ✅ `:host` 选择器生效 | ❌ 样式泄漏到外部               |
| DOM 封装        | ✅ 外部查询不到内部   | ❌ 内部节点可见                 |
| `<slot>` 插槽   | ✅ 正常工作           | ❌ 不工作                       |
| 事件重定向      | ✅ 自动重定向         | ❌ 事件目标为内部元素           |
| `el.shadowRoot` | 返回 ShadowRoot       | 返回 `null`                     |
| `:host` 选择器  | ✅ 匹配宿主元素       | ❌ 不匹配（需改用标签名选择器） |

**缓解 Light DOM 的样式泄漏：**

```typescript
// Shadow DOM 中：
styles: css`:host { display: block; color: red; }`,

// Light DOM 降级时，:host 不生效，改用标签名选择器：
styles: css`
  :host, my-counter { display: block; color: red; }
`,
```

或使用 `:is()` 简化：

```typescript
styles: css`:is(:host, my-counter) { display: block; color: red; }`,
```

### 方案 B：`@webcomponents/shadydom`

引入 Shadow DOM polyfill（~13KB gzip），模拟 Shadow DOM 的封装行为。

```bash
npm install @webcomponents/shadydom
```

```typescript
import "@webcomponents/shadydom";
```

**注意**：`shadydom` 通过 patch 大量 DOM API 实现（`appendChild`、`insertBefore`、`querySelector` 等），侵入性很强，且存在已知问题：

- 事件重定向行为与原生不完全一致
- `<slot>` 分配逻辑有边界 case
- 与其他库的全局 patch 可能冲突
- 性能开销较大

**仅在必须兼容旧浏览器且需要 DOM 封装时使用。**

### 方案 C：`shadow: false` 显式禁用

如果组件不需要 Shadow DOM，直接在配置中禁用：

```typescript
defineElement("my-el", {
  shadow: false,
  render() {
    return div("content directly in element");
  },
});
```

禁用后内容直接插入元素自身，不创建 Shadow Root。此模式下：

- 无 CSS 隔离
- 无 `<slot>` 机制
- `el.shadowRoot` 为 `null`
- 样式需通过外部 `<style>` 或全局样式表管理

---

## 三、CSSStyleSheet / adoptedStyleSheets 降级

### 问题

rikka-dom 的 `css()` 模板标签创建 `CSSStyleSheet` 实例，`defineElement` 通过 `shadow.adoptedStyleSheets` 注入样式。这两个 API 在部分浏览器中不可用：

| 浏览器            | `new CSSStyleSheet()` | `adoptedStyleSheets` |
| ----------------- | --------------------- | -------------------- |
| Chrome 73+        | ✅                    | ✅                   |
| Firefox 101+      | ✅                    | ✅                   |
| Safari 16.4+      | ✅                    | ✅                   |
| Safari 14–16.3    | ❌                    | ❌                   |
| 旧 Chrome/Firefox | ❌                    | ❌                   |

> **注意**：如果将构建目标提升至 Safari 16.4+（如上文建议），则目标范围内此降级不再需要。以下内容仅适用于需要兼容更旧浏览器的场景。

### 方案：降级为 `<style>` 元素注入

当 `CSSStyleSheet` 或 `adoptedStyleSheets` 不可用时，将 CSS 文本通过 `<style>` 元素注入到 shadow root（或元素自身）。

**实现方式：**

```typescript
function injectStyles(
  root: HTMLElement | ShadowRoot,
  styles: CSSStyleSheet[],
): void {
  if (styles.length === 0) return;

  // 优先尝试 adoptedStyleSheets
  if ("adoptedStyleSheets" in root) {
    try {
      root.adoptedStyleSheets = [...root.adoptedStyleSheets, ...styles];
      return;
    } catch {
      /* fall through to <style> injection */
    }
  }

  // 降级：<style> 元素注入
  for (const sheet of styles) {
    const cssText = extractCssText(sheet);
    if (cssText) {
      const styleEl = document.createElement("style");
      styleEl.textContent = cssText;
      root.insertBefore(styleEl, root.firstChild);
    }
  }
}

function extractCssText(sheet: CSSStyleSheet): string {
  // 优先从缓存中获取（css() 函数创建时缓存）
  if ((sheet as any).__cssText) return (sheet as any).__cssText;
  // 回退：从 cssRules 提取
  try {
    return Array.from(sheet.cssRules)
      .map((r) => r.cssText)
      .join("\n");
  } catch {
    return "";
  }
}
```

**`css()` 函数需要配合修改**：在创建 `CSSStyleSheet` 时缓存原始 CSS 文本，以便降级时提取：

```typescript
export function css(strings, ...values): CSSStyleSheet {
  const cssText = buildCssText();

  if (typeof CSSStyleSheet !== "undefined") {
    try {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(cssText);
      (sheet as any).__cssText = cssText; // 缓存
      return sheet;
    } catch {
      /* fall through */
    }
  }

  // CSSStyleSheet 构造函数不可用时的降级
  return { __cssText: cssText, __rikkaFakeSheet: true } as any;
}
```

### `<style>` 注入与 `adoptedStyleSheets` 的差异

| 特性       | `adoptedStyleSheets`               | `<style>` 元素                   |
| ---------- | ---------------------------------- | -------------------------------- |
| 样式共享   | ✅ 多个 Shadow Root 共享同一 sheet | ❌ 每个 Shadow Root 各有一份副本 |
| 内存效率   | ✅ 高                              | ❌ 重复创建                      |
| CSSOM 修改 | ✅ `replaceSync` 动态更新          | ❌ 需操作 `textContent`          |
| 兼容性     | Chrome 73+, Safari 16.4+           | 全平台                           |

---

## 四、组合方案推荐

根据目标浏览器选择合适的组合：

### 场景 1：目标为 Chrome 73+、Firefox 101+、Safari 16.4+、Edge 79+（推荐）

所有 Web Components API 均原生支持，**无需任何 polyfill 或降级**。

```typescript
import { defineElement } from "rikka-elements";
```

### 场景 2：兼容 Chrome 54–72、Firefox 63–100、Safari 10.1–16.3

这些浏览器支持 Custom Elements 和 Shadow DOM，但缺 Constructable Stylesheet。

```typescript
// 无需 CE polyfill
// 无需 Shadow DOM polyfill
// 仅需 CSSStyleSheet 降级（rikka-elements 内置处理）
import { defineElement } from "rikka-elements";
```

**无需额外依赖**，只需确保 `defineElement` 和 `css()` 内部有 `adoptedStyleSheets` → `<style>` 的降级逻辑。

### 场景 3：兼容 Chrome < 54、Safari < 10.1

这些浏览器 Custom Elements 支持缺失或不完整，需要 CE polyfill。

```typescript
import "@webcomponents/custom-elements";
import { defineElement } from "rikka-elements";
```

### 场景 4：兼容 IE11、旧 Edge EdgeHTML

需要完整的 polyfill 套件。

```html
<script src="node_modules/@webcomponents/webcomponentsjs/webcomponents-bundle.js"></script>
<script type="module" src="./app.js"></script>
```

注意：IE11 还需要 `Promise`、`Map`、`Set`、`WeakMap`、`WeakSet`、`Symbol` 等 ES6+ polyfill，以及 Babel 转译。rikka-elements 的构建目标为 ES2022，**不直接支持 IE11**。如需 IE11 兼容，需要自行转译并引入完整的 polyfill。

### 场景 5：SSR 环境

```typescript
// jsdom 环境：不支持 Custom Elements
// 方案 1：引入 happy-dom（原生支持 Custom Elements）
import { GlobalRegistrator } from "@happy-dom/global-registrator";
await GlobalRegistrator.register();

// 方案 2：引入 CE polyfill
import "@webcomponents/custom-elements";
```

---

## 五、defineElement 内部需要的代码改动

以下是 `defineElement` 需要做的防御性编码改动，确保在各降级场景下不崩溃：

### 5.1 `#initialized` → `WeakSet`

`@webcomponents/custom-elements` polyfill 使用 `Object.setPrototypeOf` 升级元素，导致 ES2022 私有字段（`#field`）不可访问。需将 `#initialized` 替换为 `WeakSet`：

```typescript
// 之前
class RikkaElementInner extends HTMLElement {
  #initialized = false;
  connectedCallback() {
    if (this.#initialized) return;
    this.#initialized = true;
  }
}

// 之后
const initializedElements = new WeakSet<HTMLElement>();
class RikkaElementInner extends HTMLElement {
  connectedCallback() {
    if (initializedElements.has(this)) return;
    initializedElements.add(this);
  }
}
```

`WeakSet` 的行为与 `#initialized` 完全等价（以元素实例为 key，GC 友好），且兼容 `Object.setPrototypeOf`。

### 5.2 `customElements.define` 防御性调用

```typescript
queueMicrotask(() => {
  try {
    customElements.define(
      tagName,
      RikkaElementInner as CustomElementConstructor,
    );
  } catch {
    // polyfill 未加载且原生不支持时静默失败
    // tag 函数仍可通过降级路径创建元素
  }
});
```

### 5.3 Shadow DOM 降级

```typescript
connectedCallback() {
  if (initializedElements.has(this)) return;
  initializedElements.add(this);

  if (shadowOptions) {
    let root: HTMLElement | ShadowRoot;
    if (typeof this.attachShadow === 'function') {
      root = this.shadowRoot ?? this.attachShadow(shadowOptions);
    } else {
      root = this;
    }

    injectStyles(root, styles);

    if (templateEl) {
      root.appendChild(templateEl.content.cloneNode(true));
    } else if (renderFn) {
      const result = (this as any).render();
      if (result instanceof Element) root.appendChild(result);
    }

    bindSlots(this, root);
  }
}
```

### 5.4 tag 函数降级

当 `customElements` 不可用时，`document.createElement(tagName)` 无法创建正确原型的元素。tag 函数需要降级路径：

```typescript
const tagFn = ((...args: any[]) => {
  // 原生路径：customElements 已注册
  if (typeof customElements !== "undefined" && customElements.get(tagName)) {
    return isPlainObject(args[0])
      ? h(tagName, args[0], ...args.slice(1))
      : h(tagName, ...args);
  }

  // 降级路径：手动创建并升级元素
  const el = document.createElement(tagName);
  Object.setPrototypeOf(el, RikkaElementInner.prototype);

  if (isPlainObject(args[0])) {
    applyAttrs(el, args[0]);
    for (const child of args.slice(1)) applyChild(el, child);
  } else {
    for (const child of args) applyChild(el, child);
  }

  return el;
}) as ElementConstructor<C>;
```

### 5.5 `css()` 缓存 CSS 文本

`rikka-dom/src/template.ts` 中的 `css()` 函数需要在创建 `CSSStyleSheet` 时缓存原始 CSS 文本：

```typescript
export function css(strings, ...values): CSSStyleSheet {
  const cssText = buildCssText();

  if (typeof CSSStyleSheet !== "undefined") {
    try {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(cssText);
      (sheet as any).__cssText = cssText;
      return sheet;
    } catch {
      /* fall through */
    }
  }

  return { __cssText: cssText } as any;
}
```

---

## 六、依赖参考

| 包                               | 版本 | 用途                                        | gzip 大小 | 安装命令                               |
| -------------------------------- | ---- | ------------------------------------------- | --------- | -------------------------------------- |
| `@webcomponents/custom-elements` | ^1.6 | Custom Elements V1 polyfill                 | ~7KB      | `npm i @webcomponents/custom-elements` |
| `@webcomponents/shadydom`        | ^1.0 | Shadow DOM V1 polyfill                      | ~13KB     | `npm i @webcomponents/shadydom`        |
| `@webcomponents/shadycss`        | ^1.0 | CSS 作用域 polyfill（配合 shadydom）        | ~25KB     | `npm i @webcomponents/shadycss`        |
| `@webcomponents/webcomponentsjs` | ^2.8 | 全套 polyfill（CE + Shadow DOM + 平台补丁） | ~88KB     | `npm i @webcomponents/webcomponentsjs` |
| `@webcomponents/template`        | ^1.0 | HTML Template polyfill                      | ~2KB      | `npm i @webcomponents/template`        |

所有 `@webcomponents/*` 包在原生支持目标 API 的浏览器中为 no-op，不会产生运行时开销。

---

## 七、常见问题

### Q: 我需要兼容哪些浏览器？

建议将最低目标设为 **Chrome 73+、Firefox 101+、Safari 16.4+、Edge 79+**，此范围内所有 Web Components API 均原生支持，无需任何 polyfill。Safari 16.4 发布于 2023 年 3 月，作为最低目标版本是合理的。

### Q: polyfill 会不会影响现代浏览器的性能？

不会。`@webcomponents/custom-elements` 在入口处做 feature detection，如果 `window.customElements` 已存在则直接 return，零开销。

### Q: Light DOM 降级下样式冲突怎么办？

1. 使用 BEM 命名或 `data-*` 属性选择器避免冲突
2. 在 `:host` 旁边加上标签名选择器作为 fallback：`:is(:host, my-el) { ... }`
3. 考虑使用 CSS Modules 或 Scoped CSS 等方案

### Q: `<slot>` 在 Light DOM 下不工作怎么办？

Light DOM 降级时 `<slot>` 元素会保留在 DOM 中但不生效，子内容直接可见。如果需要插槽语义，可以：

1. 使用 `shadow: false` 显式禁用 Shadow DOM，手动管理子内容
2. 在 render 函数中通过 `this.childNodes` 读取子节点并重新排列
3. 引入 `@webcomponents/shadydom` polyfill（代价较大）

### Q: SSR 环境下如何处理？

推荐使用 `happy-dom`，它原生支持 Custom Elements。jsdom 不支持 Custom Elements，需要额外引入 polyfill。

```typescript
// 测试环境示例
import { GlobalRegistrator } from "@happy-dom/global-registrator";
await GlobalRegistrator.register();
```
