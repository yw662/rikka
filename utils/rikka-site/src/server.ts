/**
 * @module server
 * HTTP adapter — maps HTTP requests to resource method invocations.
 *
 * The request-handling logic lives on the {@link Site} object
 * (see `site.ts`). This module re-exports the HTTP type definitions
 * and utility functions.
 */

import { parseRangeHeader, buildLocationHeader } from "./site.js";

// ---------------------------------------------------------------------------
// HTTP types
// ---------------------------------------------------------------------------

/**
 * HTTP request abstraction — framework-agnostic.
 *
 * The request body is exposed as a `ReadableStream<Uint8Array>` — parsing
 * is deferred until the resource method calls `ctx.json()`, `ctx.text()`,
 * or `ctx.bytes()`. This mirrors the Web Fetch API and avoids eager
 * buffering for handlers that don't read the body (e.g. GET, DELETE).
 */
export interface HttpRequest {
  /** HTTP method (GET, POST, etc.) */
  method: string;
  /** URL path (e.g. "/users/42") */
  path: string;
  /** Accept header value */
  accept?: string;
  /** Accept-Language header value */
  acceptLanguage?: string;
  /** ?accept query parameter */
  acceptQuery?: string;
  /** Request body as a byte stream — read via ctx.json()/text()/bytes() */
  body?: ReadableStream<Uint8Array>;
  /** Query parameters */
  query?: Record<string, unknown>;
  /** Request headers (lowercase keys) */
  headers?: Record<string, string>;
}

/**
 * HTTP response abstraction — framework-agnostic.
 *
 * `body` may be a `string` (text formats), `Uint8Array` (binary formats),
 * or a `ReadableStream<Uint8Array>` (streamed/proxied responses). The
 * adapter picks the appropriate write strategy based on the shape.
 */
export interface HttpResponse {
  /** HTTP status code */
  status: number;
  /** Response headers */
  headers: Record<string, string>;
  /** Response body — text, binary, or a byte stream */
  body: string | Uint8Array | ReadableStream<Uint8Array>;
}

// ---------------------------------------------------------------------------
// Re-exports from site.ts (public API)
// ---------------------------------------------------------------------------

export { parseRangeHeader, buildLocationHeader };
