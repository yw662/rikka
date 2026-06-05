# Shadow DOM & Styling

Two CSS tagged templates from `@rikka/dom`: `css\`\`` returns a `CSSStyleSheet` (for Shadow DOM), `inlineStyle\`\`` returns a plain style object (for inline `style` attributes).

## Imports

```typescript
import { css, inlineStyle, adoptStyle } from "@rikka/dom";
```

## `css\`...\`: CSSStyleSheet`

For Shadow DOM stylesheets. The result is a real `CSSStyleSheet` instance.

```typescript
import { css } from "@rikka/dom";

const styles = css`
  :host {
    display: block;
    padding: 16px;
  }
  .card {
    padding: 16px;
    border-radius: 8px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
  }
`;
// styles instanceof CSSStyleSheet === true
```

### Merging stylesheets

Interpolate another `CSSStyleSheet` to merge:

```typescript
const base = css`
  :host { display: block; font-family: system-ui; }
`;
const themed = css`
  ${base}
  .card { color: red; }
`;
```

### Signal interpolation

Both `css\`\`` and `inlineStyle\`\`` support signal interpolation; styles update automatically when signals change:

```typescript
import { signal } from "@rikka/signal";
import { css, inlineStyle } from "@rikka/dom";

const theme = signal("dark");

const sheet = css`
  :host { color: ${theme}; }
  // theme change → stylesheet textContent updates
`;

const inline = inlineStyle`color: ${theme};`;
// theme change → inline style object updates
```

## `inlineStyle\`...\`: Record<string, string>`

For inline `style` attributes. CSS property names auto-convert to camelCase.

```typescript
import { inlineStyle } from "@rikka/dom";

const s = inlineStyle`
  padding: 16px;
  border-radius: 8px;
  background: #1a1a2e;
`;
// s === { padding: "16px", borderRadius: "8px", background: "#1a1a2e" }

div({ style: s }, "Hello");
```

## Usage distinction

| | `css\`\`` | `inlineStyle\`\`` |
|---|---|---|
| Return type | `CSSStyleSheet` | `Record<string, string>` |
| Used in | `defineElement` `config.styles` / `adoptedStyleSheets` | `style` attribute of any element |

## Injecting styles into Shadow DOM

### Via `defineElement` `styles` option (preferred)

```typescript
defineElement("my-card", {
  styles: css`:host { display: block; padding: 16px; }`,
  render() { return div({ class: "card" }, "Hello"); },
});
```

rikka uses `adoptedStyleSheets` to inject the sheet into the Shadow Root. The sheet is **shared** across all instances of the element, so memory cost is constant.

### Via `adoptStyle(root, sheet)` (manual)

Useful for elements you don't own, or for adding stylesheets dynamically:

```typescript
import { adoptStyle } from "@rikka/dom";

const sheet = css`/* ... */`;
if (someEl.shadowRoot) {
  adoptStyle(someEl.shadowRoot, sheet);
}
```

## `:host` selector

Inside a Shadow DOM stylesheet, `:host` matches the host element. Use it for the element's own layout:

```typescript
styles: css`
  :host {
    display: block;
    padding: 16px;
  }
  :host([disabled]) {
    opacity: 0.5;
  }
  :host(:hover) {
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
`
```

To target the host from outside the Shadow DOM, use the standard tag selector on the host:

```css
/* global stylesheet */
my-card {
  display: block;
  margin: 8px;
}
```

## Pitfalls

### 1. Using `css\`\`` for inline styles

```typescript
// ❌ `css` returns a CSSStyleSheet, not a string. Won't apply to inline style.
div({ style: css`color: red` });

// ✅
div({ style: inlineStyle`color: red` });
```

### 2. Forgetting `:host` for element layout

```typescript
// ❌ `.card` styles the element's children, not the element itself
styles: css`.card { display: block; }`;
// → the host element has `display: inline` (default for unknown elements)

// ✅
styles: css`:host { display: block; }`;
```

### 3. Sharing `CSSStyleSheet` between Light DOM and Shadow DOM

`adoptedStyleSheets` only works on `Document` and `ShadowRoot`. For a `defineElement` with `shadow: false`, the styles won't apply. Either:

- Use `shadow: true` (default), or
- Inject a `<style>` element directly into the element via `render()`:

```typescript
defineElement("my-el", {
  shadow: false,
  render() {
    const style = document.createElement("style");
    style.textContent = `.my-el { display: block; }`;
    return fragment(style, div({}, "content"));
  },
});
```

### 4. Using `:host` in a Light DOM fallback

If the stylesheet is applied in a Light DOM fallback (browser without `attachShadow`), `:host` doesn't match. Provide a tag selector fallback:

```typescript
const sheet = css`
  :is(:host, my-card) { display: block; padding: 16px; }
`;
```

### 5. CSS values that don't round-trip through camelCase

`inlineStyle` converts `-foo-bar` → `fooBar`. If you need a custom property (CSS variable), keep the kebab-case form — it will pass through:

```typescript
const s = inlineStyle`--my-color: red; color: var(--my-color);`;
// s === { "--my-color": "red", color: "var(--my-color)" }
```

## See also

- [dom-creation.md](./dom-creation.md)
- [custom-element.md](./custom-element.md)
- [browser-compatibility.md](./browser-compatibility.md) — fallback for old browsers
