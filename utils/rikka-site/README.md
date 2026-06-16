# @takanashi/rikka-site

Resource-oriented server framework with content negotiation and automatic transformation.

## Core Concepts

### The Five Levels

| Level | Concept          | Materialized by                      | Example                             |
| ----- | ---------------- | ------------------------------------ | ----------------------------------- |
| 1     | **Kind**         | Framework                            | `Collection`                        |
| 2     | **ResourceFactory** | `Kind(impl)`                         | `Collection({ list, create, ... })` |
| 3     | **Mount**        | `ResourceFactory(config)` → constructor | `Users({ table: "users" })`         |
| 4     | **Resource**     | `new Mount(params)`                  | URL `/users/42` resolved            |
| 5     | **Operation**    | `resource[operation](ctx)`           | `res.list(ctx)`                     |

Each level only depends on the output of the previous level. Resources are pure domain concepts — they know nothing about HTTP.

### Kinds

| Kind       | GET    | POST   | PUT     | PATCH | DELETE | Description              |
| ---------- | ------ | ------ | ------- | ----- | ------ | ------------------------ |
| Collection | list   | create | —       | —     | —      | Resource collection      |
| Item       | content | —      | replace | patch | delete | Collection member        |
| Singleton  | content | —      | replace | patch | —      | Globally unique resource |
| ReadOnly   | content | —      | —       | —     | —      | Read-only view           |
| Action     | —      | invoke | —       | —     | —      | Stateless operation      |
| Proxy      | get    | create | replace | patch | delete | Proxy resource           |

### Representation

All data in rikka-site flows as a **Repr** — `{ content, meta }`:

- **Value content** — structured data with a **Schema** (the "internal" form)
- **Raw content** — pre-serialized bytes (`string` or `Uint8Array`) with a **MIME type** in `meta.type` (the "wire" form)

Handlers return plain values (auto-wrapped as `{ content: value, meta: {} }`) or explicit `Repr` objects.

### Content Negotiation

The same URL serves both API data and pages. The representation is determined by:

1. `?accept` query parameter (explicit override)
2. `Accept` header (standard negotiation with q-values)
3. Default: `text/html`

```
GET /users                  → HTML page
GET /users?accept=json      → JSON array
GET /users?accept=jsonld    → JSON-LD document
Accept: application/json    → JSON array
Accept: application/ld+json → JSON-LD document
```

### Transformers

Transformers convert Representations: `(Schema | MIME) → (Schema | MIME)`

- **Value → Value** — transforms structured data (e.g. filtering, enrichment)
- **Value → Raw** — serializes to a MIME type (e.g. JSON, CSV, HTML)
- **Raw → Raw** — converts between content types (e.g. image → HTML wrapper)

Pipeline: `Repr(value, schema) → [Value→Value] → Repr(value', schema') → [Value→Raw] → Repr(raw, mime) → [Raw→Raw] → Repr(raw', mime')`

## Installation

```bash
npm install @takanashi/rikka-site
```

## Quick Start

```typescript
import {
  Collection,
  Item,
  Singleton,
  Site,
  handleWebRequest,
} from "@takanashi/rikka-site";

const Articles = Collection(() => ({
  schema: { type: "array", items: { type: "object" } },
  list: () => [{ id: 1, title: "Hello Rikka" }],
  create: (ctx) => {
    const article = { id: 2, ...ctx.body };
    return { content: article, meta: { location: `./${article.id}` } };
  },
  children: {
    ":articleId": (id) =>
      Item(() => ({
        content: () => ({ id, title: `Article ${id}` }),
        delete: () => ({ content: null, meta: {} }),
      })),
  },
}));

const Settings = Singleton(() => ({
  content: () => ({ theme: "dark" }),
  patch: (ctx) => ({ content: { theme: ctx.body.theme }, meta: {} }),
}));

const app = new Site({
  articles: Articles(),
  settings: Settings(),
});

export default { fetch: (req) => handleWebRequest(app, req) };
```

## API Reference

### Kind Factories

#### `Collection(impl)`

Creates a Collection ResourceType. The `impl` function receives config and returns a descriptor.

```typescript
const Users = Collection<{ table: string }>(({ table }) => ({
  schema: { type: "array", items: { type: "object" } },
  list: (ctx) => [...items],
  create: (ctx) => { items.push(ctx.body); return ctx.body; },
  // Optional
  children: { ":userId": (id) => Item(() => ({ ... })) },
  element: UserListElement,       // Custom element for HTML rendering
  context: "https://schema.org",  // JSON-LD @context
  jsonldType: "UserCollection",   // JSON-LD @type override
}));
```

#### `Item(impl)`

```typescript
const Article = Item(() => ({
  schema: { type: "object", properties: { id: { type: "number" }, title: { type: "string" } } },
  content: (ctx) => db.find("articles", ctx.params.articleId),
  replace: (ctx) => db.update("articles", ctx.params.articleId, ctx.body),
  patch: (ctx) => db.patch("articles", ctx.params.articleId, ctx.body),
  delete: (ctx) => db.remove("articles", ctx.params.articleId),
}));
```

#### `Singleton(impl)`

```typescript
const Settings = Singleton(() => ({
  content: (ctx) => ({ theme: "dark" }),
  replace: (ctx) => Object.assign(settings, ctx.body),
  patch: (ctx) => Object.assign(settings, ctx.body),
}));
```

#### `ReadOnly(impl)`

```typescript
const Dashboard = ReadOnly(() => ({
  content: (ctx) => ({ userCount: 42, articleCount: 7 }),
}));
```

#### `Action(impl)`

```typescript
const Search = Action(() => ({
  invoke: (ctx) => searchIndex.query(ctx.body.query),
}));
```

#### `Proxy(impl)`

```typescript
const ExternalAPI = Proxy(() => ({
  target: (path) => new URL(path, "https://api.example.com"),
}));
```

### RequestContext

All handlers receive a `RequestContext` object:

```typescript
interface RequestContext {
  method: string; // HTTP method
  path: string; // URL path
  resourcePath?: string; // Resolved resource mount path (e.g. "/assets" for a Static resource)
  params: Record<string, string>; // Path parameters
  query: Record<string, string>; // Query parameters
  headers: Record<string, string>; // Request headers (lowercase keys)
  body?: unknown; // Parsed request body
  identity?: Identity; // Auth identity (if authenticated)
  range?: RangeSpec; // Parsed Range header, if present
}
```

### Repr

Handlers return a `Repr` object (`{ content, meta }`) or a plain value, which the framework wraps automatically. Transport semantics are inferred from `content` and `meta`:

- `{ content: null, meta: { location: "./new" } }` → 302 redirect
- `{ content: null, meta: {} }` → 204 no content
- `POST` on a `Collection` with `meta.location` → 201 created
- `DELETE` → 204
- `PartialContent` shape → 206 partial content
- Plain value → 200

### Schema

Schemas describe the shape of data returned by handlers. Used by transformers and SDK generation.

```typescript
const Users = Collection(() => ({
  schema: {
    type: "array",
    items: {
      type: "object",
      properties: {
        id: { type: "number" },
        name: { type: "string" },
        email: { type: "string" },
      },
    },
  },
  list: (ctx) => [...users],
  create: (ctx) => { ... },
}));
```

Schema types: `any`, `null`, `boolean`, `number`, `string`, `array`, `object`.

### Site Definition

#### `Site(tree, options?)`

Declares the resource tree. Object keys become URL path segments, values become resources or sub-trees.

```typescript
const app = new Site({
  users: Users({ table: "users" }),
  posts: Posts({ table: "posts" }),
  settings: Settings({}),
  admin: {
    // Route group — pure nesting, no resource
    users: Users({ table: "admin_users" }),
  },
  actions: {
    search: Search({}),
  },
});

// Resolves URLs
app.resolve("/users"); // Collection
app.resolve("/users/42"); // Item with params { userId: "42" }
app.resolve("/admin/users"); // Collection
app.resolve("/nonexistent"); // null
```

#### Trailing Slash

Use the `"/"` key in `children` to define a different resource for trailing-slash URLs:

```typescript
const Files = Item(() => ({
  content: (ctx) => getFileMetadata(ctx.params.path),
  children: {
    "/": () =>
      Collection(() => ({
        list: (ctx) => listDirectoryContents(ctx.params.path),
        create: (ctx) => createDirectoryEntry(ctx.params.path, ctx.body),
      }))(),
  },
}));

// /files/docs     → Item (file metadata)
// /files/docs/    → Collection (directory listing)
```

#### Auth

Configure authentication with the `auth` option. Auth resources are ordinary Action resources:

```typescript
import { HttpError } from "@takanashi/rikka-site";

const JwtVerifier = Action(() => ({
  invoke: (ctx) => {
    const token = ctx.headers["authorization"]?.replace("Bearer ", "");
    if (!token) throw new HttpError(401, "missing token");
    const payload = verifyJwt(token);
    return {
      subject: payload.sub,
      scopes: payload.scopes,
      expiresAt: payload.exp,
    };
  },
}));

const app = new Site(
  {
    "jwt-auth": JwtVerifier({}),
    users: Users({ table: "users" }),
    public: PublicData({}),
  },
  {
    auth: {
      verifier: "jwt-auth",
      rules: [
        { match: "/users/**" }, // requires auth (uses verifier)
        { match: "/public/**", auth: null }, // explicitly no auth
      ],
    },
  },
);
```

Glob patterns support `*` (single segment) and `**` (any depth).

### HTTP Adapters

#### `Site.prototype.handleRequest(request)` — Framework-agnostic

```typescript
const response = await app.handleRequest({
  method: "GET",
  path: "/users/42",
  accept: "application/json",
  headers: { authorization: "Bearer token" },
});
// response: { status: 200, headers: { "Content-Type": "application/json" }, body: "..." }
```

#### `handleWebRequest(site, request)` — Web Standard API (Universal)

Works on any runtime with `Request`/`Response` APIs.

```typescript
import { handleWebRequest } from "@takanashi/rikka-site";

const response = await handleWebRequest(app, request);
```

#### `createFetchHandler(site)` — Convenience wrapper

```typescript
import { createFetchHandler } from "@takanashi/rikka-site";

export default { fetch: createFetchHandler(app) };
```

### Platform-Specific Adapters

#### Cloudflare Workers

```typescript
// src/index.ts
import { Site, createCloudflareWorkerHandler } from "@takanashi/rikka-site";

const app = new Site({
  /* ... */
});

// Standard Workers signature: fetch(request, env, ctx)
export default createCloudflareWorkerHandler(app);
```

Requires `wrangler.toml`:

```toml
name = "my-site"
main = "src/index.ts"
compatibility_date = "2025-01-01"
```

With typed bindings:

```typescript
interface Env {
  MY_KV: KVNamespace;
  DB: D1Database;
}
export default createCloudflareWorkerHandler<Env>(app);
```

#### Cloudflare Pages — Advanced Mode

Place a `_worker.js` in your build output directory. The handler manages both API routes and static assets.

**Note**: rikka-site requires Advanced Mode. The Functions mode (`functions/` directory) is incompatible because it maps one file per endpoint, while rikka-site uses a single entry point with a declarative resource tree.

```typescript
// _worker.js
import { Site, createCloudflarePagesHandler } from "@takanashi/rikka-site";

const app = new Site({
  /* ... */
});

// All paths → rikka-site, 404s fall back to env.ASSETS
export default createCloudflarePagesHandler(app);
```

With API prefix (recommended for mixed static + API sites):

```typescript
// Only /api/* goes to rikka-site, everything else is static
export default createCloudflarePagesHandler(app, { apiPrefix: "/api" });
```

#### Vercel Edge Functions

```typescript
// api/hello.ts
import { Site, handleWebRequest } from "@takanashi/rikka-site";

const app = new Site({
  /* ... */
});

export const runtime = "edge";

// Option 1: Method-specific exports
export function GET(request: Request) {
  return handleWebRequest(app, request);
}

// Option 2: Fetch handler (all methods)
export default { fetch: (req) => handleWebRequest(app, req) };
```

#### Deno Deploy

```typescript
// main.ts
import { Site, createDenoDeployHandler } from "@takanashi/rikka-site";

const app = new Site({
  /* ... */
});

Deno.serve(createDenoDeployHandler(app));
```

#### Node.js

```typescript
import { serve } from "@takanashi/rikka-site/node";

const app = new Site({
  /* ... */
});

const server = serve(app, { port: 3000 });
console.log(`Listening on ${server.host}:${server.port}`);
```

For an existing `http.Server`, use `createNodeHandler`:

```typescript
import { createServer } from "node:http";
import { createNodeHandler } from "@takanashi/rikka-site/node";

const app = new Site({
  /* ... */
});

const server = createServer(createNodeHandler(app));
server.listen(3000);
```

### Transformers

Transformers are registered on a `TransformerRegistry`. A `Site` creates one automatically at `app.registry`.

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
```

### Content Negotiation

#### `negotiate(registry, acceptHeader?, acceptQuery?)`

`negotiate` uses a site's `TransformerRegistry` to pick a content type that can actually be produced.

```typescript
import { negotiate } from "@takanashi/rikka-site";

negotiate(app.registry); // { contentType: "text/html" }
negotiate(app.registry, "application/json"); // { contentType: "application/json" }
negotiate(app.registry, "text/html;q=0.9, application/json"); // { contentType: "application/json" }
negotiate(app.registry, undefined, "json"); // { contentType: "application/json" }
```

## Platform Support

rikka-site has **zero Node.js dependencies** in its core. It works on:

| Platform                 | Adapter                         | Entry format                               | Notes                                       |
| ------------------------ | ------------------------------- | ------------------------------------------ | ------------------------------------------- |
| Cloudflare Workers       | `createCloudflareWorkerHandler` | `export default { fetch(req, env, ctx) }`  | wrangler.toml required                      |
| Cloudflare Pages         | `createCloudflarePagesHandler`  | `_worker.js` in output dir (Advanced Mode) | Falls back to `env.ASSETS` for static files |
| Vercel Edge              | `handleWebRequest`              | `export function GET(req)`                 | Add `export const runtime = "edge"`         |
| Deno Deploy              | `createDenoDeployHandler`       | `Deno.serve(handler)`                      | No build step                               |
| Node.js                  | `serve` / `createNodeHandler`   | `serve(app)` or `createServer(createNodeHandler(app))` | Import from `@takanashi/rikka-site/node`    |
| Any Web Standard runtime | `handleWebRequest`              | `Request → Response`                       | Universal adapter                           |

## JSON-LD

When `Accept: application/ld+json` is requested, resources are serialized as JSON-LD:

- **Collections**: `{ "@context", "@id", "@type", "@graph": [...] }`
- **Items/Singletons**: `{ "@context", "@id", "@type", ...data }`
- **HTML pages**: Include a `<script type="application/ld+json">` block

Customize the context and type via `context` and `jsonldType` on the descriptor:

```typescript
const Users = Collection(() => ({
  list: (ctx) => [],
  create: (ctx) => ctx.body,
  context: "https://schema.org",
  jsonldType: "PersonCollection",
}));
```

## Examples

See `examples/blog-site/` for a complete example with:

- All 6 resource kinds
- Nested resources (articles → comments)
- Content negotiation (HTML, JSON, JSON-LD, CSV, plain text)
- Schema declarations
- Node.js HTTP server adapter
- Cloudflare Workers adapter
- **Client-side hydration** with Custom Elements (see [skills/rikka-site](../../skills/rikka-site/))

## Client-Side Hydration

When using rikka-site for full-stack apps (not just APIs), the HTML transformer injects resource data into the DOM so client-side components can hydrate from it.

### SSR Output Structure

For each request, the HTML transformer produces:

```html
<blog-layout data-path="/articles" data-kind="Collection">
  <rikka-resource path="/articles" kind="Collection"
                   data-resource='[{"id":1,"title":"..."}]'>
  </rikka-resource>
</blog-layout>
```

### Data Injection Points

| Location | Format | When |
|----------|--------|------|
| `data-resource` attribute on `<rikka-resource>` | Raw JSON (array or object) | Always (data-attr strategy) |
| `<script type="application/ld+json">` in `<head>` | JSON-LD with `@context`, `@graph` | Always |
| DSDOM `<template shadowrootmode>` | JSON in template content | When dsdom strategy selected |

### Reading Data on the Client

Extract data from the DOM in your custom element's `render()`:

```typescript
function findResourceData<T>(el?: Element): T | null {
  // 1. data-resource attribute (primary)
  if (el) {
    const attr = el.getAttribute("data-resource");
    if (attr) try { return JSON.parse(attr); } catch {}
  }
  // 2. JSON-LD script fallback
  const script = document.querySelector('script[type="application/ld+json"]');
  if (script) try { return JSON.parse(script.textContent ?? ""); } catch {}
  return null;
}

// In your component:
render(this) {
  const data = signal(findResourceData<Article[]>(this) ?? []);
  // ... use data reactively with computed()
}
```

### Layout Attributes

The `layoutElement` wrapper receives these SSR-injected attributes:

| Attribute | Example | Usage |
|-----------|---------|-------|
| `data-path` | `"/articles"` | Current URL path — use for nav active state |
| `data-kind` | `"Collection"` | Resource Kind name — use for Kind-aware layout |

Read them with `this.getAttribute("data-path")` (not reactive attributes).

### Roadmap: Planned Improvements

Based on real-world usage, these improvements are planned:

- **Exported `hydrateData()` utility** — no need to copy-paste `findResourceData`
- **Built-in client-side router** — `elementMap` config generates client-side routing
- **`bodyHtml` config option** — inject global UI components without string hacks
- **Single serialization format option** — avoid double data payload
- **Layout context passing** — dynamic data from server to layout shell
