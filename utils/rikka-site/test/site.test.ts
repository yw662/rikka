import { describe, it, expect } from "@rstest/core";
import {
  Collection,
  Item,
  Singleton,
  ReadOnly,
  Action,
  Proxy,
  Site,
  handleWebRequest,
  createFetchHandler,
  resolveResource,
  negotiate,
  kindAllowsMethod,
  kindAllowsOperation,
  TransformerRegistry,
  jsonTransformer,
  jsonldTransformer,
  htmlTransformer,
  getDescriptorSchema,
  schemaMatches,
  anySchema,
  globMatch,
  matchAuthRule,
  Resource,
  CollectionResource,
  ItemResource,
  SingletonResource,
  ReadOnlyResource,
  ActionResource,
  ProxyResource,
  HttpError,
} from "../src/index.js";
import type {
  Transformer,
  TransformContext,
  RequestContext,
  Identity,
  Schema,
  AuthConfig,
  AuthRule,
  SiteOptions,
  Repr,
} from "../src/index.js";

function bodyText(body: string | Uint8Array): string {
  return typeof body === "string" ? body : new TextDecoder().decode(body);
}

// ---------------------------------------------------------------------------
// Kind
// ---------------------------------------------------------------------------

describe("Kind", () => {
  it("Collection allows GET and POST", () => {
    expect(kindAllowsMethod("Collection", "GET")).toBe(true);
    expect(kindAllowsMethod("Collection", "POST")).toBe(true);
    expect(kindAllowsMethod("Collection", "PUT")).toBe(false);
    expect(kindAllowsMethod("Collection", "DELETE")).toBe(false);
    expect(kindAllowsMethod("Collection", "PATCH")).toBe(false);
  });

  it("Item allows GET, PUT, PATCH, DELETE", () => {
    expect(kindAllowsMethod("Item", "GET")).toBe(true);
    expect(kindAllowsMethod("Item", "PUT")).toBe(true);
    expect(kindAllowsMethod("Item", "PATCH")).toBe(true);
    expect(kindAllowsMethod("Item", "DELETE")).toBe(true);
    expect(kindAllowsMethod("Item", "POST")).toBe(false);
  });

  it("Singleton allows GET, PUT, PATCH", () => {
    expect(kindAllowsMethod("Singleton", "GET")).toBe(true);
    expect(kindAllowsMethod("Singleton", "PUT")).toBe(true);
    expect(kindAllowsMethod("Singleton", "PATCH")).toBe(true);
    expect(kindAllowsMethod("Singleton", "DELETE")).toBe(false);
    expect(kindAllowsMethod("Singleton", "POST")).toBe(false);
  });

  it("ReadOnly allows only GET", () => {
    expect(kindAllowsMethod("ReadOnly", "GET")).toBe(true);
    expect(kindAllowsMethod("ReadOnly", "POST")).toBe(false);
    expect(kindAllowsMethod("ReadOnly", "DELETE")).toBe(false);
  });

  it("Action allows only POST", () => {
    expect(kindAllowsMethod("Action", "POST")).toBe(true);
    expect(kindAllowsMethod("Action", "GET")).toBe(false);
  });

  it("Proxy allows all methods", () => {
    expect(kindAllowsMethod("Proxy", "GET")).toBe(true);
    expect(kindAllowsMethod("Proxy", "POST")).toBe(true);
    expect(kindAllowsMethod("Proxy", "PUT")).toBe(true);
    expect(kindAllowsMethod("Proxy", "PATCH")).toBe(true);
    expect(kindAllowsMethod("Proxy", "DELETE")).toBe(true);
  });

  it("kindAllowsOperation works", () => {
    expect(kindAllowsOperation("Collection", "list")).toBe(true);
    expect(kindAllowsOperation("Collection", "create")).toBe(true);
    expect(kindAllowsOperation("Collection", "content")).toBe(false);
    expect(kindAllowsOperation("Item", "content")).toBe(true);
    expect(kindAllowsOperation("Item", "replace")).toBe(true);
    expect(kindAllowsOperation("Item", "patch")).toBe(true);
    expect(kindAllowsOperation("Item", "delete")).toBe(true);
    expect(kindAllowsOperation("Singleton", "content")).toBe(true);
    expect(kindAllowsOperation("Singleton", "replace")).toBe(true);
    expect(kindAllowsOperation("Singleton", "patch")).toBe(true);
    expect(kindAllowsOperation("Singleton", "delete")).toBe(false);
    expect(kindAllowsOperation("ReadOnly", "content")).toBe(true);
    expect(kindAllowsOperation("ReadOnly", "replace")).toBe(false);
    expect(kindAllowsOperation("Action", "invoke")).toBe(true);
    expect(kindAllowsOperation("Action", "content")).toBe(false);
    expect(kindAllowsOperation("Proxy", "get")).toBe(true);
    expect(kindAllowsOperation("Proxy", "post")).toBe(true);
    expect(kindAllowsOperation("Proxy", "content")).toBe(false);
    expect(kindAllowsOperation("Proxy", "create")).toBe(false);
  });

  it("kindAllowsMethod is case-insensitive", () => {
    expect(kindAllowsMethod("Collection", "get")).toBe(true);
    expect(kindAllowsMethod("Collection", "post")).toBe(true);
    expect(kindAllowsMethod("Item", "delete")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Schema matching
// ---------------------------------------------------------------------------

describe("Schema matching", () => {
  it("anySchema matches everything", () => {
    expect(schemaMatches({ type: "number" }, anySchema)).toBe(true);
    expect(schemaMatches({ type: "string" }, anySchema)).toBe(true);
    expect(
      schemaMatches({ type: "array", items: { type: "number" } }, anySchema),
    ).toBe(true);
    expect(
      schemaMatches(
        { type: "object", properties: { id: { type: "number" } } },
        anySchema,
      ),
    ).toBe(true);
  });

  it("same primitive types match", () => {
    expect(schemaMatches({ type: "null" }, { type: "null" })).toBe(true);
    expect(schemaMatches({ type: "boolean" }, { type: "boolean" })).toBe(true);
    expect(schemaMatches({ type: "number" }, { type: "number" })).toBe(true);
    expect(schemaMatches({ type: "string" }, { type: "string" })).toBe(true);
  });

  it("different types do not match", () => {
    expect(schemaMatches({ type: "number" }, { type: "string" })).toBe(false);
    expect(schemaMatches({ type: "string" }, { type: "array" })).toBe(false);
    expect(schemaMatches({ type: "array" }, { type: "object" })).toBe(false);
  });

  it("array schema matches recursively", () => {
    expect(
      schemaMatches(
        { type: "array", items: { type: "number" } },
        { type: "array", items: { type: "number" } },
      ),
    ).toBe(true);
    expect(
      schemaMatches(
        { type: "array", items: { type: "number" } },
        { type: "array", items: { type: "string" } },
      ),
    ).toBe(false);
    // Sup without items constraint matches any array
    expect(
      schemaMatches(
        { type: "array", items: { type: "number" } },
        { type: "array" },
      ),
    ).toBe(true);
    // Sub without items constraint does not match sup with items
    expect(
      schemaMatches(
        { type: "array" },
        { type: "array", items: { type: "number" } },
      ),
    ).toBe(false);
  });

  it("object schema matches by properties", () => {
    expect(
      schemaMatches(
        {
          type: "object",
          properties: { id: { type: "number" }, name: { type: "string" } },
        },
        { type: "object", properties: { id: { type: "number" } } },
      ),
    ).toBe(true);
    // Missing required property
    expect(
      schemaMatches(
        { type: "object", properties: { id: { type: "number" } } },
        {
          type: "object",
          properties: { id: { type: "number" }, name: { type: "string" } },
        },
      ),
    ).toBe(false);
    // Wrong property type
    expect(
      schemaMatches(
        { type: "object", properties: { id: { type: "string" } } },
        { type: "object", properties: { id: { type: "number" } } },
      ),
    ).toBe(false);
    // Sup without properties matches any object
    expect(
      schemaMatches(
        { type: "object", properties: { id: { type: "number" } } },
        { type: "object" },
      ),
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Representation helpers — REMOVED
//
// value(), raw(), isValueRepr(), isRawRepr() have been removed.
// The transform pipeline now works directly with Repr = { content, meta }.
// Tests for the old helpers have been removed.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// ResourceResponse — REMOVED
//
// ResourceResponse was a duck-typed escape hatch for handlers to set status/headers.
// It has been replaced by Repr (the method's return value is always a Repr).
// Tests for the old ResourceResponse behavior have been removed.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// ResourceFactory factories
// ---------------------------------------------------------------------------

describe("ResourceFactory factories", () => {
  it("Collection creates a CollectionDescriptor", () => {
    const Users = Collection<{ table: string }>(({ table }) => ({
      list: (ctx) => [{ id: 1, table }],
      create: (ctx) => ({
        id: 2,
        ...(ctx.body as Record<string, unknown>),
        table,
      }),
    }));

    const mount = Users({ table: "users" });
    const instance = new mount({}, "") as CollectionResource;
    expect(instance.kind).toBe("Collection");
    if (instance.kind === "Collection") {
      expect(typeof instance.list).toBe("function");
      expect(typeof instance.create).toBe("function");
    }
  });

  it("Item creates an ItemDescriptor", () => {
    const UserItem = Item<{ table: string }>(({ table }) => ({
      content: (ctx) => ({ id: ctx.params.userId, table }),
      delete: (ctx) => {
        /* noop */
      },
    }));

    const mount = UserItem({ table: "users" });
    const instance = new mount({}, "") as ItemResource;
    expect(instance.kind).toBe("Item");
    if (instance.kind === "Item") {
      expect(typeof instance.content).toBe("function");
    }
  });

  it("Singleton creates a SingletonDescriptor", () => {
    const Settings = Singleton(() => ({
      content: (ctx) => ({ theme: "dark" }),
      patch: (ctx) => {
        const data = ctx.body as { theme: string };
        return { theme: data.theme };
      },
    }));

    const mount = Settings({});
    const instance = new mount({}, "") as SingletonResource;
    expect(instance.kind).toBe("Singleton");
  });

  it("ReadOnly creates a ReadOnlyDescriptor", () => {
    const Dashboard = ReadOnly(() => ({
      content: (ctx) => ({ count: 42 }),
    }));

    const mount = Dashboard({});
    const instance = new mount({}, "") as ReadOnlyResource;
    expect(instance.kind).toBe("ReadOnly");
  });

  it("Action creates an ActionDescriptor", () => {
    const SendEmail = Action(() => ({
      invoke: (ctx) => ({ sent: true, to: (ctx.body as { to: string }).to }),
    }));

    const mount = SendEmail({});
    const instance = new mount({}, "") as ActionResource;
    expect(instance.kind).toBe("Action");
  });

  it("Proxy creates a ProxyDescriptor", () => {
    const ExternalAPI = Proxy(() => ({
      target: (path) => new URL(path, "https://api.example.com"),
    }));

    const mount = ExternalAPI({});
    const instance = new mount({}, "") as ProxyResource;
    expect(instance.kind).toBe("Proxy");
  });

  it("ResourceFactory captures config via closure", async () => {
    const Table = Collection<{ tableName: string }>(({ tableName }) => ({
      list: (ctx) => [{ table: tableName }],
      create: (ctx) => ({
        ...(ctx.body as Record<string, unknown>),
        table: tableName,
      }),
    }));

    const users = Table({ tableName: "users" });
    const posts = Table({ tableName: "posts" });

    const usersInstance = new users({}, "") as CollectionResource;
    if (usersInstance.kind === "Collection") {
      const result = await usersInstance.list({
        method: "GET",
        path: "/users",
        params: {},
        query: {},
        headers: {},
      });
      expect((result as { table: string }[])[0].table).toBe("users");
    }
    const postsInstance = new posts({}, "") as CollectionResource;
    if (postsInstance.kind === "Collection") {
      const result = await postsInstance.list({
        method: "GET",
        path: "/posts",
        params: {},
        query: {},
        headers: {},
      });
      expect((result as { table: string }[])[0].table).toBe("posts");
    }
  });

  it("Collection with children", () => {
    const Users = Collection<{ table: string }>(({ table }) => ({
      list: (ctx) => [{ id: 1, table }],
      create: (ctx) => ({
        id: 2,
        ...(ctx.body as Record<string, unknown>),
        table,
      }),
      children: {
        ":userId": (id: string) =>
          class extends ItemResource {
            constructor(params: Record<string, string>, path: string) {
              super({
                content: (ctx: RequestContext) => ({
                  id: Number(id),
                  table,
                }),
              }, undefined, params, path);
            }
          },
      },
    }));

    const mount = Users({ table: "users" });
    const instance = new mount({}, "") as CollectionResource;
    expect(instance.children).toBeDefined();
    expect(":userId" in instance.children!).toBe(true);
  });

  it("Descriptor with element and context", () => {
    const FakeElement = class {};
    const Users = Collection(() => ({
      list: (ctx) => [],
      create: (ctx) => ctx.body,
      element: FakeElement,
      context: "https://rikka.dev/schemas/user",
      jsonldType: "UserCollection",
    }));

    const mount = Users({});
    const instance = new mount({}, "") as CollectionResource;
    expect(instance.element).toBe(FakeElement);
    expect(instance.context).toBe("https://rikka.dev/schemas/user");
    expect(instance.jsonldType).toBe("UserCollection");
  });

  it("Item with optional handlers", () => {
    const UserItem = Item(() => ({
      content: (ctx) => ({ id: 1 }),
      // replace, patch, delete are optional
    }));

    const mount = UserItem({});
    const instance = new mount({}, "") as ItemResource;
    expect(instance.kind).toBe("Item");
    if (instance.kind === "Item") {
      expect(instance.replace).toBeUndefined();
      expect(instance.patch).toBeUndefined();
      expect(instance.delete).toBeUndefined();
    }
  });

  it("Singleton with replace", () => {
    const Settings = Singleton(() => ({
      content: (ctx) => ({ theme: "dark" }),
      replace: (ctx) => ctx.body,
    }));

    const mount = Settings({});
    const instance = new mount({}, "") as SingletonResource;
    if (instance.kind === "Singleton") {
      expect(typeof instance.replace).toBe("function");
    }
  });
});

// ---------------------------------------------------------------------------
// Resource tree and routing
// ---------------------------------------------------------------------------

describe("Resource tree", () => {
  const Users = Collection<{ table: string }>(({ table }) => ({
    list: (ctx) => [{ id: 1, name: "Alice", table }],
    create: (ctx) => ({
      id: 2,
      ...(ctx.body as Record<string, unknown>),
      table,
    }),
    children: {
      ":userId": (id: string) =>
        class extends ItemResource {
            constructor(params: Record<string, string>, path: string) {
              super({
                content: (ctx: RequestContext) => ({
                  id: Number(id),
                  name: "Alice",
                  table,
                }),
                delete: (ctx: RequestContext) => {
                  /* noop */
                },
              }, undefined, params, path);
          }
        },
    },
  }));

  const Settings = Singleton(() => ({
    content: (ctx) => ({ theme: "dark" }),
    patch: (ctx) => {
      const data = ctx.body as { theme: string };
      return { theme: data.theme };
    },
  }));

  const app = new Site({
    users: Users({ table: "users" }),
    settings: Settings({}),
    admin: {
      users: Users({ table: "admin_users" }),
    },
  });

  it("resolves a top-level Collection", () => {
    const resource = app.resolve("/users");
    expect(resource).not.toBeNull();
    expect(resource!.kind).toBe("Collection");
    expect(resource!.path).toBe("/users");
  });

  it("resolves a child Item with params", () => {
    const resource = app.resolve("/users/42");
    expect(resource).not.toBeNull();
    expect(resource!.kind).toBe("Item");
    expect(resource!.params.userId).toBe("42");
  });

  it("resolves a Singleton", () => {
    const resource = app.resolve("/settings");
    expect(resource).not.toBeNull();
    expect(resource!.kind).toBe("Singleton");
  });

  it("resolves nested route groups", () => {
    const resource = app.resolve("/admin/users");
    expect(resource).not.toBeNull();
    expect(resource!.kind).toBe("Collection");
  });

  it("resolves nested route groups with params", () => {
    const resource = app.resolve("/admin/users/7");
    expect(resource).not.toBeNull();
    expect(resource!.kind).toBe("Item");
    expect(resource!.params.userId).toBe("7");
  });

  it("returns null for unknown paths", () => {
    expect(app.resolve("/unknown")).toBeNull();
    expect(app.resolve("/users/42/posts")).toBeNull();
  });

  it("returns null for root path", () => {
    expect(app.resolve("/")).toBeNull();
    expect(app.resolve("")).toBeNull();
  });

  it("handles trailing slashes", () => {
    const resource = app.resolve("/users/");
    expect(resource).not.toBeNull();
    expect(resource!.kind).toBe("Collection");
  });

  it("handles double slashes gracefully", () => {
    // Double slashes produce empty segments which are filtered out
    const resource = app.resolve("//users//42");
    expect(resource).not.toBeNull();
    expect(resource!.kind).toBe("Item");
    expect(resource!.params.userId).toBe("42");
  });
});

// ---------------------------------------------------------------------------
// Deep resource trees
// ---------------------------------------------------------------------------

describe("Deep resource trees", () => {
  it("supports 3+ levels of nesting", () => {
    const Posts = Collection(() => ({
      list: (ctx) => [{ id: 1, title: "Hello" }],
      create: (ctx) => ({ id: 2, ...(ctx.body as Record<string, unknown>) }),
      children: {
        ":postId": (postId: string) =>
          class extends ItemResource {
            constructor(params: Record<string, string>, path: string) {
              super(
                {
                  content: (ctx: RequestContext) => ({
                    id: Number(postId),
                    title: "Hello",
                  }),
                },
                {
                  children: {
                    comments: {
                      ":commentId": (commentId: string) =>
                        class extends ItemResource {
                          constructor(params: Record<string, string>, path: string) {
                            super({
                              content: (ctx: RequestContext) => ({
                                id: Number(commentId),
                                text: "Nice",
                              }),
                            }, undefined, params, path);
                          }
                        },
                    },
                  },
                },
                params,
                path,
              );
            }
          },
      },
    }));

    const app = new Site({ posts: Posts({}) });

    // /posts
    const posts = app.resolve("/posts");
    expect(posts!.kind).toBe("Collection");

    // /posts/1
    const post = app.resolve("/posts/1");
    expect(post!.kind).toBe("Item");
    expect(post!.params.postId).toBe("1");

    // /posts/1/comments/5 — nested children map
    const comment = app.resolve("/posts/1/comments/5");
    expect(comment).not.toBeNull();
    expect(comment!.kind).toBe("Item");
    expect(comment!.params.postId).toBe("1");
    expect(comment!.params.commentId).toBe("5");
  });

  it("supports multiple parameterized children at the same level", () => {
    const Users = Collection(() => ({
      list: (ctx) => [],
      create: (ctx) => ctx.body,
      children: {
        ":userId": (userId: string) =>
          class extends ItemResource {
            constructor(params: Record<string, string>, path: string) {
              super(
                {
                  content: (ctx: RequestContext) => ({ id: Number(userId) }),
                },
                {
                  children: {
                    posts: {
                      ":postId": (postId: string) =>
                        class extends ItemResource {
                          constructor(params: Record<string, string>, path: string) {
                            super({
                              content: (ctx: RequestContext) => ({
                                id: Number(postId),
                                authorId: Number(userId),
                              }),
                            }, undefined, params, path);
                          }
                        },
                    },
                  },
                },
                params,
                path,
              );
            }
          },
      },
    }));

    const app = new Site({ users: Users({}) });
    const resource = app.resolve("/users/42/posts/7");
    expect(resource).not.toBeNull();
    expect(resource!.params.userId).toBe("42");
    expect(resource!.params.postId).toBe("7");
  });

  it("supports exact match before parameterized match", () => {
    const Items = Collection(() => ({
      list: (ctx) => [],
      create: (ctx) => ctx.body,
      children: {
        // "new" is an exact match, ":id" is parameterized
        new: () =>
          class extends ReadOnlyResource {
            constructor(params: Record<string, string>, path: string) {
              super({
                content: (ctx: RequestContext) => ({ form: "new-item" }),
              }, undefined, params, path);
            }
          },
        ":id": (id: string) =>
          class extends ItemResource {
            constructor(params: Record<string, string>, path: string) {
              super({
                content: (ctx: RequestContext) => ({ id: Number(id) }),
              }, undefined, params, path);
            }
          },
      },
    }));

    const app = new Site({ items: Items({}) });

    // Exact match
    const newResource = app.resolve("/items/new");
    expect(newResource!.kind).toBe("ReadOnly");

    // Parameterized match
    const itemResource = app.resolve("/items/123");
    expect(itemResource!.kind).toBe("Item");
    expect(itemResource!.params.id).toBe("123");
  });
});

// ---------------------------------------------------------------------------
// Trailing slash "/" child node
// ---------------------------------------------------------------------------

describe("Trailing slash / child node", () => {
  it("resolves / child on trailing slash", () => {
    const Files = Collection(() => ({
      list: (ctx) => [{ name: "readme.md" }],
      create: (ctx) => ctx.body,
      children: {
        ":filename": (filename: string) =>
          class extends ItemResource {
            constructor(params: Record<string, string>, path: string) {
              super(
                {
                  content: (ctx: RequestContext) => ({
                    name: filename,
                    type: "file",
                  }),
                },
                {
                  children: {
                    "/": () =>
                      class extends CollectionResource {
                        constructor(params: Record<string, string>, path: string) {
                          super({
                            list: (ctx: RequestContext) => [
                              { name: "nested.txt" },
                            ],
                            create: (ctx: RequestContext) => ctx.body,
                          }, undefined, params, path);
                        }
                      },
                  },
                },
                params,
                path,
              );
            }
          },
      },
    }));

    const app = new Site({ files: Files({}) });

    // Without trailing slash → Item
    const file = app.resolve("/files/readme.md");
    expect(file).not.toBeNull();
    expect(file!.kind).toBe("Item");

    // With trailing slash → "/" child (Collection)
    const dir = app.resolve("/files/readme.md/");
    expect(dir).not.toBeNull();
    expect(dir!.kind).toBe("Collection");
  });

  it("falls back to same descriptor when no / child exists", () => {
    const Users = Collection(() => ({
      list: (ctx) => [{ id: 1 }],
      create: (ctx) => ctx.body,
    }));

    const app = new Site({ users: Users({}) });

    // With trailing slash but no "/" child → still resolves to Collection
    const resource = app.resolve("/users/");
    expect(resource).not.toBeNull();
    expect(resource!.kind).toBe("Collection");
  });
});

// ---------------------------------------------------------------------------
// Content negotiation
// ---------------------------------------------------------------------------

describe("Content negotiation", () => {
  // Create a registry with built-in transformers for negotiation tests
  const registry = new TransformerRegistry([
    jsonTransformer,
    jsonldTransformer,
    htmlTransformer,
  ]);

  it("defaults to HTML", () => {
    const result = negotiate(registry);
    expect(result.contentType).toBe("text/html");
  });

  it("respects Accept header", () => {
    expect(negotiate(registry, "application/json").contentType).toBe(
      "application/json",
    );
    expect(negotiate(registry, "application/ld+json").contentType).toBe(
      "application/ld+json",
    );
    expect(negotiate(registry, "text/html").contentType).toBe("text/html");
  });

  it("respects ?accept query parameter", () => {
    expect(negotiate(registry, undefined, "application/json").contentType).toBe(
      "application/json",
    );
    expect(negotiate(registry, undefined, "json").contentType).toBe(
      "application/json",
    );
    expect(negotiate(registry, undefined, "jsonld").contentType).toBe(
      "application/ld+json",
    );
    expect(negotiate(registry, undefined, "json-ld").contentType).toBe(
      "application/ld+json",
    );
  });

  it("query parameter overrides Accept header", () => {
    expect(
      negotiate(registry, "text/html", "application/json").contentType,
    ).toBe("application/json");
  });

  it("handles quality factors in Accept header", () => {
    const result = negotiate(
      registry,
      "text/html;q=0.9, application/json;q=1.0",
    );
    expect(result.contentType).toBe("application/json");
  });

  it("falls back to HTML for unknown types", () => {
    const result = negotiate(registry, "image/png");
    expect(result.contentType).toBe("text/html");
  });

  it("handles complex Accept headers", () => {
    const result = negotiate(
      registry,
      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    );
    expect(result.contentType).toBe("text/html");
  });

  it("prefers json-ld over json when both present", () => {
    const result = negotiate(
      registry,
      "application/ld+json;q=1.0, application/json;q=0.9",
    );
    expect(result.contentType).toBe("application/ld+json");
  });

  it("handles application/* wildcard", () => {
    const result = negotiate(registry, "application/*");
    expect(result.contentType).toBe("application/json");
  });

  it("handles text/* wildcard", () => {
    const result = negotiate(registry, "text/*");
    expect(result.contentType).toBe("text/html");
  });

  it("handles */* wildcard", () => {
    const result = negotiate(registry, "*/*");
    expect(result.contentType).toBe("text/html");
  });

  it("returns html for unrecognized ?accept value", () => {
    const result = negotiate(registry, undefined, "something-unknown");
    expect(result.contentType).toBe("text/html");
  });
});

// ---------------------------------------------------------------------------
// Operation invocation
// ---------------------------------------------------------------------------

describe("Operation invocation", () => {
  it("invokes list on a Collection", async () => {
    const Users = Collection(() => ({
      list: (ctx) => [{ id: 1 }],
      create: (ctx) => ({ id: 2, ...(ctx.body as Record<string, unknown>) }),
    }));

    const app = new Site({ users: Users({}) });
    const resource = app.resolve("/users")!;

    expect(resource).toBeInstanceOf(CollectionResource);
    const result = await (resource as CollectionResource).list({
      method: "GET",
      path: "/users",
      params: {},
      query: {},
      headers: {},
    });
    expect(result).toEqual([{ id: 1 }]);
  });

  it("invokes create on a Collection", async () => {
    const Users = Collection(() => ({
      list: (ctx) => [],
      create: (ctx) => ({ id: 1, ...(ctx.body as Record<string, unknown>) }),
    }));

    const app = new Site({ users: Users({}) });
    const resource = app.resolve("/users")!;

    expect(resource).toBeInstanceOf(CollectionResource);
    const result = await (resource as CollectionResource).create({
      method: "POST",
      path: "/users",
      params: {},
      query: {},
      headers: {},
      body: { name: "Bob" },
    });
    expect(result).toEqual({ id: 1, name: "Bob" });
  });

  it("invokes content on an Item", async () => {
    const UserItem = Item(() => ({
      content: (ctx) => ({ id: ctx.params.userId, name: "Alice" }),
    }));

    const app = new Site({ user: UserItem({}) });
    const resource = app.resolve("/user")!;

    expect(resource).toBeInstanceOf(ItemResource);
    const result = await (resource as ItemResource).content({
      method: "GET",
      path: "/user",
      params: { userId: "42" },
      query: {},
      headers: {},
    });
    expect(result).toEqual({ id: "42", name: "Alice" });
  });

  it("invokes invoke on an Action", async () => {
    const SendEmail = Action(() => ({
      invoke: (ctx) => ({ sent: true, to: (ctx.body as { to: string }).to }),
    }));

    const app = new Site({ sendEmail: SendEmail({}) });
    const resource = app.resolve("/sendEmail")!;

    expect(resource).toBeInstanceOf(ActionResource);
    const result = await (resource as ActionResource).invoke({
      method: "POST",
      path: "/sendEmail",
      params: {},
      query: {},
      headers: {},
      body: { to: "alice@example.com" },
    });
    expect(result).toEqual({ sent: true, to: "alice@example.com" });
  });

  it("disallowed operations are not present on the resource", () => {
    const Users = Collection(() => ({
      list: (ctx) => [],
      create: (ctx) => ctx.body,
    }));

    const app = new Site({ users: Users({}) });
    const resource = app.resolve("/users")!;

    // Collection does not have a "content" operation
    expect(kindAllowsOperation(resource.kind, "content")).toBe(false);
    expect(resource).toBeInstanceOf(CollectionResource);
    expect("content" in resource).toBe(false);
  });

  it("unimplemented operations are undefined", () => {
    const UserItem = Item(() => ({
      content: (ctx) => ({ id: 1 }),
      // no delete
    }));

    const app = new Site({ user: UserItem({}) });
    const resource = app.resolve("/user")!;

    expect(resource).toBeInstanceOf(ItemResource);
    expect((resource as ItemResource).delete).toBeUndefined();
  });

  it("supports async handlers", async () => {
    const Users = Collection(() => ({
      list: async (ctx) => {
        await new Promise((r) => setTimeout(r, 1));
        return [{ id: 1 }];
      },
      create: async (ctx) => {
        await new Promise((r) => setTimeout(r, 1));
        return { id: 2, ...(ctx.body as Record<string, unknown>) };
      },
    }));

    const app = new Site({ users: Users({}) });
    const resource = app.resolve("/users")!;

    expect(resource).toBeInstanceOf(CollectionResource);
    const result = await (resource as CollectionResource).list({
      method: "GET",
      path: "/users",
      params: {},
      query: {},
      headers: {},
    });
    expect(result).toEqual([{ id: 1 }]);
  });
});

// ---------------------------------------------------------------------------
// RequestContext
// ---------------------------------------------------------------------------

describe("RequestContext", () => {
  it("handlers can access ctx.params", async () => {
    const UserItem = Item(() => ({
      content: (ctx) => ({ id: ctx.params.userId, name: "Alice" }),
    }));

    const app = new Site({ user: UserItem({}) });
    const resource = app.resolve("/user")!;

    expect(resource).toBeInstanceOf(ItemResource);
    const result = await (resource as ItemResource).content({
      method: "GET",
      path: "/user",
      params: { userId: "99" },
      query: {},
      headers: {},
    });
    expect(result).toEqual({ id: "99", name: "Alice" });
  });

  it("handlers can access ctx.body", async () => {
    const Users = Collection(() => ({
      list: (ctx) => [],
      create: (ctx) => ({ id: 1, ...(ctx.body as Record<string, unknown>) }),
    }));

    const app = new Site({ users: Users({}) });
    const resource = app.resolve("/users")!;

    expect(resource).toBeInstanceOf(CollectionResource);
    const result = await (resource as CollectionResource).create({
      method: "POST",
      path: "/users",
      params: {},
      query: {},
      headers: {},
      body: { name: "Charlie" },
    });
    expect(result).toEqual({ id: 1, name: "Charlie" });
  });

  it("handlers can access ctx.query", async () => {
    const Users = Collection(() => ({
      list: (ctx) => [{ id: 1, page: ctx.query.page ?? "1" }],
      create: (ctx) => ctx.body,
    }));

    const app = new Site({ users: Users({}) });
    const resource = app.resolve("/users")!;

    expect(resource).toBeInstanceOf(CollectionResource);
    const result = await (resource as CollectionResource).list({
      method: "GET",
      path: "/users",
      params: {},
      query: { page: "3" },
      headers: {},
    });
    expect(result).toEqual([{ id: 1, page: "3" }]);
  });

  it("handlers can access ctx.headers", async () => {
    const Echo = Action(() => ({
      invoke: (ctx) => ({
        auth: ctx.headers["authorization"] ?? "none",
      }),
    }));

    const app = new Site({ echo: Echo({}) });
    const resource = app.resolve("/echo")!;

    expect(resource).toBeInstanceOf(ActionResource);
    const result = await (resource as ActionResource).invoke({
      method: "POST",
      path: "/echo",
      params: {},
      query: {},
      headers: { authorization: "Bearer token123" },
    });
    expect(result).toEqual({ auth: "Bearer token123" });
  });
});

// ---------------------------------------------------------------------------
// HTTP request handling
// ---------------------------------------------------------------------------

describe("HTTP request handling", () => {
  const Users = Collection<{ table: string }>(({ table }) => ({
    list: (ctx) => ({ content: [{ id: 1, name: "Alice" }], meta: {} }),
    create: (ctx) => {
      const item = { id: 2, ...(ctx.body as Record<string, unknown>) };
      return {
        content: item,
        meta: { location: `./${(item as { id: number }).id}` },
      };
    },
    children: {
      ":userId": (id: string) =>
        class extends ItemResource {
          constructor(params: Record<string, string>, path: string) {
            super({
              content: (ctx: RequestContext) => ({
                id: Number(id),
                name: "Alice",
              }),
              replace: (ctx: RequestContext) => ({
                id: Number(id),
                ...(ctx.body as Record<string, unknown>),
              }),
              patch: (ctx: RequestContext) => ({
                id: Number(id),
                ...(ctx.body as Record<string, unknown>),
              }),
              delete: (ctx: RequestContext) => undefined,
            }, undefined, params, path);
          }
        },
    },
  }));

  const Settings = Singleton(() => ({
    content: (ctx) => ({ theme: "dark" }),
    replace: (ctx) => ctx.body,
    patch: (ctx) => {
      const data = ctx.body as { theme: string };
      return { theme: data.theme };
    },
  }));

  const Dashboard = ReadOnly(() => ({
    content: (ctx) => ({ count: 42, active: true }),
  }));

  const CalculateTax = Action(() => ({
    invoke: (ctx) => ({ tax: (ctx.body as { amount: number }).amount * 0.1 }),
  }));

  const app = new Site({
    users: Users({ table: "users" }),
    settings: Settings({}),
    dashboard: Dashboard({}),
    actions: {
      calculateTax: CalculateTax({}),
    },
  });

  it("GET /users returns 200 with JSON", async () => {
    const response = await app.handleRequest({
      method: "GET",
      path: "/users",
      accept: "application/json",
    });
    expect(response.status).toBe(200);
    expect(response.headers["Content-Type"]).toBe("application/json");
    const body = JSON.parse(bodyText(response.body));
    expect(body).toEqual([{ id: 1, name: "Alice" }]);
  });

  it("GET /users returns HTML by default", async () => {
    const response = await app.handleRequest({
      method: "GET",
      path: "/users",
    });
    expect(response.status).toBe(200);
    expect(response.headers["Content-Type"]).toBe("text/html");
    expect(bodyText(response.body)).toContain("<!DOCTYPE html>");
  });

  it("GET /users/42 returns Item data", async () => {
    const response = await app.handleRequest({
      method: "GET",
      path: "/users/42",
      accept: "application/json",
    });
    expect(response.status).toBe(200);
    const body = JSON.parse(bodyText(response.body));
    expect(body.id).toBe(42);
  });

  it("POST /users returns 201", async () => {
    const response = await app.handleRequest({
      method: "POST",
      path: "/users",
      accept: "application/json",
      body: { name: "Bob" },
    });
    expect(response.status).toBe(201);
  });

  it("PUT /users/42 replaces item", async () => {
    const response = await app.handleRequest({
      method: "PUT",
      path: "/users/42",
      accept: "application/json",
      body: { name: "Charlie" },
    });
    expect(response.status).toBe(200);
    const body = JSON.parse(bodyText(response.body));
    expect(body.name).toBe("Charlie");
  });

  it("PATCH /users/42 patches item", async () => {
    const response = await app.handleRequest({
      method: "PATCH",
      path: "/users/42",
      accept: "application/json",
      body: { name: "Dave" },
    });
    expect(response.status).toBe(200);
  });

  it("DELETE /users/42 works", async () => {
    const response = await app.handleRequest({
      method: "DELETE",
      path: "/users/42",
    });
    expect(response.status).toBe(204);
  });

  it("GET /settings returns Singleton data", async () => {
    const response = await app.handleRequest({
      method: "GET",
      path: "/settings",
      accept: "application/json",
    });
    expect(response.status).toBe(200);
    const body = JSON.parse(bodyText(response.body));
    expect(body.theme).toBe("dark");
  });

  it("PUT /settings replaces singleton", async () => {
    const response = await app.handleRequest({
      method: "PUT",
      path: "/settings",
      accept: "application/json",
      body: { theme: "light" },
    });
    expect(response.status).toBe(200);
  });

  it("PATCH /settings patches singleton", async () => {
    const response = await app.handleRequest({
      method: "PATCH",
      path: "/settings",
      accept: "application/json",
      body: { theme: "light" },
    });
    expect(response.status).toBe(200);
  });

  it("GET /dashboard returns ReadOnly data", async () => {
    const response = await app.handleRequest({
      method: "GET",
      path: "/dashboard",
      accept: "application/json",
    });
    expect(response.status).toBe(200);
    const body = JSON.parse(bodyText(response.body));
    expect(body.count).toBe(42);
  });

  it("POST /actions/calculateTax invokes action", async () => {
    const response = await app.handleRequest({
      method: "POST",
      path: "/actions/calculateTax",
      accept: "application/json",
      body: { amount: 100 },
    });
    expect(response.status).toBe(200);
    const body = JSON.parse(bodyText(response.body));
    expect(body.tax).toBe(10);
  });

  it("404 for unknown paths", async () => {
    const response = await app.handleRequest({
      method: "GET",
      path: "/nonexistent",
    });
    expect(response.status).toBe(404);
  });

  it("405 for disallowed methods", async () => {
    const response = await app.handleRequest({
      method: "DELETE",
      path: "/users",
    });
    expect(response.status).toBe(405);
    expect(response.headers.Allow).toContain("GET");
    expect(response.headers.Allow).toContain("POST");
  });

  it("405 for DELETE on Singleton", async () => {
    const response = await app.handleRequest({
      method: "DELETE",
      path: "/settings",
    });
    expect(response.status).toBe(405);
  });

  it("405 for POST on ReadOnly", async () => {
    const response = await app.handleRequest({
      method: "POST",
      path: "/dashboard",
    });
    expect(response.status).toBe(405);
  });

  it("405 for GET on Action", async () => {
    const response = await app.handleRequest({
      method: "GET",
      path: "/actions/calculateTax",
    });
    expect(response.status).toBe(405);
  });

  it("?accept query parameter overrides header", async () => {
    const response = await app.handleRequest({
      method: "GET",
      path: "/users",
      accept: "text/html",
      acceptQuery: "application/json",
    });
    expect(response.headers["Content-Type"]).toBe("application/json");
  });

  it("GET /users with JSON-LD accept returns ld+json with @graph", async () => {
    const response = await app.handleRequest({
      method: "GET",
      path: "/users",
      accept: "application/ld+json",
    });
    expect(response.status).toBe(200);
    expect(response.headers["Content-Type"]).toBe("application/ld+json");
    const body = JSON.parse(bodyText(response.body));
    expect(body["@context"]).toBeDefined();
    expect(body["@type"]).toBe("Collection");
    expect(body["@graph"]).toBeDefined();
    expect(Array.isArray(body["@graph"])).toBe(true);
  });

  it("GET /users/42 with JSON-LD includes @id", async () => {
    const response = await app.handleRequest({
      method: "GET",
      path: "/users/42",
      accept: "application/ld+json",
    });
    expect(response.status).toBe(200);
    const body = JSON.parse(bodyText(response.body));
    expect(body["@id"]).toBeDefined();
    expect(body["@type"]).toBe("Item");
  });

  it("HTML response includes data-resource attribute (data-attr hydration)", async () => {
    const response = await app.handleRequest({
      method: "GET",
      path: "/users",
    });
    expect(bodyText(response.body)).toContain('data-resource="');
  });

  it("HTML response includes rikka-resource element", async () => {
    const response = await app.handleRequest({
      method: "GET",
      path: "/users",
    });
    expect(bodyText(response.body)).toContain("<rikka-resource");
    expect(bodyText(response.body)).toContain('kind="Collection"');
  });

  it("handles handler errors with 500", async () => {
    const Broken = Collection(() => ({
      list: (ctx) => {
        throw new Error("DB connection failed");
      },
      create: (ctx) => ctx.body,
    }));

    const brokenApp = new Site({ broken: Broken({}) });
    const response = await brokenApp.handleRequest({
      method: "GET",
      path: "/broken",
      accept: "application/json",
    });
    expect(response.status).toBe(500);
    expect(bodyText(response.body)).toBe("DB connection failed");
  });

  it("handles non-Error throws with 500", async () => {
    const Broken = Collection(() => ({
      list: (ctx) => {
        throw "string error";
      },
      create: (ctx) => ctx.body,
    }));

    const brokenApp = new Site({ broken: Broken({}) });
    const response = await brokenApp.handleRequest({
      method: "GET",
      path: "/broken",
    });
    expect(response.status).toBe(500);
    expect(bodyText(response.body)).toBe("Internal Server Error");
  });

  it("handles async handler errors", async () => {
    const Broken = Collection(() => ({
      list: async (ctx) => {
        throw new Error("Async fail");
      },
      create: (ctx) => ctx.body,
    }));

    const brokenApp = new Site({ broken: Broken({}) });
    const response = await brokenApp.handleRequest({
      method: "GET",
      path: "/broken",
    });
    expect(response.status).toBe(500);
    expect(bodyText(response.body)).toBe("Async fail");
  });

  it("passes headers in RequestContext", async () => {
    const Echo = Action(() => ({
      invoke: (ctx) => ({
        auth: ctx.headers["authorization"] ?? "none",
      }),
    }));

    const echoApp = new Site({ echo: Echo({}) });
    const response = await echoApp.handleRequest({
      method: "POST",
      path: "/echo",
      accept: "application/json",
      headers: { authorization: "Bearer test123" },
    });
    expect(response.status).toBe(200);
    const body = JSON.parse(bodyText(response.body));
    expect(body.auth).toBe("Bearer test123");
  });
});

// ---------------------------------------------------------------------------
// resolveResource directly
// ---------------------------------------------------------------------------

describe("resolveResource", () => {
  it("resolves root descriptor with empty path", () => {
    const desc = Collection(() => ({
      list: (ctx) => [],
      create: (ctx) => ctx.body,
    }))({});

    const result = resolveResource(desc, "");
    expect(result).not.toBeNull();
    expect(result!.kind).toBe("Collection");
  });

  it("returns null when no children and path has segments", () => {
    const desc = ReadOnly(() => ({
      content: (ctx) => ({ value: 1 }),
    }))({});

    const result = resolveResource(desc, "something");
    expect(result).toBeNull();
  });

  it("resolves children with exact match", () => {
    const desc = Collection(() => ({
      list: (ctx) => [],
      create: (ctx) => ctx.body,
      children: {
        special: () =>
          class extends ReadOnlyResource {
            constructor(params: Record<string, string>, path: string) {
              super({
                content: (ctx: RequestContext) => ({ special: true }),
              }, undefined, params, path);
            }
          },
      },
    }))({});

    const result = resolveResource(desc, "special");
    expect(result).not.toBeNull();
    expect(result!.kind).toBe("ReadOnly");
  });
});

// ---------------------------------------------------------------------------
// Integration: full site with all kinds
// ---------------------------------------------------------------------------

describe("Full site integration", () => {
  // Simulating a realistic site structure
  const Articles = Collection(() => ({
    list: (ctx) => [
      { id: 1, title: "First Post", authorId: 1 },
      { id: 2, title: "Second Post", authorId: 2 },
    ],
    create: (ctx) => ({ id: 3, ...(ctx.body as Record<string, unknown>) }),
    children: {
      ":articleId": (articleId: string) =>
        class extends ItemResource {
          constructor(params: Record<string, string>, path: string) {
            super(
              {
                content: (ctx: RequestContext) => ({
                  id: Number(articleId),
                  title: "First Post",
                  authorId: 1,
                }),
                replace: (ctx: RequestContext) => ({
                  id: Number(articleId),
                  ...(ctx.body as Record<string, unknown>),
                }),
                patch: (ctx: RequestContext) => ({
                  id: Number(articleId),
                  ...(ctx.body as Record<string, unknown>),
                }),
                delete: (ctx: RequestContext) => undefined,
              },
              {
                children: {
                  comments: {
                    ":commentId": (commentId: string) =>
                      class extends ItemResource {
                        constructor(params: Record<string, string>, path: string) {
                          super({
                            content: (ctx: RequestContext) => ({
                              id: Number(commentId),
                              text: "Great article!",
                            }),
                          }, undefined, params, path);
                        }
                      },
                  },
                },
              },
              params,
              path,
            );
          }
        },
    },
  }));

  const Profile = Singleton(() => ({
    content: (ctx) => ({ name: "Alice", bio: "Developer" }),
    patch: (ctx) => ({
      name: "Alice",
      ...(ctx.body as Record<string, unknown>),
    }),
  }));

  const Stats = ReadOnly(() => ({
    content: (ctx) => ({ views: 1000, likes: 42 }),
  }));

  const SendNotification = Action(() => ({
    invoke: (ctx) => ({ sent: true, to: (ctx.body as { to: string }).to }),
  }));

  const app = new Site({
    articles: Articles({}),
    profile: Profile({}),
    stats: Stats({}),
    actions: {
      sendNotification: SendNotification({}),
    },
    admin: {
      articles: Articles({}),
    },
  });

  it("resolves and serves Collection", async () => {
    const res = await app.handleRequest({
      method: "GET",
      path: "/articles",
      accept: "application/json",
    });
    expect(res.status).toBe(200);
    const body = JSON.parse(bodyText(res.body));
    expect(body).toHaveLength(2);
  });

  it("resolves and serves deep Item", async () => {
    const res = await app.handleRequest({
      method: "GET",
      path: "/articles/1/comments/5",
      accept: "application/json",
    });
    expect(res.status).toBe(200);
    const body = JSON.parse(bodyText(res.body));
    expect(body.id).toBe(5);
    expect(body.text).toBe("Great article!");
  });

  it("resolves and serves Singleton", async () => {
    const res = await app.handleRequest({
      method: "GET",
      path: "/profile",
      accept: "application/json",
    });
    expect(res.status).toBe(200);
    const body = JSON.parse(bodyText(res.body));
    expect(body.name).toBe("Alice");
  });

  it("resolves and serves ReadOnly", async () => {
    const res = await app.handleRequest({
      method: "GET",
      path: "/stats",
      accept: "application/json",
    });
    expect(res.status).toBe(200);
    const body = JSON.parse(bodyText(res.body));
    expect(body.views).toBe(1000);
  });

  it("resolves and serves Action", async () => {
    const res = await app.handleRequest({
      method: "POST",
      path: "/actions/sendNotification",
      accept: "application/json",
      body: { to: "bob@example.com" },
    });
    expect(res.status).toBe(200);
    const body = JSON.parse(bodyText(res.body));
    expect(body.sent).toBe(true);
  });

  it("resolves nested route group", async () => {
    const res = await app.handleRequest({
      method: "GET",
      path: "/admin/articles",
      accept: "application/json",
    });
    expect(res.status).toBe(200);
  });

  it("content negotiation works across all kinds", async () => {
    // JSON
    const jsonRes = await app.handleRequest({
      method: "GET",
      path: "/stats",
      accept: "application/json",
    });
    expect(jsonRes.headers["Content-Type"]).toBe("application/json");

    // JSON-LD
    const jsonldRes = await app.handleRequest({
      method: "GET",
      path: "/stats",
      accept: "application/ld+json",
    });
    expect(jsonldRes.headers["Content-Type"]).toBe("application/ld+json");

    // HTML
    const htmlRes = await app.handleRequest({
      method: "GET",
      path: "/stats",
    });
    expect(htmlRes.headers["Content-Type"]).toBe("text/html");
  });
});

// ---------------------------------------------------------------------------
// Transformer system
// ---------------------------------------------------------------------------

describe("Transformer registry", () => {
  it("registers and finds Value→Raw transformers", () => {
    const registry = new TransformerRegistry();
    const csvTransformer: Transformer = {
      input: { type: "array", items: { type: "object" } },
      output: "text/csv",
      transform(repr: Repr, ctx: TransformContext): Repr {
        if (!Array.isArray(repr.content))
          return { content: "", meta: { type: "text/csv" } };
        const rows = repr.content.map((row: unknown) =>
          Object.values(row as Record<string, unknown>).join(","),
        );
        return { content: rows.join("\n"), meta: { type: "text/csv" } };
      },
    };

    registry.register(csvTransformer);
    const found = registry.findTransformer("text/csv");
    expect(found).toBe(csvTransformer);
    registry.unregister(csvTransformer);
  });

  it("registers and finds Raw→Raw transformers", () => {
    const registry = new TransformerRegistry();
    const imageToHtml: Transformer = {
      input: "image/*",
      output: "text/html",
      transform(repr: Repr, ctx: TransformContext): Repr {
        const mimeType = repr.meta.type ?? "";
        return {
          content: `<img src="data:${mimeType};base64,${repr.content}" />`,
          meta: { type: "text/html" },
        };
      },
    };

    registry.register(imageToHtml);
    const found = registry.findRawToRawTransformer("image/png", "text/html");
    expect(found).toBe(imageToHtml);
    registry.unregister(imageToHtml);
  });

  it("findValueTransformers returns transformers matching schema", () => {
    const registry = new TransformerRegistry();
    const filterTransformer: Transformer = {
      input: { type: "array", items: { type: "object" } },
      output: { type: "array", items: { type: "object" } },
      transform(repr: Repr, ctx: TransformContext): Repr {
        return repr;
      },
    };

    registry.register(filterTransformer);
    const found = registry.findValueTransformers({
      type: "array",
      items: { type: "object" },
    });
    expect(found).toContain(filterTransformer);
    registry.unregister(filterTransformer);
  });

  it("findValueToRawTransformer finds direct Value→Raw transformer", () => {
    const registry = new TransformerRegistry();
    const csvTransformer: Transformer = {
      input: { type: "array", items: { type: "object" } },
      output: "text/csv",
      transform(repr: Repr, ctx: TransformContext): Repr {
        return { content: "", meta: { type: "text/csv" } };
      },
    };

    registry.register(csvTransformer);
    const found = registry.findValueToRawTransformer(
      { type: "array", items: { type: "object" } },
      "text/csv",
    );
    expect(found).toBe(csvTransformer);
    registry.unregister(csvTransformer);
  });

  it("findValueToRawTransformer returns null when no match", () => {
    const registry = new TransformerRegistry();
    expect(
      registry.findValueToRawTransformer({ type: "number" }, "text/xml"),
    ).toBeNull();
  });

  it("findRawToRawTransformer returns null when no match", () => {
    const registry = new TransformerRegistry();
    expect(
      registry.findRawToRawTransformer("text/plain", "image/png"),
    ).toBeNull();
  });

  it("canProduce checks if a type is producible", () => {
    const registry = new TransformerRegistry([
      jsonTransformer,
      htmlTransformer,
      jsonldTransformer,
    ]);
    expect(registry.canProduce("application/json")).toBe(true);
    expect(registry.canProduce("text/html")).toBe(true);
    expect(registry.canProduce("application/ld+json")).toBe(true);
    expect(registry.canProduce("text/xml")).toBe(false);
  });

  it("registeredOutputTypes lists all output types", () => {
    const registry = new TransformerRegistry([
      jsonTransformer,
      htmlTransformer,
      jsonldTransformer,
    ]);
    const types = registry.registeredOutputTypes();
    expect(types).toContain("application/json");
    expect(types).toContain("text/html");
    expect(types).toContain("application/ld+json");
  });

  it("unregister removes transformer", () => {
    const registry = new TransformerRegistry();
    const xmlTransformer: Transformer = {
      input: { type: "any" },
      output: "text/xml",
      transform(repr: Repr, ctx: TransformContext): Repr {
        return {
          content: `<root>${repr.content}</root>`,
          meta: { type: "text/xml" },
        };
      },
    };

    registry.register(xmlTransformer);
    expect(registry.canProduce("text/xml")).toBe(true);

    registry.unregister(xmlTransformer);
    expect(registry.canProduce("text/xml")).toBe(false);
  });

  it("Raw→Raw transformer wildcard matching works", () => {
    const registry = new TransformerRegistry();
    const anyImageTransformer: Transformer = {
      input: "image/*",
      output: "text/html",
      transform(repr: Repr, ctx: TransformContext): Repr {
        const mimeType = repr.meta.type ?? "";
        return {
          content: `<img src="data:${mimeType}" />`,
          meta: { type: "text/html" },
        };
      },
    };

    registry.register(anyImageTransformer);

    // Should match image/png, image/jpeg, etc.
    expect(registry.findRawToRawTransformer("image/png", "text/html")).toBe(
      anyImageTransformer,
    );
    expect(registry.findRawToRawTransformer("image/jpeg", "text/html")).toBe(
      anyImageTransformer,
    );
    // Should NOT match text/plain
    expect(
      registry.findRawToRawTransformer("text/plain", "text/html"),
    ).toBeNull();

    registry.unregister(anyImageTransformer);
  });
});

describe("Transformer pipeline", () => {
  const Users = Collection(() => ({
    list: (ctx) => [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ],
    create: (ctx) => ({ id: 3, ...(ctx.body as Record<string, unknown>) }),
  }));

  const app = new Site({ users: Users({}) });

  it("Value → JSON transformation", async () => {
    const resource = app.resolve("/users")!;
    const result = await app.registry.transformPipeline(
      resource,
      { content: [{ id: 1 }], meta: {} },
      "application/json",
    );
    expect(result.contentType).toBe("application/json");
    expect(JSON.parse(result.body)).toEqual([{ id: 1 }]);
  });

  it("Value → JSON-LD transformation", async () => {
    const resource = app.resolve("/users")!;
    const result = await app.registry.transformPipeline(
      resource,
      { content: [{ id: 1 }], meta: {} },
      "application/ld+json",
    );
    expect(result.contentType).toBe("application/ld+json");
    const body = JSON.parse(result.body);
    expect(body["@context"]).toBeDefined();
    expect(body["@graph"]).toEqual([{ id: 1 }]);
  });

  it("Value → HTML transformation", async () => {
    const resource = app.resolve("/users")!;
    const result = await app.registry.transformPipeline(
      resource,
      { content: [{ id: 1 }], meta: {} },
      "text/html",
    );
    expect(result.contentType).toBe("text/html");
    expect(result.body).toContain("<!DOCTYPE html>");
  });

  it("custom Value→Raw CSV transformer", async () => {
    const csvTransformer: Transformer = {
      input: anySchema,
      output: "text/csv",
      transform(repr: Repr, ctx: TransformContext): Repr {
        if (!Array.isArray(repr.content))
          return { content: "", meta: { type: "text/csv" } };
        const headers = Object.keys(
          repr.content[0] as Record<string, unknown>,
        ).join(",");
        const rows = repr.content.map((row: unknown) =>
          Object.values(row as Record<string, unknown>).join(","),
        );
        return {
          content: [headers, ...rows].join("\n"),
          meta: { type: "text/csv" },
        };
      },
    };

    app.registry.register(csvTransformer);

    const resource = app.resolve("/users")!;
    const data = await (resource as CollectionResource).list({
      method: "GET",
      path: "/users",
      params: {},
      query: {},
      headers: {},
    });
    const result = await app.registry.transformPipeline(
      resource,
      { content: data, meta: {} },
      "text/csv",
    );

    expect(result.contentType).toBe("text/csv");
    expect(result.body).toContain("id,name");
    expect(result.body).toContain("1,Alice");
    expect(result.body).toContain("2,Bob");

    app.registry.unregister(csvTransformer);
  });

  it("Raw→Raw chain: JSON → HTML wrapper", async () => {
    const jsonToHtmlWrapper: Transformer = {
      input: "application/json",
      output: "text/html",
      transform(repr: Repr, ctx: TransformContext): Repr {
        const jsonData = typeof repr.content === "string" ? repr.content : "";
        return {
          content: `<html><body><pre>${jsonData}</pre></body></html>`,
          meta: { type: "text/html" },
        };
      },
    };

    app.registry.register(jsonToHtmlWrapper);

    const resource = app.resolve("/users")!;
    const data = await (resource as CollectionResource).list({
      method: "GET",
      path: "/users",
      params: {},
      query: {},
      headers: {},
    });
    const result = await app.registry.transformPipeline(
      resource,
      { content: data, meta: {} },
      "text/html",
    );

    // Should use the MIME chain: Value → JSON → HTML wrapper
    // But since there's a direct Value → HTML transformer with higher priority,
    // this test verifies the chain works when direct is not available
    expect(result.contentType).toBe("text/html");

    app.registry.unregister(jsonToHtmlWrapper);
  });

  it("Value→Value transformer: data filtering", async () => {
    const filterTransformer: Transformer = {
      input: anySchema,
      output: anySchema,
      priority: 100,
      transform(repr: Repr, ctx: TransformContext): Repr {
        // Filter: only keep items with id > 1
        if (Array.isArray(repr.content)) {
          return {
            content: repr.content.filter(
              (item: unknown) =>
                typeof item === "object" &&
                item !== null &&
                "id" in item &&
                (item as { id: number }).id > 1,
            ),
            meta: repr.meta,
          };
        }
        return repr;
      },
    };

    app.registry.register(filterTransformer);

    const resource = app.resolve("/users")!;
    const data = await (resource as CollectionResource).list({
      method: "GET",
      path: "/users",
      params: {},
      query: {},
      headers: {},
    });
    const result = await app.registry.transformPipeline(
      resource,
      { content: data, meta: {} },
      "application/json",
    );

    expect(result.contentType).toBe("application/json");
    const body = JSON.parse(result.body);
    // Only Bob (id: 2) should remain
    expect(body).toEqual([{ id: 2, name: "Bob" }]);

    app.registry.unregister(filterTransformer);
  });

  it("falls back to JSON when no transformer matches", async () => {
    const resource = app.resolve("/users")!;
    const result = await app.registry.transformPipeline(
      resource,
      { content: { hello: "world" }, meta: {} },
      "text/xml",
    );
    // No XML transformer registered, falls back to JSON
    expect(result.contentType).toBe("application/json");
    expect(JSON.parse(result.body)).toEqual({ hello: "world" });
  });
});

describe("Transformer + HTTP integration", () => {
  it("custom CSV transformer works through handleRequest", async () => {
    const csvTransformer: Transformer = {
      input: anySchema,
      output: "text/csv",
      transform(repr: Repr, ctx: TransformContext): Repr {
        if (!Array.isArray(repr.content))
          return { content: "", meta: { type: "text/csv" } };
        const headers = Object.keys(
          repr.content[0] as Record<string, unknown>,
        ).join(",");
        const rows = repr.content.map((row: unknown) =>
          Object.values(row as Record<string, unknown>).join(","),
        );
        return {
          content: [headers, ...rows].join("\n"),
          meta: { type: "text/csv" },
        };
      },
    };

    const Users = Collection(() => ({
      list: (ctx) => [{ id: 1, name: "Alice" }],
      create: (ctx) => ctx.body,
    }));

    const app = new Site({ users: Users({}) });
    app.registry.register(csvTransformer);

    const response = await app.handleRequest({
      method: "GET",
      path: "/users",
      acceptQuery: "text/csv",
    });

    expect(response.status).toBe(200);
    expect(response.headers["Content-Type"]).toBe("text/csv");
    expect(bodyText(response.body)).toContain("id,name");
    expect(bodyText(response.body)).toContain("1,Alice");

    app.registry.unregister(csvTransformer);
  });

  it("Raw→Raw chain works through handleRequest", async () => {
    // Register a JSON → XML wrapper transformer
    const jsonToXml: Transformer = {
      input: "application/json",
      output: "text/xml",
      transform(repr: Repr, ctx: TransformContext): Repr {
        const jsonData = typeof repr.content === "string" ? repr.content : "{}";
        return {
          content: `<?xml version="1.0"?><data>${jsonData}</data>`,
          meta: { type: "text/xml" },
        };
      },
    };

    const Users = Collection(() => ({
      list: (ctx) => [{ id: 1 }],
      create: (ctx) => ctx.body,
    }));

    const app = new Site({ users: Users({}) });
    app.registry.register(jsonToXml);

    const response = await app.handleRequest({
      method: "GET",
      path: "/users",
      acceptQuery: "text/xml",
    });

    expect(response.status).toBe(200);
    expect(response.headers["Content-Type"]).toBe("text/xml");
    expect(bodyText(response.body)).toContain("<?xml");
    expect(bodyText(response.body)).toContain("<data>");

    app.registry.unregister(jsonToXml);
  });
});

// ---------------------------------------------------------------------------
// getDescriptorSchema
// ---------------------------------------------------------------------------

describe("getDescriptorSchema", () => {
  it("returns the descriptor schema when set", () => {
    const Ctor = Collection(() => ({
      schema: { type: "array", items: { type: "object" } },
      list: (ctx) => [],
      create: (ctx) => ctx.body,
    }))({});
    const desc = new Ctor({}, "");

    expect(getDescriptorSchema(desc)).toEqual({
      type: "array",
      items: { type: "object" },
    });
  });

  it("returns anySchema when no schema set", () => {
    const Ctor = ReadOnly(() => ({
      content: (ctx) => ({ value: 1 }),
    }))({});
    const desc = new Ctor({}, "");

    expect(getDescriptorSchema(desc)).toEqual({ type: "any" });
  });
});

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

describe("Auth", () => {
  describe("globMatch", () => {
    it("matches exact paths", () => {
      expect(globMatch("/users", "/users")).toBe(true);
      expect(globMatch("/users", "/settings")).toBe(false);
    });

    it("matches single * wildcard", () => {
      expect(globMatch("/users/*", "/users/42")).toBe(true);
      expect(globMatch("/users/*", "/users/42/posts")).toBe(false);
    });

    it("matches ** wildcard", () => {
      expect(globMatch("/users/**", "/users")).toBe(true);
      expect(globMatch("/users/**", "/users/42")).toBe(true);
      expect(globMatch("/users/**", "/users/42/posts")).toBe(true);
      expect(globMatch("/users/**", "/settings")).toBe(false);
    });

    it("matches combined patterns", () => {
      expect(globMatch("/api/*/items/**", "/api/v1/items/42")).toBe(true);
      expect(globMatch("/api/*/items/**", "/api/v1/items")).toBe(true);
      expect(globMatch("/api/*/items/**", "/api/items/42")).toBe(false);
    });
  });

  describe("matchAuthRule", () => {
    it("returns undefined when no rule matches", () => {
      const rules: AuthRule[] = [{ match: "/users/**" }];
      expect(matchAuthRule("/public", rules)).toBeUndefined();
    });

    it("returns undefined for first matching rule (uses verifier)", () => {
      const rules: AuthRule[] = [{ match: "/users/**" }];
      // undefined = use the verifier (default auth)
      expect(matchAuthRule("/users/42", rules)).toBeUndefined();
    });

    it("returns explicit auth name from rule", () => {
      const rules: AuthRule[] = [{ match: "/admin/**", auth: "admin-auth" }];
      expect(matchAuthRule("/admin/settings", rules)).toBe("admin-auth");
    });

    it("returns null for explicitly disabled auth", () => {
      const rules: AuthRule[] = [
        { match: "/public/**", auth: null },
        { match: "/**" },
      ];
      expect(matchAuthRule("/public/page", rules)).toBeNull();
    });

    it("first matching rule wins", () => {
      const rules: AuthRule[] = [
        { match: "/public/**", auth: null },
        { match: "/**" },
      ];
      // /public/page matches first rule → null (no auth)
      expect(matchAuthRule("/public/page", rules)).toBeNull();
      // /admin/page matches second rule → undefined (use verifier)
      expect(matchAuthRule("/admin/page", rules)).toBeUndefined();
    });
  });

  describe("Proxy resolves with sub-paths", () => {
    it("resolve returns Proxy for any sub-path under the prefix", () => {
      const Proxy2 = Proxy(() => ({
        target: (path) => new URL(path, "https://example.test"),
      }));
      const app = new Site({ proxy: Proxy2({}) });

      const r1 = app.resolve("/proxy");
      expect(r1?.kind).toBe("Proxy");
      expect(r1?.path).toBe("/proxy");

      const r2 = app.resolve("/proxy/posts/1");
      expect(r2?.kind).toBe("Proxy");
      expect(r2?.path).toBe("/proxy");

      const r3 = app.resolve("/proxy/a/b/c/d");
      expect(r3?.kind).toBe("Proxy");
    });

    it("Proxy handler receives the full request path in target", async () => {
      let capturedPath = "";
      const P = Proxy(() => ({
        target: (path) => {
          capturedPath = path;
          // Throw to short-circuit fetch — we only care about what `path` was passed in
          throw new Error("STOP_FETCH");
        },
      }));
      const app = new Site({ p: P({}) });
      try {
        await app.handleRequest({
          method: "GET",
          path: "/p/posts/1",
        });
      } catch (e) {
        // ignore — we only need the captured path
      }
      expect(capturedPath).toBe("/p/posts/1");
    });
  });

  describe("Auth integration with handleRequest", () => {
    it("blocks unauthenticated requests to protected routes", async () => {
      const JwtAuth = Action(() => ({
        invoke: (ctx) => {
          const auth = ctx.headers["authorization"];
          if (!auth) {
            throw new HttpError(401, "Missing token");
          }
          return { subject: "user1", scopes: "read" } as Identity;
        },
      }));

      const Users = Collection(() => ({
        list: (ctx) => [{ id: 1, name: "Alice" }],
        create: (ctx) => ctx.body,
      }));

      const app = new Site(
        {
          "jwt-auth": JwtAuth({}),
          users: Users({}),
        },
        {
          auth: {
            verifier: "jwt-auth",
            rules: [{ match: "/users/**", auth: "jwt-auth" }],
          },
        },
      );

      // No auth header → 401
      const response = await app.handleRequest({
        method: "GET",
        path: "/users",
        accept: "application/json",
      });
      expect(response.status).toBe(401);
    });

    it("allows authenticated requests to protected routes", async () => {
      const JwtAuth = Action(() => ({
        invoke: (ctx) => {
          const auth = ctx.headers["authorization"];
          if (!auth) {
            throw new HttpError(401, "Missing token");
          }
          return { subject: "user1", scopes: "read" } as Identity;
        },
      }));

      const Users = Collection(() => ({
        list: (ctx) => [{ id: 1, name: "Alice" }],
        create: (ctx) => ctx.body,
      }));

      const app = new Site(
        {
          "jwt-auth": JwtAuth({}),
          users: Users({}),
        },
        {
          auth: {
            verifier: "jwt-auth",
            rules: [{ match: "/users/**", auth: "jwt-auth" }],
          },
        },
      );

      // With auth header → 200
      const response = await app.handleRequest({
        method: "GET",
        path: "/users",
        accept: "application/json",
        headers: { authorization: "Bearer token123" },
      });
      expect(response.status).toBe(200);
    });

    it("allows access to routes with auth: null", async () => {
      const JwtAuth = Action(() => ({
        invoke: (ctx) => {
          throw new HttpError(401, "Unauthorized");
        },
      }));

      const Public = ReadOnly(() => ({
        content: (ctx) => ({ message: "hello" }),
      }));

      const Users = Collection(() => ({
        list: (ctx) => [{ id: 1 }],
        create: (ctx) => ctx.body,
      }));

      const app = new Site(
        {
          "jwt-auth": JwtAuth({}),
          public: Public({}),
          users: Users({}),
        },
        {
          auth: {
            verifier: "jwt-auth",
            rules: [
              { match: "/public/**", auth: null },
              { match: "/**", auth: "jwt-auth" },
            ],
          },
        },
      );

      // /public is explicitly no auth → 200
      const publicResponse = await app.handleRequest({
        method: "GET",
        path: "/public",
        accept: "application/json",
      });
      expect(publicResponse.status).toBe(200);

      // /users requires auth → 401
      const usersResponse = await app.handleRequest({
        method: "GET",
        path: "/users",
        accept: "application/json",
      });
      expect(usersResponse.status).toBe(401);
    });
  });
});

// ---------------------------------------------------------------------------
// Edge runtime adapter (Web Standard Request/Response)
// ---------------------------------------------------------------------------

describe("Edge runtime adapter", () => {
  const Users = Collection(() => ({
    list: (ctx) => ({ content: [{ id: 1, name: "Alice" }], meta: {} }),
    create: (ctx) => {
      const item = { id: 2, ...(ctx.body as Record<string, unknown>) };
      return {
        content: item,
        meta: { location: `./${(item as { id: number }).id}` },
      };
    },
    children: {
      ":userId": (id: string) =>
        class extends ItemResource {
          constructor(params: Record<string, string>, path: string) {
            super({
              content: (ctx: RequestContext) => ({
                id: Number(id),
                name: "Alice",
              }),
              delete: (ctx: RequestContext) => undefined,
            }, undefined, params, path);
          }
        },
    },
  }));

  const Settings = Singleton(() => ({
    content: (ctx) => ({ theme: "dark" }),
  }));

  const app = new Site({
    users: Users({}),
    settings: Settings({}),
  });

  it("handleWebRequest converts Web Request to Response", async () => {
    const request = new Request("http://localhost/users", {
      headers: { Accept: "application/json" },
    });

    const response = await handleWebRequest(app, request);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("application/json");

    const body = await response.json();
    expect(body).toEqual([{ id: 1, name: "Alice" }]);
  });

  it("handleWebRequest with ?accept query parameter", async () => {
    const request = new Request("http://localhost/users?accept=json");
    const response = await handleWebRequest(app, request);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("application/json");
  });

  it("handleWebRequest returns HTML by default", async () => {
    const request = new Request("http://localhost/users");
    const response = await handleWebRequest(app, request);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/html");
    const body = await response.text();
    expect(body).toContain("<!DOCTYPE html>");
  });

  it("handleWebRequest resolves child resources", async () => {
    const request = new Request("http://localhost/users/42", {
      headers: { Accept: "application/json" },
    });
    const response = await handleWebRequest(app, request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.id).toBe(42);
  });

  it("handleWebRequest returns 404", async () => {
    const request = new Request("http://localhost/nonexistent");
    const response = await handleWebRequest(app, request);
    expect(response.status).toBe(404);
  });

  it("handleWebRequest returns 405", async () => {
    const request = new Request("http://localhost/users", { method: "DELETE" });
    const response = await handleWebRequest(app, request);
    expect(response.status).toBe(405);
  });

  it("handleWebRequest handles POST with JSON body", async () => {
    const request = new Request("http://localhost/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ name: "Bob" }),
    });

    const response = await handleWebRequest(app, request);
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.name).toBe("Bob");
  });

  it("handleWebRequest handles GET on Singleton", async () => {
    const request = new Request("http://localhost/settings", {
      headers: { Accept: "application/json" },
    });
    const response = await handleWebRequest(app, request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.theme).toBe("dark");
  });

  it("createFetchHandler returns a fetch function", async () => {
    const fetch = createFetchHandler(app);
    const request = new Request("http://localhost/users", {
      headers: { Accept: "application/json" },
    });

    const response = await fetch(request);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("application/json");
  });

  it("handleWebRequest with JSON-LD accept", async () => {
    const request = new Request("http://localhost/users", {
      headers: { Accept: "application/ld+json" },
    });
    const response = await handleWebRequest(app, request);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain(
      "application/ld+json",
    );
    const body = await response.json();
    expect(body["@context"]).toBeDefined();
    expect(body["@type"]).toBe("Collection");
  });
});

// ---------------------------------------------------------------------------
// new Site() return type
// ---------------------------------------------------------------------------

describe("new Site() return type", () => {
  it("returns definition, options, registry, and resolve", () => {
    const Users = Collection(() => ({
      list: (ctx) => [],
      create: (ctx) => ctx.body,
    }));

    const app = new Site({ users: Users({}) });
    expect(app.definition).toBeDefined();
    expect(app.options).toBeDefined();
    expect(app.registry).toBeInstanceOf(TransformerRegistry);
    expect(typeof app.resolve).toBe("function");
  });

  it("accepts SiteOptions with auth config", () => {
    const JwtAuth = Action(() => ({
      invoke: (ctx) => ({ subject: "test" }) as Identity,
    }));

    const Users = Collection(() => ({
      list: (ctx) => [],
      create: (ctx) => ctx.body,
    }));

    const app = new Site(
      { "jwt-auth": JwtAuth({}), users: Users({}) },
      {
        auth: {
          verifier: "jwt-auth",
          rules: [{ match: "/users/**" }],
        },
      },
    );

    expect(app.options.auth).toBeDefined();
    expect(app.options.auth!.verifier).toBe("jwt-auth");
    expect(app.options.auth!.rules).toHaveLength(1);
  });
});
