# Reactive State

All reactive state in rikka is a TC39 `Signal`. There are three core types: `signal`, `computed`, and `effect`.

## Imports

```typescript
import { signal, computed, effect } from "@rikka/signal";
```

## `signal(initialValue): Signal.State<T>`

A writable reactive container.

```typescript
const count = signal(0);

count.get(); // 0
count.set(5);
count.get(); // 5
```

Pass the **signal itself** (not `.get()`) when binding to DOM — that gives fine-grained updates. See [signal-binding.md](./signal-binding.md).

For nested or structured state, use a `signal` holding an object or array and update it immutably, or use separate signals per field.

## `computed(fn): Signal.Computed<T>`

A read-only derived signal. Dependencies are auto-tracked. Evaluation is lazy and cached until a dependency changes.

```typescript
import { signal, computed } from "@rikka/signal";

const count = signal(0);
const doubled = computed(() => count.get() * 2);

doubled.get(); // 0
count.set(5);
doubled.get(); // 10
```

`computed` is the only place you should call `.get()` to read inside an expression — it tells the signal graph "I depend on this".

## `effect(fn): () => void`

Runs `fn` immediately and re-runs it when any signal read inside changes. Returns a dispose function.

```typescript
import { signal, effect } from "@rikka/signal";

const count = signal(0);

const dispose = effect(() => {
  console.log("count is", count.get());
});
// logs: "count is 0"

count.set(5);
// (next microtask) logs: "count is 5"

dispose();
// subsequent sets do nothing
```

### Cleanup

`fn` may return a cleanup function. The cleanup runs:

1. Before the next re-execution (when a dependency changes again)
2. When `dispose()` is called

```typescript
const stop = effect(() => {
  const id = setInterval(() => console.log(count.get()), 1000);
  return () => clearInterval(id);
});
// later:
stop(); // interval is cleared
```

### Batching

Multiple synchronous `set` calls in the same microtask trigger only one re-run. The effect is queued via `queueMicrotask`.

### Error handling

Errors thrown inside `fn` are caught and logged to `console.error`. The effect will try again on the next dependency change.

## The full `Signal` namespace is re-exported

`signal-polyfill`'s `Signal` is available directly:

```typescript
import { Signal } from "@rikka/signal";

const s = new Signal.State(0);
const c = new Signal.Computed(() => /* ... */);
const w = new Signal.subtle.Watcher(() => /* ... */);
```

Most code should use the helper functions above. Reach for the raw namespace only when you need low-level control (e.g. building a custom reactive primitive).

## Pitfalls

### 1. Reading `.get()` outside `computed` / `effect` → static value

```typescript
const count = signal(0);
const value = count.get(); // plain number 0

p({}, value);  // ❌ never updates
p({}, count);  // ✅ updates
```

### 2. Writing to a computed signal

`Signal.Computed` has no `.set()`. If you need a writable derived value, use a regular `Signal.State` and update it from an `effect`.

### 3. Plain function confused with `computed`

This is the most common LLM error. A function and a `computed` look the same syntactically but behave differently in DOM bindings:

```typescript
// ❌ Plain function — NOT recognized as reactive
div({}, () => `count=${count.get()}`); // wait, this IS wrapped... see below

// ✅ Explicit computed — always works
div({}, computed(() => `count=${count.get()}`));
```

> **Note:** rikka-dom *does* auto-wrap function children as `computed`. But when a function is used as a value (e.g. for an `inlineStyle` argument, or a prop that expects a `Signal`), you MUST use `computed()`. See [signal-binding.md](./signal-binding.md#function-values-vs-computed).

### 4. `effect` without cleanup leaking listeners

If your effect subscribes to a global event source, return a cleanup function:

```typescript
effect(() => {
  const handler = () => console.log(count.get());
  window.addEventListener("resize", handler);
  return () => window.removeEventListener("resize", handler);
});
```

## See also

- [signal-binding.md](./signal-binding.md) — using signals in DOM
- [common-pitfalls.md](./common-pitfalls.md) — cross-cutting mistakes
