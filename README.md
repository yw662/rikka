<div align="center">

# 🌠 Rikka

**Modern Web Components Toolkit** · Zero Dependencies · TC39 Signals · Full TypeScript

[Live Demo](https://yw662.github.io/rikka/) · [Why Rikka?](#-why-rikka) · [Quick Start](#-quick-start) · [API Reference](#-api-reference)

[![npm version](https://img.shields.io/npm/v/@takanashi/rikka-signal)](https://www.npmjs.com/package/@takanashi/rikka-signal)
[![npm downloads](https://img.shields.io/npm/dm/@takanashi/rikka-signal)](https://www.npmjs.com/package/@takanashi/rikka-signal)
[![GitHub stars](https://img.shields.io/github/stars/yw662/rikka)](https://github.com/yw662/rikka)
[![License](https://img.shields.io/github/license/yw662/rikka)](./LICENSE)
[![Tests](https://img.shields.io/badge/tests-1076%20passing-brightgreen)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-0%20errors-blue)]()
[![Bundle Size](https://img.shields.io/badge/gzipped-~16KB-success)]()

</div>

---

## 🤔 Why Rikka?

Three things drove this project:

1. **Reactivity should be a platform standard**
   Rikka is built on TC39 Signals (Stage 1) — a browser-vendor-supported standardization effort. When it lands in the spec, Rikka can drop the polyfill without changing your code. No proprietary reactivity, no framework-specific primitives.

2. **TypeScript-first, not TypeScript-adjacent**
   Every API in Rikka is designed for full type inference — signals, DOM helpers, custom element attributes and events. No `any` escapes, no manual type annotations needed. The types don't just exist; they carry their weight.

3. **LLMs need good docs too**
   In 2026, a meaningful percentage of frontend code is written by AI agents. Rikka ships with `llms.txt` and `skills/` documentation specifically for LLMs. Tested in Cursor: AI writes correct Rikka code on the first try.

Rikka is designed for **developers who value correctness and standards**, **cross-framework component libraries**, and **AI-assisted development**.

## ✨ Features

- 🔥 **Reactive State** — TC39 Signals-based reactivity (`signal`, `computed`, `effect`)
- 🎨 **DOM Utilities** — Hyperscript `h()`, tag helpers, `For`/`Show`/`Switch` control flow
- 🧩 **Custom Elements** — Function-based `defineElement()` with Shadow DOM, attributes, events
- 🌐 **Resource-Oriented Server** — `rikka-site`: declarative resource tree, content negotiation (JSON/CSV/CBOR/HTML/protobuf), edge-ready
- 🎮 **Live Playground** — Real-time code editor component for interactive demos
- ⚡ **Zero Runtime** — No framework abstraction, call stacks go straight to the browser
- 🔒 **Type-Safe** — Full TypeScript inference for signals, DOM, and components
- 📦 **Tree-Shakeable** — Each package is < 15KB gzipped, use only what you need

## 🚀 Quick Start

### Installation

Packages are published to [npm](https://www.npmjs.com/org/takanashi). No extra registry configuration is needed.

```bash
# Install all packages
pnpm add @takanashi/rikka-signal @takanashi/rikka-dom @takanashi/rikka-elements

# Or install individually
npm install @takanashi/rikka-signal
```

### Counter Example

```typescript
import { defineElement, NumberAttr } from "@takanashi/rikka-elements";
import { div, p, button } from "@takanashi/rikka-dom";

const MyCounter = defineElement("my-counter", {
  shadow: { mode: "open" },
  attributes: {
    count: { ...NumberAttr, default: 0 },
  },
  render() {
    return div(
      p("Count: ", this.$count),
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

## 🌐 Live Demo

Try Rikka in your browser: **[https://yw662.github.io/rikka/](https://yw662.github.io/rikka/)**

## 📦 Packages

| Package                                                                                              | Version                                                                           | Description                                                 | Size (gzip) |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------- | ----------- |
| [`@takanashi/rikka-signal`](https://www.npmjs.com/package/@takanashi/rikka-signal)                   | ![npm version](https://img.shields.io/npm/v/@takanashi/rikka-signal.svg)          | Reactive primitives based on TC39 Signals                   | ~1.6 KB     |
| [`@takanashi/rikka-dom`](https://www.npmjs.com/package/@takanashi/rikka-dom)                         | ![npm version](https://img.shields.io/npm/v/@takanashi/rikka-dom.svg)             | DOM utilities — `h()`, tag shortcuts, control flow          | ~6.3 KB     |
| [`@takanashi/rikka-elements`](https://www.npmjs.com/package/@takanashi/rikka-elements)               | ![npm version](https://img.shields.io/npm/v/@takanashi/rikka-elements.svg)        | Function-based custom element definition                    | ~3.3 KB     |
| [`@takanashi/rikka-site`](https://www.npmjs.com/package/@takanashi/rikka-site)                       | ![npm version](https://img.shields.io/npm/v/@takanashi/rikka-site.svg)            | Resource-oriented server framework with content negotiation | —           |
| [`@takanashi/rikka-live-playground`](https://www.npmjs.com/package/@takanashi/rikka-live-playground) | ![npm version](https://img.shields.io/npm/v/@takanashi/rikka-live-playground.svg) | Live code editor Web Component                              | ~4.2 KB     |

## 📖 API Reference

### @takanashi/rikka-signal — Reactive Primitives

Based on [TC39 Signals proposal](https://github.com/proposal-signals/signal-polyfill) (Stage 1).

```typescript
import { signal, computed, effect } from "@takanashi/rikka-signal";

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

### @takanashi/rikka-dom — DOM Utilities

Hyperscript `h()` function for creating DOM elements. Returns real DOM elements — no virtual DOM, no factory functions.

```typescript
import { div, p, button, applyChild } from "@takanashi/rikka-dom";
import { signal } from "@takanashi/rikka-signal";

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

### @takanashi/rikka-elements — Custom Elements

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
      span("Count: ", this.$count),
    );
  },
});
```

**Options:**

| Option       | Type                               | Description                                                                                                              |
| ------------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `shadow`     | `ShadowRootInit \| false`          | Shadow DOM config; `false` to disable                                                                                    |
| `styles`     | `CSSStyleSheet \| CSSStyleSheet[]` | Stylesheets injected into Shadow DOM                                                                                     |
| `attributes` | `Record<string, AttributeSpec>`    | Reactive attributes with defaults                                                                                        |
| `events`     | `Record<string, EventSpec>`        | Custom events to dispatch                                                                                                |
| `methods`    | `Record<string, Function>`         | Custom methods attached to element instance                                                                              |
| `template`   | `HTMLTemplateElement`              | Template element (mutually exclusive with `render`)                                                                      |
| `render`     | `(this: El) => Element`            | Render function (mutually exclusive with `template`). Wrapped in `computed` — `this.count` is reactive (coarse-grained). |

**Attribute Access**: Use `this.$count` for fine-grained DOM bindings (only the text node updates). Use `this.count` for logic where re-rendering is acceptable (coarse-grained — whole render re-runs). Both are reactive; `render` is wrapped in `computed` so `this.count` (which calls `.get()` internally) is automatically tracked.

**Events**: Use `dispatchEventName(value)` to emit, `onEventName(callback)` to listen

#### Event Helper

```typescript
import { event, defineElement, NumberAttr } from "@takanashi/rikka-elements";
import { div, button, span } from "@takanashi/rikka-dom";

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
      span("Count: ", this.$count),
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
import { css, adoptStyle } from "@takanashi/rikka-dom";

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

---

### @takanashi/rikka-site — Resource-Oriented Server

A resource-oriented server framework with content negotiation, built on the
same reactive primitives. Define resources as a declarative tree of
`ResourceKind` instances; the server handles routing, content negotiation
(JSON, JSON-LD, CSV, CBOR, HTML, …), auth, CORS, pagination, and hydration
automatically.

```typescript
import {
  CollectionKind,
  ItemKind,
  site,
  FileSystemKind,
  type Schema,
} from "@takanashi/rikka-site";
import type { Repr } from "@takanashi/rikka-site";

// Resources are classes extending abstract base kinds.
// Extend a Kind, then mount an instance in the site tree.
class Articles extends CollectionKind {
  schema: Schema = { type: "object" };

  async list(): Promise<Repr> {
    return { content: [{ id: 1, title: "Hello" }] };
  }

  async create(ctx): Promise<Repr> {
    const body = await ctx.json(); // streaming body → parsed JSON
    const article = { id: nextId++, ...body };
    return { content: article, meta: { location: `./${article.id}` } };
  }
}

class Article extends ItemKind<{ id: string }> {
  async content(ctx): Promise<Repr> {
    return { content: articles[ctx.params.id] };
  }
}

// Static files — FileSystemKind is a concrete class, pass config to the constructor
const app = site({
  articles: new Articles(),
  ":id": new Article(),
  "assets/": new FileSystemKind({ root: "./public" }),
});

// Same URL serves multiple formats:
// GET /articles              → HTML page
// GET /articles?accept=json  → JSON
// GET /articles?accept=csv   → CSV
// GET /articles?accept=cbor  → CBOR binary
```

**Abstract class hierarchy**: `ResourceKind` (abstract base) → `CollectionKind`,
`ItemKind`, `SingletonKind`, `ReadOnlyKind`, `ActionKind` (abstract — extend and
instantiate). Each kind constrains the HTTP semantics (allowed methods, status codes).
The site tree stores `ResourceKind` instances, cloned per request via `Object.create`.

**Concrete resource adapters** live in separate packages:
`@takanashi/rikka-resource-filesystem` (`FileSystemKind` — static files + WebDAV) and
`@takanashi/rikka-resource-database` (`DatabaseKind` — schema-driven CRUD).

**Streaming bodies**: Request and response bodies are
`ReadableStream<Uint8Array>`. Use `await ctx.json()` to parse JSON,
`await ctx.text()` for text, or read the raw stream directly.

**Schema types**: `SchemaObject`, `SchemaArray`, `SchemaRaw` (`{ type: "raw",
mime: string }` for opaque binary), and schema-based formats like protobuf
(`protobuf(schema)` returns a transformer).

**Handlers return `Repr`**: All handlers explicitly return
`Repr | Promise<Repr>` — no auto-wrapping. `Repr` is `{ content, meta?, links? }`.

**Transformers**: Value→Raw pipeline with built-in JSON, JSON-LD, CSV,
text, CBOR (binary, RFC 8949), and HTML. Binary formats produce `Uint8Array`
that flows through the pipeline without string conversion.

**Edge-ready**: Adapters for Cloudflare Workers/Pages, Deno Deploy, Vercel
Edge, and Node.js. See [`utils/rikka-site/README.md`](./utils/rikka-site/README.md)
for full docs.

---

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
import { RikkaLivePlayground } from "@takanashi/rikka-live-playground";

const playground = RikkaLivePlayground.h({
  code: `console.log("Hello from h()!")`,
  height: "300",
  title: "h() Demo",
});

document.body.appendChild(playground);
```

#### `createElement`

```typescript
import "@takanashi/rikka-live-playground";

const playground = document.createElement("rikka-live-playground");
playground.setAttribute("code", "console.log('Hello!')");
playground.setAttribute("height", "250");
playground.setAttribute("title", "createElement Demo");
document.body.appendChild(playground);
```

#### Inside Another Element

```typescript
import { defineElement } from "@takanashi/rikka-elements";
import { RikkaLivePlayground } from "@takanashi/rikka-live-playground";
import { div } from "@takanashi/rikka-dom";

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

| Attribute | Default      | Description                                                                                                                                                                                                     |
| --------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `code`    | `""`         | Initial code content                                                                                                                                                                                            |
| `height`  | `"200"`      | Editor area height (px)                                                                                                                                                                                         |
| `title`   | `"Example"`  | Header title                                                                                                                                                                                                    |
| `layout`  | `"vertical"` | Editor/preview split direction (`"vertical"` \| `"horizontal"`)                                                                                                                                                 |
| `panel`   | `"both"`     | Visible panels (`"both"` \| `"editor"` \| `"preview"`)                                                                                                                                                          |
| `theme`   | `"auto"`     | Color theme (`"auto"` \| `"dark"` \| `"light"`). `auto` follows `prefers-color-scheme`; explicit values pin the theme. The resolved value is also exposed as `data-theme` on `:host` for further CSS overrides. |

**Events:** `error` — dispatched when compilation or runtime error occurs

**Methods:** `run()` — compile & execute code, `reset()` — restore initial code & re-run, `setTheme(t)` / `toggleTheme()` — switch between light and dark. All `--pg-*` CSS variables are also pushed into the preview iframe, so user code can reference them directly.

## 🤖 AI Coding with Rikka

If you're an LLM/agent generating rikka code, **install the skills first**:

```bash
npx skills add yw662/rikka
```

This installs all 14 task-oriented skills (in the [agentskills.io](https://agentskills.io) format) into your agent's skill directory. Compatible with OpenCode, Claude Code, Codex, Cursor, and 67 more agents.

Manual fallback (if you can't use the CLI):

- **Skills index:** <https://github.com/yw662/rikka/tree/main/skills/rikka/SKILL.md>
- **llms.txt:** <https://yw662.github.io/rikka/llms.txt>
- **Homepage index:** <https://yw662.github.io/rikka/skills/index.html>
- **Browse on skills.sh:** <https://skills.sh>

These contain task-oriented guides (`reactive-state`, `dom-creation`, `signal-binding`, `custom-element`, `common-pitfalls`, etc.) that explain patterns and the most common LLM-specific mistakes. See also [`AGENTS.md`](./AGENTS.md) at the project root.

## 🏗️ Underlying Standards

### TC39 Signals API

Built on the [TC39 Signals proposal](https://github.com/tc39/proposal-signals) (**Stage 1**).

Once the proposal reaches Stage 4 and ships natively, `@takanashi/rikka-signal` can drop the polyfill with **zero API changes**.

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
| Unit Tests          | **1076** passing                     |
| Test Coverage       | Signal / DOM / Elements / Playground |
| Bundle Size (total) | **~16KB** gzip                       |
| Tree Shakeable      | Yes                                  |
| ESM Only            | Yes                                  |
| Side Effects        | None                                 |

## 🗺️ Roadmap

- **v0.2** (next) — SSR support, more demos, React/Vue integration guides
- **v0.5** — Component showcase, official template integrations
- **v1.0** — API stable, full documentation site, official design system

See [open issues](https://github.com/yw662/rikka/issues) for the full list.

## ❓ FAQ

**Q: How is this different from Lit?**
A: Rikka is built on TC39 Signals (a proposed standard) rather than a custom reactivity model. It's function-based with no base class, and every API is designed for full TypeScript inference. Lit is more mature with a larger ecosystem — if you need that today, use Lit.

**Q: Can I use Rikka in React/Vue/Angular/Svelte?**
A: Yes. Rikka produces standard Web Components, which work in any framework. For React, use `@lit/react` to wrap them.

**Q: Is Rikka production-ready?**
A: The core API is stable and the test suite has 1076 tests. Use it for new projects, evaluate carefully for existing projects.

**Q: What about SSR?**
A: Web Components SSR is evolving. Rikka works well for client-side rendering today. For SSR, follow the relevant TC39/CSSWG discussions.

## 🤝 Contributing

Rikka is open to contributions. Pick an issue tagged `good first issue` to start, or open a discussion for bigger changes. We use Changesets for versioning — PRs that change behavior should include a changeset.

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

## 🙏 Acknowledgments

- [TC39 Signals Proposal](https://github.com/tc39/proposal-signals) — Reactive primitives standard
- [signal-polyfill](https://github.com/tc39/proposal-signal-polyfill) — Signals polyfill implementation
- [Rslib](https://rslib.dev/) — Build tooling
- [happy-dom](https://github.com/capricorn86/happy-dom) — Test DOM environment

## 📄 License

[MIT](./LICENSE)
