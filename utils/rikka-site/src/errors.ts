/**
 * @module errors
 * HttpError — the only structured error a method can throw.
 *
 * Lives in its own module so server.js, representation.js, and consumers
 * all import the *same* class — important for `instanceof` checks across
 * module boundaries (bundlers may otherwise inline duplicates).
 */

/**
 * An error that methods can throw to produce a structured HTTP error response.
 *
 * @example
 * ```ts
 * content: (ctx) => {
 *   const item = db.find(ctx.params.id);
 *   if (!item) throw new HttpError(404, "Not Found", { resource: ctx.path });
 *   return { content: item, description: {} };
 * }
 * ```
 */
export class HttpError extends Error {
  /** HTTP status code */
  readonly status: number;
  /** Structured error body (optional) */
  readonly detail?: unknown;

  constructor(status: number, message?: string, detail?: unknown) {
    super(message ?? `HTTP ${status}`);
    this.name = "HttpError";
    this.status = status;
    this.detail = detail;
  }
}

/**
 * Check if a value is an HttpError.
 */
export function isHttpError(val: unknown): val is HttpError {
  return val instanceof HttpError;
}
