/**
 * Cloudflare Workers entry — `src/worker.ts`.
 *
 * The export shape of worker.ts is `{ fetch(req, env, ctx) }` per
 * Cloudflare's Worker module format. We can call this directly with a
 * Web Standard `Request` and get a `Response` back — no wrangler/miniflare
 * needed. (Wrangler is for the runtime; the function is plain JS.)
 *
 * Verifies that the same resource tree that runs on Node also works under
 * the Web Standard adapter. Catches any class-identity / module-resolution
 * issues that would otherwise only surface on `wrangler dev`.
 */

import { describe, it, expect, beforeAll, afterAll } from "@rstest/core";
import * as http from "node:http";
import { probe } from "./helpers.js";

interface WorkerHandler {
  fetch(req: Request, env: unknown, ctx: unknown): Promise<Response>;
}

describe("src/worker.ts (Cloudflare Workers entry)", () => {
  let worker: WorkerHandler;
  let port: number;
  let server: http.Server;

  beforeAll(async () => {
    // Import the worker entry. The default export is the fetch handler.
    const mod = await import("../src/worker.js");
    worker = mod.default as WorkerHandler;
    expect(typeof worker.fetch).toBe("function");

    // Wrap the worker in a tiny http server so we can probe it with the
    // same `probe()` helper used elsewhere. This mimics how Cloudflare's
    // runtime invokes the handler — Request in, Response out.
    server = http.createServer(async (req, res) => {
      try {
        const url = `http://${req.headers.host ?? "localhost"}${req.url ?? "/"}`;
        const chunks: Buffer[] = [];
        for await (const c of req) chunks.push(c as Buffer);
        const body = Buffer.concat(chunks);
        const headers = new Headers();
        for (const [k, v] of Object.entries(req.headers)) {
          if (typeof v === "string") headers.set(k, v);
          else if (Array.isArray(v)) headers.set(k, v.join(", "));
        }
        const webReq = new Request(url, {
          method: req.method ?? "GET",
          headers,
          body: body.length > 0 ? body : undefined,
        });
        const webRes = await worker.fetch(webReq, {}, {});
        res.statusCode = webRes.status;
        webRes.headers.forEach((v, k) => res.setHeader(k, v));
        const buf = Buffer.from(await webRes.arrayBuffer());
        res.end(buf);
      } catch (err) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: String(err) }));
      }
    });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", () => r()));
    const addr = server.address();
    if (!addr || typeof addr === "string") throw new Error("no port");
    port = addr.port;
  });

  afterAll(async () => {
    await new Promise<void>((r) => server.close(() => r()));
  });

  it("responds to all six Kinds + auth + 404", async () => {
    // ReadOnly — / (browsers send Accept: text/html, which the framework
    // negotiates to the HTML transformer)
    const home = await probe(port, {
      path: "/",
      headers: { accept: "text/html" },
    });
    expect(home.status).toBe(200);
    expect(home.headers["content-type"]).toContain("text/html");

    // Collection — /articles
    const list = await probe(port, {
      path: "/articles",
      headers: { accept: "application/json" },
    });
    expect(list.status).toBe(200);
    expect(JSON.parse(list.body).length).toBeGreaterThan(0);

    // Item — /articles/1
    const item = await probe(port, {
      path: "/articles/1",
      headers: { accept: "application/json" },
    });
    expect(item.status).toBe(200);
    expect(JSON.parse(item.body).id).toBe(1);

    // Singleton — /settings
    const set = await probe(port, {
      path: "/settings",
      headers: { accept: "application/json" },
    });
    expect(set.status).toBe(200);
    expect(JSON.parse(set.body).siteName).toBe("Rikka Blog");

    // ReadOnly — /dashboard
    const dash = await probe(port, {
      path: "/dashboard",
      headers: { accept: "application/json" },
    });
    expect(dash.status).toBe(200);

    // Action — /actions/search
    const act = await probe(port, {
      method: "POST",
      path: "/actions/search",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        authorization: "Bearer reader-token",
      },
      body: JSON.stringify({ query: "Rikka" }),
    });
    expect(act.status).toBe(200);
    expect(JSON.parse(act.body).length).toBeGreaterThan(0);

    // 404
    const nf = await probe(port, { path: "/no-such-path" });
    expect(nf.status).toBe(404);

    // CORS preflight — wraps a real Web Request
    const pre = await probe(port, {
      method: "OPTIONS",
      path: "/articles",
      headers: {
        origin: "https://example.com",
        "access-control-request-method": "POST",
      },
    });
    expect(pre.status).toBe(204);
  }, 25000);

  it("parses JSON body from a real Web Request", async () => {
    const url = `http://127.0.0.1:${port}/articles`;
    const webReq = new Request(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        authorization: "Bearer admin-token",
      },
      body: JSON.stringify({ title: "Worker body test", body: "x" }),
    });
    const webRes = await worker.fetch(webReq, {}, {});
    expect(webRes.status).toBe(201);
    expect(webRes.headers.get("location")).toBeTruthy();
    const body = await webRes.json();
    expect(body.title).toBe("Worker body test");
  });

  it("passes through 4xx and 5xx as Web Response status", async () => {
    // 401 via missing auth
    const noAuth = new Request(`http://127.0.0.1:${port}/admin/articles`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "x", body: "x" }),
    });
    const r = await worker.fetch(noAuth, {}, {});
    expect(r.status).toBe(401);
    const body = await r.json();
    expect(body.error).toBeDefined();

    // 405 wrong method — auth is checked before method, so provide a valid
    // token to reach the method check (DELETE on a Collection → 405).
    const wrong = new Request(`http://127.0.0.1:${port}/users`, {
      method: "DELETE",
      headers: { authorization: "Bearer admin-token" },
    });
    const r2 = await worker.fetch(wrong, {}, {});
    expect(r2.status).toBe(405);
  });
});
