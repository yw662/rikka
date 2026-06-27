import { describe, it, expect, afterEach } from "@rstest/core";
import { FileSystemKind } from "../src/index.js";
import { Site, type StaticResolver } from "@takanashi/rikka-site";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function makeResolver(
  files: Record<string, { content: string | Uint8Array; type?: string }>,
): StaticResolver {
  return async (path) => files[path] ?? null;
}

describe("Static resolver (Edge)", () => {
  it("serves a text file", async () => {
    const app = new Site({
      assets: new FileSystemKind({
        resolver: makeResolver({
          "style.css": { content: "body{}", type: "text/css" },
        }),
      }),
    });
    const r = await app.handleRequest({
      method: "GET",
      path: "/assets/style.css",
      headers: {},
    });
    expect(r.status).toBe(200);
    // MIME is now guessed from the path (resolver's `type` is no longer passed through)
    expect(r.headers["Content-Type"]).toContain("text/css");
    expect(r.body).toBe("body{}");
  });

  it("serves a binary file", async () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    const app = new Site({
      assets: new FileSystemKind({
        resolver: makeResolver({
          "pixel.png": { content: bytes, type: "image/png" },
        }),
      }),
    });
    const r = await app.handleRequest({
      method: "GET",
      path: "/assets/pixel.png",
      headers: {},
    });
    expect(r.status).toBe(200);
    expect(r.headers["Content-Type"]).toBe("image/png");
    expect(r.body instanceof Uint8Array).toBe(true);
    expect((r.body as Uint8Array).byteLength).toBe(bytes.length);
  });

  it("infers MIME type when resolver omits it", async () => {
    const app = new Site({
      assets: new FileSystemKind({
        resolver: makeResolver({ "app.js": { content: "x" } }),
      }),
    });
    const r = await app.handleRequest({
      method: "GET",
      path: "/assets/app.js",
      headers: {},
    });
    expect(r.status).toBe(200);
    expect(r.headers["Content-Type"]).toContain("javascript");
  });

  it("falls back to index.html for directory requests", async () => {
    const app = new Site({
      assets: new FileSystemKind({
        resolver: makeResolver({
          "index.html": { content: "<h1>hello</h1>", type: "text/html" },
        }),
      }),
    });
    const r = await app.handleRequest({
      method: "GET",
      path: "/assets/",
      headers: {},
    });
    expect(r.status).toBe(200);
    expect(r.body).toBe("<h1>hello</h1>");
  });

  it("returns 404 for missing files", async () => {
    const app = new Site({
      assets: new FileSystemKind({
        resolver: makeResolver({}),
      }),
    });
    const r = await app.handleRequest({
      method: "GET",
      path: "/assets/missing.txt",
      headers: {},
    });
    expect(r.status).toBe(404);
  });

  it("rejects path traversal", async () => {
    const app = new Site({
      assets: new FileSystemKind({
        resolver: makeResolver({ "secret.txt": { content: "secret" } }),
      }),
    });
    const r = await app.handleRequest({
      method: "GET",
      path: "/assets/../secret.txt",
      headers: {},
    });
    expect(r.status).toBe(403);
  });
});

describe("Static root (Node)", () => {
  let tmp: string | undefined;

  afterEach(() => {
    if (tmp) {
      rmSync(tmp, { recursive: true, force: true });
      tmp = undefined;
    }
  });

  it("serves files from a root directory", async () => {
    tmp = mkdtempSync(join(tmpdir(), "rikka-static-"));
    writeFileSync(join(tmp, "hello.txt"), "hello");

    const app = new Site({
      assets: new FileSystemKind({
        root: tmp!,
      }),
    });
    const r = await app.handleRequest({
      method: "GET",
      path: "/assets/hello.txt",
      headers: {},
    });
    expect(r.status).toBe(200);
    // LocalStorage.read() now always returns Uint8Array
    expect(new TextDecoder().decode(r.body as Uint8Array)).toBe("hello");
  });
});
