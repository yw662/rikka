# Rikka Skills

Operational guides for **coding agents** writing code with the Rikka framework.

These files are task-oriented — pick the one matching the work you're doing. Each file combines API surface, patterns, and pitfalls for a single topic. Cross-link instead of duplicating.

> **Loading strategy:** Read `overview.md` once to understand the framework. Then load only the topic files relevant to the current task. Do not load all files at once.

## Files

| File | Load when the task is about… |
|------|------------------------------|
| [overview.md](./overview.md) | Understanding what rikka is, the package layout, design principles |
| [reactive-state.md](./reactive-state.md) | Creating signals, computed, effect — any reactive state |
| [dom-creation.md](./dom-creation.md) | Creating elements with `h()`, tag helpers, or `h\`\`` template literals |
| [signal-binding.md](./signal-binding.md) | Binding signals to text nodes, attributes, or template slots |
| [control-flow.md](./control-flow.md) | Lists (`For`), conditionals (`Show` / `When` / `Switch` / `Match`) |
| [form-binding.md](./form-binding.md) | Two-way binding inputs, textareas, selects to signals |
| [custom-element.md](./custom-element.md) | Defining a custom element with `defineElement` |
| [shadow-dom-styling.md](./shadow-dom-styling.md) | `css\`\`` / `inlineStyle\`\``, Shadow DOM styles, `adoptStyle` |
| [template-binding.md](./template-binding.md) | The `template` option of `defineElement` with `{{name}}` / `{{@event}}` |
| [composition.md](./composition.md) | Composing components; embedding custom elements with `MyTag.h(...)` |
| [svg.md](./svg.md) | SVG elements, namespace handling, same-name tag conflicts |
| [browser-compatibility.md](./browser-compatibility.md) | Polyfills for Custom Elements / Shadow DOM / CSSStyleSheet |
| [common-pitfalls.md](./common-pitfalls.md) | Cross-cutting mistakes — read this before generating code |

## Decision tree

```
Need reactive state?
  └─ → reactive-state.md

Need to build DOM?
  ├─ Plain elements (h, tag helpers, h``)         → dom-creation.md
  ├─ Bind a signal into existing DOM              → signal-binding.md
  ├─ List of items (For)                           → control-flow.md
  ├─ Conditional rendering (Show / When / Switch)  → control-flow.md
  ├─ Form input with two-way binding               → form-binding.md
  └─ Custom element (defineElement)                → custom-element.md
       ├─ With render() function                   → custom-element.md
       ├─ With template option (h`<template>...`)   → template-binding.md
       ├─ Needs Shadow DOM styles (css``)          → shadow-dom-styling.md
       └─ Embedding this element elsewhere         → composition.md

Styling?
  ├─ Inline style object (inlineStyle``)            → shadow-dom-styling.md
  ├─ Shadow DOM stylesheet (css``)                 → shadow-dom-styling.md
  └─ SVG markup                                    → svg.md

Need to support old browsers?                     → browser-compatibility.md
```

## Conventions in these files

- **Import names**: use the scoped package form — `@rikka/signal`, `@rikka/dom`, `@rikka/elements`.
- **Code blocks**: all TypeScript. Runnable as written (no pseudo-code).
- **"✅" / "❌" markers**: indicate correct vs incorrect usage. Read both — the ❌ blocks show common LLM mistakes.
- **Pitfalls are first-class**: every topic file ends with a `Pitfalls` section. `common-pitfalls.md` aggregates the cross-cutting ones.
