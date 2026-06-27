/**
 * @module filesystem
 * FileSystemKind — unified file serving with optional WebDAV support.
 *
 * Merges the former StaticKind, FileSystemKind, and DavKind into one
 * config-driven Kind. The `writable` flag toggles WebDAV methods.
 *
 * - Read-only mode (default): GET/HEAD file serving, directory listing, ranges
 * - Writable mode: adds PUT, DELETE, PROPFIND, MKCOL, COPY, MOVE, LOCK, UNLOCK
 *
 * Storage is determined by config — no storage classes are exposed:
 * - `root`: local filesystem (Node.js), always full read/write at the storage level
 * - `resolver`: Edge-compatible resolver function (always read-only)
 * - `storage`: custom {@link FileSystemStorage} implementation (for testing/S3/etc.)
 *
 * @example
 * ```ts
 * // Read-only static files
 * site({ "assets/": new FileSystemKind({ root: "./public" }) })
 *
 * // WebDAV-enabled
 * site({ "dav/": new FileSystemKind({ root: "./data", writable: true }) })
 *
 * // Edge-compatible
 * site({ "assets/": new FileSystemKind({ resolver: myResolver }) })
 * ```
 */

import {
  ResourceKind,
  ReadOnlyResource,
  type StaticResolver,
  type Repr,
  type PartialContent,
  type Schema,
  type RequestContext,
  HttpError,
} from "@takanashi/rikka-site";

// ---------------------------------------------------------------------------
// Path sanitization (filesystem-specific)
// ---------------------------------------------------------------------------

/**
 * Normalize a request path into a safe relative path.
 * Rejects traversal outside the mount point (throws 403).
 */
function sanitizePath(raw: string): string {
  const parts = raw.replace(/^\//, "").split("/").filter(Boolean);
  const safe: string[] = [];
  for (const part of parts) {
    if (part === "..") {
      if (safe.length === 0) throw new HttpError(403, "Forbidden");
      safe.pop();
    } else if (part !== ".") {
      safe.push(part);
    }
  }
  return safe.join("/");
}

// ---------------------------------------------------------------------------
// Storage interfaces (exported for custom implementations)
// ---------------------------------------------------------------------------

export interface FileStat {
  size: number;
  modified: Date;
  isDirectory: boolean;
  etag?: string;
}

export interface DirectoryEntry {
  name: string;
  size: number;
  modified: Date;
  isDirectory: boolean;
}

/**
 * Read-only storage backend interface.
 * Implement this to connect any storage (local FS, S3, in-memory, ...).
 * All paths are relative to the mount point, without leading `/`.
 */
export interface FileSystemStorage {
  stat(path: string): Promise<FileStat | null>;
  read(path: string): Promise<{ content: string | Uint8Array } | null>;
  list(path: string): Promise<DirectoryEntry[] | null>;
}

/**
 * Storage backend with write operations — required for WebDAV mode.
 */
export interface WritableFileSystemStorage extends FileSystemStorage {
  write(path: string, content: string | Uint8Array): Promise<void>;
  createDirectory(path: string): Promise<void>;
  remove(path: string): Promise<void>;
  copy(from: string, to: string): Promise<void>;
  move(from: string, to: string): Promise<void>;
}

/**
 * Type guard: does `storage` implement {@link WritableFileSystemStorage}?
 * Used in the constructor (fail-fast) and in `resolve()` (type narrowing)
 * so the writable storage reference passed to `DavFileSystemResource` is
 * runtime-verified rather than relying on caller discipline alone.
 */
function isWritableStorage(
  storage: FileSystemStorage | WritableFileSystemStorage,
): storage is WritableFileSystemStorage {
  const s = storage;
  return (
    "write" in s &&
    typeof s.write === "function" &&
    typeof s.createDirectory === "function" &&
    typeof s.remove === "function" &&
    typeof s.copy === "function" &&
    typeof s.move === "function"
  );
}

// ---------------------------------------------------------------------------
// Schemas for structured data returned by FileSystemResource methods.
// The resource layer returns structured data; transformers in transform.ts
// render it to HTML/XML/JSON. These schemas describe the data shape so the
// transformer pipeline can select the right transformer.
// ---------------------------------------------------------------------------

/** Schema for directory-listing data returned by FileSystemResource.content() */
const directoryListingSchema: Schema = {
  type: "object",
  properties: {
    type: { type: "string" },
    path: { type: "string" },
    entries: { type: "array", items: { type: "object" } },
  },
};

/** Schema for WebDAV PROPFIND multistatus data */
const webdavMultistatusSchema: Schema = {
  type: "object",
  properties: {
    type: { type: "string" },
    entries: { type: "array", items: { type: "object" } },
  },
};

/** Schema for WebDAV LOCK data */
const webdavLockSchema: Schema = {
  type: "object",
  properties: {
    type: { type: "string" },
    token: { type: "string" },
  },
};

// ---------------------------------------------------------------------------
// Internal storage backends (not exported)
// ---------------------------------------------------------------------------

/**
 * Local filesystem storage with full read/write support (Node.js only).
 * Merges the former LocalFileSystemStorage + LocalDavStorage.
 */
class LocalStorage implements WritableFileSystemStorage {
  constructor(private root: string) {}

  private async resolveSafe(path: string): Promise<string> {
    const nodePath = await import(/* webpackIgnore: true */ "node:path");
    const resolvedRoot = nodePath.resolve(this.root);
    const filePath = nodePath.resolve(resolvedRoot, path);
    if (
      !filePath.startsWith(resolvedRoot + nodePath.sep) &&
      filePath !== resolvedRoot
    ) {
      throw new HttpError(403, "Forbidden");
    }
    return filePath;
  }

  async stat(path: string): Promise<FileStat | null> {
    const nodeFs = await import(/* webpackIgnore: true */ "node:fs/promises");
    try {
      const filePath = await this.resolveSafe(path);
      const s = await nodeFs.stat(filePath);
      return {
        size: s.size,
        modified: s.mtime,
        isDirectory: s.isDirectory(),
      };
    } catch {
      return null;
    }
  }

  async read(path: string): Promise<{ content: string | Uint8Array } | null> {
    const nodeFs = await import(/* webpackIgnore: true */ "node:fs/promises");
    try {
      const filePath = await this.resolveSafe(path);
      const buffer = await nodeFs.readFile(filePath);
      return {
        content: new Uint8Array(
          buffer.buffer,
          buffer.byteOffset,
          buffer.byteLength,
        ),
      };
    } catch {
      return null;
    }
  }

  async list(path: string): Promise<DirectoryEntry[] | null> {
    const nodePath = await import(/* webpackIgnore: true */ "node:path");
    const nodeFs = await import(/* webpackIgnore: true */ "node:fs/promises");
    try {
      const dirPath = await this.resolveSafe(path);
      const entries = await nodeFs.readdir(dirPath, { withFileTypes: true });
      const result: DirectoryEntry[] = [];
      for (const entry of entries) {
        const fullPath = nodePath.join(dirPath, entry.name);
        const s = await nodeFs.stat(fullPath);
        result.push({
          name: entry.name,
          size: s.size,
          modified: s.mtime,
          isDirectory: s.isDirectory(),
        });
      }
      return result;
    } catch {
      return null;
    }
  }

  async write(path: string, content: string | Uint8Array): Promise<void> {
    const nodePath = await import(/* webpackIgnore: true */ "node:path");
    const nodeFs = await import(/* webpackIgnore: true */ "node:fs/promises");
    const filePath = await this.resolveSafe(path);
    const parent = nodePath.dirname(filePath);
    await nodeFs.mkdir(parent, { recursive: true });
    if (typeof content === "string") {
      await nodeFs.writeFile(filePath, content, "utf-8");
    } else {
      await nodeFs.writeFile(filePath, content);
    }
  }

  async createDirectory(path: string): Promise<void> {
    const nodeFs = await import(/* webpackIgnore: true */ "node:fs/promises");
    const dirPath = await this.resolveSafe(path);
    await nodeFs.mkdir(dirPath, { recursive: true });
  }

  async remove(path: string): Promise<void> {
    const nodeFs = await import(/* webpackIgnore: true */ "node:fs/promises");
    const targetPath = await this.resolveSafe(path);
    const s = await nodeFs.stat(targetPath);
    if (s.isDirectory()) {
      await nodeFs.rm(targetPath, { recursive: true });
    } else {
      await nodeFs.unlink(targetPath);
    }
  }

  async copy(from: string, to: string): Promise<void> {
    const nodePath = await import(/* webpackIgnore: true */ "node:path");
    const nodeFs = await import(/* webpackIgnore: true */ "node:fs/promises");
    const srcPath = await this.resolveSafe(from);
    const dstPath = await this.resolveSafe(to);
    const s = await nodeFs.stat(srcPath);
    await nodeFs.mkdir(nodePath.dirname(dstPath), { recursive: true });
    if (s.isDirectory()) {
      await copyDir(nodeFs, nodePath, srcPath, dstPath);
    } else {
      await nodeFs.copyFile(srcPath, dstPath);
    }
  }

  async move(from: string, to: string): Promise<void> {
    const nodePath = await import(/* webpackIgnore: true */ "node:path");
    const nodeFs = await import(/* webpackIgnore: true */ "node:fs/promises");
    const srcPath = await this.resolveSafe(from);
    const dstPath = await this.resolveSafe(to);
    await nodeFs.mkdir(nodePath.dirname(dstPath), { recursive: true });
    await nodeFs.rename(srcPath, dstPath);
  }
}

async function copyDir(
  nodeFs: typeof import("node:fs/promises"),
  nodePath: typeof import("node:path"),
  src: string,
  dst: string,
): Promise<void> {
  await nodeFs.mkdir(dst, { recursive: true });
  const entries = await nodeFs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = nodePath.join(src, entry.name);
    const dstPath = nodePath.join(dst, entry.name);
    if (entry.isDirectory()) {
      await copyDir(nodeFs, nodePath, srcPath, dstPath);
    } else {
      await nodeFs.copyFile(srcPath, dstPath);
    }
  }
}

/**
 * Adapter wrapping a {@link StaticResolver} as a {@link FileSystemStorage}.
 * Limited: no real `stat` (fakes it via `read`), no `list` (returns null).
 */
class ResolverStorage implements FileSystemStorage {
  constructor(private resolver: StaticResolver) {}

  async stat(path: string): Promise<FileStat | null> {
    const result = await this.resolver(path);
    if (!result) return null;
    const content = result.content;
    const size =
      typeof content === "string" ? content.length : content.byteLength;
    return {
      size,
      modified: new Date(),
      isDirectory: false,
    };
  }

  async read(path: string): Promise<{ content: string | Uint8Array } | null> {
    const result = await this.resolver(path);
    if (!result) return null;
    return { content: result.content };
  }

  async list(): Promise<DirectoryEntry[] | null> {
    return null;
  }
}

// ---------------------------------------------------------------------------
// FileSystemKind — unified, config-driven
// ---------------------------------------------------------------------------

export interface FileSystemKindOptions {
  /** Root directory for local filesystem (Node.js). */
  root?: string;
  /** Edge-compatible resolver. When provided, `root` is ignored. */
  resolver?: StaticResolver;
  /** Custom storage backend (overrides `root`/`resolver`). */
  storage?: FileSystemStorage;
  /** Enable write operations (WebDAV). Default: `false`.
   *  Ignored when `resolver` is the backend (always read-only). */
  writable?: boolean;
  /** Index file for directory requests (default: `"index.html"`). */
  index?: string;
  /** Enable directory listing when index file not found (default: `true`). */
  listDirectories?: boolean;
}

/**
 * FileSystemKind — unified file serving with optional WebDAV.
 *
 * Catch-all `:path*` consumes all remaining segments into `params.path`.
 *
 * When `writable` is `true`, the resource overrides WebDAV methods
 * (PUT, DELETE, PROPFIND, MKCOL, COPY, MOVE, LOCK, UNLOCK).
 * {@link Resource.allowedMethods} auto-detects the overrides.
 */
export class FileSystemKind extends ResourceKind {
  readonly storage: FileSystemStorage;
  readonly writable: boolean;
  readonly indexFile: string;
  readonly listDirectories: boolean;

  override children: { [key: string]: FileSystemKind } = { ":path*": this };

  constructor(options: FileSystemKindOptions) {
    super();
    const resolverBacked = !!options.resolver;
    if (options.storage) {
      this.storage = options.storage;
    } else if (resolverBacked) {
      this.storage = new ResolverStorage(options.resolver!);
    } else if (options.root !== undefined) {
      this.storage = new LocalStorage(options.root);
    } else {
      throw new TypeError(
        "FileSystemKind requires `root`, `resolver`, or `storage`.",
      );
    }
    // resolver-backed storage is always read-only; `writable` is ignored.
    // Otherwise honour the flag, but verify the storage actually implements
    // WritableFileSystemStorage so the assertion in resolve() is safe.
    if (resolverBacked) {
      this.writable = false;
    } else {
      this.writable = options.writable ?? false;
      if (this.writable && !isWritableStorage(this.storage)) {
        throw new TypeError(
          "FileSystemKind: `writable: true` requires a WritableFileSystemStorage " +
            "(use `root`, or a `storage` that implements write/createDirectory/remove/copy/move).",
        );
      }
    }
    this.indexFile = options.index ?? "index.html";
    this.listDirectories = options.listDirectories ?? true;
  }

  resolve(params: Record<string, string>): FileSystemResource {
    if (this.writable) {
      const storage = this.storage;
      if (!isWritableStorage(storage)) {
        throw new TypeError(
          "FileSystemKind: `writable: true` requires a WritableFileSystemStorage",
        );
      }
      return new DavFileSystemResource(params, this, storage);
    }
    return new FileSystemResource(params, this);
  }
}

// ---------------------------------------------------------------------------
// FileSystemResource — read-only (GET/HEAD via content())
// ---------------------------------------------------------------------------

/**
 * Read-only file resource. Serves file content, directory listings,
 * and supports range requests.
 */
export class FileSystemResource extends ReadOnlyResource {
  constructor(
    params: Record<string, string>,
    protected kind: FileSystemKind,
  ) {
    super();
    this.params = params;
  }

  async content(ctx: RequestContext): Promise<Repr> {
    const rawPath = this.params.path ?? "";
    const hasTrailingSlash = this.path.endsWith("/");

    let relativePath: string;
    try {
      relativePath = sanitizePath(rawPath);
    } catch {
      throw new HttpError(403, "Forbidden");
    }

    const stat = await this.kind.storage.stat(relativePath);

    // Fallback for storage backends that can't stat directories (e.g. resolver):
    // if stat fails but the path looks like a directory, try the index file.
    if (!stat && (relativePath === "" || hasTrailingSlash)) {
      const indexPath = relativePath
        ? `${relativePath}/${this.kind.indexFile}`
        : this.kind.indexFile;
      const indexResult = await this.kind.storage.read(indexPath);
      if (indexResult) {
        return { content: indexResult.content, meta: {} };
      }
    }

    if (!stat) throw new HttpError(404, "Not Found");

    // Directory handling
    if (stat.isDirectory) {
      if (!hasTrailingSlash) {
        throw new HttpError(301, "Moved Permanently", undefined, {
          Location: `${this.path}/`,
        });
      }

      // Try index file first
      const indexPath = relativePath
        ? `${relativePath}/${this.kind.indexFile}`
        : this.kind.indexFile;
      const indexResult = await this.kind.storage.read(indexPath);
      if (indexResult) {
        return { content: indexResult.content, meta: {} };
      }

      // Directory listing — return structured data for the transformer pipeline
      if (this.kind.listDirectories) {
        const entries = await this.kind.storage.list(relativePath);
        if (entries) {
          this.schema = directoryListingSchema;
          return {
            content: {
              type: "directory-listing",
              path: relativePath,
              entries,
            },
            meta: {},
          };
        }
      }

      throw new HttpError(404, "Not Found");
    }

    // File serving — return raw content; the server guesses MIME from the path
    const result = await this.kind.storage.read(relativePath);
    if (!result) throw new HttpError(404, "Not Found");

    // Range request support
    if (
      ctx.range &&
      ctx.range.unit === "bytes" &&
      ctx.range.ranges.length > 0
    ) {
      const content = result.content;
      const total =
        typeof content === "string" ? content.length : content.byteLength;
      const range = ctx.range.ranges[0];
      const start =
        range.start ?? (range.end !== undefined ? total - range.end : 0);
      const end = range.end ?? total - 1;

      if (start >= total || end >= total) {
        throw new HttpError(416, "Range Not Satisfiable");
      }

      const sliced =
        typeof content === "string"
          ? content.slice(start, end + 1)
          : content.slice(start, end + 1);

      const partial: PartialContent = {
        unit: "bytes",
        data: [[start, sliced]],
        total,
      };

      return { content: partial, meta: {} };
    }

    return { content: result.content, meta: {} };
  }
}

// ---------------------------------------------------------------------------
// DavFileSystemResource — read-write (adds WebDAV methods)
// ---------------------------------------------------------------------------

/**
 * Writable file resource. Extends {@link FileSystemResource} with WebDAV
 * methods. Created when `writable: true`.
 */
export class DavFileSystemResource extends FileSystemResource {
  private readonly writableStorage: WritableFileSystemStorage;

  constructor(
    params: Record<string, string>,
    kind: FileSystemKind,
    writableStorage: WritableFileSystemStorage,
  ) {
    super(params, kind);
    this.writableStorage = writableStorage;
  }

  // --- PUT: upload file content ---
  async put(ctx: RequestContext): Promise<Repr> {
    const relativePath = this.getRelativePath();
    const body = await ctx.bytes();
    await this.writableStorage.write(relativePath, body);
    return { content: null, meta: {} };
  }

  // --- DELETE: remove file or directory ---
  async delete(ctx: RequestContext): Promise<Repr> {
    const relativePath = this.getRelativePath();
    const stat = await this.writableStorage.stat(relativePath);
    if (!stat) throw new HttpError(404, "Not Found");
    await this.writableStorage.remove(relativePath);
    return { content: null, meta: {} };
  }

  // --- PROPFIND: retrieve properties ---
  async propfind(ctx: RequestContext): Promise<Repr> {
    const relativePath = this.getRelativePath();
    const depth = this.parseDepth(ctx);
    const stat = await this.writableStorage.stat(relativePath);
    if (!stat) throw new HttpError(404, "Not Found");

    const responses: PropfindEntry[] = [];
    await this.collectPropfindEntries(
      relativePath,
      this.path,
      stat,
      depth,
      0,
      responses,
    );

    this.schema = webdavMultistatusSchema;
    return {
      content: {
        type: "webdav-multistatus",
        entries: responses,
      },
      meta: { type: "application/xml; charset=utf-8" },
    };
  }

  // --- MKCOL: create directory ---
  async mkcol(ctx: RequestContext): Promise<Repr> {
    const relativePath = this.getRelativePath();
    const existing = await this.writableStorage.stat(relativePath);
    if (existing) throw new HttpError(405, "Method Not Allowed");
    await this.writableStorage.createDirectory(relativePath);
    return { content: null, meta: {} };
  }

  // --- COPY: copy resource to Destination ---
  async copy(ctx: RequestContext): Promise<Repr> {
    return this.doCopyOrMove(ctx, "copy");
  }

  // --- MOVE: move resource to Destination ---
  async move(ctx: RequestContext): Promise<Repr> {
    return this.doCopyOrMove(ctx, "move");
  }

  // --- LOCK: stub (non-functional) ---
  // Returns a random lock token but does NOT actually lock the resource.
  // Concurrent writers are not serialized; the token is not recorded.
  // This is a minimal implementation for WebDAV protocol compliance —
  // clients that require real mutual-exclusion should not rely on it.
  async lock(ctx: RequestContext): Promise<Repr> {
    const relativePath = this.getRelativePath();
    const stat = await this.writableStorage.stat(relativePath);
    if (!stat) throw new HttpError(404, "Not Found");

    const token = `opaquelocktoken:${crypto.randomUUID()}`;
    this.schema = webdavLockSchema;
    return {
      content: {
        type: "webdav-lock",
        token,
        lockRoot: ctx.path,
      },
      meta: { type: "application/xml; charset=utf-8" },
    };
  }

  // --- UNLOCK: stub (always succeeds) ---
  // Always returns success without validating the lock token, because no
  // locks are actually held. See `lock()` above.
  async unlock(_ctx: RequestContext): Promise<Repr> {
    return { content: null, meta: {} };
  }

  // --- Helpers ---

  private getRelativePath(): string {
    const rawPath = this.params.path ?? "";
    try {
      return sanitizePath(rawPath);
    } catch {
      throw new HttpError(403, "Forbidden");
    }
  }

  private parseDepth(ctx: RequestContext): number {
    const depth = ctx.headers["depth"] ?? "1";
    if (depth === "0") return 0;
    if (depth === "1") return 1;
    if (depth === "infinity") return Infinity;
    return 1;
  }

  private async collectPropfindEntries(
    relativePath: string,
    urlPath: string,
    stat: FileStat,
    depth: number,
    currentDepth: number,
    out: PropfindEntry[],
  ): Promise<void> {
    out.push({
      href: urlPath,
      isDirectory: stat.isDirectory,
      size: stat.size,
      modified: stat.modified,
    });

    if (stat.isDirectory && currentDepth < depth) {
      const entries = await this.writableStorage.list(relativePath);
      if (entries) {
        for (const entry of entries) {
          const childRel = relativePath
            ? `${relativePath}/${entry.name}`
            : entry.name;
          const childUrl = urlPath.endsWith("/")
            ? `${urlPath}${entry.name}`
            : `${urlPath}/${entry.name}`;
          await this.collectPropfindEntries(
            childRel,
            childUrl,
            {
              size: entry.size,
              modified: entry.modified,
              isDirectory: entry.isDirectory,
            },
            depth,
            currentDepth + 1,
            out,
          );
        }
      }
    }
  }

  private async doCopyOrMove(
    ctx: RequestContext,
    op: "copy" | "move",
  ): Promise<Repr> {
    const destination = ctx.headers["destination"];
    if (!destination)
      throw new HttpError(400, "Bad Request", "Destination header required");

    const destPath = this.parseDestination(destination);
    if (!destPath)
      throw new HttpError(400, "Bad Request", "Invalid Destination header");

    const srcPath = this.getRelativePath();
    const srcStat = await this.writableStorage.stat(srcPath);
    if (!srcStat) throw new HttpError(404, "Not Found");

    const overwrite = (ctx.headers["overwrite"] ?? "T").toUpperCase();
    const destStat = await this.writableStorage.stat(destPath);
    if (destStat && overwrite === "F") {
      throw new HttpError(412, "Precondition Failed");
    }

    if (op === "copy") {
      await this.writableStorage.copy(srcPath, destPath);
    } else {
      await this.writableStorage.move(srcPath, destPath);
    }

    return { content: null, meta: {} };
  }

  private parseDestination(destination: string): string | null {
    try {
      const url = new URL(destination, "http://_placeholder");
      let destPath = url.pathname;

      // Compute mount prefix by subtracting params.path from this.path.
      const relPath = this.params.path ?? "";
      const mountPrefix = relPath
        ? this.path.slice(0, this.path.length - relPath.length)
        : this.path;

      if (mountPrefix && destPath.startsWith(mountPrefix)) {
        destPath = destPath.slice(mountPrefix.length);
      }

      return sanitizePath(destPath);
    } catch {
      return null;
    }
  }
}

// ---------------------------------------------------------------------------
// PROPFIND entry — data shape for WebDAV multistatus responses
// ---------------------------------------------------------------------------

interface PropfindEntry {
  href: string;
  isDirectory: boolean;
  size: number;
  modified: Date;
  mimeType?: string;
}
