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
 */
export interface HttpRequest {
  /** HTTP method (GET, POST, etc.) */
  method: string;
  /** URL path (e.g. "/users/42") */
  path: string;
  /** Accept header value */
  accept?: string;
  /** ?accept query parameter */
  acceptQuery?: string;
  /** Request body (parsed) */
  body?: unknown;
  /** Query parameters */
  query?: Record<string, unknown>;
  /** Request headers (lowercase keys) */
  headers?: Record<string, string>;
}

/**
 * HTTP response abstraction — framework-agnostic.
 */
export interface HttpResponse {
  /** HTTP status code */
  status: number;
  /** Response headers */
  headers: Record<string, string>;
  /** Response body — text or binary */
  body: string | Uint8Array;
}

// ---------------------------------------------------------------------------
// Re-exports from site.ts (public API)
// ---------------------------------------------------------------------------

export { parseRangeHeader, buildLocationHeader };
