import { describe, it, expect } from "@rstest/core";
import {
  FileSystemKind,
  type WritableFileSystemStorage,
  type FileStat,
  type DirectoryEntry,
} from "../src/index.js";
import { resolveResource, isHttpError, type RequestContext } from "@takanashi/rikka-site";

// ---------------------------------------------------------------------------
// In-memory writable storage for testing
// ---------------------------------------------------------------------------

class MemoryStorage implements WritableFileSystemStorage {
  private files = new Map<
    string,
    { content: string | Uint8Array; mimeType?: string }
  >();
  private dirs = new Set<string>();

  addFile(path: string, content: string | Uint8Array, mimeType?: string): this {
    this.files.set(path, { content, mimeType });
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
    const size =
      typeof content === "string" ? content.length : content.byteLength;
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
        if (!seen.has(rest)) {
          seen.add(rest);
          const f = this.files.get(filePath)!;
          const content = f.content;
          entries.push({
            name: rest,
            size:
              typeof content === "string" ? content.length : content.byteLength,
            modified: new Date("2024-01-01T00:00:00Z"),
            isDirectory: false,
          });
        }
      } else {
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

  async write(path: string, content: string | Uint8Array): Promise<void> {
    this.files.set(path, { content });
    const parts = path.split("/");
    parts.pop();
    let cur = "";
    for (const p of parts) {
      cur = cur ? `${cur}/${p}` : p;
      this.dirs.add(cur);
    }
  }

  async createDirectory(path: string): Promise<void> {
    this.dirs.add(path);
  }

  async remove(path: string): Promise<void> {
    if (this.dirs.has(path)) {
      this.dirs.delete(path);
      for (const key of [...this.files.keys()]) {
        if (key.startsWith(`${path}/`)) this.files.delete(key);
      }
      for (const d of [...this.dirs]) {
        if (d.startsWith(`${path}/`)) this.dirs.delete(d);
      }
    } else {
      this.files.delete(path);
    }
  }

  async copy(from: string, to: string): Promise<void> {
    const f = this.files.get(from);
    if (f) {
      this.files.set(to, { ...f });
    } else if (this.dirs.has(from)) {
      for (const [key, val] of this.files) {
        if (key.startsWith(`${from}/`)) {
          const newKey = `${to}/${key.slice(from.length + 1)}`;
          this.files.set(newKey, { ...val });
        }
      }
      this.dirs.add(to);
    }
  }

  async move(from: string, to: string): Promise<void> {
    await this.copy(from, to);
    await this.remove(from);
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

describe("FileSystemKind (writable)", () => {
  it("extends FileSystemKind with WebDAV methods", () => {
    const kind = new FileSystemKind({
      storage: new MemoryStorage(),
      writable: true,
    });
    expect(kind.children).toBeDefined();
    expect(kind.children![":path*"]).toBe(kind);
  });

  it("allowedMethods includes WebDAV methods (auto-detected)", () => {
    const kind = new FileSystemKind({
      storage: new MemoryStorage(),
      writable: true,
    });
    const resource = kind.resolve({ path: "" });
    const methods = resource.allowedMethods();
    expect(methods).toContain("GET");
    expect(methods).toContain("PUT");
    expect(methods).toContain("DELETE");
    expect(methods).toContain("PROPFIND");
    expect(methods).toContain("MKCOL");
    expect(methods).toContain("COPY");
    expect(methods).toContain("MOVE");
    expect(methods).toContain("LOCK");
    expect(methods).toContain("UNLOCK");
  });

  it("PUT writes file content", async () => {
    const storage = new MemoryStorage();
    const kind = new FileSystemKind({ storage, writable: true });
    const resource = resolveResource(kind, ["test.txt"], "/test.txt")!;
    const ctx = makeCtx({
      method: "PUT",
      path: "/dav/test.txt",
      bytes: async () => new TextEncoder().encode("Hello DAV"),
    });
    const result = await resource.put(ctx);
    expect((result as { content: null }).content).toBeNull();

    const read = await storage.read("test.txt");
    expect(read).not.toBeNull();
    expect(new TextDecoder().decode(read!.content as Uint8Array)).toBe(
      "Hello DAV",
    );
  });

  it("DELETE removes file", async () => {
    const storage = new MemoryStorage().addFile("delete-me.txt", "bye");
    const kind = new FileSystemKind({ storage, writable: true });

    const resource = resolveResource(kind, ["delete-me.txt"], "/delete-me.txt");
    const ctx = makeCtx({ method: "DELETE", path: "/dav/delete-me.txt" });
    await resource!.delete(ctx);

    expect(await storage.stat("delete-me.txt")).toBeNull();
  });

  it("DELETE returns 404 for missing", async () => {
    const kind = new FileSystemKind({
      storage: new MemoryStorage(),
      writable: true,
    });
    const resource = resolveResource(kind, ["missing.txt"], "/missing.txt")!;
    await expect(
      resource.delete(makeCtx({ method: "DELETE", path: "/dav/missing.txt" })),
    ).rejects.toThrow("Not Found");
  });

  it("MKCOL creates directory", async () => {
    const storage = new MemoryStorage();
    const kind = new FileSystemKind({ storage, writable: true });

    const resource = resolveResource(kind, ["new-dir", ""], "/new-dir/")!;
    const ctx = makeCtx({ method: "MKCOL", path: "/dav/new-dir/" });
    await resource.mkcol(ctx);

    const stat = await storage.stat("new-dir");
    expect(stat).not.toBeNull();
    expect(stat!.isDirectory).toBe(true);
  });

  it("MKCOL returns 405 if already exists", async () => {
    const storage = new MemoryStorage().addDir("exists");
    const kind = new FileSystemKind({ storage, writable: true });

    const resource = resolveResource(kind, ["exists", ""], "/exists/")!;
    await expect(
      resource.mkcol(makeCtx({ method: "MKCOL", path: "/dav/exists/" })),
    ).rejects.toThrow("Method Not Allowed");
  });

  it("PROPFIND returns multistatus structured data for file (Depth: 0)", async () => {
    const storage = new MemoryStorage().addFile(
      "doc.txt",
      "content",
      "text/plain",
    );
    const kind = new FileSystemKind({ storage, writable: true });

    const resource = resolveResource(kind, ["doc.txt"], "/doc.txt")!;
    const ctx = makeCtx({
      method: "PROPFIND",
      path: "/doc.txt",
      headers: { depth: "0" },
    });
    const result = await resource.propfind(ctx);

    const data = (
      result as {
        content: {
          type: string;
          entries: Array<{ href: string; size: number }>;
        };
      }
    ).content;
    expect(data.type).toBe("webdav-multistatus");
    expect(data.entries.length).toBe(1);
    expect(data.entries[0].href).toBe("/doc.txt");
    expect(data.entries[0].size).toBe("content".length);
    expect((result as { meta: { type?: string } }).meta.type).toBe(
      "application/xml; charset=utf-8",
    );
  });

  it("PROPFIND lists directory children (Depth: 1)", async () => {
    const storage = new MemoryStorage()
      .addDir("docs")
      .addFile("docs/a.txt", "AAA")
      .addFile("docs/b.txt", "BBB");
    const kind = new FileSystemKind({ storage, writable: true });

    const resource = resolveResource(kind, ["docs", ""], "/docs/")!;
    const ctx = makeCtx({
      method: "PROPFIND",
      path: "/docs/",
      headers: { depth: "1" },
    });
    const result = await resource.propfind(ctx);

    const data = (
      result as {
        content: {
          type: string;
          entries: Array<{ href: string; isDirectory: boolean }>;
        };
      }
    ).content;
    expect(data.type).toBe("webdav-multistatus");
    const hrefs = data.entries.map((e) => e.href);
    expect(hrefs).toContain("/docs/");
    expect(hrefs.some((h) => h.includes("a.txt"))).toBe(true);
    expect(hrefs.some((h) => h.includes("b.txt"))).toBe(true);
    const dirEntry = data.entries.find((e) => e.href === "/docs/");
    expect(dirEntry?.isDirectory).toBe(true);
  });

  it("PROPFIND returns 404 for missing", async () => {
    const kind = new FileSystemKind({
      storage: new MemoryStorage(),
      writable: true,
    });
    const resource = resolveResource(kind, ["missing"], "/missing")!;
    await expect(
      resource.propfind(
        makeCtx({
          method: "PROPFIND",
          path: "/dav/missing",
          headers: { depth: "0" },
        }),
      ),
    ).rejects.toThrow("Not Found");
  });

  it("COPY duplicates file to Destination", async () => {
    const storage = new MemoryStorage().addFile("original.txt", "copy me");
    const kind = new FileSystemKind({ storage, writable: true });

    const resource = resolveResource(kind, ["original.txt"], "/original.txt")!;
    const ctx = makeCtx({
      method: "COPY",
      path: "/original.txt",
      headers: { destination: "http://localhost/copied.txt" },
    });
    await resource.copy(ctx);

    const copy = await storage.read("copied.txt");
    expect(copy).not.toBeNull();
    expect(
      typeof copy!.content === "string"
        ? copy!.content
        : new TextDecoder().decode(copy!.content as Uint8Array),
    ).toBe("copy me");
    expect(await storage.stat("original.txt")).not.toBeNull();
  });

  it("MOVE relocates file to Destination", async () => {
    const storage = new MemoryStorage().addFile("old.txt", "move me");
    const kind = new FileSystemKind({ storage, writable: true });

    const resource = resolveResource(kind, ["old.txt"], "/old.txt")!;
    const ctx = makeCtx({
      method: "MOVE",
      path: "/old.txt",
      headers: { destination: "http://localhost/new.txt" },
    });
    await resource.move(ctx);

    expect(await storage.stat("old.txt")).toBeNull();
    const moved = await storage.read("new.txt");
    expect(moved).not.toBeNull();
    expect(
      typeof moved!.content === "string"
        ? moved!.content
        : new TextDecoder().decode(moved!.content as Uint8Array),
    ).toBe("move me");
  });

  it("COPY returns 400 without Destination header", async () => {
    const storage = new MemoryStorage().addFile("file.txt", "data");
    const kind = new FileSystemKind({ storage, writable: true });

    const resource = resolveResource(kind, ["file.txt"], "/file.txt")!;
    try {
      await resource.copy(makeCtx({ method: "COPY", path: "/dav/file.txt" }));
      expect.fail("Should throw 400");
    } catch (err) {
      expect(isHttpError(err)).toBe(true);
      if (isHttpError(err)) expect(err.status).toBe(400);
    }
  });

  it("LOCK returns structured lock data with token", async () => {
    const storage = new MemoryStorage().addFile("lock.txt", "data");
    const kind = new FileSystemKind({ storage, writable: true });

    const resource = resolveResource(kind, ["lock.txt"], "/lock.txt");
    const result = await resource!.lock(
      makeCtx({ method: "LOCK", path: "/dav/lock.txt" }),
    );

    const data = (
      result as { content: { type: string; token: string; lockRoot: string } }
    ).content;
    expect(data.type).toBe("webdav-lock");
    expect(data.token).toContain("opaquelocktoken:");
    expect(data.lockRoot).toBe("/dav/lock.txt");
    expect((result as { meta: { type?: string } }).meta.type).toBe(
      "application/xml; charset=utf-8",
    );
  });

  it("UNLOCK always succeeds", async () => {
    const kind = new FileSystemKind({
      storage: new MemoryStorage(),
      writable: true,
    });
    const resource = resolveResource(kind, ["file.txt"], "/file.txt")!;
    const result = await resource.unlock(
      makeCtx({ method: "UNLOCK", path: "/dav/file.txt" }),
    );
    expect((result as { content: null }).content).toBeNull();
  });

  it("GET still works (inherited from FileSystemResource)", async () => {
    const storage = new MemoryStorage().addFile(
      "read.txt",
      "hello",
      "text/plain",
    );
    const kind = new FileSystemKind({ storage, writable: true });

    const resource = resolveResource(kind, ["read.txt"], "/read.txt")!;
    const result = await resource.get(
      makeCtx({ method: "GET", path: "/dav/read.txt" }),
    );
    expect((result as { content: string }).content).toBe("hello");
  });

  it("non-IANA methods are not on the resource (server returns 405)", () => {
    const kind = new FileSystemKind({
      storage: new MemoryStorage(),
      writable: true,
    });
    const resource = resolveResource(kind, ["file.txt"], "/file.txt")!;
    // "brew" is not an IANA method, so it's not a named method on Resource
    expect("brew" in resource).toBe(false);
  });

  it("unsupported IANA methods throw 405", async () => {
    const kind = new FileSystemKind({
      storage: new MemoryStorage(),
      writable: true,
    });
    const resource = resolveResource(kind, ["file.txt"], "/file.txt")!;
    // SEARCH is an IANA method but DavFileSystemResource doesn't override it
    try {
      await resource.search(
        makeCtx({ method: "SEARCH", path: "/dav/file.txt" }),
      );
      expect.fail("Should throw 405");
    } catch (err) {
      expect(isHttpError(err)).toBe(true);
      if (isHttpError(err)) expect(err.status).toBe(405);
    }
  });
});

describe("FileSystemKind (read-only)", () => {
  it("does not expose WebDAV methods", () => {
    const kind = new FileSystemKind({ storage: new MemoryStorage() });
    const resource = kind.resolve({ path: "" });
    const methods = resource.allowedMethods();
    expect(methods).toContain("GET");
    expect(methods).not.toContain("PUT");
    expect(methods).not.toContain("DELETE");
    expect(methods).not.toContain("PROPFIND");
  });

  it("GET works for files", async () => {
    const storage = new MemoryStorage().addFile(
      "read.txt",
      "hello",
      "text/plain",
    );
    const kind = new FileSystemKind({ storage });

    const resource = resolveResource(kind, ["read.txt"], "/read.txt")!;
    const result = await resource.get(
      makeCtx({ method: "GET", path: "/assets/read.txt" }),
    );
    expect((result as { content: string }).content).toBe("hello");
  });
});
