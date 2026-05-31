# Rikka 🚀

> **Modern Web Components Toolkit** — Lightweight, type-safe utilities for building native web components with reactive state management.

Rikka provides a set of zero-dependency utilities for building web components using **native browser APIs**. No framework runtime, no virtual DOM, no build-time compilation required for core features.

## ✨ Features

- 🔥 **Reactive State** — TC39 Signals-based reactivity (`signal`, `computed`, `effect`, `store`)
- 🎨 **DOM Utilities** — Hyperscript `h()`, tag helpers, `For`/`Show`/`Switch` control flow
- 🧩 **Custom Elements** — Function-based `defineElement()` with Shadow DOM, attributes, events
- 🎮 **Live Playground** — Real-time code editor component for interactive demos
- ⚡ **Zero Runtime** — No framework abstraction, call stacks go straight to the browser
- 🔒 **Type-Safe** — Full TypeScript inference for signals, DOM, and components
- 📦 **Tree-Shakeable** — Each package is < 15KB gzipped, use only what you need

## 📦 Packages

| Package                                                                          | Version                                                                 | Description                                        | Size (gzip) |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------- | ----------- |
| [`@rikka/signal`](https://www.npmjs.com/package/@rikka/signal)                   | ![npm version](https://img.shields.io/npm/v/@rikka/signal.svg)          | Reactive primitives based on TC39 Signals          | ~1.6 KB     |
| [`@rikka/dom`](https://www.npmjs.com/package/@rikka/dom)                         | ![npm version](https://img.shields.io/npm/v/@rikka/dom.svg)             | DOM utilities — `h()`, tag shortcuts, control flow | ~6.3 KB     |
| [`@rikka/elements`](https://www.npmjs.com/package/@rikka/elements)               | ![npm version](https://img.shields.io/npm/v/@rikka/elements.svg)        | Function-based custom element definition           | ~3.3 KB     |
| [`@rikka/live-playground`](https://www.npmjs.com/package/@rikka/live-playground) | ![npm version](https://img.shields.io/npm/v/@rikka/live-playground.svg) | Live code editor Web Component                     | ~4.2 KB     |

## 🚀 Quick Start

### Installation

```bash
# Install all packages
pnpm add @rikka/signal @rikka/dom @rikka/elements

# Or install individually
npm install @rikka/signal
```

### Counter Example

```typescript
import { defineElement } from "@rikka/elements";
import { div, p, button } from "@rikka/dom";

const MyCounter = defineElement("my-counter", {
  shadow: true,
  attributes: {
    count: { type: Number, default: 0 },
  },
  render() {
    return div(
      p("Count: ", this.count),
      button({ onclick: () => this.count++ }, "+"),
      button({ onclick: () => this.count-- }, "-"),
    )();
  },
});

// Usage in your app
const counter = document.createElement("my-counter");
document.body.appendChild(counter);

// Or set initial count via attribute
counter.setAttribute("count", "10");
```

## 📖 API Reference

### @rikka/signal — Reactive Primitives

Based on [TC39 Signals proposal](https://github.com/proposal-signals/signal-polyfill) (Stage 1).

```typescript
import { signal, computed, effect, store, raw } from "@rikka/signal";

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

**API Surface:**

| rikka-signal   | TC39 Signals                                |
| -------------- | ------------------------------------------- |
| `signal(v)`    | `new Signal.State(v)`                       |
| `computed(fn)` | `new Signal.Computed(fn)`                   |
| `effect(fn)`   | `Signal.subtle.Watcher` + `Signal.Computed` |

---

### @rikka/dom — DOM Utilities

Hyperscript `h()` function for creating DOM elements. Returns real DOM elements — no virtual DOM, no factory functions.

```typescript
import { div, p, button, applyChild } from "@rikka/dom";
import { signal } from "@rikka/signal";

const count = signal(0);

const app = div(
  { style: "display: flex; gap: 0.5rem;" },
  p("Count: ", count),
  button({ onclick: () => count.set(count.get() + 1) }, "+"),
);

// Mount to DOM
const container = document.getElementById("app");
if (container) applyChild(container, app);
```

**Tag shortcuts**: `div`, `p`, `span`, `a`, `button`, `input`, `form`, `ul`, `ol`, `li`, `h1`–`h6`, `header`, `footer`, `main`, `section`, `nav`, `article`, `aside`, `img`, `table`, `thead`, `tbody`, `tr`, `th`, `td`, `label`, `select`, `option`, `textarea`, `br`, `hr`, `slot`, `template`.

**Control Flow**: `For` (list rendering), `Show`/`When`/`Switch`/`Match` (conditional), `ReactiveRange` (range helpers).

**Styling**: `css()` (CSSStyleSheet), `style()` (style object).

---

### @rikka/elements — Custom Elements

Function-based custom element definition. No base class required — just extend `HTMLElement`.

#### defineElement(tagName, config?)

```typescript
// Simple attribute binding
defineElement("my-input", {
  attributes: {
    value: String,
  },
});

// With Shadow DOM + render function
defineElement("my-counter", {
  shadow: true,
  attributes: {
    count: { type: Number, default: 0 },
  },
  render() {
    return div(
      button({ onclick: () => this.count++ }, "+"),
      span("Count: ", this.count),
    );
  },
});
```

**Options:**

| Option       | Type                            | Description                       |
| ------------ | ------------------------------- | --------------------------------- |
| `shadow`     | `boolean`                       | Enable Shadow DOM encapsulation   |
| `attributes` | `Record<string, AttributeSpec>` | Reactive attributes with defaults |
| `render`     | `() => Renderable`              | Render function returning content |
| `events`     | `Record<string, EventConfig>`   | Custom events to dispatch         |

**Attribute Access**: Use `$propertyName` (e.g., `this.$count`)

**Events**: Use `dispatchEventName(value)` to emit, `onEventName(callback)` to listen

#### Event Helper

```typescript
import { event, defineElement } from "@rikka/elements";

const MyCounter = defineElement("my-counter", {
  events: {
    countChange: event<number>(),
  },
  render() {
    return div(
      button({ onclick: () => this.dispatchCountChange(this.count++) }, "+"),
    )();
  },
});
```

#### CSS in Shadow DOM

```typescript
import { css, adoptStyle } from "@rikka-dom";

const styles = css`
  .counter {
    padding: 16px;
    border-radius: 8px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }
`;

// In render():
adoptStyle(this.shadowRoot!, styles);
```

## 🎮 Live Playground

Interactive code editor component for demos and documentation:

```typescript
import { LivePlayground } from "@rikka/live-playground";

defineElement("demo-editor", {
  render() {
    return new LivePlayground({
      initialCode: `
        // Write your component here!
        import { signal } from "@rikka/signal";
        const count = signal(0);
        console.log(count.get());
      `,
      language: "typescript",
      theme: "dark",
    });
  },
});
```

Features:

- ✅ esbuild-wasm compilation (runs in browser)
- ✅ Real-time preview in iframe sandbox
- ✅ Syntax highlighting
- ✅ Error display
- ✅ Multiple language support

## 🏗️ Underlying Standards

### TC39 Signals API

Built on the [TC39 Signals proposal](https://github.com/tc39/proposal-signals) (**Stage 1**).

Once the proposal reaches Stage 4 and ships natively, `@rikka/signal` can drop the polyfill with **zero API changes**.

### Web Components

Uses native browser APIs:

- **Custom Elements v1** — Define reusable HTML elements
- **Shadow DOM v1** — Style encapsulation
- **CSS Nesting** — Scoped styles without preprocessors

## 🎯 Design Principles

- **No base class** — Function-based API, extend `HTMLElement` directly
- **Explicit over implicit** — No Context API; use `closest()` for ancestors
- **LLM-friendly** — All APIs designed for clarity and predictability
- **Type-safe** — Full TypeScript inference throughout
- **Direct DOM** — Tag functions return real DOM elements, no virtual DOM abstraction
- **Zero dependencies** — Core packages have zero runtime dependencies

## 🛠️ Requirements

- **TypeScript** 5.0+ (strict mode recommended)
- **Browsers** supporting Custom Elements, Shadow DOM, CSS Nesting
- **Build tool** Vite, Rsbuild, or any modern bundler

## 📊 Quality Metrics

| Metric              | Value                                |
| ------------------- | ------------------------------------ |
| TypeScript Errors   | **0**                                |
| Unit Tests          | **481** passing                      |
| Test Coverage       | Signal / DOM / Elements / Playground |
| Bundle Size (total) | **~16KB** gzip                       |
| Tree Shakeable      | ✅ Yes                               |
| ESM Only            | ✅ Yes                               |
| Side Effects        | ❌ None                              |

## 🔧 Development

```bash
# Clone repo
git clone https://github.com/yw662/rikka.git
cd rikka

# Install dependencies
pnpm install

# Run all checks
pnpm test:all              # Full CI pipeline (~35s)
pnpm typecheck             # TypeScript check only (~2s)
pnpm test                  # Unit tests only (~15s)
pnpm browser-test          # Browser E2E tests (~15s)

# Start demo site
pnpm demo                   # http://localhost:3000
```

## 📄 License

[MIT](./LICENSE)

## 🙏 Acknowledgments

- [TC39 Signals Proposal](https://github.com/tc39/proposal-signals) — Reactive primitives standard
- [signal-polyfill](https://github.com/tc39/proposal-signal-polyfill) — Signals polyfill implementation
- [Rslib](https://rslib.dev/) — Build tooling
- [happy-dom](https://github.com/capricorn86/happy-dom) — Test DOM environment
