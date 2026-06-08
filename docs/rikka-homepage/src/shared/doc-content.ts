import type { Locale } from "./i18n";

/**
 * Translations for the documentation page sidebar (table of contents).
 */
export const sidebarContent = {
  // 01 — Getting Started
  gettingStarted: { en: "Getting Started", zh: "快速开始" } as Record<Locale, string>,
  signal: { en: "signal()", zh: "signal()" } as Record<Locale, string>,
  computed: { en: "computed()", zh: "computed()" } as Record<Locale, string>,
  effect: { en: "effect()", zh: "effect()" } as Record<Locale, string>,

  // 06 — h()
  h: { en: "h()", zh: "h()" } as Record<Locale, string>,
  tagHelpers: { en: "Tag Helpers", zh: "标签助手" } as Record<Locale, string>,
  for: { en: "For", zh: "For" } as Record<Locale, string>,
  conditionals: { en: "Conditionals", zh: "条件渲染" } as Record<Locale, string>,
  htmlTemplate: { en: "h``", zh: "h``" } as Record<Locale, string>,
  signalInterpolation: { en: "Signal Interpolation", zh: "信号插值" } as Record<Locale, string>,
  cssTemplate: { en: "css``", zh: "css``" } as Record<Locale, string>,
  inlineStyle: { en: "inlineStyle``", zh: "inlineStyle``" } as Record<Locale, string>,

  // 12 — defineElement
  defineElement: { en: "defineElement", zh: "defineElement" } as Record<Locale, string>,
  shadowDom: { en: "Shadow DOM", zh: "Shadow DOM" } as Record<Locale, string>,
  adoptStyle: { en: "adoptStyle", zh: "adoptStyle" } as Record<Locale, string>,
  attribute: { en: "attribute", zh: "attribute" } as Record<Locale, string>,
  event: { en: "event", zh: "event" } as Record<Locale, string>,
  attachTemplate: { en: "attachTemplate", zh: "attachTemplate" } as Record<Locale, string>,

  // API reference
  apiReference: { en: "API Reference", zh: "API 参考" } as Record<Locale, string>,

  // UI
  drawerTitle: { en: "Table of Contents", zh: "目录" } as Record<Locale, string>,
};

/**
 * Shared doc-page UI labels (used in every page's nav and headings).
 */
export const docUiContent = {
  tryIt: { en: "Try It", zh: "试一试" } as Record<Locale, string>,
  advanced: { en: "Advanced", zh: "进阶" } as Record<Locale, string>,
  api: { en: "API", zh: "API" } as Record<Locale, string>,
};

/**
 * Page 01 — Getting Started
 */
const gettingStartedContent = {
  subtitle: {
    en: "A lightweight reactive primitives package built on the TC39 Signals proposal.",
    zh: "基于 TC39 Signals 提案构建的轻量级响应式原语包。",
  } as Record<Locale, string>,
  installation: { en: "Installation", zh: "安装" } as Record<Locale, string>,
  orUseCdn: {
    en: "Or use via CDN (no build step required):",
    zh: "或通过 CDN 使用（无需构建步骤）：",
  } as Record<Locale, string>,
  coreConcepts: { en: "Core Concepts", zh: "核心概念" } as Record<Locale, string>,
  coreConceptsDesc: {
    en: "Rikka provides three core reactive primitives:",
    zh: "Rikka 提供三个核心响应式原语：",
  } as Record<Locale, string>,
  signalDesc: {
    en: " — creates a reactive value that tracks dependencies.",
    zh: " — 创建一个追踪依赖的响应式值。",
  } as Record<Locale, string>,
  computedDesc: {
    en: " — derives a value from other signals automatically.",
    zh: " — 自动从其他信号派生值。",
  } as Record<Locale, string>,
  effectDesc: {
    en: " — runs side effects when signals change.",
    zh: " — 信号变化时运行副作用。",
  } as Record<Locale, string>,
  quickExample: { en: "Quick Example", zh: "快速示例" } as Record<Locale, string>,
  quickExampleDesc: {
    en: "The example below uses pure signals — no custom elements required. This code works in any JavaScript environment.",
    zh: "下面的示例使用纯信号 — 不需要自定义元素。这段代码可以在任何 JavaScript 环境中运行。",
  } as Record<Locale, string>,
};

/**
 * Page 02 — signal()
 */
const signalContent = {
  subtitle: {
    en: "Signals are the foundation of reactivity in Rikka.",
    zh: "信号是 Rikka 响应式的基础。",
  } as Record<Locale, string>,
  creating: { en: "Creating a Signal", zh: "创建信号" } as Record<Locale, string>,
  creatingDesc: {
    en: "Use ",
    zh: "使用 ",
  } as Record<Locale, string>,
  creatingDescAfter: {
    en: " to create a reactive value. The returned object has ",
    zh: " 创建一个响应式值。返回的对象提供 ",
  } as Record<Locale, string>,
  creatingDescMethods: {
    en: " and ",
    zh: " 和 ",
  } as Record<Locale, string>,
  creatingDescMethodsEnd: {
    en: " methods.",
    zh: " 方法。",
  } as Record<Locale, string>,
  passingToDom: {
    en: "Passing Signals to DOM Helpers",
    zh: "将信号传递给 DOM 助手",
  } as Record<Locale, string>,
  passingToDomDesc: {
    en: "Signals can be passed directly to DOM helpers. The DOM updates automatically when the signal changes.",
    zh: "信号可以直接传递给 DOM 助手。信号变化时 DOM 会自动更新。",
  } as Record<Locale, string>,
  prevGettingStarted: { en: "← Getting Started", zh: "← 快速开始" } as Record<Locale, string>,
  nextComputed: { en: "computed() →", zh: "computed() →" } as Record<Locale, string>,
};

/**
 * Page 03 — computed()
 */
const computedContent = {
  subtitle: {
    en: "Computed signals derive their value from other signals.",
    zh: "computed 信号从其他信号派生其值。",
  } as Record<Locale, string>,
  creating: { en: "Creating a Computed Signal", zh: "创建 computed 信号" } as Record<Locale, string>,
  creatingDesc1: { en: "Use ", zh: "使用 " } as Record<Locale, string>,
  creatingDesc2: {
    en: " to create a signal that derives its value from other signals. The function re-runs whenever a dependency changes.",
    zh: " 创建一个从其他信号派生值的信号。每当依赖变化时，函数会重新运行。",
  } as Record<Locale, string>,
  autoTracking: { en: "Auto-Tracking", zh: "自动追踪" } as Record<Locale, string>,
  autoTrackingDesc1: {
    en: "Dependencies are tracked automatically. Any ",
    zh: "依赖会被自动追踪。在 computed 函数内调用 ",
  } as Record<Locale, string>,
  autoTrackingDesc2: {
    en: " call inside the computed function registers a dependency.",
    zh: " 即注册一个依赖。",
  } as Record<Locale, string>,
  autoTrackingNoArrays: {
    en: "No explicit dependency arrays or watchers needed — just read signals and the rest is handled for you.",
    zh: "无需显式声明依赖数组或监听器 — 只需读取信号，其他都为你自动处理。",
  } as Record<Locale, string>,
  lazyEvaluation: { en: "Lazy Evaluation", zh: "惰性求值" } as Record<Locale, string>,
  lazyEvaluationDesc: {
    en: "Computed signals are lazy. The derivation function only runs when ",
    zh: "computed 信号是惰性的。派生函数仅在调用 ",
  } as Record<Locale, string>,
  lazyEvaluationDescMid: {
    en: " is called, and only re-evaluates if a dependency has changed since the last read.",
    zh: " 时运行，且仅在自上次读取以来依赖发生变化时才重新计算。",
  } as Record<Locale, string>,
  slicingTitle: {
    en: "Slicing a Complex Signal",
    zh: "对复杂信号进行切片",
  } as Record<Locale, string>,
  slicingDesc1: {
    en: "When the source of truth is one large object — e.g. a record loaded from the server — wrap each reader in a ",
    zh: "当唯一数据源是一个大对象时（例如从服务器加载的记录），把每个读取器包裹在 ",
  } as Record<Locale, string>,
  slicingDesc1Mid: {
    en: " that pulls out only the slice it needs. The ",
    zh: " 中，只读取它需要的切片。",
  } as Record<Locale, string>,
  slicingDesc1End: {
    en: " then depends precisely on that slice, not on the whole object.",
    zh: " 精确地依赖于该切片，而非整个对象。",
  } as Record<Locale, string>,
  slicingDesc2: {
    en: " uses reference equality by default. If the slice value is unchanged, downstream readers do not re-run — even though the parent ",
    zh: " 默认使用引用相等。如果切片值未变，下游读取器不会重新运行 — 即使父级 ",
  } as Record<Locale, string>,
  slicingDesc2End: {
    en: " was reassigned to a brand-new object.",
    zh: " 被重新赋值为一个全新的对象。",
  } as Record<Locale, string>,
  prevSignal: { en: "← signal()", zh: "← signal()" } as Record<Locale, string>,
  nextEffect: { en: "effect() →", zh: "effect() →" } as Record<Locale, string>,
};

/**
 * Page 04 — effect()
 */
const effectContent = {
  subtitle: {
    en: "Effects run side effects when signals change.",
    zh: "effect 在信号变化时运行副作用。",
  } as Record<Locale, string>,
  creating: { en: "Creating an Effect", zh: "创建 effect" } as Record<Locale, string>,
  creatingDesc1: { en: "Use ", zh: "使用 " } as Record<Locale, string>,
  creatingDesc2: {
    en: " to run a function whenever its signal dependencies change. Effects are the primary way to perform side effects in Rikka.",
    zh: " 在信号依赖变化时运行函数。effect 是在 Rikka 中执行副作用的主要方式。",
  } as Record<Locale, string>,
  cleanup: { en: "Cleanup Function", zh: "清理函数" } as Record<Locale, string>,
  cleanupDesc1: {
    en: "An effect callback can return a function — the ",
    zh: "effect 回调可以返回一个函数 —— 即 ",
  } as Record<Locale, string>,
  cleanupDesc2: {
    en: ". It runs in two cases:",
    zh: "。它在两种情况下运行：",
  } as Record<Locale, string>,
  cleanupCase1: {
    en: "1. Before the next re-execution (when dependencies change)",
    zh: "1. 下次重新执行之前（依赖变化时）",
  } as Record<Locale, string>,
  cleanupCase2: {
    en: "2. When the effect is disposed",
    zh: "2. effect 被释放时",
  } as Record<Locale, string>,
  cleanupDesc3: {
    en: "The cleanup always runs before the new effect body. This is useful for removing event listeners, clearing timers, or aborting fetch requests.",
    zh: "清理函数总是在新的 effect 函数体之前运行。这对于移除事件监听器、清除定时器或中止 fetch 请求非常有用。",
  } as Record<Locale, string>,
  disposing: { en: "Disposing Effects", zh: "释放 effect" } as Record<Locale, string>,
  disposingDesc1: {
    en: " returns a dispose function. Call it to permanently stop the effect and run its cleanup.",
    zh: " 返回一个 dispose 函数。调用它可以永久停止该 effect 并运行其清理函数。",
  } as Record<Locale, string>,
  prevComputed: { en: "← computed()", zh: "← computed()" } as Record<Locale, string>,
  nextH: { en: "h() →", zh: "h() →" } as Record<Locale, string>,
};

/**
 * Page 06 — h()
 */
const hContent = {
  desc: {
    en: "The core function for creating DOM elements with reactive support.",
    zh: "用于创建支持响应式的 DOM 元素的核心函数。",
  } as Record<Locale, string>,
  keyConcepts: { en: "Key Concepts", zh: "关键概念" } as Record<Locale, string>,
  bullet1: {
    en: " — Create an element by tag name.",
    zh: " — 通过标签名创建元素。",
  } as Record<Locale, string>,
  bullet2: {
    en: "Children can be ",
    zh: "子节点可以是 ",
  } as Record<Locale, string>,
  bullet2Mid: {
    en: ", ",
    zh: "、",
  } as Record<Locale, string>,
  bullet2End: {
    en: ", or ",
    zh: " 或 ",
  } as Record<Locale, string>,
  bullet3: {
    en: "Signals in children automatically subscribe and update when changed.",
    zh: "作为子节点的信号会自动订阅并在变化时更新。",
  } as Record<Locale, string>,
  bullet4: {
    en: "Attributes accept plain objects; event handlers use ",
    zh: "属性接受普通对象；事件处理函数使用 ",
  } as Record<Locale, string>,
  bullet4End: {
    en: " naming.",
    zh: " 命名。",
  } as Record<Locale, string>,
  apiSignature: { en: "API Signature", zh: "API 签名" } as Record<Locale, string>,
  prevEffect: { en: "← effect()", zh: "← effect()" } as Record<Locale, string>,
  nextTagHelpers: { en: "Tag Helpers →", zh: "标签助手 →" } as Record<Locale, string>,
};

/**
 * Page 07 — Tag Helpers
 */
const tagHelpersContent = {
  desc: {
    en: "Pre-built factory functions for every HTML element.",
    zh: "为每个 HTML 元素预构建的工厂函数。",
  } as Record<Locale, string>,
  keyConcepts: { en: "Key Concepts", zh: "关键概念" } as Record<Locale, string>,
  bullet1: {
    en: " — Common element helpers.",
    zh: " — 常用元素助手。",
  } as Record<Locale, string>,
  bullet2: {
    en: "Same API as ",
    zh: "与 ",
  } as Record<Locale, string>,
  bullet2End: {
    en: " but the tag is pre-bound.",
    zh: " API 相同，但标签已预先绑定。",
  } as Record<Locale, string>,
  bullet3: {
    en: "Fully typed with correct attribute inference per element type.",
    zh: "完全类型化，按元素类型提供正确的属性推断。",
  } as Record<Locale, string>,
  bullet4: {
    en: "Includes semantic elements: ",
    zh: "包含语义化元素：",
  } as Record<Locale, string>,
  bullet4End: {
    en: ", etc.",
    zh: " 等。",
  } as Record<Locale, string>,
  bullet5: {
    en: "Table elements: ",
    zh: "表格元素：",
  } as Record<Locale, string>,
  bullet5End: {
    en: ", etc.",
    zh: " 等。",
  } as Record<Locale, string>,
  bullet6: {
    en: "Form elements: ",
    zh: "表单元素：",
  } as Record<Locale, string>,
  bullet6End: {
    en: ", etc.",
    zh: " 等。",
  } as Record<Locale, string>,
  availableHelpers: {
    en: "Available Tag Helpers",
    zh: "可用的标签助手",
  } as Record<Locale, string>,
  svgHelpers: { en: "SVG Tag Helpers", zh: "SVG 标签助手" } as Record<Locale, string>,
  svgHelpersDesc: {
    en: "SVG elements automatically use the SVG namespace:",
    zh: "SVG 元素自动使用 SVG 命名空间：",
  } as Record<Locale, string>,
  example: { en: "Example:", zh: "示例：" } as Record<Locale, string>,
  namespace: { en: "Namespace Behavior", zh: "命名空间行为" } as Record<Locale, string>,
  namespaceDesc: {
    en: "Each tag helper resolves its namespace based on the tag name itself (not parent context):",
    zh: "每个标签助手根据标签名本身（而非父级上下文）解析其命名空间：",
  } as Record<Locale, string>,
  nsBullet1: {
    en: " and all SVG element helpers (",
    zh: " 及所有 SVG 元素助手（",
  } as Record<Locale, string>,
  nsBullet1Mid: {
    en: ", etc.) always create elements in the SVG namespace — determined by a built-in tag-name lookup.",
    zh: " 等）始终在 SVG 命名空间中创建元素 — 由内置的标签名查找决定。",
  } as Record<Locale, string>,
  nsBullet2: {
    en: " and MathML helpers use the MathML namespace.",
    zh: " 及 MathML 助手使用 MathML 命名空间。",
  } as Record<Locale, string>,
  nsBullet3: {
    en: "Standard HTML helpers (",
    zh: "标准 HTML 助手（",
  } as Record<Locale, string>,
  nsBullet3End: {
    en: ", etc.) use the HTML namespace.",
    zh: " 等）使用 HTML 命名空间。",
  } as Record<Locale, string>,
  nsBullet4: {
    en: "Only ",
    zh: "只有 ",
  } as Record<Locale, string>,
  nsBullet4Mid: {
    en: " tag names exist in both HTML and SVG namespaces and require disambiguation — use the ",
    zh: " 个标签名同时存在于 HTML 和 SVG 命名空间中，需要消歧 —— 当你需要 SVG 版本时，使用 ",
  } as Record<Locale, string>,
  nsBullet4End: {
    en: "-prefixed variant when you need the SVG version: ",
    zh: " 前缀的变体：",
  } as Record<Locale, string>,
  nsBullet4Final: {
    en: ".",
    zh: "。",
  } as Record<Locale, string>,
  nsBullet5: {
    en: "All other SVG-only tags (",
    zh: "所有其他仅限 SVG 的标签（",
  } as Record<Locale, string>,
  nsBullet5Mid: {
    en: ", etc.) and MathML-only tags (",
    zh: " 等）以及仅限 MathML 的标签（",
  } as Record<Locale, string>,
  nsBullet5End: {
    en: ", etc.) resolve correctly without any prefix.",
    zh: " 等）无需任何前缀即可正确解析。",
  } as Record<Locale, string>,
  nsBullet6: {
    en: " is an SVG element that serves as an HTML integration point — place standard HTML helpers inside it.",
    zh: " 是一个 SVG 元素，作为 HTML 集成点 —— 在其中放置标准 HTML 助手。",
  } as Record<Locale, string>,
  usageExample: { en: "Usage Example", zh: "使用示例" } as Record<Locale, string>,
  prevH: { en: "← h()", zh: "← h()" } as Record<Locale, string>,
  nextFor: { en: "For →", zh: "For →" } as Record<Locale, string>,
};

/**
 * Page 08 — For
 */
const forContent = {
  desc: {
    en: "Reactive list rendering with reference-based caching.",
    zh: "基于引用的响应式列表渲染与缓存。",
  } as Record<Locale, string>,
  keyConcepts: { en: "Key Concepts", zh: "关键概念" } as Record<Locale, string>,
  bullet1: {
    en: " — Render a list reactively from a Signal array.",
    zh: " — 从 Signal 数组中响应式地渲染列表。",
  } as Record<Locale, string>,
  bullet2: {
    en: "Cache-based diffing: only adds/removes/moves what changed.",
    zh: "基于缓存的 diff：仅添加/移除/移动变化的部分。",
  } as Record<Locale, string>,
  bullet3: {
    en: "Key function for stable identity across re-renders.",
    zh: "key 函数用于在重新渲染之间保持稳定的标识。",
  } as Record<Locale, string>,
  bullet4: {
    en: "Returns a ",
    zh: "返回一个 ",
  } as Record<Locale, string>,
  bullet4End: {
    en: " that auto-updates.",
    zh: "，会自动更新。",
  } as Record<Locale, string>,
  apiSignature: { en: "API Signature", zh: "API 签名" } as Record<Locale, string>,
  prevTagHelpers: { en: "← Tag Helpers", zh: "← 标签助手" } as Record<Locale, string>,
  nextConditionals: { en: "Conditionals →", zh: "条件渲染 →" } as Record<Locale, string>,
};

/**
 * Page 09 — Conditionals
 */
const conditionalsContent = {
  desc: {
    en: "Show, When, Switch, and Match for conditional rendering.",
    zh: "使用 Show、When、Switch 和 Match 进行条件渲染。",
  } as Record<Locale, string>,
  keyConcepts: { en: "Key Concepts", zh: "关键概念" } as Record<Locale, string>,
  bullet1: {
    en: " — Show/hide an element based on condition (toggles display).",
    zh: " — 根据条件显示/隐藏元素（切换 display）。",
  } as Record<Locale, string>,
  bullet2: {
    en: " — Render one of two branches conditionally.",
    zh: " — 根据条件渲染两个分支之一。",
  } as Record<Locale, string>,
  bullet3: {
    en: " — Multi-way conditional rendering.",
    zh: " — 多路条件渲染。",
  } as Record<Locale, string>,
  bullet4: {
    en: " — Pattern matching within Switch cases.",
    zh: " — 在 Switch 分支中进行模式匹配。",
  } as Record<Locale, string>,
  apiSignatures: { en: "API Signatures", zh: "API 签名" } as Record<Locale, string>,
  prevFor: { en: "← For", zh: "← For" } as Record<Locale, string>,
  nextHtmlTemplate: { en: "h`` →", zh: "h`` →" } as Record<Locale, string>,
};

/**
 * Page 10 — h`` (HTML template)
 */
const htmlTemplateContent = {
  advancedNote: {
    en: "is an advanced alternative to h(). For most use cases, h() with tag helpers is simpler and more type-safe.",
    zh: " 是 h() 的进阶替代方案。在大多数情况下，使用带标签助手的 h() 更简单且类型更安全。",
  } as Record<Locale, string>,
  desc: {
    en: "Tagged template literal on the h function from rikka-dom. Creates DOM elements from HTML template strings with signal interpolation support.",
    zh: "rikka-dom 中 h 函数的标签模板字面量。从 HTML 模板字符串创建 DOM 元素，支持信号插值。",
  } as Record<Locale, string>,
  keyConcepts: { en: "Key Concepts", zh: "关键概念" } as Record<Locale, string>,
  bullet1: {
    en: " — Embed signals directly in template strings for fine-grained updates.",
    zh: " — 在模板字符串中直接嵌入信号以实现细粒度更新。",
  } as Record<Locale, string>,
  bullet2: {
    en: "Comment-based slot system for efficient DOM patching.",
    zh: "基于注释的插槽系统，实现高效的 DOM patch。",
  } as Record<Locale, string>,
  bullet3: {
    en: "Returns ",
    zh: "返回 ",
  } as Record<Locale, string>,
  bullet3End: {
    en: ".",
    zh: "。",
  } as Record<Locale, string>,
  bullet4: {
    en: "Supports nested templates and mixed content.",
    zh: "支持嵌套模板和混合内容。",
  } as Record<Locale, string>,
  bullet5: {
    en: "Signals in text content update in-place without rebuilding the entire template.",
    zh: "文本内容中的信号会原地更新，无需重建整个模板。",
  } as Record<Locale, string>,
  bullet6: {
    en: "Signals in attribute values also get reactive bindings.",
    zh: "属性值中的信号也会获得响应式绑定。",
  } as Record<Locale, string>,
  bullet7: {
    en: "Element values can be interpolated as children.",
    zh: "元素值可以作为子节点插值。",
  } as Record<Locale, string>,
  bullet8: {
    en: "Fine-grained: ",
    zh: "细粒度：",
  } as Record<Locale, string>,
  bullet8End: {
    en: " creates effect, updates only text node.",
    zh: " 创建 effect，仅更新文本节点。",
  } as Record<Locale, string>,
  bullet9: {
    en: "Coarse-grained: ",
    zh: "粗粒度：",
  } as Record<Locale, string>,
  bullet9End: {
    en: " resolves immediately.",
    zh: " 立即求值。",
  } as Record<Locale, string>,
  apiSignature: { en: "API Signature", zh: "API 签名" } as Record<Locale, string>,
  prevConditionals: { en: "← Conditionals", zh: "← 条件渲染" } as Record<Locale, string>,
  nextSignalInterpolation: {
    en: "Signal Interpolation →",
    zh: "信号插值 →",
  } as Record<Locale, string>,
};

/**
 * Page 11 — Signal Interpolation
 */
const signalInterpolationContent = {
  advancedNote: {
    en: "is an advanced topic. Understanding fine-grained vs coarse-grained updates is only needed when optimizing performance.",
    zh: " 是进阶主题。只有在需要优化性能时才需要理解细粒度与粗粒度更新的区别。",
  } as Record<Locale, string>,
  desc: {
    en: "How signals behave differently depending on how you use them in templates.",
    zh: "信号在模板中的不同使用方式会有不同的行为。",
  } as Record<Locale, string>,
  threeModes: { en: "Three Modes", zh: "三种模式" } as Record<Locale, string>,
  mode1: {
    en: " — Fine-grained: signal passed as a child. Only the text node updates. Focus is preserved.",
    zh: " — 细粒度：信号作为子节点传递。仅文本节点更新，焦点保持不变。",
  } as Record<Locale, string>,
  mode2: {
    en: " — Loses reactivity entirely. The value is read once and never updates.",
    zh: " — 完全失去响应性。值读取一次后不再更新。",
  } as Record<Locale, string>,
  mode3: {
    en: " — Coarse-grained: signal.get() inside computed creates a dependency. When the signal changes, computed re-executes and rebuilds the entire DOM subtree.",
    zh: " — 粗粒度：computed 内调用 signal.get() 创建依赖。当信号变化时，computed 重新执行并重建整个 DOM 子树。",
  } as Record<Locale, string>,
  liveComparison: { en: "Live Comparison", zh: "实时对比" } as Record<Locale, string>,
  prevHtmlTemplate: { en: "← h``", zh: "← h``" } as Record<Locale, string>,
  nextCssTemplate: { en: "css`` →", zh: "css`` →" } as Record<Locale, string>,
};

/**
 * Page 12 — defineElement
 */
const defineElementContent = {
  advancedNote: {
    en: "is an advanced feature. You can build entire apps using only h(), div(), and other tag helpers. Use defineElement when you need reusable, encapsulated components with Shadow DOM isolation.",
    zh: " 是一个进阶特性。仅使用 h()、div() 和其他标签助手就能构建整个应用。当你需要可复用、封装的组件以及 Shadow DOM 隔离时，再使用 defineElement。",
  } as Record<Locale, string>,
  desc: {
    en: "Define custom elements for reusable components with reactive attributes, events, and styles.",
    zh: "使用响应式属性、事件和样式定义可复用组件的自定义元素。",
  } as Record<Locale, string>,
  overview: { en: "Overview", zh: "概述" } as Record<Locale, string>,
  overviewDesc1: {
    en: "The ",
    zh: "",
  } as Record<Locale, string>,
  overviewDesc1Mid: {
    en: " function is an ",
    zh: " 函数是一个 ",
  } as Record<Locale, string>,
  overviewDesc1End: {
    en: " utility for creating reusable, encapsulated components. It registers a custom element with the browser by creating a class extending ",
    zh: " 工具，用于创建可复用、封装的组件。它通过创建一个继承自 ",
  } as Record<Locale, string>,
  overviewDesc1Final: {
    en: ", configuring shadow DOM, styles, attributes, and events via ",
    zh: " 的类，并通过 ",
  } as Record<Locale, string>,
  overviewDesc1FinalEnd: {
    en: ".",
    zh: " 注册自定义元素，配置 shadow DOM、样式、属性和事件。",
  } as Record<Locale, string>,
  overviewDesc2: {
    en: "Most Rikka applications work perfectly fine using only ",
    zh: "大多数 Rikka 应用仅使用 ",
  } as Record<Locale, string>,
  overviewDesc2Mid: {
    en: ", ",
    zh: "、",
  } as Record<Locale, string>,
  overviewDesc2End: {
    en: ", and signal interpolation directly. Use ",
    zh: " 和信号插值就能完美工作。当你需要在应用的不同部分复用组件，或希望通过 shadow DOM 实现样式封装时，使用 ",
  } as Record<Locale, string>,
  overviewDesc2Final: {
    en: " when you need component reuse across different parts of your app, or when you want style encapsulation via shadow DOM.",
    zh: "。",
  } as Record<Locale, string>,
  elementConfig: { en: "ElementConfig Interface", zh: "ElementConfig 接口" } as Record<Locale, string>,
  elementConfigDesc: {
    en: "The configuration object declares all features of the element:",
    zh: "配置对象声明该元素的所有特性：",
  } as Record<Locale, string>,
  renderFunction: { en: "Render Function", zh: "Render 函数" } as Record<Locale, string>,
  renderDesc1: {
    en: "The ",
    zh: "",
  } as Record<Locale, string>,
  renderDesc1Mid: {
    en: " function is mounted on the element prototype and called in ",
    zh: " 函数挂载在元素原型上，并在 ",
  } as Record<Locale, string>,
  renderDesc1End: {
    en: ". Inside render, ",
    zh: " 中调用。在 render 内，",
  } as Record<Locale, string>,
  renderDesc1Final: {
    en: " is the element instance. It must return an ",
    zh: " 即为元素实例。它必须返回一个 ",
  } as Record<Locale, string>,
  renderDesc1FinalMid: {
    en: " to append to ",
    zh: "，并附加到 ",
  } as Record<Locale, string>,
  renderDesc1FinalEnd: {
    en: ".",
    zh: "。",
  } as Record<Locale, string>,
  prevInlineStyle: { en: "← inlineStyle``", zh: "← inlineStyle``" } as Record<Locale, string>,
  nextShadow: { en: "Shadow DOM →", zh: "Shadow DOM →" } as Record<Locale, string>,
};

/**
 * Page 13 — Shadow DOM
 */
const shadowContent = {
  advancedNote: {
    en: "is part of @takanashi/rikka-elements, an advanced feature. Simple apps don't need custom elements or Shadow DOM.",
    zh: " 是 @takanashi/rikka-elements 的进阶特性之一。简单的应用不需要自定义元素或 Shadow DOM。",
  } as Record<Locale, string>,
  desc: {
    en: "Style encapsulation with Shadow DOM for custom elements.",
    zh: "为自定义元素提供基于 Shadow DOM 的样式封装。",
  } as Record<Locale, string>,
  defaultBehavior: { en: "Default Behavior", zh: "默认行为" } as Record<Locale, string>,
  defaultBehaviorDesc1: {
    en: " creates an open shadow root by default. Access it via ",
    zh: " 默认创建 open shadow root。通过 ",
  } as Record<Locale, string>,
  defaultBehaviorDesc1End: {
    en: " in the setup function.",
    zh: " 在 setup 函数中访问它。",
  } as Record<Locale, string>,
  shadowOptions: { en: "Shadow Options", zh: "Shadow 选项" } as Record<Locale, string>,
  shadowOptionsDesc1: {
    en: "Configure or disable shadow DOM with the ",
    zh: "使用 ",
  } as Record<Locale, string>,
  shadowOptionsDesc1End: {
    en: " option:",
    zh: " 选项配置或禁用 shadow DOM：",
  } as Record<Locale, string>,
  encapsulation: { en: "Encapsulation", zh: "封装" } as Record<Locale, string>,
  encapsulationDesc: {
    en: "Styles defined inside Shadow DOM do not leak out, and external styles do not penetrate in. This provides true component isolation.",
    zh: "Shadow DOM 内定义的样式不会泄漏出去，外部样式也无法渗透进来。这提供了真正的组件隔离。",
  } as Record<Locale, string>,
  prevDefineElement: { en: "← defineElement", zh: "← defineElement" } as Record<Locale, string>,
  nextAdoptStyle: { en: "adoptStyle →", zh: "adoptStyle →" } as Record<Locale, string>,
};

/**
 * Page 14 — adoptStyle
 */
const adoptStyleContent = {
  advancedNote: {
    en: "is part of @takanashi/rikka-elements, an advanced feature. Use css`` with h() for simpler styling needs.",
    zh: " 是 @takanashi/rikka-elements 的进阶特性之一。简单的样式需求请使用 css`` 与 h()。",
  } as Record<Locale, string>,
  desc: {
    en: "Inject CSS stylesheets into the ShadowRoot.",
    zh: "向 ShadowRoot 注入 CSS 样式表。",
  } as Record<Locale, string>,
  overview: { en: "Overview", zh: "概述" } as Record<Locale, string>,
  overviewDesc1: {
    en: "The ",
    zh: "",
  } as Record<Locale, string>,
  overviewDesc1End: {
    en: " option accepts a ",
    zh: " 选项接受一个 ",
  } as Record<Locale, string>,
  overviewDesc1Mid: {
    en: " or an array of them. These are injected into the shadow root via the ",
    zh: " 或其数组。这些会通过 ",
  } as Record<Locale, string>,
  overviewDesc1MidEnd: {
    en: " API when the element connects.",
    zh: " API 注入到 shadow root 中。",
  } as Record<Locale, string>,
  cssTagTemplate: { en: "css Tag Template", zh: "css 标签模板" } as Record<Locale, string>,
  cssTagTemplateDesc1: {
    en: "Use the ",
    zh: "使用 ",
  } as Record<Locale, string>,
  cssTagTemplateDesc1End: {
    en: " tagged template literal to create ",
    zh: " 标签模板字面量创建 ",
  } as Record<Locale, string>,
  cssTagTemplateDesc1Final: {
    en: " objects:",
    zh: " 对象：",
  } as Record<Locale, string>,
  multipleStylesheets: {
    en: "Multiple Stylesheets",
    zh: "多个样式表",
  } as Record<Locale, string>,
  multipleStylesheetsDesc: {
    en: "Pass an array to compose styles from multiple sources:",
    zh: "传入数组以组合来自多个源的样式：",
  } as Record<Locale, string>,
  adoptedStyleSheetsApi: {
    en: "adoptedStyleSheets API",
    zh: "adoptedStyleSheets API",
  } as Record<Locale, string>,
  adoptedStyleSheetsApiDesc1: {
    en: "Under the hood, ",
    zh: "在底层，",
  } as Record<Locale, string>,
  adoptedStyleSheetsApiDesc1End: {
    en: " merges styles into ",
    zh: " 将样式合并到 ",
  } as Record<Locale, string>,
  adoptedStyleSheetsApiDesc1Final: {
    en: " for performant, deduplicated style application.",
    zh: " 中，以实现高效、去重的样式应用。",
  } as Record<Locale, string>,
  prevShadow: { en: "← Shadow DOM", zh: "← Shadow DOM" } as Record<Locale, string>,
  nextAttribute: { en: "attribute →", zh: "attribute →" } as Record<Locale, string>,
};

/**
 * Page 15 — attribute
 */
const attributeContent = {
  advancedNote: {
    en: "is part of @takanashi/rikka-elements, an advanced feature. For simple components, use signal() to manage state directly.",
    zh: " 是 @takanashi/rikka-elements 的进阶特性之一。对于简单组件，直接使用 signal() 管理状态。",
  } as Record<Locale, string>,
  desc: {
    en: "Reactive properties synced with HTML attributes.",
    zh: "与 HTML 属性同步的响应式属性。",
  } as Record<Locale, string>,
  attributeDeclaration: {
    en: "Attribute Declaration",
    zh: "属性声明",
  } as Record<Locale, string>,
  attributeDeclarationDesc: {
    en: "Declare attributes in the ",
    zh: "在 ",
  } as Record<Locale, string>,
  attributeDeclarationDescEnd: {
    en: " record. Each key becomes a property on the element instance.",
    zh: " 记录中声明属性。每个键会成为元素实例上的一个属性。",
  } as Record<Locale, string>,
  valueAndSignal: {
    en: "Value and Signal Access",
    zh: "值与信号访问",
  } as Record<Locale, string>,
  valueAndSignalDesc1: {
    en: "Access the raw value via ",
    zh: "通过 ",
  } as Record<Locale, string>,
  valueAndSignalDesc1Mid: {
    en: " and the backing Signal via ",
    zh: " 访问原始值，通过 ",
  } as Record<Locale, string>,
  valueAndSignalDesc1End: {
    en: ":",
    zh: " 访问底层信号：",
  } as Record<Locale, string>,
  builtInTransforms: {
    en: "Built-in Transforms",
    zh: "内置转换",
  } as Record<Locale, string>,
  builtInTransformsDesc: {
    en: "Common transforms for type conversion:",
    zh: "用于类型转换的常用转换：",
  } as Record<Locale, string>,
  customTransform: {
    en: "Custom Transform Functions",
    zh: "自定义转换函数",
  } as Record<Locale, string>,
  customTransformDesc: {
    en: "Pass a function to implement custom parsing logic:",
    zh: "传入函数以实现自定义解析逻辑：",
  } as Record<Locale, string>,
  prevAdoptStyle: { en: "← adoptStyle", zh: "← adoptStyle" } as Record<Locale, string>,
  nextEvent: { en: "event →", zh: "event →" } as Record<Locale, string>,
};

/**
 * Page 16 — event
 */
const eventContent = {
  advancedNote: {
    en: "is part of @takanashi/rikka-elements, an advanced feature. For simple event handling, use DOM event handler properties with h().",
    zh: " 是 @takanashi/rikka-elements 的进阶特性之一。简单的事件处理请使用 h() 的 DOM 事件处理属性。",
  } as Record<Locale, string>,
  desc: {
    en: "Custom events with type-safe dispatching and listening.",
    zh: "具有类型安全派发与监听的自定义事件。",
  } as Record<Locale, string>,
  eventDeclaration: { en: "Event Declaration", zh: "事件声明" } as Record<Locale, string>,
  eventDeclarationDesc1: {
    en: "Declare events in the ",
    zh: "在 ",
  } as Record<Locale, string>,
  eventDeclarationDesc1End: {
    en: " record. The value is the detail type constructor or ",
    zh: " 记录中声明事件。值是 detail 类型的构造函数，或 ",
  } as Record<Locale, string>,
  eventDeclarationDesc1Final: {
    en: " for events with no detail.",
    zh: " 表示无 detail。",
  } as Record<Locale, string>,
  generatedMethods: { en: "Generated Methods", zh: "生成的方法" } as Record<Locale, string>,
  generatedMethodsDesc: {
    en: "A dispatch method is generated for each event:",
    zh: "每个事件都会生成一个 dispatch 方法：",
  } as Record<Locale, string>,
  handlerProperty: { en: "Handler Property", zh: "Handler 属性" } as Record<Locale, string>,
  handlerPropertyDesc1: {
    en: "An ",
    zh: "同时会生成一个 ",
  } as Record<Locale, string>,
  handlerPropertyDesc1End: {
    en: " property is also generated as a handler that can be set directly:",
    zh: " 属性作为可直接设置的处理器：",
  } as Record<Locale, string>,
  eventTypeHelper: { en: "event<T>() Type Helper", zh: "event<T>() 类型助手" } as Record<Locale, string>,
  eventTypeHelperDesc1: {
    en: "Use the ",
    zh: "使用 ",
  } as Record<Locale, string>,
  eventTypeHelperDesc1End: {
    en: " helper for custom detail types:",
    zh: " 助手用于自定义 detail 类型：",
  } as Record<Locale, string>,
  prevAttribute: { en: "← attribute", zh: "← attribute" } as Record<Locale, string>,
  nextAttachTemplate: { en: "attachTemplate →", zh: "attachTemplate →" } as Record<Locale, string>,
};

/**
 * Page 17 — attachTemplate
 */
const attachTemplateContent = {
  advancedNote: {
    en: "is part of @takanashi/rikka-elements, an advanced feature. For most use cases, h() and tag helpers are simpler and more flexible.",
    zh: " 是 @takanashi/rikka-elements 的进阶特性之一。在大多数情况下，h() 和标签助手更简单也更灵活。",
  } as Record<Locale, string>,
  desc: {
    en: "Declarative templates with {{slot}} bindings.",
    zh: "带有 {{slot}} 绑定的声明式模板。",
  } as Record<Locale, string>,
  templateOption: { en: "Template Option", zh: "Template 选项" } as Record<Locale, string>,
  templateOptionDesc1: {
    en: "Use the ",
    zh: "使用 ",
  } as Record<Locale, string>,
  templateOptionDesc1End: {
    en: " option to provide an HTML template. ",
    zh: " 选项提供一个 HTML 模板。",
  } as Record<Locale, string>,
  templateOptionDesc1Final: {
    en: " slots auto-bind to instance properties.",
    zh: " 插槽会自动绑定到实例属性。",
  } as Record<Locale, string>,
  bindingTypes: { en: "Binding Types", zh: "绑定类型" } as Record<Locale, string>,
  bindingTypesDesc: {
    en: "Three types of bindings are supported:",
    zh: "支持三种绑定类型：",
  } as Record<Locale, string>,
  signalSupport: { en: "Signal Support", zh: "Signal 支持" } as Record<Locale, string>,
  signalSupportDesc: {
    en: "Properties can be Signals for reactive updates. When a Signal changes, the bound text node updates automatically without re-rendering the entire template.",
    zh: "属性可以是 Signal 以实现响应式更新。当 Signal 变化时，绑定的文本节点会自动更新，无需重新渲染整个模板。",
  } as Record<Locale, string>,
  prevEvent: { en: "← event", zh: "← event" } as Record<Locale, string>,
  nextApiReference: { en: "API Reference →", zh: "API 参考 →" } as Record<Locale, string>,
};

/**
 * Page 18 — css`` (CSS template)
 */
const cssTemplateContent = {
  advancedNote: {
    en: "is mainly for Shadow DOM styling via adoptedStyleSheets. For non-Shadow-DOM code, plain <style> blocks or external CSS are simpler.",
    zh: " 主要用于通过 adoptedStyleSheets 为 Shadow DOM 提供样式。对于非 Shadow DOM 的代码，普通的 <style> 块或外部 CSS 更简单。",
  } as Record<Locale, string>,
  desc1: {
    en: "Tag template for creating CSSStyleSheet objects. Exported from ",
    zh: "用于创建 CSSStyleSheet 对象的标签模板。从 ",
  } as Record<Locale, string>,
  desc1End: {
    en: ".",
    zh: " 导出。",
  } as Record<Locale, string>,
  basicUsage: { en: "Basic Usage", zh: "基本用法" } as Record<Locale, string>,
  basicUsageDesc1: {
    en: "The ",
    zh: "",
  } as Record<Locale, string>,
  basicUsageDesc1End: {
    en: " tagged template creates a ",
    zh: " 标签模板从一个模板字面量创建一个 ",
  } as Record<Locale, string>,
  basicUsageDesc1Final: {
    en: " object from a template literal:",
    zh: " 对象：",
  } as Record<Locale, string>,
  composition: { en: "Composition", zh: "组合" } as Record<Locale, string>,
  compositionDesc1: {
    en: "Interpolate existing stylesheets with ",
    zh: "使用 ",
  } as Record<Locale, string>,
  compositionDesc1End: {
    en: " to compose styles:",
    zh: " 插值已有样式表以组合样式：",
  } as Record<Locale, string>,
  returnsCssStyleSheet: {
    en: "Returns CSSStyleSheet",
    zh: "返回 CSSStyleSheet",
  } as Record<Locale, string>,
  returnsCssStyleSheetDesc1: {
    en: "The return value is a native ",
    zh: "返回值是原生的 ",
  } as Record<Locale, string>,
  returnsCssStyleSheetDesc1End: {
    en: " that can be used with ",
    zh: "，可与 ",
  } as Record<Locale, string>,
  returnsCssStyleSheetDesc1Final: {
    en: " or the ",
    zh: " 或 ",
  } as Record<Locale, string>,
  returnsCssStyleSheetDesc1FinalEnd: {
    en: " option directly.",
    zh: " 选项直接配合使用。",
  } as Record<Locale, string>,
  prevSignalInterpolation: {
    en: "← Signal Interpolation",
    zh: "← 信号插值",
  } as Record<Locale, string>,
  nextInlineStyle: { en: "inlineStyle`` →", zh: "inlineStyle`` →" } as Record<Locale, string>,
};

/**
 * Page 21 — API Reference
 */
const apiReferenceContent = {
  title: { en: "API Reference", zh: "API 参考" } as Record<Locale, string>,
  desc: {
    en: "Complete API reference for all Rikka packages.",
    zh: "所有 Rikka 包的完整 API 参考。",
  } as Record<Locale, string>,
  signalPackage: { en: "@takanashi/rikka-signal", zh: "@takanashi/rikka-signal" } as Record<Locale, string>,
  signalPackageDesc: {
    en: "Reactive primitives built on the TC39 Signals proposal.",
    zh: "基于 TC39 Signals 提案构建的响应式原语。",
  } as Record<Locale, string>,
  signalPackageReExport1: {
    en: "Re-exports ",
    zh: "从 ",
  } as Record<Locale, string>,
  signalPackageReExport2: {
    en: " from ",
    zh: " 重新导出 ",
  } as Record<Locale, string>,
  signalPackageReExport3: {
    en: ".",
    zh: "。",
  } as Record<Locale, string>,
  signalFn: { en: "signal<T>(initialValue)", zh: "signal<T>(initialValue)" } as Record<Locale, string>,
  signalFnDesc: {
    en: "Creates a reactive state container.",
    zh: "创建一个响应式状态容器。",
  } as Record<Locale, string>,
  computedFn: { en: "computed<T>(fn)", zh: "computed<T>(fn)" } as Record<Locale, string>,
  computedFnDesc: {
    en: "Creates a derived signal that auto-tracks dependencies. Lazy and cached.",
    zh: "创建一个自动追踪依赖的派生信号。惰性且带缓存。",
  } as Record<Locale, string>,
  effectFn: { en: "effect(fn)", zh: "effect(fn)" } as Record<Locale, string>,
  effectFnDesc: {
    en: "Runs a function reactively. Re-runs when tracked signals change. Returns a dispose function.",
    zh: "以响应式方式运行一个函数。当被追踪的信号变化时重新运行。返回一个 dispose 函数。",
  } as Record<Locale, string>,
  signalNamespace: { en: "Signal (re-export)", zh: "Signal（重新导出）" } as Record<Locale, string>,
  signalNamespaceDesc: {
    en: "The full Signal namespace from signal-polyfill, including:",
    zh: "来自 signal-polyfill 的完整 Signal 命名空间，包括：",
  } as Record<Locale, string>,
  domPackage: { en: "@takanashi/rikka-dom", zh: "@takanashi/rikka-dom" } as Record<Locale, string>,
  domPackageDesc: {
    en: "DOM creation utilities: h(), tag helpers, control flow, templates.",
    zh: "DOM 创建工具：h()、标签助手、控制流、模板。",
  } as Record<Locale, string>,
  hFn: { en: "h(tag, attrs?, ...children)", zh: "h(tag, attrs?, ...children)" } as Record<Locale, string>,
  hFnDesc: {
    en: "Creates a DOM element directly.",
    zh: "直接创建一个 DOM 元素。",
  } as Record<Locale, string>,
  hTemplateFn: { en: "h`...` (tagged template)", zh: "h`...`（标签模板）" } as Record<Locale, string>,
  hTemplateFnAdvanced: {
    en: "is an alternative to h() / tag helpers. Reach for it when you have static HTML-like structures with signal interpolation.",
    zh: " 是 h() / 标签助手的替代方案。当你拥有带信号插值的、类 HTML 的静态结构时，可以使用它。",
  } as Record<Locale, string>,
  hTemplateFnDesc1: {
    en: "HTML template literal returning Element[]. Use ",
    zh: "返回 Element[] 的 HTML 模板字面量。使用 ",
  } as Record<Locale, string>,
  hTemplateFnDesc1End: {
    en: " for single element, or ",
    zh: " 获取单个元素，或使用 ",
  } as Record<Locale, string>,
  hTemplateFnDesc1Final: {
    en: " for template elements.",
    zh: " 获取 template 元素。",
  } as Record<Locale, string>,
  tagHelpersHeading: { en: "Tag Helpers", zh: "标签助手" } as Record<Locale, string>,
  tagHelpersDesc1: {
    en: "40 pre-bound helpers with the same signature as ",
    zh: "40 个预绑定的助手，签名与 ",
  } as Record<Locale, string>,
  tagHelpersDesc1End: {
    en: ":",
    zh: " 相同：",
  } as Record<Locale, string>,
  forFn: { en: "For(source, render, keyFn?)", zh: "For(source, render, keyFn?)" } as Record<Locale, string>,
  forFnDesc: {
    en: "Reactive list rendering. Only adds/removes changed items when keyFn is provided.",
    zh: "响应式列表渲染。当提供 keyFn 时，仅添加/移除变化的项。",
  } as Record<Locale, string>,
  showFn: { en: "Show(condition, render)", zh: "Show(condition, render)" } as Record<Locale, string>,
  showFnDesc: {
    en: "Conditionally show/hide an element.",
    zh: "根据条件显示/隐藏一个元素。",
  } as Record<Locale, string>,
  whenFn: { en: "When(condition, trueRender, falseRender)", zh: "When(condition, trueRender, falseRender)" } as Record<Locale, string>,
  whenFnDesc: {
    en: "Conditional branching — renders one of two branches.",
    zh: "条件分支 —— 渲染两个分支之一。",
  } as Record<Locale, string>,
  switchFn: { en: "Switch(value, ...cases, fallback?)", zh: "Switch(value, ...cases, fallback?)" } as Record<Locale, string>,
  switchFnAdvanced: {
    en: "is for multi-way branching (3+ branches). For single/binary conditions, Show() / When() is simpler.",
    zh: " 用于多路分支（3+ 个分支）。对于单/二分支条件，Show() / When() 更简单。",
  } as Record<Locale, string>,
  switchFnDesc: {
    en: "Multi-way conditional branching.",
    zh: "多路条件分支。",
  } as Record<Locale, string>,
  matchFn: { en: "Match(match, render)", zh: "Match(match, render)" } as Record<Locale, string>,
  matchFnAdvanced: {
    en: "is the companion to Switch() for defining each branch.",
    zh: " 是 Switch() 的搭档，用于定义每个分支。",
  } as Record<Locale, string>,
  matchFnDesc: {
    en: "Defines a case for Switch.",
    zh: "为 Switch 定义一个 case。",
  } as Record<Locale, string>,
  cssFn: { en: "css`...`", zh: "css`...`" } as Record<Locale, string>,
  cssFnAdvanced: {
    en: "is mainly for Shadow DOM styling via adoptedStyleSheets. For non-Shadow-DOM code, plain <style> blocks are simpler.",
    zh: " 主要用于通过 adoptedStyleSheets 为 Shadow DOM 提供样式。对于非 Shadow DOM 的代码，普通的 <style> 块更简单。",
  } as Record<Locale, string>,
  cssFnDesc: {
    en: "Creates a CSSStyleSheet from tagged template literal.",
    zh: "从标签模板字面量创建一个 CSSStyleSheet。",
  } as Record<Locale, string>,
  inlineStyleFn: { en: "inlineStyle`...`", zh: "inlineStyle`...`" } as Record<Locale, string>,
  inlineStyleFnAdvanced: {
    en: "is a niche helper that returns a camelCase style object. Most code uses style strings or external CSS.",
    zh: " 是一个小众助手，返回一个 camelCase 风格对象。大多数代码使用 style 字符串或外部 CSS。",
  } as Record<Locale, string>,
  inlineStyleFnDesc: {
    en: "Parses CSS into a style record object for inline styles.",
    zh: "将 CSS 解析为内联样式的 style 记录对象。",
  } as Record<Locale, string>,
  elementsPackage: { en: "@takanashi/rikka-elements", zh: "@takanashi/rikka-elements" } as Record<Locale, string>,
  elementsPackageAdvanced: {
    en: "is an advanced feature. You can build complete apps using only h() and tag helpers — reach for defineElement only when you need reusable, encapsulated components with reactive attributes, custom events, Shadow DOM, and declarative lifecycle.",
    zh: " 是一个进阶特性。仅使用 h() 和标签助手就能构建完整的应用 —— 只有当你需要带响应式属性、自定义事件、Shadow DOM 和声明式生命周期的可复用、封装组件时，才使用 defineElement。",
  } as Record<Locale, string>,
  elementsPackageDesc: {
    en: "Declarative custom elements with reactive attributes, events, shadow DOM, styles, and render function.",
    zh: "声明式自定义元素，具有响应式属性、事件、shadow DOM、样式和 render 函数。",
  } as Record<Locale, string>,
  defineElementFn: { en: "defineElement(tagName, config?)", zh: "defineElement(tagName, config?)" } as Record<Locale, string>,
  defineElementFnDesc: {
    en: "Defines a Web Component with typed attributes, events, shadow DOM, and render function.",
    zh: "定义一个带类型化属性、事件、shadow DOM 和 render 函数的 Web Component。",
  } as Record<Locale, string>,
  eventTypeHelper: { en: "event<T>()", zh: "event<T>()" } as Record<Locale, string>,
  eventTypeHelperDesc: {
    en: "Type marker for events that carry a detail payload via a transform function.",
    zh: "用于通过 transform 函数携带 detail 负载的事件类型标记。",
  } as Record<Locale, string>,
  elementConfig: { en: "ElementConfig", zh: "ElementConfig" } as Record<Locale, string>,
  attributeSpec: { en: "AttributeSpec<T>", zh: "AttributeSpec<T>" } as Record<Locale, string>,
  eventSpec: { en: "EventSpec", zh: "EventSpec" } as Record<Locale, string>,
  generatedMembers: {
    en: "Generated Instance Members",
    zh: "生成的实例成员",
  } as Record<Locale, string>,
  generatedMembersDesc1: {
    en: "For each attribute ",
    zh: "对于每个类型为 ",
  } as Record<Locale, string>,
  generatedMembersDesc1Mid: {
    en: " of type ",
    zh: " 的属性 ",
  } as Record<Locale, string>,
  generatedMembersDesc1End: {
    en: ":",
    zh: "：",
  } as Record<Locale, string>,
  generatedMembersEventDesc1: {
    en: "For each event ",
    zh: "对于每个 detail 为 ",
  } as Record<Locale, string>,
  generatedMembersEventDesc1Mid: {
    en: " with detail ",
    zh: " 的事件 ",
  } as Record<Locale, string>,
  generatedMembersEventDesc1End: {
    en: ":",
    zh: "：",
  } as Record<Locale, string>,
  additionalMembers: {
    en: "Additional instance members:",
    zh: "其他实例成员：",
  } as Record<Locale, string>,
  templateBindingSyntax: {
    en: "Template Binding Syntax",
    zh: "模板绑定语法",
  } as Record<Locale, string>,
  templateBindingSyntaxDesc1: {
    en: "When ",
    zh: "当提供 ",
  } as Record<Locale, string>,
  templateBindingSyntaxDesc1End: {
    en: " is provided:",
    zh: " 时：",
  } as Record<Locale, string>,
  typeExports: { en: "Type Exports", zh: "类型导出" } as Record<Locale, string>,
  // Table headers / cells
  thMember: { en: "Member", zh: "成员" } as Record<Locale, string>,
  thType: { en: "Type", zh: "类型" } as Record<Locale, string>,
  thDescription: { en: "Description", zh: "说明" } as Record<Locale, string>,
  thCondition: { en: "Condition", zh: "条件" } as Record<Locale, string>,
  thSyntax: { en: "Syntax", zh: "语法" } as Record<Locale, string>,
  thBindingType: { en: "Binding Type", zh: "绑定类型" } as Record<Locale, string>,
  thBehavior: { en: "Behavior", zh: "行为" } as Record<Locale, string>,
  thPackage: { en: "Package", zh: "包" } as Record<Locale, string>,
  tdGetSetValue: {
    en: "Get/set raw value. Triggers attributeChangedCallback.",
    zh: "获取/设置原始值。触发 attributeChangedCallback。",
  } as Record<Locale, string>,
  tdUnderlyingSignal: {
    en: "Underlying signal. Use for reactive bindings.",
    zh: "底层信号。用于响应式绑定。",
  } as Record<Locale, string>,
  tdDispatchCustomEvent: {
    en: "Dispatch CustomEvent with optional detail.",
    zh: "派发带可选 detail 的 CustomEvent。",
  } as Record<Locale, string>,
  tdGetSetHandler: {
    en: "Get/set event handler. Auto-wrapped to prevent infinite loops.",
    zh: "获取/设置事件处理器。自动包装以防止无限循环。",
  } as Record<Locale, string>,
  tdShadowRoot: { en: "ShadowRoot", zh: "ShadowRoot" } as Record<Locale, string>,
  tdShadowRootCondition: {
    en: "When shadow !== false",
    zh: "当 shadow !== false 时",
  } as Record<Locale, string>,
  tdFromMethodsConfig: {
    en: "From methods config",
    zh: "来自 methods 配置",
  } as Record<Locale, string>,
  tdWhenMethodsProvided: {
    en: "When methods is provided",
    zh: "当提供 methods 时",
  } as Record<Locale, string>,
  tdText: { en: "Text", zh: "文本" } as Record<Locale, string>,
  tdTextContent: {
    en: "textContent, prefers $name signal",
    zh: "textContent，优先使用 $name 信号",
  } as Record<Locale, string>,
  tdAttribute: { en: "Attribute", zh: "属性" } as Record<Locale, string>,
  tdSetAttribute: {
    en: "setAttribute, reactive if signal",
    zh: "setAttribute，若为 signal 则响应式",
  } as Record<Locale, string>,
  tdEventDispatch: {
    en: "Event dispatch",
    zh: "事件派发",
  } as Record<Locale, string>,
  tdEventDispatchBehavior: {
    en: "DOM event → transform(el.dispatchAction(detail))",
    zh: "DOM 事件 → transform(el.dispatchAction(detail))",
  } as Record<Locale, string>,
  // Type table descriptions
  typeSignalState: { en: "Writable reactive state container", zh: "可写的响应式状态容器" } as Record<Locale, string>,
  typeSignalComputed: { en: "Read-only derived signal with caching", zh: "带缓存的只读派生信号" } as Record<Locale, string>,
  typeChild: {
    en: "string | number | Node | Signal | ReactiveRange | null | false",
    zh: "string | number | Node | Signal | ReactiveRange | null | false",
  } as Record<Locale, string>,
  typeAttributes: { en: "Typed attribute map for element K", zh: "元素 K 的类型化属性映射" } as Record<Locale, string>,
  typeReactiveRange: {
    en: "For/Show/When/Switch output — managed node range",
    zh: "For/Show/When/Switch 的输出 —— 托管的节点范围",
  } as Record<Locale, string>,
  typeCase: { en: "Single case definition for Switch", zh: "Switch 的单个 case 定义" } as Record<Locale, string>,
  typeAttributeSpec: { en: "Attribute parser/serializer spec", zh: "属性的解析/序列化 spec" } as Record<Locale, string>,
  typeEventSpec: {
    en: "(DOM Event → detail) transform | undefined",
    zh: "(DOM Event → detail) 转换函数 | undefined",
  } as Record<Locale, string>,
  typeElementConfig: { en: "Full configuration for defineElement", zh: "defineElement 的完整配置" } as Record<Locale, string>,
  typeElementInstance: {
    en: "HTMLElement & props & signals & events & shadow & methods",
    zh: "HTMLElement & props & signals & events & shadow & methods",
  } as Record<Locale, string>,
  typeElementConstructor: {
    en: "Typed constructor + observedAttributes",
    zh: "类型化的构造函数 + observedAttributes",
  } as Record<Locale, string>,
};

/**
 * Page 23 — inlineStyle``
 */
const inlineStyleContent = {
  advancedNote: {
    en: "is an advanced feature. For most styling needs, css`` or external stylesheets are preferred.",
    zh: " 是一个进阶特性。对于大多数样式需求，推荐使用 css`` 或外部样式表。",
  } as Record<Locale, string>,
  desc1: {
    en: "Tag template for creating inline style objects. Exported from ",
    zh: "用于创建内联 style 对象的标签模板。从 ",
  } as Record<Locale, string>,
  desc1End: {
    en: ".",
    zh: " 导出。",
  } as Record<Locale, string>,
  basicUsage: { en: "Basic Usage", zh: "基本用法" } as Record<Locale, string>,
  basicUsageDesc1: {
    en: "The ",
    zh: "",
  } as Record<Locale, string>,
  basicUsageDesc1End: {
    en: " tagged template creates a JavaScript style object from CSS-like syntax:",
    zh: " 标签模板从类 CSS 语法创建一个 JavaScript style 对象：",
  } as Record<Locale, string>,
  cssToCamelCase: { en: "CSS to camelCase", zh: "CSS 转 camelCase" } as Record<Locale, string>,
  cssToCamelCaseDesc: {
    en: "CSS property names are automatically converted to camelCase for JavaScript compatibility:",
    zh: "CSS 属性名会自动转换为 camelCase 以兼容 JavaScript：",
  } as Record<Locale, string>,
  vsCss: { en: "vs css``", zh: "vs css``" } as Record<Locale, string>,
  vsCssDesc1: {
    en: " returns a ",
    zh: " 返回一个 ",
  } as Record<Locale, string>,
  vsCssDesc1End: {
    en: " for ",
    zh: "，用于 ",
  } as Record<Locale, string>,
  vsCssDesc1Final: {
    en: " or ",
    zh: " 或 ",
  } as Record<Locale, string>,
  vsCssDesc2: {
    en: " returns a plain object for the ",
    zh: " 返回一个普通对象，用于元素的 ",
  } as Record<Locale, string>,
  vsCssDesc2End: {
    en: " attribute of individual elements.",
    zh: " 属性。",
  } as Record<Locale, string>,
  interpolation: { en: "Interpolation", zh: "插值" } as Record<Locale, string>,
  interpolationDesc: {
    en: "String and number values can be interpolated:",
    zh: "可以插值字符串和数值：",
  } as Record<Locale, string>,
  prevCssTemplate: { en: "← css``", zh: "← css``" } as Record<Locale, string>,
  nextDefineElement: { en: "defineElement →", zh: "defineElement →" } as Record<Locale, string>,
};

export const docContent = {
  sidebar: sidebarContent,
  ui: docUiContent,
  gettingStarted: gettingStartedContent,
  signal: signalContent,
  computed: computedContent,
  effect: effectContent,
  h: hContent,
  tagHelpers: tagHelpersContent,
  for: forContent,
  conditionals: conditionalsContent,
  htmlTemplate: htmlTemplateContent,
  signalInterpolation: signalInterpolationContent,
  defineElement: defineElementContent,
  shadow: shadowContent,
  adoptStyle: adoptStyleContent,
  attribute: attributeContent,
  event: eventContent,
  attachTemplate: attachTemplateContent,
  cssTemplate: cssTemplateContent,
  apiReference: apiReferenceContent,
  inlineStyle: inlineStyleContent,
};
