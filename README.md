# Rikka 🚀

> **Modern Web Components Toolkit** — Lightweight, type-safe utilities for building native web components with reactive state management.

Rikka provides a set of zero-dependency utilities for building web components using **native browser APIs**. No framework runtime, no virtual DOM, no build-time compilation required for core features.

## 🤖 For AI Coding Agents

If you're an LLM/agent generating rikka code, **read the skills index first**:

- **Skills index:** <https://yw662.github.io/rikka/skills/README.md>
- **llms.txt:** <https://yw662.github.io/rikka/llms.txt>
- **Homepage index:** <https://yw662.github.io/rikka/skills/index.html>

These contain task-oriented guides (`reactive-state.md`, `dom-creation.md`, `signal-binding.md`, `custom-element.md`, `common-pitfalls.md`, etc.) that explain patterns and the most common LLM-specific mistakes. See also [`AGENTS.md`](./AGENTS.md) at the project root.

## ✨ Features

- 🔥 **Reactive State** — TC39 Signals-based reactivity (`signal`, `computed`, `effect`)
- 🎨 **DOM Utilities** — Hyperscript `h()`, tag helpers, `For`/`Show`/`Switch` control flow
- 🧩 **Custom Elements** — Function-based `defineElement()` with Shadow DOM, attributes, events
- 🎮 **Live Playground** — Real-time code editor component for interactive demos
- ⚡ **Zero Runtime** — No framework abstraction, call stacks go straight to the browser
- 🔒 **Type-Safe** — Full TypeScript inference for signals, DOM, and components
- 📦 **Tree-Shakeable** — Each package is < 15KB gzipped, use only what you need

## 📦 Packages

| Package                                                                                   | Version                                                                                      | Description                                        | Size (gzip) |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------- | ----------- |
| [`@rikka/signal`](https://github.com/yw662/rikka/pkgs/npm/rikka-signal)                   | ![GitHub Package Version](https://img.shields.io/github/v/tag/yw662/rikka.svg?label=version) | Reactive primitives based on TC39 Signals          | ~1.6 KB     |
| [`@rikka/dom`](https://github.com/yw662/rikka/pkgs/npm/rikka-dom)                         | ![GitHub Package Version](https://img.shields.io/github/v/tag/yw662/rikka.svg?label=version) | DOM utilities — `h()`, tag shortcuts, control flow | ~6.3 KB     |
| [`@rikka/elements`](https://github.com/yw662/rikka/pkgs/npm/rikka-elements)               | ![GitHub Package Version](https://img.shields.io/github/v/tag/yw662/rikka.svg?label=version) | Function-based custom element definition           | ~3.3 KB     |
| [`@rikka/live-playground`](https://github.com/yw662/rikka/pkgs/npm/rikka-live-playground) | ![GitHub Package Version](https://img.shields.io/github/v/tag/yw662/rikka.svg?label=version) | Live code editor Web Component                     | ~4.2 KB     |

## 🚀 Quick Start

### Installation

Packages are published to [GitHub Packages](https://github.com/yw662/rikka/pkgs). First, create an `.npmrc` in your project:

```ini
@rikka:registry=https://npm.pkg.github.com
```

> **Note**: If the repository is private, you'll need a [Personal Access Token](https://github.com/settings/tokens) with `read:packages` scope. For public repositories, no authentication is needed.

Then install:

```bash
# Install all packages
pnpm add @rikka/signal @rikka/dom @rikka/elements

# Or install individually
npm install @rikka/signal
```

### Counter Example

```typescript
import { defineElement, NumberAttr } from "@rikka/elements";
import { div, p, button } from "@rikka/dom";

const MyCounter = defineElement("my-counter", {
  shadow: { mode: "open" },
  attributes: {
    count: { ...NumberAttr, default: 0 },
  },
  render() {
    return div(
      p("Count: ", this.count),
      button({ onclick: () => this.count++ }, "+"),
      button({ onclick: () => this.count-- }, "-"),
    );
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
import { signal, computed, effect } from "@rikka/signal";

// Basic signals
const count = signal(0);
const doubled = computed(() => count.get() * 2);

effect(() => console.log(doubled.get())); // 0

count.set(5); // logs: 10
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
    value: StringAttr,
  },
});

// With Shadow DOM + render function
defineElement("my-counter", {
  shadow: { mode: "open" },
  attributes: {
    count: { ...NumberAttr, default: 0 },
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

| Option       | Type                               | Description                                          |
| ------------ | ---------------------------------- | ---------------------------------------------------- |
| `shadow`     | `ShadowRootInit \| false`          | Shadow DOM config; `false` to disable                |
| `styles`     | `CSSStyleSheet \| CSSStyleSheet[]` | Stylesheets injected into Shadow DOM                 |
| `attributes` | `Record<string, AttributeSpec>`    | Reactive attributes with defaults                    |
| `events`     | `Record<string, EventSpec>`        | Custom events to dispatch                            |
| `methods`    | `Record<string, Function>`         | Custom methods attached to element instance          |
| `template`   | `HTMLTemplateElement`              | Template element (mutually exclusive with `render`)  |
| `render`     | `(this: El) => Element`            | Render function (mutually exclusive with `template`) |

**Attribute Access**: Use `$propertyName` (e.g., `this.$count`)

**Events**: Use `dispatchEventName(value)` to emit, `onEventName(callback)` to listen

#### Event Helper

```typescript
import { event, defineElement, NumberAttr } from "@rikka/elements";
import { div, button, span } from "@rikka/dom";

const MyCounter = defineElement("my-counter", {
  shadow: { mode: "open" },
  attributes: {
    count: { ...NumberAttr, default: 0 },
  },
  events: {
    countChange: event<number>(),
  },
  render() {
    return div(
      span("Count: ", this.count),
      button({ onclick: () => this.dispatchCountChange(this.count++) }, "+"),
    );
  },
});

// Usage
document.body.appendChild(document.createElement("my-counter"));

// Listen for custom events
document.querySelector("my-counter")!.onCountChange = (e) => {
  console.log("Count changed to:", e.detail);
};
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

Interactive code editor component for demos and documentation. Registered as `<rikka-live-playground>` custom element.

#### HTML

```html
<rikka-live-playground
  code="console.log('Hello, Rikka!')"
  height="200"
  title="Quick Demo"
></rikka-live-playground>
```

Code can also be provided as element content:

```html
<rikka-live-playground title="Counter Example">
  import { signal } from "rikka-signal"; const count = signal(0);
  console.log(count.get());
</rikka-live-playground>
```

#### Tag Function (`h`)

```typescript
import { RikkaLivePlayground } from "@rikka/live-playground";

const playground = RikkaLivePlayground.h({
  code: `console.log("Hello from h()!")`,
  height: "300",
  title: "h() Demo",
});

document.body.appendChild(playground);
```

#### `createElement`

```typescript
import "@rikka/live-playground";

const playground = document.createElement("rikka-live-playground");
playground.setAttribute("code", "console.log('Hello!')");
playground.setAttribute("height", "250");
playground.setAttribute("title", "createElement Demo");
document.body.appendChild(playground);
```

#### Inside Another Element

```typescript
import { defineElement } from "@rikka/elements";
import { RikkaLivePlayground } from "@rikka/live-playground";
import { div } from "@rikka/dom";

defineElement("my-demo-page", {
  shadow: { mode: "open" },
  render() {
    return div(
      RikkaLivePlayground.h({
        code: `import { signal } from "rikka-signal";
const count = signal(0);
console.log(count.get());`,
        title: "Signal Demo",
      }),
    );
  },
});
```

**Attributes:**

| Attribute | Default     | Description             |
| --------- | ----------- | ----------------------- |
| `code`    | `""`        | Initial code content    |
| `height`  | `"200"`     | Editor area height (px) |
| `title`   | `"Example"` | Header title            |

**Events:** `error` — dispatched when compilation or runtime error occurs

**Methods:** `run()` — compile & execute code, `reset()` — restore initial code & re-run

Features:

- ✅ esbuild-wasm compilation (runs in browser)
- ✅ Real-time preview in iframe sandbox
- ✅ Resizable editor & preview areas
- ✅ Error display
- ✅ Rikka APIs auto-available in sandbox (`signal`, `h`, `div`, `defineElement`, etc.)

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
| Unit Tests          | **313** passing                      |
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
