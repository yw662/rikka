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
 * Check if a Repr's content is pre-serialized bytes (Uint8Array or string).
 */
export function isBytes(content: unknown): content is Uint8Array | string {
  return content instanceof Uint8Array || typeof content === "string";
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
// Re-exports for transformer compatibility
// ---------------------------------------------------------------------------

export { anySchema };
export type { Schema };
