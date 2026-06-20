/**
 * @module edge
 * Edge runtime adapters for rikka-site.
 *
 * Each platform has slightly different entry point conventions.
 * This module provides adapters for all major edge runtimes,
 * plus a generic `handleWebRequest` for any Web Standard compatible runtime.
 * The Node.js adapter lives in `./node.js` — it imports `node:http`, so
 * non-Node bundlers don't have to handle that scheme.
 *
 * ## Platform summary
 *
 * | Platform | Adapter | Entry format |
 * |----------|---------|-------------|
 * | Cloudflare Workers | `createCloudflareWorkerHandler` | `export default { fetch(req, env, ctx) }` |
 * | Cloudflare Pages (Advanced Mode) | `createCloudflarePagesHandler` | `_worker.js` with `export default { fetch(req, env, ctx) }` |
 * | Vercel Edge | `handleWebRequest` | `export function GET(req)` or `export default { fetch(req) }` |
 * | Deno Deploy | `createDenoDeployHandler` | `Deno.serve(handler)` |
 * | Node.js (no edge) | `createNodeHandler` / `serve` from `./node.js` | Plain `http.createServer` |
 * | Generic | `handleWebRequest` | Any `Request → Response` handler |
 */

import type { Site } from "./site.js";
import type { HttpRequest } from "./server.js";

// ---------------------------------------------------------------------------
// Shared: Web Standard Request → Response
// ---------------------------------------------------------------------------

/**
 * Handle a Web Standard Request and return a Web Standard Response.
 *
 * This is the universal adapter — works on any runtime that provides
 * the Fetch API (Request, Response, Headers, URL).
 *
 * The request body is passed through as a `ReadableStream<Uint8Array>`
 * — it is **not** pre-parsed. Resource methods use `ctx.json()`,
 * `ctx.text()`, or `ctx.bytes()` to lazily read and parse it.
 */
export async function handleWebRequest(
  site: Site,
  request: Request,
): Promise<Response> {
  const url = new URL(request.url);
  const acceptQuery = url.searchParams.get("accept") ?? undefined;

  // Build query params
  const query: Record<string, string> = {};
  for (const [key, value] of url.searchParams.entries()) {
    if (key !== "accept") {
      query[key] = value;
    }
  }

  // Build headers (lowercase keys)
  const headers: Record<string, string> = {};
  for (const [key, value] of request.headers.entries()) {
    headers[key.toLowerCase()] = value;
  }

  // Pass the body stream through untouched — no eager parsing.
  // GET/HEAD have no body; other methods pass `request.body` (a
  // ReadableStream<Uint8Array> | null) through as-is.
  const body =
    request.method !== "GET" && request.method !== "HEAD"
      ? (request.body as ReadableStream<Uint8Array> | null) ?? undefined
      : undefined;

  const httpRequest: HttpRequest = {
    method: request.method,
    path: url.pathname,
    accept: request.headers.get("accept") ?? undefined,
    acceptQuery,
    body,
    query,
    headers,
  };

  const httpResponse = await site.handleRequest(httpRequest);

  const responseHeaders = new Headers();
  for (const [key, value] of Object.entries(httpResponse.headers)) {
    responseHeaders.set(key, value);
  }

  const status = httpResponse.status;
  // 204/205/304 MUST NOT include a body per HTTP spec.
  const noBody = status === 204 || status === 205 || status === 304;

  if (noBody) {
    return new Response(null, { status, headers: responseHeaders });
  }

  const responseBody = httpResponse.body;

  // Streams pass through untouched; strings and Uint8Arrays are wrapped
  // in a Blob with the negotiated Content-Type.
  if (responseBody instanceof ReadableStream) {
    const resp = new Response(responseBody, { status, headers: responseHeaders });
    // Some runtimes (e.g. Node.js/undici) drop Content-Type when the body
    // is a ReadableStream — re-apply it from the original headers.
    const ct = httpResponse.headers["Content-Type"];
    if (ct && !resp.headers.has("Content-Type")) {
      resp.headers.set("Content-Type", ct);
    }
    return resp;
  }

  const blob = new Blob([responseBody as BlobPart], {
    type: httpResponse.headers["Content-Type"],
  });
  return new Response(blob, { status, headers: responseHeaders });
}

/**
 * Create a generic fetch handler for a site.
 */
export function createFetchHandler(site: Site) {
  return (request: Request): Promise<Response> => handleWebRequest(site, request);
}

// ---------------------------------------------------------------------------
// Cloudflare Workers
// ---------------------------------------------------------------------------

/**
 * Cloudflare Workers environment bindings type.
 */
export interface CloudflareEnv {
  [key: string]: unknown;
}

/**
 * Cloudflare Workers fetch handler context.
 */
export interface CloudflareContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

/**
 * Create a Cloudflare Workers fetch handler.
 */
export function createCloudflareWorkerHandler<
  Env extends CloudflareEnv = CloudflareEnv,
>(site: Site) {
  return {
    async fetch(
      request: Request,
      _env: Env,
      _ctx: CloudflareContext,
    ): Promise<Response> {
      return handleWebRequest(site, request);
    },
  };
}

// ---------------------------------------------------------------------------
// Cloudflare Pages — Advanced Mode (_worker.js)
// ---------------------------------------------------------------------------

/**
 * Create a Cloudflare Pages handler (Advanced Mode).
 */
export function createCloudflarePagesHandler<
  Env extends CloudflareEnv = CloudflareEnv,
>(
  site: Site,
  options?: {
    /** Only handle paths starting with this prefix. Others fall through to static assets. */
    apiPrefix?: string;
  },
) {
  return {
    async fetch(
      request: Request,
      env: Env & { ASSETS: { fetch(request: Request): Promise<Response> } },
      _ctx: CloudflareContext,
    ): Promise<Response> {
      const url = new URL(request.url);

      // If apiPrefix is set, only handle matching paths
      if (options?.apiPrefix && !url.pathname.startsWith(options.apiPrefix)) {
        return env.ASSETS.fetch(request);
      }

      // Try rikka-site first
      const response = await handleWebRequest(site, request);

      // If 404, fall back to static assets
      if (response.status === 404) {
        try {
          return await env.ASSETS.fetch(request);
        } catch {
          return response;
        }
      }

      return response;
    },
  };
}

// ---------------------------------------------------------------------------
// Deno Deploy
// ---------------------------------------------------------------------------

/**
 * Create a Deno Deploy handler.
 */
export function createDenoDeployHandler(site: Site) {
  return (request: Request): Promise<Response> => handleWebRequest(site, request);
}

