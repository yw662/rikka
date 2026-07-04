import { describe, it, expect, beforeAll } from "@rstest/core";
import * as http from "node:http";
import * as https from "node:https";
import * as http2 from "node:http2";
import * as nodeFs from "node:fs";
import * as nodeOs from "node:os";
import * as nodePath from "node:path";
import * as nodeChildProcess from "node:child_process";
import {
  CollectionKind,
  CollectionResource,
  ItemKind,
  ItemResource,
  ReadOnlyKind,
  ReadOnlyResource,
  Site,
} from "../src/index.js";
import type { RequestContext, Repr, NodeRequest, HttpResponse } from "../src/index.js";

/**
 * Make a real HTTP request through a Node server, parse the response.
 */
function probe(
  port: number,
  opts: {
    method?: string;
    path?: string;
    headers?: Record<string, string>;
    body?: string;
  } = {},
): Promise<{ status: number; headers: Record<string, string>; body: string }> {
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

describe("Node adapter", () => {
  class ItemsKind extends CollectionKind {
    resolve(params: Record<string, string>) {
      const r = new ItemsResource();
      r.params = params;
      return r;
    }
  }
  class ItemsResource extends CollectionResource {
    async list(ctx: RequestContext): Promise<Repr> {
      return { content: [{ id: 1, name: "Alice" }], meta: {} };
    }
    async create(ctx: RequestContext): Promise<Repr> {
      return {
        content: { id: 2, name: "Bob" },
        meta: { location: "./2" },
      };
    }
  }

  const app = new Site({
    items: new ItemsKind(),
  });

  it("listen() starts a server and returns port/host/close", async () => {
    const s = await app.listen({ port: 0, host: "127.0.0.1" });
    await s.ready;

    try {
      const r = await probe(s.port, {
        path: "/items",
        headers: { accept: "application/json" },
      });
      expect(r.status).toBe(200);
    } finally {
      await s.close();
    }
  });

  it("POST creates and returns 201 + Location", async () => {
    const s = await app.listen({ port: 0, host: "127.0.0.1" });
    await s.ready;

    try {
      const r = await probe(s.port, {
        method: "POST",
        path: "/items",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({ name: "Bob" }),
      });
      expect(r.status).toBe(201);
      expect(r.headers["location"]).toBe("2");
    } finally {
      await s.close();
    }
  });

  it("DELETE returns 204 with no body", async () => {
    class DeletableKind extends CollectionKind {
      children = {
        ":id": new (class extends ItemKind {
          resolve(params: Record<string, string>) {
            const r = new (class extends ItemResource {
              async content(ctx: RequestContext): Promise<Repr> {
                return { content: { id: ctx.params.id }, meta: {} };
              }
              async delete(ctx: RequestContext): Promise<Repr> {
                return { content: null, meta: {} };
              }
            })();
            r.params = params;
            return r;
          }
        })(),
      };
      resolve(params: Record<string, string>) {
        const r = new DeletableResource();
        r.params = params;
        return r;
      }
    }
    class DeletableResource extends CollectionResource {
      async list(ctx: RequestContext): Promise<Repr> {
        return { content: [], meta: {} };
      }
      async create(ctx: RequestContext): Promise<Repr> {
        return { content: {}, meta: {} };
      }
    }
    const s = await new Site({ x: new DeletableKind() }).listen({
      port: 0,
      host: "127.0.0.1",
    });
    await s.ready;

    try {
      const r = await probe(s.port, { method: "DELETE", path: "/x/1" });
      expect(r.status).toBe(204);
      expect(r.body).toBe("");
    } finally {
      await s.close();
    }
  });

  it("Range header triggers 206", async () => {
    class RangeableKind extends CollectionKind {
      resolve(params: Record<string, string>) {
        const r = new RangeableResource();
        r.params = params;
        return r;
      }
    }
    class RangeableResource extends CollectionResource {
      async create(ctx: RequestContext): Promise<Repr> {
        return { content: {}, meta: {} };
      }
      async list(ctx: RequestContext): Promise<Repr> {
        const all = Array.from({ length: 20 }, (_, i) => ({ id: i }));
        if (!ctx.range) return { content: all, meta: {} };
        const segments = ctx.range.ranges.map((r) => {
          const start = r.start ?? 0;
          const end = r.end ?? all.length - 1;
          return [start, all.slice(start, end + 1)] as [
            number,
            { id: number }[],
          ];
        });
        return {
          content: { unit: "items", data: segments, total: all.length },
          meta: {},
        };
      }
    }
    const s = await new Site({ x: new RangeableKind() }).listen({
      port: 0,
      host: "127.0.0.1",
    });
    await s.ready;

    try {
      const r = await probe(s.port, {
        path: "/x",
        headers: { range: "items=0-4", accept: "application/json" },
      });
      expect(r.status).toBe(206);
      expect(r.headers["content-range"]).toBe("items 0-4/20");
    } finally {
      await s.close();
    }
  });

  it("404 for unknown path", async () => {
    const s = await app.listen({ port: 0, host: "127.0.0.1" });
    await s.ready;

    try {
      const r = await probe(s.port, { path: "/unknown" });
      expect(r.status).toBe(404);
    } finally {
      await s.close();
    }
  });

  it("basePath strips prefix before dispatch", async () => {
    const s = await app.listen({ port: 0, host: "127.0.0.1", basePath: "/api" });
    await s.ready;

    try {
      const r = await probe(s.port, {
        path: "/api/items",
        headers: { accept: "application/json" },
      });
      expect(r.status).toBe(200);
      expect(JSON.parse(r.body)).toEqual([{ id: 1, name: "Alice" }]);
    } finally {
      await s.close();
    }
  });

  it("before hook can short-circuit requests", async () => {
    const s = await app.listen({
      port: 0,
      host: "127.0.0.1",
      before: (req: NodeRequest): HttpResponse | undefined => {
        if (req.url === "/health") {
          return {
            status: 200,
            headers: { "content-type": "text/plain" },
            body: "ok",
          };
        }
        return undefined;
      },
    });
    await s.ready;

    try {
      const r = await probe(s.port, { path: "/health" });
      expect(r.status).toBe(200);
      expect(r.body).toBe("ok");
    } finally {
      await s.close();
    }
  });

  it("after hook can transform responses", async () => {
    const s = await app.listen({
      port: 0,
      host: "127.0.0.1",
      after: (response: HttpResponse): HttpResponse => ({
        ...response,
        headers: { ...response.headers, "x-custom": "yes" },
        body: response.body + "-suffix",
      }),
    });
    await s.ready;

    try {
      const r = await probe(s.port, {
        path: "/items",
        headers: { accept: "application/json" },
      });
      expect(r.status).toBe(200);
      expect(r.headers["x-custom"]).toBe("yes");
      expect(r.body.endsWith("-suffix")).toBe(true);
    } finally {
      await s.close();
    }
  });

  it("onRequest and onListen hooks fire", async () => {
    let requested = false;
    let listened = false;
    const s = await app.listen({
      port: 0,
      host: "127.0.0.1",
      onRequest: () => {
        requested = true;
      },
      onListen: () => {
        listened = true;
      },
    });
    await s.ready;

    try {
      expect(listened).toBe(true);
      await probe(s.port, { path: "/items" });
      expect(requested).toBe(true);
    } finally {
      await s.close();
    }
  });
});

// ---------------------------------------------------------------------------
// Self-signed cert generation for HTTP/2 over TLS tests.
// Uses openssl (present on all Linux/macOS dev + CI environments). Tests that
// need TLS call this once; if openssl is missing they fail loudly rather than
// silently skipping — H2-over-TLS coverage is required.
// ---------------------------------------------------------------------------

function genCert(): { key: string; cert: string } {
  const tmp = nodeFs.mkdtempSync(nodePath.join(nodeOs.tmpdir(), "rikka-h2-"));
  const keyPath = nodePath.join(tmp, "key.pem");
  const certPath = nodePath.join(tmp, "cert.pem");
  try {
    nodeChildProcess.execSync(
      `openssl req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -days 1 -nodes -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost"`,
      { stdio: "pipe" },
    );
    return {
      key: nodeFs.readFileSync(keyPath, "utf8"),
      cert: nodeFs.readFileSync(certPath, "utf8"),
    };
  } finally {
    nodeFs.rmSync(tmp, { recursive: true, force: true });
  }
}

/**
 * Make an HTTP/2 request against a TLS server, capturing any interim 1xx
 * HEADERS frames (e.g. 103 Early Hints) emitted on the stream.
 */
function h2Probe(
  port: number,
  ca: string,
  path: string,
  opts: { method?: string; headers?: Record<string, string> } = {},
): Promise<{
  status: number;
  headers: Record<string, string>;
  body: string;
  interim: Array<{ status: string; headers: Record<string, string> }>;
}> {
  return new Promise((resolve, reject) => {
    const client = http2.connect(`https://localhost:${port}`, { ca });
    const interim: Array<{ status: string; headers: Record<string, string> }> =
      [];
    let finalStatus = 0;
    let finalHeaders: Record<string, string> = {};
    let settled = false;

    client.on("error", reject);

    const reqHeaders: Record<string, string> = {
      ":method": opts.method ?? "GET",
      ":path": path,
      ...(opts.headers ?? {}),
    };
    const req = client.request(reqHeaders);

    req.on("headers", (headers) => {
      const status = String(headers[":status"] ?? "");
      if (status.startsWith("1")) {
        const flat: Record<string, string> = {};
        for (const [k, v] of Object.entries(headers)) {
          if (!k.startsWith(":")) flat[k] = String(v);
        }
        interim.push({ status, headers: flat });
      }
    });

    req.on("response", (headers) => {
      finalStatus = Number(headers[":status"] ?? 0);
      const flat: Record<string, string> = {};
      for (const [k, v] of Object.entries(headers)) {
        if (!k.startsWith(":")) flat[k] = String(v);
      }
      finalHeaders = flat;
    });

    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => {
      if (settled) return;
      settled = true;
      const body = Buffer.concat(chunks).toString("utf8");
      client.close();
      resolve({ status: finalStatus, headers: finalHeaders, body, interim });
    });
    req.on("error", (err) => {
      if (settled) return;
      settled = true;
      client.close();
      reject(err);
    });
    req.end();
  });
}

/**
 * Plaintext HTTP/1.1 probe over a Unix socket / named pipe.
 */
function probeSocket(
  socketPath: string,
  opts: {
    method?: string;
    path?: string;
    headers?: Record<string, string>;
  } = {},
): Promise<{ status: number; headers: Record<string, string>; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        socketPath,
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
    req.end();
  });
}

// ---------------------------------------------------------------------------
// HTTP/2 over TLS
// ---------------------------------------------------------------------------

describe("HTTP/2 over TLS", () => {
  class H2Kind extends ReadOnlyKind {
    resolve() {
      return new H2Resource();
    }
  }
  class H2Resource extends ReadOnlyResource {
    async content(): Promise<Repr> {
      return { content: [{ hello: "h2" }], meta: {} };
    }
  }

  let cert: { key: string; cert: string };
  beforeAll(() => {
    cert = genCert();
  });

  it("serves HTTP/2 clients over TLS with ALPN", async () => {
    const s = await new Site({ items: new H2Kind() }).listen({
      port: 0,
      host: "127.0.0.1",
      tls: { key: cert.key, cert: cert.cert },
    });
    await s.ready;

    try {
      const r = await h2Probe(s.port, cert.cert, "/items", {
        headers: { accept: "application/json" },
      });
      expect(r.status).toBe(200);
      expect(JSON.parse(r.body)).toEqual([{ hello: "h2" }]);
      // H2 sets content-type via the response headers
      expect(r.headers["content-type"]).toContain("application/json");
    } finally {
      await s.close();
    }
  });

  it("falls back to HTTP/1.1 over TLS when client uses http/1.1", async () => {
    const s = await new Site({ items: new H2Kind() }).listen({
      port: 0,
      host: "127.0.0.1",
      tls: { key: cert.key, cert: cert.cert },
    });
    await s.ready;

    try {
      // https.request negotiates http/1.1 (Node's https module doesn't do h2).
      const r = await new Promise<{
        status: number;
        headers: Record<string, string>;
        body: string;
      }>((resolve, reject) => {
        const req = https.request(
          {
            host: "127.0.0.1",
            port: s.port,
            path: "/items",
            method: "GET",
            headers: { accept: "application/json" },
            rejectUnauthorized: false,
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
        req.end();
      });
      expect(r.status).toBe(200);
      expect(JSON.parse(r.body)).toEqual([{ hello: "h2" }]);
    } finally {
      await s.close();
    }
  });
});

// ---------------------------------------------------------------------------
// Early Hints (103) — H2 interim frame + H1 merge fallback
// ---------------------------------------------------------------------------

describe("Early Hints (103) transport", () => {
  class HintedKind extends ReadOnlyKind {
    element = "test-page";
    resolve(params: Record<string, string>) {
      const r = new HintedResource();
      r.params = params;
      r.element = this.element;
      return r;
    }
  }
  class HintedResource extends ReadOnlyResource {
    async content(ctx: RequestContext): Promise<Repr> {
      return { content: { id: ctx.params.id ?? null }, meta: {} };
    }
    earlyHints(ctx: RequestContext) {
      return {
        Link: [
          "</style.css>; rel=preload; as=style",
          `</fonts/${ctx.params.id ?? "default"}.woff>; rel=preload; as=font`,
        ],
      };
    }
  }
  class NoHintsKind extends ReadOnlyKind {
    element = "test-thing";
    resolve() {
      const r = new NoHintsResource();
      r.element = this.element;
      return r;
    }
  }
  class NoHintsResource extends ReadOnlyResource {
    async content(): Promise<Repr> {
      return { content: { ok: true }, meta: {} };
    }
  }

  let cert: { key: string; cert: string };
  beforeAll(() => {
    cert = genCert();
  });

  it("emits a real 103 interim HEADERS frame on HTTP/2", async () => {
    const s = await new Site({ pages: { ":id": new HintedKind() } }).listen({
      port: 0,
      host: "127.0.0.1",
      tls: { key: cert.key, cert: cert.cert },
    });
    await s.ready;

    try {
      const r = await h2Probe(s.port, cert.cert, "/pages/42", {
        headers: { accept: "application/json" },
      });
      expect(r.interim.length).toBe(1);
      expect(r.interim[0].status).toBe("103");
      // H2 lowercases header names; both Link values join into one header.
      expect(r.interim[0].headers.link).toContain("</style.css>; rel=preload");
      expect(r.interim[0].headers.link).toContain(
        "</fonts/42.woff>; rel=preload",
      );
      // Final response is still 200 with the body.
      expect(r.status).toBe(200);
      expect(JSON.parse(r.body)).toEqual({ id: "42" });
      // Final response must NOT carry the link header (hints were interim-only).
      expect(r.headers.link).toBeUndefined();
    } finally {
      await s.close();
    }
  });

  it("does not emit 103 when resource has no earlyHints() on H2", async () => {
    const s = await new Site({ thing: new NoHintsKind() }).listen({
      port: 0,
      host: "127.0.0.1",
      tls: { key: cert.key, cert: cert.cert },
    });
    await s.ready;

    try {
      const r = await h2Probe(s.port, cert.cert, "/thing", {
        headers: { accept: "application/json" },
      });
      expect(r.interim.length).toBe(0);
      expect(r.status).toBe(200);
    } finally {
      await s.close();
    }
  });

  it("merges Link hints into final response on HTTP/1.1 (no interim 1xx)", async () => {
    // Plaintext H1 server — no TLS, so http.request (not https).
    const s = await new Site({ pages: { ":id": new HintedKind() } }).listen({
      port: 0,
      host: "127.0.0.1",
    });
    await s.ready;

    try {
      const r = await probe(s.port, { path: "/pages/7" });
      expect(r.status).toBe(200);
      // No interim frame on H1; hints merged into final Link header.
      expect(r.headers.link).toContain("</style.css>; rel=preload");
      expect(r.headers.link).toContain("</fonts/7.woff>; rel=preload");
    } finally {
      await s.close();
    }
  });

  it("does not add Link header on H1 when resource has no earlyHints()", async () => {
    const s = await new Site({ thing: new NoHintsKind() }).listen({
      port: 0,
      host: "127.0.0.1",
    });
    await s.ready;

    try {
      const r = await probe(s.port, { path: "/thing" });
      expect(r.status).toBe(200);
      expect(r.headers.link).toBeUndefined();
    } finally {
      await s.close();
    }
  });
});

// ---------------------------------------------------------------------------
// Unix socket / named pipe listener
// ---------------------------------------------------------------------------

describe("Unix socket listener", () => {
  it("listens on a Unix socket path and serves requests", async () => {
    const sockPath = nodePath.join(
      nodeOs.tmpdir(),
      `rikka-test-${process.pid}-${Date.now()}.sock`,
    );
    const s = await new Site({
      items: new (class extends ReadOnlyKind {
        resolve() {
          return new (class extends ReadOnlyResource {
            async content(): Promise<Repr> {
              return { content: [{ via: "socket" }], meta: {} };
            }
          })();
        }
      })(),
    }).listen({
      listen: { path: sockPath },
    });
    await s.ready;

    try {
      expect(s.path).toBe(sockPath);
      expect(s.port).toBe(0);
      const r = await probeSocket(sockPath, {
        path: "/items",
        headers: { accept: "application/json" },
      });
      expect(r.status).toBe(200);
      expect(JSON.parse(r.body)).toEqual([{ via: "socket" }]);
    } finally {
      await s.close();
    }
  });

  it("cleans up a stale socket file before listening", async () => {
    const sockPath = nodePath.join(
      nodeOs.tmpdir(),
      `rikka-stale-${process.pid}-${Date.now()}.sock`,
    );
    // Leave a stale file at the path — listen() must unlink it before listen().
    nodeFs.writeFileSync(sockPath, "stale");

    const s = await new Site({
      x: new (class extends ReadOnlyKind {
        element = "test-thing";
        resolve() {
          const r = new (class extends ReadOnlyResource {
            async content(): Promise<Repr> {
              return { content: { ok: true }, meta: {} };
            }
          })();
          r.element = this.element;
          return r;
        }
      })(),
    }).listen({
      listen: { path: sockPath },
    });
    await s.ready;

    try {
      const r = await probeSocket(sockPath, { path: "/x" });
      expect(r.status).toBe(200);
    } finally {
      await s.close();
    }
  });
});
