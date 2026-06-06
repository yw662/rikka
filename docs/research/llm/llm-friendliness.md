# Rikka LLM Friendliness

rikka's API design has LLM comprehensibility as one of its core goals. This document argues from a design perspective why rikka is friendly to LLM code generation and provides quantitative comparisons.

## 1. Minimal Concept Surface Area

When LLMs generate code, the fewer API candidates they face, the higher the probability of choosing the correct one.

**rikka core concepts: 13**

| Package | Concepts | Enumeration |
|---|---|---|
| `@takanashi/rikka-signal` | 3 | `signal`, `computed`, `effect` |
| `@takanashi/rikka-dom` | 7 | `h`, `For`, `Show`, `When`, `Switch`/`Match`, `css`, `inlineStyle` |
| `@takanashi/rikka-elements` | 2 | `defineElement`, `event` |
| Tag helpers | 1 | `div`/`p`/`button` etc. (~70 HTML/SVG tags) |

**Comparison with other frameworks' core concept counts**:

| Framework | Core Concepts | Key Concepts to Understand |
|------|-----------|-------------------|
| **rikka** | **13** | signal/get/set, computed, effect, h, tag helpers, For, Show/When/Switch, css, defineElement |
| React (hooks) | ~30+ | useState, useEffect, useRef, useMemo, useCallback, useContext, useReducer, useLayoutEffect, useImperativeHandle, useId, useSyncExternalStore, useTransition, useDeferredValue, memo, context, forwardRef, Suspense, ErrorBoundary, lazy, key, ref, JSX, virtual DOM, reconciliation, batching, strict mode, rules of hooks, deps array, stale closure |
| Vue 3 | ~25+ | ref, reactive, computed, watch, watchEffect, onMounted, onUnmounted, provide/inject, nextTick, defineComponent, defineProps, defineEmits, defineExpose, v-model, v-if/v-show/v-for, template ref, slot, teleport, suspense, transition, keep-alive, shallowRef, shallowReactive, toRef/toRefs |
| Solid | ~20 | createSignal, createEffect, createMemo, createStore, createResource, createRoot, onMount, onCleanup, For, Show, Switch/Match, Dynamic, Portal, ErrorBoundary, lazy, mergeProps, splitProps, useContext, createContext, children |

Fewer concepts means fewer decision tree branches for the LLM when generating code, and a higher probability of choosing the correct API.

## 2. Controlled Implicit — Predictable Behavior

rikka is not "zero implicit", but **controlled implicit**: implicit behaviors are only triggered within explicitly marked boundaries.

**Four controlled implicit rules**:

| Rule | Trigger Condition | Behavior | Comparison with React |
|------|---------|------|-----------|
| Type as boundary | Passing a `Signal` type | Automatically establishes reactive binding | React cannot distinguish controlled/uncontrolled |
| Read as subscription | Calling `.get()` | Automatically tracked as dependency | `useEffect` requires manual deps array declaration |
| Declaration as execution | Declaring config in `defineElement` | Automatically executes binding | Vue's `v-model` syntactic sugar implicitly generates event listeners |
| No hidden lifecycle | None | Everything driven by `effect` creation/destruction | React has useEffect cleanup, useLayoutEffect, useInsertionEffect — three timing phases |

**Concrete manifestations**:

- **Signal vs plain value — type system explicitly distinguishes**: The `Child` type in `h()` clearly defines `Signal.State<Child>` and plain `Child` as different branches. Pass a Signal → automatic reactivity; pass a plain value → one-time setup. No middle ground.
- **Two-way binding is an explicit whitelist**: Only three properties — `value`, `checked`, `selectedIndex` — combined with `WritableSignal` type trigger two-way binding.
- **Control flow has no hidden lifecycle**: `For`/`Show`/`When`/`Switch` have no `onMount`/`onUnmount`/`onCleanup`. All cleanup logic is handled uniformly by the `effect` dispose function.
- **effect dependencies are visible in code**: Every `.get()` call is a dependency point; you can grep to find all subscriptions.

Controlled implicit means the LLM doesn't need to understand "what side effect this API triggers under what conditions" — the rules are deterministic, and the trigger conditions are visible in the code.

## 3. Derivable Naming — 4 Rules Cover All APIs

All dynamically generated APIs in rikka follow deterministic naming rules. The LLM only needs to know 4 rules to derive all APIs:

| Rule | Input | Output | Example |
|------|------|------|------|
| Attribute → raw value | `attributes: { count }` | `el.count` | `el.count → number` |
| Attribute → signal | `attributes: { count }` | `el.$count` | `el.$count → Signal.State<number>` |
| Event → dispatch | `events: { 'value-change' }` | `el.dispatchValueChange()` | `dispatch` + PascalCase |
| Event → listen | `events: { 'value-change' }` | `el.onvalueChange` | `on` + camelCase |

Compared to React's event naming (`onClick` vs native `onclick`), Vue's directive naming (`v-model` vs `v-model:value` vs `v-model:xxx`), rikka's rules have **zero exceptions**.

Tag helpers have even zero derivation cost — HTML tag names are function names. `div` → `div()`, `button` → `button()`, `h1` → `h1()`.

Derivable = guessable = fewer documentation lookups. The LLM doesn't need to memorize every API name, just the rules.

## 4. Single Mental Model — Functions Return Values

rikka's core mental model has only one rule:

> **Functions return Elements, Signals drive updates.**

- Component = function that returns an Element
- Reactivity = Signal.get() / Signal.set()
- Side effects = effect()
- DOM updates = Signal change → effect auto-executes

Comparison with other frameworks' mental model complexity:

| Framework | Mental Model | Abstraction Layers |
|------|---------|---------|
| **rikka** | Function returns Element + Signal drives | 1 layer: Signal → DOM |
| React | Component = render function → Virtual DOM → Reconciliation → Commit → Real DOM | 3 layers: JSX → VDOM → DOM |
| Vue | Template compilation → Render function → Reactive proxy → VDOM patch → DOM | 4 layers: Template → Render Fn → Reactive Proxy → VDOM → DOM |
| Solid | JSX → Compile-time transform → Signal binding → DOM | 2 layers: JSX → Signal → DOM (but more compile-time magic) |

rikka has no Virtual DOM, no compile-time transforms, no template compilation. The call stack goes directly to browser native APIs:

```
User code → h() → document.createElement() → Element
User code → effect() → Signal.Computed → DOM operation
```

A single mental model means the LLM-generated code is less likely to "go off track" — no need to consider questions like "is this code executing in the render phase or the commit phase" or "which render cycle's value does this closure capture".

## 5. No-Gotcha Patterns — Common Bug Sources Eliminated by Design

| React/Vue Common Pitfall | How rikka Eliminates It |
|-------------------|---------------|
| **Stale closure**: `useEffect` captures old value | Doesn't exist: `.get()` inside `effect` always reads the latest value |
| **Hook call order**: Calling hooks conditionally causes crash | Doesn't exist: rikka has no call order constraints |
| **Deps array omission**: Forgetting to declare dependencies in `useEffect` | Doesn't exist: automatic tracking, no manual declaration needed |
| **Controlled/uncontrolled switching**: Input switching between controlled/uncontrolled | Doesn't exist: pass Signal for reactive, pass string for static — type determines behavior |
| **Key warning**: Missing keys in lists causes render anomalies | Optional: `For` caches by reference when no key, by key when key is provided — both are correct |
| **Ref forwarding**: `forwardRef` + `useImperativeHandle` | Not needed: Element is the real DOM, access directly |

Fewer pitfalls means a higher probability that LLM-generated code runs successfully on the first try. React's hooks rules (no conditional/loop calls, deps array must be correct) are where LLMs make the most mistakes, and rikka eliminates these pitfalls by design.

## 6. Documentation Token Efficiency

rikka's complete reference documentation `rikka-guide.md` is 759 lines, covering all framework functionality. This means:

- The entire framework reference can fit completely in the LLM context without truncation
- There's no problem of "documentation too long and truncated, causing the LLM to miss key information"
- Compared to React's official documentation (thousands of pages), the LLM can only see fragments

---

## Benchmark Verification

Through 7 progressively difficult UI tasks, the same LLM generated code using rikka / React / Solid respectively, evaluating first-run success rate.

### Without Documentation Context (Run 1)

| Metric | rikka | React | Solid |
|------|-------|-------|-------|
| **First-run success rate** | **6/7 (86%)** | **7/7 (100%)** | **7/7 (100%)** |
| **Total API misuses** | **1.5** | **0** | **0** |
| **Average LOC** | **33.6** | **31.0** | **30.3** |
| **Average feature completeness** | **95.7%** | **100%** | **100%** |

### With Documentation Context (Run 2)

| Metric | rikka | React | Solid |
|------|-------|-------|-------|
| **First-run success rate** | **7/7 (100%)** | **7/7 (100%)** | **7/7 (100%)** |
| **Total API misuses** | **0** | **0** | **0** |
| **Average LOC** | **21.4** | **23.1** | **21.4** |
| **Average feature completeness** | **100%** | **100%** | **100%** |

### Key Findings

- **Without documentation**: rikka's only failure (Task 7) was due to "function vs computed" confusion — the LLM used a plain function instead of `computed()` as a reactive value. This is a rikka-specific pitfall.
- **With documentation**: rikka succeeded on all tasks on first run, API misuses dropped to zero, and LOC was on par with React/Solid.
- **Effect of documentation context**: rikka-guide.md's 759-line documentation can fit entirely in the LLM context and eliminates all API misuses. React's official documentation is thousands of pages — the LLM can only see fragments.

See [rikka-llm-benchmark.md](./rikka-llm-benchmark.md) for detailed results.

---

## Summary

| # | Advantage | Quantitative Metric | LLM Impact |
|---|------|---------|------|
| 1 | **Minimal concept surface area** | 13 core concepts (React ~30+) | Fewer decision tree branches, higher probability of correct choice |
| 2 | **Controlled implicit** | 4 deterministic rules, zero exceptions | Predictable behavior, no need to guess side effects |
| 3 | **Derivable naming** | 4 naming rules cover all dynamic APIs | Fewer documentation lookups, guessable |
| 4 | **Single mental model** | 1 abstraction layer (Signal → DOM) | Low probability of code going off track |
| 5 | **No-gotcha patterns** | Eliminates 6 categories of common bug sources | High first-run success rate |
| 6 | **Documentation token efficiency** | 759 lines cover all functionality | Complete context can fit in LLM |
| 7 | **Benchmark verification** | 86% first-run success rate (6 of 7 tasks succeeded) | Empirical data support |
