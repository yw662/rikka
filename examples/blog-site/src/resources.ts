/**
 * Blog Site — resource definitions.
 *
 * Shared between all platform adapters.
 * Demonstrates all 6 Kinds, Schema, Auth, Transformers, and HttpError.
 */

import {
  Collection,
  Item,
  Singleton,
  ReadOnly,
  Action,
  Proxy,
  Static,
  Site,
  HttpError,
  paginate,
  type Transformer,
  type Repr,
  type StaticResolver,
} from "@takanashi/rikka-site";

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

const initialArticles: Article[] = articles.map((a) => ({ ...a, tags: [...a.tags] }));
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

// ---------------------------------------------------------------------------
// Custom Transformers
// ---------------------------------------------------------------------------

const csvTransformer: Transformer = {
  input: { type: "array", items: { type: "object" } },
  output: "text/csv",
  priority: 5,
  transform(repr: Repr): Repr {
    const data = repr.content;
    if (!Array.isArray(data) || data.length === 0) {
      return { content: "", meta: { type: "text/csv" } };
    }
    const headers = Object.keys(data[0] as Record<string, unknown>).join(",");
    const rows = data.map((row: unknown) =>
      Object.values(row as Record<string, unknown>)
        .map((v) => (typeof v === "string" ? `"${v}"` : String(v)))
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
  output: "text/plain",
  priority: 0,
  transform(repr: Repr, ctx): Repr {
    const data = repr.content;
    const lines: string[] = [];
    lines.push(`Resource: ${ctx.resource.path}`);
    lines.push(`Kind: ${ctx.resource.kind}`);
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

const SiteRoot = ReadOnly(() => ({
  content: () => ({
    content: {
      name: settings.siteName,
      tagline: "A resource-oriented blog built with Rikka",
      articleCount: articles.length,
      userCount: users.length,
      commentCount: comments.length,
      recentArticles: articles.slice(-3).reverse().map((a) => ({
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
  }),
  schema: { type: "object" },
  element: "blog-home",
}));

const Articles = Collection(() => ({
  list: (ctx) => {
    const enriched = articles.map((a) => ({
      ...a,
      authorName: users.find((u) => u.id === a.authorId)?.name ?? "Unknown",
      authorRole: users.find((u) => u.id === a.authorId)?.role ?? "reader",
    }));
    return paginate(enriched, ctx.range);
  },
  create: (ctx) => {
    const obj = requireFields(ctx.body, ["title", "body"]);
    const title = requireString(obj, "title", 200);
    const body = requireString(obj, "body", 10000);
    const article: Article = {
      id: nextArticleId++,
      title,
      body,
      authorId: 1,
      tags: Array.isArray(obj.tags) ? (obj.tags as string[]) : [],
      createdAt: new Date().toISOString().slice(0, 10),
    };
    articles.push(article);
    return { content: article, meta: { location: `./${article.id}` } };
  },
  schema: { type: "array", items: { type: "object" } },
  context: "https://rikka.dev/schemas/article",
  jsonldType: "ArticleCollection",
  element: "blog-article-list",
  children: {
    ":articleId": Item((articleId) => ({
      content: () => {
        const id = Number(articleId);
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
      },
      replace: (ctx) => {
        const id = Number(articleId);
        const idx = articles.findIndex((a) => a.id === id);
        if (idx === -1) throw new HttpError(404, "Article not found");
        const obj = requireFields(ctx.body, ["title", "body"]);
        const title = requireString(obj, "title", 200);
        const body = requireString(obj, "body", 10000);
        articles[idx] = {
          ...articles[idx]!,
          title,
          body,
          tags: Array.isArray(obj.tags)
            ? (obj.tags as string[])
            : articles[idx]!.tags,
        };
        return { content: articles[idx], meta: {} };
      },
      patch: (ctx) => {
        const id = Number(articleId);
        const idx = articles.findIndex((a) => a.id === id);
        if (idx === -1) throw new HttpError(404, "Article not found");
        const obj = (ctx.body as Record<string, unknown>) ?? {};
        if (
          obj.title === undefined &&
          obj.body === undefined &&
          obj.tags === undefined
        ) {
          throw new HttpError(400, "At least one of title, body, or tags is required");
        }
        if (obj.title !== undefined) {
          articles[idx]!.title = requireString(obj, "title", 200);
        }
        if (obj.body !== undefined) {
          articles[idx]!.body = requireString(obj, "body", 10000);
        }
        if (Array.isArray(obj.tags)) {
          articles[idx]!.tags = obj.tags as string[];
        }
        return { content: articles[idx], meta: {} };
      },
      delete: () => {
        const id = Number(articleId);
        const idx = articles.findIndex((a) => a.id === id);
        if (idx === -1) throw new HttpError(404, "Article not found");
        articles.splice(idx, 1);
        for (let i = comments.length - 1; i >= 0; i--) {
          if (comments[i]!.articleId === id) comments.splice(i, 1);
        }
        return { content: null, meta: {} };
      },
      schema: { type: "object" },
      context: "https://rikka.dev/schemas/article",
      jsonldType: "Article",
      element: "blog-article-detail",
      children: {
        comments: Collection(() => ({
          list: () => {
            const id = Number(articleId);
            return {
              content: comments.filter((c) => c.articleId === id),
              meta: {},
            };
          },
          create: (ctx) => {
            const id = Number(articleId);
            const obj = requireFields(ctx.body, ["author", "text"]);
            const comment: Comment = {
              id: nextCommentId++,
              articleId: id,
              author: requireString(obj, "author", 100),
              text: requireString(obj, "text", 1000),
              createdAt: new Date().toISOString().slice(0, 10),
            };
            comments.push(comment);
            return { content: comment, meta: { location: `./${comment.id}` } };
          },
          schema: { type: "array", items: { type: "object" } },
          children: {
            ":commentId": Item((commentId) => ({
              content: () => {
                const cid = Number(commentId);
                const aid = Number(articleId);
                const comment = comments.find(
                  (c) => c.id === cid && c.articleId === aid,
                );
                if (!comment) throw new HttpError(404, "Comment not found");
                return { content: comment, meta: {} };
              },
              delete: () => {
                const cid = Number(commentId);
                const idx = comments.findIndex((c) => c.id === cid);
                if (idx === -1) throw new HttpError(404, "Comment not found");
                comments.splice(idx, 1);
                return { content: null, meta: {} };
              },
              schema: { type: "object" },
            })),
          },
        })),
      },
    })),
  },
}));

const Users = Collection(() => ({
  list: () => ({ content: users, meta: {} }),
  create: (ctx) => {
    const obj = requireFields(ctx.body, ["name", "email"]);
    const user: User = {
      id: users.length + 1,
      name: requireString(obj, "name", 100),
      email: requireString(obj, "email", 200),
      role: (obj.role as User["role"]) ?? "reader",
    };
    users.push(user);
    return { content: user, meta: { location: `./${user.id}` } };
  },
  schema: { type: "array", items: { type: "object" } },
  element: "blog-user-list",
  children: {
    ":userId": Item((userId) => ({
      content: () => {
        const id = Number(userId);
        const user = users.find((u) => u.id === id);
        if (!user) throw new HttpError(404, "User not found");
        return { content: user, meta: {} };
      },
      schema: { type: "object" },
    })),
  },
}));

const SiteSettings = Singleton(() => ({
  content: () => ({ content: settings, meta: {} }),
  replace: (ctx) => {
    const obj = requireFields(ctx.body, ["siteName"]);
    settings.siteName = requireString(obj, "siteName", 100);
    if (obj.theme !== undefined) settings.theme = String(obj.theme);
    if (obj.postsPerPage !== undefined)
      settings.postsPerPage = Number(obj.postsPerPage);
    return { content: settings, meta: {} };
  },
  patch: (ctx) => {
    const obj = requireFields(ctx.body, ["siteName"]);
    settings.siteName = requireString(obj, "siteName", 100);
    if (obj.theme !== undefined) settings.theme = String(obj.theme);
    if (obj.postsPerPage !== undefined)
      settings.postsPerPage = Number(obj.postsPerPage);
    return { content: settings, meta: {} };
  },
  schema: { type: "object" },
  element: "blog-settings",
}));

const Dashboard = ReadOnly(() => ({
  content: () => ({
    content: {
      articleCount: articles.length,
      commentCount: comments.length,
      userCount: users.length,
      recentArticles: articles.slice(-3).reverse(),
    },
    meta: {},
  }),
  schema: { type: "object" },
  element: "blog-dashboard",
}));

const Search = Action(() => ({
  invoke: (ctx) => {
    const obj = requireFields(ctx.body, ["query"]);
    const query = requireString(obj, "query", 200).toLowerCase();
    const results = articles.filter(
      (a) =>
        a.title.toLowerCase().includes(query) ||
        a.body.toLowerCase().includes(query) ||
        a.tags.some((t) => t.toLowerCase().includes(query)),
    );
    return { content: results, meta: {} };
  },
  schema: { type: "object" },
}));

const AuthVerifier = Action(() => ({
  invoke: (ctx) => {
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
  },
}));

const ExternalAPI = Proxy(() => ({
  target: (path) => {
    // Strip the /proxy mount prefix to get the upstream path
    const upstream = path.replace(/^\/proxy/, "") || "/";
    return new URL(`https://jsonplaceholder.typicode.com${upstream}`);
  },
}));

// ---------------------------------------------------------------------------
// Site definition
// ---------------------------------------------------------------------------

export interface BlogAppOptions {
  /** Edge-compatible static file resolver. If omitted, the Node filesystem root is used. */
  staticResolver?: StaticResolver;
}

export function createApp(options: BlogAppOptions = {}) {
  const staticResource = options.staticResolver
    ? Static({ resolver: options.staticResolver })
    : Static({ root: "./public" });

  const app = new Site(
    {
      "": SiteRoot(),
      articles: Articles(),
      users: Users(),
      settings: SiteSettings(),
      dashboard: Dashboard(),
      actions: {
        search: Search(),
      },
      auth: AuthVerifier(),
      proxy: ExternalAPI(),
      static: staticResource,
      admin: {
        articles: Articles(),
        users: Users(),
      },
    },
    {
      cors: {},
      auth: {
        verifier: "auth",
        rules: [
          // Public read access
          { match: "/dashboard", auth: null },
          { match: "/settings", auth: null },
          { match: "/articles", auth: null },
          // Write operations require auth
          { match: "/admin/**", auth: "auth" },
          { match: "/actions/**", auth: "auth" },
        ],
      },
    },
  );

  // Register custom transformers on the site's registry
  app.registry.register(csvTransformer);
  app.registry.register(textTransformer);

  return app;
}

/** Default app using the Node filesystem for static files. */
export const app = createApp();
