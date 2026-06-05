# Control Flow

rikka-dom ships four reactive range helpers: `For` for lists, `Show` for visibility, `When` for binary branches, `Switch` / `Match` for multi-way. All cache their DOM so toggling does not rebuild elements.

## Imports

```typescript
import { For, Show, When, Switch, Match } from "@rikka/dom";
```

## `For(source, render, keyFn?): ReactiveRange`

Render a list from a `Signal.State<T[]>` or `Signal.Computed<T[]>`. Returns a range you can mount anywhere `Child` is accepted.

```typescript
import { signal } from "@rikka/signal";
import { For, li } from "@rikka/dom";

const items = signal(["a", "b", "c"]);
const list = For(items, (item) => li({}, item));
```

### Keyed rendering

Pass a `keyFn` to cache DOM by key, so updates only add/remove the changed items:

```typescript
const users = signal([{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }]);

For(
  users,
  (user) => li({}, user.name),
  (user) => user.id, // keyFn
);
```

Without a `keyFn`, caching is by reference (`Object.is`). Unused cached entries are cleaned up on each re-evaluation.

## `Show(condition, render): ReactiveRange`

Toggle visibility based on a signal. The element is created once and shown/hidden on subsequent toggles.

```typescript
import { signal } from "@rikka/signal";
import { Show, span } from "@rikka/dom";

const visible = signal(true);

Show(visible, () => span({}, "visible"));
// visible.set(false) → element removed from DOM
// visible.set(true)  → same element re-inserted
```

## `When(condition, trueRender, falseRender): ReactiveRange`

Two-branch conditional. Both branches are cached.

```typescript
import { signal } from "@rikka/signal";
import { When, span } from "@rikka/dom";

const loggedIn = signal(false);

When(
  loggedIn,
  () => span({}, "Welcome!"),
  () => span({}, "Please log in"),
);
```

## `Switch(value, ...cases)` and `Match(matcher, render)`

Multi-way matching. Each case DOM is cached. The first matching case is shown.

```typescript
import { signal } from "@rikka/signal";
import { Switch, Match, textarea, div } from "@rikka/dom";

const mode = signal("edit");

Switch(
  mode,
  Match("edit", () => textarea()),
  Match("preview", () => div({}, "Preview")),
  Match(
    (v) => v.startsWith("admin"),  // predicate form
    () => div({}, "Admin"),
  ),
);
```

`Match`'s `matcher` is either:

- A value — compared with `Object.is`
- A predicate function `(value: T) => boolean`

The last case acts as a fallback (no matcher, or always-true predicate).

## Nesting control flow

`For` / `Show` / `When` / `Switch` return a `ReactiveRange`, which is a valid `Child`. Compose freely:

```typescript
For(todos, (todo) =>
  Show(todo.done, () => s({}, todo.text), () => s({}, todo.text, " ✓"))
);
```

## Pitfalls

### 1. Plain array instead of signal

```typescript
// ❌ Static — list never updates
For(["a", "b", "c"] as any, (x) => li({}, x));

// ✅ Signal — list updates
For(signal(["a", "b", "c"]), (x) => li({}, x));
```

(rikka's type system catches this — `source` must be a `Signal.State<T[]>` or `Signal.Computed<T[]>`.)

### 2. Forgetting `keyFn` on a list with stable IDs

Without `keyFn`, caching is by reference. If your data is replaced wholesale (e.g. fetched fresh from an API), every item will be re-rendered. Use `keyFn` whenever your items have a stable identity:

```typescript
// Without keyFn: full re-render on each refresh
For(users, (u) => li({}, u.name));

// With keyFn: only changed items re-render
For(users, (u) => li({}, u.name), (u) => u.id);
```

### 3. Forgetting `()` after `() =>` in `Match`

```typescript
Switch(mode,
  Match("edit", () => textarea()),  // ✅ render function called
  Match("preview", textarea),       // ❌ passes the function reference, not its result
);
```

Always invoke the render function with `()`.

### 4. Using `Show` for two branches

```typescript
// ❌ Awkward — two `Show` blocks
Show(cond, () => A());
Show(computed(() => !cond.get()), () => B());

// ✅ Use `When`
When(cond, () => A(), () => B());
```

## See also

- [dom-creation.md](./dom-creation.md)
- [signal-binding.md](./signal-binding.md)
- [common-pitfalls.md](./common-pitfalls.md)
