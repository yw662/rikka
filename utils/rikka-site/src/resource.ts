/**
 * @module resource
 * Resource — the core class hierarchy.
 *
 * Five-level chain:
 *   Kind(impl) → ResourceFactory → Mount = ResourceFactory(config) → Resource [params/path] → resource[operation](ctx)
 *
 * Mount layer stores **constructors** (classes), not instances.
 * site.resolve() calls `new` to create fresh instances per request.
 * This avoids concurrent requests mutating shared params/path.
 *
 * Resource is a class hierarchy — each Kind has its own subclass
 * with type-safe handler methods (e.g. resource.list(ctx), resource.invoke(ctx)).
 */

import type { Kind } from "./kind.js";
import type { Schema } from "./schema.js";
import { anySchema } from "./schema.js";
import type { RequestContext } from "./context.js";

// ---------------------------------------------------------------------------
// Children — the sub-resource tree
// ---------------------------------------------------------------------------

/**
 * A function that takes a path parameter and returns a Resource constructor.
 * Called during path resolution with the matched path segment.
 */
export type ChildResolver = (param: string) => ResourceConstructor;

/**
 * The children map: keys are path segments (e.g. ":userId"), values are either
 * a ChildResolver, a ResourceFactory, or a nested object for route grouping.
 *
 * Special key "/" — matches a trailing slash on this resource.
 */
export interface ChildrenMap {
  [key: string]: ChildResolver | ResourceFactory | ChildrenMap;
}

// ---------------------------------------------------------------------------
// Handlers — receive RequestContext, return anything
// ---------------------------------------------------------------------------

/**
 * Generic handler — all handlers receive a RequestContext.
 * Return value is auto-wrapped as a Repr (or may return a Repr explicitly).
 */
export type Handler = (ctx: RequestContext) => unknown | Promise<unknown>;

/**
 * Proxy target resolver — receives the remaining path and returns a target URL.
 */
export type ProxyTarget = (path: string) => URL | Promise<URL>;

// ---------------------------------------------------------------------------
// Resource — class hierarchy
// ---------------------------------------------------------------------------

/**
 * Base class for all resolved resources.
 * Subclasses add kind-specific handler methods.
 */
export abstract class Resource {
  /** The resource kind — constrains which operations are valid */
  abstract readonly kind: Kind;
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

  /** Path parameters accumulated during resolution */
  params: Record<string, string> = {};
  /** The full path that was resolved */
  path: string = "";

  constructor(init?: {
    schema?: Schema;
    children?: ChildrenMap;
    element?: unknown;
    context?: string;
    jsonldType?: string;
    catchAll?: boolean;
    params?: Record<string, string>;
    path?: string;
  }) {
    if (init?.schema !== undefined) this.schema = init.schema;
    if (init?.children !== undefined) this.children = init.children;
    if (init?.element !== undefined) this.element = init.element;
    if (init?.context !== undefined) this.context = init.context;
    if (init?.jsonldType !== undefined) this.jsonldType = init.jsonldType;
    if (init?.catchAll !== undefined) this.catchAll = init.catchAll;
    if (init?.params !== undefined) this.params = init.params;
    if (init?.path !== undefined) this.path = init.path;
  }
}

/**
 * Constructor type for Resource and its subclasses.
 */
export type ResourceConstructor = new (
  params: Record<string, string>,
  path: string,
) => Resource;

/**
 * Collection resource — supports list (GET) and create (POST).
 */
export class CollectionResource extends Resource {
  readonly kind = "Collection" as const;
  list: Handler;
  create: Handler;

  constructor(
    handlers: { list: Handler; create: Handler },
    init?: {
      schema?: Schema;
      children?: ChildrenMap;
      element?: unknown;
      context?: string;
      jsonldType?: string;
    },
    params?: Record<string, string>,
    path?: string,
  ) {
    super({ ...init, params, path });
    this.list = handlers.list;
    this.create = handlers.create;
  }
}

/**
 * Item resource — supports content (GET), replace (PUT), patch (PATCH), delete (DELETE).
 */
export class ItemResource extends Resource {
  readonly kind = "Item" as const;
  content: Handler;
  replace?: Handler;
  patch?: Handler;
  delete?: Handler;

  constructor(
    handlers: {
      content: Handler;
      replace?: Handler;
      patch?: Handler;
      delete?: Handler;
    },
    init?: {
      schema?: Schema;
      children?: ChildrenMap;
      element?: unknown;
      context?: string;
      jsonldType?: string;
    },
    params?: Record<string, string>,
    path?: string,
  ) {
    super({ ...init, params, path });
    this.content = handlers.content;
    if (handlers.replace !== undefined) this.replace = handlers.replace;
    if (handlers.patch !== undefined) this.patch = handlers.patch;
    if (handlers.delete !== undefined) this.delete = handlers.delete;
  }
}

/**
 * Singleton resource — supports content (GET), replace (PUT), patch (PATCH).
 */
export class SingletonResource extends Resource {
  readonly kind = "Singleton" as const;
  content: Handler;
  replace?: Handler;
  patch?: Handler;

  constructor(
    handlers: {
      content: Handler;
      replace?: Handler;
      patch?: Handler;
    },
    init?: {
      schema?: Schema;
      children?: ChildrenMap;
      element?: unknown;
      context?: string;
      jsonldType?: string;
    },
    params?: Record<string, string>,
    path?: string,
  ) {
    super({ ...init, params, path });
    this.content = handlers.content;
    if (handlers.replace !== undefined) this.replace = handlers.replace;
    if (handlers.patch !== undefined) this.patch = handlers.patch;
  }
}

/**
 * ReadOnly resource — supports content (GET) only.
 */
export class ReadOnlyResource extends Resource {
  readonly kind = "ReadOnly" as const;
  content: Handler;

  constructor(
    handlers: { content: Handler },
    init?: {
      schema?: Schema;
      children?: ChildrenMap;
      element?: unknown;
      context?: string;
      jsonldType?: string;
    },
    params?: Record<string, string>,
    path?: string,
  ) {
    super({ ...init, params, path });
    this.content = handlers.content;
  }
}

/**
 * Action resource — supports invoke (POST) only.
 */
export class ActionResource extends Resource {
  readonly kind = "Action" as const;
  invoke: Handler;

  constructor(
    handlers: { invoke: Handler },
    init?: {
      schema?: Schema;
      children?: ChildrenMap;
      element?: unknown;
      context?: string;
      jsonldType?: string;
    },
    params?: Record<string, string>,
    path?: string,
  ) {
    super({ ...init, params, path });
    this.invoke = handlers.invoke;
  }
}

/**
 * Proxy resource — transparently forwards all methods to a target URL.
 */
export class ProxyResource extends Resource {
  readonly kind = "Proxy" as const;
  target: ProxyTarget;

  constructor(
    handlers: { target: ProxyTarget },
    init?: {
      schema?: Schema;
      children?: ChildrenMap;
      element?: unknown;
      context?: string;
      jsonldType?: string;
    },
    params?: Record<string, string>,
    path?: string,
  ) {
    super({ ...init, params, path });
    this.target = handlers.target;
  }
}

/**
 * Static resource — serves static files from a root directory.
 * Like ReadOnly (GET only) but with catchAll behavior for sub-path resolution.
 */
export class StaticResource extends ReadOnlyResource {
  readonly rootDir: string;
  readonly indexFile: string;

  constructor(
    handlers: { content: Handler },
    init: {
      rootDir: string;
      indexFile?: string;
      schema?: Schema;
      children?: ChildrenMap;
      element?: unknown;
      context?: string;
      jsonldType?: string;
    },
    params?: Record<string, string>,
    path?: string,
  ) {
    super(handlers, init, params, path);
    this.rootDir = init.rootDir;
    this.indexFile = init.indexFile ?? "index.html";
    this.catchAll = true;
  }
}

// ---------------------------------------------------------------------------
// ResourceFactory — a function from config to constructor (level 2 → level 3)
// ---------------------------------------------------------------------------

/**
 * A ResourceFactory is a function that takes a config object and returns
 * a Resource constructor (class). This is the level-2 abstraction.
 *
 * The config is captured via closure — the returned class's constructor
 * creates instances with handlers that reference the config.
 */
export type ResourceFactory<C = unknown> = (config?: C) => ResourceConstructor;

// ---------------------------------------------------------------------------
// Kind factory functions — the public API for defining ResourceFactories
// ---------------------------------------------------------------------------

/**
 * Define a Collection ResourceFactory.
 * A Collection supports list (GET) and create (POST).
 */
export function Collection<C>(
  impl: (config: C) => {
    list: Handler;
    create: Handler;
    schema?: Schema;
    children?: ChildrenMap;
    element?: unknown;
    context?: string;
    jsonldType?: string;
  },
): ResourceFactory<C> {
  return (config?: C) => {
    const { list, create, schema, children, element, context, jsonldType } =
      impl(config as C);
    return class extends CollectionResource {
      constructor(params: Record<string, string>, path: string) {
        super(
          { list, create },
          { schema, children, element, context, jsonldType },
          params,
          path,
        );
      }
    };
  };
}

/**
 * Define an Item ResourceFactory.
 * An Item supports content (GET), replace (PUT), patch (PATCH), and delete (DELETE).
 */
export function Item<C>(
  impl: (config: C) => {
    content: Handler;
    replace?: Handler;
    patch?: Handler;
    delete?: Handler;
    schema?: Schema;
    children?: ChildrenMap;
    element?: unknown;
    context?: string;
    jsonldType?: string;
  },
): ResourceFactory<C> {
  return (config?: C) => {
    const {
      content,
      replace,
      patch,
      delete: del,
      schema,
      children,
      element,
      context,
      jsonldType,
    } = impl(config as C);
    return class extends ItemResource {
      constructor(params: Record<string, string>, path: string) {
        super(
          { content, replace, patch, delete: del },
          { schema, children, element, context, jsonldType },
          params,
          path,
        );
      }
    };
  };
}

/**
 * Define a Singleton ResourceFactory.
 * A Singleton supports content (GET), replace (PUT), and patch (PATCH).
 */
export function Singleton<C>(
  impl: (config: C) => {
    content: Handler;
    replace?: Handler;
    patch?: Handler;
    schema?: Schema;
    children?: ChildrenMap;
    element?: unknown;
    context?: string;
    jsonldType?: string;
  },
): ResourceFactory<C> {
  return (config?: C) => {
    const {
      content,
      replace,
      patch,
      schema,
      children,
      element,
      context,
      jsonldType,
    } = impl(config as C);
    return class extends SingletonResource {
      constructor(params: Record<string, string>, path: string) {
        super(
          { content, replace, patch },
          { schema, children, element, context, jsonldType },
          params,
          path,
        );
      }
    };
  };
}

/**
 * Define a ReadOnly ResourceFactory.
 * A ReadOnly supports content (GET) only.
 */
export function ReadOnly<C>(
  impl: (config: C) => {
    content: Handler;
    schema?: Schema;
    children?: ChildrenMap;
    element?: unknown;
    context?: string;
    jsonldType?: string;
  },
): ResourceFactory<C> {
  return (config?: C) => {
    const { content, schema, children, element, context, jsonldType } = impl(
      config as C,
    );
    return class extends ReadOnlyResource {
      constructor(params: Record<string, string>, path: string) {
        super(
          { content },
          { schema, children, element, context, jsonldType },
          params,
          path,
        );
      }
    };
  };
}

/**
 * Define an Action ResourceFactory.
 * An Action supports invoke (POST) only.
 */
export function Action<C>(
  impl: (config: C) => {
    invoke: Handler;
    schema?: Schema;
    children?: ChildrenMap;
    element?: unknown;
    context?: string;
    jsonldType?: string;
  },
): ResourceFactory<C> {
  return (config?: C) => {
    const { invoke, schema, children, element, context, jsonldType } = impl(
      config as C,
    );
    return class extends ActionResource {
      constructor(params: Record<string, string>, path: string) {
        super(
          { invoke },
          { schema, children, element, context, jsonldType },
          params,
          path,
        );
      }
    };
  };
}

/**
 * Define a Proxy ResourceFactory.
 * A Proxy transparently forwards all methods to a target URL.
 */
export function Proxy<C>(
  impl: (config: C) => {
    target: ProxyTarget;
    schema?: Schema;
    children?: ChildrenMap;
    element?: unknown;
    context?: string;
    jsonldType?: string;
  },
): ResourceFactory<C> {
  return (config?: C) => {
    const { target, schema, children, element, context, jsonldType } = impl(
      config as C,
    );
    return class extends ProxyResource {
      constructor(params: Record<string, string>, path: string) {
        super(
          { target },
          { schema, children, element, context, jsonldType },
          params,
          path,
        );
      }
    };
  };
}

// ---------------------------------------------------------------------------
// MIME type map for Static file serving
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

// ---------------------------------------------------------------------------
// Static Kind factory
// ---------------------------------------------------------------------------

/**
 * Define a Static ResourceFactory.
 * A Static resource serves files from a root directory (GET only).
 *
 * Like ReadOnly but with catchAll behavior — any remaining path segments
 * after the mount point are resolved as relative file paths within `root`.
 *
 * @example
 * ```ts
 * const Assets = Static({ root: "./public" });
 * // Mounted at /assets: /assets/style.css → ./public/style.css
 * ```
 */
export function Static(config: {
  /** Root directory for static files */
  root: string;
  /** Default index file for directory requests (default: "index.html") */
  index?: string;
}): ResourceConstructor {
  const { root, index = "index.html" } = config;

  const contentHandler: Handler = async (ctx) => {
    // Dynamic imports for Node.js — preserved in ESM output.
    // webpackIgnore prevents rspack from trying to resolve node:* at build time.
    const nodePath = await import(/* webpackIgnore: true */ "node:path");
    const nodeFs = await import(/* webpackIgnore: true */ "node:fs/promises");
    const { HttpError } = await import("./errors.js");

    // Compute relative path from mount point
    const mountPrefix = ctx.resourcePath ?? "";
    const rawRelative = ctx.path.slice(mountPrefix.length) || "/";
    const relativePath = rawRelative.replace(/^\//, "");

    // Resolve and prevent path traversal
    const resolvedRoot = nodePath.resolve(root);
    const filePath = nodePath.resolve(resolvedRoot, relativePath);
    if (
      !filePath.startsWith(resolvedRoot + nodePath.sep) &&
      filePath !== resolvedRoot
    ) {
      throw new HttpError(403, "Forbidden");
    }

    // If path is a directory, try index file
    let targetPath = filePath;
    try {
      const s = await nodeFs.stat(filePath);
      if (s.isDirectory()) {
        targetPath = nodePath.resolve(filePath, index);
        // Check path traversal on the index file too
        if (
          !targetPath.startsWith(resolvedRoot + nodePath.sep) &&
          targetPath !== resolvedRoot
        ) {
          throw new HttpError(403, "Forbidden");
        }
      }
    } catch (err) {
      if (err instanceof HttpError) throw err;
      // Not found — fall through to readFile which will also fail
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
  };

  return class extends StaticResource {
    constructor(params: Record<string, string>, path: string) {
      super(
        { content: contentHandler },
        { rootDir: root, indexFile: index },
        params,
        path,
      );
    }
  };
}

// ---------------------------------------------------------------------------
// Resolution — walk the resource tree, instantiate per request
// ---------------------------------------------------------------------------

/**
 * Resolve a trailing-slash "/" child if present.
 * Returns a new instance with the same params/path, or null.
 */
function resolveTrailingSlash(resource: Resource): Resource | null {
  if (!resource.children || !("/" in resource.children)) return null;
  const slashChild = resource.children["/"];
  if (typeof slashChild !== "function") return null;
  const Constructor = (slashChild as ChildResolver)("");
  const instance = new Constructor(resource.params, resource.path);
  return instance;
}

/**
 * Try to match a path segment against a ChildrenMap entry.
 * Returns { resolver, newParams } on match, or null.
 */
function matchChild(
  children: ChildrenMap,
  segment: string,
  params: Record<string, string>,
): { resolver: ChildResolver; newParams: Record<string, string> } | null {
  // Exact match first
  if (segment in children) {
    const child = children[segment];
    if (typeof child === "function") {
      // Both ChildResolver and ResourceFactory are callable
      return { resolver: child as ChildResolver, newParams: params };
    }
    return null;
  }

  // Parameterized match (keys starting with ":")
  for (const [key, child] of Object.entries(children)) {
    if (key.startsWith(":")) {
      const paramName = key.slice(1);
      if (typeof child === "function") {
        return {
          resolver: child as ChildResolver,
          newParams: { ...params, [paramName]: segment },
        };
      }
    }
  }

  return null;
}

/**
 * Walk a ChildrenMap (route group) to resolve remaining path segments.
 */
function walkChildrenMap(
  map: ChildrenMap,
  remaining: string[],
  params: Record<string, string>,
  pathSoFar: string,
): Resource | null {
  if (remaining.length === 0) return null;

  const [next, ...rest] = remaining;

  // Exact match in map
  if (next in map) {
    const child = map[next];
    if (typeof child === "function") {
      const Constructor = (child as ChildResolver)(next);
      const instance = new Constructor(params, `${pathSoFar}${next}/`);
      return walkResource(instance, rest, params, `${pathSoFar}${next}/`);
    } else {
      return walkChildrenMap(child, rest, params, `${pathSoFar}${next}/`);
    }
  }

  // Parameterized match in map
  for (const [key, child] of Object.entries(map)) {
    if (key.startsWith(":")) {
      const paramName = key.slice(1);
      if (typeof child === "function") {
        const Constructor = (child as ChildResolver)(next);
        const newParams = { ...params, [paramName]: next };
        const instance = new Constructor(newParams, `${pathSoFar}${next}/`);
        return walkResource(instance, rest, newParams, `${pathSoFar}${next}/`);
      } else {
        const newParams = { ...params, [paramName]: next };
        return walkChildrenMap(child, rest, newParams, `${pathSoFar}${next}/`);
      }
    }
  }

  return null;
}

/**
 * Walk a Resource's children to resolve remaining path segments.
 */
function walkResource(
  current: Resource,
  remaining: string[],
  params: Record<string, string>,
  pathSoFar: string,
): Resource | null {
  // No more segments — we've found the resource
  if (remaining.length === 0) {
    current.params = params;
    current.path = pathSoFar;
    return current;
  }

  // Proxy resources act as a path prefix — any remaining segments are
  // delegated to the proxy's target function. Return the Proxy itself.
  if (current.kind === "Proxy") {
    current.params = params;
    current.path = pathSoFar.endsWith("/") ? pathSoFar.slice(0, -1) : pathSoFar;
    return current;
  }

  // catchAll resources (e.g. Static) also consume all remaining segments.
  if (current.catchAll) {
    current.params = params;
    current.path = pathSoFar.endsWith("/") ? pathSoFar.slice(0, -1) : pathSoFar;
    return current;
  }

  // No children defined — can't resolve further
  if (!current.children) return null;

  const [next, ...rest] = remaining;
  const match = matchChild(current.children, next, params);

  if (match) {
    const Constructor = match.resolver(next);
    const instance = new Constructor(match.newParams, `${pathSoFar}${next}/`);
    return walkResource(
      instance,
      rest,
      match.newParams,
      `${pathSoFar}${next}/`,
    );
  }

  // Try nested ChildrenMap for exact match
  if (next in current.children) {
    const child = current.children[next];
    if (typeof child !== "function") {
      return walkChildrenMap(child, rest, params, `${pathSoFar}${next}/`);
    }
  }

  return null;
}

/**
 * Resolve a path against a resource tree.
 * Walks the children recursively, calling ChildResolvers with path segments.
 * Creates fresh instances via `new` at each step.
 *
 * Trailing slash handling: if `hasTrailingSlash` is true and the resolved
 * resource has a "/" child, that child is used instead.
 */
export function resolveResource(
  root: ResourceConstructor,
  path: string,
  pathPrefix = "/",
  hasTrailingSlash = false,
): Resource | null {
  const segments = path.split("/").filter(Boolean);
  const rootInstance = new root({}, pathPrefix);
  const result = walkResource(rootInstance, segments, {}, pathPrefix);

  if (!result) return null;

  if (hasTrailingSlash) {
    const slashResult = resolveTrailingSlash(result);
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
export function getDescriptorSchema(resource: Resource): Schema {
  return resource.schema ?? anySchema;
}

/**
 * Resolve a trailing-slash "/" child on a resource (public helper for site.ts).
 */
export function tryResolveTrailingSlash(resource: Resource): Resource | null {
  return resolveTrailingSlash(resource);
}
