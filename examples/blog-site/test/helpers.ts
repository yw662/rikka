/**
 * Test helpers — common HTTP probe for the blog-site.
 *
 * We expose a small `probe()` function that talks plain HTTP to a server
 * listening on a real port. All three entry points (Node, dev server,
 * Cloudflare Workers shim) are tested by starting them on port 0 and
 * probing them through the same client.
 */

import * as http from "node:http";

export interface ProbeOpts {
  method?: string;
  path?: string;
  headers?: Record<string, string>;
  body?: string;
}

export interface ProbeResult {
  status: number;
  headers: Record<string, string>;
  body: string;
}

export function probe(
  port: number,
  opts: ProbeOpts = {},
): Promise<ProbeResult> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        method: opts.method ?? "GET",
        path: opts.path ?? "/",
        headers: opts.headers,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          const headers: Record<string, string> = {};
          for (const [k, v] of Object.entries(res.headers)) {
            if (typeof v === "string") headers[k] = v;
            else if (Array.isArray(v)) headers[k] = v.join(", ");
          }
          resolve({ status: res.statusCode ?? 0, headers, body });
        });
      },
    );
    req.on("error", reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

/**
 * Find a free port. Returns the assigned port and a cleanup function that
 * closes the listening socket. Used by `withPort()`.
 */
export function findFreePort(): Promise<{ port: number; close: () => void }> {
  return new Promise((resolve, reject) => {
    const srv = http.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address();
      if (!addr || typeof addr === "string") {
        srv.close();
        reject(new Error("no port"));
        return;
      }
      resolve({
        port: addr.port,
        close: () => srv.close(),
      });
    });
  });
}

/**
 * Run a function with a free port, cleaning up afterwards. Use when an
 * entry point doesn't expose its own port (e.g. when imported for side effects).
 */
export async function withPort<T>(fn: (port: number) => Promise<T>): Promise<T> {
  const p = await findFreePort();
  try {
    return await fn(p.port);
  } finally {
    p.close();
  }
}
