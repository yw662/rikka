import type { Locale } from "./i18n";

export const homeContent = {
  // Hero
  heroBadgeTC39: { en: "AI Coding First", zh: "AI Coding First" } as Record<Locale, string>,
  heroBadgeZeroVDOM: { en: "TC39 Signals", zh: "TC39 Signals" } as Record<Locale, string>,
  heroBadgeZeroRuntime: { en: "Zero VDOM", zh: "零虚拟DOM" } as Record<Locale, string>,
  heroTagline: { en: "Native Reactivity for the Web", zh: "为 Web 而生的原生响应式" } as Record<Locale, string>,
  heroDesc: {
    en: "Function-based defineElement, no decorators, full TypeScript inference. The first frontend library to ship llms.txt + Agent Skills as part of the project structure.",
    zh: "函数式 defineElement，无需装饰器，完整 TypeScript 推断。首个将 llms.txt + Agent Skills 内置进项目结构的前端库。",
  } as Record<Locale, string>,
  heroCtaGetStarted: { en: "Get Started →", zh: "开始使用 →" } as Record<Locale, string>,
  heroCtaViewExamples: { en: "View Examples", zh: "查看示例" } as Record<Locale, string>,
  heroStatCdn: { en: "CDN bundle (gzip)", zh: "CDN 包 (gzip)" } as Record<Locale, string>,
  heroStatVDOM: { en: "Virtual DOM overhead", zh: "虚拟DOM 开销" } as Record<Locale, string>,
  heroStatStandards: { en: "Standards based", zh: "基于标准" } as Record<Locale, string>,
  heroStatTypeScript: { en: "TypeScript", zh: "TypeScript" } as Record<Locale, string>,

  // AI section
  aiEyebrow: { en: "For AI Agents", zh: "面向 AI 智能体" } as Record<Locale, string>,
  aiTitle: { en: "Built for the AI coding era", zh: "为 AI 编程时代而生" } as Record<Locale, string>,
  aiDesc: {
    en: "Rikka ships llms.txt + Agent Skills + AGENTS.md as part of the project structure. Tested in Cursor and Claude Code — agents write correct Rikka code on the first try.",
    zh: "Rikka 把 llms.txt + Agent Skills + AGENTS.md 内置进项目结构。在 Cursor 和 Claude Code 中实测通过——AI 智能体一次写出正确的 Rikka 代码。",
  } as Record<Locale, string>,
  aiCtaSkills: { en: "Read the skills →", zh: "阅读 Skills →" } as Record<Locale, string>,
  aiCtaPlayground: { en: "Try the playground →", zh: "试用 Playground →" } as Record<Locale, string>,

  // Features section
  featuresEyebrow: { en: "Why Rikka", zh: "为什么选择 Rikka" } as Record<Locale, string>,
  featuresTitle: { en: "Built for the modern web", zh: "为现代 Web 而构建" } as Record<Locale, string>,
  featuresSubtitle: {
    en: "Simple primitives, predictable mental model, and surgical updates — no framework tax.",
    zh: "简单的原语、可预测的心智模型、精准更新——零框架税。",
  } as Record<Locale, string>,
  featureFineGrainedTitle: { en: "TC39 Signals", zh: "TC39 Signals" } as Record<Locale, string>,
  featureFineGrainedDesc: {
    en: "Built on the standard proposal for fine-grained reactivity. When browsers ship it, Rikka drops the polyfill without changing your code.",
    zh: "基于细粒度响应式的标准提案。浏览器原生支持时，Rikka 可直接去掉垫片，无需改动用户代码。",
  } as Record<Locale, string>,
  featureLLMTitle: { en: "AI Coding First", zh: "AI Coding First" } as Record<Locale, string>,
  featureLLMDesc: {
    en: "The first frontend library to ship llms.txt + 14 Agent Skills + AGENTS.md as part of the project structure. Agents write correct Rikka code on the first try.",
    zh: "首个将 llms.txt + 14 个 Agent Skills + AGENTS.md 内置到项目结构的前端库。AI 智能体一次写出正确的 Rikka 代码。",
  } as Record<Locale, string>,
  featureZeroRuntimeTitle: { en: "Function-Based API", zh: "函数式 API" } as Record<Locale, string>,
  featureZeroRuntimeDesc: {
    en: "defineElement(\"tag\", { ... }) is a function, not a class. No @customElement decorator, no global type augmentation, no class fields.",
    zh: "defineElement(\"tag\", { ... }) 是函数，不是 class。无需 @customElement 装饰器，无需全局类型扩展，无需 class 字段。",
  } as Record<Locale, string>,
  featureTemplateTitle: { en: "Template System", zh: "模板系统" } as Record<Locale, string>,
  featureTemplateDescAnd: { en: " and ", zh: " 和 " } as Record<Locale, string>,
  featureTemplateDescRest: {
    en: " tag templates with slots. Declarative, reactive, and type-safe styling.",
    zh: " 标签模板，支持插槽。声明式、响应式、类型安全的样式。",
  } as Record<Locale, string>,
  featureTypeSafeTitle: { en: "Full TS Inference", zh: "完整 TS 推断" } as Record<Locale, string>,
  featureTypeSafeDesc: {
    en: "Attributes, signals, and DOM helpers all infer types. No any, no manual casts, no JSDoc gymnastics.",
    zh: "属性、信号、DOM 助手全部类型推断。无需 any，无需手动断言，无需 JSDoc 取巧。",
  } as Record<Locale, string>,
  featureWebStandardsTitle: { en: "Web Standards", zh: "Web 标准" } as Record<Locale, string>,
  featureWebStandardsDesc: {
    en: "Custom Elements, Shadow DOM, CSS\\`\\`, h\\`\\`. No virtual DOM, no framework runtime, no proprietary abstractions.",
    zh: "Custom Elements、Shadow DOM、CSS\\`\\`、h\\`\\`。无虚拟DOM，无框架运行时，无私有抽象。",
  } as Record<Locale, string>,

  // Demo section
  demoEyebrow: { en: "Try It Live", zh: "在线试用" } as Record<Locale, string>,
  demoTitle: { en: "Edit code. See results instantly.", zh: "编辑代码，即时查看结果。" } as Record<Locale, string>,
  demoSubtitle: {
    en: "A real, working playground — no compilation, no build step. Just type and run.",
    zh: "一个真实可用的演练场——无需编译，无需构建。输入即运行。",
  } as Record<Locale, string>,

  // Advantages section
  advantagesEyebrow: { en: "Comparison", zh: "对比" } as Record<Locale, string>,
  advantagesTitle: { en: "Why Choose Rikka Over React?", zh: "为什么选择 Rikka 而不是 React？" } as Record<Locale, string>,
  advantagesSubtitle: {
    en: "Same power, fewer rules, smaller bundles, and a much friendlier mental model.",
    zh: "同样的能力，更少的规则，更小的包体积，更友好的心智模型。",
  } as Record<Locale, string>,
  advantageNoHookRulesTitle: { en: "No Hook Rules", zh: "无 Hook 规则" } as Record<Locale, string>,
  advantageNoHookRulesDesc: {
    en: "Signals work anywhere — inside loops, conditionals, callbacks, or even outside components. No more hook ordering restrictions.",
    zh: "信号可以在任何地方工作——循环内、条件中、回调里，甚至组件外部。不再有 Hook 顺序限制。",
  } as Record<Locale, string>,
  advantageNoBuildStepTitle: { en: "No Build Step", zh: "无需构建步骤" } as Record<Locale, string>,
  advantageNoBuildStepDesc: {
    en: "h() function calls work directly in the browser. No JSX compiler, no webpack config, no transpilation needed.",
    zh: "h() 函数调用直接在浏览器中运行。无需 JSX 编译器，无需 webpack 配置，无需转译。",
  } as Record<Locale, string>,
  advantageSmallerBundleTitle: { en: "Smaller Bundle", zh: "更小的包体积" } as Record<Locale, string>,
  advantageSmallerBundleDesc: {
    en: "Tree-shakeable packages with zero runtime overhead. Only ship what you use — no virtual DOM algorithm included.",
    zh: "支持 tree-shaking 的包，零运行时开销。只发布你用到的——不包含虚拟DOM 算法。",
  } as Record<Locale, string>,
  advantageFineGrainedTitle: { en: "Fine-Grained Updates", zh: "细粒度更新" } as Record<Locale, string>,
  advantageFineGrainedDesc: {
    en: "Signals update only the exact DOM nodes that changed. No component re-renders, no virtual DOM diffing — surgical precision.",
    zh: "信号只更新变化的 DOM 节点。无组件重渲染，无虚拟DOM Diff——精准如手术刀。",
  } as Record<Locale, string>,

  // Comparison table
  comparisonTitle: { en: "Framework Comparison", zh: "框架对比" } as Record<Locale, string>,
  comparisonRuntime: { en: "Runtime (gzip)", zh: "运行时 (gzip)" } as Record<Locale, string>,
  comparisonVirtualDOM: { en: "Virtual DOM", zh: "虚拟DOM" } as Record<Locale, string>,
  comparisonReactivity: { en: "Reactivity", zh: "响应式" } as Record<Locale, string>,
  comparisonBuildStep: { en: "Build Step", zh: "构建步骤" } as Record<Locale, string>,
  comparisonWebStandards: { en: "Web Standards", zh: "Web 标准" } as Record<Locale, string>,
  comparisonTypeSafe: { en: "Type Safe", zh: "类型安全" } as Record<Locale, string>,
  comparisonAgentDocs: { en: "AI / LLM docs", zh: "AI / LLM 文档" } as Record<Locale, string>,
  comparisonAgentDocsRikka: { en: "llms.txt + skills + AGENTS.md", zh: "llms.txt + skills + AGENTS.md" } as Record<Locale, string>,
  comparisonAgentDocsNone: { en: "—", zh: "—" } as Record<Locale, string>,
  comparisonOptional: { en: "Optional", zh: "可选" } as Record<Locale, string>,
  comparisonRequired: { en: "Required", zh: "必需" } as Record<Locale, string>,
  comparisonPartial: { en: "Partial", zh: "部分" } as Record<Locale, string>,
  comparisonSignals: { en: "Signals", zh: "信号" } as Record<Locale, string>,
  comparisonHooks: { en: "Hooks", zh: "Hooks" } as Record<Locale, string>,
  comparisonProxy: { en: "Proxy", zh: "Proxy" } as Record<Locale, string>,
  comparisonCompiled: { en: "Compiled", zh: "编译型" } as Record<Locale, string>,
  comparisonProperties: { en: "Properties", zh: "属性" } as Record<Locale, string>,
  comparisonCaption: {
    en: "*Svelte has a tiny runtime but requires a compiler at build time.",
    zh: "*Svelte 运行时很小，但构建时需要编译器。",
  } as Record<Locale, string>,

  // Tags section
  tagsEyebrow: { en: "All in one", zh: "一站式" } as Record<Locale, string>,
  tagsTitle: { en: "Everything You Need", zh: "你所需的一切" } as Record<Locale, string>,
  tagsSubtitle: {
    en: "A complete toolkit for building modern, reactive Web Components.",
    zh: "构建现代响应式 Web Components 的完整工具集。",
  } as Record<Locale, string>,
  tagSignals: { en: "Signals", zh: "信号" } as Record<Locale, string>,
  tagComputed: { en: "Computed", zh: "计算值" } as Record<Locale, string>,
  tagEffects: { en: "Effects", zh: "副作用" } as Record<Locale, string>,
  tagCustomElements: { en: "Custom Elements", zh: "自定义元素" } as Record<Locale, string>,
  tagShadowDOM: { en: "Shadow DOM", zh: "Shadow DOM" } as Record<Locale, string>,
  tagTemplates: { en: "Templates", zh: "模板" } as Record<Locale, string>,
  tagFineGrainedUpdates: { en: "Fine-Grained Updates", zh: "细粒度更新" } as Record<Locale, string>,
  tagTypeScript: { en: "TypeScript", zh: "TypeScript" } as Record<Locale, string>,
  tagDecorators: { en: "Decorators", zh: "装饰器" } as Record<Locale, string>,
  tagReactiveLists: { en: "Reactive Lists", zh: "响应式列表" } as Record<Locale, string>,
  tagNoVDOM: { en: "No VDOM", zh: "无虚拟DOM" } as Record<Locale, string>,
  tagTreeShakable: { en: "Tree Shakable", zh: "可 Tree-shake" } as Record<Locale, string>,

  // Quick start section
  quickStartEyebrow: { en: "Get started", zh: "快速开始" } as Record<Locale, string>,
  quickStartTitle: { en: "Three steps. Zero config.", zh: "三步搞定。零配置。" } as Record<Locale, string>,
  quickStartSubtitle: {
    en: "Install once, write your UI, and let signals handle the rest.",
    zh: "安装一次，编写 UI，让信号处理其余一切。",
  } as Record<Locale, string>,
  quickStartStep1Title: { en: "Install", zh: "安装" } as Record<Locale, string>,
  quickStartStep1Desc1: { en: "Choose your preferred method — npm, a ", zh: "选择你喜欢的方式——npm、" } as Record<Locale, string>,
  quickStartStep1Desc2: { en: " tag, or ES module import:", zh: " 标签，或 ES 模块导入：" } as Record<Locale, string>,
  quickStartStep2Title: { en: "Write", zh: "编写" } as Record<Locale, string>,
  quickStartStep2Desc1: { en: "Use ", zh: "使用 " } as Record<Locale, string>,
  quickStartStep2Desc2: { en: ", and signals to build your UI. ", zh: " 和信号来构建 UI。" } as Record<Locale, string>,
  quickStartStep2Desc3: { en: " for reusable components (optional).", zh: " 用于可复用组件（可选）。" } as Record<Locale, string>,
  quickStartStep3Title: { en: "Render", zh: "渲染" } as Record<Locale, string>,
  quickStartStep3Desc: {
    en: "h() runs once — Signals handle all DOM updates automatically. No re-renders, no diffing.",
    zh: "h() 只运行一次——信号自动处理所有 DOM 更新。无重渲染，无 Diff。",
  } as Record<Locale, string>,
  quickStartCopy: { en: "Copy", zh: "复制" } as Record<Locale, string>,

  // Packages section
  packagesEyebrow: { en: "Packages", zh: "包" } as Record<Locale, string>,
  packagesTitle: { en: "Three Packages, Infinite Possibilities", zh: "三个包，无限可能" } as Record<Locale, string>,
  packagesSubtitle: {
    en: "Pick what you need. Each package is independently useful and tree-shakeable.",
    zh: "按需选择。每个包都独立可用且支持 tree-shaking。",
  } as Record<Locale, string>,
  packageElementsDesc: {
    en: "Define Custom Elements with Shadow DOM, attributes, events, and styles.",
    zh: "定义带有 Shadow DOM、属性、事件和样式的 Custom Elements。",
  } as Record<Locale, string>,
  packageDomDesc: {
    en: "Type-safe h() and tag factories. For() for reactive lists. Signals as children for fine-grained updates.",
    zh: "类型安全的 h() 和标签工厂。For() 用于响应式列表。信号作为子节点实现细粒度更新。",
  } as Record<Locale, string>,
  packageSignalDesc: {
    en: "TC39 Signals polyfill. signal(), computed(), and effect() for reactivity. Standards-based primitives.",
    zh: "TC39 Signals 垫片。signal()、computed() 和 effect() 实现响应式。基于标准的原语。",
  } as Record<Locale, string>,
};
