# Rikka LLM Coding Benchmark

Using the same LLM and prompt template, implement the same UI tasks with rikka / React / Solid respectively, measuring first-run correctness.

## Evaluation Dimensions

| Dimension | Definition | Scoring |
|------|------|------|
| **First-run success** | Generated code runs without manual modification | ✅/❌ |
| **API misuse count** | Using non-existent APIs, incorrect call signatures, violating framework rules | Count |
| **Lines of code** | Code lines excluding blank lines and comments | Numeric |
| **Feature completeness** | How many requirement features are implemented | Percentage |

## Task Set

### Task 1: Counter (Basic Reactivity)

**Requirements**: A counter that displays the current value, with +1 and -1 buttons.

**Evaluation points**: State creation, event binding, text update

---

### Task 2: Todo List (List + Form)

**Requirements**:
- Input box + add button, add todo items
- Each item has text and a delete button
- Display remaining count

**Evaluation points**: List rendering, form two-way binding, array operations

---

### Task 3: Filtered List (Derived State)

**Requirements**:
- A set of users `{ id, name, role }`
- Dropdown to filter by role (all / admin / user)
- Display filtered list
- Display filtered count

**Evaluation points**: Derived computation, conditional filtering, Signal/state composition

---

### Task 4: Tab Switcher (Conditional Rendering)

**Requirements**:
- 3 tabs (Profile / Settings / About)
- Click tab to switch content panel
- Current tab highlighted

**Evaluation points**: Conditional rendering, state switching

---

### Task 5: Custom Element (Component Encapsulation)

**Requirements**:
- Define a `<user-card>` component
- Attributes: name (string), age (number)
- Display in "Name (age)" format
- Dispatch `user-select` event on click, with detail `{ name, age }`
- Use 2 `<user-card>` instances on the page

**Evaluation points**: Component definition, attribute declaration, event dispatch, component usage

---

### Task 6: Reactive Form (Two-way Binding + Validation)

**Requirements**:
- Email input with real-time format validation
- Password input with real-time strength display (weak/medium/strong)
- Submit button, clickable only when validation passes
- Display success message after submission

**Evaluation points**: Two-way binding, computed derivation, conditional rendering

---

### Task 7: Theme Switcher (Global State + Styling)

**Requirements**:
- Light/dark toggle button
- Toggle affects page background color and text color
- Persist current theme to localStorage
- Restore from localStorage on page load

**Evaluation points**: effect side effects, Signal-driven styling, persistence

---

## Prompt Template

For each task, use the following unified prompt:

```
Using {framework}, implement the following UI component:

{task_description}

Requirements:
- Use only {framework} APIs
- No external UI libraries
- TypeScript
- The code should be a complete, runnable module

Output only the code, no explanations.
```

## Scoring Rules

### First-run Success (0 or 1 point)

Place the code into the corresponding framework's empty project, make no modifications, and check whether it runs correctly and displays the correct functionality.

### API Misuse (Negative Scoring)

| Misuse Type | Example | Deduction |
|---------|------|------|
| Non-existent API | Calling `useSignal()` in React | -1 |
| Incorrect call signature | `signal.set` instead of `signal.set()` | -1 |
| Violating framework rules | React hooks called conditionally | -1 |
| Concept confusion | Passing `.get()` to DOM in rikka | -1 |
| Missing import | Using an API without importing it | -0.5 |

### Lines of Code

Excluding blank lines and comments, pure logic code lines. Fewer is better.

### Feature Completeness

Each task's feature points are scored independently; implementing all = 100%.

---

## Benchmark Results (Run 1)

### Per-Task Analysis

#### Task 1: Counter

| Framework | First-run Success | API Misuses | LOC | Feature Completeness | Notes |
|------|------------|---------|-----|-----------|------|
| rikka | ✅ | 0 | 20 | 100% | Imported unused `computed`, does not affect runtime |
| React | ✅ | 0 | 12 | 100% | |
| Solid | ✅ | 0 | 12 | 100% | |

#### Task 2: Todo List

| Framework | First-run Success | API Misuses | LOC | Feature Completeness | Notes |
|------|------------|---------|-----|-----------|------|
| rikka | ✅ | 0 | 35 | 100% | `input({ value: newText })` correctly uses two-way binding |
| React | ✅ | 0 | 30 | 100% | |
| Solid | ✅ | 0 | 30 | 100% | `value={input()}` + `onInput` correct |

#### Task 3: Filtered List

| Framework | First-run Success | API Misuses | LOC | Feature Completeness | Notes |
|------|------------|---------|-----|-----------|------|
| rikka | ✅ | 0 | 35 | 100% | `select({ value: roleFilter })` correctly uses two-way binding |
| React | ✅ | 0 | 30 | 100% | |
| Solid | ✅ | 0 | 35 | 100% | |

#### Task 4: Tab Switcher

| Framework | First-run Success | API Misuses | LOC | Feature Completeness | Notes |
|------|------------|---------|-----|-----------|------|
| rikka | ✅ | 0 | 35 | 100% | Uses `computed` to drive class and content switching |
| React | ✅ | 0 | 25 | 100% | |
| Solid | ✅ | 0 | 30 | 100% | |

#### Task 5: Custom Element / Component

| Framework | First-run Success | API Misuses | LOC | Feature Completeness | Notes |
|------|------------|---------|-----|-----------|------|
| rikka | ✅ | 0.5 | 30 | 100% | events declaration uses `() => undefined as any` instead of `event<T>()`, functionally correct but not idiomatic |
| React | ✅ | 0 | 35 | 100% | |
| Solid | ✅ | 0 | 30 | 100% | |

#### Task 6: Reactive Form

| Framework | First-run Success | API Misuses | LOC | Feature Completeness | Notes |
|------|------------|---------|-----|-----------|------|
| rikka | ✅ | 0 | 40 | 100% | `input({ value: email })` two-way binding correct, `computed` drives validation and styling correctly |
| React | ✅ | 0 | 45 | 100% | |
| Solid | ✅ | 0 | 40 | 100% | |

#### Task 7: Theme Switcher

| Framework | First-run Success | API Misuses | LOC | Feature Completeness | Notes |
|------|------------|---------|-----|-----------|------|
| rikka | ❌ | 1 | 40 | 70% | **Critical error**: Used `() => theme.get() === "dark" ? ... : ...` plain function as style value instead of `computed()`. Plain functions are not recognized as Signals by h(), so styles won't update reactively. Should be changed to `computed(() => ...)` |
| React | ✅ | 0 | 40 | 100% | |
| Solid | ✅ | 0 | 35 | 100% | |

### Summary

| Metric | rikka | React | Solid |
|------|-------|-------|-------|
| **First-run success rate** | **6/7 (86%)** | **7/7 (100%)** | **7/7 (100%)** |
| **Total API misuses** | **1.5** | **0** | **0** |
| **Average LOC** | **33.6** | **31.0** | **30.3** |
| **Average feature completeness** | **95.7%** | **100%** | **100%** |

### rikka Misuse Analysis

| Task | Misuse Type | Description | Root Cause |
|------|---------|------|------|
| Task 5 | Non-idiomatic usage | `events: { "user-select": () => undefined as any }` should use `event<{ name: string; age: number }>()` | LLM unsure about event type declaration syntax |
| Task 7 | Concept confusion | Used plain function `() => value` instead of `computed(() => value)` as reactive style value | LLM confused "function" with "computed signal" — similar form but different semantics |

### Key Findings

1. **rikka matches React/Solid on simple tasks**: Task 1-4 all succeeded on first run with no API misuses.
2. **rikka's main pitfall is "function vs computed" confusion**: This is a rikka-specific concept — plain functions and `computed()` have similar code form (both are `() => expr`), but only `computed()` returns a Signal that can be recognized as a reactive value by `h()`.
3. **React/Solid had no API misuses in this test**: But this doesn't mean they produce fewer errors in real development — React's stale closure, hooks rules, and other pitfalls only appear in more complex scenarios.
4. **rikka code is slightly longer**: Mainly because function call syntax is more verbose than JSX (each element needs `div({}, ...)` instead of `<div>...</div>`), and the LLM tends to add decorative styling.

---

## Benchmark Results (Run 2 — with rikka-guide context)

Run 2 在 rikka 的 prompt 中加入了 rikka-guide.md 的关键规则摘要（包括新增的"陷阱 #9：响应式值必须用 computed()"），模拟 LLM 拥有完整文档上下文的真实使用场景。

### Per-Task Analysis

#### Task 1: Counter

| Framework | First-run Success | API Misuses | LOC | Feature Completeness | Notes |
|------|------------|---------|-----|-----------|------|
| rikka | ✅ | 0 | 10 | 100% | 极简实现，无多余样式 |
| React | ✅ | 0 | 12 | 100% | |
| Solid | ✅ | 0 | 10 | 100% | |

#### Task 2: Todo List

| Framework | First-run Success | API Misuses | LOC | Feature Completeness | Notes |
|------|------------|---------|-----|-----------|------|
| rikka | ✅ | 0 | 25 | 100% | `input({ value: newTodo })` 双向绑定正确，`For` 使用 keyFn |
| React | ✅ | 0 | 25 | 100% | |
| Solid | ✅ | 0 | 25 | 100% | |

#### Task 3: Filtered List

| Framework | First-run Success | API Misuses | LOC | Feature Completeness | Notes |
|------|------------|---------|-----|-----------|------|
| rikka | ✅ | 0 | 25 | 100% | `select({ selectedIndex: filterIndex })` 双向绑定正确 |
| React | ✅ | 0 | 25 | 100% | |
| Solid | ✅ | 0 | 25 | 100% | |

#### Task 4: Tab Switcher

| Framework | First-run Success | API Misuses | LOC | Feature Completeness | Notes |
|------|------------|---------|-----|-----------|------|
| rikka | ✅ | 0 | 20 | 100% | `Switch`/`Match` 使用正确，`computed` 驱动 style |
| React | ✅ | 0 | 20 | 100% | |
| Solid | ✅ | 0 | 20 | 100% | |

#### Task 5: Custom Element / Component

| Framework | First-run Success | API Misuses | LOC | Feature Completeness | Notes |
|------|------------|---------|-----|-----------|------|
| rikka | ✅ | 0 | 30 | 100% | ✅ 使用 `event<T>()` 而非 `() => undefined as any`；`StringAttr` 用法正确；`this.$name`/`this.$age` 信号绑定正确；`dispatchUserSelect` 正确 |
| React | ✅ | 0 | 25 | 100% | |
| Solid | ✅ | 0 | 20 | 100% | |

#### Task 6: Reactive Form

| Framework | First-run Success | API Misuses | LOC | Feature Completeness | Notes |
|------|------------|---------|-----|-----------|------|
| rikka | ✅ | 0 | 25 | 100% | `input({ value: email })` 双向绑定正确；`computed` 驱动校验；`When` 条件渲染正确；`disabled: computed(...)` 正确使用 computed 而非普通函数 |
| React | ✅ | 0 | 30 | 100% | |
| Solid | ✅ | 0 | 30 | 100% | |

#### Task 7: Theme Switcher

| Framework | First-run Success | API Misuses | LOC | Feature Completeness | Notes |
|------|------------|---------|-----|-----------|------|
| rikka | ✅ | 0 | 15 | 100% | ✅ **Run 1 的错误已修复**：`effect()` 驱动 document.body 样式更新；`computed()` 用于按钮文本；localStorage 持久化正确 |
| React | ✅ | 0 | 25 | 100% | |
| Solid | ✅ | 0 | 20 | 100% | |

### Summary

| Metric | rikka | React | Solid |
|------|-------|-------|-------|
| **First-run success rate** | **7/7 (100%)** | **7/7 (100%)** | **7/7 (100%)** |
| **Total API misuses** | **0** | **0** | **0** |
| **Average LOC** | **21.4** | **23.1** | **21.4** |
| **Average feature completeness** | **100%** | **100%** | **100%** |

### Run 1 vs Run 2 对比

| Metric | rikka (Run 1) | rikka (Run 2) | 变化 |
|--------|--------------|--------------|------|
| First-run success rate | 6/7 (86%) | **7/7 (100%)** | ✅ +14% |
| Total API misuses | 1.5 | **0** | ✅ -1.5 |
| Average LOC | 33.6 | **21.4** | ✅ -36% |
| Average feature completeness | 95.7% | **100%** | ✅ +4.3% |

### 关键发现

1. **文档上下文消除了所有 API 误用**：Run 1 中 Task 7 的"函数 vs computed"错误在 Run 2 中完全消失。LLM 正确使用了 `effect()` 驱动样式更新和 `computed()` 驱动按钮文本。
2. **文档上下文使代码更地道**：Run 1 中 Task 5 的 `() => undefined as any` 在 Run 2 中被替换为正确的 `event<T>()`。
3. **代码行数大幅减少**：Run 2 的 rikka 代码平均 21.4 行，与 React (23.1) 和 Solid (21.4) 持平。Run 1 代码更长是因为 LLM 添加了大量装饰性样式。
4. **三框架首次运行成功率均为 100%**：在提供文档上下文后，rikka 与 React/Solid 完全持平。

---

## Limitations

1. **Single run per condition**: Each condition (with/without guide context) was tested once. A formal benchmark should run at least 3 times and take the average.
2. **Single LLM**: Using the same LLM to generate all framework code may introduce bias toward certain frameworks.
3. **Limited task complexity**: All 7 tasks are single-component scenarios, not involving cross-component communication, async data, routing, or other complex scenarios.
4. **React pitfall scenarios not tested**: React's stale closure, hooks rule violations, and other pitfalls require more complex scenarios to trigger (such as effect deps array omission, conditional hook calls, etc.).
5. **Evaluator bias**: The same LLM generated and evaluated the code, which may introduce self-evaluation bias.
6. **Guide context advantage**: Run 2 provided rikka-specific guide context but not equivalent React/Solid documentation context, which may give rikka an unfair advantage.
