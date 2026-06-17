/**
 * @module context
 * RequestContext — the unified request context passed to all methods.
 *
 * Methods on a resource receive a RequestContext. They return a Repr.
 */

// ---------------------------------------------------------------------------
// Identity — result of successful authentication
// ---------------------------------------------------------------------------

/**
 * Identity information injected by the auth system.
 * Produced by an auth resource (Action) and attached to RequestContext.
 */
export interface Identity {
  /** The authenticated subject (user ID, service name, etc.) */
  subject: string;
  /** Permission scopes (space-separated, per OAuth2 convention) */
  scopes: string;
  /** Token expiration timestamp (epoch seconds) */
  expiresAt?: number;
  /** Additional claims or metadata */
  extra?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// RangeSpec — parsed Range header
// ---------------------------------------------------------------------------

/**
 * A single range — half-open [start, end] (inclusive of end).
 * Examples:
 *   bytes 0-99       → { start: 0, end: 99 }
 *   bytes 100-       → { start: 100, end: undefined }   (open-ended)
 *   bytes -100       → { start: undefined, end: 100 }   (suffix)
 *   items 0-9        → { start: 0, end: 9 }
 */
export interface Range {
  /** Inclusive start offset. `undefined` for suffix ranges (bytes=-N). */
  start?: number;
  /** Inclusive end offset. `undefined` for open-ended ranges (bytes=N-). */
  end?: number;
}

/**
 * Parsed Range request — drives 206 Partial Content responses.
 *
 * `unit` and `ranges` come from the request; `total` is the server-known
 * total size, which may be `"*"` if unknown. A method that returns a
 * PartialContent should set `total` on the PartialContent itself (or the
 * server can fill it from ctx.range.total).
 */
export interface RangeSpec {
  /** Unit — typically "bytes" or "items". */
  unit: string;
  /** The actual ranges requested. */
  ranges: Range[];
  /** Total size of the complete resource. The server may fill this in. */
  total: number | "*";
}

// ---------------------------------------------------------------------------
// RequestContext — passed to every method
// ---------------------------------------------------------------------------

/**
 * The request context provided to all resource methods.
 * Methods read from RequestContext and return a Repr.
 */
export interface RequestContext {
  /** HTTP method (GET, POST, etc.) */
  method: string;
  /** URL path (e.g. "/users/42") — the full request URL path */
  path: string;
  /** The resolved resource's mount path (e.g. "/assets" for a Static at /assets).
   *  For catchAll resources, this is the prefix; for others, equals `path`. */
  resourcePath?: string;
  /** Path parameters (e.g. { userId: "42" }) */
  params: Record<string, string>;
  /** Query parameters */
  query: Record<string, string>;
  /** Request headers (lowercase keys) */
  headers: Record<string, string>;
  /** Parsed request body (for non-GET methods) */
  body?: unknown;
  /** Authenticated identity (set by auth system) */
  identity?: Identity;
  /**
   * Parsed Range header, if present.
   * Methods that return PartialContent should consult this and slice
   * their data accordingly.
   */
  range?: RangeSpec;
}

// ---------------------------------------------------------------------------
// Header helper
// ---------------------------------------------------------------------------

/**
 * Get a header value from a headers record (case-insensitive lookup).
 */
export function getHeader(
  headers: Record<string, string>,
  name: string,
): string | undefined {
  const lower = name.toLowerCase();
  // Direct lookup (headers should already be lowercase)
  if (headers[lower] !== undefined) return headers[lower];
  // Fallback: scan keys
  for (const [key, val] of Object.entries(headers)) {
    if (key.toLowerCase() === lower) return val;
  }
  return undefined;
}
