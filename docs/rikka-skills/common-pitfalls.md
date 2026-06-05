# Common Pitfalls

Cross-cutting mistakes that recur across rikka code generation. Read this before generating rikka code; refer back when debugging.

## The four rikka-specific footguns

### 1. Passing `.get()` to DOM (loses reactivity)

```typescript
const count = signal(0);

// ❌ Static value — never updates
p({}, count.get());

// ✅ Pass the signal itself
p({}, count);
```

`.get()` returns a plain value. The DOM cannot track it. Pass the signal.

> **Inside `computed` / `effect` callbacks**, you **must** use `.get()`. That's how dependency tracking works:
>
> ```typescript
> computed(() => count.get() * 2) // ✅ reads via .get() inside the callback
> ```

### 2. Plain function where `computed` is required

This is the #1 LLM error. A function and a `computed` look identical but behave differently in **value position**:

```typescript
// Function as a child — auto-wrapped as computed
div({}, () => `count=${count.get()}`); // ✅ reactive

// Function as a value (e.g. inlineStyle arg, or attribute) — NOT auto-wrapped
div({ style: { color: () => count.get() % 2 ? "red" : "blue" } }); // ❌ static

// Use computed() explicitly for value-position reactivity
div({ style: { color: computed(() => count.get() % 2 ? "red" : "blue") } }); // ✅
```

Rule of thumb:

- **Child position** (inside `h()` or tag helpers): function → auto-wrapped, fine.
- **Value position** (attribute value, prop value, argument to another function): function → static, use `computed()`.

### 3. `this.xxx` (raw) vs `this.$xxx` (signal) in `render()`

```typescript
defineElement("my-el", {
  attributes: { count: NumberAttr },
  render() {
    p({}, this.count);   // ❌ static
    p({}, this.$count);  // ✅ reactive
  },
});
```

The `$`-prefix exposes the underlying `Signal.State`. Use it in DOM bindings.

### 4. `events` value must be a transform function, not a type marker

```typescript
// ❌ Type marker — wrong
events: { click: MouseEvent }

// ✅ Transform function (DOM Event → detail)
events: { click: (e: MouseEvent) => ({ x: e.clientX, y: e.clientY }) }

// ✅ Void event (no detail)
events: { reset: undefined }
```

## Signal interpolation modes (`h\`\``)

| Syntax | Mode | When to use |
|--------|------|-------------|
| `${signal}` | Fine-grained | Default. Only the text/attr node updates. Preserves focus, cursor, scroll. |
| `${signal.get()}` | Lost reactivity | When you intentionally want a static value. |
| `computed(() => h\`...\`)` | Coarse-grained | When the template **structure** itself depends on a signal. |

```typescript
const count = signal(0);

// ✅ Fine-grained: only the digit updates
h`<span>Count: ${count}</span>`;

// ❌ Static: "Count: 0" forever
h`<span>Count: ${count.get()}</span>`;

// Coarse: entire <span> rebuilds
const tmpl = computed(() => h`<span>Count: ${count.get()}</span>`);
```

## `h\`\`` returns `Element[]`, not a single element

```typescript
// ❌ TypeError: argument is not a Node
document.body.appendChild(h`<div>Hello</div>`);

// ✅ Take [0]
document.body.appendChild(h`<div>Hello</div>`[0]);
```

For `defineElement` templates, you need a real `HTMLTemplateElement` — `h\`<template>...</template>\`[0]`.

## `NumberAttr` default is `NaN`

`Number(undefined)` returns `NaN`. If you want a default of 0, say so:

```typescript
attributes: {
  count: { ...NumberAttr, default: 0 },
}
```

Or use a custom `toProp`:

```typescript
attributes: {
  count: { toProp: (v) => (v !== undefined ? Number(v) : 0) },
}
```

## `render()` must return an `Element`

```typescript
// ❌ Cannot return a string
render() { return "<p>Hello</p>"; }

// ✅
render() { return p({}, "Hello"); }
```

## `template` and `render` are mutually exclusive

```typescript
// ❌ Type error
defineElement("my-el", {
  template: h`<template>...</template>`[0],
  render() { return div(); },
});

// ✅ Pick one
```

## `connectedCallback` runs `render` exactly once

Moving the element in the DOM does not re-render. If you need updates on attribute change, use `template` with `{{name}}` bindings (auto-reactive) or wire up `effect`s manually.

## HTML/SVG name-collision tags

In an SVG context, use the `svg`-prefixed version for `a`, `script`, `style`, `title`, `text`, `span`, `textPath`:

```typescript
svg(svga({ href: "#x" }, "Link"), svgtext({ x: 10, y: 30 }, "Text"));
```

The unprefixed names (`a`, `script`, …) create HTML elements. See [svg.md](./svg.md).

## Don't use `innerHTML`

It bypasses the signal system, has XSS risk, and prevents binding:

```typescript
// ❌
el.innerHTML = `<div>${title}</div>`;

// ✅
el.replaceChildren(div({}, title));
```

## Don't bind directly to a `computed` signal

`Signal.Computed` has no `.set()`. For two-way binding (e.g. inputs), use a writable `Signal.State` plus a `computed` for derived values:

```typescript
// ❌ Type error
input({ value: computed(() => "hello") });

// ✅ Writable signal
const text = signal("");
input({ value: text });

// ✅ Derived value
const len = computed(() => text.get().length);
```

## Avoid state in composable functions

A plain function component cannot hold reactive state across renders — its locals are re-created on every call:

```typescript
// ❌ `count` resets on every call
const Counter = () => {
  let count = 0;
  return div(p({}, count), button({ onclick: () => count++ }, "+"));
};

// ✅ Signal at module scope
const Counter = () => {
  const count = signal(0);
  return div(p({}, count), button({ onclick: () => count.set(count.get() + 1) }, "+"));
};
```

For real lifecycle (mount / unmount / re-render on attribute change), use `defineElement`.

## `customElements.define` ordering

rikka uses `queueMicrotask` to defer registration, so multiple `defineElement` calls in the same module work. But the module must be **loaded** before any `document.createElement("my-el")` runs.

If the defining module loads asynchronously, custom elements may briefly exist as plain `HTMLElement`s with no `.$xxx` accessors. Import the defining module at the top of the entry file, or use dynamic `import()` before creating instances.

## See also

- [reactive-state.md](./reactive-state.md) — signals, computed, effect
- [signal-binding.md](./signal-binding.md) — fine-grained vs coarse-grained
- [form-binding.md](./form-binding.md) — two-way binding
- [custom-element.md](./custom-element.md) — `defineElement` config
- [template-binding.md](./template-binding.md) — `{{name}}` / `{{@event}}`
