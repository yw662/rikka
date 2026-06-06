# DOM Creation

`h()` and tag helpers create **real `Element` objects** — no virtual DOM, no factory, no second call. Append the result directly to the DOM.

## Imports

```typescript
import { h, div, p, button, span, For, Show, When, Switch, Match, css, inlineStyle } from "@takanashi/rikka-dom";
```

## `h(tag, attrs?, ...children): Element`

```typescript
import { h } from "@takanashi/rikka-dom";

const el = h("div", { class: "container" }, h("p", "Hello"));
// el instanceof HTMLDivElement === true

document.body.appendChild(el);
```

The first argument can be:

- A string tag name (`"div"`, `"my-element"`, …)
- A custom element constructor (see [composition.md](./composition.md))

The optional second argument is an attrs object. Remaining arguments are children.

## Tag helpers

69 pre-defined tag functions share the same signature as `h()` minus the tag parameter. They return real `Element`:

```typescript
import { div, p, button, span, input } from "@takanashi/rikka-dom";

const card = div(
  { class: "card" },
  h2({}, "Title"),
  p({}, "Body"),
  button({ onclick: () => alert("clicked") }, "OK"),
);

document.body.appendChild(card);
```

The full set:

| Group | Tags |
|-------|------|
| HTML | `div`, `span`, `p`, `a`, `button`, `input`, `form`, `ul`, `ol`, `li`, `h1`–`h6`, `header`, `footer`, `main`, `section`, `nav`, `article`, `aside`, `img`, `table`, `thead`, `tbody`, `tr`, `th`, `td`, `label`, `select`, `option`, `textarea`, `pre`, `code`, `br`, `hr`, `slot`, `template` |
| SVG | `svg`, `circle`, `path`, `rect`, `line`, `polygon`, `polyline`, `g`, `defs`, `use`, `foreignObject`, `clipPath`, `pattern`, `marker`, `mask`, `image`, `linearGradient`, `radialGradient`, `stop`, `symbol`, `filter`, `ellipse` |
| SVG-prefixed (HTML/SVG name collisions) | `svga`, `svgscript`, `svgstyle`, `svgtitle`, `svgtext`, `svgspan`, `svgtextPath` |

See [svg.md](./svg.md) for namespace handling.

## `h\`html\`: Element[]` (template literal)

HTML template literal with signal interpolation. **Returns an `Element[]`, not a single element.** Use `[0]` to get a single element.

```typescript
import { h } from "@takanashi/rikka-dom";
import { signal } from "@takanashi/rikka-signal";

const name = signal("World");
const elements = h`<span>Hello ${name}!</span>`;
// elements[0] instanceof HTMLSpanElement === true

document.body.appendChild(elements[0]);
```

### Signal interpolation modes

| Syntax | Mode | Behavior |
|--------|------|----------|
| `${signal}` | Fine-grained | Creates an effect; only the text/attr node updates. Preserves focus, cursor, scroll position. |
| `${signal.get()}` | Lost reactivity | Resolved immediately to a static value. |
| `computed(() => h\`...\`)` | Coarse-grained | Entire template rebuilds when a dependency changes. |

```typescript
const count = signal(0);

// ✅ Fine-grained: only the digit updates
h`<span>Count: ${count}</span>`;

// ❌ Static: "Count: 0" forever
h`<span>Count: ${count.get()}</span>`;

// Coarse-grained: entire <span> rebuilds (use for structural changes)
const tmpl = computed(() => h`<span>Count: ${count.get()}</span>`);
```

Attribute interpolation works the same way:

```typescript
const color = signal("red");
h`<div style="color: ${color}">Text</div>`;
// color change → style attribute updates
```

### Getting an `HTMLTemplateElement`

Use `h\`<template>...</template>\`[0]` to get a real `HTMLTemplateElement` for `defineElement`'s `template` option:

```typescript
const tmpl = h`<template><div>{{name}}</div></template>`[0];
tmpl instanceof HTMLTemplateElement; // true
tmpl.content;                         // DocumentFragment containing <div>
```

## Mounting the app

`h()` returns a real `Element`, so use standard DOM APIs:

```typescript
import { div, p, button } from "@takanashi/rikka-dom";
import { signal } from "@takanashi/rikka-signal";

const count = signal(0);

const app = div(
  {},
  p({}, "Count: ", count),
  button({ onclick: () => count.set(count.get() + 1) }, "+"),
);

document.body.appendChild(app);
```

`rikka-dom` also exports `applyChild` for cases where you need to apply a child without `appendChild` (e.g. tests):

```typescript
import { applyChild } from "@takanashi/rikka-dom";

const container = document.getElementById("app");
if (container) applyChild(container, app);
```

## Children

The `Child` type accepts: `null | string | number | Element | DocumentFragment | ReactiveRange | Signal.State<Child> | Signal.Computed<Child> | Child[] | Signal.State<Child[]> | Signal.Computed<Child[]> | (() => Child)`.

The interesting case is the function — it's auto-wrapped as `computed` so any `.get()` inside is tracked. See [signal-binding.md](./signal-binding.md#function-children) for details.

```typescript
const count = signal(0);

// Function child — equivalent to computed(() => `count=${count.get()}`)
div({}, () => `count=${count.get()}`);

// Function returning null clears the content
const visible = signal(true);
div({}, () => (visible.get() ? span({}, "on") : null));
```

## Namespace handling

rikka-dom auto-selects the namespace based on tag name:

- HTML tags → `http://www.w3.org/1999/xhtml`
- SVG-only tags (`circle`, `path`, `g`, …) → `http://www.w3.org/2000/svg`
- MathML-only tags → `http://www.w3.org/1998/Math/MathML`
- Name-collision tags (`a`, `script`, `style`, `title`, `text`, `span`, `textPath`) → use the `svg` prefix in SVG context: `svga`, `svgscript`, `svgstyle`, `svgtitle`, `svgtext`, `svgspan`, `svgtextPath`

See [svg.md](./svg.md).

## Pitfalls

### 1. `h\`\`` returns an array

```typescript
// ❌ TypeError: argument is not a Node
document.body.appendChild(h`<div>Hello</div>`);

// ✅ Take [0]
document.body.appendChild(h`<div>Hello</div>`[0]);
```

### 2. `NumberAttr` default is `NaN` (not `0`)

`Number(undefined)` returns `NaN`. If you want a default, declare it:

```typescript
defineElement("my-el", {
  attributes: { count: { ...NumberAttr, default: 0 } },
});
```

Or use a custom `toProp`:

```typescript
attributes: {
  count: { toProp: (v) => (v !== undefined ? Number(v) : 0) },
}
```

### 3. Never use `innerHTML`

It bypasses the signal system, has XSS risk, and prevents binding:

```typescript
// ❌ No reactivity, XSS-prone
el.innerHTML = `<div>${title}</div>`;

// ✅
el.replaceChildren(div({}, title));
```

### 4. Plain function as a value (not a child) is NOT reactive

Function *children* are auto-wrapped as `computed`, but function *values* (e.g. as an attribute, or in `inlineStyle` arg) are not:

```typescript
// ✅ Function child — auto-wrapped
div({}, () => `count=${count.get()}`);

// ❌ Plain function in inlineStyle — NOT reactive
div({ style: { color: () => count.get() % 2 ? "red" : "blue" } });

// ✅ Use computed() for value-position reactivity
div({ style: { color: computed(() => count.get() % 2 ? "red" : "blue") } });
```

See [signal-binding.md](./signal-binding.md#function-values-vs-computed).

## See also

- [signal-binding.md](./signal-binding.md) — putting signals into the DOM
- [control-flow.md](./control-flow.md) — `For`, `Show`, `When`, `Switch`
- [form-binding.md](./form-binding.md) — two-way binding inputs
- [svg.md](./svg.md) — SVG markup
- [common-pitfalls.md](./common-pitfalls.md)
