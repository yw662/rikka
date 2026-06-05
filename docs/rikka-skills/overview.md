# Rikka Overview

Rikka is a Web UI toolkit built around three principles:

1. **No virtual DOM.** `h()` and tag helpers return real `Element` objects. Updates flow through `effect()` directly into the DOM.
2. **Signals-based reactivity.** All reactive state is a TC39 `Signal.State` or `Signal.Computed`. Read with `.get()`, write with `.set()`.
3. **Web Components native.** `defineElement` registers a real Custom Element that works in any HTML page without a framework runtime.

## Packages

| Package | Job | Core exports |
|---------|-----|--------------|
| `@rikka/signal` | Reactive primitives | `signal`, `computed`, `effect` |
| `@rikka/dom` | Create real DOM elements | `h`, tag helpers (`div`, `p`, `button`, …), `For`, `Show`, `When`, `Switch`, `Match`, `css`, `inlineStyle` |
| `@rikka/elements` | Custom Elements | `defineElement`, `event`, `StringAttr`, `NumberAttr`, `BooleanAttr` |

Install:

```bash
npm install @rikka/signal @rikka/dom @rikka/elements
```

## Mental model

```
Component = function returning Element
Reactivity = signal.get() / signal.set()
Side effects = effect()
DOM updates = signal change → effect auto-runs
```

There is no render phase, commit phase, hooks order, or reconciliation. A `Signal.State` is just a container with `.get()` and `.set()`. An `effect` is just a function that re-runs when signals it reads change.

## Derivable naming rules

rikka exposes a small set of dynamic APIs derived from the config you pass to `defineElement`. Memorize four rules; the rest follows:

| Rule | Config | Generated |
|------|--------|-----------|
| Attribute → raw value | `attributes: { count }` | `el.count` (read/write plain value) |
| Attribute → signal | `attributes: { count }` | `el.$count` (the underlying `Signal.State<T>`) |
| Event → dispatch | `events: { 'value-change' }` | `el.dispatchValueChange(detail?)` (PascalCase) |
| Event → listen | `events: { 'value-change' }` | `el.onValueChange` (camelCase) |

Tag helpers follow HTML tag names — `div` → `div()`, `button` → `button()`. No lookup table needed.

## When to use rikka

**Good fit:** small-to-medium interactive UIs where you want fine-grained reactivity, real Custom Elements, and a small bundle (~16 KB total for all three packages).

**Not a fit:** SSR-heavy apps (rikka is client-only by design), apps needing JSX with compile-time transforms (use React/Solid), large teams with entrenched patterns from other frameworks.

## Browser support

Chrome 73+ / Firefox 101+ / Safari 16.4+ / Edge 79+ need **no polyfill**. For older browsers, see [browser-compatibility.md](./browser-compatibility.md).

## Further reading

- [reactive-state.md](./reactive-state.md) — how to create and use signals
- [dom-creation.md](./dom-creation.md) — how to create elements
- [custom-element.md](./custom-element.md) — how to define a custom element
- [common-pitfalls.md](./common-pitfalls.md) — read this before generating code
