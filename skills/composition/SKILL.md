---
name: composition
description: Composing rikka components — composable functions vs custom elements, and the `MyElement.h(...)` bridge that lets a custom element be embedded like a tag helper. Load this when the task is about splitting UI into reusable pieces, choosing between function components and `<my-tag>` elements, or embedding one custom element inside another.
---

# Composition

rikka has two complementary component styles, with a clean bridge between them.

## Imports

```typescript
import { defineElement } from "@takanashi/rikka-elements";
import { h, div, p, span, button } from "@takanashi/rikka-dom";
```

## Style 1: Composable functions

Any function that returns an `Element` is a component. No registration needed.

```typescript
import { div, p, span } from "@takanashi/rikka-dom";

const Card = (title: string, content: string) =>
  div({ class: "card" }, h({}, title), p({}, content));

const Badge = (label: string) => span({ class: "badge" }, label);

const App = div(
  { class: "container" },
  Card("Hello", "World"),
  Badge("New"),
);

document.body.appendChild(App);
```

Pros: zero ceremony, type inference is straightforward, easy to test in isolation.

Cons: no DOM-level identity (no `<my-card>` tag in HTML), no attribute API, no Shadow DOM.

## Style 2: Custom elements

Use `defineElement` to register a real Web Component.

```typescript
import { defineElement } from "@takanashi/rikka-elements";
import { div, p, button } from "@takanashi/rikka-dom";

const MyCounter = defineElement("my-counter", {
  attributes: { count: { ...NumberAttr, default: 0 } },
  render() {
    return div(
      p({}, this.$count),
      button({ onclick: () => this.count++ }, "+"),
    );
  },
});
```

Pros: real DOM identity, can be used from HTML, supports Shadow DOM, attributes / events / methods.

Cons: more boilerplate, requires registration timing.

## Bridge: `MyElement.h(...)` — use a custom element as a composable

The constructor returned by `defineElement` has a `.h` tag function with the same shape as `h()`:

```typescript
const MyCard = defineElement("my-card", {
  attributes: { title: StringAttr },
  render() { return div({}, this.$title); },
});

// In a composable function:
const App = () => div({ class: "page" },
  h({}, "Welcome"),
  MyCard.h({ title: "Hello" }),
);
```

`.h` accepts the element's declared attributes and event listeners (using `onXxx` for the camelCase form):

```typescript
MyCard.h(
  { title: "Hello" },
  // event listeners via the on* property:
  // (the on* form is the listener registration)
);
```

## Embedding custom elements with full attributes/events

```typescript
const MyCounter = defineElement("my-counter", {
  attributes: { count: NumberAttr },
  events: { change: (e) => /* detail */ },
  render() {
    return div(
      p({}, this.$count),
      button({ onclick: () => this.dispatchChange(this.count + 1) }, "+"),
    );
  },
});

const App = div(
  MyCounter.h({ count: 10, onChange: (e) => console.log("new count:", e.detail) }),
);
```

## Nesting custom elements

Custom elements can contain other custom elements, both via `render()` and via `template`:

```typescript
defineElement("user-page", {
  attributes: { userId: StringAttr },
  render() {
    return div(
      UserCard.h({ id: this.userId }),
      UserActions.h({ id: this.userId }),
    );
  },
});
```

## Mixing styles in the same app

Nothing forces a choice. Use composable functions for one-off helpers and custom elements for reusable primitives:

```typescript
const Header = (title) => h({ class: "header" }, h({}, title));

defineElement("dashboard-page", {
  render() {
    return div(
      Header("Dashboard"),
      StatsPanel.h({}),       // another custom element
      RecentActivity.h({}),   // another custom element
    );
  },
});
```

## Composing with control flow

Composable functions compose with `For`, `Show`, `When`, `Switch` like any other `Element`:

```typescript
const App = () => div({},
  For(items, (item) => Card(item.title, item.body)),
  Show(loggedIn, () => UserBadge.h({ name: "Alice" })),
);
```

## Pitfalls

### 1. Calling `MyElement.h()` as a function

```typescript
// ❌ `MyElement.h` is a tag function (lower-case `h` by convention), not the constructor
const el = MyElement.h({ count: 0 });

// ✅ Use it with `()` after the function call
//    (this is what we showed above — `.h` is a method, call it)
```

Wait, rephrasing: `.h` is a method on the constructor. Call it:

```typescript
const el = MyElement.h({ count: 0 }); // ✅ method call
const el = MyElement.h;               // ❌ reference, not invocation
```

### 2. Forgetting to register `defineElement` before use

If you create the element with `document.createElement("my-card")` in HTML or JS before the module that calls `defineElement("my-card", …)` has loaded, you'll get a plain `HTMLElement` (no `render`, no `$count`).

Solutions:

- Import the defining module at the top of the entry file.
- Use `import("@/my-card")` dynamically before creating instances.
- Use `<script type="module">` with a guaranteed load order.

### 3. Trying to access `this.$xxx` in a composable function

Composable functions are not Custom Elements — there is no `this` with `.$` accessors:

```typescript
const Card = (title) => div({}, title.$value); // ❌ title is just a string

// ✅ Pass values directly
const Card = (title) => div({}, title);
```

### 4. State in a composable function is not reactive

```typescript
// ❌ `count` is a plain number — UI never updates
const Counter = () => {
  let count = 0;
  return div(p({}, `Count: ${count}`), button({ onclick: () => count++ }, "+"));
};

// ✅ Use a signal
const Counter = () => {
  const count = signal(0);
  return div(
    p({}, "Count: ", count),
    button({ onclick: () => count.set(count.get() + 1) }, "+"),
  );
};
```

For stateful components that need lifecycle, use `defineElement` with attributes.

## See also

- [../custom-element/](../custom-element/) — full `defineElement` reference
- [../dom-creation/](../dom-creation/)
- [../reactive-state/](../reactive-state/) — signals in components
