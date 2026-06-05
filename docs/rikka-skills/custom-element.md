# Custom Elements

`defineElement` registers a real Custom Element. The returned constructor also exposes a `.h` tag function for embedding in `rikka-dom`.

## Imports

```typescript
import { defineElement, event, StringAttr, NumberAttr, BooleanAttr } from "@rikka/elements";
import { css, div, p, button } from "@rikka/dom";
```

## `defineElement(tagName, config?): ElementConstructor<C>`

```typescript
const MyCounter = defineElement("my-counter", {
  attributes: { count: { ...NumberAttr, default: 0 } },
  events: { change: (e: MouseEvent) => ({ x: e.clientX, y: e.clientY }) },
  styles: css`:host { display: block; padding: 16px; }`,
  render() {
    return div(p({}, this.$count), button({ onclick: () => this.count++ }, "+"));
  },
});
```

All instance types are inferred from `config`. No decorators, no base class, no manual `customElements.define` call.

## Config options

### `attributes` — reactive properties

Each spec is an `AttributeSpec<T>` with `toProp` (required), optional `toAttribute`, and optional `default`:

```typescript
attributes: {
  // Built-in specs
  name: StringAttr,                    // string, no default
  count: { ...NumberAttr, default: 0 }, // number, default 0
  active: BooleanAttr,                 // boolean, HTML semantics

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

**Built-in specs:**

| Spec | `toProp` (string → T) | `toAttribute` (T → string) |
|------|----------------------|---------------------------|
| `StringAttr` | `attr ?? ""` | `prop` |
| `NumberAttr` | `Number(attr)` (returns `NaN` for `undefined`) | `prop == null ? undefined : String(prop)` |
| `BooleanAttr` | `attr !== undefined && attr !== null && attr !== "false"` | `prop ? "" : undefined` (HTML boolean: present or absent) |

If `toAttribute` is omitted, default is `v == null ? undefined : String(v)`. Return `undefined` / `null` to remove the attribute from the DOM.

Each attribute generates two accessors on the instance:

| Accessor | Type | Use for |
|----------|------|---------|
| `el.name` | `T` (raw value) | Reading; non-reactive logic |
| `el.$name` | `Signal.State<T>` | DOM bindings — fine-grained reactive update |

```typescript
defineElement("my-el", {
  attributes: { count: NumberAttr },
  render() {
    // this.count → number (static)
    // this.$count → Signal.State<number> (reactive)

    p({}, this.$count); // ✅ fine-grained: text node updates
    // p({}, this.count); // ❌ static
  },
});
```

### `events` — custom events

Values are **transform functions** `(DOM Event) => detail`:

```typescript
events: {
  // Transform function: DOM event → custom event detail
  click: (e: MouseEvent) => ({ x: e.clientX, y: e.clientY }),

  // undefined: void event with no detail
  reset: undefined,

  // Extract form data
  submit: (domEvent) => {
    const form = (domEvent.target as HTMLElement).closest("form");
    return form ? Object.fromEntries(new FormData(form)) : null;
  },
}
```

Each event generates two members:

| Member | Purpose |
|--------|---------|
| `el.dispatchXxx(detail?)` | Dispatch a `CustomEvent` with the transformed detail |
| `el.onXxx` | Event handler property, auto-protected against infinite loops |

Method names use **PascalCase** for `dispatchXxx` and **camelCase** for `onXxx`:

```typescript
events: { "value-change": (e) => /* ... */ }
// el.dispatchValueChange(detail?)
// el.onValueChange = (ev) => /* ... */
```

`event<T>()` is a zero-cost type marker. Prefer writing the transform function directly — types are inferred:

```typescript
events: {
  // Inferable from the function — no event<T>() needed
  move: (e: MouseEvent) => ({ x: e.clientX, y: e.clientY }),
}
```

### `styles` — Shadow DOM styles

Injected via `adoptedStyleSheets`:

```typescript
styles: css`:host { display: block; }`,
styles: [css`:host { color: red; }`, css`:host { background: blue; }`],
```

See [shadow-dom-styling.md](./shadow-dom-styling.md).

### `template` — declarative template

Pass an `HTMLTemplateElement` instead of `render`. Use `{{name}}` / `{{@event}}` binding. See [template-binding.md](./template-binding.md).

`template` and `render` are mutually exclusive.

### `shadow` — Shadow DOM control

```typescript
shadow: { mode: "open" },  // default
shadow: { mode: "closed" },
shadow: false,             // no Shadow DOM
```

### `render` — function returning Element

Mounted on the prototype. `this` is the element instance. Called in `connectedCallback`, exactly once per element instance.

```typescript
defineElement("my-el", {
  attributes: { count: NumberAttr },
  render() {
    return div(p({}, () => `Count: ${this.count}`), button({ onclick: () => this.count++ }, "+"));
  },
});
```

`render` must return an `Element`, not a string.

### `methods` — custom methods

```typescript
defineElement("my-editor", {
  attributes: { code: StringAttr },
  methods: {
    run(this: any) { eval(this.code); },
    reset(this: any) { this.code = ""; },
  },
  render() {
    return div(textarea({ value: this.code }), button({ onclick: () => this.run() }, "Run"));
  },
});

// Usage:
const editor = document.createElement("my-editor") as InstanceType<typeof MyEditor>;
editor.run();
```

## Using the element

### In HTML

```html
<script type="module" src="./my-counter.js"></script>
<my-counter count="10"></my-counter>
```

### In TypeScript (with `rikka-dom`)

Use the `.h` tag function:

```typescript
const MyCounter = defineElement("my-counter", { /* ... */ });

div({ class: "page" }, MyCounter.h({ count: 0 }));
```

The `.h` function takes the same argument shape as `h()` for the element's declared `attributes` and `events`.

### With `createElement`

```typescript
const el = document.createElement("my-counter");
el.setAttribute("count", "0");
document.body.appendChild(el);
```

## Lifecycle

- `connectedCallback` runs `render` (or clones the `template`) **exactly once** per instance, guarded by an `initialized` flag. Moving the element elsewhere in the DOM does not re-render.
- `disconnectedCallback` automatically disposes `effect`s bound to the element.
- `attributeChangedCallback` is wired for every declared attribute, keeping `el.name` and `el.$name` in sync with the HTML attribute.

## Pitfalls

### 1. `events` value must be a transform function

```typescript
// ❌ Type marker — wrong
events: { click: MouseEvent }

// ✅ Transform function
events: { click: (e: MouseEvent) => ({ x: e.clientX, y: e.clientY }) }

// ✅ Void event
events: { reset: undefined }
```

### 2. `render()` must return an `Element`

```typescript
// ❌
render() { return "<p>Hello</p>"; }

// ✅
render() { return p({}, "Hello"); }
```

### 3. `this.count` (static) vs `this.$count` (reactive) in `render()`

Already mentioned twice. The TL;DR: use `this.$count` in DOM bindings.

### 4. `NumberAttr` default is `NaN`

```typescript
defineElement("my-el", {
  attributes: { count: NumberAttr },
  render() {
    return p({}, "Count: ", this.count); // "Count: NaN" if no attribute set
  },
});

// Fix:
attributes: { count: { ...NumberAttr, default: 0 } }
```

### 5. `connectedCallback` runs `render` only once

If you need re-rendering on attribute change, use a `template` with `{{name}}` bindings (auto-reactive) or wire up an `effect` manually.

### 6. Forgetting `customElements.define` order

rikka uses `queueMicrotask` to defer registration, so multiple `defineElement` calls in the same module work fine. But you still need the module to be loaded before `document.createElement("my-el")` is called.

## See also

- [shadow-dom-styling.md](./shadow-dom-styling.md) — `css\`\``, `adoptStyle`
- [template-binding.md](./template-binding.md) — `template` option
- [composition.md](./composition.md) — embedding custom elements
- [signal-binding.md](./signal-binding.md) — `this.$xxx` patterns
- [browser-compatibility.md](./browser-compatibility.md) — polyfills
