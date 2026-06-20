# AGENTS.md

Guidance for AI coding agents (LLMs, IDE coding assistants, autonomous coders) working with the Rikka framework.

## If you're writing rikka code

The rikka skills are published in the [agentskills.io](https://agentskills.io) format — one folder per skill, each with a `SKILL.md` containing YAML frontmatter (`name` + `description`).

### Install via the `skills` CLI

```bash
npx skills add yw662/rikka
```

This installs all 14 skills into the agent's skill directory. They can also be browsed at <https://skills.sh> or read on the web at <https://yw662.github.io/rikka/skills/>.

### Loading strategy (manual)

If you can't use the CLI, read files directly:

- **Skills index:** <https://yw662.github.io/rikka/skills/overview/SKILL.md> — start here
- **llms.txt:** <https://yw662.github.io/rikka/llms.txt> — machine-readable index of all skills
- **Skills landing page:** <https://yw662.github.io/rikka/skills/index.html>
- **GitHub source:** <https://github.com/yw662/rikka/tree/main/skills>

There are 14 task-oriented skills, one folder each: `rikka/`, `overview/`, `reactive-state/`, `dom-creation/`, `signal-binding/`, `control-flow/`, `form-binding/`, `custom-element/`, `shadow-dom-styling/`, `template-binding/`, `composition/`, `svg/`, `browser-compatibility/`, `common-pitfalls/`.

1. Load `skills/rikka/SKILL.md` once for orientation, then load only the task-specific skill(s) for the current work.
2. Do not load all 14 files at once — context budget matters.
3. Before generating code, also load `skills/common-pitfalls/SKILL.md` to internalize the #1 LLM-specific mistakes (passing `.get()` to DOM, plain function vs `computed`, `this.count` vs `this.$count` granularity, etc.).

### The four rikka-specific footguns

These are the most common LLM errors. Internalize them before writing rikka code.

1. **Pass the signal, not `.get()`** to DOM children/attributes. `p({}, count)` is reactive; `p({}, count.get())` is static.
2. **Plain function vs `computed`** — function _children_ are auto-wrapped, but function _values_ (e.g. `inlineStyle` arguments) are not. Use `computed()` explicitly for value-position reactivity.
3. **`this.count` (coarse-grained) vs `this.$count` (fine-grained)** in `defineElement.render()` — `render` is wrapped in `computed`, so both are reactive. `this.count` re-runs the whole render (coarse-grained); `this.$count` updates only the bound DOM node (fine-grained, preferred). The old "static snapshot" footgun is gone.
4. **`events` values are transform functions** — `(e) => detail`, not `MouseEvent` type markers.

Full list with examples: <https://yw662.github.io/rikka/skills/common-pitfalls/SKILL.md>

## If you're working on this repository

This is the rikka monorepo. Four published packages live under `utils/`:

| Package                     | Path                    | Description                                                                                                                            |
| --------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `@takanashi/rikka-signal`   | `utils/rikka-signal/`   | Reactive primitives: `signal`, `computed`, `effect`                                                                                    |
| `@takanashi/rikka-dom`      | `utils/rikka-dom/`      | DOM creation: `h`, tag helpers, `For`/`Show`/`Switch`, `css`                                                                           |
| `@takanashi/rikka-elements` | `utils/rikka-elements/` | Custom Elements: `defineElement`, `event`, attribute specs                                                                             |
| `@takanashi/rikka-site`     | `utils/rikka-site/`     | Resource-oriented server: `ResourceKind` abstract class hierarchy, streaming bodies, Schema, Representation, content negotiation, auth |

Plus `components/rikka-live-playground/` (a web-component code playground), `docs/rikka-homepage/` (the marketing site), and `examples/blog-site/` (a rikka-site example).

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
  rikka-site/                 # resource-oriented server framework
components/                   # published web components
  rikka-live-playground/
docs/                         # documentation site source
  rikka-homepage/             # the marketing site (deployed to GitHub Pages)
  research/llm/               # LLM-friendliness design notes and benchmark
examples/                     # example projects
  blog-site/                  # rikka-site example with all 6 Kinds
scripts/                      # CI / test / typecheck scripts (browser-test paused, see scripts/browser-test.mjs)
skills/                       # 14 agentskills.io-format skills, one folder each
  rikka/                      # orientation skill (umbrella)
  overview/                   # what rikka is, packages, design principles
  reactive-state/             # signal, computed, effect, untracked
  dom-creation/               # h(), tag helpers, h`...`
  signal-binding/             # signals as children/attrs, fine-grained vs coarse
  control-flow/               # For, Show, When, Switch, Match
  form-binding/               # two-way binding for input/textarea/select
  custom-element/             # defineElement, attributes, events, methods, render
  shadow-dom-styling/         # css`...`, inlineStyle`...`, :host
  template-binding/           # {{name}} / {{@event}} in templates
  composition/                # composable functions + MyElement.h(...)
  svg/                        # SVG namespace, svg-prefixed tags
  browser-compatibility/      # polyfills, SSR, Light DOM fallback
  common-pitfalls/            # cross-cutting LLM mistakes
```

### When editing skills

The skills in `skills/<name>/SKILL.md` are the primary documentation consumed by coding agents. They follow the [agentskills.io](https://agentskills.io) spec (YAML frontmatter with `name` + `description`, body in Markdown). Keep them:

- **In English** (project convention).
- **Task-oriented, not package-oriented** — one topic per skill folder.
- **With explicit "Pitfalls" sections** — anti-patterns the LLM should avoid.
- **Cross-link via relative paths** — use `../other-skill/` to link to a sibling skill.
- **Frontmatter is required**: every `SKILL.md` must have `name` and `description` in the YAML header. The `description` is what the `skills` CLI and agent loaders display — phrase it as "when to use" guidance, not just "what it is".

After editing skills, the homepage `pnpm build` step copies the new layout into `dist/skills/<name>/SKILL.md` for serving. No manual sync required.

## Imports

Use the **scoped** package form (the published names):

```typescript
import { signal, computed, effect } from "@takanashi/rikka-signal";
import { h, div, button, For, Show } from "@takanashi/rikka-dom";
import { defineElement, event, StringAttr } from "@takanashi/rikka-elements";
import {
  Collection,
  Item,
  site,
  handleWebRequest,
  registerTransformer,
} from "@takanashi/rikka-site";
```

Unscoped forms like `rikka-signal` are not the published names.
