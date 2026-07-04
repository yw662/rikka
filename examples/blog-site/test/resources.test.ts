/**
 * Resource behavior tests for blog-site.
 *
 * These don't start any server — they call `app.handleRequest(...)` directly
 * with a synthetic `HttpRequest`. The goal is to verify the resource tree
 * wired up in `src/resources.ts` behaves correctly in isolation: that the
 * transformers are wired, that auth rules match, that
 * CRUD works end-to-end at the handler level.
 *
 * For HTTP-level tests (status codes, headers, CORS preflight, static files)
 * see the three entry-point test files.
 */

import { describe, it, expect, beforeEach } from "@rstest/core";
import { type HttpRequest } from "@takanashi/rikka-site";
import { app, resetData } from "../src/resources.js";

/** Convert a plain object/string to a ReadableStream for use as request body. */
function toBody(data: unknown): ReadableStream<Uint8Array> {
  const text = typeof data === "string" ? data : JSON.stringify(data);
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
}

function makeRequest(
  overrides: Partial<HttpRequest> & { jsonBody?: unknown },
): HttpRequest {
  const { jsonBody, headers, ...rest } = overrides;
  // Mirror the Node/Worker adapters: headers["accept"] flows into request.accept
  // so the framework's content-negotiation sees it. Tests that pass `accept`
  // at the top level take precedence.
  const headersAccept = headers?.["accept"];
  const accept = rest.accept ?? (headersAccept !== undefined ? String(headersAccept) : undefined);
  return {
    method: "GET",
    path: "/",
    headers: { ...headers },
    query: {},
    ...rest,
    accept,
    ...(jsonBody !== undefined ? { body: toBody(jsonBody) } : {}),
  };
}

beforeEach(() => {
  resetData();
});

describe("resource tree behavior", () => {
  // --- Collection.list ---

  it("Collection.list enriches articles with author info", async () => {
    const r = await app.handleRequest(
      makeRequest({
        method: "GET",
        path: "/articles",
        accept: "application/json",
      }),
    );
    expect(r.status).toBe(200);
    const list = JSON.parse(r.body as string);
    expect(list.length).toBeGreaterThan(0);
    for (const a of list) {
      expect(a).toHaveProperty("authorName");
      expect(a).toHaveProperty("authorRole");
    }
  });

  it("Collection.list supports filtering via site config (?tag query ignored)", async () => {
    // NOTE: blog-site's Articles resource takes `tag` as a config arg, not a
    // query param. Verify that the query parser does at least not break — the
    // list handler just receives the same articles regardless.
    const r = await app.handleRequest(
      makeRequest({
        method: "GET",
        path: "/articles",
        query: { tag: "intro" },
        accept: "application/json",
      }),
    );
    expect(r.status).toBe(200);
    const list = JSON.parse(r.body as string);
    expect(list.length).toBeGreaterThan(0);
  });

  it("Collection.create returns 201 + Location for valid body", async () => {
    const r = await app.handleRequest(
      makeRequest({
        method: "POST",
        path: "/articles",
        headers: {
          accept: "application/json",
          authorization: "Bearer admin-token",
        },
        jsonBody: { title: "T", body: "x", tags: ["new"] },
      }),
    );
    expect(r.status).toBe(201);
    expect(r.headers["Location"]).toBeTruthy();
  });

  it("Collection.create returns 400 for missing required fields", async () => {
    const r = await app.handleRequest(
      makeRequest({
        method: "POST",
        path: "/articles",
        headers: { authorization: "Bearer admin-token" },
        jsonBody: { title: "T" }, // missing body
      }),
    );
    expect(r.status).toBe(400);
  });

  it("Collection.create returns 400 for over-long title", async () => {
    const r = await app.handleRequest(
      makeRequest({
        method: "POST",
        path: "/articles",
        headers: { authorization: "Bearer admin-token" },
        jsonBody: { title: "x".repeat(201), body: "y" },
      }),
    );
    expect(r.status).toBe(400);
  });

  it("Collection.create returns 401 without auth (write protected)", async () => {
    // Issue 1 fix: writes on public-read paths require auth.
    const r = await app.handleRequest(
      makeRequest({
        method: "POST",
        path: "/articles",
        jsonBody: { title: "T", body: "x" },
      }),
    );
    expect(r.status).toBe(401);
  });

  it("Collection.create returns 400 for non-string tag entries", async () => {
    // Issue 8 fix: tags array elements are validated.
    const r = await app.handleRequest(
      makeRequest({
        method: "POST",
        path: "/articles",
        headers: { authorization: "Bearer admin-token" },
        jsonBody: { title: "T", body: "x", tags: ["ok", 123] },
      }),
    );
    expect(r.status).toBe(400);
  });

  // --- Item ---

  it("Item.content returns enriched article with comments", async () => {
    const r = await app.handleRequest(
      makeRequest({
        method: "GET",
        path: "/articles/1",
        accept: "application/json",
      }),
    );
    expect(r.status).toBe(200);
    const article = JSON.parse(r.body as string);
    expect(article.id).toBe(1);
    expect(article).toHaveProperty("comments");
    expect(Array.isArray(article.comments)).toBe(true);
  });

  it("Item.content returns 404 for unknown id", async () => {
    const r = await app.handleRequest(
      makeRequest({
        method: "GET",
        path: "/articles/99999",
        headers: { accept: "application/json" },
      }),
    );
    expect(r.status).toBe(404);
  });

  it("Item.delete returns 204 on success", async () => {
    // First create
    const c = await app.handleRequest(
      makeRequest({
        method: "POST",
        path: "/articles",
        headers: {
          accept: "application/json",
          authorization: "Bearer admin-token",
        },
        jsonBody: { title: "to-delete", body: "x" },
      }),
    );
    const id = c.headers["Location"];
    expect(c.status).toBe(201);

    // Then delete
    const d = await app.handleRequest(
      makeRequest({
        method: "DELETE",
        path: `/articles/${id}`,
        headers: { authorization: "Bearer admin-token" },
      }),
    );
    expect(d.status).toBe(204);
    expect(d.body).toBe("");

    // Then verify gone — second delete should 404
    const d2 = await app.handleRequest(
      makeRequest({
        method: "DELETE",
        path: `/articles/${id}`,
        headers: { authorization: "Bearer admin-token" },
      }),
    );
    expect(d2.status).toBe(404);
  });

  it("Item.patch merges partial update", async () => {
    // Create
    const c = await app.handleRequest(
      makeRequest({
        method: "POST",
        path: "/articles",
        accept: "application/json",
        headers: { authorization: "Bearer admin-token" },
        jsonBody: { title: "original", body: "orig" },
      }),
    );
    const id = c.headers["Location"];

    // Patch only title
    const p = await app.handleRequest(
      makeRequest({
        method: "PATCH",
        path: `/articles/${id}`,
        accept: "application/json",
        headers: { authorization: "Bearer admin-token" },
        jsonBody: { title: "patched" },
      }),
    );
    expect(p.status).toBe(200);
    const article = JSON.parse(p.body as string);
    expect(article.title).toBe("patched");
    expect(article.body).toBe("orig"); // preserved
  });

  // --- Singleton ---

  it("Singleton.content returns current settings", async () => {
    const r = await app.handleRequest(
      makeRequest({
        method: "GET",
        path: "/settings",
        accept: "application/json",
      }),
    );
    expect(r.status).toBe(200);
    const s = JSON.parse(r.body as string);
    expect(s).toHaveProperty("siteName");
    expect(s).toHaveProperty("theme");
    expect(s).toHaveProperty("postsPerPage");
  });

  it("Singleton.replace requires siteName", async () => {
    const r = await app.handleRequest(
      makeRequest({
        method: "PUT",
        path: "/settings",
        headers: { authorization: "Bearer admin-token" },
        jsonBody: { theme: "light" }, // missing siteName
      }),
    );
    expect(r.status).toBe(400);
  });

  it("Singleton.replace returns 401 without auth (write protected)", async () => {
    // Issue 1 fix: PUT on /settings requires auth even though GET is public.
    const r = await app.handleRequest(
      makeRequest({
        method: "PUT",
        path: "/settings",
        jsonBody: { siteName: "X" },
      }),
    );
    expect(r.status).toBe(401);
  });

  // --- ReadOnly ---

  it("ReadOnly.content returns dashboard counts", async () => {
    const r = await app.handleRequest(
      makeRequest({
        method: "GET",
        path: "/dashboard",
        accept: "application/json",
      }),
    );
    expect(r.status).toBe(200);
    const d = JSON.parse(r.body as string);
    expect(typeof d.articleCount).toBe("number");
    expect(typeof d.commentCount).toBe("number");
    expect(typeof d.userCount).toBe("number");
    expect(Array.isArray(d.recentArticles)).toBe(true);
  });

  // --- Action ---

  it("Action.invoke returns search results", async () => {
    const r = await app.handleRequest(
      makeRequest({
        method: "POST",
        path: "/actions/search",
        accept: "application/json",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer reader-token",
        },
        jsonBody: { query: "Signals" },
      }),
    );
    expect(r.status).toBe(200);
    const results = JSON.parse(r.body as string);
    expect(results.length).toBeGreaterThan(0);
  });

  it("Action.invoke returns 401 without auth", async () => {
    const r = await app.handleRequest(
      makeRequest({
        method: "POST",
        path: "/actions/search",
        headers: { "content-type": "application/json" },
        jsonBody: { query: "Signals" },
      }),
    );
    expect(r.status).toBe(401);
  });

  // --- Auth rules ---

  it("admin/articles GET requires auth", async () => {
    const r = await app.handleRequest(
      makeRequest({
        method: "GET",
        path: "/admin/articles",
        headers: { accept: "application/json" },
      }),
    );
    expect(r.status).toBe(401);
  });

  it("admin/articles GET with admin token returns 200", async () => {
    const r = await app.handleRequest(
      makeRequest({
        method: "GET",
        path: "/admin/articles",
        headers: {
          accept: "application/json",
          authorization: "Bearer admin-token",
        },
      }),
    );
    expect(r.status).toBe(200);
  });

  it("admin/articles with reader token returns 200 (blog doesn't enforce scope)", async () => {
    // The blog's auth verifier returns an identity with `scopes`, but the
    // /admin/** rule only requires that auth SUCCEEDS — it does not check
    // scopes. So any valid token (reader, author, admin) can reach
    // /admin/articles. This test documents that behavior: scope-based
    // access control is not enforced by the blog-site example.
    const r = await app.handleRequest(
      makeRequest({
        method: "GET",
        path: "/admin/articles",
        headers: {
          accept: "application/json",
          authorization: "Bearer reader-token",
        },
      }),
    );
    expect(r.status).toBe(200);
  });

  it("POST /articles returns 401 with invalid token", async () => {
    // Auth verifier rejects unknown tokens with 401.
    const r = await app.handleRequest(
      makeRequest({
        method: "POST",
        path: "/articles",
        headers: { authorization: "Bearer not-a-real-token" },
        jsonBody: { title: "T", body: "x" },
      }),
    );
    expect(r.status).toBe(401);
  });

  it("public GET paths don't require auth", async () => {
    // /articles, /users, /dashboard, /settings all have auth: null rules
    for (const path of ["/articles", "/users", "/dashboard", "/settings"]) {
      const r = await app.handleRequest(
        makeRequest({
          method: "GET",
          path,
          headers: { accept: "application/json" },
        }),
      );
      expect(r.status).toBe(200);
    }
  });

  // --- Transformer pipeline ---
  //
  // csv/text transformers are registered at module top level in
  // src/resources.ts. swc/rspack (used by rstest) does NOT execute
  // module top-level side effects, so transformer registration doesn't
  // happen in these unit tests. The e2e entry-point tests (node-entry,
  // dev-server, worker-entry) spawn real processes that do execute the
  // top-level code, so transformer behavior is validated there.

  it("HTML response includes data-resource embedded data", async () => {
    const r = await app.handleRequest(
      makeRequest({
        method: "GET",
        path: "/articles",
        accept: "text/html",
      }),
    );
    expect(r.status).toBe(200);
    // Default hydration strategy is "data-attr" — data is embedded as
    // a data-resource attribute on the custom element.
    expect(r.body).toContain("data-resource=");
    expect(r.body).toContain("blog-article-list");
    // Sitemap is embedded as a JSON script tag
    expect(r.body).toContain("data-sitemap");
  });

  // --- Error handling ---

  it("Internal server error returns 500 with plain text", async () => {
    // Send malformed JSON to a POST handler that calls ctx.json().
    // JSON.parse throws SyntaxError, which is not an HttpError, so the
    // framework's catch block returns 500 with a text/plain body.
    const r = await app.handleRequest(
      makeRequest({
        method: "POST",
        path: "/articles",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer admin-token",
        },
        body: toBody("{not valid json"),
      }),
    );
    expect(r.status).toBe(500);
    expect(r.headers["Content-Type"]).toBe("text/plain");
  });
});

describe("comments", () => {
  it("lists comments for an article", async () => {
    const r = await app.handleRequest(
      makeRequest({
        method: "GET",
        path: "/articles/1/comments",
        accept: "application/json",
      }),
    );
    expect(r.status).toBe(200);
    const list = JSON.parse(r.body as string);
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
  });

  it("creates a comment on an existing article", async () => {
    const r = await app.handleRequest(
      makeRequest({
        method: "POST",
        path: "/articles/1/comments",
        accept: "application/json",
        headers: { authorization: "Bearer admin-token" },
        jsonBody: { author: "Test", text: "Nice" },
      }),
    );
    expect(r.status).toBe(201);
    const data = JSON.parse(r.body as string);
    expect(data.author).toBe("Test");
    expect(data.articleId).toBe(1);
  });

  it("returns 404 when creating a comment on a non-existent article", async () => {
    // Issue 7 fix: parent article existence is verified.
    const r = await app.handleRequest(
      makeRequest({
        method: "POST",
        path: "/articles/99999/comments",
        accept: "application/json",
        headers: { authorization: "Bearer admin-token" },
        jsonBody: { author: "Test", text: "Nice" },
      }),
    );
    expect(r.status).toBe(404);
  });

  it("returns 404 when deleting a comment via the wrong article", async () => {
    // Issue 2 fix: delete is scoped to the parent article.
    // Comment id=1 belongs to article id=1. Asking to delete it via
    // article id=2 should 404, NOT delete the comment.
    const r = await app.handleRequest(
      makeRequest({
        method: "DELETE",
        path: "/articles/2/comments/1",
        headers: { authorization: "Bearer admin-token" },
      }),
    );
    expect(r.status).toBe(404);

    // Verify the comment still exists under the correct article.
    const stillThere = await app.handleRequest(
      makeRequest({
        method: "GET",
        path: "/articles/1/comments/1",
        accept: "application/json",
      }),
    );
    expect(stillThere.status).toBe(200);
  });

  it("deletes a comment via the correct article", async () => {
    const r = await app.handleRequest(
      makeRequest({
        method: "DELETE",
        path: "/articles/1/comments/1",
        headers: { authorization: "Bearer admin-token" },
      }),
    );
    expect(r.status).toBe(204);

    // Verify it's gone.
    const gone = await app.handleRequest(
      makeRequest({
        method: "GET",
        path: "/articles/1/comments/1",
        accept: "application/json",
      }),
    );
    expect(gone.status).toBe(404);
  });

  it("requires auth to create a comment (write protected)", async () => {
    // Issue 1 fix: POST on /articles/**/comments requires auth.
    const r = await app.handleRequest(
      makeRequest({
        method: "POST",
        path: "/articles/1/comments",
        accept: "application/json",
        jsonBody: { author: "Test", text: "Nice" },
      }),
    );
    expect(r.status).toBe(401);
  });
});

describe("write operations", () => {
  it("patches an article", async () => {
    const response = await app.handleRequest(
      makeRequest({
        method: "PATCH",
        path: "/articles/1",
        accept: "application/json",
        headers: { authorization: "Bearer admin-token" },
        jsonBody: { title: "Updated Title", body: "Updated body." },
      }),
    );
    expect(response.status).toBe(200);
    const data = JSON.parse(response.body as string);
    expect(data.title).toBe("Updated Title");
    expect(data.body).toBe("Updated body.");
  });

  it("rejects patching an article with empty body", async () => {
    const response = await app.handleRequest(
      makeRequest({
        method: "PATCH",
        path: "/articles/1",
        accept: "application/json",
        headers: { authorization: "Bearer admin-token" },
        jsonBody: {},
      }),
    );
    expect(response.status).toBe(400);
  });

  it("rejects patching an article without auth", async () => {
    // Issue 1 fix: PATCH on /articles/:id requires auth.
    const response = await app.handleRequest(
      makeRequest({
        method: "PATCH",
        path: "/articles/1",
        accept: "application/json",
        jsonBody: { title: "X" },
      }),
    );
    expect(response.status).toBe(401);
  });

  it("creates a user", async () => {
    const response = await app.handleRequest(
      makeRequest({
        method: "POST",
        path: "/users",
        accept: "application/json",
        headers: { authorization: "Bearer admin-token" },
        jsonBody: { name: "Frank", email: "frank@example.com", role: "reader" },
      }),
    );
    expect(response.status).toBe(201);
    const data = JSON.parse(response.body as string);
    expect(data.name).toBe("Frank");
    expect(data.role).toBe("reader");
  });

  it("rejects creating a user with missing email", async () => {
    const response = await app.handleRequest(
      makeRequest({
        method: "POST",
        path: "/users",
        accept: "application/json",
        headers: { authorization: "Bearer admin-token" },
        jsonBody: { name: "Frank" },
      }),
    );
    expect(response.status).toBe(400);
  });

  it("rejects creating a user with invalid role", async () => {
    // Issue 3 fix: role is validated against the allowed enum.
    const response = await app.handleRequest(
      makeRequest({
        method: "POST",
        path: "/users",
        accept: "application/json",
        headers: { authorization: "Bearer admin-token" },
        jsonBody: { name: "Frank", email: "f@e.com", role: "superuser" },
      }),
    );
    expect(response.status).toBe(400);
  });

  it("creates a user with default role when role omitted", async () => {
    // Issue 3 fix: omitted role defaults to "reader".
    const response = await app.handleRequest(
      makeRequest({
        method: "POST",
        path: "/users",
        accept: "application/json",
        headers: { authorization: "Bearer admin-token" },
        jsonBody: { name: "Grace", email: "g@e.com" },
      }),
    );
    expect(response.status).toBe(201);
    const data = JSON.parse(response.body as string);
    expect(data.role).toBe("reader");
  });

  it("patches settings", async () => {
    const response = await app.handleRequest(
      makeRequest({
        method: "PATCH",
        path: "/settings",
        accept: "application/json",
        headers: { authorization: "Bearer admin-token" },
        jsonBody: { siteName: "New Name", theme: "light", postsPerPage: 5 },
      }),
    );
    expect(response.status).toBe(200);
    const data = JSON.parse(response.body as string);
    expect(data.siteName).toBe("New Name");
    expect(data.theme).toBe("light");
    expect(data.postsPerPage).toBe(5);
  });

  it("patches settings partially (siteName optional)", async () => {
    // Issue 4 fix: PATCH allows partial updates — siteName is no longer
    // required. Sending just {theme} should succeed.
    const response = await app.handleRequest(
      makeRequest({
        method: "PATCH",
        path: "/settings",
        accept: "application/json",
        headers: { authorization: "Bearer admin-token" },
        jsonBody: { theme: "light" },
      }),
    );
    expect(response.status).toBe(200);
    const data = JSON.parse(response.body as string);
    expect(data.theme).toBe("light");
    // siteName is preserved from the seeded state.
    expect(data.siteName).toBe("Rikka Blog");
  });

  it("rejects patching settings with empty body", async () => {
    // Issue 4 fix: PATCH requires at least one field (no silent no-op).
    const response = await app.handleRequest(
      makeRequest({
        method: "PATCH",
        path: "/settings",
        accept: "application/json",
        headers: { authorization: "Bearer admin-token" },
        jsonBody: {},
      }),
    );
    expect(response.status).toBe(400);
  });

  it("rejects patching settings with non-finite postsPerPage", async () => {
    // Issue 9 fix: postsPerPage must be finite and >= 1.
    const response = await app.handleRequest(
      makeRequest({
        method: "PATCH",
        path: "/settings",
        accept: "application/json",
        headers: { authorization: "Bearer admin-token" },
        jsonBody: { postsPerPage: -3 },
      }),
    );
    expect(response.status).toBe(400);
  });

  it("rejects patching settings with NaN postsPerPage", async () => {
    // Issue 9 fix: postsPerPage must be finite.
    const response = await app.handleRequest(
      makeRequest({
        method: "PATCH",
        path: "/settings",
        accept: "application/json",
        headers: { authorization: "Bearer admin-token" },
        jsonBody: { postsPerPage: "not-a-number" },
      }),
    );
    expect(response.status).toBe(400);
  });

  it("rejects patching settings without auth", async () => {
    // Issue 1 fix: PATCH on /settings requires auth.
    const response = await app.handleRequest(
      makeRequest({
        method: "PATCH",
        path: "/settings",
        accept: "application/json",
        jsonBody: { siteName: "X" },
      }),
    );
    expect(response.status).toBe(401);
  });
});
