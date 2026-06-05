# AGENTS.md

Guidance for AI coding agents (LLMs, IDE coding assistants, autonomous coders) working with the Rikka framework.

## If you're writing rikka code

Before generating any rikka code, **read the skills index**:

- **Skills index:** <https://yw662.github.io/rikka/skills/README.md>
- **llms.txt:** <https://yw662.github.io/rikka/llms.txt>
- **Skills landing page:** <https://yw662.github.io/rikka/skills/index.html>

These are 14 task-oriented markdown files covering: reactive state, DOM creation, signal binding, control flow, form binding, custom elements, shadow DOM & styling, template binding, composition, SVG, browser compatibility, and common pitfalls.

### Loading strategy

1. Read `https://yw662.github.io/rikka/skills/README.md` once to get the file map and decision tree.
2. Load only the topic files relevant to the current task. Do not load all 14 files at once — context budget matters.
3. Before generating code, also load `common-pitfalls.md` to internalize the #1 LLM-specific mistakes (passing `.get()` to DOM, plain function vs `computed`, `this.xxx` vs `this.$xxx`, etc.).

### The four rikka-specific footguns

These are the most common LLM errors. Internalize them before writing rikka code.

1. **Pass the signal, not `.get()`** to DOM children/attributes. `p({}, count)` is reactive; `p({}, count.get())` is static.
2. **Plain function vs `computed`** — function *children* are auto-wrapped, but function *values* (e.g. `inlineStyle` arguments) are not. Use `computed()` explicitly for value-position reactivity.
3. **`this.xxx` vs `this.$xxx`** in `defineElement.render()` — `this.count` is the raw number, `this.$count` is the signal. Use `$` for DOM bindings.
4. **`events` values are transform functions** — `(e) => detail`, not `MouseEvent` type markers.

Full list with examples: <https://yw662.github.io/rikka/skills/common-pitfalls.md>

## If you're working on this repository

This is the rikka monorepo. Three published packages live under `utils/`:

| Package | Path | Description |
|---------|------|-------------|
| `@rikka/signal` | `utils/rikka-signal/` | Reactive primitives: `signal`, `computed`, `effect` |
| `@rikka/dom` | `utils/rikka-dom/` | DOM creation: `h`, tag helpers, `For`/`Show`/`Switch`, `css` |
| `@rikka/elements` | `utils/rikka-elements/` | Custom Elements: `defineElement`, `event`, attribute specs |

Plus `components/rikka-live-playground/` (a web-component code playground) and `docs/rikka-homepage/` (the marketing site).

### Build & test

```bash
pnpm install
pnpm build                # builds all packages + homepage
pnpm test                 # unit tests
pnpm test:all             # full CI pipeline
pnpm typecheck            # typecheck only
pnpm homepage             # dev server for the marketing site
```

### Repo layout

```
utils/                        # published npm packages
  rikka-signal/
  rikka-dom/
  rikka-elements/
components/                   # published web components
  rikka-live-playground/
docs/                         # documentation site source
  rikka-homepage/             # the marketing site (deployed to GitHub Pages)
  rikka-skills/               # 14 markdown files, the agent-facing skill set
  research/llm/               # LLM-friendliness design notes and benchmark
examples/                     # example projects
scripts/                      # CI / test / typecheck scripts (browser-test paused, see scripts/browser-test.mjs)
```

### When editing skills

The skills in `docs/rikka-skills/` are the primary documentation consumed by coding agents. Keep them:

- **In English** (project convention).
- **Task-oriented, not package-oriented** — one topic per file.
- **With explicit "Pitfalls" sections** — anti-patterns the LLM should avoid.
- **Cross-link via relative paths** — never duplicate content across files.

After editing skills, the homepage `pnpm build` step copies the 14 files into `dist/skills/` for serving. No manual sync required.

## Imports

Use the **scoped** package form (the published names):

```typescript
import { signal, computed, effect } from "@rikka/signal";
import { h, div, button, For, Show } from "@rikka/dom";
import { defineElement, event, StringAttr } from "@rikka/elements";
```

Unscoped forms like `rikka-signal` are not the published names.
