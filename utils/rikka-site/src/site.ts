/**
 * @module site
 * Site — the declarative resource tree with request handling.
 *
 * The tree stores **ResourceKind** instances (templates). Per-request,
 * `kind.resolve(params, path)` creates a {@link Resource} carrying
 * `params` and `path` alongside the handler methods.
 *
 * Also contains the full request-handling pipeline (handleRequest)
 * and all supporting helpers (auth verification,
 * status inference, range parsing, response building, etc.).
 */

import { resolveResource, isResourceKind } from "./resource.js";
import type { ResourceKind, Resource, ChildrenMap } from "./resource.js";
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
  directoryListingHtmlTransformer,
  webdavMultistatusTransformer,
  webdavLockTransformer,
} from "./transform.js";
import type { Transformer } from "./transform.js";
import { negotiate, isTypeAccepted } from "./negotiate.js";
import {
  isPartial,
  isBytes,
  isHttpError,
  HttpError,
  guessMimeType,
  type Repr,
  type ReprMeta,
  type PartialContent,
} from "./representation.js";
import type { RequestContext, Identity, RangeSpec, Range } from "./context.js";
import { getHeader, createRequestContext } from "./context.js";
import type { HttpRequest, HttpResponse } from "./server.js";
import type { SitemapEntry } from "./sitemap.js";
import { generateSitemap } from "./sitemap.js";
import type { IncomingMessage, ServerResponse } from "node:http";
import type {
  Http2ServerRequest,
  Http2ServerResponse,
  SecureServerOptions,
} from "node:http2";
import type { CustomElementConstructor } from "./resource.js";
import {
  buildCustomElementRegistry,
  bundleCustomElements,
  type CustomElementRegistryEntry,
} from "./custom-elements.js";
import {
  bundleServiceWorker,
  generateDefaultServiceWorker,
  type ServiceWorkerOptions,
} from "./service-worker.js";

// ---------------------------------------------------------------------------
// Site types
// ---------------------------------------------------------------------------

/**
 * A site node is either a ResourceKind instance (a mounted resource template)
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
 * Per-request options passed to {@link Site.handleRequest}.
 *
 * Currently only carries the {@link onEarlyHints} callback used by adapters
 * to emit HTTP `103 Early Hints` interim responses (see
 * {@link Resource.earlyHints}).
 */
export interface HandleRequestOptions {
  /**
   * Called when a resource's `earlyHints()` method returns a non-empty
   * headers map, BEFORE the slow resource method completes.
   *
   * Adapters implement this to write an interim `103 Early Hints` response
   * (HTTP/2 / HTTP/3) or to stash the hints for merging into the final
   * response's headers (HTTP/1.1 fallback, Edge/Fetch).
   *
   * The framework only invokes this for `GET` and `HEAD` requests, and only
   * when `Resource.earlyHints` is defined and returns a non-empty record.
   *
   * May return a Promise if the adapter needs to flush before the framework
   * continues — the framework awaits it before dispatching to the resource
   * method.
   */
  onEarlyHints?(hints: Record<string, string | string[]>): void | Promise<void>;
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
  /**
   * Service Worker script served at `/.well-known/service-worker.js`.
   *
   * Enabled by default — when omitted, the built-in default SW template is
   * served (caches `.well-known/sdk/sdk.js`, `.well-known/assets/elements.js`,
   * and `assets/*` via stale-while-revalidate). Set to `false` to disable
   * (e.g. during development).
   *
   * The response carries `Service-Worker-Allowed: ..` so the SDK can register
   * it to the rikka-site mount root without anyone knowing the absolute mount
   * path. The script itself contains no rikka-site code — only standard SW
   * APIs (Cache API, fetch, event handlers).
   *
   * Provide `source` for a custom entry module (bundled with esbuild), or
   * `config` to customize the built-in default SW template.
   */
  serviceWorker?: ServiceWorkerOptions | false;
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
  type: "assets" | "sdk" | "service-worker";
  name?: string;
  prefixDepth: number;
}

/**
 * Detect requests that target the well-known asset, SDK, or service-worker
 * paths at any depth. Returns the match plus how many path segments appear
 * before `.well-known`. A depth of 0 means the request is already at the
 * canonical root path.
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
  if (after[0] === "service-worker.js") {
    return { type: "service-worker", prefixDepth: idx };
  }
  return null;
}

function canonicalWellKnownPath(match: WellKnownMatch): string {
  if (match.type === "sdk") return ".well-known/sdk/sdk.js";
  if (match.type === "service-worker") return ".well-known/service-worker.js";
  return `.well-known/assets/${match.name}`;
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
// CORS application — unified at the handleRequest exit
// ---------------------------------------------------------------------------

/**
 * Merge CORS headers into an existing HttpResponse.
 * Returns the response unchanged when CORS is disabled or no Origin header.
 */
function applyCorsToResponse(
  response: HttpResponse,
  cors: CorsConfig | undefined,
  origin: string | undefined,
): HttpResponse {
  if (!cors) return response;
  const corsH = corsHeaders(cors, origin);
  if (Object.keys(corsH).length === 0) return response;
  return {
    ...response,
    headers: { ...response.headers, ...corsH },
  };
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
  return new TextDecoder("latin1").decode(bytes);
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

/**
 * Merge `meta.headers` (the passthrough header map) into a response headers
 * record, and write `Content-Language` from `meta.lang`. Called from each
 * branch of {@link buildResponse}.
 */
function mergeMetaHeaders(
  headers: Record<string, string>,
  meta: ReprMeta,
): void {
  if (meta.lang) {
    headers["Content-Language"] = meta.lang;
  }
  if (meta.headers) {
    for (const [key, value] of Object.entries(meta.headers)) {
      headers[key] = value;
    }
  }
}

/**
 * Resolve the target content type for a response.
 *
 * Resolution order:
 * 1. `?accept` query parameter — explicit override, always honored first.
 *    If invalid, falls back to Accept header negotiation.
 * 2. If the repr's own type is in the Accept list → provide as-is (no transformer).
 * 3. Otherwise → negotiate a matching conversion.
 * 4. If no match → provide as-is (repr's own type).
 */
function resolveTargetType(
  registry: TransformerRegistry,
  request: HttpRequest,
  reprType: string,
): string {
  if (request.acceptQuery) {
    return negotiate(registry, request.accept, request.acceptQuery) ?? reprType;
  }
  if (isTypeAccepted(request.accept, reprType)) {
    return reprType;
  }
  return negotiate(registry, request.accept) ?? reprType;
}

async function buildResponse(
  registry: TransformerRegistry,
  resource: Resource,
  repr: Repr,
  method: string,
  request: HttpRequest,
  range: RangeSpec | null,
): Promise<HttpResponse> {
  const resourcePath = resource.path;

  const hasRange = range !== null;
  const status = resource.inferStatus(repr, method, hasRange);

  // --- Empty-body responses ---
  // redirect / no-content always have an empty body (their smart
  // constructors enforce content === null). created has an empty body
  // only when content is null. The bare `content === null` clause is
  // the backward-compat shape inference for Reprs constructed without
  // a kind — it subsumes `created + null` and the kindless null case.
  if (
    repr.meta.kind === "redirect" ||
    repr.meta.kind === "no-content" ||
    repr.content === null
  ) {
    const headers: Record<string, string> = {};
    if (repr.meta.location) {
      headers["Location"] = buildLocationHeader(
        repr.meta.location,
        resourcePath,
      );
    }
    mergeMetaHeaders(headers, repr.meta);
    return { status, headers, body: "" };
  }

  // --- Case 2: PartialContent → 206 with Content-Range ---
  if (isPartial(repr.content)) {
    const content = repr.content;
    const headers: Record<string, string> = {};
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
    mergeMetaHeaders(headers, repr.meta);
    return { status, headers, body };
  }

  // --- Case 3: raw content → transform pipeline (Raw→Raw transformers) ---
  if (isBytes(repr.content)) {
    const headers: Record<string, string> = {};
    if (repr.meta.location) {
      headers["Location"] = buildLocationHeader(
        repr.meta.location,
        resourcePath,
      );
    }
    // Determine the repr's type: explicit > path-guessed
    const reprType = repr.meta.type ?? guessMimeType(resourcePath);
    const targetContentType = resolveTargetType(registry, request, reprType);
    // Run through the pipeline. meta.type carries the source MIME so
    // Raw→Raw transformers can match; targetContentType is the goal.
    const result = await registry.transform(
      resource,
      resourcePath,
      {
        content: repr.content,
        meta: { ...repr.meta, type: reprType },
      },
      targetContentType,
    );
    headers["Content-Type"] = result.contentType;
    mergeMetaHeaders(headers, repr.meta);
    return { status, headers, body: result.body };
  }

  // --- Case 4: value (internal representation) → serialization ---
  // For Value content, the default type is application/json — the natural
  // serialization for structured data. text/html has no special status.
  const headers: Record<string, string> = {};
  if (repr.meta.location) {
    headers["Location"] = buildLocationHeader(repr.meta.location, resourcePath);
  }
  const reprType = repr.meta.type ?? "application/json";
  const targetType = resolveTargetType(registry, request, reprType);
  headers["Content-Type"] = targetType;
  let body: string | Uint8Array | ReadableStream<Uint8Array> = "";
  if (repr.content !== undefined) {
    const r = await registry.transformData(
      resource,
      resourcePath,
      repr.content,
      targetType,
    );
    body = r.body;
  }
  mergeMetaHeaders(headers, repr.meta);
  return { status, headers, body };
}

// ---------------------------------------------------------------------------
// Node.js adapter — listen options, helpers, and types
// ---------------------------------------------------------------------------
//
// Everything below bridges rikka-site's platform-agnostic HttpRequest /
// HttpResponse to Node's IncomingMessage / ServerResponse. The helper
// functions use `import type` for Node types (erased at compile time) and
// receive Node objects as parameters — no runtime dependency on `node:http`.
// The only runtime import of `node:http` happens inside `Site.listen()` via
// dynamic `import("node:http")`, so bundlers for edge runtimes (Cloudflare
// Workers, Deno Deploy) never pull it in.

/**
 * Request type accepted by the Node adapter — either a classic HTTP/1.1
 * `IncomingMessage` or an HTTP/2 `Http2ServerRequest` (compat mode).
 */
export type NodeRequest = IncomingMessage | Http2ServerRequest;

/**
 * Response type accepted by the Node adapter — `ServerResponse` for HTTP/1.1,
 * `Http2ServerResponse` for HTTP/2.
 */
export type NodeResponse = ServerResponse | Http2ServerResponse;

/**
 * Options for {@link Site.listen}.
 */
export interface ListenOptions {
  /**
   * Port to listen on. Pass `0` to let the OS pick a free port — read it
   * back via the returned `server.port`.
   * @default 3000
   *
   * Ignored when {@link listen} is provided.
   */
  port?: number;
  /**
   * Hostname to bind to. Use `"0.0.0.0"` to listen on all interfaces.
   * @default "127.0.0.1"
   *
   * Ignored when {@link listen} is provided.
   */
  host?: string;
  /**
   * Listen target — supersedes {@link port} / {@link host} when provided.
   *
   * - `{ port, host? }` — TCP (same as `port` / `host` but explicit)
   * - `{ path }` — Unix domain socket (Linux/macOS) or named pipe
   *   (Windows). Path is passed verbatim to `server.listen(path)`.
   *
   * @example { path: "/run/rikka.sock" }
   * @example { port: 3000, host: "0.0.0.0" }
   */
  listen?: { port: number; host?: string } | { path: string };
  /**
   * TLS options. When provided, `listen()` switches from `http.createServer`
   * (HTTP/1.1 plaintext) to `http2.createSecureServer({ ...tls, allowHTTP1:
   * true })` — HTTP/2 over TLS with ALPN `h2` / `http/1.1` negotiation.
   *
   * Browsers require TLS for HTTP/2, so providing this option is the way to
   * enable H2 in production. HTTP/1.1 clients still work via ALPN fallback.
   *
   * The adapter wires `Resource.earlyHints()` through to a real HTTP `103
   * Early Hints` interim HEADERS frame on H2 streams (no equivalent on H1 —
   * hints are merged into the final `Link` header there).
   *
   * @example { key: fs.readFileSync("key.pem"), cert: fs.readFileSync("cert.pem") }
   */
  tls?: SecureServerOptions;
  /**
   * Base path prefix stripped from `req.url` before dispatch — useful when
   * the app is mounted behind a reverse proxy.
   * @example "/api"
   */
  basePath?: string;
  /**
   * SDK script source to serve at `/.well-known/sdk/sdk.js`.
   * When not provided, the adapter attempts to load it via the
   * `@takanashi/rikka-site/sdk` package export. Set to `false` to disable
   * SDK serving.
   */
  sdkScript?: string | false;
  /**
   * Called at the start of each request. If it returns an `HttpResponse`,
   * that response is sent immediately and the request never reaches the
   * Site. Useful for dev-only static file fallbacks.
   */
  before?(
    req: NodeRequest,
    res: NodeResponse,
  ):
    | HttpResponse
    | undefined
    | void
    | Promise<HttpResponse | undefined | void>;
  /**
   * Post-process the response generated by the Site before it is written
   * back to the client. Useful for HTML enhancement or logging.
   */
  after?(
    response: HttpResponse,
    req: NodeRequest,
  ): HttpResponse | Promise<HttpResponse>;
  /**
   * Called for every incoming request, before `before` and the Site handler.
   * Useful for request logging.
   */
  onRequest?(req: NodeRequest): void;
  /**
   * Called once the server is listening. Receives the actual bound port and
   * host. For Unix socket / named pipe listeners, port is `0` and host is
   * the socket path.
   */
  onListen?(port: number, host: string): void;
}

/**
 * A listening HTTP server returned by {@link Site.listen}.
 */
export interface ListeningServer {
  /**
   * Actual port (post-bind). May differ from `options.port` when `0` was
   * used. `0` for Unix socket / named pipe listeners — check `path`.
   */
  port: number;
  /**
   * Bound hostname (TCP) or socket path (Unix socket / named pipe). For
   * Unix socket listeners, `host` carries the path and `port` is `0`.
   */
  host: string;
  /**
   * Unix socket / named pipe path, `undefined` for TCP listeners.
   */
  path?: string;
  /** Stop accepting new connections; resolve when existing ones close. */
  close(): Promise<void>;
  /**
   * The underlying Node server — `http.Server` (H1 plaintext default) or
   * `http2.Http2SecureServer` (H2 over TLS).
   */
  readonly server: unknown;
  /** Resolves once the server is actually listening. */
  ready: Promise<void>;
}

// --- Node adapter helpers (no runtime node:http dependency) ---

function isHttpResponseValue(value: unknown): value is HttpResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "headers" in value &&
    "body" in value
  );
}

/**
 * Type guard: `true` when `res` is an HTTP/2 response (has the underlying
 * `stream` with `respond()`). Used to decide whether to emit a real interim
 * `103` HEADERS frame (H2) or fall back to merging hints into the final
 * `Link` header (H1).
 */
function isHttp2Response(res: NodeResponse): res is Http2ServerResponse {
  return (
    "stream" in res &&
    typeof (res as { stream?: { respond?: unknown } }).stream?.respond ===
      "function"
  );
}

/**
 * Emit a `103 Early Hints` interim HEADERS frame on an HTTP/2 stream.
 *
 * Uses `stream.additionalHeaders()` (not `stream.respond()`) because Node's
 * `respond()` rejects 1xx status codes — only `additionalHeaders()` may send
 * informational (1xx) HEADERS frames.
 */
function writeEarlyHintsH2(
  res: Http2ServerResponse,
  hints: Record<string, string | string[]>,
): void {
  const headers: Record<string, string> = { ":status": "103" };
  for (const [k, v] of Object.entries(hints)) {
    headers[k.toLowerCase()] = Array.isArray(v) ? v.join(", ") : v;
  }
  res.stream.additionalHeaders(headers);
}

/**
 * HTTP/1.1 fallback for Early Hints — there is no interim 1xx response
 * support in Node's `http.ServerResponse`, so we merge the `Link` header
 * values from all hint batches into the final response's `Link` header.
 */
function mergeHintsIntoResponse(
  response: HttpResponse,
  hintsList: Record<string, string | string[]>[],
): HttpResponse {
  const linkValues: string[] = [];
  for (const hints of hintsList) {
    for (const [k, v] of Object.entries(hints)) {
      if (k.toLowerCase() === "link") {
        if (Array.isArray(v)) linkValues.push(...v);
        else linkValues.push(v);
      }
    }
  }
  if (linkValues.length === 0) return response;

  const headers: Record<string, string> = { ...response.headers };
  let existingLink: string | undefined;
  for (const k of Object.keys(headers)) {
    if (k.toLowerCase() === "link") {
      existingLink = headers[k];
      delete headers[k];
    }
  }
  const merged = existingLink
    ? `${existingLink}, ${linkValues.join(", ")}`
    : linkValues.join(", ");
  headers["link"] = merged;
  return { ...response, headers };
}

function parseNodeUrl(
  rawUrl: string,
  hostHeader: string | string[] | undefined,
): URL {
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;
  if (/^https?:\/\//i.test(rawUrl)) return new URL(rawUrl);
  return new URL(rawUrl, `http://${host ?? "localhost"}`);
}

function stripBasePath(pathname: string, basePath: string): string {
  if (!basePath) return pathname;
  if (pathname === basePath) return "/";
  if (pathname.startsWith(basePath + "/")) return pathname.slice(basePath.length);
  return pathname;
}

function collectNodeHeaders(
  raw: NodeJS.Dict<string | string[] | undefined>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined) continue;
    out[key.toLowerCase()] = Array.isArray(value) ? value.join(", ") : value;
  }
  return out;
}

function collectNodeQuery(url: URL): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of url.searchParams.entries()) {
    if (key !== "accept") out[key] = value;
  }
  return out;
}

/**
 * Convert a Node.js request (H1 `IncomingMessage` or H2 `Http2ServerRequest`)
 * into a Web `ReadableStream<Uint8Array>`.
 *
 * Returns `undefined` for GET/HEAD requests (no body). The stream is
 * lazily consumed — if the handler never calls `ctx.json()` / `ctx.text()`
 * / `ctx.bytes()`, the request body is never read.
 */
function readNodeBodyStream(
  req: NodeRequest,
  method: string,
): ReadableStream<Uint8Array> | undefined {
  if (method === "GET" || method === "HEAD") return undefined;

  return new ReadableStream<Uint8Array>({
    start(controller) {
      req.on("data", (chunk: Buffer | string) => {
        const bytes =
          typeof chunk === "string"
            ? new TextEncoder().encode(chunk)
            : new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength);
        controller.enqueue(bytes);
      });
      req.on("end", () => controller.close());
      req.on("error", (err) => controller.error(err));
    },
  });
}

/**
 * Structural view of the `ServerResponse` / `Http2ServerResponse` common
 * API surface used by {@link writeNodeResponse}.
 */
type WritableNodeResponse = {
  statusCode: number;
  setHeader(name: string, value: string | number | string[]): unknown;
  write(chunk: Uint8Array | string): boolean;
  end(chunk?: Uint8Array | string): unknown;
  headersSent: boolean;
};

/**
 * Write an {@link HttpResponse} to a Node.js response (H1 `ServerResponse` or
 * H2 `Http2ServerResponse`).
 */
function writeNodeResponse(
  res: NodeResponse,
  response: HttpResponse,
): void {
  const r = res as unknown as WritableNodeResponse;
  r.statusCode = response.status;
  for (const [key, value] of Object.entries(response.headers)) {
    r.setHeader(key, value);
  }

  const body = response.body;

  if (typeof body === "string" || body instanceof Uint8Array) {
    r.end(body);
    return;
  }

  // Stream — pump with backpressure and client-disconnect handling
  const reader = body.getReader();
  let aborted = false;

  const cleanup = (): void => {
    if (!aborted) {
      aborted = true;
      reader.cancel().catch(() => {});
    }
  };

  res.on("close", cleanup);

  const pump = (): void => {
    if (aborted) return;
    reader
      .read()
      .then(({ done, value }) => {
        if (aborted) return;
        if (done) {
          res.off("close", cleanup);
          r.end();
          return;
        }
        if (value) {
          const ok = r.write(value);
          if (!ok) {
            res.once("drain", pump);
          } else {
            pump();
          }
        } else {
          pump();
        }
      })
      .catch((err) => {
        res.off("close", cleanup);
        if (!r.headersSent) {
          r.statusCode = 500;
        }
        r.end(err instanceof Error ? err.message : "Stream error");
      });
  };
  pump();
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
  /** Lazy cache for the bundled or generated service worker script */
  private _serviceWorkerScript: Promise<{ code: string; type: string }> | null =
    null;
  /** Lazy cache for the auto-loaded SDK bundle (Node adapter only). */
  private _sdkBundle: string | null | undefined = undefined;

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
      directoryListingHtmlTransformer,
      webdavMultistatusTransformer,
      webdavLockTransformer,
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
   * Resolve a URL path to a per-request {@link Resource}.
   *
   * Trailing slash is encoded in `remaining` as a trailing `""`:
   *   `/docs/` → `["docs", ""]`,  `/docs` → `["docs"]`
   *
   * `resource.path` is set to the request path (they are always equal).
   */
  resolve(path: string): Resource | null {
    // Root path — look up "" key in definition
    if (path === "/" || path === "") {
      const rootNode = this.definition[""];
      if (rootNode && isResourceKind(rootNode)) {
        return resolveResource(rootNode, [], "/");
      }
      return null;
    }

    // Non-root: split keeping trailing "" for trailing slash detection.
    // "/docs".split("/").slice(1) → ["docs"]
    // "/docs/".split("/").slice(1) → ["docs", ""]
    // Filter out empty segments from double slashes (//), but preserve a
    // trailing "" (which encodes a trailing slash).
    const raw = path.split("/").slice(1);
    const remaining = raw.filter((s, i) => s !== "" || i === raw.length - 1);
    return resolveResource(
      this.definition as unknown as ChildrenMap,
      remaining,
      path,
    );
  }

  /**
   * Handle an HTTP request and return a response.
   *
   * CORS headers are applied uniformly to every response at the exit,
   * so individual branches and helpers do not need to inject them.
   *
   * @param request - The HTTP request to handle.
   * @param options - Per-request options. Currently carries `onEarlyHints`,
   *   invoked for `GET`/`HEAD` when the resolved resource defines
   *   {@link Resource.earlyHints} and returns a non-empty headers map.
   *   Adapters use this to emit an HTTP `103 Early Hints` interim response
   *   (or merge into the final response on protocols without interim
   *   support).
   */
  async handleRequest(
    request: HttpRequest,
    options?: HandleRequestOptions,
  ): Promise<HttpResponse> {
    const response = await this.handleRequestInner(request, options);
    const cors = this.options.cors;
    if (!cors) return response;
    const origin = (request.headers ?? {})["origin"];
    return applyCorsToResponse(response, cors, origin);
  }

  private async handleRequestInner(
    request: HttpRequest,
    options?: HandleRequestOptions,
  ): Promise<HttpResponse> {
    const method = request.method.toUpperCase();
    const requestHeaders = request.headers ?? {};
    const cors = this.options.cors;

    // CORS preflight — only short-circuit actual preflight requests
    // (identified by Access-Control-Request-Method header, per CORS spec)
    if (method === "OPTIONS" && cors && getHeader(requestHeaders, "access-control-request-method")) {
      return {
        status: 204,
        headers: {},
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
        return { status: 301, headers: { Location: location }, body: "" };
      }

      if (wellKnown.type === "sdk") {
        const sdkSource = this.options.sdkScript;
        if (sdkSource) {
          return {
            status: 200,
            headers: {
              "Content-Type": "application/javascript",
              "Cache-Control": "public, max-age=3600",
            },
            body: sdkSource,
          };
        }
        return {
          status: 404,
          headers: { "Content-Type": "text/plain" },
          body: "Not Found",
        };
      }

      if (wellKnown.type === "service-worker") {
        const swOpts = this.options.serviceWorker;
        if (swOpts === false) {
          return {
            status: 404,
            headers: { "Content-Type": "text/plain" },
            body: "Not Found",
          };
        }
        try {
          if (!this._serviceWorkerScript) {
            this._serviceWorkerScript = swOpts?.source
              ? bundleServiceWorker(swOpts.source)
              : generateDefaultServiceWorker(swOpts?.config ?? {});
          }
          const { code, type } = await this._serviceWorkerScript;
          return {
            status: 200,
            headers: {
              "Content-Type": type,
              // `..` is resolved relative to the response URL by the browser,
              // so it lands on the rikka-site mount root without anyone
              // knowing the absolute mount path.
              "Service-Worker-Allowed": "..",
              // SW update detection byte-compares the script on every navigation;
              // no-cache lets the browser revalidate rather than serve stale.
              "Cache-Control": "no-cache",
            },
            body: code,
          };
        } catch (err) {
          this._serviceWorkerScript = null;
          const message = err instanceof Error ? err.message : String(err);
          return {
            status: 500,
            headers: { "Content-Type": "text/plain" },
            body: message,
          };
        }
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
          return {
            status: 200,
            headers: {
              "Content-Type": type,
              "Cache-Control": "public, max-age=0",
            },
            body: code,
          };
        } catch (err) {
          this._customElementBundle = null;
          const message = err instanceof Error ? err.message : String(err);
          return {
            status: 500,
            headers: { "Content-Type": "text/plain" },
            body: message,
          };
        }
      }

      const asset = this.assets[name];
      if (asset) {
        try {
          const nodeFs = await import("node:fs/promises");
          const filePath = await resolveAssetPath(asset.source);
          const content = await nodeFs.readFile(filePath);
          return {
            status: 200,
            headers: {
              "Content-Type": asset.contentType ?? inferContentType(name),
              "Cache-Control": "public, max-age=3600",
            },
            body: content,
          };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return {
            status: 500,
            headers: { "Content-Type": "text/plain" },
            body: message,
          };
        }
      }

      return {
        status: 404,
        headers: { "Content-Type": "text/plain" },
        body: "Not Found",
      };
    }

    // 1. Resolve the resource
    const resolved = this.resolve(request.path);
    if (!resolved) {
      return {
        status: 404,
        headers: { "Content-Type": "text/plain" },
        body: "Not Found",
      };
    }

    // 2. Auth verification (before method check — auth may apply to all methods)
    const authResult = await this.verifyAuth(
      request.path,
      method,
      requestHeaders,
      request.body,
    );
    if (authResult && "status" in authResult) {
      return authResult as HttpResponse;
    }

    // 3. Check method is allowed
    if (!resolved.allowedMethods().includes(method.toUpperCase())) {
      return {
        status: 405,
        headers: {
          "Content-Type": "text/plain",
          Allow: resolved.allowedMethods().join(", "),
        },
        body: "Method Not Allowed",
      };
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
        identity: authResult ?? undefined,
        range,
      });

      // Early Hints (HTTP 103) — emit BEFORE the slow resource method runs.
      // Only fires for GET/HEAD (navigation requests) and only when both the
      // resource defines `earlyHints()` and the adapter supplied `onEarlyHints`.
      // The resource's `earlyHints()` must be fast (sync or quick cache lookup);
      // if it throws, the surrounding try/catch turns it into a 500.
      if (
        options?.onEarlyHints &&
        (method === "GET" || method === "HEAD") &&
        typeof resolved.earlyHints === "function"
      ) {
        const hints = await resolved.earlyHints(ctx);
        if (hints && Object.keys(hints).length > 0) {
          await options.onEarlyHints(hints);
        }
      }

      // Dispatch to the named method on the Resource instance.
      // All IANA HTTP methods exist as named methods on Resource.prototype;
      // unsupported ones throw 405 automatically. Any method not found on the
      // prototype chain (non-IANA or custom) also returns 405 with Allow.
      const methodLower = method.toLowerCase();
      const handler = (
        resolved as unknown as Record<
          string,
          (ctx: RequestContext) => Repr | Promise<Repr>
        >
      )[methodLower];
      if (typeof handler !== "function") {
        throw new HttpError(405, "Method Not Allowed", undefined, {
          Allow: resolved.allowedMethods().join(", "),
        });
      }
      const result = await handler.call(resolved, ctx);

      // 6. Result is already a Repr
      const repr = wrapResult(result);

      // 7. Build HTTP response
      const response = await buildResponse(
        this.registry,
        resolved,
        repr,
        method,
        request,
        range ?? null,
      );
      // HEAD: strip body, preserve headers and status (RFC 9110 §9.3.2)
      if (method.toUpperCase() === "HEAD") {
        return { ...response, body: "" };
      }
      return response;
    } catch (error) {
      if (isHttpError(error)) {
        return {
          status: error.status,
          headers: {
            "Content-Type": "application/json",
            ...error.headers,
          },
          body: JSON.stringify({
            error: error.message,
            ...(error.detail !== undefined ? { detail: error.detail } : {}),
          }),
        };
      }
      return {
        status: 500,
        headers: { "Content-Type": "text/plain" },
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

  /**
   * Start a Node.js HTTP server and listen for connections.
   *
   * Server type is chosen by options:
   * - No `tls` — `http.createServer`, HTTP/1.1 plaintext (default).
   * - `tls: { ... }` — `http2.createSecureServer({ ...tls, allowHTTP1: true })`,
   *   HTTP/2 over TLS with HTTP/1.1 ALPN fallback.
   *
   * Listen target is chosen by `listen` (preferred) or `port` / `host`:
   * - `listen: { path }` — Unix socket (Linux/macOS) or named pipe (Windows).
   * - `listen: { port, host? }` — TCP, supersedes `port` / `host`.
   * - `port` / `host` only — TCP (default).
   *
   * The `checkContinue` event is wired to intercept `Expect: 100-continue`
   * on QUERY requests. When the resolved resource advertises
   * `supportedQueryTypes()` and the request's `Content-Type` is not among
   * them, a `415 Unsupported Query Type` response with an `Accept-Query`
   * header is sent **before** the request body is read — saving bandwidth
   * on large query payloads that would be rejected anyway.
   *
   * Uses dynamic `import("node:http")` so bundlers for edge runtimes
   * (Cloudflare Workers, Deno Deploy) never pull in `node:http`.
   *
   * @example
   * ```ts
   * const app = new Site({ articles: new ArticlesKind() });
   * const server = await app.listen({ port: 3000 });
   * console.log(`Listening on ${server.host}:${server.port}`);
   * ```
   *
   * @example
   * ```ts
   * // HTTP/2 over TLS, ALPN-negotiated with H1 fallback.
   * await app.listen({
   *   tls: { key: fs.readFileSync("key.pem"), cert: fs.readFileSync("cert.pem") },
   *   port: 443,
   * });
   * ```
   */
  async listen(options: ListenOptions = {}): Promise<ListeningServer> {
    const nodeHttp = await import("node:http");
    const nodeHttp2 = await import("node:http2");

    // Auto-load SDK script via the package export if not explicitly configured.
    if (this.options.sdkScript === undefined && options.sdkScript !== false) {
      const sdkSource = options.sdkScript ?? (await this.loadSdkBundle());
      if (sdkSource) this.options.sdkScript = sdkSource;
    }

    const handler = this.createRequestHandler(options);
    const server =
      options.tls !== undefined
        ? nodeHttp2.createSecureServer(
            { allowHTTP1: true, ...options.tls },
            handler,
          )
        : nodeHttp.createServer(handler);

    // checkContinue — intercept Expect: 100-continue on QUERY requests so
    // we can reject unsupported query Content-Types (415 + Accept-Query)
    // before the client sends the body. For all other cases, delegate to
    // the normal handler after writing 100 Continue.
    server.on("checkContinue", (req: IncomingMessage, res: ServerResponse) => {
      this.handleCheckContinue(req, res, options, handler).catch((err: unknown) => {
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "text/plain");
        }
        res.end(err instanceof Error ? err.message : "Internal Server Error");
      });
    });

    const requestedPort = options.port ?? 3000;
    const host = options.host ?? "127.0.0.1";
    const listenPath =
      options.listen && "path" in options.listen
        ? options.listen.path
        : undefined;
    const listenPort =
      options.listen && "port" in options.listen
        ? options.listen.port
        : requestedPort;
    const listenHost =
      options.listen && "port" in options.listen
        ? (options.listen.host ?? host)
        : host;

    let actualPort = listenPath !== undefined ? 0 : listenPort;
    const ready = new Promise<void>((resolve) => {
      server.once("listening", () => {
        const addr = server.address();
        if (addr && typeof addr === "object") actualPort = addr.port;
        options.onListen?.(actualPort, listenPath ?? host);
        resolve();
      });
    });

    if (listenPath !== undefined) {
      const nodeFs = await import("node:fs");
      // Best-effort cleanup of stale socket file.
      try {
        nodeFs.unlinkSync(listenPath);
      } catch {
        // Ignore — file doesn't exist or permission denied.
      }
      server.listen(listenPath);
    } else {
      server.listen(listenPort, listenHost);
    }

    return {
      get port(): number {
        return actualPort;
      },
      host: listenPath ?? host,
      path: listenPath,
      server,
      ready,
      close() {
        return new Promise<void>((resolve, reject) => {
          server.close((err?: Error | null) =>
            err ? reject(err) : resolve(),
          );
        });
      },
    };
  }

  /**
   * Build the Node.js request listener — bridges Node's `IncomingMessage` /
   * `ServerResponse` to rikka-site's `HttpRequest` / `HttpResponse`, then
   * dispatches through {@link handleRequest}.
   */
  private createRequestHandler(
    options: ListenOptions,
  ): (req: NodeRequest, res: NodeResponse) => Promise<void> {
    const basePath = options.basePath ?? "";

    return async (req, res) => {
      try {
        options.onRequest?.(req);

        const beforeResult = await options.before?.(req, res);
        if (isHttpResponseValue(beforeResult)) {
          writeNodeResponse(res, beforeResult);
          return;
        }

        const url = parseNodeUrl(req.url ?? "/", req.headers.host);
        const method = (req.method ?? "GET").toUpperCase();
        const headers = collectNodeHeaders(req.headers);
        const body = readNodeBodyStream(req, method);

        const httpRequest: HttpRequest = {
          method,
          path: stripBasePath(url.pathname, basePath) || "/",
          accept: headers["accept"],
          acceptLanguage: headers["accept-language"],
          acceptQuery: url.searchParams.get("accept") ?? undefined,
          body,
          query: collectNodeQuery(url),
          headers,
        };

        // H1 fallback stash — on H2, hints are emitted immediately as
        // interim 103 HEADERS frames.
        const stashedHints: Record<string, string | string[]>[] = [];

        let response = await this.handleRequest(httpRequest, {
          onEarlyHints: (hints) => {
            if (isHttp2Response(res)) {
              writeEarlyHintsH2(res, hints);
            } else {
              stashedHints.push(hints);
            }
          },
        });

        if (stashedHints.length > 0) {
          response = mergeHintsIntoResponse(response, stashedHints);
        }

        if (options.after) {
          response = await options.after(response, req);
        }
        writeNodeResponse(res, response);
      } catch (err) {
        const r = res as unknown as WritableNodeResponse;
        if (!r.headersSent) {
          r.statusCode = 500;
          r.setHeader("Content-Type", "text/plain");
        }
        r.end(err instanceof Error ? err.message : "Internal Server Error");
      }
    };
  }

  /**
   * Handle a `checkContinue` event — intercept `Expect: 100-continue` on
   * QUERY requests to reject unsupported query Content-Types before the
   * body is transmitted.
   */
  private async handleCheckContinue(
    req: IncomingMessage,
    res: ServerResponse,
    options: ListenOptions,
    handler: (req: NodeRequest, res: NodeResponse) => Promise<void>,
  ): Promise<void> {
    const method = (req.method ?? "GET").toUpperCase();

    // Only QUERY requests may carry a query-language body worth rejecting
    // early. All other methods get the default 100 Continue + normal handling.
    if (method !== "QUERY") {
      res.writeContinue();
      await handler(req, res);
      return;
    }

    // Resolve the resource to inspect its supported query types.
    const url = parseNodeUrl(req.url ?? "/", req.headers.host);
    const path = stripBasePath(url.pathname, options.basePath ?? "") || "/";
    const resource = this.resolve(path);

    if (
      resource &&
      typeof (resource as unknown as { supportedQueryTypes?: unknown })
        .supportedQueryTypes === "function"
    ) {
      const supportedTypes = (
        resource as unknown as { supportedQueryTypes(): string[] }
      ).supportedQueryTypes();
      const contentType = (
        (req.headers["content-type"] as string | undefined) ?? ""
      ).toLowerCase();

      if (contentType && !supportedTypes.includes(contentType)) {
        // Reject with 415 + Accept-Query — body is never read.
        res.writeHead(415, {
          "Content-Type": "application/json",
          "Accept-Query": supportedTypes.join(", "),
        });
        res.end(
          JSON.stringify({
            error: "Unsupported Query Type",
            detail: { supported: supportedTypes },
          }),
        );
        return;
      }
    }

    // All checks passed — send 100 Continue and process normally.
    res.writeContinue();
    await handler(req, res);
  }

  /**
   * Load the SDK bundle via the `@takanashi/rikka-site/sdk` package export.
   * Caches the result after the first successful load.
   */
  private async loadSdkBundle(): Promise<string | null> {
    if (this._sdkBundle !== undefined) return this._sdkBundle;
    try {
      const nodeUrl = await import("node:url");
      const nodeFs = await import("node:fs/promises");
      const sdkUrl = import.meta.resolve("@takanashi/rikka-site/sdk");
      const distPath = nodeUrl.fileURLToPath(sdkUrl);
      this._sdkBundle = await nodeFs.readFile(distPath, "utf8");
      return this._sdkBundle;
    } catch {
      this._sdkBundle = null;
      return null;
    }
  }

  // --- Private helpers ---

  private async verifyAuth(
    requestPath: string,
    requestMethod: string,
    requestHeaders: Record<string, string>,
    requestBody?: ReadableStream<Uint8Array>,
  ): Promise<Identity | HttpResponse | null> {
    const authConfig = this.options.auth;
    if (!authConfig) return null;

    const authMatch = matchAuthRule(
      requestPath,
      authConfig.rules,
      requestMethod,
    );
    // no-auth and no-match → no auth required; use-verifier → default verifier;
    // named → the explicitly named auth resource.
    if (authMatch.kind === "no-auth" || authMatch.kind === "no-match") {
      return null;
    }
    const verifierName =
      authMatch.kind === "named" ? authMatch.name : authConfig.verifier;
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
      body: requestBody,
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
}
