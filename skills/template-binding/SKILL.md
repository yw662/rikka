---
name: template-binding
description: The `template` option of `defineElement` with `{{name}}` / `{{@event}}` binding syntax. Load this when the task is about writing declarative HTML templates inside a custom element, using `{{...}}` for text/attributes, or `{{@event}}` to dispatch custom events.
---

# Template Binding

The `template` option of `defineElement` lets you write the element's markup as an HTML string with `{{}}` binding syntax. `render()` and `template` are **mutually exclusive** — pick one.

## Imports

```typescript
import { defineElement, StringAttr } from "@takanashi/rikka-elements";
import { h } from "@takanashi/rikka-dom";
```

## Basic usage

```typescript
import { defineElement, StringAttr } from "@takanashi/rikka-elements";
import { h } from "@takanashi/rikka-dom";

defineElement("my-card", {
  attributes: { title: StringAttr, description: StringAttr },
  events: { action: (e) => e.detail },
  template: h`<template>
    <div class="card">
      <h2>{{title}}</h2>
      <p>{{description}}</p>
      <button onclick="{{@action}}">Action</button>
    </div>
  </template>`[0],
});
```

> The template must be a real `HTMLTemplateElement`. Get it from `h\`<template>...</template>\`[0]`.

## Binding syntax

| Syntax | Binding type | Behavior |
|--------|--------------|----------|
| `{{name}}` | Text | `textContent`; checks `$name` signal first, falls back to raw `name` |
| `attr="{{name}}"` | Attribute | `setAttribute`; reactive if value is a signal |
| `onclick="{{@action}}"` | Event dispatch | DOM event → transform function → `dispatchAction(detail)` |

### Text bindings — `{{name}}` auto-resolves

You only need to declare the attribute in `attributes`. The `{{name}}` placeholder auto-detects `$name` (signal) and uses it for fine-grained binding:

```typescript
defineElement("my-counter", {
  attributes: { clickCount: NumberAttr },
  template: h`<template>
    <p>Clicks: {{clickCount}}</p>
  </template>`[0],
});
```

This is equivalent to writing `render() { return p({}, this.$clickCount); }` manually.

The lookup order:

1. `this.$name` (signal, fine-grained)
2. `this.name` (raw value, static)

### Attribute bindings — `attr="{{name}}"`

```typescript
defineElement("my-input", {
  attributes: { placeholder: StringAttr, value: StringAttr },
  template: h`<template>
    <input placeholder="{{placeholder}}" value="{{value}}">
  </template>`[0],
});
```

If the bound expression is a signal, the attribute updates reactively.

### Event dispatch — `onclick="{{@action}}"`

The `{{@eventName}}` syntax dispatches a custom event. The DOM event is passed to the `events` transform function, and the result becomes the `detail`:

```typescript
defineElement("my-button", {
  events: {
    activate: (e: MouseEvent) => ({ x: e.clientX, y: e.clientY }),
  },
  template: h`<template>
    <button onclick="{{@activate}}">Activate</button>
  </template>`[0],
});

// Usage:
document.querySelector("my-button")!.onActivate = (ev) => {
  console.log("Activated at", ev.detail.x, ev.detail.y);
};
```

The `events` key in the config is the source of truth. The template's `{{@event}}` references it by name.

## Slots

`<slot>` elements in the template are projected from the host element's children:

```typescript
defineElement("my-card", {
  attributes: { title: StringAttr },
  template: h`<template>
    <div class="card">
      <h2>{{title}}</h2>
      <slot></slot>
    </div>
  </template>`[0],
});

// Usage:
const card = document.createElement("my-card");
card.setAttribute("title", "Hello");
card.innerHTML = "<p>Projected content</p>";
```

For named slots, use `<slot name="header">` and `slot="header"` on the children.

> Slots require Shadow DOM. With `shadow: false`, the `<slot>` element is left in the DOM but does not project children.

## When to use `template` vs `render`

Use **`template`** when:

- The markup is mostly static, with just a few bindings
- You prefer writing HTML over composing `h()` calls
- You want to declare a stable structure that survives data changes

Use **`render`** when:

- The structure itself depends on signals (e.g. different layouts for different modes)
- You need to compose with other `rikka-dom` helpers (`For`, `Show`, function children)
- You want full programmatic control

You can mix both — but only one per element.

## Pitfalls

### 1. Forgetting `[0]` on the template literal

```typescript
// ❌ `template` option expects HTMLTemplateElement, not Element[]
template: h`<template><div>...</div></template>`,

// ✅
template: h`<template><div>...</div></template>`[0],
```

### 2. `{{name}}` only works with declared attributes

The auto-detection works for **declared attributes** (`this.$name` from `attributes`). It does not resolve arbitrary nested paths:

```typescript
// ❌ `user` is not a defined attribute
template: h`<template><p>{{user.name}}</p></template>`[0];

// ✅ Compute the value into a declared attribute or use render() instead
```

### 3. Using `onclick` directly instead of `{{@event}}`

```typescript
// ❌ Standard DOM event handler, no custom event dispatched
template: h`<template><button onclick="alert('x')">Go</button></template>`[0];

// ✅ Dispatch a custom event using the events config
template: h`<template><button onclick="{{@go}}">Go</button></template>`[0],
events: { go: (e) => e.detail },
```

### 4. `events` key name vs `{{@event}}` name mismatch

The event name in the template must match the key in `events` (kebab-case preserved):

```typescript
events: { "value-change": (e) => /* ... */ },
template: h`<template><button onclick="{{@value-change}}">X</button></template>`[0],
//                          ^^^^^^^^^^^^^ must match exactly
```

### 5. Mixing `template` and `render`

```typescript
// ❌ Type error — mutually exclusive
defineElement("my-el", {
  template: h`<template>...</template>`[0],
  render() { return div(); },
});
```

## See also

- [../custom-element/](../custom-element/) — full `defineElement` reference
- [../signal-binding/](../signal-binding/) — fine-grained binding patterns
- [../shadow-dom-styling/](../shadow-dom-styling/) — `css\`\`` for templates
