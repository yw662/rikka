---
name: signal-binding
description: How to bind signals into the DOM — text nodes, attributes, template slots. Fine-grained vs coarse-grained. The single most important rule: pass the signal, not `.get()`. Load this when the task is about putting reactive state into elements, understanding why a value is "static", or choosing between `${signal}` and `computed(() => h\`…\`)`.
---

# Signal Binding

The single most important rule: **pass the signal itself, not the result of `.get()`**. This is the difference between a live, fine-grained binding and a static value.

```typescript
const count = signal(0);

// ✅ Reactive — text node updates when count changes
p({}, count);

// ❌ Static — `p` receives a plain number, never updates
p({}, count.get());
```

`p({}, count)` is equivalent to: create a `Text` node, run an `effect` that calls `count.get()` on every change, update only that text node. No re-render of the parent, no loss of focus or cursor position.

## Children

A child of `h()` / tag helpers may be a signal:

```typescript
import { signal } from "@takanashi/rikka-signal";
import { div, span } from "@takanashi/rikka-dom";

const name = signal("Alice");

div({}, "Hello, ", name);            // "Hello, Alice" — reactive
div({}, "Count: ", count, "!");      // signal can sit between other children
```

The signal is wrapped in an auto-created `effect` that updates just the corresponding text node. Implementation uses comment markers (`<!---->`) to delimit the live region so siblings are untouched.

### Function children (auto-wrapped as `computed`)

A function child is auto-wrapped in `computed`, so any `.get()` inside the function is tracked:

```typescript
import { signal } from "@takanashi/rikka-signal";
import { div, span } from "@takanashi/rikka-dom";

const count = signal(0);

// Reactive — equivalent to div({}, computed(() => `count=${count.get()}`))
div({}, () => `count=${count.get()}`);

// Conditional element from a function child
const visible = signal(true);
div({}, () => (visible.get() ? span({}, "on") : null));
```

Use function children for **coarse-grained** updates where the child's *type or structure* changes. For simple text/attribute changes, pass the signal directly.

## Attributes

A signal may be used as any attribute value. The attribute updates when the signal changes.

```typescript
import { signal } from "@takanashi/rikka-signal";
import { div } from "@takanashi/rikka-dom";

const color = signal("red");

// ✅ Reactive — `style.color` updates
div({ style: { color } }, "Dynamic");

// ❌ Static — captures "red" once
div({ style: { color: color.get() } }, "Static");
```

Event handlers are set as DOM property handlers (`el.onclick = fn`), not via `addEventListener`:

```typescript
button({ onclick: (e) => console.log(e) }, "Click me");
```

### `defineElement` attributes — `this.xxx` vs `this.$xxx`

Inside a `render()` function, declared attributes expose two accessors. Both are reactive (render is wrapped in `computed`), but they differ in granularity:

| Accessor | Type | Use it for |
|----------|------|-----------|
| `this.name` | `T` (raw value) | Coarse-grained — whole render re-runs on change |
| `this.$name` | `Signal.State<T>` | Fine-grained — only the bound DOM node updates |

```typescript
defineElement("my-el", {
  attributes: { count: NumberAttr },
  render() {
    return div(
      // ✅ Fine-grained — text node updates, rest of DOM preserved
      p({}, this.$count),
      // ✅ Coarse-grained — correct, but whole render re-runs on change
      // p({}, this.count),
    );
  },
});
```

Prefer `this.$name` for DOM bindings (fine-grained). Use `this.name` for logic where re-rendering is acceptable.

## Template literal binding (`h\`\``)

Inside `h\`\``, `${signal}` interpolates as a fine-grained binding:

```typescript
const count = signal(0);

// ✅ Fine-grained: only the digit updates
h`<span>Count: ${count}</span>`;

// ❌ Lost reactivity
h`<span>Count: ${count.get()}</span>`;
```

In attributes too:

```typescript
const color = signal("red");
h`<div style="color: ${color}">Text</div>`;
```

When the template structure itself changes (e.g. switch between two different layouts), wrap the whole thing in `computed`:

```typescript
const mode = signal("edit");
const tmpl = computed(() => {
  if (mode.get() === "edit") return h`<textarea></textarea>`;
  return h`<div>Preview</div>`;
});
```

See [../common-pitfalls/#signal-interpolation-modes](../common-pitfalls/SKILL.md#signal-interpolation-modes).

## `defineElement` template binding — `{{name}}` auto-resolves to `$name`

When using the `template` option, `{{name}}` in text content automatically prefers `$name` (the signal) and falls back to `name` (the raw value). You only need to declare the attribute in the config:

```typescript
defineElement("my-counter", {
  attributes: { clickCount: NumberAttr },
  template: h`<template>
    <p>Clicked {{clickCount}} times</p>
  </template>`[0],
});
```

This is equivalent to manually writing `p({}, this.$clickCount)` in a `render()` function.

For attribute and event bindings in templates, see [../template-binding/](../template-binding/).

## Function values vs `computed`

**Function children** are auto-wrapped as `computed`. But **function values** (e.g. an `inlineStyle` argument, or a prop expecting a signal) are not. Use `computed()` explicitly:

```typescript
import { computed } from "@takanashi/rikka-signal";

// ❌ Plain function in inlineStyle arg — not reactive
div({ style: { color: () => count.get() % 2 ? "red" : "blue" } });

// ✅ Computed — reactive
div({ style: { color: computed(() => count.get() % 2 ? "red" : "blue") } });
```

This was the #1 LLM error in the rikka benchmark (Task 7, Theme Switcher). See [`docs/research/llm/llm-benchmark.md`](../research/llm/llm-benchmark.md) for details.

## Effect cleanup — automatic in DOM bindings

`effect`s created by DOM bindings (signals as children, signals as attrs, function children) are tied to the element via `WeakRef` + `FinalizationRegistry`. When the element is garbage-collected, the effect is automatically disposed. You don't need to manage disposal.

If you create `effect`s manually (e.g. for non-DOM side effects), call the returned dispose function explicitly. See [../reactive-state/#effectfn---void](../reactive-state/SKILL.md#effectfn---void).

## Pitfalls

### 1. Passing `.get()` to DOM

The most common mistake. See the top of this file.

### 2. Plain function where `computed` is required

See [Function values vs `computed`](#function-values-vs-computed).

### 3. `this.count` (coarse-grained) instead of `this.$count` (fine-grained) in `render()`

```typescript
render() {
  return p({}, this.count);     // ✅ coarse-grained — works, but re-runs whole render
  return p({}, this.$count);    // ✅ fine-grained — preferred, only text node updates
}
```

Both work (render is wrapped in `computed`). Prefer `this.$count` for DOM bindings.

### 4. Coarse-grained `computed(() => h\`\`)` when fine-grained would do

Wrapping a tiny template in `computed` rebuilds the whole element on every change. Use the `${signal}` form unless the template structure itself depends on the signal.

## See also

- [../reactive-state/](../reactive-state/) — creating signals
- [../dom-creation/](../dom-creation/) — `h`, tag helpers
- [../template-binding/](../template-binding/) — `{{name}}` / `{{@event}}` in templates
- [../form-binding/](../form-binding/) — two-way binding inputs
- [../common-pitfalls/](../common-pitfalls/)
