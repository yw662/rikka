/**
 * @module site
 * Site — the declarative resource tree with request handling.
 *
 * The tree stores ResourceKind instances. Instances are shared across
 * requests — they are kinds (type descriptors), not per-request state.
 * site.resolve() returns a {@link Resource} carrying the resource
 * alongside its per-request params and path.
 *
 * Also contains the full request-handling pipeline (handleRequest)
 * and all supporting helpers (auth verification, proxy handling,
 * status inference, range parsing, response building, etc.).
 */

import {
  resolveResource,
  tryResolveTrailingSlash,
  ResourceKind,
  isResourceKind,
} from "./resource.js";
import type { Resource } from "./resource.js";
import type { AuthConfig, CorsConfig } from "./auth.js";
import { matchAuthRule, corsHeaders } from "./auth.js";
import {
  TransformerRegistry,
  jsonTransformer,
  jsonldTransformer,
  csvTransformer,
  textTransformer,
  cborTransformer,
  createHtmlTransformer,
} from "./transform.js";
import type { Transformer } from "./transform.js";
import { negotiate } from "./negotiate.js";
import {
  isPartial,
  isBytes,
  isHttpError,
  type Repr,
  type PartialContent,
} from "./representation.js";
import type { RequestContext, Identity, RangeSpec, Range } from "./context.js";
import { getHeader, createRequestContext } from "./context.js";
import type { HttpRequest, HttpResponse } from "./server.js";
import type { SitemapEntry } from "./sitemap.js";
import { generateSitemap } from "./sitemap.js";
import type { CustomElementConstructor } from "./resource.js";
import {
  buildCustomElementRegistry,
  bundleCustomElements,
  type CustomElementRegistryEntry,
} from "./custom-elements.js";

// ---------------------------------------------------------------------------
// Site types
// ---------------------------------------------------------------------------

/**
 * A site node is either a ResourceKind instance (a mounted resource)
 * or a nested record (a route group).
 */
export type SiteNode = ResourceKind | { [key: string]: SiteNode };

/**
 * A site definition — the root of the declarative resource tree.
 * Keys become URL path segments, values become instances or sub-trees.
 */
export type SiteDefinition = { [key: string]: SiteNode };

/**
 * A static asset registered with a site and served at `/.well-known/assets/:name`.
 */
export interface SiteAsset {
  /**
   * Path to the asset file.
   * - If a `file:` URL, it is converted to an absolute filesystem path.
   * - If a relative string, it is resolved against the current working directory.
   * - If an absolute string, it is used as-is.
   */
  source: string | URL;
  /** Optional Content-Type. Inferred from the file extension if omitted. */
  contentType?: string;
}

/**
 * Options for configuring a site.
 */
export interface SiteOptions {
  /** Authentication configuration */
  auth?: AuthConfig;
  /** CORS configuration — handleRequest handles preflight and adds headers */
  cors?: CorsConfig;
  /** Additional transformers to register (beyond built-in json/jsonld/html) */
  transformers?: Transformer[];
  /**
   * SDK script source to serve at `/.well-known/sdk/sdk.js`.
   * When provided, Site.handleRequest intercepts that path and serves this string
   * as `application/javascript`. The Node adapter auto-loads the built SDK via
   * the `@takanashi/rikka-site/sdk` package export and passes it here.
   */
  sdkScript?: string;
  /**
   * Sitemap entries to embed in HTML responses.
   * When provided, the HTML transformer includes a `<script data-sitemap>` tag
   * and the SDK script tag for client-side routing.
   */
  sitemap?: SitemapEntry[];
  /**
   * Custom element classes to make available to the site.
   * Keys are the export names used by the browser entry module; values must be
   * classes created with `defineElement()` from `@takanashi/rikka-elements`,
   * which carry a static `tagName` property.
   */
  customElements?: Record<string, CustomElementConstructor>;
  /**
   * Source entry module for the custom element browser bundle.
   * rikka-site bundles this file with esbuild and serves it at
   * `/.well-known/assets/elements.js`. The entry should import/export the
   * classes registered in `customElements` so the browser can define them.
   * Accepts a filesystem path string or a `file:` URL.
   */
  customElementsEntry?: string | URL;
  /**
   * Static assets served at `/.well-known/assets/:name`.
   * Object keys become the URL filename; values point to files on disk.
   */
  assets?: Record<string, SiteAsset>;
}

// ---------------------------------------------------------------------------
// Static asset helpers
// ---------------------------------------------------------------------------

/**
 * Infer a Content-Type from a filename extension.
 */
function inferContentType(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "js":
    case "mjs":
      return "application/javascript; charset=utf-8";
    case "css":
      return "text/css; charset=utf-8";
    case "ico":
      return "image/x-icon";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "svg":
      return "image/svg+xml; charset=utf-8";
    case "json":
      return "application/json; charset=utf-8";
    case "txt":
      return "text/plain; charset=utf-8";
    case "html":
      return "text/html; charset=utf-8";
    default:
      return "application/octet-stream";
  }
}

/**
 * Resolve an asset source to an absolute filesystem path.
 * Handles `file:` URLs, absolute paths, and relative paths (resolved against cwd).
 */
async function resolveAssetPath(source: string | URL): Promise<string> {
  const nodePath = await import("node:path");
  const nodeUrl = await import("node:url");
  if (source instanceof URL) {
    if (source.protocol !== "file:") {
      throw new Error(
        `Asset source URL must use file: protocol, got ${source.protocol}`,
      );
    }
    return nodeUrl.fileURLToPath(source);
  }
  if (nodePath.isAbsolute(source)) return source;
  return nodePath.resolve(process.cwd(), source);
}

interface WellKnownMatch {
  type: "assets" | "sdk";
  name?: string;
  prefixDepth: number;
}

/**
 * Detect requests that target the well-known asset or SDK paths at any depth.
 * Returns the match plus how many path segments appear before `.well-known`.
 * A depth of 0 means the request is already at the canonical root path.
 */
function matchWellKnown(path: string): WellKnownMatch | null {
  const parts = path.split("/").filter(Boolean);
  const idx = parts.indexOf(".well-known");
  if (idx === -1) return null;
  const after = parts.slice(idx + 1);
  if (after[0] === "assets" && after.length >= 2) {
    return { type: "assets", name: after.slice(1).join("/"), prefixDepth: idx };
  }
  if (after[0] === "sdk" && after[1] === "sdk.js") {
    return { type: "sdk", prefixDepth: idx };
  }
  return null;
}

function canonicalWellKnownPath(match: WellKnownMatch): string {
  return match.type === "sdk"
    ? ".well-known/sdk/sdk.js"
    : `.well-known/assets/${match.name}`;
}

/**
 * Build a relative URL prefix that points back to the site root from `path`.
 * `/.well-known/assets/elements.js` served from `/` becomes
 * `./.well-known/assets/elements.js`; from `/articles/1` it becomes
 * `../../.well-known/assets/elements.js`.
 */
function relativeToRoot(path: string, target: string): string {
  const depth = path.split("/").filter(Boolean).length;
  const prefix = depth === 0 ? "./" : "../".repeat(depth);
  return prefix + target;
}

// ---------------------------------------------------------------------------
// Result wrapping — handlers return Repr directly (P3: no auto-wrapping)
// ---------------------------------------------------------------------------

function wrapResult(result: Repr | undefined | null): Repr {
  if (result === undefined || result === null) {
    return { content: null, meta: {} };
  }
  return result;
}

// ---------------------------------------------------------------------------
// Location header resolution
// ---------------------------------------------------------------------------

/**
 * Resolve a meta.location (URI reference relative to the resource)
 * into a URI reference relative to the request path.
 */
export function buildLocationHeader(
  location: string,
  resourcePath: string,
): string {
  if (/^https?:\/\//i.test(location)) return location;

  const baseUrl = `http://_placeholder${resourcePath.endsWith("/") ? resourcePath : resourcePath + "/"}`;
  let resolved: string;
  try {
    resolved = new URL(location, baseUrl).pathname;
  } catch {
    return location;
  }

  return makeRelativePath(resolved, resourcePath);
}

function makeRelativePath(target: string, base: string): string {
  const norm = (p: string): string[] => {
    if (p === "/") return [];
    return p.split("/").filter(Boolean);
  };

  const targetParts = norm(target);
  const baseParts = norm(base);

  let i = 0;
  while (
    i < targetParts.length &&
    i < baseParts.length &&
    targetParts[i] === baseParts[i]
  ) {
    i++;
  }

  const up = baseParts.length - i;
  const down = targetParts.slice(i);

  if (up === 0 && down.length === 0) return ".";
  const parts: string[] = [];
  for (let k = 0; k < up; k++) parts.push("..");
  parts.push(...down);
  return parts.join("/") || ".";
}

// ---------------------------------------------------------------------------
// Range header parsing
// ---------------------------------------------------------------------------

/**
 * Parse a Range header value into a RangeSpec.
 */
export function parseRangeHeader(
  headerValue: string,
  total: number | "*" = "*",
): RangeSpec | null {
  const eq = headerValue.indexOf("=");
  if (eq === -1) return null;
  const unit = headerValue.slice(0, eq).trim().toLowerCase();
  const rangesStr = headerValue.slice(eq + 1).trim();
  if (!unit || !rangesStr) return null;

  const rangeStrs = rangesStr
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const ranges: Range[] = [];
  for (const r of rangeStrs) {
    const dash = r.indexOf("-");
    if (dash === -1) return null;
    const startStr = r.slice(0, dash).trim();
    const endStr = r.slice(dash + 1).trim();
    const range: Range = {};
    if (startStr === "") {
      if (endStr === "") return null;
      const n = Number(endStr);
      if (!Number.isFinite(n) || n < 0) return null;
    } else {
      const s = Number(startStr);
      if (!Number.isFinite(s) || s < 0) return null;
      range.start = s;
      if (endStr !== "") {
        const e = Number(endStr);
        if (!Number.isFinite(e) || e < s) return null;
        range.end = e;
      }
    }
    ranges.push(range);
  }

  if (ranges.length === 0) return null;
  return { unit, ranges, total };
}

// ---------------------------------------------------------------------------
// Content-Range header construction
// ---------------------------------------------------------------------------

function buildContentRangeHeader(
  segments: Array<[number, unknown]>,
  unit: string,
  total: number | "*",
  sizeOf: (seg: unknown) => number,
): string {
  const parts = segments.map(([offset, content]) => {
    const size = sizeOf(content);
    return `${offset}-${offset + size - 1}`;
  });
  return `${unit} ${parts.join(",")}/${total}`;
}

// ---------------------------------------------------------------------------
// Partial body construction
// ---------------------------------------------------------------------------

function buildPartialBody(
  content: PartialContent,
  negotiatedContentType: string,
): { body: string; contentType: string } {
  if (content.data.length === 1) {
    const seg = content.data[0][1];
    if (typeof seg === "string") {
      return { body: seg, contentType: negotiatedContentType };
    }
    if (seg instanceof Uint8Array) {
      return {
        body: bytesToBinaryString(seg),
        contentType: negotiatedContentType,
      };
    }
    return {
      body: JSON.stringify(seg),
      contentType: negotiatedContentType,
    };
  }

  if (content.unit === "bytes") {
    return buildMultipartByteRanges(
      content.data as Array<[number, Uint8Array]>,
      negotiatedContentType,
    );
  }
  return {
    body: JSON.stringify(content),
    contentType: "application/json",
  };
}

function buildMultipartByteRanges(
  segments: Array<[number, Uint8Array]>,
  contentType: string,
): { body: string; contentType: string } {
  const boundary = `RIKKA_${randomHex(16)}`;
  const parts: string[] = [];
  for (const [offset, bytes] of segments) {
    parts.push(
      `--${boundary}\r\n` +
        `Content-Type: ${contentType}\r\n` +
        `Content-Range: bytes ${offset}-${offset + bytes.byteLength - 1}/*\r\n` +
        `\r\n` +
        bytesToBinaryString(bytes) +
        `\r\n`,
    );
  }
  parts.push(`--${boundary}--\r\n`);
  return {
    body: parts.join(""),
    contentType: `multipart/byteranges; boundary=${boundary}`,
  };
}

function bytesToBinaryString(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) {
    s += String.fromCharCode(bytes[i]!);
  }
  return s;
}

function randomHex(n: number): string {
  const chars = "0123456789abcdef";
  let out = "";
  for (let i = 0; i < n; i++) {
    out += chars[Math.floor(Math.random() * 16)];
  }
  return out;
}

function sizeOfSegment(seg: unknown): number {
  if (seg instanceof Uint8Array) return seg.byteLength;
  if (typeof seg === "string") return seg.length;
  if (Array.isArray(seg)) return seg.length;
  if (typeof seg === "object" && seg !== null) {
    return Object.keys(seg).length;
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Response builder
// ---------------------------------------------------------------------------

async function buildResponse(
  registry: TransformerRegistry,
  resource: Resource,
  repr: Repr,
  method: string,
  request: HttpRequest,
  range: RangeSpec | null,
  cors: CorsConfig | undefined,
  requestHeaders: Record<string, string>,
): Promise<HttpResponse> {
  const resourcePath = resource.path;
  const baseHeaders = (): Record<string, string> => {
    const h: Record<string, string> = {};
    if (cors) Object.assign(h, corsHeaders(cors, requestHeaders["origin"]));
    return h;
  };

  const hasRange = range !== null;
  const status = resource.inferStatus(repr, method, hasRange);

  // --- Case 1: content === null → redirect or no-content ---
  if (repr.content === null) {
    const headers = baseHeaders();
    if (repr.meta.location) {
      headers["Location"] = buildLocationHeader(
        repr.meta.location,
        resourcePath,
      );
    }
    return { status, headers, body: "" };
  }

  // --- Case 2: PartialContent → 206 with Content-Range ---
  if (isPartial(repr.content)) {
    const content = repr.content;
    const headers = baseHeaders();
    if (repr.meta.type) {
      headers["Content-Type"] = repr.meta.type;
    }
    const total = content.total ?? "*";
    headers["Content-Range"] = buildContentRangeHeader(
      content.data,
      content.unit,
      total,
      sizeOfSegment,
    );
    const { body, contentType } = buildPartialBody(
      content,
      repr.meta.type ?? "application/octet-stream",
    );
    headers["Content-Type"] = contentType;
    return { status, headers, body };
  }

  // --- Case 3: raw content (Uint8Array / string / ReadableStream) → pass through ---
  if (isBytes(repr.content)) {
    const headers = baseHeaders();
    if (repr.meta.type) {
      headers["Content-Type"] = repr.meta.type;
    }
    if (repr.meta.location) {
      headers["Location"] = buildLocationHeader(
        repr.meta.location,
        resourcePath,
      );
    }
    // Raw content passes through untouched — streams stay as streams,
    // Uint8Array stays as Uint8Array, strings stay as strings.
    return { status, headers, body: repr.content };
  }

  // --- Case 4: value → content negotiation + transformer pipeline ---
  const headers = baseHeaders();
  if (repr.meta.location) {
    headers["Location"] = buildLocationHeader(repr.meta.location, resourcePath);
  }
  if (repr.meta.type) {
    headers["Content-Type"] = repr.meta.type;
    let body: string | Uint8Array | ReadableStream<Uint8Array> = "";
    if (repr.content !== undefined) {
      const r = await registry.transformData(
        resource,
        resourcePath,
        repr.content,
        repr.meta.type,
      );
      body = r.body;
    }
    return { status, headers, body };
  }

  // Negotiate content type
  const negotiation = negotiate(registry, request.accept, request.acceptQuery);
  const body = await registry.transformData(
    resource,
    resourcePath,
    repr.content,
    negotiation.contentType,
  );
  headers["Content-Type"] = body.contentType;
  return { status, headers, body: body.body };
}

// ---------------------------------------------------------------------------
// Site construction helpers
// ---------------------------------------------------------------------------

/**
 * Apply trailing-slash resolution to a {@link Resource}.
 * If `hasTrailingSlash` is true and the resource has a "/" child, return
 * a new Resource pointing at that child (same params/path).
 */
function applyTrailingSlash(
  resolved: Resource,
  hasTrailingSlash: boolean,
): Resource {
  if (!hasTrailingSlash) return resolved;
  const slashResult = tryResolveTrailingSlash(
    resolved.kind,
    resolved.params,
    resolved.path,
  );
  return slashResult ?? resolved;
}

function walkSiteTree(
  node: SiteNode,
  remaining: string[],
  params: Record<string, string>,
  pathSoFar: string,
  hasTrailingSlash: boolean,
): Resource | null {
  if (isResourceKind(node)) {
    if (remaining.length === 0) {
      const path = pathSoFar.endsWith("/") ? pathSoFar.slice(0, -1) : pathSoFar;
      const resolved = node.createResource(params, path);
      return applyTrailingSlash(resolved, hasTrailingSlash);
    }
    return resolveResource(
      node,
      remaining.join("/"),
      pathSoFar.endsWith("/") ? pathSoFar : `${pathSoFar}/`,
      hasTrailingSlash,
    );
  }

  const record = node as Record<string, SiteNode>;

  if (remaining.length === 0) {
    return null;
  }

  const [next, ...rest] = remaining;

  if (next in record) {
    return walkSiteTree(
      record[next],
      rest,
      params,
      `${pathSoFar}/${next}`,
      hasTrailingSlash,
    );
  }

  for (const [key, child] of Object.entries(record)) {
    if (key.startsWith(":")) {
      const paramName = key.slice(1);
      const newParams = { ...params, [paramName]: next };
      return walkSiteTree(
        child,
        rest,
        newParams,
        `${pathSoFar}/${next}`,
        hasTrailingSlash,
      );
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Site class
// ---------------------------------------------------------------------------

/**
 * A Site is a compiled resource tree ready to serve HTTP requests.
 *
 * @example
 * ```ts
 * const app = new Site({ articles: Articles() });
 *
 * // Resolve a path to a resource
 * const resource = app.resolve("/articles/1");
 *
 * // Handle an HTTP request
 * const response = await app.handleRequest(request);
 *
 * // Register a custom transformer
 * app.register(csvTransformer);
 * ```
 */
export class Site {
  /** The original site definition */
  readonly definition: SiteDefinition;
  /** Site options */
  options: SiteOptions;
  /** Transformer registry for this site */
  readonly registry: TransformerRegistry;
  /** Sitemap entries for client-side routing */
  private _sitemap: SitemapEntry[];
  /** Registered custom elements */
  readonly customElements: CustomElementRegistryEntry[];
  /** Registered static assets */
  readonly assets: Record<string, SiteAsset>;
  /** Lazy cache for the bundled custom element entry */
  private _customElementBundle: Promise<{ code: string; type: string }> | null =
    null;

  constructor(definition: SiteDefinition, options?: SiteOptions) {
    this.definition = definition;
    this.options = options ?? {};

    // Build the custom element registry from options. Classes must expose a
    // static `tagName` (true for all defineElement() results).
    this.customElements = buildCustomElementRegistry(
      this.options.customElements,
    );
    this.assets = this.options.assets ?? {};

    // Auto-generate sitemap if not explicitly provided
    const sitemap = this.options.sitemap ?? generateSitemap(definition);

    this.registry = new TransformerRegistry([
      jsonTransformer,
      jsonldTransformer,
      csvTransformer,
      textTransformer,
      cborTransformer,
      // Use configured HTML transformer with SDK, sitemap, custom elements,
      // and static asset support. Only advertise custom elements to the
      // browser when an entry module is available to bundle.
      createHtmlTransformer({
        sitemap,
        customElements: this.options.customElementsEntry
          ? this.customElements
          : [],
        assets: this.assets,
      }),
    ]);

    // Register additional transformers from options
    if (options?.transformers) {
      for (const t of options.transformers) this.registry.register(t);
    }

    // Store sitemap for HTML transformer access
    this._sitemap = sitemap;
  }

  /**
   * Resolve a URL path to a {@link Resource}.
   * The returned `kind` is the shared instance; `params` and `path`
   * are the per-request state for this resolution.
   */
  resolve(path: string): Resource | null {
    const hasTrailingSlash = path.endsWith("/") && path.length > 1;
    const segments = path.split("/").filter(Boolean);

    // Root path "/" — check for "" key in definition
    if (segments.length === 0) {
      const rootNode = this.definition[""];
      if (rootNode && isResourceKind(rootNode)) {
        return applyTrailingSlash(
          rootNode.createResource({}, "/"),
          hasTrailingSlash,
        );
      }
      return null;
    }

    const [first, ...rest] = segments;
    const node = this.definition[first];

    if (!node) {
      return null;
    }

    if (isResourceKind(node)) {
      if (rest.length === 0) {
        return applyTrailingSlash(
          node.createResource({}, `/${first}`),
          hasTrailingSlash,
        );
      }
      return resolveResource(
        node,
        rest.join("/"),
        `/${first}/`,
        hasTrailingSlash,
      );
    }

    // It's a nested record — walk deeper
    return walkSiteTree(node, rest, {}, `/${first}`, hasTrailingSlash);
  }

  /**
   * Handle an HTTP request and return a response.
   */
  async handleRequest(request: HttpRequest): Promise<HttpResponse> {
    const method = request.method.toUpperCase();
    const requestHeaders = request.headers ?? {};
    const cors = this.options.cors;

    // CORS preflight
    if (method === "OPTIONS" && cors) {
      return {
        status: 204,
        headers: corsHeaders(cors, requestHeaders["origin"]),
        body: "",
      };
    }

    // Serve registered static assets, the custom element bundle, and the SDK
    // at the canonical `/.well-known/...` paths. If a request reaches us at a
    // non-canonical depth (e.g. `/articles/.well-known/assets/favicon.ico`),
    // redirect to the canonical relative path so caches see a single URL.
    const wellKnown = matchWellKnown(request.path);
    if (wellKnown) {
      if (wellKnown.prefixDepth > 0) {
        const location =
          "../".repeat(wellKnown.prefixDepth) +
          canonicalWellKnownPath(wellKnown);
        const headers: Record<string, string> = { Location: location };
        if (cors)
          Object.assign(headers, corsHeaders(cors, requestHeaders["origin"]));
        return { status: 301, headers, body: "" };
      }

      if (wellKnown.type === "sdk") {
        const sdkSource = this.options.sdkScript;
        if (sdkSource) {
          const headers: Record<string, string> = {
            "Content-Type": "application/javascript",
            "Cache-Control": "public, max-age=3600",
          };
          if (cors)
            Object.assign(headers, corsHeaders(cors, requestHeaders["origin"]));
          return { status: 200, headers, body: sdkSource };
        }
        const h: Record<string, string> = { "Content-Type": "text/plain" };
        if (cors) Object.assign(h, corsHeaders(cors, requestHeaders["origin"]));
        return { status: 404, headers: h, body: "Not Found" };
      }

      const name = wellKnown.name!;
      if (name === "elements.js" && this.options.customElementsEntry) {
        try {
          if (!this._customElementBundle) {
            this._customElementBundle = bundleCustomElements(
              this.options.customElementsEntry,
            );
          }
          const { code, type } = await this._customElementBundle;
          const headers: Record<string, string> = {
            "Content-Type": type,
            "Cache-Control": "public, max-age=0",
          };
          if (cors)
            Object.assign(headers, corsHeaders(cors, requestHeaders["origin"]));
          return { status: 200, headers, body: code };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          const headers: Record<string, string> = {
            "Content-Type": "text/plain",
          };
          if (cors)
            Object.assign(headers, corsHeaders(cors, requestHeaders["origin"]));
          return { status: 500, headers, body: message };
        }
      }

      const asset = this.assets[name];
      if (asset) {
        try {
          const nodeFs = await import("node:fs/promises");
          const filePath = await resolveAssetPath(asset.source);
          const content = await nodeFs.readFile(filePath);
          const headers: Record<string, string> = {
            "Content-Type": asset.contentType ?? inferContentType(name),
            "Cache-Control": "public, max-age=3600",
          };
          if (cors)
            Object.assign(headers, corsHeaders(cors, requestHeaders["origin"]));
          return { status: 200, headers, body: content };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          const headers: Record<string, string> = {
            "Content-Type": "text/plain",
          };
          if (cors)
            Object.assign(headers, corsHeaders(cors, requestHeaders["origin"]));
          return { status: 500, headers, body: message };
        }
      }

      const h: Record<string, string> = { "Content-Type": "text/plain" };
      if (cors) Object.assign(h, corsHeaders(cors, requestHeaders["origin"]));
      return { status: 404, headers: h, body: "Not Found" };
    }

    // 1. Resolve the resource
    const resolved = this.resolve(request.path);
    if (!resolved) {
      const h: Record<string, string> = { "Content-Type": "text/plain" };
      if (cors) Object.assign(h, corsHeaders(cors, requestHeaders["origin"]));
      return { status: 404, headers: h, body: "Not Found" };
    }

    // 2. Auth verification (before method check — auth may apply to all methods)
    const authResult = await this.verifyAuth(request.path, requestHeaders);
    if (authResult && "status" in authResult) {
      return authResult as HttpResponse;
    }

    // 3. Proxy fast path — duck typing, no instanceof
    if (resolved.proxy) {
      return this.handleProxy(resolved, request, cors, requestHeaders);
    }

    // 4. Check method is allowed
    if (!resolved.allowedMethods().includes(method.toUpperCase())) {
      const h: Record<string, string> = {
        "Content-Type": "text/plain",
        Allow: resolved.allowedMethods().join(", "),
      };
      if (cors) Object.assign(h, corsHeaders(cors, requestHeaders["origin"]));
      return { status: 405, headers: h, body: "Method Not Allowed" };
    }

    // 5. Execute the operation — polymorphic dispatch via HTTP method
    try {
      const query: Record<string, string> = {};
      if (request.query) {
        for (const [k, v] of Object.entries(request.query)) {
          query[k] = String(v);
        }
      }

      let range: RangeSpec | undefined;
      const rangeHeader = getHeader(requestHeaders, "range");
      if (rangeHeader) {
        const parsed = parseRangeHeader(rangeHeader);
        if (parsed) range = parsed;
      }

      const ctx = createRequestContext({
        method,
        path: request.path,
        resourcePath: resolved.path,
        params: resolved.params,
        query,
        headers: requestHeaders,
        body: request.body,
        identity: authResult as Identity | undefined,
        range,
      });

      const methodLower = method.toLowerCase() as
        | "get"
        | "post"
        | "put"
        | "patch"
        | "delete";
      const result = await resolved[methodLower](ctx);

      // 6. Result is already a Repr
      const repr = wrapResult(result);

      // 7. Build HTTP response
      return buildResponse(
        this.registry,
        resolved,
        repr,
        method,
        request,
        range ?? null,
        cors,
        requestHeaders,
      );
    } catch (error) {
      if (isHttpError(error)) {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...error.headers,
        };
        if (cors)
          Object.assign(headers, corsHeaders(cors, requestHeaders["origin"]));
        return {
          status: error.status,
          headers,
          body: JSON.stringify({
            error: error.message,
            ...(error.detail !== undefined ? { detail: error.detail } : {}),
          }),
        };
      }
      const errHeaders: Record<string, string> = {
        "Content-Type": "text/plain",
      };
      if (cors)
        Object.assign(errHeaders, corsHeaders(cors, requestHeaders["origin"]));
      return {
        status: 500,
        headers: errHeaders,
        body: error instanceof Error ? error.message : "Internal Server Error",
      };
    }
  }

  /**
   * Register a transformer on this site's registry.
   */
  register(transformer: Transformer): void {
    this.registry.register(transformer);
  }

  /**
   * Get the sitemap entries for this site.
   */
  getSitemap(): SitemapEntry[] {
    return this._sitemap;
  }

  // --- Private helpers ---

  private async verifyAuth(
    requestPath: string,
    requestHeaders: Record<string, string>,
  ): Promise<Identity | HttpResponse | null> {
    const authConfig = this.options.auth;
    if (!authConfig) return null;

    const authResource = matchAuthRule(requestPath, authConfig.rules);
    if (authResource === null || authResource === undefined) return null;

    const verifierName = authResource || authConfig.verifier;
    const authResolved = this.resolve(`/${verifierName}`);
    // Duck typing — Action resources expose invoke()
    if (!authResolved || !authResolved.invoke) {
      return {
        status: 500,
        headers: { "Content-Type": "text/plain" },
        body: `Auth resource "${verifierName}" not found or not an Action`,
      };
    }

    const authCtx = createRequestContext({
      method: "POST",
      path: `/${verifierName}`,
      headers: requestHeaders,
    });

    try {
      const result = await authResolved.invoke(authCtx);
      const wrapped = wrapResult(result);

      if (wrapped.content === null && !wrapped.meta.location) {
        return {
          status: 401,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Unauthorized" }),
        };
      }

      return wrapped.content as Identity;
    } catch (err) {
      if (isHttpError(err)) {
        return {
          status: err.status,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            error: err.message,
            ...(err.detail !== undefined ? { detail: err.detail } : {}),
          }),
        };
      }
      return {
        status: 401,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Unauthorized" }),
      };
    }
  }

  private async handleProxy(
    resource: Resource,
    request: HttpRequest,
    cors: CorsConfig | undefined,
    requestHeaders: Record<string, string>,
  ): Promise<HttpResponse> {
    if (typeof resource.proxy !== "function") {
      return {
        status: 501,
        headers: { "Content-Type": "text/plain" },
        body: "Proxy target not configured",
      };
    }

    let targetUrl: string;
    try {
      const result = await resource.proxy(request.path);
      targetUrl = result.toString();
    } catch {
      return {
        status: 502,
        headers: { "Content-Type": "text/plain" },
        body: "Upstream unreachable",
      };
    }

    // Pass the request body stream through to the upstream untouched.
    // The Web Fetch API accepts ReadableStream<Uint8Array> as a body.
    // `duplex: "half"` is required for streaming bodies in Node 18+.
    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers: requestHeaders,
      body: request.body,
      duplex: "half",
    } as RequestInit);

    const responseHeaders: Record<string, string> = {};
    for (const [key, value] of upstream.headers) {
      if (!["transfer-encoding", "connection", "keep-alive"].includes(key)) {
        responseHeaders[key] = value;
      }
    }

    if (cors) {
      Object.assign(
        responseHeaders,
        corsHeaders(cors, requestHeaders["origin"]),
      );
    }

    // Stream the upstream response body through untouched.
    return {
      status: upstream.status,
      headers: responseHeaders,
      body: upstream.body ?? "",
    };
  }
}
