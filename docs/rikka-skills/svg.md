# SVG

rikka-dom creates SVG elements in the SVG namespace automatically. Most SVG tags are also tag helpers.

## Imports

```typescript
import { svg, circle, path, rect, line, polygon, polyline, g, defs, use, linearGradient, stop, foreignObject } from "@rikka/dom";
```

## Basic SVG

```typescript
import { svg, circle, path, linearGradient, stop, defs } from "@rikka/dom";

svg(
  { width: 200, height: 200, viewBox: "0 0 200 200" },
  defs(
    linearGradient({ id: "grad", x1: "0%", y1: "0%", x2: "100%", y2: "0%" },
      stop({ offset: "0%", "stop-color": "#667eea" }),
      stop({ offset: "100%", "stop-color": "#764ba2" }),
    ),
  ),
  circle({ cx: 100, cy: 100, r: 80, fill: "url(#grad)" }),
  path({ d: "M10 80 Q 95 10 180 80", stroke: "black", fill: "transparent" }),
);
```

## Namespace handling

rikka-dom auto-selects the namespace based on the tag name:

- **SVG-only tags** (`circle`, `path`, `rect`, `g`, `defs`, `use`, `linearGradient`, …) are always created in the SVG namespace — no extra syntax.
- **MathML-only tags** are always created in the MathML namespace.
- **HTML/SVG name-collision tags** (`a`, `script`, `style`, `title`, `text`, `span`, `textPath`) default to the HTML namespace. Use the `svg`-prefixed version for SVG context.

## Same-name tags — the `svg` prefix

For tags that exist in both HTML and SVG, the unprefixed name is HTML. To create the SVG version, use the `svg`-prefixed tag:

| HTML (default) | SVG | Purpose |
|----------------|-----|---------|
| `a` | `svga` | HTML link vs SVG link |
| `script` | `svgscript` | HTML script vs SVG script |
| `style` | `svgstyle` | HTML style vs SVG style |
| `title` | `svgtitle` | HTML title vs SVG title |
| `text` | `svgtext` | (no HTML text element) |
| `span` | `svgspan` | HTML span vs SVG tspan |
| `textPath` | `svgtextPath` | SVG textPath |

```typescript
import { svg, svga, svgtext, svgspan, a } from "@rikka/dom";

// HTML <a>
a({ href: "https://example.com" }, "Link");

// SVG <a>
svga({ href: "#section1" }, "Section 1");

// SVG <text> with <tspan>
svg({ viewBox: "0 0 200 60" },
  svgtext({ x: 10, y: 30 },
    "Hello ",
    svgspan({ dy: 5 }, "SVG"),
  ),
);
```

## Signal binding in SVG

SVG works with all the same signal patterns as HTML:

```typescript
import { signal, computed } from "@rikka/signal";
import { svg, circle, path } from "@rikka/dom";

const radius = signal(40);

svg({ width: 200, height: 200 },
  // Signal as attribute — reactive
  circle({ cx: 100, cy: 100, r: radius, fill: "red" }),

  // Signal interpolation in h`` — reactive
  computed(() => h`
    <path d="M10 80 Q 95 10 180 80" stroke="black" fill="none" stroke-width="${radius}" />
  `),
);
```

## Embedding HTML inside SVG (`foreignObject`)

```typescript
import { svg, foreignObject, div } from "@rikka/dom";

svg({ width: 200, height: 200 },
  foreignObject({ x: 0, y: 0, width: 200, height: 200 },
    div({ xmlns: "http://www.w3.org/1999/xhtml", style: "color: red" },
      "HTML inside SVG",
    ),
  ),
);
```

Note: the inner HTML element must have its namespace declared explicitly, or it inherits the parent SVG namespace.

## Pitfalls

### 1. Using `a` inside `svg`

```typescript
// ❌ `a` is HTMLAnchorElement in HTML namespace — wrong for SVG
svg(svga({ href: "#x" }, "Link"), a({ href: "#y" }, "Other"));

// ✅ Use svga for SVG links
svg(svga({ href: "#x" }, "Link"));
```

### 2. Forgetting `viewBox`

Without a `viewBox`, the SVG will use the default coordinate system but not scale responsively. Set `viewBox="0 0 W H"` to match your intended coordinate system.

### 3. CamelCase attributes

SVG attributes use kebab-case in markup but camelCase in property form. rikka accepts both — the convention is kebab-case for SVG and camelCase for HTML:

```typescript
// Both work
circle({ "stroke-width": 2, fill: "red" });
circle({ strokeWidth: 2, fill: "red" }); // also accepted
```

### 4. Forgetting to set width/height

`<svg>` defaults to `width="100%"` and `height="100%"` only if you set them. Without explicit dimensions, it may collapse:

```typescript
// ❌ No dimensions — may collapse to 0×0
svg(circle({ cx: 50, cy: 50, r: 40 }));

// ✅
svg({ width: 200, height: 200 }, circle({ cx: 50, cy: 50, r: 40 }));
```

## See also

- [dom-creation.md](./dom-creation.md) — `h`, tag helpers
- [signal-binding.md](./signal-binding.md) — signal patterns
