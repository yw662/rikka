# @takanashi/rikka-elements

Declarative Custom Elements with reactive attributes, event conversion, Shadow DOM, styles, and template binding. No decorators, no base class.

## Quick Start

```typescript
import { defineElement, NumberAttr } from "@takanashi/rikka-elements";
import { css, div, p, button } from "@takanashi/rikka-dom";

const MyCounter = defineElement("my-counter", {
  attributes: { count: { ...NumberAttr, default: 0 } },
  styles: css`:host { display: block; }`,
  render() {
    return div(
      p({}, this.$count),
      button({ onclick: () => this.count++ }, "+"),
    );
  },
});
```

## API

### `defineElement<C>(tagName, config?): ElementConstructor<C>`

Defines and registers a custom element. Returns the element constructor with a `.h` tag function.

All types are inferred from the config object:

| Config | Generated instance members |
|--------|---------------------------|
| `title: StringAttr` | `el.title: string`, `el.$title: Signal.State<string>` |
| `count: NumberAttr` | `el.count: number`, `el.$count: Signal.State<number>` |
| `active: BooleanAttr` | `el.active: boolean`, `el.$active: Signal.State<boolean>` |
| `click: (e) => detail` | `el.dispatchClick(detail?): boolean` |
| `reset: undefined` | `el.dispatchReset(): boolean` |

## Config Options

### `attributes`

Declares reactive properties backed by Signals. Each spec is an `AttributeSpec<T>` object with `toProp`, optional `toAttribute`, and optional `default`:

```typescript
attributes: {
  // Built-in specs
  count: { ...NumberAttr, default: 0 },  // number, defaults to 0
  name: StringAttr,                      // string, no default
  active: BooleanAttr,                   // boolean, HTML boolean attr semantics

  // Custom parser/serializer
  items: {
    toProp: (v) => (v ? v.split(",") : []),
    toAttribute: (v) => v?.join(","),
    default: [],
  },

  // Inline shape
  count: { toProp: (v) => (v !== undefined ? Number(v) : 0) },
}
```

If `toAttribute` is omitted, the default is `v == null ? undefined : String(v)`. Return `undefined`/`null` from `toAttribute` to remove the attribute from the DOM.

**Built-in specs:**

| Spec | `toProp` (string → T) | `toAttribute` (T → string) |
|------|----------------------|--------------------------|
| `StringAttr` | `attr ?? ""` | `prop` |
| `NumberAttr` | `Number(attr)` (returns `NaN` for `undefined`) | `prop == null ? undefined : String(prop)` |
| `BooleanAttr` | `attr !== undefined && attr !== null && attr !== "false"` | `prop ? "" : undefined` (HTML boolean: present or absent) |

Each attribute creates:
- `el.name` — getter/setter for raw value, setter syncs HTML attribute
- `el.$name` — underlying `Signal.State<T>` for reactive bindings

### `events`

Declares custom events. Values are **transform functions** `(DOM Event) => detail`:

```typescript
events: {
  click: (e: MouseEvent) => ({ x: e.clientX, y: e.clientY }),
  reset: undefined,  // void event with no detail
}
```

Each event generates `dispatchXxx(detail?)` and `onXxx` property. Method names use PascalCase: `value-changed` → `dispatchValueChanged`.

### `styles`

CSS injected via `adoptedStyleSheets` into the shadow root:

```typescript
styles: css`:host { display: block; }`,
styles: [css`:host { color: red; }`, css`:host { background: blue; }`],
```

### `template`

Pass an `HTMLTemplateElement` instead of `render`. Uses `{{}}` binding syntax:

| Syntax | Binding type | Behavior |
|--------|-------------|----------|
| `{{name}}` | Text | Checks `$name` signal first, falls back to raw value |
| `attr="{{name}}"` | Attribute | Reactive if value is a signal |
| `onclick="{{@action}}"` | Event dispatch | DOM event → transform → `dispatchAction(detail)` |

`template` and `render` are mutually exclusive.

### `shadow`

Controls Shadow DOM: `{ mode: 'open' }` (default), `{ mode: 'closed' }`, `false` (no Shadow DOM).

### `render`

Function mounted on prototype, called in `connectedCallback`. `this` is the element instance. Must return an `Element`.

### `methods`

Custom methods mounted on prototype. `this` is the element instance.

## Critical: this.xxx vs this.$xxx

In `render()`, `this.count` returns a raw number (static), while `this.$count` returns the `Signal.State<number>` (reactive):

```typescript
render() {
  // ❌ Static: won't update
  p({}, this.count);

  // ✅ Fine-grained: text node updates when count changes
  p({}, this.$count);

  return div(p({}, this.$count));
}
```

Use the `$`-prefix signal for DOM bindings; use the raw attribute value for non-reactive logic.

## Critical: events Values Are Transform Functions

```typescript
// ❌ Wrong: not a type marker
events: { click: MouseEvent }

// ✅ Correct: transform function (DOM Event → detail)
events: { click: (e: MouseEvent) => ({ x: e.clientX, y: e.clientY }) }

// ✅ Void event (no detail)
events: { reset: undefined }
```

## Critical: NumberAttr Defaults to NaN

`Number(undefined)` returns `NaN`. Use a `default` to avoid surprises:

```typescript
attributes: {
  count: { ...NumberAttr, default: 0 },
}
```

## Using in HTML

```html
<script type="module" src="./my-counter.js"></script>
<my-counter count="0"></my-counter>
```

## Using in rikka-dom

```typescript
const app = div(MyCounter.h({ count: 0 }));
```

## Full Documentation

- [Skills (umbrella)](https://github.com/yw662/rikka/tree/main/skills/rikka/SKILL.md) — start here
- [Overview](https://github.com/yw662/rikka/tree/main/skills/overview/SKILL.md)
- [Custom Element](https://github.com/yw662/rikka/tree/main/skills/custom-element/SKILL.md)
- [Template Binding](https://github.com/yw662/rikka/tree/main/skills/template-binding/SKILL.md)
- [Shadow DOM & Styling](https://github.com/yw662/rikka/tree/main/skills/shadow-dom-styling/SKILL.md)
- [Composition](https://github.com/yw662/rikka/tree/main/skills/composition/SKILL.md)
- [Browser Compatibility](https://github.com/yw662/rikka/tree/main/skills/browser-compatibility/SKILL.md)
- [Common Pitfalls](https://github.com/yw662/rikka/tree/main/skills/common-pitfalls/SKILL.md)

Install all 14 skills at once: `npx skills add yw662/rikka`
