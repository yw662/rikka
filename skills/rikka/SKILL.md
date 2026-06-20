---
name: rikka
description: A Web Components toolkit with fine-grained reactivity based on TC39 Signals. Use this skill when writing interactive UIs with rikka — creating real DOM elements, binding signals, defining custom elements, or working with rikka's reactive primitives. Load this first to get oriented, then load one of the task-specific skills (reactive-state, dom-creation, custom-element, etc.) for the actual work.
---

# rikka

A small (~16 KB gzip) Web UI toolkit built on three ideas:

1. **No virtual DOM.** `h()` and tag helpers return real `Element` objects. Updates flow through `effect()` directly into the DOM.
2. **Signals-based reactivity.** All reactive state is a TC39 `Signal.State` or `Signal.Computed`. Read with `.get()`, write with `.set()`.
3. **Web Components native.** `defineElement` registers a real Custom Element that works in any HTML page without a framework runtime.

Three packages:

| Package | Job |
|---------|-----|
| `@takanashi/rikka-signal` | Reactive primitives: `signal`, `computed`, `effect`, `untracked` |
| `@takanashi/rikka-dom` | DOM creation: `h`, tag helpers, `For` / `Show` / `When` / `Switch` / `Match`, `css\``, `inlineStyle\`` |
| `@takanashi/rikka-elements` | Custom Elements: `defineElement`, `event`, `StringAttr` / `NumberAttr` / `BooleanAttr` |

Install:

```bash
npm install @takanashi/rikka-signal @takanashi/rikka-dom @takanashi/rikka-elements
```

## Mental model

```
Component = function returning Element
Reactivity = signal.get() / signal.set()
Side effects = effect()
DOM updates = signal change → effect auto-runs
```

No render phase, no commit phase, no reconciliation.

## The 4 rikka footguns (read these first)

### 1. Pass the signal, not `.get()`

```ts
// ❌ Static value — never updates
p({}, count.get());

// ✅ Pass the signal itself
p({}, count);
```

Inside `computed` / `effect` you **must** use `.get()` — that's how dependency tracking works.

### 2. Plain function vs `computed` in **value position**

A function used as a **child** is auto-wrapped as `computed` and reactive. A function used as a **value** (e.g. an `inlineStyle` argument, an attribute value) is **not** reactive. Use `computed()` explicitly:

```ts
// ❌ Static — function as value is not tracked
div({ style: { color: () => count.get() % 2 ? "red" : "blue" } });

// ✅ Reactive — wrap explicitly
div({ style: { color: computed(() => count.get() % 2 ? "red" : "blue") } });
```

### 3. `this.count` (coarse-grained) vs `this.$count` (fine-grained) in `defineElement.render()`

```ts
defineElement("my-el", {
  attributes: { count: NumberAttr },
  render() {
    p({}, this.count);   // ✅ coarse-grained — re-runs render (correct, less efficient)
    p({}, this.$count);  // ✅ fine-grained — only text node updates (preferred)
  },
});
```

`render` is wrapped in `computed`, so `this.count` (which calls `.get()`) is tracked. The old "static snapshot" footgun is gone — both work, they just differ in granularity.

### 4. `events` values are transform functions

```ts
// ❌ Type marker — wrong
events: { click: MouseEvent }

// ✅ Transform: DOM Event → detail
events: { click: (e: MouseEvent) => ({ x: e.clientX, y: e.clientY }) }

// ✅ Void event (no detail)
events: { reset: undefined }
```

## Minimal example

```ts
import { signal } from "@takanashi/rikka-signal";
import { div, button, p } from "@takanashi/rikka-dom";

const count = signal(0);

document.body.appendChild(
  div(
    p({}, "Count: ", count),
    button({ onclick: () => count.set(count.get() + 1) }, "+"),
  ),
);
```

## Minimal custom element

```ts
import { signal, effect } from "@takanashi/rikka-signal";
import { p, button } from "@takanashi/rikka-dom";
import { defineElement, NumberAttr } from "@takanashi/rikka-elements";

const Counter = defineElement("my-counter", {
  attributes: { start: NumberAttr },
  render() {
    const count = signal(this.start);
    effect(() => {
      this.shadowRoot.replaceChildren(
        p({}, "Count: ", count),
        button({ onclick: () => count.set(count.get() + 1) }, "+"),
      );
    });
    return document.createComment("counter");
  },
});
```

Use it in any HTML page:

```html
<script type="module" src="./counter.js"></script>
<my-counter start="10"></my-counter>
```

## Loading the right skill

This is the orientation skill. For actual work, load the matching task-specific skill:

- Creating or reading signals / computed / effect → `../reactive-state/`
- Building elements with `h()` or tag helpers → `../dom-creation/`
- Putting signals into DOM (text, attributes, `{{name}}`) → `../signal-binding/`
- Lists / conditionals → `../control-flow/`
- Two-way binding for inputs → `../form-binding/`
- Defining a custom element with `defineElement` → `../custom-element/`
- Shadow DOM + `css\``/`inlineStyle\`` → `../shadow-dom-styling/`
- The `template` option with `{{name}}` / `{{@event}}` → `../template-binding/`
- Composing components and embedding custom elements → `../composition/`
- SVG → `../svg/`
- **Full-stack server framework (resource-oriented, content negotiation)** → `../rikka-site/`
- Old browsers, polyfills, SSR → `../browser-compatibility/`
- Debugging LLM-specific mistakes → `../common-pitfalls/`

**Read `../common-pitfalls/` before generating rikka code** — it aggregates the cross-cutting mistakes.
