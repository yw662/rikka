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

- [Skills Index](https://yw662.github.io/rikka/skills/README.md) — start here
- [Overview](https://yw662.github.io/rikka/skills/overview.md)
- [Reactive State](https://yw662.github.io/rikka/skills/reactive-state.md)
- [Signal Binding](https://yw662.github.io/rikka/skills/signal-binding.md)
- [Common Pitfalls](https://yw662.github.io/rikka/skills/common-pitfalls.md)
