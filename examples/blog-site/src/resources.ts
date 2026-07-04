/**
 * Blog Site — resource definitions.
 *
 * Shared between all platform adapters.
 * Demonstrates all 6 Resource kinds, Schema, Auth, Transformers, and HttpError.
 */

import {
  CollectionKind,
  CollectionResource,
  ItemKind,
  ItemResource,
  SingletonKind,
  SingletonResource,
  ReadOnlyKind,
  ReadOnlyResource,
  ActionKind,
  ActionResource,
  Site,
  HttpError,
  paginate,
  type Transformer,
  type Repr,
  type RequestContext,
  type Schema,
  type StaticResolver,
} from "@takanashi/rikka-site";
import { FileSystemKind } from "@takanashi/rikka-resource-filesystem";
import { elements } from "./elements.js";

// ---------------------------------------------------------------------------
// In-memory data store
// ---------------------------------------------------------------------------

interface Article {
  id: number;
  title: string;
  body: string;
  authorId: number;
  tags: string[];
  createdAt: string;
}

interface Comment {
  id: number;
  articleId: number;
  author: string;
  text: string;
  createdAt: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "author" | "reader";
}

const articles: Article[] = [
  {
    id: 1,
    title: "Hello Rikka",
    body: "Welcome to the rikka framework...",
    authorId: 1,
    tags: ["intro", "rikka"],
    createdAt: "2026-01-15",
  },
  {
    id: 2,
    title: "Signals in Depth",
    body: "Understanding TC39 Signals...",
    authorId: 2,
    tags: ["signals", "reactivity"],
    createdAt: "2026-02-20",
  },
  {
    id: 3,
    title: "Building Custom Elements",
    body: "How to use defineElement...",
    authorId: 1,
    tags: ["elements", "web-components"],
    createdAt: "2026-03-10",
  },
];

const comments: Comment[] = [
  {
    id: 1,
    articleId: 1,
    author: "Bob",
    text: "Great intro!",
    createdAt: "2026-01-16",
  },
  {
    id: 2,
    articleId: 1,
    author: "Carol",
    text: "Looking forward to more",
    createdAt: "2026-01-17",
  },
  {
    id: 3,
    articleId: 2,
    author: "Dave",
    text: "Very clear explanation",
    createdAt: "2026-02-21",
  },
];

const users: User[] = [
  { id: 1, name: "Alice", email: "alice@example.com", role: "admin" },
  { id: 2, name: "Eve", email: "eve@example.com", role: "author" },
];

const settings = { siteName: "Rikka Blog", theme: "dark", postsPerPage: 10 };
let nextArticleId = 4;
let nextCommentId = 4;

const initialArticles: Article[] = articles.map((a) => ({
  ...a,
  tags: [...a.tags],
}));
const initialComments: Comment[] = comments.map((c) => ({ ...c }));
const initialUsers: User[] = users.map((u) => ({ ...u }));
const initialSettings = { ...settings };

/** Reset in-memory data to the initial seeded state (test helper). */
export function resetData(): void {
  articles.length = 0;
  articles.push(...initialArticles.map((a) => ({ ...a, tags: [...a.tags] })));
  comments.length = 0;
  comments.push(...initialComments.map((c) => ({ ...c })));
  users.length = 0;
  users.push(...initialUsers.map((u) => ({ ...u })));
  settings.siteName = initialSettings.siteName;
  settings.theme = initialSettings.theme;
  settings.postsPerPage = initialSettings.postsPerPage;
  nextArticleId = 4;
  nextCommentId = 4;
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function requireFields(
  body: unknown,
  fields: string[],
): Record<string, unknown> {
  if (typeof body !== "object" || body === null) {
    throw new HttpError(400, "Request body must be a JSON object");
  }
  const obj = body as Record<string, unknown>;
  const missing = fields.filter((f) => obj[f] === undefined || obj[f] === null);
  if (missing.length > 0) {
    throw new HttpError(400, `Missing required fields: ${missing.join(", ")}`);
  }
  return obj;
}

function requireString(
  obj: Record<string, unknown>,
  field: string,
  maxLength: number,
): string {
  const val = obj[field];
  if (typeof val !== "string") {
    throw new HttpError(400, `"${field}" must be a string`);
  }
  if (val.length > maxLength) {
    throw new HttpError(
      400,
      `"${field}" must be at most ${maxLength} characters`,
    );
  }
  return val;
}

/**
 * Validate that `obj[field]` (if present) is one of `allowed` values.
 * Returns `defaultValue` when the field is omitted or null.
 * Throws 400 if the field is present but not in the allowed list.
 */
function optionalEnum<T extends string>(
  obj: Record<string, unknown>,
  field: string,
  allowed: readonly T[],
  defaultValue: T,
): T {
  const val = obj[field];
  if (val === undefined || val === null) return defaultValue;
  if (typeof val !== "string" || !allowed.includes(val as T)) {
    throw new HttpError(
      400,
      `"${field}" must be one of: ${allowed.join(", ")}`,
    );
  }
  return val as T;
}

/**
 * Validate that `obj[field]` (if present) is an array of strings, each within
 * `maxLength` characters. Returns `defaultValue` when the field is omitted.
 * Throws 400 if the field is present but not a string array, or if any
 * element is not a string / exceeds the length limit.
 */
function optionalStringArray(
  obj: Record<string, unknown>,
  field: string,
  maxElementLength: number,
  defaultValue: string[] = [],
): string[] {
  const val = obj[field];
  if (val === undefined || val === null) return defaultValue;
  if (!Array.isArray(val)) {
    throw new HttpError(400, `"${field}" must be an array of strings`);
  }
  for (const el of val) {
    if (typeof el !== "string") {
      throw new HttpError(400, `"${field}" must be an array of strings`);
    }
    if (el.length > maxElementLength) {
      throw new HttpError(
        400,
        `"${field}" entries must be at most ${maxElementLength} characters`,
      );
    }
  }
  return val as string[];
}

/**
 * Validate that `obj[field]` (if present) is a finite number `>= min`.
 * Returns `undefined` when the field is omitted (caller decides default).
 */
function optionalFiniteNumber(
  obj: Record<string, unknown>,
  field: string,
  min: number,
): number | undefined {
  const val = obj[field];
  if (val === undefined || val === null) return undefined;
  const n = Number(val);
  if (!Number.isFinite(n) || n < min) {
    throw new HttpError(400, `"${field}" must be a finite number >= ${min}`);
  }
  return n;
}

// ---------------------------------------------------------------------------
// Custom Transformers
// ---------------------------------------------------------------------------

/**
 * Escape a single CSV field per RFC 4180, with formula-injection defense.
 *
 * - Doubles internal double quotes (RFC 4180 §2.7).
 * - Wraps fields containing comma, double quote, CR, or LF in double quotes
 *   (RFC 4180 §2.6/§2.7).
 * - Prefixes values that begin with `=`, `+`, `-`, or `@` with a TAB so
 *   spreadsheet apps (Excel, Sheets, LibreOffice) treat them as text instead
 *   of evaluating them as formulas (CSV formula injection / CWE-1236).
 *   The TAB is preserved on import but renders invisibly in cell views.
 */
function csvEscape(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);
  // Formula-injection defense — guard before any other transformation.
  if (s.length > 0 && /[=+\-@]/.test(s[0]!)) {
    s = `\t${s}`;
  }
  // RFC 4180 §2.7: double any internal double quotes.
  if (s.includes('"')) {
    s = s.replace(/"/g, '""');
  }
  // RFC 4180 §2.6: wrap fields containing comma, quote, CR, or LF.
  if (/[",\r\n]/.test(s)) {
    s = `"${s}"`;
  }
  return s;
}

const csvTransformer: Transformer = {
  input: { type: "array", items: { type: "object" } },
  output: { type: "raw", mime: "text/csv" },
  priority: 5,
  transform(repr: Repr): Repr {
    const data = repr.content;
    if (!Array.isArray(data) || data.length === 0) {
      return { content: "", meta: { type: "text/csv" } };
    }
    const firstRow = data[0] as Record<string, unknown>;
    const headers = Object.keys(firstRow).map(csvEscape).join(",");
    const rows = data.map((row: unknown) =>
      Object.values(row as Record<string, unknown>)
        .map(csvEscape)
        .join(","),
    );
    return {
      content: [headers, ...rows].join("\n"),
      meta: { type: "text/csv" },
    };
  },
};

const textTransformer: Transformer = {
  input: { type: "any" },
  output: { type: "raw", mime: "text/plain" },
  priority: 0,
  transform(repr: Repr, ctx): Repr {
    const data = repr.content;
    const lines: string[] = [];
    lines.push(`Resource: ${ctx.path}`);
    lines.push("---");
    if (Array.isArray(data)) {
      for (const item of data) {
        if (typeof item === "object" && item !== null) {
          lines.push(
            Object.entries(item as Record<string, unknown>)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", "),
          );
        } else {
          lines.push(String(item));
        }
      }
    } else if (typeof data === "object" && data !== null) {
      for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
        lines.push(`${k}: ${v}`);
      }
    } else {
      lines.push(String(data));
    }
    return { content: lines.join("\n"), meta: { type: "text/plain" } };
  },
};

// ---------------------------------------------------------------------------
// Resource definitions
// ---------------------------------------------------------------------------

class SiteRootKind extends ReadOnlyKind {
  element = "blog-home";

  resolve(params: Record<string, string>) {
    const r = new SiteRootResource();
    r.params = params;
    r.element = this.element;
    return r;
  }
}

class SiteRootResource extends ReadOnlyResource {
  schema: Schema = { type: "object" };

  async content(_ctx: RequestContext): Promise<Repr> {
    return {
      content: {
        name: settings.siteName,
        tagline: "A resource-oriented blog built with Rikka",
        articleCount: articles.length,
        userCount: users.length,
        commentCount: comments.length,
        recentArticles: articles
          .slice(-3)
          .reverse()
          .map((a) => ({
            id: a.id,
            title: a.title,
          })),
        links: {
          articles: "/articles",
          users: "/users",
          dashboard: "/dashboard",
          settings: "/settings",
        },
      },
      meta: {},
    };
  }
}

class ArticleCommentKind extends ItemKind {
  resolve(params: Record<string, string>) {
    const r = new ArticleCommentResource();
    r.params = params;
    return r;
  }
}

class ArticleCommentResource extends ItemResource {
  schema: Schema = { type: "object" };

  async content(ctx: RequestContext): Promise<Repr> {
    const cid = Number(ctx.params.commentId);
    const aid = Number(ctx.params.articleId);
    const comment = comments.find((c) => c.id === cid && c.articleId === aid);
    if (!comment) throw new HttpError(404, "Comment not found");
    return { content: comment, meta: {} };
  }

  async delete(ctx: RequestContext): Promise<Repr> {
    const cid = Number(ctx.params.commentId);
    const aid = Number(ctx.params.articleId);
    const idx = comments.findIndex((c) => c.id === cid && c.articleId === aid);
    if (idx === -1) throw new HttpError(404, "Comment not found");
    comments.splice(idx, 1);
    return { content: null, meta: {} };
  }
}

class ArticleCommentsKind extends CollectionKind {
  children = {
    ":commentId": new ArticleCommentKind(),
  };

  resolve(params: Record<string, string>) {
    const r = new ArticleCommentsResource();
    r.params = params;
    return r;
  }
}

class ArticleCommentsResource extends CollectionResource {
  schema: Schema = { type: "array", items: { type: "object" } };

  async list(_ctx: RequestContext): Promise<Repr> {
    const id = Number(_ctx.params.articleId);
    return {
      content: comments.filter((c) => c.articleId === id),
      meta: {},
    };
  }

  async create(ctx: RequestContext): Promise<Repr> {
    const id = Number(ctx.params.articleId);
    // Verify the parent article exists before attaching a comment to it.
    // Without this, POST /articles/99999/comments would create an orphan
    // comment that never appears under any article.
    if (!articles.some((a) => a.id === id)) {
      throw new HttpError(404, "Article not found");
    }
    const obj = requireFields(await ctx.json(), ["author", "text"]);
    const comment: Comment = {
      id: nextCommentId++,
      articleId: id,
      author: requireString(obj, "author", 100),
      text: requireString(obj, "text", 1000),
      createdAt: new Date().toISOString().slice(0, 10),
    };
    comments.push(comment);
    return { content: comment, meta: { location: `./${comment.id}` } };
  }
}

class ArticleItemKind extends ItemKind {
  context = "https://rikka.dev/schemas/article";
  jsonldType = "Article";
  element = "blog-article-detail";

  children = {
    comments: new ArticleCommentsKind(),
  };

  resolve(params: Record<string, string>) {
    const r = new ArticleItemResource();
    r.params = params;
    r.context = this.context;
    r.jsonldType = this.jsonldType;
    r.element = this.element;
    return r;
  }
}

class ArticleItemResource extends ItemResource {
  schema: Schema = { type: "object" };

  async content(ctx: RequestContext): Promise<Repr> {
    const id = Number(ctx.params.articleId);
    const article = articles.find((a) => a.id === id);
    if (!article) throw new HttpError(404, "Article not found");
    const articleComments = comments.filter((c) => c.articleId === id);
    return {
      content: {
        ...article,
        authorName:
          users.find((u) => u.id === article.authorId)?.name ?? "Unknown",
        comments: articleComments,
      },
      meta: {},
    };
  }

  async replace(ctx: RequestContext): Promise<Repr> {
    const id = Number(ctx.params.articleId);
    const idx = articles.findIndex((a) => a.id === id);
    if (idx === -1) throw new HttpError(404, "Article not found");
    const obj = requireFields(await ctx.json(), ["title", "body"]);
    const title = requireString(obj, "title", 200);
    const body = requireString(obj, "body", 10000);
    articles[idx] = {
      ...articles[idx]!,
      title,
      body,
      tags: optionalStringArray(obj, "tags", 50, articles[idx]!.tags),
    };
    return { content: articles[idx], meta: {} };
  }

  async patch(ctx: RequestContext): Promise<Repr> {
    const id = Number(ctx.params.articleId);
    const idx = articles.findIndex((a) => a.id === id);
    if (idx === -1) throw new HttpError(404, "Article not found");
    const obj = ((await ctx.json()) as Record<string, unknown>) ?? {};
    if (
      obj.title === undefined &&
      obj.body === undefined &&
      obj.tags === undefined
    ) {
      throw new HttpError(
        400,
        "At least one of title, body, or tags is required",
      );
    }
    if (obj.title !== undefined) {
      articles[idx]!.title = requireString(obj, "title", 200);
    }
    if (obj.body !== undefined) {
      articles[idx]!.body = requireString(obj, "body", 10000);
    }
    if (obj.tags !== undefined) {
      articles[idx]!.tags = optionalStringArray(obj, "tags", 50, []);
    }
    return { content: articles[idx], meta: {} };
  }

  async delete(ctx: RequestContext): Promise<Repr> {
    const id = Number(ctx.params.articleId);
    const idx = articles.findIndex((a) => a.id === id);
    if (idx === -1) throw new HttpError(404, "Article not found");
    articles.splice(idx, 1);
    for (let i = comments.length - 1; i >= 0; i--) {
      if (comments[i]!.articleId === id) comments.splice(i, 1);
    }
    return { content: null, meta: {} };
  }
}

class ArticlesKind extends CollectionKind {
  context = "https://rikka.dev/schemas/article";
  jsonldType = "ArticleCollection";
  element = "blog-article-list";

  children = {
    ":articleId": new ArticleItemKind(),
  };

  resolve(params: Record<string, string>) {
    const r = new ArticlesResource();
    r.params = params;
    r.context = this.context;
    r.jsonldType = this.jsonldType;
    r.element = this.element;
    return r;
  }
}

class ArticlesResource extends CollectionResource {
  schema: Schema = { type: "array", items: { type: "object" } };

  async list(ctx: RequestContext): Promise<Repr> {
    const enriched = articles.map((a) => ({
      ...a,
      authorName: users.find((u) => u.id === a.authorId)?.name ?? "Unknown",
      authorRole: users.find((u) => u.id === a.authorId)?.role ?? "reader",
    }));
    return paginate(enriched, ctx.range);
  }

  async create(ctx: RequestContext): Promise<Repr> {
    const obj = requireFields(await ctx.json(), ["title", "body"]);
    const title = requireString(obj, "title", 200);
    const body = requireString(obj, "body", 10000);
    const article: Article = {
      id: nextArticleId++,
      title,
      body,
      authorId: 1,
      tags: optionalStringArray(obj, "tags", 50, []),
      createdAt: new Date().toISOString().slice(0, 10),
    };
    articles.push(article);
    return { content: article, meta: { location: `./${article.id}` } };
  }
}

class UserItemKind extends ItemKind {
  resolve(params: Record<string, string>) {
    const r = new UserItemResource();
    r.params = params;
    return r;
  }
}

class UserItemResource extends ItemResource {
  schema: Schema = { type: "object" };

  async content(ctx: RequestContext): Promise<Repr> {
    const id = Number(ctx.params.userId);
    const user = users.find((u) => u.id === id);
    if (!user) throw new HttpError(404, "User not found");
    return { content: user, meta: {} };
  }
}

class UsersKind extends CollectionKind {
  element = "blog-user-list";

  children = {
    ":userId": new UserItemKind(),
  };

  resolve(params: Record<string, string>) {
    const r = new UsersResource();
    r.params = params;
    r.element = this.element;
    return r;
  }
}

class UsersResource extends CollectionResource {
  schema: Schema = { type: "array", items: { type: "object" } };

  async list(_ctx: RequestContext): Promise<Repr> {
    return { content: users, meta: {} };
  }

  async create(ctx: RequestContext): Promise<Repr> {
    const obj = requireFields(await ctx.json(), ["name", "email"]);
    const user: User = {
      id: users.length + 1,
      name: requireString(obj, "name", 100),
      email: requireString(obj, "email", 200),
      role: optionalEnum(
        obj,
        "role",
        ["admin", "author", "reader"] as const,
        "reader",
      ),
    };
    users.push(user);
    return { content: user, meta: { location: `./${user.id}` } };
  }
}

class SiteSettingsKind extends SingletonKind {
  element = "blog-settings";

  resolve(params: Record<string, string>) {
    const r = new SiteSettingsResource();
    r.params = params;
    r.element = this.element;
    return r;
  }
}

class SiteSettingsResource extends SingletonResource {
  schema: Schema = { type: "object" };

  async content(_ctx: RequestContext): Promise<Repr> {
    return { content: settings, meta: {} };
  }

  async replace(ctx: RequestContext): Promise<Repr> {
    // PUT requires siteName (full replacement semantics).
    const obj = requireFields(await ctx.json(), ["siteName"]);
    settings.siteName = requireString(obj, "siteName", 100);
    if (obj.theme !== undefined) settings.theme = String(obj.theme);
    const ppp = optionalFiniteNumber(obj, "postsPerPage", 1);
    if (ppp !== undefined) settings.postsPerPage = ppp;
    return { content: settings, meta: {} };
  }

  async patch(ctx: RequestContext): Promise<Repr> {
    // PATCH allows partial updates — no field is required, but at least one
    // must be provided so the operation isn't a silent no-op.
    const body = await ctx.json();
    if (typeof body !== "object" || body === null) {
      throw new HttpError(400, "Request body must be a JSON object");
    }
    const obj = body as Record<string, unknown>;
    if (
      obj.siteName === undefined &&
      obj.theme === undefined &&
      obj.postsPerPage === undefined
    ) {
      throw new HttpError(
        400,
        "At least one of siteName, theme, or postsPerPage is required",
      );
    }
    if (obj.siteName !== undefined) {
      settings.siteName = requireString(obj, "siteName", 100);
    }
    if (obj.theme !== undefined) settings.theme = String(obj.theme);
    const ppp = optionalFiniteNumber(obj, "postsPerPage", 1);
    if (ppp !== undefined) settings.postsPerPage = ppp;
    return { content: settings, meta: {} };
  }
}

class DashboardKind extends ReadOnlyKind {
  element = "blog-dashboard";

  resolve(params: Record<string, string>) {
    const r = new DashboardResource();
    r.params = params;
    r.element = this.element;
    return r;
  }
}

class DashboardResource extends ReadOnlyResource {
  schema: Schema = { type: "object" };

  async content(_ctx: RequestContext): Promise<Repr> {
    return {
      content: {
        articleCount: articles.length,
        commentCount: comments.length,
        userCount: users.length,
        recentArticles: articles.slice(-3).reverse(),
      },
      meta: {},
    };
  }
}

class SearchKind extends ActionKind {
  resolve(params: Record<string, string>) {
    const r = new SearchResource();
    r.params = params;
    return r;
  }
}

class SearchResource extends ActionResource {
  schema: Schema = { type: "object" };

  async invoke(ctx: RequestContext): Promise<Repr> {
    const obj = requireFields(await ctx.json(), ["query"]);
    const query = requireString(obj, "query", 200).toLowerCase();
    const results = articles.filter(
      (a) =>
        a.title.toLowerCase().includes(query) ||
        a.body.toLowerCase().includes(query) ||
        a.tags.some((t) => t.toLowerCase().includes(query)),
    );
    return { content: results, meta: {} };
  }
}

class AuthVerifierKind extends ActionKind {
  resolve(params: Record<string, string>) {
    const r = new AuthVerifierResource();
    r.params = params;
    return r;
  }
}

class AuthVerifierResource extends ActionResource {
  async invoke(ctx: RequestContext): Promise<Repr> {
    const authHeader = ctx.headers["authorization"];
    if (!authHeader?.startsWith("Bearer ")) {
      throw new HttpError(401, "Missing or invalid Authorization header");
    }
    const token = authHeader.slice(7);
    const tokenMap: Record<string, { subject: string; scopes: string }> = {
      "admin-token": { subject: "admin", scopes: "read write admin" },
      "author-token": { subject: "author", scopes: "read write" },
      "reader-token": { subject: "reader", scopes: "read" },
    };
    const identity = tokenMap[token];
    if (!identity) throw new HttpError(401, "Invalid token");
    return { content: identity, meta: {} };
  }
}

// ---------------------------------------------------------------------------
// Site definition
// ---------------------------------------------------------------------------

export interface BlogAppOptions {
  /** Edge-compatible static file resolver. If omitted, the Node filesystem root is used. */
  staticResolver?: StaticResolver;
}

/** `import.meta.url` is a `file:` URL on Node/Bun, `https:` on edge runtimes. */
const isNode = import.meta.url.startsWith("file:");

export function createApp(options: BlogAppOptions = {}) {
  const app = new Site(
    {
      "": new SiteRootKind(),
      articles: new ArticlesKind(),
      users: new UsersKind(),
      settings: new SiteSettingsKind(),
      dashboard: new DashboardKind(),
      actions: {
        search: new SearchKind(),
      },
      auth: new AuthVerifierKind(),
      static: options.staticResolver
        ? new FileSystemKind({ resolver: options.staticResolver })
        : new FileSystemKind({ root: "./public" }),
      admin: {
        articles: new ArticlesKind(),
        users: new UsersKind(),
      },
    },
    {
      cors: {},
      auth: {
        verifier: "auth",
        rules: [
          // Public read access (GET only). Without the methods constraint,
          // `auth: null` would also expose POST/PUT/PATCH/DELETE on these
          // paths — the rule applies to ALL methods. Restricting to GET
          // keeps public reads open while forcing writes through auth.
          {
            match: "/articles/**",
            auth: null,
            methods: ["GET", "HEAD", "OPTIONS"],
          },
          {
            match: "/users/**",
            auth: null,
            methods: ["GET", "HEAD", "OPTIONS"],
          },
          {
            match: "/dashboard",
            auth: null,
            methods: ["GET", "HEAD", "OPTIONS"],
          },
          {
            match: "/settings",
            auth: null,
            methods: ["GET", "HEAD", "OPTIONS"],
          },
          // All write methods (POST/PUT/PATCH/DELETE) on the public read
          // paths require auth.
          { match: "/articles/**", auth: "auth" },
          { match: "/users/**", auth: "auth" },
          { match: "/settings", auth: "auth" },
          // Admin and action routes require auth for every method.
          { match: "/admin/**", auth: "auth" },
          { match: "/actions/**", auth: "auth" },
        ],
      },
      customElements: elements,
      // Frontend assets & on-demand element bundling are Node-only (need fs + esbuild).
      // Edge runtimes pass a `staticResolver` and skip these.
      ...(isNode
        ? {
            customElementsEntry: new URL("./elements.ts", import.meta.url),
            assets: {
              "robots.txt": {
                source: new URL("../public/robots.txt", import.meta.url),
              },
              "favicon.ico": {
                source: new URL("../public/favicon.ico", import.meta.url),
                contentType: "image/x-icon",
              },
            } as Record<string, { source: URL; contentType?: string }>,
          }
        : {}),
    },
  );

  // Register custom transformers on the site's registry
  app.registry.register(csvTransformer);
  app.registry.register(textTransformer);

  return app;
}

/** Default app using the Node filesystem for static files. */
export const app = createApp();
