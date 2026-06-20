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
 *
 * Methods read from RequestContext and return a Repr.
 *
 * The request body is exposed as a `ReadableStream<Uint8Array>` on `body`.
 * It is **not** pre-parsed — use {@link RequestContext.json},
 * {@link RequestContext.text}, or {@link RequestContext.bytes} to lazily
 * read and parse it. The first call caches the result; subsequent calls
 * return the cached value. If the request has no body, the methods
 * resolve to `undefined` / `""` / `new Uint8Array(0)` respectively.
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
  /** Raw request body as a byte stream. Use json()/text()/bytes() to parse. */
  body?: ReadableStream<Uint8Array>;
  /** Lazily parse the body as JSON. Cached after the first call. */
  json: <T = unknown>() => Promise<T>;
  /** Lazily read the body as UTF-8 text. Cached after the first call. */
  text: () => Promise<string>;
  /** Lazily read the body as raw bytes. Cached after the first call. */
  bytes: () => Promise<Uint8Array>;
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

// ---------------------------------------------------------------------------
// Body stream helpers
// ---------------------------------------------------------------------------

/**
 * Wrap a JSON-serializable value in a `ReadableStream<Uint8Array>`.
 *
 * Useful for tests and for handlers that synthesize a body from an
 * in-memory value.
 *
 * @example
 * ```ts
 * const stream = jsonBody({ name: "Alice" });
 * ```
 */
export function jsonBody(value: unknown): ReadableStream<Uint8Array> {
  return textBody(JSON.stringify(value));
}

/**
 * Wrap a string in a `ReadableStream<Uint8Array>` (UTF-8 encoded).
 */
export function textBody(text: string): ReadableStream<Uint8Array> {
  const encoded = new TextEncoder().encode(text);
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoded);
      controller.close();
    },
  });
}

/**
 * Wrap a `Uint8Array` in a `ReadableStream<Uint8Array>`.
 */
export function bytesBody(bytes: Uint8Array): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
}

// ---------------------------------------------------------------------------
// createRequestContext — factory that wires up lazy body parsing
// ---------------------------------------------------------------------------

/**
 * Fields for {@link createRequestContext}. `body` accepts either a
 * `ReadableStream<Uint8Array>` or a plain value (which is wrapped in a
 * stream via {@link jsonBody}) for test convenience.
 */
export interface RequestContextInit {
  method?: string;
  path?: string;
  resourcePath?: string;
  params?: Record<string, string>;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  /** A stream, or a plain value wrapped as a JSON stream. */
  body?: ReadableStream<Uint8Array> | unknown;
  identity?: Identity;
  range?: RangeSpec;
}

/**
 * Create a {@link RequestContext} with `json()` / `text()` / `bytes()`
 * lazy-parsing methods wired up to the `body` stream.
 *
 * If `body` is not a `ReadableStream`, it is wrapped via
 * {@link jsonBody} — this lets tests pass plain objects without
 * constructing a stream manually.
 *
 * @example
 * ```ts
 * const ctx = createRequestContext({
 *   method: "POST",
 *   path: "/users",
 *   body: { name: "Bob" },
 * });
 * const user = await ctx.json<{ name: string }>();
 * ```
 */
export function createRequestContext(init: RequestContextInit): RequestContext {
  const bodyStream =
    init.body instanceof ReadableStream
      ? init.body
      : init.body === undefined
        ? undefined
        : jsonBody(init.body);

  let cachedBytes: Promise<Uint8Array> | null = null;
  let cachedJson: unknown | undefined;
  let cachedText: string | undefined;
  let jsonResolved = false;
  let textResolved = false;

  const readBytes = (): Promise<Uint8Array> => {
    if (cachedBytes) return cachedBytes;
    if (!bodyStream) {
      cachedBytes = Promise.resolve(new Uint8Array(0));
      return cachedBytes;
    }
    cachedBytes = (async () => {
      const reader = bodyStream.getReader();
      const chunks: Uint8Array[] = [];
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }
      if (chunks.length === 0) return new Uint8Array(0);
      if (chunks.length === 1) return chunks[0]!;
      const total = chunks.reduce((n, c) => n + c.byteLength, 0);
      const out = new Uint8Array(total);
      let offset = 0;
      for (const c of chunks) {
        out.set(c, offset);
        offset += c.byteLength;
      }
      return out;
    })();
    return cachedBytes;
  };

  const json = async <T = unknown>(): Promise<T> => {
    if (jsonResolved) return cachedJson as T;
    const bytes = await readBytes();
    if (bytes.byteLength === 0) {
      jsonResolved = true;
      cachedJson = undefined;
      return undefined as T;
    }
    cachedJson = JSON.parse(new TextDecoder().decode(bytes));
    jsonResolved = true;
    return cachedJson as T;
  };

  const text = async (): Promise<string> => {
    if (textResolved) return cachedText as string;
    const bytes = await readBytes();
    cachedText = new TextDecoder().decode(bytes);
    textResolved = true;
    return cachedText;
  };

  const bytes = async (): Promise<Uint8Array> => readBytes();

  return {
    method: init.method ?? "GET",
    path: init.path ?? "/",
    resourcePath: init.resourcePath,
    params: init.params ?? {},
    query: init.query ?? {},
    headers: init.headers ?? {},
    body: bodyStream,
    json,
    text,
    bytes,
    identity: init.identity,
    range: init.range,
  };
}
