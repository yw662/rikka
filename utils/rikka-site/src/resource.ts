/**
 * @module resource
 * Resource — the core abstract class hierarchy.
 *
 *   abstract class ResourceKind
 *     abstract class CollectionKind extends ResourceKind   (list, create)
 *     abstract class ItemKind extends ResourceKind          (content, replace?, patch?, delete?)
 *     abstract class SingletonKind extends ResourceKind     (content, replace?, patch?)
 *     abstract class ReadOnlyKind extends ResourceKind      (content)
 *     abstract class ActionKind extends ResourceKind        (invoke)
 *     abstract class ProxyKind extends ResourceKind         (target)
 *     class StaticKind extends ReadOnlyKind                  (file serving)
 *
 *   class Resource                                            (per-request wrapper)
 *     class CollectionResource extends Resource              (get→list, post→create)
 *     class ItemResource extends Resource                    (get→content, put→replace, ...)
 *     class SingletonResource extends Resource               (get→content, put→replace, ...)
 *     class ReadOnlyResource extends Resource                (get→content)
 *     class ActionResource extends Resource                  (post→invoke)
 *     class ProxyResource extends Resource                   (proxy intercept)
 *
 * Users extend the abstract class for their Kind, then create an instance:
 *   class Users extends CollectionKind { ... }
 *   const app = site({ users: new Users() });
 *   const app = site({ "assets/": new StaticKind({ root: "./public" }) });
 *
 * The site tree stores **instances** (ResourceKind). Instances are shared
 * across requests — they are kinds (type descriptors), not per-request
 * state. Per-request state (params, path) is carried by RequestContext
 * and by the {@link Resource} returned from resolution.
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
 * A function that takes a path segment and returns a ResourceKind instance.
 * Called during path resolution with the matched path segment.
 */
export type ChildResolver = (param: string) => ResourceKind;

/**
 * The children map: keys are path segments (e.g. ":userId"), values are either
 * a ResourceKind instance, a ChildResolver (dynamic), or a nested
 * ChildrenMap for route grouping.
 *
 * Special key "/" — matches a trailing slash on this resource.
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
// ResourceKind — abstract base class
// ---------------------------------------------------------------------------

/**
 * Base class for all resources.
 *
 * Subclasses ({@link CollectionKind}, {@link ItemKind}, etc.) add kind-specific
 * abstract handler methods. Users extend those subclasses to implement
 * their resource logic.
 *
 * The site tree stores instances directly. They are shared across requests —
 * per-request state (params, path) is carried by RequestContext, not the
 * resource instance.
 */
export abstract class ResourceKind {
  /** Schema describing the data shape returned by handlers */
  schema?: Schema;
  /** Sub-resources, keyed by path segment */
  children?: ChildrenMap;
  /** Custom element for HTML representation */
  element?: unknown;
  /** JSON-LD @context URI */
  context?: string;
  /** JSON-LD @type */
  jsonldType?: string;
  /**
   * If true, this resource catches all remaining path segments (like Proxy).
   * Used by Static resources to serve files from arbitrary sub-paths.
   */
  catchAll?: boolean;

  /**
   * Create a per-request Resource wrapper for this kind.
   * Each XxxKind subclass returns its corresponding XxxResource.
   */
  abstract createResource(
    params: Record<string, string>,
    path: string,
  ): Resource;
}

// ---------------------------------------------------------------------------
// Abstract Kind classes
// ---------------------------------------------------------------------------

/**
 * CollectionKind — supports list (GET) and create (POST).
 *
 * @example
 * ```ts
 * class Users extends CollectionKind {
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
export abstract class CollectionKind extends ResourceKind {
  abstract list(ctx: RequestContext): Repr | Promise<Repr>;
  abstract create(ctx: RequestContext): Repr | Promise<Repr>;

  createResource(
    params: Record<string, string>,
    path: string,
  ): CollectionResource {
    return new CollectionResource(this, params, path);
  }
}

/**
 * ItemKind — supports content (GET), replace (PUT), patch (PATCH), delete (DELETE).
 * Only `content` is required; `replace`, `patch`, and `delete` are optional.
 */
export abstract class ItemKind extends ResourceKind {
  abstract content(ctx: RequestContext): Repr | Promise<Repr>;
  replace?(ctx: RequestContext): Repr | Promise<Repr>;
  patch?(ctx: RequestContext): Repr | Promise<Repr>;
  delete?(ctx: RequestContext): Repr | Promise<Repr>;

  createResource(
    params: Record<string, string>,
    path: string,
  ): ItemResource {
    return new ItemResource(this, params, path);
  }
}

/**
 * SingletonKind — supports content (GET), replace (PUT), patch (PATCH).
 * Only `content` is required; `replace` and `patch` are optional.
 */
export abstract class SingletonKind extends ResourceKind {
  abstract content(ctx: RequestContext): Repr | Promise<Repr>;
  replace?(ctx: RequestContext): Repr | Promise<Repr>;
  patch?(ctx: RequestContext): Repr | Promise<Repr>;

  createResource(
    params: Record<string, string>,
    path: string,
  ): SingletonResource {
    return new SingletonResource(this, params, path);
  }
}

/**
 * ReadOnlyKind — supports content (GET) only.
 */
export abstract class ReadOnlyKind extends ResourceKind {
  abstract content(ctx: RequestContext): Repr | Promise<Repr>;

  createResource(
    params: Record<string, string>,
    path: string,
  ): ReadOnlyResource {
    return new ReadOnlyResource(this, params, path);
  }
}

/**
 * ActionKind — supports invoke (POST) only.
 * Used for stateless operations like authentication, webhooks, etc.
 */
export abstract class ActionKind extends ResourceKind {
  abstract invoke(ctx: RequestContext): Repr | Promise<Repr>;

  createResource(
    params: Record<string, string>,
    path: string,
  ): ActionResource {
    return new ActionResource(this, params, path);
  }
}

/**
 * ProxyKind — transparently forwards all methods to a target URL.
 */
export abstract class ProxyKind extends ResourceKind {
  /** Proxy catches all remaining path segments. */
  readonly catchAll = true;
  /**
   * Resolve the target URL for a given request path.
   * Receives the remaining path after the proxy mount point.
   */
  abstract target(path: string): URL | Promise<URL>;

  createResource(
    params: Record<string, string>,
    path: string,
  ): ProxyResource {
    return new ProxyResource(this, params, path);
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
// StaticKind — concrete class for file serving (extends ReadOnlyKind)
// ---------------------------------------------------------------------------

/**
 * StaticKind — serves static files from a root directory or resolver.
 *
 * Like ReadOnlyKind (GET only) but with catchAll behavior for sub-path resolution.
 * Create an instance with config and mount it directly:
 *
 * @example
 * ```ts
 * const app = site({
 *   "assets/": new StaticKind({ root: "./public" }),
 * });
 * // /assets/style.css → ./public/style.css
 * ```
 */
export class StaticKind extends ReadOnlyKind {
  private rootDir?: string;
  private indexFile: string;
  private fileResolver?: StaticResolver;

  constructor(config: {
    /** Root directory for static files (Node.js only). */
    root?: string;
    /** Default index file for directory requests (default: "index.html"). */
    index?: string;
    /** Edge-compatible resolver. When provided, `root` is ignored. */
    resolver?: StaticResolver;
  }) {
    super();
    if (config.root === undefined && config.resolver === undefined) {
      throw new TypeError("Static requires either `root` or `resolver`.");
    }
    this.rootDir = config.root;
    this.indexFile = config.index ?? "index.html";
    this.fileResolver = config.resolver;
    this.catchAll = true;
  }

  async content(ctx: RequestContext): Promise<Repr> {
    const mountPrefix = ctx.resourcePath ?? "";
    const rawRelative = ctx.path.slice(mountPrefix.length) || "/";

    let relativePath: string;
    try {
      relativePath = sanitizeStaticPath(rawRelative);
    } catch (err) {
      if (isHttpError(err)) throw err;
      throw new HttpError(403, "Forbidden");
    }

    // Edge resolver path
    if (this.fileResolver) {
      let result = await this.fileResolver(relativePath);
      if (!result && (!relativePath || rawRelative.endsWith("/"))) {
        result = await this.fileResolver(
          relativePath ? `${relativePath}/${this.indexFile}` : this.indexFile,
        );
      }
      if (!result) throw new HttpError(404, "Not Found");

      const mimeType =
        result.type ?? guessMimeType(relativePath || this.indexFile);
      return { content: result.content, meta: { type: mimeType } };
    }

    // Node.js filesystem path
    const nodePath = await import(/* webpackIgnore: true */ "node:path");
    const nodeFs = await import(/* webpackIgnore: true */ "node:fs/promises");

    const resolvedRoot = nodePath.resolve(this.rootDir ?? ".");
    const filePath = nodePath.resolve(resolvedRoot, relativePath);
    if (
      !filePath.startsWith(resolvedRoot + nodePath.sep) &&
      filePath !== resolvedRoot
    ) {
      throw new HttpError(403, "Forbidden");
    }

    let targetPath = filePath;
    try {
      const s = await nodeFs.stat(filePath);
      if (s.isDirectory()) {
        targetPath = nodePath.resolve(filePath, this.indexFile);
        if (
          !targetPath.startsWith(resolvedRoot + nodePath.sep) &&
          targetPath !== resolvedRoot
        ) {
          throw new HttpError(403, "Forbidden");
        }
      }
    } catch (err) {
      if (err instanceof HttpError) throw err;
    }

    try {
      const buffer = await nodeFs.readFile(targetPath);
      const ext = nodePath.extname(targetPath).toLowerCase();
      const mimeType = mimeTypes[ext] ?? "application/octet-stream";

      if (isTextMime(mimeType)) {
        return { content: buffer.toString("utf-8"), meta: { type: mimeType } };
      }
      return {
        content: new Uint8Array(
          buffer.buffer,
          buffer.byteOffset,
          buffer.byteLength,
        ),
        meta: { type: mimeType },
      };
    } catch {
      throw new HttpError(404, "Not Found");
    }
  }

  createResource(
    params: Record<string, string>,
    path: string,
  ): ReadOnlyResource {
    return new ReadOnlyResource(this, params, path);
  }
}

// ---------------------------------------------------------------------------
// MIME type utilities
// ---------------------------------------------------------------------------

const mimeTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml; charset=utf-8",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".pdf": "application/pdf",
  ".webp": "image/webp",
  ".webm": "video/webm",
  ".mp4": "video/mp4",
  ".wasm": "application/wasm",
  ".map": "application/json; charset=utf-8",
};

/** Text MIME types — content is decoded as UTF-8 string. */
const textMimePrefixes = [
  "text/",
  "application/javascript",
  "application/json",
  "application/xml",
  "application/wasm",
  "image/svg+xml",
];

function isTextMime(mime: string): boolean {
  return textMimePrefixes.some((p) => mime.startsWith(p));
}

/**
 * Normalize a request path into a safe relative path.
 * Rejects traversal outside the mount point.
 */
function sanitizeStaticPath(rawRelative: string): string {
  const parts = rawRelative.replace(/^\//, "").split("/").filter(Boolean);
  const safe: string[] = [];
  for (const part of parts) {
    if (part === "..") {
      if (safe.length === 0) throw new HttpError(403, "Forbidden");
      safe.pop();
    } else if (part !== ".") {
      safe.push(part);
    }
  }
  return safe.join("/");
}

/** Guess a MIME type from a file path. */
function guessMimeType(filePath: string): string {
  const dot = filePath.lastIndexOf(".");
  const ext = dot === -1 ? "" : filePath.slice(dot).toLowerCase();
  return mimeTypes[ext] ?? "application/octet-stream";
}

// ---------------------------------------------------------------------------
// Resource — the result of path resolution
// ---------------------------------------------------------------------------

const HTTP_METHODS = ["get", "post", "put", "patch", "delete"] as const;

/**
 * The result of resolving a URL path against the resource tree.
 *
 * Wraps a shared ResourceKind instance with per-request state (params, path).
 * HTTP methods default to 405; XxxResource subclasses override the ones they support.
 * `allowedMethods()` is auto-derived by checking which methods are overridden.
 */
export class Resource {
  constructor(
    readonly kind: ResourceKind,
    readonly params: Record<string, string>,
    readonly path: string,
  ) {}

  // Property forwarding
  get schema() { return this.kind.schema; }
  get element() { return this.kind.element; }
  get context() { return this.kind.context; }
  get jsonldType() { return this.kind.jsonldType; }

  // HTTP methods — all default to 405 Method Not Allowed
  get(ctx: RequestContext): Repr | Promise<Repr> {
    throw new HttpError(405, "Method Not Allowed", undefined, { Allow: this.allowedMethods().join(", ") });
  }
  post(ctx: RequestContext): Repr | Promise<Repr> {
    throw new HttpError(405, "Method Not Allowed", undefined, { Allow: this.allowedMethods().join(", ") });
  }
  put(ctx: RequestContext): Repr | Promise<Repr> {
    throw new HttpError(405, "Method Not Allowed", undefined, { Allow: this.allowedMethods().join(", ") });
  }
  patch(ctx: RequestContext): Repr | Promise<Repr> {
    throw new HttpError(405, "Method Not Allowed", undefined, { Allow: this.allowedMethods().join(", ") });
  }
  delete(ctx: RequestContext): Repr | Promise<Repr> {
    throw new HttpError(405, "Method Not Allowed", undefined, { Allow: this.allowedMethods().join(", ") });
  }

  /**
   * Auto-derive allowed methods by checking which HTTP methods are overridden.
   * Compares against Resource.prototype — overridden methods differ.
   */
  allowedMethods(): string[] {
    return HTTP_METHODS
      .filter(m => this[m] !== Resource.prototype[m])
      .map(m => m.toUpperCase());
  }

  /**
   * Infer HTTP status code from the Repr and method.
   * Default implementation; XxxResource subclasses may override.
   */
  inferStatus(repr: Repr, method: string, hasRange: boolean): number {
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

  // Optional — only ProxyResource implements this
  // Returns the proxy target URL for the given path
  proxy?(path: string): URL | Promise<URL>;

  // Optional — only ActionResource implements this
  // Direct access to invoke() for auth verification
  invoke?(ctx: RequestContext): Repr | Promise<Repr>;
}

/** CollectionResource — GET→list, POST→create */
export class CollectionResource extends Resource {
  declare readonly kind: CollectionKind;

  async get(ctx: RequestContext) { return this.kind.list(ctx); }
  async post(ctx: RequestContext) { return this.kind.create(ctx); }

  override inferStatus(repr: Repr, method: string, hasRange: boolean): number {
    if (method === "POST" && repr.meta.location && repr.content !== null) return 201;
    return super.inferStatus(repr, method, hasRange);
  }
}

/** ItemResource — GET→content, PUT→replace, PATCH→patch, DELETE→delete */
export class ItemResource extends Resource {
  declare readonly kind: ItemKind;

  async get(ctx: RequestContext) { return this.kind.content(ctx); }
  async put(ctx: RequestContext) {
    if (!this.kind.replace) throw new HttpError(405, "Method Not Allowed", undefined, { Allow: this.allowedMethods().join(", ") });
    return this.kind.replace(ctx);
  }
  async patch(ctx: RequestContext) {
    if (!this.kind.patch) throw new HttpError(405, "Method Not Allowed", undefined, { Allow: this.allowedMethods().join(", ") });
    return this.kind.patch(ctx);
  }
  async delete(ctx: RequestContext) {
    if (!this.kind.delete) throw new HttpError(405, "Method Not Allowed", undefined, { Allow: this.allowedMethods().join(", ") });
    return this.kind.delete(ctx);
  }

  override allowedMethods(): string[] {
    const methods = ["GET"];
    if (this.kind.replace) methods.push("PUT");
    if (this.kind.patch) methods.push("PATCH");
    if (this.kind.delete) methods.push("DELETE");
    return methods;
  }
}

/** SingletonResource — GET→content, PUT→replace, PATCH→patch */
export class SingletonResource extends Resource {
  declare readonly kind: SingletonKind;

  async get(ctx: RequestContext) { return this.kind.content(ctx); }
  async put(ctx: RequestContext) {
    if (!this.kind.replace) throw new HttpError(405, "Method Not Allowed", undefined, { Allow: this.allowedMethods().join(", ") });
    return this.kind.replace(ctx);
  }
  async patch(ctx: RequestContext) {
    if (!this.kind.patch) throw new HttpError(405, "Method Not Allowed", undefined, { Allow: this.allowedMethods().join(", ") });
    return this.kind.patch(ctx);
  }

  override allowedMethods(): string[] {
    const methods = ["GET"];
    if (this.kind.replace) methods.push("PUT");
    if (this.kind.patch) methods.push("PATCH");
    return methods;
  }
}

/** ReadOnlyResource — GET→content only */
export class ReadOnlyResource extends Resource {
  declare readonly kind: ReadOnlyKind;

  async get(ctx: RequestContext) { return this.kind.content(ctx); }
}

/** ActionResource — POST→invoke */
export class ActionResource extends Resource {
  declare readonly kind: ActionKind;

  async post(ctx: RequestContext) { return this.kind.invoke(ctx); }
  invoke(ctx: RequestContext) { return this.kind.invoke(ctx); }
}

/** ProxyResource — intercepts all methods via proxy() */
export class ProxyResource extends Resource {
  declare readonly kind: ProxyKind;

  proxy(path: string) { return this.kind.target(path); }
}

// ---------------------------------------------------------------------------
// Kind helpers
// ---------------------------------------------------------------------------

/**
 * Check if a value is a ResourceKind instance.
 */
export function isResourceKind(value: unknown): value is ResourceKind {
  return value instanceof ResourceKind;
}

/**
 * Resolve a ChildrenMap entry to a ResourceKind instance.
 * If the entry is a direct instance, return it; if it's a ChildResolver, call it.
 */
function resolveChildEntry(
  entry: ResourceKind | ChildResolver,
  segment: string,
): ResourceKind {
  if (isResourceKind(entry)) {
    return entry;
  }
  return (entry as ChildResolver)(segment);
}

/**
 * Check if a ChildrenMap entry is a resource or resolver (not a nested map).
 */
function isResourceOrResolver(
  entry: ResourceKind | ChildResolver | ChildrenMap,
): entry is ResourceKind | ChildResolver {
  return isResourceKind(entry) || typeof entry === "function";
}

/**
 * Strip a single trailing slash from a path string (if present).
 * Used to normalize the resolved `path` so callers see `/articles/42`
 * rather than `/articles/42/`.
 */
function stripTrailingSlash(p: string): string {
  return p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;
}

// ---------------------------------------------------------------------------
// Resolution — walk the resource tree, return Resource
// ---------------------------------------------------------------------------

/**
 * Resolve a trailing-slash "/" child of a resource, if present.
 * Returns a {@link Resource} carrying the same params/path, or null.
 */
function resolveTrailingSlash(
  resource: ResourceKind,
  params: Record<string, string>,
  path: string,
): Resource | null {
  if (!resource.children || !("/" in resource.children)) return null;
  const slashChild = resource.children["/"];
  if (!isResourceOrResolver(slashChild)) return null;
  const child = resolveChildEntry(slashChild, "");
  return child.createResource(params, path);
}

/**
 * Try to match a path segment against a ChildrenMap entry.
 * Returns `{ kind, newParams }` on match, or null.
 */
function matchChild(
  children: ChildrenMap,
  segment: string,
  params: Record<string, string>,
): { kind: ResourceKind; newParams: Record<string, string> } | null {
  // Exact match first
  if (segment in children) {
    const child = children[segment];
    if (isResourceOrResolver(child)) {
      const resource = resolveChildEntry(child, segment);
      return { kind: resource, newParams: params };
    }
    return null;
  }

  // Parameterized match (keys starting with ":")
  for (const [key, child] of Object.entries(children)) {
    if (key.startsWith(":")) {
      const paramName = key.slice(1);
      if (isResourceOrResolver(child)) {
        const resource = resolveChildEntry(child, segment);
        return {
          kind: resource,
          newParams: { ...params, [paramName]: segment },
        };
      }
    }
  }

  return null;
}

/**
 * Walk a ChildrenMap (route group) to resolve remaining path segments.
 * Returns a {@link Resource} on success, or null.
 */
function walkChildrenMap(
  map: ChildrenMap,
  remaining: string[],
  params: Record<string, string>,
  pathSoFar: string,
): Resource | null {
  if (remaining.length === 0) return null;

  const [next, ...rest] = remaining;
  const nextPath = `${pathSoFar}${next}/`;

  // Exact match in map
  if (next in map) {
    const child = map[next];
    if (isResourceOrResolver(child)) {
      const resource = resolveChildEntry(child, next);
      return walkResource(resource, rest, params, nextPath);
    } else {
      return walkChildrenMap(child, rest, params, nextPath);
    }
  }

  // Parameterized match in map
  for (const [key, child] of Object.entries(map)) {
    if (key.startsWith(":")) {
      const paramName = key.slice(1);
      if (isResourceOrResolver(child)) {
        const resource = resolveChildEntry(child, next);
        const newParams = { ...params, [paramName]: next };
        return walkResource(resource, rest, newParams, nextPath);
      } else {
        const newParams = { ...params, [paramName]: next };
        return walkChildrenMap(child, rest, newParams, nextPath);
      }
    }
  }

  return null;
}

/**
 * Walk a Resource's children to resolve remaining path segments.
 * Returns a {@link Resource} on success, or null.
 *
 * The resource instance is **not** mutated — params and path are carried
 * by the returned Resource wrapper.
 */
function walkResource(
  current: ResourceKind,
  remaining: string[],
  params: Record<string, string>,
  pathSoFar: string,
): Resource | null {
  // No more segments — we've found the resource
  if (remaining.length === 0) {
    return current.createResource(params, stripTrailingSlash(pathSoFar));
  }

  // catchAll resources (e.g. StaticKind) consume all remaining segments.
  if (current.catchAll) {
    return current.createResource(params, stripTrailingSlash(pathSoFar));
  }

  // No children defined — can't resolve further
  if (!current.children) return null;

  const [next, ...rest] = remaining;
  const match = matchChild(current.children, next, params);

  if (match) {
    return walkResource(
      match.kind,
      rest,
      match.newParams,
      `${pathSoFar}${next}/`,
    );
  }

  // Try nested ChildrenMap for exact match
  if (next in current.children) {
    const child = current.children[next];
    if (!isResourceOrResolver(child)) {
      return walkChildrenMap(child, rest, params, `${pathSoFar}${next}/`);
    }
  }

  return null;
}

/**
 * Resolve a path against a resource tree.
 * Walks the children recursively, calling ChildResolvers with path segments.
 *
 * The resource instance is returned as-is (shared across requests). Per-request
 * state (params, path) is carried by the returned {@link Resource}.
 *
 * Trailing slash handling: if `hasTrailingSlash` is true and the resolved
 * resource has a "/" child, that child is used instead.
 */
export function resolveResource(
  root: ResourceKind,
  path: string,
  pathPrefix = "/",
  hasTrailingSlash = false,
): Resource | null {
  const segments = path.split("/").filter(Boolean);
  const result = walkResource(root, segments, {}, pathPrefix);

  if (!result) return null;

  if (hasTrailingSlash) {
    const slashResult = resolveTrailingSlash(
      result.kind,
      result.params,
      result.path,
    );
    if (slashResult) return slashResult;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Get the schema from a resource, defaulting to anySchema.
 */
export function getDescriptorSchema(resource: ResourceKind): Schema {
  return resource.schema ?? anySchema;
}

/**
 * Resolve a trailing-slash "/" child on a resource (public helper for site.ts).
 * Carries the same params/path as the input.
 */
export function tryResolveTrailingSlash(
  resource: ResourceKind,
  params: Record<string, string>,
  path: string,
): Resource | null {
  return resolveTrailingSlash(resource, params, path);
}
