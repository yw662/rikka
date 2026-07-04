import { describe, it, expect } from "@rstest/core";
import {
  FileSystemKind,
  type FileSystemStorage,
  type FileStat,
  type DirectoryEntry,
} from "../src/index.js";
import { resolveResource, isHttpError, type RequestContext } from "@takanashi/rikka-site";

// ---------------------------------------------------------------------------
// In-memory storage for testing
// ---------------------------------------------------------------------------

class MemoryStorage implements FileSystemStorage {
  private files = new Map<string, { content: string | Uint8Array; mimeType?: string }>();
  private dirs = new Set<string>();

  addFile(path: string, content: string | Uint8Array, mimeType?: string): this {
    this.files.set(path, { content, mimeType });
    // Register parent dirs
    const parts = path.split("/");
    parts.pop();
    let cur = "";
    for (const p of parts) {
      cur = cur ? `${cur}/${p}` : p;
      this.dirs.add(cur);
    }
    return this;
  }

  addDir(path: string): this {
    this.dirs.add(path);
    return this;
  }

  async stat(path: string): Promise<FileStat | null> {
    if (path === "" || this.dirs.has(path)) {
      return {
        size: 0,
        modified: new Date("2024-01-01T00:00:00Z"),
        isDirectory: true,
      };
    }
    const f = this.files.get(path);
    if (!f) return null;
    const content = f.content;
    const size = typeof content === "string" ? content.length : content.byteLength;
    return {
      size,
      modified: new Date("2024-01-01T00:00:00Z"),
      isDirectory: false,
    };
  }

  async read(path: string): Promise<{ content: string | Uint8Array } | null> {
    const f = this.files.get(path);
    if (!f) return null;
    return { content: f.content };
  }

  async list(path: string): Promise<DirectoryEntry[] | null> {
    if (path !== "" && !this.dirs.has(path)) return null;
    const prefix = path ? `${path}/` : "";
    const entries: DirectoryEntry[] = [];
    const seen = new Set<string>();

    for (const filePath of this.files.keys()) {
      if (!filePath.startsWith(prefix)) continue;
      const rest = filePath.slice(prefix.length);
      const firstSlash = rest.indexOf("/");
      if (firstSlash === -1) {
        // Direct file
        const name = rest;
        if (!seen.has(name)) {
          seen.add(name);
          const f = this.files.get(filePath)!;
          const content = f.content;
          entries.push({
            name,
            size: typeof content === "string" ? content.length : content.byteLength,
            modified: new Date("2024-01-01T00:00:00Z"),
            isDirectory: false,
          });
        }
      } else {
        // Subdirectory
        const name = rest.slice(0, firstSlash);
        if (!seen.has(name)) {
          seen.add(name);
          entries.push({
            name,
            size: 0,
            modified: new Date("2024-01-01T00:00:00Z"),
            isDirectory: true,
          });
        }
      }
    }

    return entries;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCtx(overrides: Partial<RequestContext> = {}): RequestContext {
  return {
    method: "GET",
    path: "/",
    params: {},
    query: {},
    headers: {},
    json: async () => ({}),
    text: async () => "",
    bytes: async () => new Uint8Array(),
    ...overrides,
  } as RequestContext;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("FileSystemKind", () => {
  it("uses self-referencing catch-all children", () => {
    const kind = new FileSystemKind({ storage: new MemoryStorage() });
    expect(kind.children).toBeDefined();
    expect(kind.children![":path*"]).toBe(kind);
  });

  it("resolves file resource via catch-all", () => {
    const storage = new MemoryStorage().addFile("hello.txt", "Hello, World!", "text/plain");
    const kind = new FileSystemKind({ storage });

    const resource = resolveResource(kind, ["hello.txt"], "/hello.txt");
    expect(resource).not.toBeNull();
    expect(resource!.params.path).toBe("hello.txt");
  });

  it("serves text file content", async () => {
    const storage = new MemoryStorage().addFile("hello.txt", "Hello, World!", "text/plain");
    const kind = new FileSystemKind({ storage });

    const resource = resolveResource(kind, ["hello.txt"], "/hello.txt");
    const repr = await (resource as unknown as { content: (ctx: RequestContext) => Promise<unknown> }).content(
      makeCtx({ path: "/hello.txt" }),
    );
    expect((repr as { content: string }).content).toBe("Hello, World!");
    // Resource layer no longer sets meta.type — the server guesses MIME from the path
    expect((repr as { meta: { type?: string } }).meta.type).toBeUndefined();
  });

  it("serves binary file content", async () => {
    const data = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    const storage = new MemoryStorage().addFile("image.png", data, "image/png");
    const kind = new FileSystemKind({ storage });

    const resource = resolveResource(kind, ["image.png"], "/image.png");
    const repr = await (resource as unknown as { content: (ctx: RequestContext) => Promise<unknown> }).content(
      makeCtx({ path: "/image.png" }),
    );
    const content = (repr as { content: Uint8Array }).content;
    expect(content).toBeInstanceOf(Uint8Array);
    expect(Array.from(content)).toEqual([0x89, 0x50, 0x4e, 0x47]);
  });

  it("returns 404 for missing file", async () => {
    const kind = new FileSystemKind({ storage: new MemoryStorage() });

    const resource = resolveResource(kind, ["missing.txt"], "/missing.txt");
    expect(resource).not.toBeNull();
    await expect(
      (resource as unknown as { content: (ctx: RequestContext) => Promise<unknown> }).content(
        makeCtx({ path: "/missing.txt" }),
      ),
    ).rejects.toThrow("Not Found");
  });

  it("redirects directory without trailing slash (301)", async () => {
    const storage = new MemoryStorage().addDir("docs").addFile("docs/readme.md", "# Docs");
    const kind = new FileSystemKind({ storage });

    const resource = resolveResource(kind, ["docs"], "/docs");
    expect(resource).not.toBeNull();

    try {
      await (resource as unknown as { content: (ctx: RequestContext) => Promise<unknown> }).content(
        makeCtx({ path: "/docs" }),
      );
      expect.fail("Should have thrown 301");
    } catch (err) {
      expect(isHttpError(err)).toBe(true);
      if (isHttpError(err)) {
        expect(err.status).toBe(301);
        expect(err.headers?.Location).toBe("/docs/");
      }
    }
  });

  it("serves index.html for directory with trailing slash", async () => {
    const storage = new MemoryStorage()
      .addDir("docs")
      .addFile("docs/index.html", "<h1>Docs Index</h1>", "text/html");
    const kind = new FileSystemKind({ storage });

    const resource = resolveResource(kind, ["docs", ""], "/docs/");
    expect(resource).not.toBeNull();
    const repr = await (resource as unknown as { content: (ctx: RequestContext) => Promise<unknown> }).content(
      makeCtx({ path: "/docs/" }),
    );
    expect((repr as { content: string }).content).toBe("<h1>Docs Index</h1>");
  });

  it("returns structured directory-listing data", async () => {
    const storage = new MemoryStorage()
      .addDir("docs")
      .addFile("docs/readme.md", "# README", "text/markdown")
      .addFile("docs/guide.txt", "Guide", "text/plain");
    const kind = new FileSystemKind({ storage });

    const resource = resolveResource(kind, ["docs", ""], "/docs/");
    const repr = await (resource as unknown as { content: (ctx: RequestContext) => Promise<unknown> }).content(
      makeCtx({
        path: "/docs/",
        headers: { accept: "text/html" },
      }),
    );
    const data = (repr as { content: { type: string; path: string; entries: Array<{ name: string; isDirectory: boolean }> } }).content;
    expect(data.type).toBe("directory-listing");
    expect(data.path).toBe("docs");
    expect(data.entries.length).toBe(2);
    const names = data.entries.map((e) => e.name);
    expect(names).toContain("readme.md");
    expect(names).toContain("guide.txt");
    // Resource returns structured data — no meta.type (transformer renders it)
    expect((repr as { meta: { type?: string } }).meta.type).toBeUndefined();
  });

  it("returns structured directory-listing data for JSON requests too", async () => {
    const storage = new MemoryStorage()
      .addDir("docs")
      .addFile("docs/readme.md", "# README", "text/markdown");
    const kind = new FileSystemKind({ storage });

    const resource = resolveResource(kind, ["docs", ""], "/docs/");
    const repr = await (resource as unknown as { content: (ctx: RequestContext) => Promise<unknown> }).content(
      makeCtx({
        path: "/docs/",
        headers: { accept: "application/json" },
      }),
    );
    // The resource always returns the same structured data regardless of Accept;
    // content negotiation happens in the transformer pipeline, not the resource.
    const data = (repr as { content: { type: string; entries: Array<{ name: string }> } }).content;
    expect(data.type).toBe("directory-listing");
    expect(data.entries[0].name).toBe("readme.md");
  });

  it("supports range requests (206)", async () => {
    const content = "0123456789ABCDEFGHIJ"; // 20 bytes (ASCII)
    const storage = new MemoryStorage().addFile("data.bin", content, "application/octet-stream");
    const kind = new FileSystemKind({ storage });

    const resource = resolveResource(kind, ["data.bin"], "/data.bin");
    const repr = await (resource as unknown as { content: (ctx: RequestContext) => Promise<unknown> }).content(
      makeCtx({
        path: "/data.bin",
        range: {
          unit: "bytes",
          ranges: [{ start: 5, end: 9 }],
        },
      } as Partial<RequestContext>),
    );
    const partial = (repr as { content: { unit: string; data: Array<[number, unknown]>; total?: number } }).content;
    expect(partial.unit).toBe("bytes");
    expect(partial.data[0][0]).toBe(5);
    // Range slices are byte arrays — correct for HTTP byte ranges.
    const slice = partial.data[0][1] as Uint8Array;
    expect(slice).toBeInstanceOf(Uint8Array);
    expect(new TextDecoder().decode(slice)).toBe("56789");
    expect(partial.total).toBe(20);
  });

  it("uses byte offsets (not char offsets) for range requests on multi-byte content", async () => {
    // "é" is 2 bytes in UTF-8 (0xC3 0xA9) but 1 UTF-16 code unit.
    // "aéb" = 3 chars, 4 bytes: [0x61, 0xC3, 0xA9, 0x62]
    const content = "aéb";
    const storage = new MemoryStorage().addFile("multi.txt", content, "text/plain");
    const kind = new FileSystemKind({ storage });

    const resource = resolveResource(kind, ["multi.txt"], "/multi.txt");
    const repr = await (resource as unknown as { content: (ctx: RequestContext) => Promise<unknown> }).content(
      makeCtx({
        path: "/multi.txt",
        range: {
          unit: "bytes",
          ranges: [{ start: 0, end: 3 }],
        },
      } as Partial<RequestContext>),
    );
    const partial = (repr as { content: { unit: string; data: Array<[number, unknown]>; total?: number } }).content;
    // total must be the byte length (4), not the string length (3).
    expect(partial.total).toBe(4);
    const slice = partial.data[0][1] as Uint8Array;
    expect(slice).toBeInstanceOf(Uint8Array);
    expect(Array.from(slice)).toEqual([0x61, 0xc3, 0xa9, 0x62]);
  });

  it("rejects path traversal with 403", async () => {
    const storage = new MemoryStorage().addFile("safe.txt", "safe");
    const kind = new FileSystemKind({ storage });

    // "../etc/passwd" — resolveResource splits on "/", so we pass ["..","etc","passwd"]
    const resource = resolveResource(kind, ["..", "etc", "passwd"], "/../etc/passwd");
    expect(resource).not.toBeNull();
    // sanitizePath sees ".." with an empty stack and throws 403 Forbidden.
    try {
      await (resource as unknown as { content: (ctx: RequestContext) => Promise<unknown> }).content(
        makeCtx({ path: "/../etc/passwd" }),
      );
      expect.fail("content() should have thrown for path traversal");
    } catch (err) {
      expect(isHttpError(err)).toBe(true);
      if (isHttpError(err)) {
        expect(err.status).toBe(403);
      }
    }
  });

  it("respects listDirectories: false option", async () => {
    const storage = new MemoryStorage()
      .addDir("docs")
      .addFile("docs/readme.md", "# README");
    const kind = new FileSystemKind({ storage, listDirectories: false });

    const resource = resolveResource(kind, ["docs", ""], "/docs/");
    await expect(
      (resource as unknown as { content: (ctx: RequestContext) => Promise<unknown> }).content(
        makeCtx({ path: "/docs/" }),
      ),
    ).rejects.toThrow("Not Found");
  });

  it("serves nested paths via catch-all", async () => {
    const storage = new MemoryStorage()
      .addDir("a")
      .addDir("a/b")
      .addFile("a/b/c.txt", "deep", "text/plain");
    const kind = new FileSystemKind({ storage });

    const resource = resolveResource(kind, ["a", "b", "c.txt"], "/a/b/c.txt");
    expect(resource).not.toBeNull();
    const repr = await (resource as unknown as { content: (ctx: RequestContext) => Promise<unknown> }).content(
      makeCtx({ path: "/a/b/c.txt" }),
    );
    expect((repr as { content: string }).content).toBe("deep");
  });

  it("allows custom indexFile option", async () => {
    const storage = new MemoryStorage()
      .addDir("docs")
      .addFile("docs/default.html", "<h1>Default</h1>", "text/html");
    const kind = new FileSystemKind({ storage, index: "default.html" });

    const resource = resolveResource(kind, ["docs", ""], "/docs/");
    const repr = await (resource as unknown as { content: (ctx: RequestContext) => Promise<unknown> }).content(
      makeCtx({ path: "/docs/" }),
    );
    expect((repr as { content: string }).content).toBe("<h1>Default</h1>");
  });
});
