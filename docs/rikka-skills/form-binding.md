# Form Two-Way Binding

For specific properties of `<input>`, `<textarea>`, and `<select>`, passing a writable signal (`Signal.State`) **automatically** sets up two-way binding. The DOM event syncs back to the signal.

| Element | Property | Event |
|---------|----------|-------|
| `<input>` (text / search / etc) | `value` | `input` |
| `<input type="checkbox">` | `checked` | `change` |
| `<textarea>` | `value` | `input` |
| `<select>` | `selectedIndex` | `change` |

## Imports

```typescript
import { signal } from "@rikka/signal";
import { input, textarea, select, option } from "@rikka/dom";
```

## Text input

```typescript
const name = signal("");

input({ value: name });
// User types → name.set(newValue) on every input event
// name.set("...") from code → input.value updates
```

## Textarea

```typescript
const bio = signal("");

textarea({ value: bio });
```

## Checkbox

```typescript
const agreed = signal(false);

input({ type: "checkbox", checked: agreed });
// User toggles → agreed.set(newChecked) on change event
```

## Select

`<select>` uses `selectedIndex` (the index, not the value), so pair it with an `options` array or a computed mapping:

```typescript
const options = ["red", "green", "blue"];
const selectedIndex = signal(0);

select(
  { selectedIndex },
  options.map((o) => option({}, o)),
);
```

> The signal's type is `number`, not the option's value. If you need value-based binding, compute the index from the value:
>
> ```typescript
> const color = signal("red");
> const options = ["red", "green", "blue"];
> const idx = computed(() => options.indexOf(color.get()));
> const idxWritable = signal(idx.get());
> // ... or use a custom attribute/event pair in defineElement
> ```

## Reading vs writing the bound signal

Two-way binding means changes flow **both ways**:

```typescript
const text = signal("");

input({ value: text });

// Reading: current value
console.log(text.get()); // whatever's in the input right now

// Writing from code: input updates
text.set("hello");       // input.value === "hello" now
```

The same `signal` can drive other parts of the UI:

```typescript
input({ value: text });
p({}, "You typed: ", text); // updates live as user types
```

## Combining with validation

Combine with `computed` for derived validation:

```typescript
import { signal, computed } from "@rikka/signal";
import { input, p, div, button } from "@rikka/dom";

const email = signal("");
const isValid = computed(() => /.+@.+\..+/.test(email.get()));
const canSubmit = computed(() => isValid.get());

div({},
  input({ type: "email", value: email }),
  p({}, "Status: ", () => isValid.get() ? "✓" : "invalid"),
  button({ disabled: computed(() => !canSubmit.get()) }, "Submit"),
);
```

## In `defineElement` attributes

The same rule does **not** apply to attributes defined via `defineElement`. The `value` / `checked` / `selectedIndex` two-way binding is a feature of `rikka-dom`'s input handling, not of `defineElement` attributes.

For custom elements with form-like behavior, use a declared `attributes` entry plus an `events` entry. See [custom-element.md](./custom-element.md).

## Pitfalls

### 1. Using a `computed` signal — it's read-only

```typescript
// ❌ Type error: computed has no .set()
input({ value: computed(() => "hello") });

// ✅ Writable signal
const text = signal("");
input({ value: text });
```

### 2. Two-way binding only on `value` / `checked` / `selectedIndex`

```typescript
// ❌ No two-way binding — `placeholder` is a string attribute
input({ placeholder: signal("Type here") });

// ✅ Pass the string directly
input({ placeholder: "Type here" });
```

If you need a dynamic placeholder, pass the signal — but it will be one-way (signal → DOM, not the reverse):

```typescript
const ph = signal("Type here");
input({ placeholder: ph }); // updates when ph changes, but typing doesn't update ph
```

### 3. Forgetting `change` vs `input` semantics

rikka auto-picks the right event:

- `value` on text inputs / textarea → `input` (every keystroke)
- `checked` on checkboxes → `change` (on toggle)
- `selectedIndex` on selects → `change` (on selection)

You don't need to add manual event listeners — just declare the property and the binding works.

### 4. Using `value` on a `<select>`

`<select>.value` is the option's *string value*, but rikka's two-way binding uses `selectedIndex` (a number). If your data is value-based, compute the index from the value.

## See also

- [dom-creation.md](./dom-creation.md)
- [signal-binding.md](./signal-binding.md)
- [control-flow.md](./control-flow.md)
- [common-pitfalls.md](./common-pitfalls.md)
