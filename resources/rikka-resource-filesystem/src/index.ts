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
import {
  parseDasl,
  evalWhere,
  applyOrderby,
  type DaslEntry,
  type DaslSearch,
} from "./dasl.js";

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
// WebDAV lock store (in-memory, per FileSystemKind instance)
// ---------------------------------------------------------------------------

/** A single active WebDAV lock. */
interface WebDAVLock {
  /** The opaque lock token (e.g. `opaquelocktoken:...`). */
  token: string;
  /** Owner description (raw LOCK request body or "anonymous"). */
  owner: string;
  /** Expiration timestamp (epoch ms). */
  expires: number;
}

/**
 * Simple in-memory WebDAV lock store.
 *
 * Locks are keyed by the sanitized resource path and shared across all
 * per-request {@link DavFileSystemResource} instances belonging to the same
 * {@link FileSystemKind}. Locks expire automatically (default 5 minutes);
 * expired entries are swept on every acquire/release call.
 *
 * This is a best-effort implementation suitable for single-process servers.
 * It does NOT coordinate across multiple server processes or machines.
 */
class LockStore {
  private locks = new Map<string, WebDAVLock>();
  private static readonly DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;

  /** Remove expired locks. Called on every acquire/release. */
  cleanup(): void {
    const now = Date.now();
    for (const [key, lock] of this.locks) {
      if (lock.expires <= now) {
        this.locks.delete(key);
      }
    }
  }

  /**
   * Acquire (or refresh) a lock on `path`. Returns the new lock.
   * An existing unexpired lock on the same path is replaced.
   */
  acquire(
    path: string,
    owner: string,
    timeoutMs: number = LockStore.DEFAULT_TIMEOUT_MS,
  ): WebDAVLock {
    this.cleanup();
    const token = `opaquelocktoken:${crypto.randomUUID()}`;
    const lock: WebDAVLock = {
      token,
      owner,
      expires: Date.now() + timeoutMs,
    };
    this.locks.set(path, lock);
    return lock;
  }

  /**
   * Release the lock on `path`.
   * @throws 404 if no lock exists for `path`.
   * @throws 409 if `token` does not match the stored lock token.
   */
  release(path: string, token: string | undefined): void {
    this.cleanup();
    const lock = this.locks.get(path);
    if (!lock) {
      throw new HttpError(404, "Not Found", "No lock exists for this resource");
    }
    if (!token || lock.token !== token) {
      throw new HttpError(409, "Conflict", "Lock token does not match");
    }
    this.locks.delete(path);
  }
}

// ---------------------------------------------------------------------------
// Internal storage backends (not exported)
// ---------------------------------------------------------------------------

/**
 * Local filesystem storage with full read/write support (Node.js only).
 * Merges the former LocalFileSystemStorage + LocalDavStorage.
 */
class LocalStorage implements WritableFileSystemStorage {
  constructor(private root: string) {}

  /**
   * Cached real (symlink-resolved) root path. `nodePath.resolve` does NOT
   * resolve symlinks, so a symlink inside the root pointing to `/etc/passwd`
   * would pass a naive `startsWith` containment check. We resolve the root
   * with `fs.realpath` once and cache it.
   */
  private realRootPromise: Promise<string> | null = null;

  private getRealRoot(): Promise<string> {
    if (this.realRootPromise === null) {
      this.realRootPromise = (async () => {
        const nodePath = await import(/* webpackIgnore: true */ "node:path");
        const nodeFs = await import(/* webpackIgnore: true */ "node:fs/promises");
        const resolvedRoot = nodePath.resolve(this.root);
        try {
          return await nodeFs.realpath(resolvedRoot);
        } catch {
          // Root doesn't exist yet — fall back to the resolved (non-real) path.
          return resolvedRoot;
        }
      })();
    }
    return this.realRootPromise;
  }

  private async resolveSafe(path: string): Promise<string> {
    const nodePath = await import(/* webpackIgnore: true */ "node:path");
    const nodeFs = await import(/* webpackIgnore: true */ "node:fs/promises");
    const realRoot = await this.getRealRoot();
    const resolvedRoot = nodePath.resolve(this.root);
    const filePath = nodePath.resolve(resolvedRoot, path);

    // Resolve symlinks for the containment check. We return `filePath`
    // (not `realPath`) so operations like remove() act on the symlink itself
    // rather than its target.
    let realPath: string;
    try {
      realPath = await nodeFs.realpath(filePath);
    } catch {
      // Target doesn't exist yet (PUT/MKCOL to a new file). Resolve the
      // parent directory and re-append the basename to verify containment.
      const parent = nodePath.dirname(filePath);
      const base = nodePath.basename(filePath);
      try {
        const realParent = await nodeFs.realpath(parent);
        realPath = nodePath.join(realParent, base);
      } catch {
        // Parent doesn't exist either — fall back to the resolved path;
        // the containment check below still applies.
        realPath = filePath;
      }
    }

    if (
      !realPath.startsWith(realRoot + nodePath.sep) &&
      realPath !== realRoot
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
  /** In-memory WebDAV lock store. Shared by all resources of this Kind. */
  readonly lockStore: LockStore;

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
    this.lockStore = new LockStore();
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
      // HTTP byte ranges operate on bytes, not UTF-16 code units. For string
      // content, encode to bytes first so all range math is byte-accurate
      // (multi-byte characters would otherwise be split incorrectly).
      const bytes =
        typeof content === "string"
          ? new TextEncoder().encode(content)
          : content;
      const total = bytes.byteLength;
      const range = ctx.range.ranges[0];
      const start =
        range.start ?? (range.end !== undefined ? total - range.end : 0);
      const end = range.end ?? total - 1;

      if (start >= total || end >= total || start > end) {
        throw new HttpError(416, "Range Not Satisfiable");
      }

      const sliced = bytes.slice(start, end + 1);

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

  // --- LOCK: acquire a WebDAV lock on the resource ---
  // Stores the lock token in the Kind's in-memory lock store so that
  // subsequent UNLOCK requests can be validated. The token is returned in
  // the response body and the `Lock-Token` header (RFC 4918 Coded-URL form).
  async lock(ctx: RequestContext): Promise<Repr> {
    const relativePath = this.getRelativePath();
    const stat = await this.writableStorage.stat(relativePath);
    if (!stat) throw new HttpError(404, "Not Found");

    // The LOCK request body carries the owner info; use it (or default).
    const owner = (await ctx.text()) || "anonymous";
    const lock = this.kind.lockStore.acquire(relativePath, owner);
    this.schema = webdavLockSchema;
    return {
      content: {
        type: "webdav-lock",
        token: lock.token,
        lockRoot: ctx.path,
      },
      meta: {
        type: "application/xml; charset=utf-8",
        headers: { "Lock-Token": `<${lock.token}>` },
      },
    };
  }

  // --- UNLOCK: release a WebDAV lock ---
  // Extracts the `Lock-Token` header (RFC 4918 Coded-URL form `<...>`),
  // validates it against the stored lock for this resource path, and deletes
  // the lock entry. Returns 404 if no lock exists, 409 if the token mismatches.
  async unlock(ctx: RequestContext): Promise<Repr> {
    const relativePath = this.getRelativePath();
    const rawToken = ctx.headers["lock-token"];
    // Strip the Coded-URL angle brackets: <opaquelocktoken:...> → opaquelocktoken:...
    const match = rawToken?.match(/^<(.+)>$/);
    const token = match ? match[1] : rawToken;
    this.kind.lockStore.release(relativePath, token);
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

  // --- QUERY (RFC 10008) and SEARCH (RFC 5323) ---
  //
  // Both methods accept a DASL XML body (RFC 5323) and route through the
  // same execution path. SEARCH is the original DASL transport; QUERY is
  // the newer generic query method that uses `Accept-Query` for content-type
  // negotiation. `Accept-Query` advertises `application/dasl+xml` only —
  // callers needing other formats can override `query()`.

  /**
   * Content types accepted for the QUERY method body. Advertised via the
   * `Accept-Query` response header (RFC 10008). DAV resources accept DASL
   * XML only.
   */
  supportedQueryTypes(): string[] {
    return ["application/dasl+xml"];
  }

  /** QUERY method — apply a DASL search request to this resource. */
  async query(ctx: RequestContext): Promise<Repr> {
    return this.executeDasl(ctx);
  }

  /** SEARCH method — RFC 5323, same DASL XML body as QUERY. */
  async search(ctx: RequestContext): Promise<Repr> {
    return this.executeDasl(ctx);
  }

  private async executeDasl(ctx: RequestContext): Promise<Repr> {
    // Content-Type check. For QUERY we require application/dasl+xml (or +xml
    // suffix). For SEARCH we accept any XML content type (application/xml,
    // text/xml, application/dasl+xml) since SEARCH predates Accept-Query.
    const ct = (ctx.headers["content-type"] ?? "").toLowerCase();
    const isQuery = ctx.method === "QUERY";
    if (isQuery) {
      if (ct && !this.supportedQueryTypes().includes(ct)) {
        throw new HttpError(415, "Unsupported Query Type", undefined, {
          "Accept-Query": this.supportedQueryTypes().join(", "),
        });
      }
    } else {
      const isXml =
        ct === "application/xml" ||
        ct === "text/xml" ||
        ct === "application/dasl+xml" ||
        ct.endsWith("+xml");
      if (ct && !isXml) {
        throw new HttpError(415, "Unsupported Media Type", undefined, {
          Accept: "application/xml, text/xml, application/dasl+xml",
        });
      }
    }

    const xml = await ctx.text();
    let search: DaslSearch;
    try {
      search = parseDasl(xml);
    } catch (err) {
      throw new HttpError(
        400,
        "Bad Request",
        `Invalid DASL XML: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    // Collect candidate entries from each <D:scope>. Multiple scopes union
    // into one candidate set; duplicates (overlapping scopes) are de-duped
    // by storage-relative path.
    const candidates: DaslEntry[] = [];
    const seen = new Set<string>();
    for (const scope of search.from) {
      await this.collectScope(scope, candidates, seen);
    }

    // Apply <D:where>
    let matched = candidates;
    if (search.where) {
      matched = matched.filter((e) => evalWhere(e, search.where!));
    }

    // Apply <D:orderby>
    if (search.orderby && search.orderby.length > 0) {
      matched = applyOrderby(matched, search.orderby);
    }

    // Apply <D:limit><D:nresults>
    if (search.limit != null) {
      matched = matched.slice(0, search.limit);
    }

    this.schema = webdavMultistatusSchema;
    return {
      content: {
        type: "webdav-multistatus",
        entries: matched.map((e) => ({
          href: e.href,
          isDirectory: e.isDirectory,
          size: e.size,
          modified: e.modified,
        })),
      },
      meta: { type: "application/xml; charset=utf-8" },
    };
  }

  /**
   * Collect {@link DaslEntry}s for a single `<D:scope>` into `out`.
   *
   * The scope href is resolved against the current resource's URL: empty or
   * relative hrefs use the current resource path; absolute paths must lie
   * within the same FileSystemKind mount (otherwise 403 — cross-mount search
   * would require resolving through the site tree, which is not supported).
   *
   * Cycle detection: visited storage-relative paths are tracked in `seen`
   * to handle symlinked directories that point back into the tree.
   */
  private async collectScope(
    scope: { href: string; depth: "0" | "1" | "infinity" },
    out: DaslEntry[],
    seen: Set<string>,
  ): Promise<void> {
    const { relativePath, urlPath } = this.resolveScopeHref(scope.href);
    await this.collectEntries(relativePath, urlPath, scope.depth, out, seen);
  }

  /**
   * Recursively collect entries under `relativePath` (storage-relative)
   * rooted at `urlPath` (URL-relative). Self is always included; depth
   * controls how far we descend into subdirectories.
   */
  private async collectEntries(
    relativePath: string,
    urlPath: string,
    depth: "0" | "1" | "infinity",
    out: DaslEntry[],
    seen: Set<string>,
  ): Promise<void> {
    // Cycle detection.
    const visitKey = relativePath || ".";
    if (seen.has(visitKey)) return;
    seen.add(visitKey);

    const stat = await this.writableStorage.stat(relativePath);
    if (!stat) return;

    // Self entry.
    const name = urlPath ? urlPath.split("/").filter(Boolean).pop() ?? "" : "";
    out.push({
      href: urlPath,
      name,
      size: stat.size,
      modified: stat.modified,
      isDirectory: stat.isDirectory,
    });

    if (depth === "0" || !stat.isDirectory) return;

    const entries = await this.writableStorage.list(relativePath);
    if (!entries) return;

    // depth: "1" — collect children at depth 0 (no recursion).
    // depth: "infinity" — recurse with the same depth.
    const childDepth: "0" | "1" | "infinity" =
      depth === "1" ? "0" : "infinity";

    for (const entry of entries) {
      const childRel = relativePath
        ? `${relativePath}/${entry.name}`
        : entry.name;
      const childUrl = urlPath.endsWith("/")
        ? `${urlPath}${entry.name}`
        : `${urlPath}/${entry.name}`;
      await this.collectEntries(childRel, childUrl, childDepth, out, seen);
    }
  }

  /**
   * Resolve a `<D:scope>` `<D:href>` to a storage-relative path and URL path.
   *
   * - Empty href → current resource.
   * - Relative href → resolved against the current resource URL.
   * - Absolute href → must lie within the current FileSystemKind mount;
   *   the mount prefix (computed from `this.path` minus `this.params.path`)
   *   is stripped to produce a storage-relative path. Outside-mount hrefs
   *   throw 403 (cross-mount search is not supported).
   */
  private resolveScopeHref(href: string): {
    relativePath: string;
    urlPath: string;
  } {
    const trimmed = href.trim();
    if (trimmed === "" || trimmed === ".") {
      return { relativePath: this.getRelativePath(), urlPath: this.path };
    }

    // Resolve relative hrefs against the current resource URL.
    let urlPath: string;
    try {
      const url = new URL(trimmed, "http://_placeholder");
      urlPath = url.pathname;
    } catch {
      throw new HttpError(400, "Bad Request", `Invalid scope href: ${href}`);
    }

    // Compute the FileSystemKind mount prefix in URL space.
    const relPath = this.params.path ?? "";
    const mountPrefix = relPath
      ? this.path.slice(0, this.path.length - relPath.length)
      : this.path;

    if (mountPrefix && urlPath.startsWith(mountPrefix)) {
      const rel = sanitizePath(urlPath.slice(mountPrefix.length));
      return { relativePath: rel, urlPath };
    }

    // Outside the mount — not supported.
    throw new HttpError(
      403,
      "Forbidden",
      "DASL scope outside FileSystemKind mount is not supported",
    );
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
