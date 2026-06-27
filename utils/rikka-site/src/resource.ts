/**
 * @module resource
 * Resource — the core dual hierarchy.
 *
 *   abstract class ResourceKind                              (config + factory)
 *     abstract class CollectionKind extends ResourceKind     (→ CollectionResource)
 *     abstract class ItemKind extends ResourceKind           (→ ItemResource)
 *     abstract class SingletonKind extends ResourceKind     (→ SingletonResource)
 *     abstract class ReadOnlyKind extends ResourceKind      (→ ReadOnlyResource)
 *     abstract class ActionKind extends ResourceKind        (→ ActionResource)
 *
 *   abstract class Resource                                  (per-request: methods + state)
 *     abstract class CollectionResource extends Resource    (list, create → get, post)
 *     abstract class ItemResource extends Resource          (content, replace? → get, put; patch?, delete?)
 *     abstract class SingletonResource extends Resource     (content, replace? → get, put; patch?)
 *     abstract class ReadOnlyResource extends Resource      (content → get)
 *     abstract class ActionResource extends Resource        (invoke → post)
 *
 * Kind is in the site tree — it holds config and creates per-request Resources.
 * Resource carries params, path, and handler methods.
 *
 * Double instantiation:
 *   1. `new XxxKind(config)` — create template with config
 *   2. `kind.resolve(params)` — create per-request Resource
 *
 * `resolve(params)`:
 *   - Only receives `params` (path parameters extracted from the URL).
 *   - The framework sets `resource.path` and `resource.params` afterwards.
 *
 * Children map keys:
 *   - `"segment"` — exact match (e.g. `"users"`)
 *   - `":name"` — single-segment param (e.g. `":userId"` → `params.userId`)
 *   - `":name*"` — catch-all param, consumes all remaining segments
 *                  (e.g. `":path*"` → `params.path = "a/b/c"` or `"a/b/c/"`)
 *   - `"/"` — matches a trailing slash on this resource (remaining is `[""]`)
 *
 * Trailing slash is encoded in `remaining` as a trailing `""`:
 *   `/docs`  → `["docs"]`     — no trailing slash
 *   `/docs/` → `["docs", ""]` — trailing slash
 * The `"/"` child matches when `remaining = [""]` (trailing slash only).
 * Catch-all `remaining.join("/")` naturally includes the trailing slash.
 *
 * Matching order: exact → `:param` → catch-all.
 * Backtracking: if a match recurses but fails, the next option is tried.
 */

import type { Schema } from "./schema.js";
import { anySchema } from "./schema.js";
import type { RequestContext } from "./context.js";
import type { Repr } from "./representation.js";
import { isPartial } from "./representation.js";
import { HttpError, isHttpError } from "./errors.js";

// ---------------------------------------------------------------------------
// Children — the sub-resource tree
// ---------------------------------------------------------------------------

/**
 * A function that takes a path segment (or joined catch-all path) and returns
 * a ResourceKind instance. Called during path resolution.
 */
export type ChildResolver = (param: string) => ResourceKind;

/**
 * The children map: keys are path segments, values are either
 * a ResourceKind instance, a ChildResolver (dynamic), or a nested
 * ChildrenMap for route grouping.
 *
 * Key forms:
 *   - `"segment"` — exact match
 *   - `":name"` — single-segment param → `params.name`
 *   - `":name*"` — catch-all, consumes all remaining segments → `params.name`
 *   - `"/"` — matches trailing slash on this resource (remaining is `[""]`)
 *
 * Trailing slash is encoded in `remaining` as a trailing `""`:
 *   `/docs/` → `["docs", ""]`,  `/docs` → `["docs"]`
 */
export interface ChildrenMap {
  [key: string]: ResourceKind | ChildResolver | ChildrenMap;
}

// ---------------------------------------------------------------------------
// Custom element constructor (used by custom-elements.ts)
// ---------------------------------------------------------------------------

/**
 * A custom element class constructor, as returned by `defineElement()`.
 * It must expose a static `tagName` string.
 */
export interface CustomElementConstructor {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): any;
  readonly tagName: string;
}

// ---------------------------------------------------------------------------
// ResourceKind — abstract base class (config + factory)
// ---------------------------------------------------------------------------

/**
 * Base class for all resource kinds (templates in the site tree).
 *
 * A Kind holds configuration and acts as a factory for per-request
 * {@link Resource} instances via {@link resolve}.
 *
 * Kind does NOT define instance behavior — all handler methods live on
 * {@link Resource}.
 *
 * @example
 * ```ts
 * class ArticlesKind extends CollectionKind {
 *   children = { ":id": new ArticleKind() };
 *
 *   resolve(params) {
 *     return new ArticlesResource(params);
 *   }
 * }
 * ```
 */
export abstract class ResourceKind {
  /** Schema describing the data shape (for content negotiation). */
  schema?: Schema;
  /**
   * Sub-resources. When absent (`undefined`), this Kind is a leaf — no
   * children to match. Set in the constructor for per-instance children
   * (e.g. `DatabaseKind` builds children from the input schema).
   * See {@link ChildrenMap} for key forms.
   */
  children?: ChildrenMap;
  /** Custom element name for HTML representation. */
  element?: unknown;
  /** JSON-LD @context URI. */
  context?: string;
  /** JSON-LD @type. */
  jsonldType?: string;

  /**
   * Create a per-request {@link Resource} from the extracted path params.
   *
   * The framework sets `resource.path` and `resource.params` after this returns.
   *
   * @param params - Path parameters extracted from the URL
   *   (e.g. `{ userId: "42", path: "a/b/c" }`).
   */
  abstract resolve(params: Record<string, string>): Resource;
}

// ---------------------------------------------------------------------------
// Resource — abstract base class (per-request instance with methods)
// ---------------------------------------------------------------------------

/**
 * All HTTP methods registered in the IANA HTTP Method Registry.
 * @see https://www.iana.org/assignments/http-methods/http-methods.xhtml
 */
const HTTP_METHODS = [
  // RFC 9110 — HTTP Semantics
  "get",
  "head",
  "post",
  "put",
  "delete",
  "connect",
  "options",
  "trace",
  "patch",
  // RFC 4918 — WebDAV
  "propfind",
  "proppatch",
  "mkcol",
  "copy",
  "move",
  "lock",
  "unlock",
  // RFC 3253 — DeltaV (versioning)
  "version-control",
  "report",
  "checkout",
  "checkin",
  "uncheckout",
  "mkworkspace",
  "update",
  "label",
  "merge",
  "baseline-control",
  "mkactivity",
  // RFC 4791 — CalDAV
  "mkcalendar",
  // RFC 5842 — Binding Extensions to WebDAV
  "bind",
  "rebind",
  "unbind",
  // RFC 3744 — WebDAV Access Control Protocol
  "acl",
  // RFC 3648 — Ordered Collections Protocol
  "orderpatch",
  // RFC 4437 — Redirect Reference Resources
  "updateredirectref",
  "mkredirectref",
  // RFC 5323 — SEARCH
  "search",
  // RFC 9113 — HTTP/2
  "pri",
  // RFC 2068 — Link / Unlink (obsolete but registered)
  "link",
  "unlink",
  // RFC 10008 — QUERY
  "query",
] as const;

/**
 * Base class for per-request resource instances.
 *
 * Carries `params` and `path` for this resolution, plus handler methods.
 * The framework dispatches HTTP methods (`get`, `post`, etc.) on the
 * Resource instance.
 *
 * All IANA-registered HTTP methods are present as named methods — each
 * defaults to 405 Method Not Allowed. Subclasses override the ones they
 * support. {@link allowedMethods} auto-detects overrides by comparing
 * against `Resource.prototype`, so there is no need to override it.
 *
 * Users extend abstract subclasses ({@link CollectionResource},
 * {@link ItemResource}, etc.) to implement their resource logic.
 */
export abstract class Resource {
  /** Per-request path parameters (e.g. `{ articleId: "42" }`). */
  params: Record<string, string> = {};
  /** The resolved URL path for this resource (e.g. `/articles/42`). */
  path: string = "";
  /** Schema describing the data shape (for content negotiation). */
  schema?: Schema;
  /** Custom element name for HTML representation. */
  element?: unknown;
  /** JSON-LD @context URI. */
  context?: string;
  /** JSON-LD @type. */
  jsonldType?: string;

  /** Default 405 response — shared by all method stubs. */
  protected notAllowed(): never {
    throw new HttpError(405, "Method Not Allowed", undefined, {
      Allow: this.allowedMethods().join(", "),
    });
  }

  // --- RFC 9110: HTTP Semantics ---
  get(ctx: RequestContext): Repr | Promise<Repr> {
    this.notAllowed();
  }
  head(ctx: RequestContext): Repr | Promise<Repr> {
    this.notAllowed();
  }
  post(ctx: RequestContext): Repr | Promise<Repr> {
    this.notAllowed();
  }
  put(ctx: RequestContext): Repr | Promise<Repr> {
    this.notAllowed();
  }
  delete(ctx: RequestContext): Repr | Promise<Repr> {
    this.notAllowed();
  }
  connect(ctx: RequestContext): Repr | Promise<Repr> {
    this.notAllowed();
  }
  options(ctx: RequestContext): Repr | Promise<Repr> {
    this.notAllowed();
  }
  trace(ctx: RequestContext): Repr | Promise<Repr> {
    this.notAllowed();
  }
  patch(ctx: RequestContext): Repr | Promise<Repr> {
    this.notAllowed();
  }

  // --- RFC 4918: WebDAV ---
  propfind(ctx: RequestContext): Repr | Promise<Repr> {
    this.notAllowed();
  }
  proppatch(ctx: RequestContext): Repr | Promise<Repr> {
    this.notAllowed();
  }
  mkcol(ctx: RequestContext): Repr | Promise<Repr> {
    this.notAllowed();
  }
  copy(ctx: RequestContext): Repr | Promise<Repr> {
    this.notAllowed();
  }
  move(ctx: RequestContext): Repr | Promise<Repr> {
    this.notAllowed();
  }
  lock(ctx: RequestContext): Repr | Promise<Repr> {
    this.notAllowed();
  }
  unlock(ctx: RequestContext): Repr | Promise<Repr> {
    this.notAllowed();
  }

  // --- RFC 3253: DeltaV (versioning) ---
  "version-control"(ctx: RequestContext): Repr | Promise<Repr> {
    this.notAllowed();
  }
  report(ctx: RequestContext): Repr | Promise<Repr> {
    this.notAllowed();
  }
  checkout(ctx: RequestContext): Repr | Promise<Repr> {
    this.notAllowed();
  }
  checkin(ctx: RequestContext): Repr | Promise<Repr> {
    this.notAllowed();
  }
  uncheckout(ctx: RequestContext): Repr | Promise<Repr> {
    this.notAllowed();
  }
  mkworkspace(ctx: RequestContext): Repr | Promise<Repr> {
    this.notAllowed();
  }
  update(ctx: RequestContext): Repr | Promise<Repr> {
    this.notAllowed();
  }
  label(ctx: RequestContext): Repr | Promise<Repr> {
    this.notAllowed();
  }
  merge(ctx: RequestContext): Repr | Promise<Repr> {
    this.notAllowed();
  }
  "baseline-control"(ctx: RequestContext): Repr | Promise<Repr> {
    this.notAllowed();
  }
  mkactivity(ctx: RequestContext): Repr | Promise<Repr> {
    this.notAllowed();
  }

  // --- RFC 4791: CalDAV ---
  mkcalendar(ctx: RequestContext): Repr | Promise<Repr> {
    this.notAllowed();
  }

  // --- RFC 5842: Binding Extensions to WebDAV ---
  bind(ctx: RequestContext): Repr | Promise<Repr> {
    this.notAllowed();
  }
  rebind(ctx: RequestContext): Repr | Promise<Repr> {
    this.notAllowed();
  }
  unbind(ctx: RequestContext): Repr | Promise<Repr> {
    this.notAllowed();
  }

  // --- RFC 3744: WebDAV Access Control Protocol ---
  acl(ctx: RequestContext): Repr | Promise<Repr> {
    this.notAllowed();
  }

  // --- RFC 3648: Ordered Collections Protocol ---
  orderpatch(ctx: RequestContext): Repr | Promise<Repr> {
    this.notAllowed();
  }

  // --- RFC 4437: Redirect Reference Resources ---
  updateredirectref(ctx: RequestContext): Repr | Promise<Repr> {
    this.notAllowed();
  }
  mkredirectref(ctx: RequestContext): Repr | Promise<Repr> {
    this.notAllowed();
  }

  // --- RFC 5323: SEARCH ---
  search(ctx: RequestContext): Repr | Promise<Repr> {
    this.notAllowed();
  }

  // --- RFC 9113: HTTP/2 ---
  pri(ctx: RequestContext): Repr | Promise<Repr> {
    this.notAllowed();
  }

  // --- RFC 2068: Link / Unlink (obsolete but registered) ---
  link(ctx: RequestContext): Repr | Promise<Repr> {
    this.notAllowed();
  }
  unlink(ctx: RequestContext): Repr | Promise<Repr> {
    this.notAllowed();
  }

  // --- RFC 10008: QUERY ---
  query(ctx: RequestContext): Repr | Promise<Repr> {
    this.notAllowed();
  }

  /**
   * Auto-derive allowed methods by checking which HTTP methods are overridden.
   * Compares against `Resource.prototype` — overridden methods differ.
   * No need to override this in subclasses.
   */
  allowedMethods(): string[] {
    return HTTP_METHODS.filter(
      (m) =>
        (this as unknown as Record<string, unknown>)[m] !==
        (Resource.prototype as unknown as Record<string, unknown>)[m],
    ).map((m) => m.toUpperCase());
  }

  /**
   * Infer HTTP status code from the Repr and method.
   *
   * When `repr.meta.kind` is set, it takes precedence and maps directly:
   * `redirect`→302, `created`→201, `no-content`→204, `value`→200/206.
   * Otherwise the status is inferred from `content`'s shape and the method
   * (backward compatible).
   */
  inferStatus(repr: Repr, method: string, hasRange: boolean): number {
    switch (repr.meta.kind) {
      case "redirect":
        return 302;
      case "created":
        return 201;
      case "no-content":
        return 204;
      case "value":
        if (isPartial(repr.content)) return hasRange ? 206 : 200;
        return 200;
    }
    // Fallback: infer from content shape + method
    if (repr.content === null) {
      if (repr.meta.location) return 302;
      return 204;
    }
    if (isPartial(repr.content)) {
      return hasRange ? 206 : 200;
    }
    if (method === "DELETE") return 204;
    return 200;
  }

  /**
   * Optional — only ActionResource implements this.
   * Direct access to the invoke handler for auth verification.
   * Used for duck-typing in verifyAuth.
   */
  invoke?(ctx: RequestContext): Repr | Promise<Repr>;
}

// ---------------------------------------------------------------------------
// Abstract Kind / Resource pairs
// ---------------------------------------------------------------------------

/**
 * CollectionKind — factory for {@link CollectionResource}.
 * Leaf by default (no `children`). Set `children` to define sub-resources.
 */
export abstract class CollectionKind extends ResourceKind {
  abstract resolve(params: Record<string, string>): CollectionResource;
}

/**
 * CollectionResource — supports list (GET) and create (POST).
 *
 * @example
 * ```ts
 * class UsersResource extends CollectionResource {
 *   async list(ctx) {
 *     return { content: [{ id: 1 }], meta: {} };
 *   }
 *   async create(ctx) {
 *     const body = await ctx.json();
 *     return { content: body, meta: { location: "/users/1" } };
 *   }
 * }
 * ```
 */
export abstract class CollectionResource extends Resource {
  abstract list(ctx: RequestContext): Repr | Promise<Repr>;
  abstract create(ctx: RequestContext): Repr | Promise<Repr>;

  get(ctx: RequestContext) {
    return this.list(ctx);
  }
  post(ctx: RequestContext) {
    return this.create(ctx);
  }

  override inferStatus(repr: Repr, method: string, hasRange: boolean): number {
    // When kind is explicit, the base class handles it directly.
    if (repr.meta.kind) return super.inferStatus(repr, method, hasRange);
    // Backward compat: infer 201 from POST + location + non-null content.
    if (method === "POST" && repr.meta.location && repr.content !== null)
      return 201;
    return super.inferStatus(repr, method, hasRange);
  }
}

/**
 * ItemKind — factory for {@link ItemResource}.
 * Leaf by default (no `children`).
 */
export abstract class ItemKind extends ResourceKind {
  abstract resolve(params: Record<string, string>): ItemResource;
}

/**
 * ItemResource — supports content (GET), replace (PUT), patch (PATCH), delete (DELETE).
 *
 * Only `content` is required. `replace` is optional (checked by `put`).
 * `patch` and `delete` are optional — override them directly on your subclass.
 */
export abstract class ItemResource extends Resource {
  abstract content(ctx: RequestContext): Repr | Promise<Repr>;
  /** Optional PUT handler. If defined, `put()` forwards to this. */
  replace?(ctx: RequestContext): Repr | Promise<Repr>;

  get(ctx: RequestContext) {
    return this.content(ctx);
  }
  put(ctx: RequestContext) {
    if (!this.replace) {
      throw new HttpError(405, "Method Not Allowed", undefined, {
        Allow: this.allowedMethods().join(", "),
      });
    }
    return this.replace(ctx);
  }
  // patch() and delete() — user overrides Resource.patch/delete directly.

  override allowedMethods(): string[] {
    const methods = ["GET"];
    if (this.replace) methods.push("PUT");
    if (this.patch !== Resource.prototype.patch) methods.push("PATCH");
    if (this.delete !== Resource.prototype.delete) methods.push("DELETE");
    return methods;
  }
}

/**
 * SingletonKind — factory for {@link SingletonResource}.
 * Leaf by default (no `children`).
 */
export abstract class SingletonKind extends ResourceKind {
  abstract resolve(params: Record<string, string>): SingletonResource;
}

/**
 * SingletonResource — supports content (GET), replace (PUT), patch (PATCH).
 *
 * Only `content` is required. `replace` is optional (checked by `put`).
 * `patch` is optional — override it directly on your subclass.
 */
export abstract class SingletonResource extends Resource {
  abstract content(ctx: RequestContext): Repr | Promise<Repr>;
  /** Optional PUT handler. If defined, `put()` forwards to this. */
  replace?(ctx: RequestContext): Repr | Promise<Repr>;

  get(ctx: RequestContext) {
    return this.content(ctx);
  }
  put(ctx: RequestContext) {
    if (!this.replace) {
      throw new HttpError(405, "Method Not Allowed", undefined, {
        Allow: this.allowedMethods().join(", "),
      });
    }
    return this.replace(ctx);
  }
  // patch() — user overrides Resource.patch directly.

  override allowedMethods(): string[] {
    const methods = ["GET"];
    if (this.replace) methods.push("PUT");
    if (this.patch !== Resource.prototype.patch) methods.push("PATCH");
    return methods;
  }
}

/**
 * ReadOnlyKind — factory for {@link ReadOnlyResource}.
 * Leaf by default (no `children`).
 */
export abstract class ReadOnlyKind extends ResourceKind {
  abstract resolve(params: Record<string, string>): ReadOnlyResource;
}

/**
 * ReadOnlyResource — supports content (GET) only.
 */
export abstract class ReadOnlyResource extends Resource {
  abstract content(ctx: RequestContext): Repr | Promise<Repr>;

  get(ctx: RequestContext) {
    return this.content(ctx);
  }
}

/**
 * ActionKind — factory for {@link ActionResource}.
 * Leaf by default (no `children`).
 */
export abstract class ActionKind extends ResourceKind {
  abstract resolve(params: Record<string, string>): ActionResource;
}

/**
 * ActionResource — supports invoke (POST) only.
 * Used for stateless operations like authentication, webhooks, etc.
 *
 * `invoke()` is also exposed for duck-typing by the auth verifier.
 */
export abstract class ActionResource extends Resource {
  abstract invoke(ctx: RequestContext): Repr | Promise<Repr>;

  post(ctx: RequestContext) {
    return this.invoke(ctx);
  }
}

// ---------------------------------------------------------------------------
// StaticResolver — for edge-compatible static file serving
// ---------------------------------------------------------------------------

/**
 * Edge-compatible static file resolver.
 *
 * Receives a relative path within the static mount (no leading slash,
 * normalized). Returns the file content and optional MIME type, or null/
 * undefined if the file does not exist.
 */
export type StaticResolver = (path: string) => Promise<
  | {
      content: string | Uint8Array;
      type?: string;
    }
  | null
  | undefined
>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Check if a value is a ResourceKind instance.
 */
export function isResourceKind(value: unknown): value is ResourceKind {
  return value instanceof ResourceKind;
}

/**
 * Check if a value is a Resource instance.
 */
export function isResource(value: unknown): value is Resource {
  return value instanceof Resource;
}

/**
 * Resolve a ChildrenMap entry to a ResourceKind instance.
 * If the entry is a direct instance, return it; if it's a ChildResolver, call it.
 */
function resolveKindEntry(
  entry: ResourceKind | ChildResolver,
  segment: string,
): ResourceKind {
  if (isResourceKind(entry)) {
    return entry;
  }
  return (entry as ChildResolver)(segment);
}

/**
 * Check if a ChildrenMap entry is a Kind or resolver (not a nested map).
 */
function isKindOrResolver(
  entry: ResourceKind | ChildResolver | ChildrenMap,
): entry is ResourceKind | ChildResolver {
  return isResourceKind(entry) || typeof entry === "function";
}

// ---------------------------------------------------------------------------
// Key classification helpers
// ---------------------------------------------------------------------------

/** Check if a children key is a single-segment param (`":name"`). */
function isParamKey(key: string): boolean {
  return key.startsWith(":") && !key.endsWith("*");
}

/** Check if a children key is a catch-all param (`":name*"`). */
function isCatchAllKey(key: string): boolean {
  return key.startsWith(":") && key.endsWith("*");
}

/** Extract the param name from a `":name"` key. */
function paramKeyName(key: string): string {
  return key.slice(1);
}

/** Extract the param name from a `":name*"` key. */
function catchAllKeyName(key: string): string {
  return key.slice(1, -1); // remove ":" and "*"
}

// ---------------------------------------------------------------------------
// Resolution — walk the Kind tree, return per-request Resource
// ---------------------------------------------------------------------------

/**
 * Finalize a resource: set `params`. The caller is responsible for setting
 * `resource.path` (it always equals the original request path).
 */
function finalize(
  resource: Resource | null,
  params: Record<string, string>,
): Resource | null {
  if (!resource) return null;
  resource.params = params;
  return resource;
}

/**
 * The single recursive matcher. Walks a tree of Kinds / children maps along
 * `remaining` path segments and returns the resolved per-request Resource.
 *
 * `node` is either a ResourceKind (this level has a handler — `node.resolve()`
 * is called when `remaining` is exhausted) or a bare ChildrenMap (route group
 * with no handler — only descent succeeds). `current` and `children` are both
 * derived from `node`, so they are not separate parameters.
 *
 * `params` accumulates path parameters during matching — each `:param` match
 * adds to it, and `kind.resolve(params)` receives the full set at the end.
 * It cannot be derived from `remaining` (which is consumed during matching).
 *
 * Trailing slash is encoded in `remaining` as a trailing `""`:
 *   `/docs`  → `["docs"]`    — no trailing slash
 *   `/docs/` → `["docs", ""]` — trailing slash
 *   `[""]`                     — trailing slash only (no more segments)
 *
 * Matching order: exact → `:param` → catch-all. Backtracks on failure.
 * `resource.path` is NOT set here — the caller sets it from the request path.
 */
function resolve(
  node: ResourceKind | ChildrenMap,
  remaining: string[],
  params: Record<string, string>,
): Resource | null {
  const current = isResourceKind(node) ? node : null;
  const children = isResourceKind(node) ? node.children : node;

  // No remaining segments — resolve current.
  if (remaining.length === 0) {
    if (!current) return null;
    return finalize(current.resolve(params), params);
  }

  // Trailing slash only — remaining is `[""]`.
  if (remaining.length === 1 && remaining[0] === "") {
    // The "/" child pattern matches the trailing slash on this path.
    if (children && "/" in children) {
      const slashChild = children["/"];
      if (isKindOrResolver(slashChild)) {
        const kind = resolveKindEntry(slashChild, "");
        return finalize(kind.resolve(params), params);
      }
    }
    // No "/" child — finalize current (trailing slash preserved by caller).
    if (!current) return null;
    return finalize(current.resolve(params), params);
  }

  // Need to descend — but no children to match against.
  if (!children) return null;

  const [next, ...rest] = remaining;

  // 1. Exact match
  if (next in children && next !== "/" && !next.startsWith(":")) {
    const child = children[next];
    if (isKindOrResolver(child)) {
      const kind = resolveKindEntry(child, next);
      const r = resolve(kind, rest, params);
      if (r) return r;
    } else {
      // Nested route group — no current kind.
      const r = resolve(child, rest, params);
      if (r) return r;
    }
  }

  // 2. Single-segment :param match
  for (const [key, child] of Object.entries(children)) {
    if (!isParamKey(key)) continue;
    if (!isKindOrResolver(child)) continue;
    const paramName = paramKeyName(key);
    const kind = resolveKindEntry(child, next);
    const newParams = { ...params, [paramName]: next };
    const r = resolve(kind, rest, newParams);
    if (r) return r;
  }

  // 3. Catch-all (`:name*`) — consumes all remaining segments.
  // remaining.join("/") naturally includes the trailing slash:
  //   ["docs", ""].join("/") → "docs/"
  //   ["docs"].join("/")     → "docs"
  for (const [key, child] of Object.entries(children)) {
    if (!isCatchAllKey(key)) continue;
    if (!isKindOrResolver(child)) continue;
    const paramName = catchAllKeyName(key);
    const joined = remaining.join("/");
    const kind = resolveKindEntry(child, joined);
    const newParams = { ...params, [paramName]: joined };
    return finalize(kind.resolve(newParams), newParams);
  }

  return null;
}

/**
 * Resolve remaining segments against a Kind tree or a bare children map.
 *
 * Accepts either a {@link ResourceKind} (resolved with its own `children`)
 * or a {@link ChildrenMap} (resolved with no current Kind — used by
 * `Site.resolve` against the site definition).
 *
 * Trailing slash is encoded in `remaining` as a trailing `""`:
 *   `/docs/` → `["docs", ""]`,  `/docs` → `["docs"]`
 *
 * @param root - A ResourceKind (resolved with its `children`) or a bare
 *   ChildrenMap (resolved with no current Kind).
 * @param remaining - Remaining path segments (may contain trailing `""`).
 * @param path - If provided, sets `resource.path`. Always equals the request
 *   path. Routing does NOT use this — it's purely for the caller's convenience.
 * @returns A per-request Resource carrying `params` and `path`, or null.
 */
export function resolveResource(
  root: ResourceKind | ChildrenMap,
  remaining: string[],
  path?: string,
): Resource | null {
  const r = resolve(root, remaining, {});
  if (r && path !== undefined) r.path = path;
  return r;
}

// ---------------------------------------------------------------------------
// Schema helper
// ---------------------------------------------------------------------------

/**
 * Get the schema from a resource, defaulting to anySchema.
 */
export function getDescriptorSchema(resource: Resource): Schema {
  return resource.schema ?? anySchema;
}
