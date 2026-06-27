# @takanashi/rikka-signal

Fine-grained reactive primitives built on the [TC39 Signals proposal](https://github.com/tc39/proposal-signals).

## Quick Start

```typescript
import { signal, computed, effect } from "@takanashi/rikka-signal";

const count = signal(0);
const doubled = computed(() => count.get() * 2);

effect(() => console.log(doubled.get())); // 0
count.set(5);                             // 10
```

## API

### `signal<T>(initialValue): Signal.State<T>`

Creates a writable signal. `.get()` reads, `.set()` writes.

### `computed<T>(fn): Signal.Computed<T>`

Creates a derived signal. Auto-tracks dependencies, lazy evaluation, cached until dependencies change.

### `effect(fn): () => void`

Runs `fn` immediately, re-runs when dependencies change. Returns a dispose function. Callback may return a cleanup function. Multiple synchronous `set`s in the same microtask trigger only one re-run.

The callback receives an `AbortSignal` that is aborted when the effect is about to re-run or when the dispose function is called. Pass it to `fetch(url, { signal })` to cancel in-flight requests without managing your own `AbortController`:

```typescript
effect((signal) => {
  const id = userId.get();
  fetch(`/api/user/${id}`, { signal })
    .then(r => r.json())
    .then(data.set);
});
```

### `resource(fetcher): Resource<T>`
### `resource(source, fetcher): Resource<T>`

Creates a reactive handle on an async value, inspired by Solid's `createResource`. Returns four independent signals — `value`, `state`, `error`, `loading` — plus `refetch()`, `mutate()`, and `dispose()`.

```typescript
import { signal, resource } from "@takanashi/rikka-signal";

const userId = signal(1);
const user = resource(userId, (id, { signal }) =>
  fetch(`/api/user/${id}`, { signal }).then(r => r.json()),
);

user.value.get();    // undefined, then the user object
user.loading.get();  // true, then false
user.state.get();    // "pending" → "ready"

userId.set(2);       // aborts the fetch for id=1, starts fetching id=2
user.refetch();      // re-runs with the current source value
user.mutate({ ...user.value.get(), name: "patched" }); // optimistic update
user.dispose();      // stops tracking, aborts in-flight fetch
```

Each field is a separate `Signal.Computed`, so DOM bindings that read `value` won't re-evaluate when only `loading` changes:

```typescript
import { div } from "@takanashi/rikka-dom";

div({}, user.value);                       // updates when data arrives
div({ class: { loading: user.loading } }); // updates when loading toggles
```

The fetcher receives a `FetchInfo` object with `refetching` (true when triggered by `refetch()`) and `signal` (an `AbortSignal` aborted on source change, refetch, or dispose).

## Critical: Signals vs Raw Values

**This is the #1 source of bugs in rikka.** Pass signals to DOM bindings, not plain values:

```typescript
import { p } from "@takanashi/rikka-dom";

const count = signal(0);

// ✅ Fine-grained: text node updates when count changes
p({}, count);

// ❌ Static: never updates, always shows initial value
p({}, count.get());
```

Inside `computed` and `effect` callbacks, you **must** use `.get()` to read values.

## Re-exports

`Signal` namespace from `signal-polyfill` is re-exported, providing `Signal.State`, `Signal.Computed`, and `Signal.subtle.Watcher`.

## Full Documentation

- [Skills (umbrella)](https://github.com/yw662/rikka/tree/main/skills/rikka/SKILL.md) — start here
- [Overview](https://github.com/yw662/rikka/tree/main/skills/overview/SKILL.md)
- [Reactive State](https://github.com/yw662/rikka/tree/main/skills/reactive-state/SKILL.md)
- [Signal Binding](https://github.com/yw662/rikka/tree/main/skills/signal-binding/SKILL.md)
- [Common Pitfalls](https://github.com/yw662/rikka/tree/main/skills/common-pitfalls/SKILL.md)

Install all 14 skills at once: `npx skills add yw662/rikka`
