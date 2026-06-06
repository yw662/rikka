# Browser Compatibility

`@takanashi/rikka-elements` depends on three browser APIs: Custom Elements, Shadow DOM, and Constructable Stylesheets. Modern browsers support all of them; older browsers need polyfills or fallbacks.

## Recommended baseline

| Browser | Minimum version |
|---------|-----------------|
| Chrome  | 73+  |
| Firefox | 101+ |
| Safari  | 16.4+ (March 2023) |
| Edge    | 79+  |

If you target this baseline, **no polyfill is needed** — every required API is native.

| API | Chrome | Firefox | Safari | Edge |
|-----|--------|---------|--------|------|
| Custom Elements V1 | 67+ | 63+ | 10.1+ | 79+ |
| Shadow DOM V1 | 53+ | 63+ | 10+ | 79+ |
| Constructable Stylesheet (`new CSSStyleSheet()`) | 73+ | 101+ | 16.4+ | 79+ |
| `adoptedStyleSheets` | 73+ | 101+ | 16.4+ | 79+ |

## When you need a polyfill

You need polyfills only if you must support one of:

- Chrome 54–72, Firefox 63–100, Safari 10.1–16.3 (no Constructable Stylesheet)
- Chrome < 54, Safari < 10.1 (no Custom Elements)
- Old Edge (EdgeHTML) or IE11
- jsdom SSR (no Custom Elements)

## Custom Elements polyfill

```bash
npm install @webcomponents/custom-elements
```

Import **before** any `defineElement` call:

```typescript
// Top of entry file
import "@webcomponents/custom-elements";
import { defineElement } from "@takanashi/rikka-elements";
```

Or via `<script>`:

```html
<script src="node_modules/@webcomponents/custom-elements/custom-elements.min.js"></script>
<script type="module" src="./app.js"></script>
```

The polyfill is a no-op in browsers that already have `window.customElements`. ~7 KB gzip.

### Caveats with the polyfill

- `connectedCallback` fires **asynchronously** (microtask) instead of synchronously. Code that depends on synchronous upgrade semantics needs adaptation.
- Element upgrade uses `Object.setPrototypeOf`, which has a per-instance performance cost. Avoid creating thousands of elements in a tight loop.
- ES2022 private fields (`#field`) become inaccessible on upgraded elements. rikka-elements uses `WeakSet` internally to avoid this. Avoid `#field` in your own `methods`.
- `adoptedCallback` is not implemented (rikka-elements does not use it).

## Shadow DOM polyfill (optional)

For older browsers that lack `attachShadow`:

```bash
npm install @webcomponents/shadydom
```

```typescript
import "@webcomponents/shadydom";
```

Caveats:

- Patches many global DOM APIs (`appendChild`, `querySelector`, etc.) — invasive, may conflict with other libraries.
- Event retargeting and `<slot>` distribution have edge cases vs. native.
- ~13 KB gzip.

**Only use if you need DOM encapsulation in a browser without native Shadow DOM.** For most apps, a Light DOM fallback is simpler.

## Light DOM fallback (no polyfill)

If `attachShadow` is unavailable, fall back to inserting content directly into the element. rikka's `defineElement` does this automatically when `attachShadow` is missing — but you must design your styles to work in both contexts.

```typescript
// Use :is(:host, tagname) to target both Shadow host and Light DOM element
const styles = css`
  :is(:host, my-counter) {
    display: block;
    padding: 16px;
  }
`;
```

| Feature | Shadow DOM | Light DOM fallback |
|---------|-----------|---------------------|
| CSS isolation | ✅ | ❌ styles leak out |
| DOM encapsulation | ✅ | ❌ children visible from outside |
| `<slot>` projection | ✅ | ❌ |
| Event retargeting | ✅ | ❌ |
| `el.shadowRoot` | `ShadowRoot` | `null` |

## Constructable Stylesheet fallback

For browsers that lack `new CSSStyleSheet()` / `adoptedStyleSheets` (Chrome 54–72, Firefox 63–100, Safari 10.1–16.3), `defineElement` falls back to injecting `<style>` elements into the Shadow Root.

No action needed from you — the fallback is built in. The trade-offs:

| Feature | `adoptedStyleSheets` | `<style>` fallback |
|---------|----------------------|---------------------|
| Sheet sharing across roots | ✅ one sheet, many roots | ❌ one copy per root |
| Memory | ✅ efficient | ❌ duplicates |
| Dynamic `replaceSync` updates | ✅ | ❌ `textContent` rewrite |
| Browser support | Chrome 73+, Safari 16.4+ | All browsers |

## SSR

`@takanashi/rikka-elements` does not work in `jsdom` out of the box. Two options:

### Use `happy-dom`

```typescript
import { GlobalRegistrator } from "@happy-dom/global-registrator";
await GlobalRegistrator.register();
```

`happy-dom` supports Custom Elements natively.

### Use the CE polyfill

```typescript
import "@webcomponents/custom-elements";
import { defineElement } from "@takanashi/rikka-elements";
```

## IE11 / old Edge (EdgeHTML)

`@takanashi/rikka-elements` builds target ES2022 and is **not directly compatible** with IE11. To support IE11, you would need:

1. A complete polyfill suite: `@webcomponents/webcomponentsjs` (~88 KB gzip)
2. ES2015+ polyfills: `Promise`, `Map`, `Set`, `WeakMap`, `WeakSet`, `Symbol`
3. Babel transpilation to ES5

This is rarely worth the effort today.

## Decision matrix

| Target | Custom Elements | Shadow DOM | CSSStyleSheet | Action |
|--------|-----------------|------------|---------------|--------|
| Chrome 73+ / FF 101+ / Safari 16.4+ / Edge 79+ | native | native | native | None |
| Chrome 54–72 / Safari 10.1–16.3 | native | native | fallback | None (built-in fallback) |
| Chrome < 54 / Safari < 10.1 | polyfill | polyfill | fallback | `import "@webcomponents/custom-elements"` |
| IE11 / old Edge | polyfill | polyfill | fallback | Full polyfill suite + Babel |

## Pitfalls

### 1. Polyfill loaded after `defineElement`

If `defineElement("my-el", …)` runs before the CE polyfill loads, the call to `customElements.define` will fail. The polyfill **must** be imported first.

### 2. Using `:host` selectors in a Light DOM fallback

`:host` doesn't match anything in Light DOM. Use a tag selector fallback:

```typescript
const styles = css`
  :is(:host, my-card) { display: block; }
`;
```

### 3. Expecting `<slot>` to work without Shadow DOM

`<slot>` requires Shadow DOM. In a Light DOM fallback, slots remain in the DOM as inert elements; children are not projected.

### 4. Upgrading elements created before the polyfill loaded

```html
<!-- Before polyfill script -->
<my-counter></my-counter>
<!-- After polyfill script -->
<script src="custom-elements.min.js"></script>
```

The polyfill will upgrade the existing `<my-counter>` once it loads, but with a slight delay. To avoid this, load the polyfill synchronously in `<head>` before any custom elements are created.

## See also

- [custom-element.md](./custom-element.md)
- [shadow-dom-styling.md](./shadow-dom-styling.md)
