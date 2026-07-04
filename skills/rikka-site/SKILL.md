---
name: rikka-site
description: Use this skill when building full-stack applications with rikka-site — the resource-oriented server framework. Covers server-side resource definition (Kinds, Site tree, Transformers, Auth, Pagination), HTML output configuration, content negotiation, and client-side hydration patterns. Load this skill when working on any project that uses @takanashi/rikka-site.
---

# rikka-site — Resource-Oriented Server Framework

Build web apps where **every URL is a resource** with automatic content negotiation (HTML / JSON / JSON-LD / CSV / custom) and seamless client-side hydration.

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Browser                          │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────┐ │
│  │blog-layout│  │rikka-*   │  │SDK (window.__rikka)│ │
│  │(nav/footer│→│components│  │(router, api, data) │ │
│  │ shell)    │  │(hydrated)│  │                  │ │
│  └──────────┘  └─────┬─────┘  └──────────────────┘ │
│                      │ findResourceData()           │
│              ┌───────▼────────┐                     │
│              │ extract from   │← data-attr / JSON-LD│
│              │ DOM            │  / DSDOM             │
│              └────────────────┘                     │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP
┌──────────────────────▼──────────────────────────────┐
│                   Server (rikka-site)                │
│  ┌────────┐  ┌──────────┐  ┌─────────────────────┐  │
│  │Site Tree│→ │Resource  │→ │Transformer Pipeline │  │
│  │(routes) │  │Resolver  │  │(negotiate + transform)│  │
│  └────────┘  └──────────┘  └─────────────────────┘  │
│  ┌──────────┐  ┌─────────┐  ┌────────────────────┐  │
│  │Auth      │  │CORS     │  │Static              │  │
│  │(Action + │  │(declar.)│  │(catchAll)          │  │
│  │ glob rls)│  │         │  │                    │  │
│  └──────────┘  └─────────┘  └────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Core Concepts

### The Four Levels of Abstraction

Every resource in rikka-site goes through 4 levels:

| Level | Concept | What it does | Example |
|-------|---------|-------------|---------|
| 1 | **Kind** | Abstract class (HTTP semantics) | `CollectionKind`, `ItemKind`, `ReadOnlyKind` |
| 2 | **Resource class** | `class Foo extends CollectionKind` — implement handlers | `class Users extends CollectionKind` |
| 3 | **ResourceKind instance** | `new Foo()` — mounted in the site tree | `new Users()` |
| 4 | **Operation** | Handler execution: `resource.get(ctx)` | Returns a `Repr` |

Each level only depends on the output of the previous level. Resources are pure domain concepts — they know nothing about HTTP. The site tree stores `ResourceKind` instances; per-request state (params, path) is carried by a `Resource` wrapper created via `kind.createResource(params, path)`. The server dispatches HTTP methods polymorphically (`resource.get(ctx)`, `resource.post(ctx)`, …) and infers status, headers, and body from the returned `Repr`.

### Five abstract Kinds

| Kind | GET | POST | PUT | PATCH | DELETE | Use Case |
|------|-----|------|-----|-------|--------|----------|
| `CollectionKind` | list | create | — | — | — | `/articles` — list of items |
| `ItemKind` | content | — | replace | patch | delete | `/articles/1` — single item |
| `SingletonKind` | content | — | replace | patch | — | `/settings` — global config |
| `ReadOnlyKind` | content | — | — | — | — | `/dashboard` — read-only view |
| `ActionKind` | — | invoke | — | — | — | `/search` — stateless op |

Concrete resource adapters are in separate packages:

| Package | Kind | Use Case |
|---------|------|----------|
| `@takanashi/rikka-resource-filesystem` | `FileSystemKind` | `/assets/*` — static files + WebDAV (catchAll) |
| `@takanashi/rikka-resource-database` | `DatabaseKind` | `/db/*` — schema-driven CRUD |

### Repr — The Universal Data Container

All data flows as a **Repr** = `{ content, meta }`:

- **Value content** — structured data (objects, arrays, primitives). Serialized by transformers.
- **Raw content** — pre-serialized bytes (`string` or `Uint8Array`) with a MIME type in `meta.type`.
- **Partial content** — `{ unit, data: [[offset, slice]], total }` shape → triggers 206 response.

Handlers MUST return a `Repr` (`{ content, meta? }`) explicitly — there is no auto-wrapping of plain values.

**Status code inference** (from `content` shape + `meta` + method/kind):

| Condition | Status |
|-----------|--------|
| `content === null && meta.location` | 302 redirect |
| `content === null` | 204 no content |
| `POST` on `CollectionKind` with `meta.location` | 201 created |
| `DELETE` | 204 |
| `content` is `PartialContent` shape + Range header | 206 |
| otherwise | 200 |

### Content Negotiation

The same URL serves multiple formats automatically. Resolution order:

1. `?accept` query parameter (explicit override; supports short names: `json`, `jsonld`, `csv`, `text`, `cbor`, `protobuf`/`proto`, `xml`, `html`)
2. `Accept` header (standard negotiation with q-values, wildcards)
3. Default: `application/json` for Value content (structured data); the resource's `meta.type` or a path-guessed MIME for Raw content

```
GET /articles                 → JSON array (default)
GET /articles?accept=html     → HTML page
GET /articles?accept=csv      → CSV file
GET /articles?accept=cbor     → CBOR binary (Uint8Array body)
GET /articles?accept=protobuf → protobuf bytes (if protobuf(schema) registered)
Accept: application/ld+json   → JSON-LD document
Accept: text/html             → HTML page (browser negotiation)
```

Only MIME types with a registered transformer are considered valid.

## Quick Start — Full Stack Example

### Step 1: Define Resources (`resources.ts`)

```typescript
import {
  CollectionKind,
  ItemKind,
  ReadOnlyKind,
  Site,
  HttpError,
  paginate,
  type Schema,
} from "@takanashi/rikka-site";
import type { Repr, RequestContext } from "@takanashi/rikka-site";

const articles: Array<Record<string, unknown>> = [
  { id: 1, title: "Hello Rikka", body: "..." },
  { id: 2, title: "Signals", body: "..." },
];
let nextId = 3;

// A collection of articles — list (GET) + create (POST)
class Articles extends CollectionKind {
  schema: Schema = { type: "array", items: { type: "object" } };
  element = "blog-article-list";       // custom element tag for HTML rendering
  context = "https://schema.org";      // JSON-LD @context
  jsonldType = "ArticleCollection";

  async list(ctx: RequestContext): Promise<Repr> {
    return paginate(articles, ctx.range);  // supports Range: items=0-9
  }

  async create(ctx: RequestContext): Promise<Repr> {
    const body = await ctx.json();
    const article = { id: nextId++, ...body };
    articles.push(article);
    return { content: article, meta: { location: `./${article.id}` } };  // 201
  }
}

// Single article — content (GET) + delete (DELETE)
class Article extends ItemKind {
  schema: Schema = { type: "object" };
  element = "blog-article-detail";

  async content(ctx: RequestContext): Promise<Repr> {
    const article = articles.find((a) => a.id === Number(ctx.params.articleId));
    if (!article) throw new HttpError(404, "Article not found");
    return { content: article, meta: {} };
  }

  async delete(): Promise<Repr> {
    return { content: null, meta: {} };  // 204
  }
}

// Read-only site root
class SiteRoot extends ReadOnlyKind {
  schema: Schema = { type: "object" };
  element = "blog-home";

  async content(): Promise<Repr> {
    return {
      content: {
        name: "My Blog",
        tagline: "A resource-oriented blog",
        articleCount: articles.length,
      },
    };
  }
}

// Build the site tree — keys become URL path segments, values are instances
export const app = new Site({
  "": new SiteRoot(),                    // mounted at "/"
  articles: new Articles(),              // mounted at "/articles"
  "articles/:articleId": new Article(),  // mounted at "/articles/:articleId"
});
```

### Step 2: Start the Server (`index.ts`)

The `Site` constructor automatically registers built-in transformers (JSON, JSON-LD, HTML). For Node.js, call `app.listen()`:

```typescript
import { Site } from "@takanashi/rikka-site";
import { createApp } from "./resources.js";

const app = createApp();
const server = await app.listen({ port: 3000 });
await server.ready;
console.log(`Listening on http://${server.host}:${server.port}`);

// Graceful shutdown
await server.close();
```

For edge runtimes (Cloudflare Workers, Deno Deploy, Vercel Edge):

```typescript
import { handleWebRequest } from "@takanashi/rikka-site";
import { app } from "./resources.js";

export default { fetch: (req) => handleWebRequest(app, req) };
```

### Step 3: Register Custom Transformers (optional)

Add support for CSV, plain text, or any custom format:

```typescript
import type { Transformer, Repr } from "@takanashi/rikka-site";

const csvTransformer: Transformer = {
  input: { type: "array", items: { type: "object" } },
  output: "text/csv",
  transform(repr: Repr): Repr {
    const data = repr.content as Record<string, unknown>[];
    if (!Array.isArray(data) || data.length === 0) {
      return { content: "", meta: { type: "text/csv" } };
    }
    const header = Object.keys(data[0]!).join(",");
    const rows = data.map((row) => Object.values(row).join(","));
    return { content: [header, ...rows].join("\n"), meta: { type: "text/csv" } };
  },
};

app.registry.register(csvTransformer);
// Now GET /articles?accept=csv returns CSV
```

### Step 4: Build Client Components (`elements.ts`)

```typescript
import { defineElement, css } from "@takanashi/rikka-elements";
import { div, h1, p, For } from "@takanashi/rikka-dom";
import { signal, computed } from "@takanashi/rikka-signal";

// Hydration helper — extract SSR data from DOM
function findResourceData<T>(el?: Element): T | null {
  // Strategy 1: data-resource attribute (primary, "data-attr" serialization)
  if (el) {
    const attr = el.getAttribute("data-resource");
    if (attr) try { return JSON.parse(attr); } catch {}
  }
  // Strategy 2: JSON-LD <script> tag (fallback, "jsonld" serialization)
  const script = document.querySelector('script[type="application/ld+json"]');
  if (script) try {
    const parsed = JSON.parse(script.textContent ?? "");
    return ((parsed as Record<string, unknown>)["@graph"] ?? parsed) as T;
  } catch {}
  return null;
}

const ArticleList = defineElement("blog-article-list", {
  styles: css`:host { display: block; padding: 20px; }`,
  render(this) {
    const rawData = findResourceData<Article[]>(this);
    const articles = signal<Article[]>(Array.isArray(rawData) ? rawData : []);

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
```

### Step 5: Wire Up Custom Elements + Assets

Pass custom elements and static assets to the `Site` constructor. rikka-site bundles the element entry with esbuild and serves it at `/.well-known/assets/elements.js`:

```typescript
import { Site } from "@takanashi/rikka-site";
import { elements } from "./elements.js";

const app = new Site(
  { articles: new Articles() },
  {
    customElements: elements,                           // export-name → class
    customElementsEntry: new URL("./elements.ts", import.meta.url),  // browser entry
    assets: {
      "favicon.ico": { source: new URL("../public/favicon.ico", import.meta.url) },
      "robots.txt": { source: new URL("../public/robots.txt", import.meta.url) },
    },
  },
);
```

The HTML transformer auto-injects `<script type="module" src="...elements.js">` and `<link rel="icon" href="...favicon.ico">` — no manual `<script>` tags needed.

## SSR HTML Output Structure

With the default `serialization: "data-attr"` option, rikka-site generates:

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module" src="./.well-known/sdk/sdk.js"></script>
  <script type="module" src="./.well-known/assets/elements.js"></script>
</head>
<body>
  <blog-layout data-path="/articles">
    <blog-article-list path="/articles"
                       data-resource='[{"id":1,"title":"..."}]'>
    </blog-article-list>
  </blog-layout>
</body>
</html>
```

Key attributes injected by rikka-site:
- **`data-path`** on layout element — current URL path (for nav active state)
- **`path`** on resource element — resource path
- **`data-resource`** on resource element — serialized data (when `serialization` is `"data-attr"` or `"both"`)
- **`<script type="application/ld+json">`** in `<head>` — JSON-LD data (when `serialization` is `"jsonld"` or `"both"`)

## Transformer System

Transformers convert Reprs: `(Schema | MIME) → (Schema | MIME)`.

### Pipeline

```
Repr(value, schema) → [Value→Value] → Repr(value', schema')
                     → [Value→Raw]   → Repr(raw, meta.type = mimeType)
                     → [Raw→Raw]     → Repr(raw, meta.type = mimeType')
```

### Transformer Interface

```typescript
interface Transformer {
  /** Input: Schema (matches value content) or MIME string (matches raw content) */
  input: Schema | string;
  /** Output: Schema (produces value) or MIME string (produces raw) */
  output: Schema | string;
  /** Priority for negotiation (higher = preferred, default 0) */
  priority?: number;
  /** Transform a Repr into another Repr */
  transform(repr: Repr, ctx: TransformContext): Repr | Promise<Repr>;
}
```

### Built-in Transformers

| Transformer | Input | Output | Notes |
|-------------|-------|--------|-------|
| `jsonTransformer` | `anySchema` | `application/json` | `JSON.stringify(content, null, 2)` |
| `jsonldTransformer` | `anySchema` | `application/ld+json` | Wraps with `@context`, `@id`, `@type`, `@graph` |
| `csvTransformer` | `array<object>` | `text/csv` | RFC 4180; quotes/escapes fields with comma/quote/newline |
| `textTransformer` | `anySchema` | `text/plain` | Human-readable `key: value` view; good for `curl` and debugging |
| `cborTransformer` | `anySchema` | `application/cbor` | Binary (RFC 8949); outputs `Uint8Array`, preserves `Uint8Array` fields as byte strings |
| `htmlTransformer` | `anySchema` | `text/html` | Default HTML; use `createHtmlTransformer(config)` to customize |

All built-in transformers are registered automatically by the `Site` constructor.

**Binary formats (CBOR, protobuf) produce `Uint8Array` content** that flows
through the pipeline as raw bytes — it is never decoded via `TextDecoder`,
so arbitrary byte sequences survive intact. `TransformResult.body` is
`string | Uint8Array`; the HTTP adapters (`node`, `edge`) already accept both.

### Schema-based Transformer Factory: `protobuf(schema)`

Protobuf is **schema-based** — it cannot serialize arbitrary objects
without a pre-defined message type. Therefore `protobuf` is a **factory
function**, not a constant: `protobuf(schema)` returns a `Transformer`
specialized to one message type. It is **not** registered by default.

The `schema` is duck-typed (`{ encode(message): Uint8Array }`), so
rikka-site stays free of a protobufjs dependency. Pass a protobufjs `Type`
(wrapped to call `.finish()`), a generated class, or any object with an
`encode` method.

```typescript
import protobufjs from "protobufjs";
import { protobuf, Site } from "@takanashi/rikka-site";

const Root = await protobufjs.load("user.proto");
const User = Root.lookupType("app.User");

const app = new Site(
  { users: new Users() },
  {
    transformers: [
      protobuf({
        encode: (msg) => User.encode(msg).finish(),
      }),
    ],
  },
);
// GET /users?accept=protobuf → application/x-protobuf bytes (Uint8Array)
```

### Custom Transformer Examples

**Value → Raw (CSV):**

```typescript
const csvTransformer: Transformer = {
  input: { type: "array", items: { type: "object" } },
  output: "text/csv",
  transform(repr: Repr): Repr {
    const data = repr.content as Record<string, unknown>[];
    if (!Array.isArray(data) || data.length === 0)
      return { content: "", meta: { type: "text/csv" } };
    const header = Object.keys(data[0]!).join(",");
    const rows = data.map((r) => Object.values(r).join(","));
    return { content: [header, ...rows].join("\n"), meta: { type: "text/csv" } };
  },
};
```

**Raw → Raw (image → HTML wrapper):**

```typescript
const imageToHtml: Transformer = {
  input: "image/*",           // wildcard MIME matching
  output: "text/html",
  transform(repr: Repr): Repr {
    const mime = repr.meta.type ?? "";
    return {
      content: `<img src="data:${mime};base64,${repr.content}" />`,
      meta: { type: "text/html" },
    };
  },
};
```

**Value → Value (data filtering/enrichment):**

```typescript
const filterTransformer: Transformer = {
  input: anySchema,
  output: anySchema,
  priority: 100,  // runs before serialization
  transform(repr: Repr): Repr {
    if (Array.isArray(repr.content)) {
      return { content: repr.content.filter(/* ... */), meta: repr.meta };
    }
    return repr;
  },
};
```

## HTML Transformer Configuration

`createHtmlTransformer(config)` controls the SSR HTML envelope. Register it on the site's registry to override the default:

```typescript
import { createHtmlTransformer } from "@takanashi/rikka-site";

const customHtml = createHtmlTransformer({
  layoutElement: "blog-layout",        // Wrap content in <blog-layout>
  title: (path, data) => `${path}`,
  meta: (path, data, meta) => ({ description: `Resource at ${path}` }),
  openGraph: true,                     // Infers og:title from title
  noscript: true,                      // <noscript> fallback with raw data
  stylesheets: ["/styles.css"],        // CSS files in <head>
  lang: "en",                          // <html lang="en"> fallback
  sdk: true,                           // Inject /.well-known/sdk/sdk.js (default)
  serialization: "data-attr",          // "data-attr" | "jsonld" | "both"
});

app.registry.register(customHtml);
```

> **Note:** The `Site` constructor already registers a default HTML transformer. To fully replace it, unregister the default first, or just register your custom one with higher `priority`.

### Key Options

| Option | Purpose |
|--------|---------|
| `layoutElement` | Wrap body content in a custom element (e.g. `<blog-layout>`) |
| `title` | Static string or `(path, data) => string` for `<title>` |
| `meta` | `(path, data, meta) => Record<string, string>` for `<meta name>` tags |
| `openGraph` | `true` for basic OG tags, or a function returning property → content |
| `noscript` | `true` to inject a `<noscript>` fallback with raw resource data |
| `lang` | Fallback for `<html lang="...">`; `repr.meta.lang` takes precedence |
| `sdk` | `false` to disable the auto-injected SDK script |
| `serialization` | `"data-attr"` (default), `"jsonld"`, or `"both"` |
| `sitemap` | Sitemap entries embedded as `<script data-sitemap>` for client routing |
| `customElements` | Custom element entries (auto-injects elements.js bundle) |
| `assets` | Static assets (auto-injects favicon link) |

## Auth System

Auth resources are ordinary `ActionKind` resources. The `Site` auth config references them by name and declares which routes require authentication via glob patterns.

```typescript
import { ActionKind, HttpError, Site } from "@takanashi/rikka-site";
import type { Repr, RequestContext } from "@takanashi/rikka-site";

class JwtVerifier extends ActionKind {
  async invoke(ctx: RequestContext): Promise<Repr> {
    const token = ctx.headers["authorization"]?.replace("Bearer ", "");
    if (!token) throw new HttpError(401, "missing token");
    const payload = verifyJwt(token);
    return {
      content: {
        subject: payload.sub,
        scopes: Array.isArray(payload.scopes) ? payload.scopes.join(" ") : payload.scopes,
        expiresAt: payload.exp,
      },
    };
  }
}

const app = new Site(
  {
    "jwt-auth": new JwtVerifier(),
    users: new Users(),
    public: new PublicData(),
  },
  {
    auth: {
      verifier: "jwt-auth",
      rules: [
        { match: "/users/**" },                    // requires auth (uses verifier)
        { match: "/public/**", auth: null },       // explicitly no auth
        { match: "/admin/**", auth: "admin-auth" },// use specific verifier
      ],
    },
  },
);
```

Glob patterns support `*` (single segment) and `**` (any depth). First matching rule wins. The auth resource's return value becomes `ctx.identity` in subsequent handlers.

## CORS Configuration

```typescript
const app = new Site(
  { users: new Users() },
  {
    cors: {
      // origin: undefined → "*" (or undefined if credentials: true)
      origin: ["https://app.example.com", "https://admin.example.com"],
      credentials: true,
      headers: "Content-Type, Authorization, Accept, X-Request-ID",
      methods: "GET, POST, PUT, PATCH, DELETE",
      maxAge: 86400,
      exposeHeaders: "X-Total-Count",
    },
  },
);
```

`handleRequest` automatically handles OPTIONS preflight and adds CORS headers to all responses.

## Pagination

Use the `paginate()` helper with `ctx.range` (parsed from the `Range` header):

```typescript
import { CollectionKind, paginate } from "@takanashi/rikka-site";
import type { Repr, RequestContext } from "@takanashi/rikka-site";

class Articles extends CollectionKind {
  async list(ctx: RequestContext): Promise<Repr> {
    return paginate(articles, ctx.range);  // handles Range: items=0-9
  }
  async create(ctx: RequestContext): Promise<Repr> { /* ... */ }
}
```

- No `Range` header → returns all items (200)
- `Range: items=0-9` → returns first 10 items as `PartialContent` (206)
- The server emits `Content-Range: items 0-9/100` automatically

## Static Files

```typescript
import { FileSystemKind, Site } from "@takanashi/rikka-site";

// Node.js — serve from filesystem
const assets = new FileSystemKind({ root: "./public" });

// Edge runtime — use a resolver (KV, R2, bundled manifest, etc.)
const edgeAssets = new FileSystemKind({
  resolver: async (path) => {
    const file = await MY_KV.get(path);
    if (!file) return null;
    return { content: file, type: "text/css" };
  },
});

const app = new Site({ assets });
// /assets/style.css → ./public/style.css
```

`FileSystemKind` is a concrete class — pass `{ root }` or `{ resolver }` to the constructor. It is a catchAll resource — any remaining path segments are resolved as relative file paths. Path traversal (`..`) is rejected with 403 before the resolver is called. Directory requests fall back to `index.html`.

## Client-Side SDK

rikka-site auto-injects a SDK at `/.well-known/sdk/sdk.js` (exposed as `window.__rikka`). It provides:

### Hydration Helpers

```typescript
// Extract SSR data from DOM (checks data-resource, DSDOM, JSON-LD)
const data = window.__rikka.findResourceData<Article[]>(element);

// Async version — falls back to fetching ?accept=json
const data = await window.__rikka.findResourceDataAsync<Article[]>(element);
```

### API Helpers

```typescript
// Typed JSON requests to the same origin
const articles = await window.__rikka.apiGet<Article[]>("/articles");
const created = await window.__rikka.apiPost<Article>("/articles", { title: "New" });
await window.__rikka.apiDelete("/articles/1");

// Throws ApiError on non-2xx
try {
  await window.__rikka.apiGet("/articles/999");
} catch (e) {
  if (e instanceof window.__rikka.ApiError) console.log(e.status, e.details);
}
```

### Client-Side Router

```typescript
const router = window.__rikka.createRouter(
  window.__rikka.readSitemapFromDom()!
);
router.start();  // intercepts <a> clicks, uses View Transitions

const match = router.match("/articles/42");
// { route: { path: "/articles/:articleId", kind: "Item", ... }, params: { articleId: "42" } }
```

## HTTP Adapters

| Platform | Adapter | Entry |
|----------|---------|-------|
| Cloudflare Workers | `createCloudflareWorkerHandler(app)` | `export default { fetch(req, env, ctx) }` |
| Cloudflare Pages (Advanced) | `createCloudflarePagesHandler(app, { apiPrefix? })` | `_worker.js` |
| Deno Deploy | `createDenoDeployHandler(app)` | `Deno.serve(handler)` |
| Vercel Edge | `handleWebRequest(app, req)` | `export function GET(req)` + `export const runtime = "edge"` |
| Node.js | `app.listen({ port, host })` | `await app.listen()` |
| Any Web Standard | `handleWebRequest(app, req)` | `Request → Response` |

rikka-site has **zero Node.js dependencies** in its core. `Site.listen()` dynamically imports `node:http` only when called, so edge bundlers never pull it into the bundle.

## Patterns & Best Practices

### Pattern 1: Navigation Active State from `data-path`

The layout element receives `data-path` from SSR. Use it to highlight the current nav item:

```typescript
defineElement("my-layout", {
  render(this) {
    // ✅ Read from plain attribute — NOT from declared attributes
    const currentPath = this.getAttribute("data-path") ?? "/";
    const pathSignal = signal(currentPath);

    const activeClass = (href: string) => computed(() => {
      const p = pathSignal.get();
      return (p === href || (href !== "/" && p.startsWith(href))) ? "active" : "";
    });

    return div(
      nav(
        a({ className: activeClass("/"), href: "/" }, "Home"),
        a({ className: activeClass("/articles"), href: "/articles" }, "Articles"),
      ),
      main(document.createElement("slot")),
    );
  },
});
```

### Pattern 2: Each Resource Renders Its Own Element

Every Kind declares an `element` tag name. The server renders that tag directly — no wrapper element, no client-side routing layer:

```typescript
class ArticleItemKind extends ItemKind {
  element = "blog-article-detail";
  resolve(params) {
    const r = new ArticleItemResource();
    r.params = params;
    r.element = this.element;  // propagate to the resource instance
    return r;
  }
}
```

The server emits `<blog-article-detail path="/articles/42" data-resource="...">` directly. Client-side navigation is handled by the SDK's `createRouter()` + `navigate()`, which fetches the new HTML and replaces the current resource element with the new one — the correct element tag is already in the server response.

### Pattern 3: Reactive Data from SSR

Always wrap extracted data in `signal()` and use `computed()` for derived values:

```typescript
render(this) {
  const rawData = findResourceData<MyData>(this);
  const data = signal<MyData | null>(rawData ?? null);

  // ✅ computed() for value-position reactivity
  const title = computed(() => data.get()?.title ?? "");
  const count = computed(() => data.get()?.items?.length ?? 0);

  // ✅ Pass signals directly as children (not .get())
  return div(h1(title), p(`${count} items`));
}
```

### Pattern 4: Handling Multiple Data Formats

SSR may serialize data differently depending on Kind and serialization strategy:
- **Collections in `data-resource`**: raw array `[...]`
- **Collections in JSON-LD**: wrapped `{ "@graph": [...] }`
- **Items/Singletons**: plain object `{...}` in both formats

Handle both defensively:

```typescript
const rawData = findResourceData(this);
const articles = signal<Article[]>(
  Array.isArray(rawData) ? rawData : (rawData && (rawData as any)["@graph"]) ?? []
);
```

## Common Pitfalls When Using rikka-site

### 1. `data-path` is a plain attribute, NOT reactive

rikka-site sets `data-path` as a plain HTML attribute, not a declared attribute. Read it via `this.getAttribute("data-path")`, not `this.currentPath`. If you need reactivity, wrap it in a `signal()`.

### 2. Don't forget path normalization

Server URLs may have trailing slashes (`/articles/1/`). Normalize before routing:

```typescript
const normPath = path.replace(/\/+$/, "");
```

### 3. Route specificity order matters

Match **specific paths before prefix paths** to avoid false matches:

```typescript
// ✅ Correct: item BEFORE collection
if (path.match(/^\/articles\/\d+$/)) return createElement("article-detail");
if (path.startsWith("/articles"))     return createElement("article-list");

// ❌ Wrong: collection captures everything
if (path.startsWith("/articles"))     return createElement("article-list"); // /articles/1 matched here!
```

### 4. `serialization: "both"` doubles the payload

With `"both"`, the same data appears in both `data-resource` and a `<script type="application/ld+json">` tag. For large datasets, use `"data-attr"` (default) or `"jsonld"` alone.

### 5. `defineElement()` already calls `customElements.define()`

Don't call `customElements.define()` again for elements created with `defineElement()` — it throws `NotSupportedError`. Use a guard if you need re-registration:

```typescript
if (!customElements.get(name)) customElements.define(name, ctor);
```

### 6. Static files on Edge runtimes

Cloudflare Workers / Deno Deploy have no filesystem, so `new FileSystemKind({ root: "..." })` won't work. Use the `resolver` option:

```typescript
const assets = new FileSystemKind({
  resolver: async (path) => {
    const file = await MY_KV.get(path);
    return file ? { content: file, type: "text/css" } : null;
  },
});
```

### 7. `?accept` short names are hardcoded

The `?accept=json`, `?accept=cbor`, etc. short names are hardcoded in the negotiator. Built-in short names: `json`, `jsonld`, `csv`, `text`, `cbor`, `protobuf`/`proto`, `xml`, `html`. For custom MIME types, use the full MIME string: `?accept=application/vnd.myapp+json`.

### 8. Handlers must return a `Repr` explicitly

Handlers MUST return a `Repr` (`{ content, meta? }`) — there is no auto-wrapping of plain values. If you need to set `meta.location` (for redirects/201), return an explicit `Repr`:

```typescript
class Articles extends CollectionKind {
  async create(ctx: RequestContext): Promise<Repr> {
    const body = await ctx.json();
    const item = createItem(body);
    // ✅ Explicit Repr with location → 201 Created
    return { content: item, meta: { location: `./${item.id}` } };
  }
}
```

## See Also

- [../overview/](../overview/) — High-level framework overview
- [../custom-element/](../custom-element/) — Defining custom elements with `defineElement`
- [../reactive-state/](../reactive-state/) — Signals, computed, effect
- [../common-pitfalls/](../common-pitfalls/) — LLM-specific mistakes to avoid
