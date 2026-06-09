# @takanashi/rikka-dom

Create real DOM elements with hyperscript `h()`. No virtual DOM.

## Quick Start

```typescript
import { div, p, button } from "@takanashi/rikka-dom";
import { signal } from "@takanashi/rikka-signal";

const count = signal(0);

const app = div(
  p("Count: ", count),
  button({ onclick: () => count.set(count.get() + 1) }, "+"),
);

document.body.appendChild(app);
```

## API

### `h(tag, attrs?, ...children): Element`

Creates a DOM element. Returns the element directly — no virtual DOM.

A child may be a function `() => Child`. It is auto-wrapped with `computed`, so signal reads inside it are tracked and the rendered value updates reactively:

```typescript
import { signal } from "@takanashi/rikka-signal";
import { div, span } from "@takanashi/rikka-dom";

const count = signal(0);

// Function child — reactive, equivalent to computed(() => `count=${count.get()}`)
div({}, () => `count=${count.get()}`);

// Conditional element from a function child
div({}, () => (visible.get() ? span("on") : null));
```

### `h\`...\`: Element[]`

HTML template literal with signal interpolation. Returns **Element array** (not a single element). Use `[0]` to get a single element.

Signal interpolation modes:

| Syntax | Mode | Behavior |
|--------|------|----------|
| `${signal}` | Fine-grained | Creates effect, updates only text node. Preserves focus/cursor/scroll |
| `${signal.get()}` | Lost reactivity | Immediately resolves to value |
| `computed(() => h\`...\`)` | Coarse-grained | Entire template rebuilds on change |

### Tag Helpers

Over 200 predefined tag functions covering every HTML, SVG, and MathML element (`div`, `span`, `p`, `a`, `button`, `input`, `form`, `ul`, `ol`, `li`, `h1`–`h6`, `svg`, `circle`, `path`, `math`, `mrow`, etc.) — same signature as `h()` but without the tag parameter. All return `Element` directly. HTML/SVG name collisions (`a`, `script`, `style`, `title`, `text`, `tspan`, `textPath`) have `svg`-prefixed variants for the SVG namespace.

### `For(source, render, keyFn?): ReactiveRange`

Renders a list from a signal array. With `keyFn`, DOM elements are cached by key for efficient updates.

### `Show(condition, render): ReactiveRange`

Conditional rendering. Caches DOM when toggling.

### `When(condition, trueRender, falseRender): ReactiveRange`

Two-branch conditional. Both branches cached.

### `Switch(value, cases, fallback?): ReactiveRange`

Multi-way matching. Each case cached. Use `Match(valueOrPredicate, render)` to define cases.

### `css\`...\`: CSSStyleSheet`

Tagged template creating `CSSStyleSheet`. For `defineElement` styles or `adoptedStyleSheets`. Supports signal interpolation and stylesheet merging.

### `inlineStyle\`...\`: Record<string, string>`

Tagged template creating inline style object. CSS property names auto-converted to camelCase. Supports signal interpolation.

## Two-Way Binding

For `<input>`, `<textarea>`, `<select>` with `value`, `checked`, or `selectedIndex` attributes, passing a writable signal automatically creates two-way binding:

```typescript
import { signal } from "@takanashi/rikka-signal";
import { input } from "@takanashi/rikka-dom";

const text = signal("");
input({ value: text }); // input event syncs back to signal
```

## SVG

SVG-specific tags are created in the SVG namespace automatically. For HTML/SVG name collisions (`a`, `script`, `style`, `title`, `text`, `span`, `textPath`), use the `svg`-prefixed versions:

```typescript
import { a, svga, svgtext } from "@takanashi/rikka-dom";

a({ href: "#" }, "HTML Link");      // HTMLAnchorElement
svga({ href: "#" }, "SVG Link");    // SVGAElement
svgtext({ x: 50, y: 55 }, "Text"); // SVGTextElement
```

## Critical: h\`\` Returns an Array

```typescript
// ❌ Wrong: elements is an array, not a Node
document.body.appendChild(h`<div>Hello</div>`);

// ✅ Correct: take [0]
document.body.appendChild(h`<div>Hello</div>`[0]);
```

## Full Documentation

- [Skills (umbrella)](https://github.com/yw662/rikka/tree/main/skills/rikka/SKILL.md) — start here
- [Overview](https://github.com/yw662/rikka/tree/main/skills/overview/SKILL.md)
- [DOM Creation](https://github.com/yw662/rikka/tree/main/skills/dom-creation/SKILL.md)
- [Signal Binding](https://github.com/yw662/rikka/tree/main/skills/signal-binding/SKILL.md)
- [Control Flow](https://github.com/yw662/rikka/tree/main/skills/control-flow/SKILL.md)
- [Form Binding](https://github.com/yw662/rikka/tree/main/skills/form-binding/SKILL.md)
- [SVG](https://github.com/yw662/rikka/tree/main/skills/svg/SKILL.md)
- [Common Pitfalls](https://github.com/yw662/rikka/tree/main/skills/common-pitfalls/SKILL.md)

Install all 14 skills at once: `npx skills add yw662/rikka`
