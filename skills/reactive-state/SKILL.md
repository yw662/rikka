---
name: reactive-state
description: How to create and use reactive state in rikka — `signal`, `computed`, `effect`, `untracked`. All built on TC39 Signals. Load this when the task is about defining state, derived values, side effects, batching, error handling, or avoiding feedback loops.
---

# Reactive State

All reactive state in rikka is a TC39 `Signal`. There are three core reactive primitives: `signal`, `computed`, and `effect`. One escape hatch: `untracked`.

## Imports

```typescript
import { signal, computed, effect, untracked } from "@takanashi/rikka-signal";
```

## `signal(initialValue): Signal.State<T>`

A writable reactive container.

```typescript
const count = signal(0);

count.get(); // 0
count.set(5);
count.get(); // 5
```

Pass the **signal itself** (not `.get()`) when binding to DOM — that gives fine-grained updates. See [../signal-binding/](../signal-binding/).

For nested or structured state, use a `signal` holding an object or array and update it immutably, or use separate signals per field.

## `computed(fn): Signal.Computed<T>`

A read-only derived signal. Dependencies are auto-tracked. Evaluation is lazy and cached until a dependency changes.

```typescript
import { signal, computed } from "@takanashi/rikka-signal";

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
import { signal, effect } from "@takanashi/rikka-signal";

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

Multiple synchronous `set` calls in the same microtask trigger only one re-run. The effect is queued via `queueMicrotask`. **There is no `batch()` function** — batching is automatic per microtask. If you need a custom boundary, schedule work with `queueMicrotask` or `Promise.resolve().then(...)`.

```typescript
const a = signal(0);
const b = signal(0);

effect(() => console.log(a.get(), b.get()));
// logs: "0 0"

a.set(1);
b.set(2);
// (next microtask) logs once: "1 2"
```

If you need a re-run *across* microtasks, you must split the work — e.g. set in one tick, set in the next — and accept the intermediate re-run.

### Error handling

Errors thrown inside `fn` are caught and logged to `console.error`. The effect will try again on the next dependency change.

## `untracked(fn): T`

Runs `fn` and returns its result, but signals read inside are **not** added as dependencies of the surrounding `computed` or `effect`.

```typescript
import { signal, effect, untracked } from "@takanashi/rikka-signal";

const count = signal(0);
const log = signal("");

effect(() => {
  // Subscribe to `log` only. Reading `count` here will NOT re-run this effect
  // when `count` changes.
  const snapshot = untracked(() => count.get());
  console.log(log.get(), "count was", snapshot);
});

count.set(99); // no re-run
log.set("done"); // re-runs
```

Use `untracked` when you want to read a signal's *current* value without subscribing to it — e.g. logging, deciding between two paths, or reading a "settings" signal that should not retrigger a heavy effect.

## The full `Signal` namespace is re-exported

`signal-polyfill`'s `Signal` is available directly:

```typescript
import { Signal } from "@takanashi/rikka-signal";

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

> **Note:** rikka-dom *does* auto-wrap function children as `computed`. But when a function is used as a value (e.g. for an `inlineStyle` argument, or a prop that expects a `Signal`), you MUST use `computed()`. See [../signal-binding/#function-values-vs-computed](../signal-binding/SKILL.md#function-values-vs-computed).

### 4. `effect` without cleanup leaking listeners

If your effect subscribes to a global event source, return a cleanup function:

```typescript
effect(() => {
  const handler = () => console.log(count.get());
  window.addEventListener("resize", handler);
  return () => window.removeEventListener("resize", handler);
});
```

### 5. Reaching for `untracked` to "fix" a feedback loop

If a signal change inside an `effect` triggers the same effect, you do **not** need `untracked` — you have a logical loop. Restructure the data flow: split state into "inputs you read" and "outputs you write", or move the writer into an event handler / user action. `untracked` is for *peeking*, not for breaking cycles.

## See also

- [../signal-binding/](../signal-binding/) — using signals in DOM
- [../common-pitfalls/](../common-pitfalls/) — cross-cutting mistakes
