---
name: rikka-site
description: Use this skill when building full-stack applications with rikka-site — the resource-oriented server framework. Covers server-side resource definition (Kinds, Site tree, Transformers), HTML output configuration, and client-side hydration patterns for building interactive pages that consume SSR data. Load this skill when working on any project that uses @takanashi/rikka-site.
---

# rikka-site — Resource-Orientated Server Framework

Build web apps where **every URL is a resource** with automatic content negotiation (HTML / JSON / JSON-LD / CSV) and seamless client-side hydration.

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Browser                          │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────┐ │
│  │blog-layout│  │rikka-*   │  │blog-overlay      │ │
│  │(nav/footer│→│components│  │(toast/modal)     │ │
│  │ shell)    │  │(hydrated)│  │                  │ │
│  └──────────┘  └─────┬─────┘  └──────────────────┘ │
│                      │ reads data from              │
│              ┌───────▼────────┐                     │
│              │ findResourceData│← extract from DOM  │
│              │ (or hydrateData)│  (data-attr/JSON-LD)│
│              └────────────────┘                     │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP
┌──────────────────────▼──────────────────────────────┐
│                   Server (rikka-site)                │
│  ┌────────┐  ┌──────────┐  ┌─────────────────────┐  │
│  │Site Tree│→ │Resource  │→ │HTML Transformer     │  │
│  │(routes) │  │Resolver  │  │(layout + data attrs)│  │
│  └────────┘  └──────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Core Concepts

### The Five Levels of Abstraction

Every resource in rikka-site goes through 5 levels:

| Level | Concept | What it does | Example |
|-------|---------|-------------|---------|
| 1 | **Kind** | Resource type template | `Collection`, `Item`, `ReadOnly` |
| 2 | **ResourceFactory** | `Kind(impl)` — typed factory | `Collection({ table })` |
| 3 | **Mount** | Factory(config) → constructor | `Users({ table: "users" })` |
| 4 | **Resource** | Resolved instance at a URL | URL `/users/42` resolved |
| 5 | **Operation** | Handler execution | `res.list(ctx)` returns data |

### Six Kinds

| Kind | GET | POST | PUT | PATCH | DELETE | Use Case |
|------|-----|------|-----|-------|--------|----------|
| `Collection` | list | create | — | — | — | `/articles` — list of items |
| `Item` | content | — | replace | patch | delete | `/articles/1` — single item |
| `Singleton` | content | — | replace | patch | — | `/settings` — global config |
| `ReadOnly` | content | — | — | — | — | `/dashboard` — read-only view |
| `Action` | — | invoke | — | — | — | `/search` — stateless op |
| `Proxy` | get | create | replace | patch | delete | Forward to external API |

### Content Negotiation

The same URL serves multiple formats automatically:

```
GET /articles              → HTML page (default)
GET /articles?accept=json  → JSON array
GET /articles?accept=jsonld → JSON-LD document
Accept: text/csv           → CSV file
```

## Quick Start — Full Stack Example

### Step 1: Define Resources (`resources.ts`)

```typescript
import { Collection, Item, ReadOnly, Singleton, Site } from "@takanashi/rikka-site";

// A collection of articles
const Articles = Collection(() => ({
  schema: { type: "array", items: { type: "object" } },
  list: (ctx) => [
    { id: 1, title: "Hello Rikka", body: "..." },
    { id: 2, title: "Signals", body: "..." },
  ],
  children: {
    ":articleId": (id) =>
      Item(() => ({
        content: () => ({ id, title: `Article ${id}`, body: "..." }),
        delete: () => ({ content: null, meta: {} }),
      })),
  },
}));

// Read-only site root
const SiteRoot = ReadOnly(() => ({
  content: () => ({
    content: { name: "My Blog", tagline: "A resource-oriented blog" },
    meta: {},
  }),
}));

// Build the site tree
export const app = new Site({
  "": SiteRoot,
  articles: Articles({}),
});
```

### Step 2: Configure HTML Output & Start Server (`index.ts`)

```typescript
import { app } from "./resources";
import { handleWebRequest, createHtmlTransformer } from "@takanashi/rikka-site";
import { readFileSync } from "fs";
import http from "http";

// Create HTML transformer — controls how resources become HTML pages
const htmlTransformer = createHtmlTransformer({
  layoutElement: "blog-layout",        // Wrap content in <blog-layout>
  scripts: ["/elements.js"],           // Client-side bundle
  stylesheets: [],                     // CSS files to inject in <head>
});

const server = http.createServer(async (req, res) => {
  const response = await handleWebRequest(app, req);

  // Apply HTML transformation for browser requests
  if (response.headers["content-type"]?.includes("text/html")) {
    const transformed = htmlTransformer.transform(response.body);
    res.writeHead(transformed.status || 200, transformed.headers);
    res.end(transformed.body);
  } else {
    res.writeHead(response.status, response.headers);
    res.end(response.body);
  }
});

server.listen(3000);
```

### Step 3: Build Client Components (`elements.ts`)

```typescript
import { defineElement, css } from "@takanashi/rikka-elements";
import { div, h1, p, For, Show } from "@takanashi/rikka-dom";
import { signal, computed } from "@takanashi/rikka-signal";

// ─── Hydration helper: extract SSR data from DOM ───
function findResourceData<T>(el?: Element): T | null {
  // Strategy 1: data-resource attribute (most common)
  if (el) {
    const attr = el.getAttribute("data-resource");
    if (attr) try { return JSON.parse(attr); } catch {}
  }
  // Strategy 2: JSON-LD <script> tag (fallback)
  const script = document.querySelector('script[type="application/ld+json"]');
  if (script) try { return JSON.parse(script.textContent ?? ""); } catch {}
  return null;
}

// ─── Article List Component ───
const ArticleList = defineElement("blog-article-list", {
  styles: css`
    :host { display: block; padding: 20px; font-family: system-ui; }
    .card { border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; margin: 8px 0; }
  `,
  render(this) {
    const rawData = findResourceData<Article[]>(this);
    const articles = signal<Article[]>(
      Array.isArray(rawData) ? rawData : []
    );

    return div(
      h1("Articles"),
      For(articles, (article) =>
        div({ className: "card" },
          h1(article.title),
          p(article.body.substring(0, 100)),
        ),
      ),
    );
  },
});

// Register all custom elements
customElements.define("blog-article-list", ArticleList);
```

### Step 4: HTML Output Structure

With the default `serialization: "data-attr"` option, rikka-site generates:

```html
<!DOCTYPE html>
<html>
<head>
  <script src="/elements.js"></script>
</head>
<body>
  <blog-layout data-path="/articles" data-kind="Collection">
    <rikka-resource path="/articles" kind="Collection"
                     data-resource='[{"id":1,"title":"..."}]'>
    </rikka-resource>
  </blog-layout>
</body>
</html>
```

Key attributes injected by rikka-site:
- **`data-path`** on `<blog-layout>` — current URL path
- **`data-kind`** on `<blog-layout>` — resource Kind name
- **`path`** on `<rikka-resource>` — resource path
- **`kind`** on `<rikka-resource>` — resource Kind name
- **`data-resource`** on `<rikka-resource>` — serialized resource data (when `serialization` is `"data-attr"` or `"both"`)
- **`<script type="application/ld+json">`** — JSON-LD data (when `serialization` is `"jsonld"` or `"both"`)

## Patterns & Best Practices

### Pattern 1: Navigation Active State from `data-path`

The layout component receives `data-path` from SSR. Use it to highlight the current nav item:

```typescript
defineElement("my-layout", {
  render(this) {
    const currentPath = this.getAttribute("data-path") ?? "/";
    const pathSignal = signal(currentPath);

    const isActive = (href: string) => computed(() => {
      const p = pathSignal.get();
      return p === href || (href !== "/" && p.startsWith(href));
    });

    return div(
      nav(
        a({ className: computed(() => isActive("/") ? "active" : "") }, href: "/", "Home"),
        a({ className: computed(() => isActive("/articles") ? "active" : "") }, href: "/articles", "Articles"),
      ),
      main(document.createElement("slot")),
    );
  },
});
```

**Important**: Read `data-path` via `this.getAttribute()`, NOT from declared attributes. rikka-site sets it as a plain HTML attribute, not as an observed attribute.

### Pattern 2: Client-Side Router Component

Use the SDK router (`window.__rikka.createRouter` / `matchRoute`) or a simple if/else map to render `<rikka-resource>` to your components:

```typescript
const RikkaResource = defineElement("rikka-resource", {
  styles: css`:host { display: contents; }`,
  render(this) {
    const path = (this.getAttribute("path") ?? "").replace(/\/+$/, "");
    const kind = this.getAttribute("kind") ?? "";

    // Route based on normalized path
    if (path === "/" || (kind === "ReadOnly" && path === ""))
      return document.createElement("blog-home");
    if (path.match(/^\/articles\/\d+$/))
      return document.createElement("blog-article-detail");
    if (path === "/articles" || path.startsWith("/articles"))
      return document.createElement("blog-article-list");
    // ... more routes

    return div({ style: { padding: "40px", color: "#999" } },
      p(`Unknown: ${path}`),
    );
  },
});
```

**Pitfalls**:
- Always normalize trailing slashes (`/articles/1/` → `/articles/1`)
- Match specific paths (like `/articles/:id`) BEFORE prefix paths (like `/articles`) to avoid false matches
- The order of `if` statements matters!

### Pattern 3: Reactive Data from SSR

Always wrap extracted data in `signal()` and use `computed()` for derived values:

```typescript
render(this) {
  const rawData = findResourceData<MyData>(this);
  const data = signal<MyData | null>(rawData ?? null);

  // ✅ Correct: computed() for value-position reactivity
  const title = computed(() => data.get()?.title ?? "");
  const count = computed(() => data.get()?.items?.length ?? 0);

  // ✅ Correct: pass signals directly as children (not .get())
  return div(h1(title), p(`${count} items`));
}
```

### Pattern 4: Handling Multiple Data Formats

SSR may serialize data differently depending on Kind:
- **Collections**: raw array `[...]` in `data-resource`, or `{ "@graph": [...] }` in JSON-LD
- **Items/Singletons**: plain object `{...}` in both formats

Handle both formats defensively:

```typescript
function findResourceData<T>(el?: Element): T | null {
  if (el) {
    const attr = el.getAttribute("data-resource");
    if (attr) try { return JSON.parse(attr); } catch {}
  }
  const script = document.querySelector('script[type="application/ld+json"]');
  if (script) try { return JSON.parse(script.textContent ?? ""); } catch {}
  return null;
}

// Usage — unwrap JSON-LD @graph wrapper if present
const rawData = findResourceData(this);
const articles = signal<Article[]>(
  Array.isArray(rawData) ? rawData : (rawData && (rawData as any)["@graph"]) ?? []
);
```

## Common Pitfalls When Using rikka-site

### 1. Don't forget `data-path` normalization

Server URLs may have trailing slashes (`/articles/1/`). Normalize before routing:

```typescript
const normPath = path.replace(/\/+$/, "");
```

### 2. `data-path` is NOT a reactive attribute

It's set once by SSR as a plain HTML attribute. If you need reactivity, wrap it:

```typescript
const currentPath = signal(this.getAttribute("data-path") ?? "/");
```

### 3. `data-kind` is often unused

Currently rikka-site writes `data-kind` but most layouts don't use it. It's available if you need Kind-aware rendering (e.g., different layouts for Collection vs Item).

### 4. Serialization option controls the payload

rikka-site's `serialization` option chooses how SSR data is emitted (`"data-attr"`, `"jsonld"`, or `"both"`). With `"both"`, the same data appears in both the `data-resource` attribute and a `<script type="application/ld+json">` tag, doubling the payload. For large datasets, use `"data-attr"` or `"jsonld"` alone.

### 5. Element registration order matters

If using `defineElement()` which auto-registers, don't call `customElements.define()` again — it throws `NotSupportedError`. Use a guard:

```typescript
function registerAll() {
  for (const [name, ctor] of entries) {
    if (!customElements.get(name)) customElements.define(name, ctor);
  }
}
```

## See Also

- [../overview/](../overview/) — High-level framework overview
- [../custom-element/](../custom-element/) — Defining custom elements with `defineElement`
- [../reactive-state/](../reactive-state/) — Signals, computed, effect
- [../common-pitfalls/](../common-pitfalls/) — LLM-specific mistakes to avoid
