import { describe, it, expect } from "@rstest/core";
import {
  buildLocationHeader,
  parseRangeHeader,
  CollectionKind,
  CollectionResource,
  ItemKind,
  ItemResource,
  ReadOnlyKind,
  ReadOnlyResource,
  Site,
  jsonBody,
} from "../src/index.js";
import type { RequestContext, Repr } from "../src/index.js";

async function bodyText(
  body: string | Uint8Array | ReadableStream<Uint8Array>,
): Promise<string> {
  if (typeof body === "string") return body;
  if (body instanceof Uint8Array) return new TextDecoder().decode(body);
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  const total = chunks.reduce((n, c) => n + c.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return new TextDecoder().decode(out);
}

// ---------------------------------------------------------------------------
// Location header resolution
// ---------------------------------------------------------------------------

describe("buildLocationHeader", () => {
  it("resolves relative ref against resource path", () => {
    // resource at /articles, meta.location = "./1"
    // → relative to /articles: "1"
    expect(buildLocationHeader("./1", "/articles")).toBe("1");
  });

  it("resolves relative ref with different mount path", () => {
    // resource at /admin/articles, meta.location = "./1"
    // → relative to /admin/articles: "1"
    expect(buildLocationHeader("./1", "/admin/articles")).toBe("1");
  });

  it("resolves absolute path ref to relative ref", () => {
    // resource at /admin/articles, meta.location = "/articles/1"
    // resource 视角解析: /articles/1
    // common prefix: none, up 2 + down 2
    expect(buildLocationHeader("/articles/1", "/admin/articles")).toBe(
      "../../articles/1",
    );
  });

  it("handles deep mount paths", () => {
    // resource at /a/b/c, meta.location = "./1"
    expect(buildLocationHeader("./1", "/a/b/c")).toBe("1");
    // resource at /a/b/c, meta.location = "/a/x/1"
    // resource 视角: /a/x/1, request 视角(/a/b/c) 相对路径: up 2 + down 2
    expect(buildLocationHeader("/a/x/1", "/a/b/c")).toBe("../../x/1");
    // resource at /a/b/c, meta.location = "/a/1"
    expect(buildLocationHeader("/a/1", "/a/b/c")).toBe("../../1");
  });

  it("passes through absolute URLs unchanged", () => {
    expect(buildLocationHeader("https://example.com/foo", "/articles")).toBe(
      "https://example.com/foo",
    );
    expect(buildLocationHeader("http://x.com/y", "/articles")).toBe(
      "http://x.com/y",
    );
  });

  it("returns '.' when location resolves to the resource itself", () => {
    // Empty string (or just current dir) resolves to the resource itself
    expect(buildLocationHeader(".", "/articles")).toBe(".");
    expect(buildLocationHeader("", "/articles")).toBe(".");
  });
});

// ---------------------------------------------------------------------------
// Range header parsing
// ---------------------------------------------------------------------------

describe("parseRangeHeader", () => {
  it("parses single bytes range", () => {
    expect(parseRangeHeader("bytes=0-99")).toEqual({
      unit: "bytes",
      ranges: [{ start: 0, end: 99 }],
      total: "*",
    });
  });

  it("parses multi-segment bytes range", () => {
    expect(parseRangeHeader("bytes=0-99,200-299")).toEqual({
      unit: "bytes",
      ranges: [
        { start: 0, end: 99 },
        { start: 200, end: 299 },
      ],
      total: "*",
    });
  });

  it("parses items range", () => {
    expect(parseRangeHeader("items=0-9")).toEqual({
      unit: "items",
      ranges: [{ start: 0, end: 9 }],
      total: "*",
    });
  });

  it("parses open-ended range (bytes=N-)", () => {
    expect(parseRangeHeader("bytes=100-")).toEqual({
      unit: "bytes",
      ranges: [{ start: 100 }],
      total: "*",
    });
  });

  it("parses suffix range (bytes=-N)", () => {
    expect(parseRangeHeader("bytes=-100")).toEqual({
      unit: "bytes",
      ranges: [{}],
      total: "*",
    });
  });

  it("rejects malformed range (no equals)", () => {
    expect(parseRangeHeader("bytes 0-99")).toBeNull();
  });

  it("rejects malformed range (no dash)", () => {
    expect(parseRangeHeader("bytes=99")).toBeNull();
  });

  it("rejects malformed range (end < start)", () => {
    expect(parseRangeHeader("bytes=100-50")).toBeNull();
  });

  it("respects provided total", () => {
    expect(parseRangeHeader("bytes=0-99", 4230)).toEqual({
      unit: "bytes",
      ranges: [{ start: 0, end: 99 }],
      total: 4230,
    });
  });
});

// ---------------------------------------------------------------------------
// 206 Partial Content integration
// ---------------------------------------------------------------------------

describe("206 Partial Content", () => {
  class ArticlesKind extends CollectionKind {
    resolve(params: Record<string, string>) {
      const r = new ArticlesResource();
      r.params = params;
      return r;
    }
  }
  class ArticlesResource extends CollectionResource {
    async create(ctx: RequestContext): Promise<Repr> {
      return { content: {}, meta: {} };
    }
    async list(ctx: RequestContext): Promise<Repr> {
      const all = Array.from({ length: 100 }, (_, i) => ({ id: i, title: `Article ${i}` }));
      if (!ctx.range) {
        return { content: all, meta: {} };
      }
      // Slice according to the range
      const segments = ctx.range.ranges.map((r) => {
        const start = r.start ?? 0;
        const end = r.end ?? all.length - 1;
        return [start, all.slice(start, end + 1)] as [number, { id: number; title: string }[]];
      });
      return {
        content: { unit: "items", data: segments, total: all.length },
        meta: {},
      };
    }
  }

  class BytesKind extends ReadOnlyKind {
    resolve(params: Record<string, string>) {
      const r = new BytesResource();
      r.params = params;
      return r;
    }
  }
  class BytesResource extends ReadOnlyResource {
    async content(ctx: RequestContext): Promise<Repr> {
      const all = new Uint8Array(1024);
      for (let i = 0; i < 1024; i++) all[i] = i % 256;
      if (!ctx.range) {
        return { content: all, meta: { type: "application/octet-stream" } };
      }
      const segments = ctx.range.ranges.map((r) => {
        const start = r.start ?? 0;
        const end = r.end ?? all.length - 1;
        return [start, all.slice(start, end + 1)] as [number, Uint8Array];
      });
      return {
        content: { unit: "bytes", data: segments, total: all.length },
        meta: { type: "application/octet-stream" },
      };
    }
  }

  const app = new Site({
    articles: new ArticlesKind(),
    bytes: new BytesKind(),
  });

  it("returns 200 + full body when no Range header", async () => {
    const response = await app.handleRequest({
      method: "GET",
      path: "/articles",
      accept: "application/json",
    });
    expect(response.status).toBe(200);
    expect(JSON.parse(await bodyText(response.body)).length).toBe(100);
  });

  it("returns 206 + Content-Range for single items range", async () => {
    const response = await app.handleRequest({
      method: "GET",
      path: "/articles",
      accept: "application/json",
      headers: { range: "items=0-9" },
    });
    expect(response.status).toBe(206);
    expect(response.headers["Content-Range"]).toBe("items 0-9/100");
    const body = JSON.parse(await bodyText(response.body));
    // single segment → JSON array directly
    expect(body.length).toBe(10);
    expect(body[0].id).toBe(0);
  });

  it("returns 206 with multi-segment Content-Range for items", async () => {
    const response = await app.handleRequest({
      method: "GET",
      path: "/articles",
      accept: "application/json",
      headers: { range: "items=0-4,50-54" },
    });
    expect(response.status).toBe(206);
    expect(response.headers["Content-Range"]).toBe("items 0-4,50-54/100");
  });

  it("returns 206 + multipart/byteranges for multi-segment bytes", async () => {
    const response = await app.handleRequest({
      method: "GET",
      path: "/bytes",
      headers: { range: "bytes=0-4,100-104" },
    });
    expect(response.status).toBe(206);
    expect(response.headers["Content-Type"]).toMatch(/^multipart\/byteranges/);
    expect(response.headers["Content-Range"]).toBe("bytes 0-4,100-104/1024");
    expect(await bodyText(response.body)).toContain("RIKKA_");
  });

  it("returns 206 + raw bytes for single bytes range", async () => {
    const response = await app.handleRequest({
      method: "GET",
      path: "/bytes",
      headers: { range: "bytes=10-14" },
    });
    expect(response.status).toBe(206);
    expect(response.headers["Content-Range"]).toBe("bytes 10-14/1024");
    expect((await bodyText(response.body)).length).toBe(5);
  });

  it("ignores malformed Range header and returns 200", async () => {
    const response = await app.handleRequest({
      method: "GET",
      path: "/articles",
      accept: "application/json",
      headers: { range: "garbage" },
    });
    expect(response.status).toBe(200);
    expect(JSON.parse(await bodyText(response.body)).length).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// Status code inference (transport-level concerns, not Repr)
// ---------------------------------------------------------------------------

describe("status code inference", () => {
  class ArticlesKind extends CollectionKind {
    resolve(params: Record<string, string>) {
      const r = new ArticlesResource();
      r.params = params;
      return r;
    }
  }
  class ArticlesResource extends CollectionResource {
    async list(ctx: RequestContext): Promise<Repr> {
      return { content: [{ id: 1 }], meta: {} };
    }
    async create(ctx: RequestContext): Promise<Repr> {
      return {
        content: { id: 2 },
        meta: { location: "./2" },
      };
    }
  }

  class SettingsKind extends ReadOnlyKind {
    resolve(params: Record<string, string>) {
      const r = new SettingsResource();
      r.params = params;
      return r;
    }
  }
  class SettingsResource extends ReadOnlyResource {
    async content(ctx: RequestContext): Promise<Repr> {
      return { content: { theme: "dark" }, meta: {} };
    }
  }

  const App = new Site({
    articles: new ArticlesKind(),
    settings: new SettingsKind(),
  });

  it("GET Collection.list → 200", async () => {
    const response = await App.handleRequest({
      method: "GET",
      path: "/articles",
      accept: "application/json",
    });
    expect(response.status).toBe(200);
  });

  it("POST Collection.create with location → 201 + Location", async () => {
    const response = await App.handleRequest({
      method: "POST",
      path: "/articles",
      accept: "application/json",
      body: jsonBody({ title: "Hello" }),
    });
    expect(response.status).toBe(201);
    expect(response.headers["Location"]).toBe("2");
  });

  it("GET ReadOnly.content → 200", async () => {
    const response = await App.handleRequest({
      method: "GET",
      path: "/settings",
      accept: "application/json",
    });
    expect(response.status).toBe(200);
  });

  it("DELETE on Item returning undefined → 204", async () => {
    class UsersCollectionKind extends CollectionKind {
      children = {
        ":userId": new (class extends ItemKind {
          resolve(params: Record<string, string>) {
            const r = new (class extends ItemResource {
              async content(ctx: RequestContext): Promise<Repr> {
                return { content: { id: 1 }, meta: {} };
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
        const r = new UsersCollectionResource();
        r.params = params;
        return r;
      }
    }
    class UsersCollectionResource extends CollectionResource {
      async create(ctx: RequestContext): Promise<Repr> {
        return { content: {}, meta: {} };
      }
      async list(ctx: RequestContext): Promise<Repr> {
        return { content: [], meta: {} };
      }
    }
    const app = new Site({ users: new UsersCollectionKind() });
    const response = await app.handleRequest({
      method: "DELETE",
      path: "/users/1",
    });
    expect(response.status).toBe(204);
  });

  it("null content + location → 302 (redirect)", async () => {
    class RedirectorKind extends ReadOnlyKind {
      resolve(params: Record<string, string>) {
        const r = new RedirectorResource();
        r.params = params;
        return r;
      }
    }
    class RedirectorResource extends ReadOnlyResource {
      async content(ctx: RequestContext): Promise<Repr> {
        return {
          content: null,
          meta: { location: "./target" },
        };
      }
    }
    const app = new Site({ redirector: new RedirectorKind() });
    const response = await app.handleRequest({
      method: "GET",
      path: "/redirector",
    });
    expect(response.status).toBe(302);
    expect(response.headers["Location"]).toBe("target");
  });

  it("null content without location → 204 (no-content)", async () => {
    class NoContentKind extends ReadOnlyKind {
      resolve(params: Record<string, string>) {
        const r = new NoContentResource();
        r.params = params;
        return r;
      }
    }
    class NoContentResource extends ReadOnlyResource {
      async content(ctx: RequestContext): Promise<Repr> {
        return { content: null, meta: {} };
      }
    }
    const app = new Site({ nc: new NoContentKind() });
    const response = await app.handleRequest({
      method: "GET",
      path: "/nc",
    });
    expect(response.status).toBe(204);
  });
});
