# @takanashi/rikka-site

Resource-oriented server framework with content negotiation and automatic transformation.

## Core Concepts

### The Four Levels

| Level | Concept                   | Materialized by                    | Example                              |
| ----- | ------------------------- | ---------------------------------- | ------------------------------------ |
| 1     | **Kind**                  | Abstract class                     | `CollectionKind`, `ItemKind`, etc.   |
| 2     | **Resource class**        | `class Foo extends CollectionKind` | `class Users extends CollectionKind` |
| 3     | **ResourceKind instance** | `new Foo()`                        | `new Users()`                        |
| 4     | **Operation**             | `resource.get(ctx)`                | `resource.post(ctx)`                 |

Each level only depends on the output of the previous level. Resources are pure domain concepts — they know nothing about HTTP. The site tree stores `ResourceKind` instances; per-request state (params, path) is carried by a `Resource` wrapper created via `kind.createResource(params, path)`. The server dispatches HTTP methods polymorphically (`resource.get(ctx)`, `resource.post(ctx)`, …).

### Kinds

Five abstract Kinds (extend and instantiate):

| Kind       | GET     | POST   | PUT     | PATCH | DELETE | QUERY  | Description              |
| ---------- | ------- | ------ | ------- | ----- | ------ | ------ | ------------------------ |
| Collection | list    | create | —       | —     | —      | list   | Resource collection      |
| Item       | content | —      | replace | patch | delete | —      | Collection member        |
| Singleton  | content | —      | replace | patch | —      | —      | Globally unique resource |
| ReadOnly   | content | —      | —       | —     | —      | —      | Read-only view           |
| Action     | —       | invoke | —       | —     | —      | —      | Stateless operation      |

Concrete resource adapters live in separate packages:

| Package | Kind | Description |
| ------- | ---- | ----------- |
| `@takanashi/rikka-resource-filesystem` | `FileSystemKind` | Static files + WebDAV |
| `@takanashi/rikka-resource-database` | `DatabaseKind` | Schema-driven CRUD |

### Representation

All data in rikka-site flows as a **Repr** — `{ content, meta?, links? }`:

- **Value content** — structured data with a **Schema** (the "internal" form)
- **Raw content** — pre-serialized bytes (`string` or `Uint8Array`) with a **MIME type** in `meta.type` (the "wire" form)

Handlers MUST return a `Repr` (or `Promise<Repr>`) explicitly. There is no auto-wrapping of plain values — always return `{ content, meta }`.

### Content Negotiation

The same URL serves both API data and pages. The representation is determined by:

1. `?accept` query parameter (explicit override)
2. `Accept` header (standard negotiation with q-values)
3. Default: `application/json` for Value content (structured data); the resource's `meta.type` or a path-guessed MIME for Raw content

```
GET /users                  → JSON array (default)
GET /users?accept=html      → HTML page
GET /users?accept=jsonld    → JSON-LD document
GET /users?accept=csv       → CSV file
GET /users?accept=cbor      → CBOR binary (Uint8Array body)
GET /users?accept=protobuf  → protobuf bytes (if protobuf(schema) registered)
Accept: application/json    → JSON array
Accept: application/ld+json → JSON-LD document
Accept: text/html           → HTML page (browser negotiation)
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
  CollectionKind,
  ItemKind,
  SingletonKind,
  Site,
  handleWebRequest,
  type Schema,
} from "@takanashi/rikka-site";
import type { Repr } from "@takanashi/rikka-site";

let nextId = 2;
const articles: Array<{ id: number; title: string }> = [
  { id: 1, title: "Hello Rikka" },
];

class Articles extends CollectionKind {
  schema: Schema = { type: "array", items: { type: "object" } };

  async list(): Promise<Repr> {
    return { content: articles };
  }

  async create(ctx): Promise<Repr> {
    const body = await ctx.json();
    const article = { id: nextId++, ...body };
    articles.push(article);
    return { content: article, meta: { location: `./${article.id}` } };
  }
}

class Article extends ItemKind {
  schema: Schema = { type: "object" };

  async content(ctx): Promise<Repr> {
    const id = ctx.params.articleId;
    return { content: { id, title: `Article ${id}` } };
  }

  async delete(): Promise<Repr> {
    return { content: null, meta: {} };
  }
}

class Settings extends SingletonKind {
  schema: Schema = { type: "object" };

  async content(): Promise<Repr> {
    return { content: { theme: "dark" } };
  }

  async patch(ctx): Promise<Repr> {
    const body = await ctx.json();
    return { content: { theme: body.theme } };
  }
}

const app = new Site({
  articles: new Articles(),
  "articles/:articleId": new Article(),
  settings: new Settings(),
});

export default { fetch: (req) => handleWebRequest(app, req) };
```

## API Reference

### Kind Classes

Each Kind is an abstract class. Extend it and implement the required methods. Handlers receive a `RequestContext` and return a `Repr | Promise<Repr>`.

#### `class Foo extends CollectionKind`

`CollectionKind` supports `list` (GET), `create` (POST), and `query` (QUERY — RFC 10008).
The `query` method delegates to `list` after parsing a query IR; both `get` and
`query` parse the request into a `Query` object and pass it to `list`.

```typescript
import { CollectionKind, type Schema } from "@takanashi/rikka-site";
import type { Repr, RequestContext, Query } from "@takanashi/rikka-site";

class Users extends CollectionKind {
  schema: Schema = { type: "array", items: { type: "object" } };
  element = UserListElement; // Custom element for HTML rendering
  context = "https://schema.org"; // JSON-LD @context
  jsonldType = "UserCollection"; // JSON-LD @type override

  // `query` is optional — both GET and QUERY pass through here.
  async list(ctx: RequestContext, query?: Query): Promise<Repr> {
    let items = allUsers;
    if (query?.filter) items = items.filter(/* apply filter */);
    if (query?.sort) items = sortUsers(items, query.sort);
    if (query?.limit) items = items.slice(query.offset ?? 0, query.limit);
    return { content: items };
  }

  async create(ctx: RequestContext): Promise<Repr> {
    const body = await ctx.json();
    items.push(body);
    return { content: body, meta: { location: `./${items.length}` } };
  }
}

// Mount an instance in the site tree:
const app = new Site({ users: new Users() });
```

##### QUERY Method (RFC 10008)

`CollectionResource` provides built-in support for the HTTP `QUERY` method:

- **`parseQuery(ctx)`** — parses the request into a format-tagged `Query` union.
  Default dispatch by `Content-Type`: QUERY with `application/json` returns
  `{ type: "json", body }` (raw parsed JSON); `application/graphql` (or
  `*+graphql`) returns `{ type: "graphql", query }`; `application/dasl+xml`
  (or `*+dasl+xml`) returns `{ type: "dasl", doc }` (raw XML string —
  subclasses parse the doc themselves). GET returns
  `{ type: "urlencoded", params }` from the query string.
- **`supportedQueryTypes()`** — content types accepted for QUERY body. Default:
  `["application/json"]`. Override to add `application/graphql`,
  `application/dasl+xml`, etc.
- **`Accept-Query` header** — when a client sends QUERY with an unsupported
  `Content-Type`, the server replies `415` with an `Accept-Query` header listing
  the supported types **before** the body is read (via Node's `checkContinue`
  event).
- **`Query` union** — no IR / no normalization; each variant carries the raw
  parsed request in its native format:
  ```typescript
  type Query =
    | { type: "json"; body: unknown }
    | { type: "graphql"; query: string; variables?: Record<string, unknown> }
    | { type: "dasl"; doc: unknown }
    | { type: "urlencoded"; params: Record<string, string> };
  ```
  Subclasses switch on `query.type` in `list(ctx, query?)` to interpret the
  variants they support; unsupported variants throw `415` with `Accept-Query`.

##### Advertising Supported Query Syntax

```typescript
class GraphqlUsers extends UsersResource {
  override supportedQueryTypes(): string[] {
    return ["application/json", "application/graphql"];
  }
  override async parseQuery(ctx: RequestContext): Promise<Query> {
    const ct = (ctx.headers["content-type"] ?? "").toLowerCase();
    if (ct === "application/graphql") {
      const text = await ctx.text();
      return { type: "graphql", query: text };
    }
    return super.parseQuery(ctx);
  }
  async list(ctx: RequestContext, query?: Query): Promise<Repr> {
    if (query?.type === "graphql") {
      // execute query.graphql against your data store
    }
    return super.list(ctx, query);
  }
}
```

`DavFileSystemResource` (from `@takanashi/rikka-resource-filesystem`) supports
`QUERY` and `SEARCH` (RFC 5323) via DASL XML — its `supportedQueryTypes()`
returns `["application/dasl+xml"]` only, and the `<D:where>` / `<D:orderby>`
/ `<D:limit>` operators are applied to directory entries with full
depth:infinity recursion.

#### `class Foo extends ItemKind`

```typescript
import { ItemKind, type Schema } from "@takanashi/rikka-site";
import type { Repr, RequestContext } from "@takanashi/rikka-site";

class Article extends ItemKind {
  schema: Schema = {
    type: "object",
    properties: { id: { type: "number" }, title: { type: "string" } },
  };

  async content(ctx: RequestContext): Promise<Repr> {
    return { content: db.find("articles", ctx.params.articleId) };
  }

  async replace(ctx: RequestContext): Promise<Repr> {
    const body = await ctx.json();
    return { content: db.update("articles", ctx.params.articleId, body) };
  }

  async patch(ctx: RequestContext): Promise<Repr> {
    const body = await ctx.json();
    return { content: db.patch("articles", ctx.params.articleId, body) };
  }

  async delete(ctx: RequestContext): Promise<Repr> {
    db.remove("articles", ctx.params.articleId);
    return { content: null, meta: {} };
  }
}
```

#### `class Foo extends SingletonKind`

```typescript
import { SingletonKind, type Schema } from "@takanashi/rikka-site";
import type { Repr, RequestContext } from "@takanashi/rikka-site";

class Settings extends SingletonKind {
  schema: Schema = { type: "object" };

  async content(): Promise<Repr> {
    return { content: settings };
  }

  async replace(ctx: RequestContext): Promise<Repr> {
    const body = await ctx.json();
    Object.assign(settings, body);
    return { content: settings };
  }

  async patch(ctx: RequestContext): Promise<Repr> {
    const body = await ctx.json();
    Object.assign(settings, body);
    return { content: settings };
  }
}
```

#### `class Foo extends ReadOnlyKind`

```typescript
import { ReadOnlyKind, type Schema } from "@takanashi/rikka-site";
import type { Repr } from "@takanashi/rikka-site";

class Dashboard extends ReadOnlyKind {
  schema: Schema = { type: "object" };

  async content(): Promise<Repr> {
    return { content: { userCount: 42, articleCount: 7 } };
  }
}
```

#### `class Foo extends ActionKind`

```typescript
import { ActionKind, type Schema } from "@takanashi/rikka-site";
import type { Repr, RequestContext } from "@takanashi/rikka-site";

class Search extends ActionKind {
  schema: Schema = { type: "object" };

  async invoke(ctx: RequestContext): Promise<Repr> {
    const body = await ctx.json();
    return { content: searchIndex.query(body.query) };
  }
}
```

#### `FileSystemKind` — file serving

Serve static files from a local directory or a custom resolver. `FileSystemKind` is a concrete class — pass config to the constructor and mount the instance. Mounted at a site key, it catches all remaining path segments as a relative file path.

```typescript
import { FileSystemKind, Site } from "@takanashi/rikka-site";

const app = new Site({ "assets/": new FileSystemKind({ root: "./public" }) });
// /assets/style.css → ./public/style.css
```

#### Edge / non-Node static files

On Cloudflare Workers, Deno Deploy, or Vercel Edge there is no local filesystem. Pass a `resolver` function to the `FileSystemKind` constructor to provide files from a bundled manifest, KV store, or any other storage:

```typescript
import { FileSystemKind, Site } from "@takanashi/rikka-site";

const assets = new Map<string, { content: Uint8Array; type: string }>([
  [
    "style.css",
    { content: new TextEncoder().encode("body{}"), type: "text/css" },
  ],
  [
    "index.html",
    { content: new TextEncoder().encode("<h1>Hi</h1>"), type: "text/html" },
  ],
]);

const app = new Site({
  "assets/": new FileSystemKind({
    resolver: async (path) => assets.get(path) ?? null,
  }),
});
```

The resolver receives a normalized relative path, must return `null` for missing files, and should return a `Uint8Array` or `string` plus an optional MIME type. Path traversal (`..`) is rejected with 403 before the resolver is called.

### RequestContext

All handlers receive a `RequestContext` object:

```typescript
interface RequestContext {
  method: string; // HTTP method
  path: string; // URL path
  resourcePath?: string; // Resolved resource mount path (e.g. "/assets" for a FileSystemKind resource)
  params: Record<string, string>; // Path parameters
  query: Record<string, string>; // Query parameters
  headers: Record<string, string>; // Request headers (lowercase keys)
  body?: ReadableStream<Uint8Array>; // Raw request body as a byte stream
  json: <T = unknown>() => Promise<T>; // Lazily parse body as JSON (cached)
  text: () => Promise<string>; // Lazily read body as UTF-8 text (cached)
  identity?: Identity; // Auth identity (if authenticated)
  range?: RangeSpec; // Parsed Range header, if present
}
```

The body is **not** pre-parsed. Use `await ctx.json()` to parse JSON, `await ctx.text()` for text. The first call caches the result; subsequent calls return the cached value.

### Repr

Handlers MUST return a `Repr` object (`{ content, meta?, links? }`) explicitly. There is no auto-wrapping of plain values. Transport semantics are inferred from `content` and `meta`:

- `{ content: null, meta: { location: "./new" } }` → 302 redirect
- `{ content: null, meta: {} }` → 204 no content
- `POST` on a `CollectionKind` with `meta.location` → 201 created
- `DELETE` → 204
- `PartialContent` shape → 206 partial content
- Otherwise → 200

### Schema

Schemas describe the shape of data returned by handlers. Used by transformers and SDK generation.

```typescript
import { CollectionKind, type Schema } from "@takanashi/rikka-site";
import type { Repr } from "@takanashi/rikka-site";

class Users extends CollectionKind {
  schema: Schema = {
    type: "array",
    items: {
      type: "object",
      properties: {
        id: { type: "number" },
        name: { type: "string" },
        email: { type: "string" },
      },
    },
  };

  async list(): Promise<Repr> {
    return { content: [...users] };
  }

  async create(ctx): Promise<Repr> {
    /* ... */
  }
}
```

> **Note:** Always annotate `schema` with the `Schema` type explicitly (`schema: Schema = {...}`). Without the annotation, TypeScript infers `{ type: string }` from the literal, which widens the type and breaks schema matching.

Schema types: `any`, `null`, `boolean`, `number`, `string`, `array`, `object`, `raw`.

`SchemaRaw` (`{ type: "raw", mime: string }`) describes pre-serialized raw content identified by a MIME type — used by transformer `input`/`output` to declare that a transformer consumes or produces raw bytes.

### Site Definition

#### `new Site(tree, options?)`

Declares the resource tree. Object keys become URL path segments (or path patterns like `"articles/:id"`), values become resource instances or sub-trees.

```typescript
import { Site } from "@takanashi/rikka-site";

const app = new Site({
  users: new Users(),
  "users/:userId": new UserItem(),
  posts: new Posts(),
  settings: new Settings(),
  admin: {
    // Route group — pure nesting, no resource
    users: new AdminUsers(),
  },
  actions: {
    search: new Search(),
  },
});

// Resolves URLs
app.resolve("/users"); // Collection
app.resolve("/users/42"); // Item with params { userId: "42" }
app.resolve("/admin/users"); // Collection
app.resolve("/nonexistent"); // null
```

#### Trailing Slash

Use the `"/"` key in a nested group to define a different resource for trailing-slash URLs:

```typescript
import {
  ItemKind,
  CollectionKind,
  Site,
  type Schema,
} from "@takanashi/rikka-site";
import type { Repr, RequestContext } from "@takanashi/rikka-site";

class FileItem extends ItemKind {
  schema: Schema = { type: "object" };

  async content(ctx: RequestContext): Promise<Repr> {
    return { content: getFileMetadata(ctx.params.path) };
  }
}

class FileDirectory extends CollectionKind {
  schema: Schema = { type: "array", items: { type: "object" } };

  async list(ctx: RequestContext): Promise<Repr> {
    return { content: listDirectoryContents(ctx.params.path) };
  }

  async create(ctx: RequestContext): Promise<Repr> {
    const body = await ctx.json();
    return { content: createDirectoryEntry(ctx.params.path, body) };
  }
}

const app = new Site({
  "files/:path": new FileItem(),
  "files/:path/": new FileDirectory(),
});

// /files/docs     → FileItem (file metadata)
// /files/docs/    → FileDirectory (directory listing)
```

#### Auth

Configure authentication with the `auth` option. Auth resources are ordinary `ActionKind` resources:

```typescript
import { ActionKind, Site, HttpError } from "@takanashi/rikka-site";
import type { Repr, RequestContext } from "@takanashi/rikka-site";

class JwtVerifier extends ActionKind {
  async invoke(ctx: RequestContext): Promise<Repr> {
    const token = ctx.headers["authorization"]?.replace("Bearer ", "");
    if (!token) throw new HttpError(401, "missing token");
    const payload = verifyJwt(token);
    return {
      content: {
        subject: payload.sub,
        scopes: Array.isArray(payload.scopes)
          ? payload.scopes.join(" ")
          : (payload.scopes as string),
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
        { match: "/users/**" }, // requires auth (uses verifier)
        { match: "/public/**", auth: null }, // explicitly no auth
      ],
    },
  },
);
```

Glob patterns support `*` (single segment) and `**` (any depth).

### HTTP Adapters

#### `app.handleRequest(request)` — Framework-agnostic

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
  [key: string]: unknown;
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

`Site.listen()` is the Node.js adapter. It lives on the `Site` class itself
and dynamically imports `node:http` only when called, so bundlers for edge
runtimes (Cloudflare Workers, Deno Deploy) never pull `node:http` into the
bundle.

```typescript
import { Site } from "@takanashi/rikka-site";

const app = new Site({
  /* ... */
});

const server = await app.listen({ port: 3000 });
await server.ready;
console.log(`Listening on ${server.host}:${server.port}`);

// Graceful shutdown
await server.close();
```

`listen()` returns a `ListeningServer` with `port`, `host`, `close()`, and
`ready`. Pass `{ port: 0 }` to let the OS pick a free port and read it back
via `server.port`. Pass `{ path: "/run/rikka.sock" }` for a Unix socket, or
`{ tls: { key, cert } }` for HTTP/2 over TLS.

The `before` / `after` / `onRequest` / `onListen` hooks run per-request or
once on listen, and `checkContinue` is wired so that QUERY requests with an
unsupported `Content-Type` get a `415` plus `Accept-Query` header **before**
the body is read.

### Transformers

Transformers are registered on a `TransformerRegistry`. A site creates one
automatically at `app.registry` and registers the built-in transformers.

**Built-in transformers** (registered automatically):

| Transformer         | Output MIME           | Notes                                            |
| ------------------- | --------------------- | ------------------------------------------------ |
| `jsonTransformer`   | `application/json`    | Pretty-printed JSON                              |
| `jsonldTransformer` | `application/ld+json` | JSON-LD with `@context`/`@id`/`@type`            |
| `csvTransformer`    | `text/csv`            | RFC 4180; array-of-objects → CSV                 |
| `textTransformer`   | `text/plain`          | Human-readable `key: value` view                 |
| `cborTransformer`   | `application/cbor`    | Binary (RFC 8949); outputs `Uint8Array`          |
| `htmlTransformer`   | `text/html`           | Configurable via `createHtmlTransformer(config)` |

**Binary formats** (CBOR, protobuf) produce `Uint8Array` content that flows
through the pipeline as raw bytes — never decoded via `TextDecoder`, so
arbitrary byte sequences survive. `TransformResult.body` is
`string | Uint8Array`; the HTTP adapters accept both.

**Schema-based factory — `protobuf(schema)`:**

Protobuf is schema-based, so `protobuf` is a factory, not a constant.
`protobuf(schema)` returns a `Transformer` bound to one message type. It is
**not** registered by default. The `schema` is duck-typed
(`{ encode(message): Uint8Array }`) — rikka-site has no protobufjs dependency;
you bring your own encoder.

```typescript
import protobufjs from "protobufjs";
import { protobuf, Site } from "@takanashi/rikka-site";

const Root = await protobufjs.load("user.proto");
const User = Root.lookupType("app.User");

const app = new Site(
  { users: new Users() },
  {
    transformers: [protobuf({ encode: (msg) => User.encode(msg).finish() })],
  },
);
// GET /users?accept=protobuf → application/x-protobuf bytes
```

**Custom transformer** (Value → Raw):

```typescript
import type { Transformer, Repr } from "@takanashi/rikka-site";

const yamlTransformer: Transformer = {
  input: { type: "object" },
  output: { type: "raw", mime: "application/yaml" },
  transform(repr: Repr): Repr {
    return {
      content: toYaml(repr.content),
      meta: { type: "application/yaml" },
    };
  },
};

app.registry.register(yamlTransformer);
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

| Platform                 | Adapter                         | Entry format                                           | Notes                                       |
| ------------------------ | ------------------------------- | ------------------------------------------------------ | ------------------------------------------- |
| Cloudflare Workers       | `createCloudflareWorkerHandler` | `export default { fetch(req, env, ctx) }`              | wrangler.toml required                      |
| Cloudflare Pages         | `createCloudflarePagesHandler`  | `_worker.js` in output dir (Advanced Mode)             | Falls back to `env.ASSETS` for static files |
| Vercel Edge              | `handleWebRequest`              | `export function GET(req)`                             | Add `export const runtime = "edge"`         |
| Deno Deploy              | `createDenoDeployHandler`       | `Deno.serve(handler)`                                  | No build step                               |
| Node.js                  | `Site.listen()`                 | `await app.listen({ port })`                           | Dynamic `import("node:http")`; H2 over TLS via `tls` option |
| Any Web Standard runtime | `handleWebRequest`              | `Request → Response`                                   | Universal adapter                           |

## JSON-LD

When `Accept: application/ld+json` is requested, resources are serialized as JSON-LD:

- **Collections**: `{ "@context", "@id", "@type", "@graph": [...] }`
- **Items/Singletons**: `{ "@context", "@id", "@type", ...data }`
- **HTML pages**: Include a `<script type="application/ld+json">` block

Customize the context and type via `context` and `jsonldType` fields on the resource class:

```typescript
import { CollectionKind, type Schema } from "@takanashi/rikka-site";
import type { Repr } from "@takanashi/rikka-site";

class Users extends CollectionKind {
  context = "https://schema.org";
  jsonldType = "PersonCollection";

  async list(): Promise<Repr> {
    return { content: [] };
  }

  async create(ctx): Promise<Repr> {
    const body = await ctx.json();
    return { content: body };
  }
}
```

## Examples

See `examples/blog-site/` for a complete example with:

- All 6 resource kinds
- Nested resources (articles → comments)
- Content negotiation (HTML, JSON, JSON-LD, CSV, plain text)
- Schema declarations
- Node.js HTTP server via `Site.listen()`
- Cloudflare Workers adapter
- **Client-side hydration** with Custom Elements (see [skills/rikka-site](../../skills/rikka-site/))

### Pagination

Use the `paginate()` helper with `ctx.range` (parsed from the `Range` header)
to return partial content (206). For `CollectionResource`, the parsed range
is also available as `query.range` when `list(ctx, query?)` is invoked via
GET or QUERY:

```typescript
import { CollectionKind, paginate, type Schema } from "@takanashi/rikka-site";
import type { Repr, RequestContext, Query } from "@takanashi/rikka-site";

class Articles extends CollectionKind {
  schema: Schema = { type: "array", items: { type: "object" } };

  async list(ctx: RequestContext, query?: Query): Promise<Repr> {
    // query.range is set by get()/query() when a Range header is present
    return paginate(articles, query?.range ?? ctx.range); // Range: items=0-9 → 206
  }

  async create(ctx: RequestContext): Promise<Repr> {
    /* ... */
  }
}
```

### CORS

CORS is configured declaratively. `handleRequest` handles OPTIONS preflight and adds headers automatically:

```typescript
import { Site } from "@takanashi/rikka-site";

const app = new Site(
  { users: new Users() },
  {
    cors: {
      origin: ["https://app.example.com", "https://admin.example.com"],
      credentials: true,
      headers: "Content-Type, Authorization, Accept",
    },
  },
);
```


## Client-Side Hydration

When using rikka-site for full-stack apps (not just APIs), the HTML transformer injects resource data into the DOM so client-side components can hydrate from it. A client-side SDK is auto-injected at `/.well-known/sdk/sdk.js` (exposed as `window.__rikka`).

### SSR Output Structure

For each request, the HTML transformer produces:

```html
<blog-layout data-path="/articles" data-kind="Collection">
  <blog-article-list
    path="/articles"
    kind="Collection"
    data-resource='[{"id":1,"title":"..."}]'
  >
  </blog-article-list>
</blog-layout>
```

### Data Injection Points

| Location                                                 | Format                            | When                                               |
| -------------------------------------------------------- | --------------------------------- | -------------------------------------------------- |
| `data-resource` attribute on the resource's element     | Raw JSON (array or object)        | `serialization: "data-attr"` or `"both"` (default) |
| `<script type="application/ld+json">` in `<head>`        | JSON-LD with `@context`, `@graph` | `serialization: "jsonld"` or `"both"`              |
| DSDOM `<template shadowrootmode>`                        | JSON in template content          | `hydration: "dsdom"`                               |
| `<script type="application/ld+json">` inside the element | JSON-LD with `@context`, `@graph` | `hydration: "jsonld"` (legacy)                     |

> **Note:** `serialization` controls how resource data is embedded in the rendered HTML (head JSON-LD vs. `data-resource` attribute). It is independent of the legacy `hydration` option, which remains supported for backward compatibility.

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

| Attribute   | Example        | Usage                                          |
| ----------- | -------------- | ---------------------------------------------- |
| `data-path` | `"/articles"`  | Current URL path — use for nav active state    |

Read them with `this.getAttribute("data-path")` (not reactive attributes).

### Client-Side SDK

rikka-site auto-injects a SDK at `/.well-known/sdk/sdk.js` (exposed as `window.__rikka`). It provides:

```typescript
// Hydration — extract SSR data from DOM
const data = window.__rikka.findResourceData<Article[]>(element);
const dataAsync =
  await window.__rikka.findResourceDataAsync<Article[]>(element);

// Typed API requests (same origin, JSON)
const articles = await window.__rikka.apiGet<Article[]>("/articles");
const created = await window.__rikka.apiPost<Article>("/articles", {
  title: "New",
});
await window.__rikka.apiDelete("/articles/1");

// Client-side router (intercepts <a> clicks, View Transitions)
const router = window.__rikka.createRouter(
  window.__rikka.readSitemapFromDom()!,
);
router.start();
const match = router.match("/articles/42"); // { route, params: { articleId: "42" } }
```

The SDK throws `ApiError` on non-2xx responses with `.status` and `.details` properties.
