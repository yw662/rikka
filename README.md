# Project Rikka

> **React Killer** — Native Web Components toolkit for developers and LLMs.

Rikka provides a set of lightweight utilities for building web components with native browser APIs. No framework runtime, no virtual DOM, no build-time compilation required for core features.

## Why

- **LLMs know HTML better than React** — Native HTML/CSS/JS is more stable and predictable for vibe coding
- **Web Components are mature** — Custom Elements + Shadow DOM + CSS Nesting cover 80% of React use cases
- **Full control** — Zero framework abstraction, call stacks go straight to the browser

## Packages

| Package                                     | Description                                      |
| ------------------------------------------- | ------------------------------------------------ |
| [`rikka-signal`](./utils/rikka-signal/)     | Reactive primitives based on TC39 Signals        |
| [`rikka-dom`](./utils/rikka-dom/)           | DOM utilities — `h()`, `render()`, tag shortcuts |
| [`rikka-elements`](./utils/rikka-elements/) | Function-based custom element definition         |

## Install

```bash
pnpm add rikka-signal rikka-dom rikka-elements
```

## Quick Start

```typescript
import { defineElement } from "rikka-elements";
import { div, p, button, render } from "rikka-dom";
import { signal } from "rikka-signal";

const MyCounter = defineElement(
  "my-counter",
  {
    shadow: true,
    attributes: {
      count: { type: Number, default: 0 },
    },
    render() {
      const count = signal(0);

      return div(
        p(() => `Count: ${count.get()}`),
        button({ onclick: () => count.set(count.get() + 1) }, "+"),
        button({ onclick: () => count.set(count.get() - 1) }, "-"),
      )();
    }
  }
);

// Usage in your app
const counter = document.createElement("my-counter");
document.body.appendChild(counter);
```

## API Reference

### rikka-signal

Reactive primitives wrapping [TC39 Signals polyfill](https://github.com/proposal-signals/signal-polyfill).

```typescript
import { signal, computed, effect, store, raw } from "rikka-signal";

// Basic signals
const count = signal(0);
const doubled = computed(() => count.get() * 2);

effect(() => console.log(doubled.get())); // 0

count.set(5); // logs: 10

// Reactive store (deep proxy)
const user = store({
  name: "Alice",
  role: "Developer",
  skills: ["TypeScript"],
});

effect(() => console.log(user.name)); // Alice
user.name = "Bob"; // logs: Bob
```

Effects are automatically batched by the Signals runtime — multiple synchronous signal updates trigger effects only once at the end of the microtask.

### rikka-dom

Hyperscript `h()` function for creating DOM elements and `render()` for mounting. Returns factory functions `() => Element` — no virtual DOM.

```typescript
import { h, div, p, span, button, render } from "rikka-dom";
import { signal } from "rikka-signal";

// Create elements (returns factory function)
const count = signal(0);

const app = div(
  { style: "display: flex; gap: 0.5rem;" },
  p(() => `Count: ${count.get()}`),
  button({ onclick: () => count.set(count.get() + 1) }, "+"),
);

// Render to container - auto-unwraps factory functions
render(document.getElementById("app")!, app);
```

**tag shortcuts** are included: `div`, `p`, `span`, `a`, `button`, `input`, `form`, `ul`, `ol`, `li`, `h1`–`h6`, `header`, `footer`, `main`, `section`, `nav`, `article`, `aside`, `img`, `table`, `thead`, `tbody`, `tr`, `th`, `td`, `label`, `select`, `option`, `textarea`, `br`, `hr`, `slot`, `template`.

**Additional utilities**: `css()` (CSSStyleSheet), `style()` (style object), `For` (list rendering), `Show`/`When`/`Switch`/`Match` (conditional), `ReactiveRange` (range helpers).

### rikka-elements

Function-based custom element definition. No base class required — just extend `HTMLElement`.

#### `defineElement(tagName, config?)`

Registers a custom element with reactive attributes and render function.

```typescript
defineElement("my-input", {
  attributes: {
    value: String,
  },
});

// With render function
defineElement(
  "my-counter",
  {
    shadow: true,
    attributes: {
      count: { type: Number, default: 0 },
    },
    render() {
      return div(
        button({ onclick: () => this.count++ }, "+"),
        span({}, () => `Count: ${this.count}`),
      )();
    }
  }
);
```

**Options**:

- `shadow?: boolean` - Enable Shadow DOM
- `attributes?: Record<string, AttributeSpec>` - Reactive attributes with optional defaults
- `render?: () => Renderable` - Render function returning content
- `events?: Record<string, EventConfig>` - Custom events

**Attribute types**: Access via `$propertyName` (e.g., `this.$count`)

**Events**: Use `dispatchEventName(value)` to emit, `onEventName(callback)` to listen

#### `event<T>()`

Creates a type-safe event configuration.

```typescript
import { event } from "rikka-elements";

const MyCounter = defineElement(
  "my-counter",
  {
    events: {
      countChange: event<number>(),
    },
    render() {
      return div(
        button({ onclick: () => this.dispatchCountChange(this.count++) }, "+")
      )();
    }
  }
);
```

#### CSS utilities

```typescript
import { css, adoptStyle } from "rikka-dom";

// Create CSSStyleSheet
const styles = css`
  .counter {
    padding: 16px;
    border-radius: 8px;
  }
`;

// Adopt styles into shadow root
adoptStyle(this.shadowRoot!, styles);
```

## Underlying Standards

### TC39 Signals API

rikka-signal is built on the [TC39 Signals proposal](https://github.com/tc39/proposal-signals), currently at **Stage 1**. The proposal defines three core primitives:

- **`Signal.State<T>`** — a writable reactive container that holds a value and notifies dependents on change
- **`Signal.Computed<T>`** — a derived signal that lazily recomputes when its dependencies change
- **`Signal.subtle.Watcher`** — a low-level primitive for observing signal changes (used internally by `effect`)

rikka-signal wraps these with ergonomic functions (`signal()`, `computed()`, `effect()`) and depends on the [`signal-polyfill`](https://github.com/proposal-signals/signal-polyfill) package until the proposal ships natively in browsers. The API surface maps directly to the standard:

| rikka-signal   | TC39 Signals                                |
| -------------- | ------------------------------------------- |
| `signal(v)`    | `new Signal.State(v)`                       |
| `computed(fn)` | `new Signal.Computed(fn)`                   |
| `effect(fn)`   | `Signal.subtle.Watcher` + `Signal.Computed` |

Once the Signals proposal reaches Stage 4 and ships in browsers, rikka-signal can drop the polyfill with zero API changes.

## Design Principles

- **No base class** — function-based API, extend `HTMLElement` directly
- **Explicit over implicit** — no Context API; use `closest()` to find ancestors
- **LLM-friendly** — all APIs are designed for clarity and predictability
- **Type-safe** — full TypeScript inference for signals, DOM creation, and components
- **Factory pattern** — DOM creation returns `() => Element` for lazy evaluation

## Requirements

- TypeScript 5.0+
- Browsers supporting Custom Elements, Shadow DOM, and CSS Nesting
- Modern build tool (Vite, Rsbuild, etc.)

## License

MIT
