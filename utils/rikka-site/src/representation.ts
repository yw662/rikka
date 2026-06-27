/**
 * @module representation
 * Repr — a Resource's Representation.
 *
 * A Repr is the noun describing what a resource looks like at a moment in time.
 * Methods on a resource (list, content, create, replace, ...) return Repr directly.
 *
 * ## Structure
 *
 *   Repr = { content, meta }
 *
 * - `content` — the data itself. Its form (structured value / bytes / partial / null)
 *                is inferred by the server.
 * - `meta` — transport-level metadata: type (MIME), location, etc.
 *
 * The server infers transport-level concerns (status code, headers) from
 * `content`'s shape, `meta`, and the (method, kind) pair.
 *
 * ## Status code inference
 *
 * When `meta.kind` is set, it takes precedence:
 * - `kind: "redirect"`  → 302
 * - `kind: "created"`   → 201
 * - `kind: "no-content"` → 204
 * - `kind: "value"`     → 200 (or 206 for PartialContent with Range)
 *
 * When `meta.kind` is omitted, the server infers from `content`'s shape:
 * - `content === null && meta.location` → 302 (redirect)
 * - `content === null`                   → 204 (no content)
 * - `method === "POST" && kind === "Collection" && meta.location` → 201
 * - `method === "DELETE"`                     → 204
 * - `content` is PartialContent               → 206
 * - otherwise                                 → 200
 *
 * ## Examples
 *
 * ```ts
 * // Value Repr
 * return { content: article, meta: {} };
 *
 * // Created (201) — Collection.create returns location-relative ref
 * return { content: article, meta: { location: `./${article.id}` } };
 *
 * // Raw bytes
 * return { content: imageBytes, meta: { type: "image/png" } };
 *
 * // Redirect
 * return { content: null, meta: { location: "./users" } };
 *
 * // No content (after delete)
 * return { content: null, meta: {} };
 *
 * // Partial (206)
 * return { content: { unit: "items", data: [[0, items1], [50, items2]], total: 423 },
 *          meta: {} };
 * ```
 */

import type { Schema } from "./schema.js";
import { anySchema } from "./schema.js";

// Re-export HttpError for backward compat — but the canonical location is ./errors.js.
export { HttpError, isHttpError } from "./errors.js";

// ---------------------------------------------------------------------------
// Repr
// ---------------------------------------------------------------------------

/**
 * Metadata about a Repr's content — transport-level hints, not the data itself.
 *
 * Fields are added on demand; only those currently meaningful are present.
 */
export interface ReprMeta {
  /**
   * Type of the content. Free-form string, typically a MIME type
   * ("application/json", "image/png", "text/csv"). Drives transformer
   * selection and the Content-Type transport header.
   */
  type?: string;

  /**
   * Resource location — a URI reference relative to the resource's own path.
   * The server resolves it to a reference relative to the request path and
   * writes it to the Location transport header.
   *
   * Examples:
   *   "./1"        — a child of the current resource
   *   "../foo/2"   — a sibling resource
   *   "https://..." — absolute URL (passed through unchanged)
   */
  location?: string;

  /**
   * Content language. When provided, the HTML transformer writes it to the
   * `<html lang="...">` attribute. If absent, the attribute is omitted.
   */
  lang?: string;

  /**
   * Explicit response kind — overrides the shape-based status inference in
   * `Resource.inferStatus` and `buildResponse`.
   *
   * - `"redirect"` — 302, empty body, Location header from `location`
   * - `"created"` — 201, Location header; body is `content` (may be null)
   * - `"no-content"` — 204, empty body
   * - `"value"` — 200, normal content negotiation on `content`
   *
   * When omitted, the server infers the kind from `content`'s shape and the
   * (method, resource) pair (backward compatible).
   */
  kind?: "redirect" | "created" | "no-content" | "value";
}

/**
 * A Resource's Representation.
 *
 * A method on a resource returns a Repr; the server reads `content`'s shape
 * and `meta` to produce the HTTP response.
 */
export interface Repr<TContent = unknown> {
  /** The data — its form is inferred by the server. */
  content: TContent;
  /** Transport-level metadata about the content. */
  meta: ReprMeta;
}

/**
 * Smart constructors for the four response kinds.
 *
 * `Repr` is structurally a product `{ content, meta }`, but its semantics
 * are a sum type tagged by `meta.kind`. Writing a redirect by hand as
 * `{ content: null, meta: { location } }` works, but it leaves the
 * invariant "redirect content must be null" implicit in the caller's
 * discipline. These constructors make the sum type visible at every
 * construction site and let the type checker carry the invariants:
 *
 * - `Repr.value(data)`            — 200, normal content negotiation
 * - `Repr.redirect(location)`     — 302, empty body, Location header
 * - `Repr.created(data, location)` — 201, Location header, body is `data`
 * - `Repr.noContent()`            — 204, empty body
 *
 * The shape-based inference in `buildResponse` remains as a fallback for
 * Reprs constructed without a `kind` (backward compat), but new code
 * should prefer these constructors so the kind is always explicit.
 */
export namespace Repr {
  /** A normal value Repr — 200, content negotiated on `content`. */
  export function value<T>(
    content: T,
    meta: Omit<ReprMeta, "kind"> = {},
  ): Repr<T> {
    return { content, meta: { ...meta, kind: "value" } };
  }

  /** A redirect Repr — 302, empty body, Location header from `location`. */
  export function redirect(location: string): Repr<null> {
    return { content: null, meta: { location, kind: "redirect" } };
  }

  /**
   * A created Repr — 201, Location header, body is `content`.
   * Pass `null` for `content` when the response should have no body.
   */
  export function created<T>(content: T, location: string): Repr<T> {
    return { content, meta: { location, kind: "created" } };
  }

  /** A no-content Repr — 204, empty body. */
  export function noContent(): Repr<null> {
    return { content: null, meta: { kind: "no-content" } };
  }
}

// ---------------------------------------------------------------------------
// PartialContent
// ---------------------------------------------------------------------------

/**
 * A Repr whose content is a subset of a larger resource.
 *
 * The server emits 206 when a Range is in effect; without a Range, the server
 * degrades to 200 (Range is ignored, full content is rendered).
 *
 * `data` is always `Array<[offset, content]>` — single-segment and multi-segment
 * use the same shape. A single segment is `[[0, items]]`; multiple segments
 * are `[[0, items1], [50, items2], ...]`.
 */
export interface PartialContent {
  /** Unit of the segments — "bytes", "items", or any custom string. */
  unit: string;
  /** Segments, each is [offset, content]. */
  data: Array<[number, unknown]>;
  /** Total size of the complete resource, if known. */
  total?: number | "*";
}

// ---------------------------------------------------------------------------
// Content shape helpers
// ---------------------------------------------------------------------------

/**
 * Check if a Repr's content is a PartialContent.
 *
 * Detected by structural shape — a PartialContent is an object with
 * `unit: string` and `data: Array<[number, unknown]>`. This shape is
 * exotic enough that ordinary structured values won't match.
 */
export function isPartial(content: unknown): content is PartialContent {
  if (typeof content !== "object" || content === null) return false;
  const c = content as PartialContent;
  return (
    typeof c.unit === "string" &&
    Array.isArray(c.data) &&
    c.data.every(
      (seg) =>
        Array.isArray(seg) && seg.length === 2 && typeof seg[0] === "number",
    )
  );
}

/**
 * Check if a Repr's content is pre-serialized raw content.
 *
 * Raw content is one of:
 * - `Uint8Array` — binary bytes
 * - `string` — text
 * - `ReadableStream<Uint8Array>` — a live byte stream (streamed/proxied)
 *
 * Raw content bypasses the Value→Raw transformer pipeline; it is passed
 * through to the response (possibly via Raw→Raw transformers).
 */
export function isBytes(
  content: unknown,
): content is Uint8Array | string | ReadableStream<Uint8Array> {
  return (
    content instanceof Uint8Array ||
    typeof content === "string" ||
    (typeof ReadableStream !== "undefined" &&
      content instanceof ReadableStream)
  );
}

// ---------------------------------------------------------------------------
// Repr detection (used by the server's wrap layer)
// ---------------------------------------------------------------------------

/**
 * Check if a value returned from a method is already a Repr object.
 * A Repr has a `content` field and a `meta` object.
 */
export function isRepr(val: unknown): val is Repr {
  if (typeof val !== "object" || val === null) return false;
  const v = val as Record<string, unknown>;
  if (!("content" in v)) return false;
  if (typeof v.meta !== "object" || v.meta === null) return false;
  return true;
}

// ---------------------------------------------------------------------------
// HttpError — see ./errors.js (re-exported above)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// MIME type helpers
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

const textMimePrefixes = [
  "text/",
  "application/javascript",
  "application/json",
  "application/xml",
  "application/wasm",
  "image/svg+xml",
];

/** Guess a MIME type from a file path or extension. */
export function guessMimeType(filePathOrExt: string): string {
  const dot = filePathOrExt.lastIndexOf(".");
  const ext = dot === -1 ? filePathOrExt : filePathOrExt.slice(dot);
  return mimeTypes[ext.toLowerCase()] ?? "application/octet-stream";
}

/** Check if a MIME type represents text content. */
export function isTextMime(mime: string): boolean {
  return textMimePrefixes.some((p) => mime.startsWith(p));
}

// ---------------------------------------------------------------------------
// Re-exports for transformer compatibility
// ---------------------------------------------------------------------------

export { anySchema };
export type { Schema };
