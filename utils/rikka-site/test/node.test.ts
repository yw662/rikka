import { describe, it, expect } from "@rstest/core";
import * as http from "node:http";
import {
  Collection,
  ItemResource,
  Site,
} from "../src/index.js";
import { createNodeHandler, serve } from "../src/node.js";

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
  const ItemsCtor = Collection(() => ({
    list: (ctx) => ({ content: [{ id: 1, name: "Alice" }], meta: {} }),
    create: (ctx) => ({
      content: { id: 2, name: "Bob" },
      meta: { location: "./2" },
    }),
  }))({});

  const app = new Site({
    items: ItemsCtor,
  });

  it("createNodeHandler works with http.createServer", async () => {
    const server = http.createServer(createNodeHandler(app));
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", () => r()));
    const addr = server.address();
    if (!addr || typeof addr === "string") throw new Error("no port");
    const port = addr.port;

    try {
      const r = await probe(port, { path: "/items", headers: { accept: "application/json" } });
      expect(r.status).toBe(200);
      expect(JSON.parse(r.body)).toEqual([{ id: 1, name: "Alice" }]);
      expect(r.headers["content-type"]).toContain("application/json");
    } catch (e) {
      // Debug: log response
      const r2 = await probe(port, { path: "/items" });
      console.log("DEBUG body:", r2.body, "headers:", r2.headers);
      throw e;
    } finally {
      await new Promise<void>((r) => server.close(() => r()));
    }
  });

  it("serve() starts a server and returns port/host/close", async () => {
    const s = serve(app, { port: 0, host: "127.0.0.1" });
    await s.ready;

    try {
      const r = await probe(s.port, { path: "/items", headers: { accept: "application/json" } });
      expect(r.status).toBe(200);
    } finally {
      await s.close();
    }
  });

  it("POST creates and returns 201 + Location", async () => {
    const s = serve(app, { port: 0, host: "127.0.0.1" });
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
    const Deletable = Collection(() => ({
      list: (ctx) => ({ content: [], meta: {} }),
      create: (ctx) => ({ content: {}, meta: {} }),
      children: {
        ":id": (id: string) =>
          class extends ItemResource {
            constructor(params: Record<string, string>, path: string) {
              super({
                content: (ctx) => ({ content: { id }, meta: {} }),
                delete: (ctx) => undefined,
              }, undefined, params, path);
            }
          },
      },
    }));
    const s = serve(new Site({ x: Deletable({}) }), { port: 0, host: "127.0.0.1" });
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
    const Rangeable = Collection(() => ({
      create: (ctx) => ({ content: {}, meta: {} }),
      list: (ctx) => {
        const all = Array.from({ length: 20 }, (_, i) => ({ id: i }));
        if (!ctx.range) return { content: all, meta: {} };
        const segments = ctx.range.ranges.map((r) => {
          const start = r.start ?? 0;
          const end = r.end ?? all.length - 1;
          return [start, all.slice(start, end + 1)] as [number, { id: number }[]];
        });
        return {
          content: { unit: "items", data: segments, total: all.length },
          meta: {},
        };
      },
    }));
    const s = serve(new Site({ x: Rangeable({}) }), { port: 0, host: "127.0.0.1" });
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
    const s = serve(app, { port: 0, host: "127.0.0.1" });
    await s.ready;

    try {
      const r = await probe(s.port, { path: "/unknown" });
      expect(r.status).toBe(404);
    } finally {
      await s.close();
    }
  });

  it("basePath strips prefix before dispatch", async () => {
    const s = serve(app, { port: 0, host: "127.0.0.1", basePath: "/api" });
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
    const s = serve(app, {
      port: 0,
      host: "127.0.0.1",
      before: (req) => {
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
    const s = serve(app, {
      port: 0,
      host: "127.0.0.1",
      after: (response) => ({
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
    const s = serve(app, {
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
