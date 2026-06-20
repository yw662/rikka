import { describe, it, expect } from "@rstest/core";
import {
  CollectionKind,
  ItemKind,
  SingletonKind,
  ReadOnlyKind,
  ActionKind,
  ProxyKind,
  CollectionResource,
  ItemResource,
  SingletonResource,
  ReadOnlyResource,
  ActionResource,
  ProxyResource,
  Site,
  handleWebRequest,
  createFetchHandler,
  resolveResource,
  negotiate,
  TransformerRegistry,
  jsonTransformer,
  jsonldTransformer,
  htmlTransformer,
  getDescriptorSchema,
  schemaMatches,
  anySchema,
  globMatch,
  matchAuthRule,
  HttpError,
  createRequestContext,
  jsonBody,
} from "../src/index.js";
import type {
  Transformer,
  TransformContext,
  RequestContext,
  Identity,
  AuthRule,
  Schema,
  Repr,
} from "../src/index.js";


async function bodyText(
  body: string | Uint8Array | ReadableStream<Uint8Array>,
): Promise<string> {
  if (typeof body === "string") return body;
  if (body instanceof Uint8Array) return new TextDecoder().decode(body);
  // ReadableStream
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
// Kind
// ---------------------------------------------------------------------------

describe("Kind", () => {
  class TestCollection extends CollectionKind {
    async list(ctx: RequestContext): Promise<Repr> {
      return { content: [], meta: {} };
    }
    async create(ctx: RequestContext): Promise<Repr> {
      return { content: null, meta: {} };
    }
  }
  class TestItem extends ItemKind {
    async content(ctx: RequestContext): Promise<Repr> {
      return { content: null, meta: {} };
    }
    async replace(ctx: RequestContext): Promise<Repr> {
      return { content: null, meta: {} };
    }
    async patch(ctx: RequestContext): Promise<Repr> {
      return { content: null, meta: {} };
    }
    async delete(ctx: RequestContext): Promise<Repr> {
      return { content: null, meta: {} };
    }
  }
  class TestSingleton extends SingletonKind {
    async content(ctx: RequestContext): Promise<Repr> {
      return { content: null, meta: {} };
    }
    async replace(ctx: RequestContext): Promise<Repr> {
      return { content: null, meta: {} };
    }
    async patch(ctx: RequestContext): Promise<Repr> {
      return { content: null, meta: {} };
    }
  }
  class TestReadOnly extends ReadOnlyKind {
    async content(ctx: RequestContext): Promise<Repr> {
      return { content: null, meta: {} };
    }
  }
  class TestAction extends ActionKind {
    async invoke(ctx: RequestContext): Promise<Repr> {
      return { content: null, meta: {} };
    }
  }
  class TestProxy extends ProxyKind {
    target(path: string): URL {
      return new URL(path, "https://example.com");
    }
  }

  const collection = new TestCollection();
  const item = new TestItem();
  const singleton = new TestSingleton();
  const readOnly = new TestReadOnly();
  const action = new TestAction();
  const proxy = new TestProxy();

  it("Collection allows GET and POST", () => {
    const resource = collection.createResource({}, "/test");
    expect(resource).toBeInstanceOf(CollectionResource);
    expect(resource.allowedMethods()).toEqual(["GET", "POST"]);
  });

  it("Item allows GET, PUT, PATCH, DELETE", () => {
    const resource = item.createResource({}, "/test");
    expect(resource).toBeInstanceOf(ItemResource);
    expect(resource.allowedMethods()).toEqual(["GET", "PUT", "PATCH", "DELETE"]);
  });

  it("Singleton allows GET, PUT, PATCH", () => {
    const resource = singleton.createResource({}, "/test");
    expect(resource).toBeInstanceOf(SingletonResource);
    expect(resource.allowedMethods()).toEqual(["GET", "PUT", "PATCH"]);
  });

  it("ReadOnly allows only GET", () => {
    const resource = readOnly.createResource({}, "/test");
    expect(resource).toBeInstanceOf(ReadOnlyResource);
    expect(resource.allowedMethods()).toEqual(["GET"]);
  });

  it("Action allows only POST", () => {
    const resource = action.createResource({}, "/test");
    expect(resource).toBeInstanceOf(ActionResource);
    expect(resource.allowedMethods()).toEqual(["POST"]);
  });

  it("Proxy exposes proxy() method", () => {
    const resource = proxy.createResource({}, "/test");
    expect(resource).toBeInstanceOf(ProxyResource);
    expect(typeof resource.proxy).toBe("function");
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
    class Users extends CollectionKind {
      constructor(private table: string) {
        super();
      }
      async list(ctx: RequestContext): Promise<Repr> {
        return { content: [{ id: 1, table: this.table }], meta: {} };
      }
      async create(ctx: RequestContext): Promise<Repr> {
        return {
          content: {
            id: 2,
            ...(await ctx.json<Record<string, unknown>>()),
            table: this.table,
          },
          meta: {},
        };
      }
    }

    const instance = new Users("users");
    expect(instance).toBeInstanceOf(CollectionKind);
    expect(typeof instance.list).toBe("function");
    expect(typeof instance.create).toBe("function");
  });

  it("Item creates an ItemDescriptor", () => {
    class UserItem extends ItemKind {
      constructor(private table: string) {
        super();
      }
      async content(ctx: RequestContext): Promise<Repr> {
        return {
          content: { id: ctx.params.userId, table: this.table },
          meta: {},
        };
      }
      async delete(ctx: RequestContext): Promise<Repr> {
        return { content: null, meta: {} };
      }
    }

    const instance = new UserItem("users");
    expect(instance).toBeInstanceOf(ItemKind);
    expect(typeof instance.content).toBe("function");
  });

  it("Singleton creates a SingletonDescriptor", () => {
    class Settings extends SingletonKind {
      async content(ctx: RequestContext): Promise<Repr> {
        return { content: { theme: "dark" }, meta: {} };
      }
      async patch(ctx: RequestContext): Promise<Repr> {
        const data = await ctx.json<{ theme: string }>();
        return { content: { theme: data.theme }, meta: {} };
      }
    }

    const instance = new Settings();
    expect(instance).toBeInstanceOf(SingletonKind);
  });

  it("ReadOnly creates a ReadOnlyDescriptor", () => {
    class Dashboard extends ReadOnlyKind {
      async content(ctx: RequestContext): Promise<Repr> {
        return { content: { count: 42 }, meta: {} };
      }
    }

    const instance = new Dashboard();
    expect(instance).toBeInstanceOf(ReadOnlyKind);
  });

  it("Action creates an ActionDescriptor", () => {
    class SendEmail extends ActionKind {
      async invoke(ctx: RequestContext): Promise<Repr> {
        return {
          content: {
            sent: true,
            to: (await ctx.json<{ to: string }>()).to,
          },
          meta: {},
        };
      }
    }

    const instance = new SendEmail();
    expect(instance).toBeInstanceOf(ActionKind);
  });

  it("Proxy creates a ProxyDescriptor", () => {
    class ExternalAPI extends ProxyKind {
      target(path: string): URL {
        return new URL(path, "https://api.example.com");
      }
    }

    const instance = new ExternalAPI();
    expect(instance).toBeInstanceOf(ProxyKind);
  });

  it("ResourceFactory captures config via closure", async () => {
    class Table extends CollectionKind {
      constructor(private tableName: string) {
        super();
      }
      async list(ctx: RequestContext): Promise<Repr> {
        return { content: [{ table: this.tableName }], meta: {} };
      }
      async create(ctx: RequestContext): Promise<Repr> {
        return {
          content: {
            ...(await ctx.json<Record<string, unknown>>()),
            table: this.tableName,
          },
          meta: {},
        };
      }
    }

    const usersInstance = new Table("users");
    const usersResult = await usersInstance.list(
      createRequestContext({
        method: "GET",
        path: "/users",
      }),
    );
    expect((usersResult.content as { table: string }[])[0].table).toBe("users");

    const postsInstance = new Table("posts");
    const postsResult = await postsInstance.list(
      createRequestContext({
        method: "GET",
        path: "/posts",
      }),
    );
    expect((postsResult.content as { table: string }[])[0].table).toBe("posts");
  });

  it("Collection with children", () => {
    class Users extends CollectionKind {
      constructor(private table: string) {
        super();
      }
      children = {
        ":userId": new (class extends ItemKind {
          async content(ctx: RequestContext): Promise<Repr> {
            return { content: { id: Number(ctx.params.userId) }, meta: {} };
          }
        })(),
      };
      async list(ctx: RequestContext): Promise<Repr> {
        return { content: [{ id: 1, table: this.table }], meta: {} };
      }
      async create(ctx: RequestContext): Promise<Repr> {
        return {
          content: {
            id: 2,
            ...(await ctx.json<Record<string, unknown>>()),
            table: this.table,
          },
          meta: {},
        };
      }
    }

    const instance = new Users("users");
    expect(instance.children).toBeDefined();
    expect(":userId" in instance.children!).toBe(true);
  });

  it("Descriptor with element and context", () => {
    const FakeElement = class {};
    class Users extends CollectionKind {
      element = FakeElement;
      context = "https://rikka.dev/schemas/user";
      jsonldType = "UserCollection";
      async list(ctx: RequestContext): Promise<Repr> {
        return { content: [], meta: {} };
      }
      async create(ctx: RequestContext): Promise<Repr> {
        return { content: await ctx.json(), meta: {} };
      }
    }

    const instance = new Users();
    expect(instance.element).toBe(FakeElement);
    expect(instance.context).toBe("https://rikka.dev/schemas/user");
    expect(instance.jsonldType).toBe("UserCollection");
  });

  it("Item with optional handlers", () => {
    class UserItem extends ItemKind {
      async content(ctx: RequestContext): Promise<Repr> {
        return { content: { id: 1 }, meta: {} };
      }
    }

    const instance = new UserItem();
    expect(instance).toBeInstanceOf(ItemKind);
    expect(instance.replace).toBeUndefined();
    expect(instance.patch).toBeUndefined();
    expect(instance.delete).toBeUndefined();
  });

  it("Singleton with replace", () => {
    class Settings extends SingletonKind {
      async content(ctx: RequestContext): Promise<Repr> {
        return { content: { theme: "dark" }, meta: {} };
      }
      async replace(ctx: RequestContext): Promise<Repr> {
        return { content: await ctx.json(), meta: {} };
      }
    }

    const instance = new Settings();
    expect(typeof instance.replace).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// Resource tree and routing
// ---------------------------------------------------------------------------

describe("Resource tree", () => {
  class Users extends CollectionKind {
    constructor(private table: string) {
      super();
    }
    children = {
      ":userId": new (class extends ItemKind {
        async content(ctx: RequestContext): Promise<Repr> {
          return {
            content: { id: Number(ctx.params.userId), name: "Alice" },
            meta: {},
          };
        }
        async delete(ctx: RequestContext): Promise<Repr> {
          return { content: null, meta: {} };
        }
      })(),
    };
    async list(ctx: RequestContext): Promise<Repr> {
      return {
        content: [{ id: 1, name: "Alice", table: this.table }],
        meta: {},
      };
    }
    async create(ctx: RequestContext): Promise<Repr> {
      return {
        content: {
          id: 2,
          ...(await ctx.json<Record<string, unknown>>()),
          table: this.table,
        },
        meta: {},
      };
    }
  }

  class Settings extends SingletonKind {
    async content(ctx: RequestContext): Promise<Repr> {
      return { content: { theme: "dark" }, meta: {} };
    }
    async patch(ctx: RequestContext): Promise<Repr> {
      const data = await ctx.json<{ theme: string }>();
      return { content: { theme: data.theme }, meta: {} };
    }
  }

  const app = new Site({
    users: new Users("users"),
    settings: new Settings(),
    admin: {
      users: new Users("admin_users"),
    },
  });

  it("resolves a top-level Collection", () => {
    const resource = app.resolve("/users");
    expect(resource).not.toBeNull();
    expect(resource).toBeInstanceOf(CollectionResource);
    expect(resource!.path).toBe("/users");
  });

  it("resolves a child Item with params", () => {
    const resource = app.resolve("/users/42");
    expect(resource).not.toBeNull();
    expect(resource).toBeInstanceOf(ItemResource);
    expect(resource!.params.userId).toBe("42");
  });

  it("resolves a Singleton", () => {
    const resource = app.resolve("/settings");
    expect(resource).not.toBeNull();
    expect(resource).toBeInstanceOf(SingletonResource);
  });

  it("resolves nested route groups", () => {
    const resource = app.resolve("/admin/users");
    expect(resource).not.toBeNull();
    expect(resource).toBeInstanceOf(CollectionResource);
  });

  it("resolves nested route groups with params", () => {
    const resource = app.resolve("/admin/users/7");
    expect(resource).not.toBeNull();
    expect(resource).toBeInstanceOf(ItemResource);
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
    expect(resource).toBeInstanceOf(CollectionResource);
  });

  it("handles double slashes gracefully", () => {
    // Double slashes produce empty segments which are filtered out
    const resource = app.resolve("//users//42");
    expect(resource).not.toBeNull();
    expect(resource).toBeInstanceOf(ItemResource);
    expect(resource!.params.userId).toBe("42");
  });
});

// ---------------------------------------------------------------------------
// Deep resource trees
// ---------------------------------------------------------------------------

describe("Deep resource trees", () => {
  it("supports 3+ levels of nesting", () => {
    class Posts extends CollectionKind {
      children = {
        ":postId": new (class extends ItemKind {
          children = {
            comments: {
              ":commentId": new (class extends ItemKind {
                async content(ctx: RequestContext): Promise<Repr> {
                  return {
                    content: { id: Number(ctx.params.commentId), text: "Nice" },
                    meta: {},
                  };
                }
              })(),
            },
          };
          async content(ctx: RequestContext): Promise<Repr> {
            return {
              content: { id: Number(ctx.params.postId), title: "Hello" },
              meta: {},
            };
          }
        })(),
      };
      async list(ctx: RequestContext): Promise<Repr> {
        return { content: [{ id: 1, title: "Hello" }], meta: {} };
      }
      async create(ctx: RequestContext): Promise<Repr> {
        return {
          content: { id: 2, ...(await ctx.json<Record<string, unknown>>()) },
          meta: {},
        };
      }
    }

    const app = new Site({ posts: new Posts() });

    // /posts
    const posts = app.resolve("/posts");
    expect(posts).toBeInstanceOf(CollectionResource);

    // /posts/1
    const post = app.resolve("/posts/1");
    expect(post).toBeInstanceOf(ItemResource);
    expect(post!.params.postId).toBe("1");

    // /posts/1/comments/5 — nested children map
    const comment = app.resolve("/posts/1/comments/5");
    expect(comment).not.toBeNull();
    expect(comment).toBeInstanceOf(ItemResource);
    expect(comment!.params.postId).toBe("1");
    expect(comment!.params.commentId).toBe("5");
  });

  it("supports multiple parameterized children at the same level", () => {
    class Users extends CollectionKind {
      children = {
        ":userId": new (class extends ItemKind {
          children = {
            posts: {
              ":postId": new (class extends ItemKind {
                async content(ctx: RequestContext): Promise<Repr> {
                  return {
                    content: {
                      id: Number(ctx.params.postId),
                      authorId: Number(ctx.params.userId),
                    },
                    meta: {},
                  };
                }
              })(),
            },
          };
          async content(ctx: RequestContext): Promise<Repr> {
            return { content: { id: Number(ctx.params.userId) }, meta: {} };
          }
        })(),
      };
      async list(ctx: RequestContext): Promise<Repr> {
        return { content: [], meta: {} };
      }
      async create(ctx: RequestContext): Promise<Repr> {
        return { content: await ctx.json(), meta: {} };
      }
    }

    const app = new Site({ users: new Users() });
    const resource = app.resolve("/users/42/posts/7");
    expect(resource).not.toBeNull();
    expect(resource!.params.userId).toBe("42");
    expect(resource!.params.postId).toBe("7");
  });

  it("supports exact match before parameterized match", () => {
    const NewItem = new (class extends ReadOnlyKind {
      async content(ctx: RequestContext): Promise<Repr> {
        return { content: { form: "new-item" }, meta: {} };
      }
    })();
    class Items extends CollectionKind {
      children = {
        // "new" is an exact match, ":id" is parameterized
        new: NewItem,
        ":id": new (class extends ItemKind {
          async content(ctx: RequestContext): Promise<Repr> {
            return { content: { id: Number(ctx.params.id) }, meta: {} };
          }
        })(),
      };
      async list(ctx: RequestContext): Promise<Repr> {
        return { content: [], meta: {} };
      }
      async create(ctx: RequestContext): Promise<Repr> {
        return { content: await ctx.json(), meta: {} };
      }
    }

    const app = new Site({ items: new Items() });

    // Exact match
    const newResource = app.resolve("/items/new");
    expect(newResource).toBeInstanceOf(ReadOnlyResource);

    // Parameterized match
    const itemResource = app.resolve("/items/123");
    expect(itemResource).toBeInstanceOf(ItemResource);
    expect(itemResource!.params.id).toBe("123");
  });
});

// ---------------------------------------------------------------------------
// Trailing slash "/" child node
// ---------------------------------------------------------------------------

describe("Trailing slash / child node", () => {
  it("resolves / child on trailing slash", () => {
    class Files extends CollectionKind {
      children = {
        ":filename": new (class extends ItemKind {
          children = {
            "/": new (class extends CollectionKind {
              async list(ctx: RequestContext): Promise<Repr> {
                return { content: [{ name: "nested.txt" }], meta: {} };
              }
              async create(ctx: RequestContext): Promise<Repr> {
                return { content: await ctx.json(), meta: {} };
              }
            })(),
          };
          async content(ctx: RequestContext): Promise<Repr> {
            return {
              content: { name: ctx.params.filename, type: "file" },
              meta: {},
            };
          }
        })(),
      };
      async list(ctx: RequestContext): Promise<Repr> {
        return { content: [{ name: "readme.md" }], meta: {} };
      }
      async create(ctx: RequestContext): Promise<Repr> {
        return { content: await ctx.json(), meta: {} };
      }
    }

    const app = new Site({ files: new Files() });

    // Without trailing slash → Item
    const file = app.resolve("/files/readme.md");
    expect(file).not.toBeNull();
    expect(file).toBeInstanceOf(ItemResource);

    // With trailing slash → "/" child (Collection)
    const dir = app.resolve("/files/readme.md/");
    expect(dir).not.toBeNull();
    expect(dir).toBeInstanceOf(CollectionResource);
  });

  it("falls back to same descriptor when no / child exists", () => {
    class Users extends CollectionKind {
      async list(ctx: RequestContext): Promise<Repr> {
        return { content: [{ id: 1 }], meta: {} };
      }
      async create(ctx: RequestContext): Promise<Repr> {
        return { content: await ctx.json(), meta: {} };
      }
    }

    const app = new Site({ users: new Users() });

    // With trailing slash but no "/" child → still resolves to Collection
    const resource = app.resolve("/users/");
    expect(resource).not.toBeNull();
    expect(resource).toBeInstanceOf(CollectionResource);
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
    class Users extends CollectionKind {
      async list(ctx: RequestContext): Promise<Repr> {
        return { content: [{ id: 1 }], meta: {} };
      }
      async create(ctx: RequestContext): Promise<Repr> {
        return {
          content: { id: 2, ...(await ctx.json<Record<string, unknown>>()) },
          meta: {},
        };
      }
    }

    const app = new Site({ users: new Users() });
    const resource = app.resolve("/users")!;

    expect(resource).toBeInstanceOf(CollectionResource);
    const result = await resource.get(
      createRequestContext({
        method: "GET",
        path: "/users",
      }),
    );
    expect(result).toEqual({ content: [{ id: 1 }], meta: {} });
  });

  it("invokes create on a Collection", async () => {
    class Users extends CollectionKind {
      async list(ctx: RequestContext): Promise<Repr> {
        return { content: [], meta: {} };
      }
      async create(ctx: RequestContext): Promise<Repr> {
        return {
          content: { id: 1, ...(await ctx.json<Record<string, unknown>>()) },
          meta: {},
        };
      }
    }

    const app = new Site({ users: new Users() });
    const resource = app.resolve("/users")!;

    expect(resource).toBeInstanceOf(CollectionResource);
    const result = await resource.post(
      createRequestContext({
        method: "POST",
        path: "/users",
        body: { name: "Bob" },
      }),
    );
    expect(result).toEqual({ content: { id: 1, name: "Bob" }, meta: {} });
  });

  it("invokes content on an Item", async () => {
    class UserItem extends ItemKind {
      async content(ctx: RequestContext): Promise<Repr> {
        return { content: { id: ctx.params.userId, name: "Alice" }, meta: {} };
      }
    }

    const app = new Site({ user: new UserItem() });
    const resource = app.resolve("/user")!;

    expect(resource).toBeInstanceOf(ItemResource);
    const result = await resource.get(
      createRequestContext({
        method: "GET",
        path: "/user",
        params: { userId: "42" },
      }),
    );
    expect(result).toEqual({ content: { id: "42", name: "Alice" }, meta: {} });
  });

  it("invokes invoke on an Action", async () => {
    class SendEmail extends ActionKind {
      async invoke(ctx: RequestContext): Promise<Repr> {
        return {
          content: {
            sent: true,
            to: (await ctx.json<{ to: string }>()).to,
          },
          meta: {},
        };
      }
    }

    const app = new Site({ sendEmail: new SendEmail() });
    const resource = app.resolve("/sendEmail")!;

    expect(resource).toBeInstanceOf(ActionResource);
    const result = await resource.invoke!(
      createRequestContext({
        method: "POST",
        path: "/sendEmail",
        body: { to: "alice@example.com" },
      }),
    );
    expect(result).toEqual({
      content: { sent: true, to: "alice@example.com" },
      meta: {},
    });
  });

  it("disallowed operations are not present on the resource", () => {
    class Users extends CollectionKind {
      async list(ctx: RequestContext): Promise<Repr> {
        return { content: [], meta: {} };
      }
      async create(ctx: RequestContext): Promise<Repr> {
        return { content: await ctx.json(), meta: {} };
      }
    }

    const app = new Site({ users: new Users() });
    const resource = app.resolve("/users")!;

    // Collection does not have a "content" operation
    expect(resource).toBeInstanceOf(CollectionResource);
    expect(resource.allowedMethods()).toEqual(["GET", "POST"]);
    expect("content" in resource).toBe(false);
  });

  it("unimplemented operations are undefined", () => {
    class UserItem extends ItemKind {
      async content(ctx: RequestContext): Promise<Repr> {
        return { content: { id: 1 }, meta: {} };
      }
      // no delete
    }

    const app = new Site({ user: new UserItem() });
    const resource = app.resolve("/user")!;

    expect(resource).toBeInstanceOf(ItemResource);
    expect(resource.allowedMethods()).toEqual(["GET"]);
  });

  it("supports async handlers", async () => {
    class Users extends CollectionKind {
      async list(ctx: RequestContext): Promise<Repr> {
        await new Promise((r) => setTimeout(r, 1));
        return { content: [{ id: 1 }], meta: {} };
      }
      async create(ctx: RequestContext): Promise<Repr> {
        await new Promise((r) => setTimeout(r, 1));
        return {
          content: { id: 2, ...(await ctx.json<Record<string, unknown>>()) },
          meta: {},
        };
      }
    }

    const app = new Site({ users: new Users() });
    const resource = app.resolve("/users")!;

    expect(resource).toBeInstanceOf(CollectionResource);
    const result = await resource.get(
      createRequestContext({
        method: "GET",
        path: "/users",
      }),
    );
    expect(result).toEqual({ content: [{ id: 1 }], meta: {} });
  });
});

// ---------------------------------------------------------------------------
// RequestContext
// ---------------------------------------------------------------------------

describe("RequestContext", () => {
  it("handlers can access ctx.params", async () => {
    class UserItem extends ItemKind {
      async content(ctx: RequestContext): Promise<Repr> {
        return { content: { id: ctx.params.userId, name: "Alice" }, meta: {} };
      }
    }

    const app = new Site({ user: new UserItem() });
    const resource = app.resolve("/user")!;

    expect(resource).toBeInstanceOf(ItemResource);
    const result = await resource.get(
      createRequestContext({
        method: "GET",
        path: "/user",
        params: { userId: "99" },
      }),
    );
    expect(result).toEqual({ content: { id: "99", name: "Alice" }, meta: {} });
  });

  it("handlers can access ctx.body", async () => {
    class Users extends CollectionKind {
      async list(ctx: RequestContext): Promise<Repr> {
        return { content: [], meta: {} };
      }
      async create(ctx: RequestContext): Promise<Repr> {
        return {
          content: { id: 1, ...(await ctx.json<Record<string, unknown>>()) },
          meta: {},
        };
      }
    }

    const app = new Site({ users: new Users() });
    const resource = app.resolve("/users")!;

    expect(resource).toBeInstanceOf(CollectionResource);
    const result = await resource.post(
      createRequestContext({
        method: "POST",
        path: "/users",
        body: { name: "Charlie" },
      }),
    );
    expect(result).toEqual({ content: { id: 1, name: "Charlie" }, meta: {} });
  });

  it("handlers can access ctx.query", async () => {
    class Users extends CollectionKind {
      async list(ctx: RequestContext): Promise<Repr> {
        return { content: [{ id: 1, page: ctx.query.page ?? "1" }], meta: {} };
      }
      async create(ctx: RequestContext): Promise<Repr> {
        return { content: await ctx.json(), meta: {} };
      }
    }

    const app = new Site({ users: new Users() });
    const resource = app.resolve("/users")!;

    expect(resource).toBeInstanceOf(CollectionResource);
    const result = await resource.get(
      createRequestContext({
        method: "GET",
        path: "/users",
        query: { page: "3" },
      }),
    );
    expect(result).toEqual({ content: [{ id: 1, page: "3" }], meta: {} });
  });

  it("handlers can access ctx.headers", async () => {
    class Echo extends ActionKind {
      async invoke(ctx: RequestContext): Promise<Repr> {
        return {
          content: { auth: ctx.headers["authorization"] ?? "none" },
          meta: {},
        };
      }
    }

    const app = new Site({ echo: new Echo() });
    const resource = app.resolve("/echo")!;

    expect(resource).toBeInstanceOf(ActionResource);
    const result = await resource.invoke!(
      createRequestContext({
        method: "POST",
        path: "/echo",
        headers: { authorization: "Bearer token123" },
      }),
    );
    expect(result).toEqual({ content: { auth: "Bearer token123" }, meta: {} });
  });
});

// ---------------------------------------------------------------------------
// HTTP request handling
// ---------------------------------------------------------------------------

describe("HTTP request handling", () => {
  class Users extends CollectionKind {
    async list(ctx: RequestContext): Promise<Repr> {
      return { content: [{ id: 1, name: "Alice" }], meta: {} };
    }
    async create(ctx: RequestContext): Promise<Repr> {
      const item = { id: 2, ...(await ctx.json<Record<string, unknown>>()) };
      return {
        content: item,
        meta: { location: `./${(item as { id: number }).id}` },
      };
    }
    children = {
      ":userId": new (class extends ItemKind {
        async content(ctx: RequestContext): Promise<Repr> {
          return {
            content: { id: Number(ctx.params.userId), name: "Alice" },
            meta: {},
          };
        }
        async replace(ctx: RequestContext): Promise<Repr> {
          return {
            content: {
              id: Number(ctx.params.userId),
              ...(await ctx.json<Record<string, unknown>>()),
            },
            meta: {},
          };
        }
        async patch(ctx: RequestContext): Promise<Repr> {
          return {
            content: {
              id: Number(ctx.params.userId),
              ...(await ctx.json<Record<string, unknown>>()),
            },
            meta: {},
          };
        }
        async delete(ctx: RequestContext): Promise<Repr> {
          return { content: null, meta: {} };
        }
      })(),
    };
  }

  class Settings extends SingletonKind {
    async content(ctx: RequestContext): Promise<Repr> {
      return { content: { theme: "dark" }, meta: {} };
    }
    async replace(ctx: RequestContext): Promise<Repr> {
      return { content: await ctx.json(), meta: {} };
    }
    async patch(ctx: RequestContext): Promise<Repr> {
      const data = await ctx.json<{ theme: string }>();
      return { content: { theme: data.theme }, meta: {} };
    }
  }

  class Dashboard extends ReadOnlyKind {
    async content(ctx: RequestContext): Promise<Repr> {
      return { content: { count: 42, active: true }, meta: {} };
    }
  }

  class CalculateTax extends ActionKind {
    async invoke(ctx: RequestContext): Promise<Repr> {
      return {
        content: { tax: (await ctx.json<{ amount: number }>()).amount * 0.1 },
        meta: {},
      };
    }
  }

  const app = new Site({
    users: new Users(),
    settings: new Settings(),
    dashboard: new Dashboard(),
    actions: {
      calculateTax: new CalculateTax(),
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
    const body = JSON.parse(await bodyText(response.body));
    expect(body).toEqual([{ id: 1, name: "Alice" }]);
  });

  it("GET /users returns HTML by default", async () => {
    const response = await app.handleRequest({
      method: "GET",
      path: "/users",
    });
    expect(response.status).toBe(200);
    expect(response.headers["Content-Type"]).toBe("text/html");
    expect(await bodyText(response.body)).toContain("<!DOCTYPE html>");
  });

  it("GET /users/42 returns Item data", async () => {
    const response = await app.handleRequest({
      method: "GET",
      path: "/users/42",
      accept: "application/json",
    });
    expect(response.status).toBe(200);
    const body = JSON.parse(await bodyText(response.body));
    expect(body.id).toBe(42);
  });

  it("POST /users returns 201", async () => {
    const response = await app.handleRequest({
      method: "POST",
      path: "/users",
      accept: "application/json",
      body: jsonBody({ name: "Bob" }),
    });
    expect(response.status).toBe(201);
  });

  it("PUT /users/42 replaces item", async () => {
    const response = await app.handleRequest({
      method: "PUT",
      path: "/users/42",
      accept: "application/json",
      body: jsonBody({ name: "Charlie" }),
    });
    expect(response.status).toBe(200);
    const body = JSON.parse(await bodyText(response.body));
    expect(body.name).toBe("Charlie");
  });

  it("PATCH /users/42 patches item", async () => {
    const response = await app.handleRequest({
      method: "PATCH",
      path: "/users/42",
      accept: "application/json",
      body: jsonBody({ name: "Dave" }),
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
    const body = JSON.parse(await bodyText(response.body));
    expect(body.theme).toBe("dark");
  });

  it("PUT /settings replaces singleton", async () => {
    const response = await app.handleRequest({
      method: "PUT",
      path: "/settings",
      accept: "application/json",
      body: jsonBody({ theme: "light" }),
    });
    expect(response.status).toBe(200);
  });

  it("PATCH /settings patches singleton", async () => {
    const response = await app.handleRequest({
      method: "PATCH",
      path: "/settings",
      accept: "application/json",
      body: jsonBody({ theme: "light" }),
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
    const body = JSON.parse(await bodyText(response.body));
    expect(body.count).toBe(42);
  });

  it("POST /actions/calculateTax invokes action", async () => {
    const response = await app.handleRequest({
      method: "POST",
      path: "/actions/calculateTax",
      accept: "application/json",
      body: jsonBody({ amount: 100 }),
    });
    expect(response.status).toBe(200);
    const body = JSON.parse(await bodyText(response.body));
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
    const body = JSON.parse(await bodyText(response.body));
    expect(body["@context"]).toBeDefined();
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
    const body = JSON.parse(await bodyText(response.body));
    expect(body["@id"]).toBeDefined();
  });

  it("HTML response includes data-resource attribute (data-attr hydration)", async () => {
    const response = await app.handleRequest({
      method: "GET",
      path: "/users",
    });
    expect(await bodyText(response.body)).toContain('data-resource="');
  });

  it("HTML response includes rikka-resource element", async () => {
    const response = await app.handleRequest({
      method: "GET",
      path: "/users",
    });
    expect(await bodyText(response.body)).toContain("<rikka-resource");
    expect(await bodyText(response.body)).toContain('path="/users"');
  });

  it("handles handler errors with 500", async () => {
    class Broken extends CollectionKind {
      async list(ctx: RequestContext): Promise<Repr> {
        throw new Error("DB connection failed");
      }
      async create(ctx: RequestContext): Promise<Repr> {
        return { content: await ctx.json(), meta: {} };
      }
    }

    const brokenApp = new Site({ broken: new Broken() });
    const response = await brokenApp.handleRequest({
      method: "GET",
      path: "/broken",
      accept: "application/json",
    });
    expect(response.status).toBe(500);
    expect(await bodyText(response.body)).toBe("DB connection failed");
  });

  it("handles non-Error throws with 500", async () => {
    class Broken extends CollectionKind {
      async list(ctx: RequestContext): Promise<Repr> {
        throw "string error";
      }
      async create(ctx: RequestContext): Promise<Repr> {
        return { content: await ctx.json(), meta: {} };
      }
    }

    const brokenApp = new Site({ broken: new Broken() });
    const response = await brokenApp.handleRequest({
      method: "GET",
      path: "/broken",
    });
    expect(response.status).toBe(500);
    expect(await bodyText(response.body)).toBe("Internal Server Error");
  });

  it("handles async handler errors", async () => {
    class Broken extends CollectionKind {
      async list(ctx: RequestContext): Promise<Repr> {
        throw new Error("Async fail");
      }
      async create(ctx: RequestContext): Promise<Repr> {
        return { content: await ctx.json(), meta: {} };
      }
    }

    const brokenApp = new Site({ broken: new Broken() });
    const response = await brokenApp.handleRequest({
      method: "GET",
      path: "/broken",
    });
    expect(response.status).toBe(500);
    expect(await bodyText(response.body)).toBe("Async fail");
  });

  it("passes headers in RequestContext", async () => {
    class Echo extends ActionKind {
      async invoke(ctx: RequestContext): Promise<Repr> {
        return {
          content: { auth: ctx.headers["authorization"] ?? "none" },
          meta: {},
        };
      }
    }

    const echoApp = new Site({ echo: new Echo() });
    const response = await echoApp.handleRequest({
      method: "POST",
      path: "/echo",
      accept: "application/json",
      headers: { authorization: "Bearer test123" },
    });
    expect(response.status).toBe(200);
    const body = JSON.parse(await bodyText(response.body));
    expect(body.auth).toBe("Bearer test123");
  });
});

// ---------------------------------------------------------------------------
// resolveResource directly
// ---------------------------------------------------------------------------

describe("resolveResource", () => {
  it("resolves root descriptor with empty path", () => {
    class TestCollection extends CollectionKind {
      async list(ctx: RequestContext): Promise<Repr> {
        return { content: [], meta: {} };
      }
      async create(ctx: RequestContext): Promise<Repr> {
        return { content: await ctx.json(), meta: {} };
      }
    }

    const result = resolveResource(new TestCollection(), "");
    expect(result).not.toBeNull();
    expect(result).toBeInstanceOf(CollectionResource);
  });

  it("returns null when no children and path has segments", () => {
    class TestReadOnly extends ReadOnlyKind {
      async content(ctx: RequestContext): Promise<Repr> {
        return { content: { value: 1 }, meta: {} };
      }
    }

    const result = resolveResource(new TestReadOnly(), "something");
    expect(result).toBeNull();
  });

  it("resolves children with exact match", () => {
    class TestCollection extends CollectionKind {
      children = {
        special: new (class extends ReadOnlyKind {
          async content(ctx: RequestContext): Promise<Repr> {
            return { content: { special: true }, meta: {} };
          }
        })(),
      };
      async list(ctx: RequestContext): Promise<Repr> {
        return { content: [], meta: {} };
      }
      async create(ctx: RequestContext): Promise<Repr> {
        return { content: await ctx.json(), meta: {} };
      }
    }

    const result = resolveResource(new TestCollection(), "special");
    expect(result).not.toBeNull();
    expect(result).toBeInstanceOf(ReadOnlyResource);
  });
});

// ---------------------------------------------------------------------------
// Integration: full site with all kinds
// ---------------------------------------------------------------------------

describe("Full site integration", () => {
  // Simulating a realistic site structure
  class Articles extends CollectionKind {
    children = {
      ":articleId": new (class extends ItemKind {
        children = {
          comments: {
            ":commentId": new (class extends ItemKind {
              async content(ctx: RequestContext): Promise<Repr> {
                return {
                  content: {
                    id: Number(ctx.params.commentId),
                    text: "Great article!",
                  },
                  meta: {},
                };
              }
            })(),
          },
        };
        async content(ctx: RequestContext): Promise<Repr> {
          return {
            content: {
              id: Number(ctx.params.articleId),
              title: "First Post",
              authorId: 1,
            },
            meta: {},
          };
        }
        async replace(ctx: RequestContext): Promise<Repr> {
          return {
            content: {
              id: Number(ctx.params.articleId),
              ...(await ctx.json<Record<string, unknown>>()),
            },
            meta: {},
          };
        }
        async patch(ctx: RequestContext): Promise<Repr> {
          return {
            content: {
              id: Number(ctx.params.articleId),
              ...(await ctx.json<Record<string, unknown>>()),
            },
            meta: {},
          };
        }
        async delete(ctx: RequestContext): Promise<Repr> {
          return { content: null, meta: {} };
        }
      })(),
    };
    async list(ctx: RequestContext): Promise<Repr> {
      return {
        content: [
          { id: 1, title: "First Post", authorId: 1 },
          { id: 2, title: "Second Post", authorId: 2 },
        ],
        meta: {},
      };
    }
    async create(ctx: RequestContext): Promise<Repr> {
      return {
        content: { id: 3, ...(await ctx.json<Record<string, unknown>>()) },
        meta: {},
      };
    }
  }

  class Profile extends SingletonKind {
    async content(ctx: RequestContext): Promise<Repr> {
      return { content: { name: "Alice", bio: "Developer" }, meta: {} };
    }
    async patch(ctx: RequestContext): Promise<Repr> {
      return {
        content: {
          name: "Alice",
          ...(await ctx.json<Record<string, unknown>>()),
        },
        meta: {},
      };
    }
  }

  class Stats extends ReadOnlyKind {
    async content(ctx: RequestContext): Promise<Repr> {
      return { content: { views: 1000, likes: 42 }, meta: {} };
    }
  }

  class SendNotification extends ActionKind {
    async invoke(ctx: RequestContext): Promise<Repr> {
      return {
        content: { sent: true, to: (await ctx.json<{ to: string }>()).to },
        meta: {},
      };
    }
  }

  const app = new Site({
    articles: new Articles(),
    profile: new Profile(),
    stats: new Stats(),
    actions: {
      sendNotification: new SendNotification(),
    },
    admin: {
      articles: new Articles(),
    },
  });

  it("resolves and serves Collection", async () => {
    const res = await app.handleRequest({
      method: "GET",
      path: "/articles",
      accept: "application/json",
    });
    expect(res.status).toBe(200);
    const body = JSON.parse(await bodyText(res.body));
    expect(body).toHaveLength(2);
  });

  it("resolves and serves deep Item", async () => {
    const res = await app.handleRequest({
      method: "GET",
      path: "/articles/1/comments/5",
      accept: "application/json",
    });
    expect(res.status).toBe(200);
    const body = JSON.parse(await bodyText(res.body));
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
    const body = JSON.parse(await bodyText(res.body));
    expect(body.name).toBe("Alice");
  });

  it("resolves and serves ReadOnly", async () => {
    const res = await app.handleRequest({
      method: "GET",
      path: "/stats",
      accept: "application/json",
    });
    expect(res.status).toBe(200);
    const body = JSON.parse(await bodyText(res.body));
    expect(body.views).toBe(1000);
  });

  it("resolves and serves Action", async () => {
    const res = await app.handleRequest({
      method: "POST",
      path: "/actions/sendNotification",
      accept: "application/json",
      body: jsonBody({ to: "bob@example.com" }),
    });
    expect(res.status).toBe(200);
    const body = JSON.parse(await bodyText(res.body));
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
      output: { type: "raw", mime: "text/csv" },
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
      input: { type: "raw", mime: "image/*" },
      output: { type: "raw", mime: "text/html" },
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
      output: { type: "raw", mime: "text/csv" },
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
      output: { type: "raw", mime: "text/xml" },
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
      input: { type: "raw", mime: "image/*" },
      output: { type: "raw", mime: "text/html" },
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
  class Users extends CollectionKind {
    async list(ctx: RequestContext): Promise<Repr> {
      return {
        content: [
          { id: 1, name: "Alice" },
          { id: 2, name: "Bob" },
        ],
        meta: {},
      };
    }
    async create(ctx: RequestContext): Promise<Repr> {
      return {
        content: { id: 3, ...(await ctx.json<Record<string, unknown>>()) },
        meta: {},
      };
    }
  }

  const app = new Site({ users: new Users() });

  it("Value → JSON transformation", async () => {
    const resource = app.resolve("/users")!;
    const result = await app.registry.transformPipeline(
      resource,
      resource.path,
      { content: [{ id: 1 }], meta: {} },
      "application/json",
    );
    expect(result.contentType).toBe("application/json");
    expect(JSON.parse(await bodyText(result.body))).toEqual([{ id: 1 }]);
  });

  it("Value → JSON-LD transformation", async () => {
    const resource = app.resolve("/users")!;
    const result = await app.registry.transformPipeline(
      resource,
      resource.path,
      { content: [{ id: 1 }], meta: {} },
      "application/ld+json",
    );
    expect(result.contentType).toBe("application/ld+json");
    const body = JSON.parse(await bodyText(result.body));
    expect(body["@context"]).toBeDefined();
    expect(body["@graph"]).toEqual([{ id: 1 }]);
  });

  it("Value → HTML transformation", async () => {
    const resource = app.resolve("/users")!;
    const result = await app.registry.transformPipeline(
      resource,
      resource.path,
      { content: [{ id: 1 }], meta: {} },
      "text/html",
    );
    expect(result.contentType).toBe("text/html");
    expect(result.body).toContain("<!DOCTYPE html>");
  });

  it("custom Value→Raw CSV transformer", async () => {
    const csvTransformer: Transformer = {
      input: anySchema,
      output: { type: "raw", mime: "text/csv" },
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
    const repr = await resource.get(
      createRequestContext({
        method: "GET",
        path: "/users",
      }),
    );
    const result = await app.registry.transformPipeline(
      resource,
      resource.path,
      repr,
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
      input: { type: "raw", mime: "application/json" },
      output: { type: "raw", mime: "text/html" },
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
    const repr = await resource.get(
      createRequestContext({
        method: "GET",
        path: "/users",
      }),
    );
    const result = await app.registry.transformPipeline(
      resource,
      resource.path,
      repr,
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
    const repr = await resource.get(
      createRequestContext({
        method: "GET",
        path: "/users",
      }),
    );
    const result = await app.registry.transformPipeline(
      resource,
      resource.path,
      repr,
      "application/json",
    );

    expect(result.contentType).toBe("application/json");
    const body = JSON.parse(await bodyText(result.body));
    // Only Bob (id: 2) should remain
    expect(body).toEqual([{ id: 2, name: "Bob" }]);

    app.registry.unregister(filterTransformer);
  });

  it("falls back to JSON when no transformer matches", async () => {
    const resource = app.resolve("/users")!;
    const result = await app.registry.transformPipeline(
      resource,
      resource.path,
      { content: { hello: "world" }, meta: {} },
      "text/xml",
    );
    // No XML transformer registered, falls back to JSON
    expect(result.contentType).toBe("application/json");
    expect(JSON.parse(await bodyText(result.body))).toEqual({ hello: "world" });
  });
});

describe("Transformer + HTTP integration", () => {
  it("custom CSV transformer works through handleRequest", async () => {
    const csvTransformer: Transformer = {
      input: anySchema,
      output: { type: "raw", mime: "text/csv" },
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

    class Users extends CollectionKind {
      async list(ctx: RequestContext): Promise<Repr> {
        return { content: [{ id: 1, name: "Alice" }], meta: {} };
      }
      async create(ctx: RequestContext): Promise<Repr> {
        return { content: await ctx.json(), meta: {} };
      }
    }

    const app = new Site({ users: new Users() });
    app.registry.register(csvTransformer);

    const response = await app.handleRequest({
      method: "GET",
      path: "/users",
      acceptQuery: "text/csv",
    });

    expect(response.status).toBe(200);
    expect(response.headers["Content-Type"]).toBe("text/csv");
    expect(await bodyText(response.body)).toContain("id,name");
    expect(await bodyText(response.body)).toContain("1,Alice");

    app.registry.unregister(csvTransformer);
  });

  it("Raw→Raw chain works through handleRequest", async () => {
    // Register a JSON → XML wrapper transformer
    const jsonToXml: Transformer = {
      input: { type: "raw", mime: "application/json" },
      output: { type: "raw", mime: "text/xml" },
      transform(repr: Repr, ctx: TransformContext): Repr {
        const jsonData = typeof repr.content === "string" ? repr.content : "{}";
        return {
          content: `<?xml version="1.0"?><data>${jsonData}</data>`,
          meta: { type: "text/xml" },
        };
      },
    };

    class Users extends CollectionKind {
      async list(ctx: RequestContext): Promise<Repr> {
        return { content: [{ id: 1 }], meta: {} };
      }
      async create(ctx: RequestContext): Promise<Repr> {
        return { content: await ctx.json(), meta: {} };
      }
    }

    const app = new Site({ users: new Users() });
    app.registry.register(jsonToXml);

    const response = await app.handleRequest({
      method: "GET",
      path: "/users",
      acceptQuery: "text/xml",
    });

    expect(response.status).toBe(200);
    expect(response.headers["Content-Type"]).toBe("text/xml");
    expect(await bodyText(response.body)).toContain("<?xml");
    expect(await bodyText(response.body)).toContain("<data>");

    app.registry.unregister(jsonToXml);
  });
});

// ---------------------------------------------------------------------------
// getDescriptorSchema
// ---------------------------------------------------------------------------

describe("getDescriptorSchema", () => {
  it("returns the descriptor schema when set", () => {
    class TestCollection extends CollectionKind {
      schema: Schema = { type: "array", items: { type: "object" } };
      async list(ctx: RequestContext): Promise<Repr> {
        return { content: [], meta: {} };
      }
      async create(ctx: RequestContext): Promise<Repr> {
        return { content: await ctx.json(), meta: {} };
      }
    }
    const desc = new TestCollection();

    expect(getDescriptorSchema(desc)).toEqual({
      type: "array",
      items: { type: "object" },
    });
  });

  it("returns anySchema when no schema set", () => {
    class TestReadOnly extends ReadOnlyKind {
      async content(ctx: RequestContext): Promise<Repr> {
        return { content: { value: 1 }, meta: {} };
      }
    }
    const desc = new TestReadOnly();

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
      class Proxy2 extends ProxyKind {
        target(path: string): URL {
          return new URL(path, "https://example.test");
        }
      }
      const app = new Site({ proxy: new Proxy2() });

      const r1 = app.resolve("/proxy");
      expect(r1).toBeInstanceOf(ProxyResource);
      expect(r1?.path).toBe("/proxy");

      const r2 = app.resolve("/proxy/posts/1");
      expect(r2).toBeInstanceOf(ProxyResource);
      expect(r2?.path).toBe("/proxy");

      const r3 = app.resolve("/proxy/a/b/c/d");
      expect(r3).toBeInstanceOf(ProxyResource);
    });

    it("Proxy handler receives the full request path in target", async () => {
      let capturedPath = "";
      class P extends ProxyKind {
        target(path: string): URL {
          capturedPath = path;
          // Throw to short-circuit fetch — we only care about what `path` was passed in
          throw new Error("STOP_FETCH");
        }
      }
      const app = new Site({ p: new P() });
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
      class JwtAuth extends ActionKind {
        async invoke(ctx: RequestContext): Promise<Repr> {
          const auth = ctx.headers["authorization"];
          if (!auth) {
            throw new HttpError(401, "Missing token");
          }
          return {
            content: { subject: "user1", scopes: "read" } as Identity,
            meta: {},
          };
        }
      }

      class Users extends CollectionKind {
        async list(ctx: RequestContext): Promise<Repr> {
          return { content: [{ id: 1, name: "Alice" }], meta: {} };
        }
        async create(ctx: RequestContext): Promise<Repr> {
          return { content: await ctx.json(), meta: {} };
        }
      }

      const app = new Site(
        {
          "jwt-auth": new JwtAuth(),
          users: new Users(),
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
      class JwtAuth extends ActionKind {
        async invoke(ctx: RequestContext): Promise<Repr> {
          const auth = ctx.headers["authorization"];
          if (!auth) {
            throw new HttpError(401, "Missing token");
          }
          return {
            content: { subject: "user1", scopes: "read" } as Identity,
            meta: {},
          };
        }
      }

      class Users extends CollectionKind {
        async list(ctx: RequestContext): Promise<Repr> {
          return { content: [{ id: 1, name: "Alice" }], meta: {} };
        }
        async create(ctx: RequestContext): Promise<Repr> {
          return { content: await ctx.json(), meta: {} };
        }
      }

      const app = new Site(
        {
          "jwt-auth": new JwtAuth(),
          users: new Users(),
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
      class JwtAuth extends ActionKind {
        async invoke(ctx: RequestContext): Promise<Repr> {
          throw new HttpError(401, "Unauthorized");
        }
      }

      class Public extends ReadOnlyKind {
        async content(ctx: RequestContext): Promise<Repr> {
          return { content: { message: "hello" }, meta: {} };
        }
      }

      class Users extends CollectionKind {
        async list(ctx: RequestContext): Promise<Repr> {
          return { content: [{ id: 1 }], meta: {} };
        }
        async create(ctx: RequestContext): Promise<Repr> {
          return { content: await ctx.json(), meta: {} };
        }
      }

      const app = new Site(
        {
          "jwt-auth": new JwtAuth(),
          public: new Public(),
          users: new Users(),
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
  class Users extends CollectionKind {
    async list(ctx: RequestContext): Promise<Repr> {
      return { content: [{ id: 1, name: "Alice" }], meta: {} };
    }
    async create(ctx: RequestContext): Promise<Repr> {
      const item = { id: 2, ...(await ctx.json<Record<string, unknown>>()) };
      return {
        content: item,
        meta: { location: `./${(item as { id: number }).id}` },
      };
    }
    children = {
      ":userId": new (class extends ItemKind {
        async content(ctx: RequestContext): Promise<Repr> {
          return {
            content: { id: Number(ctx.params.userId), name: "Alice" },
            meta: {},
          };
        }
        async delete(ctx: RequestContext): Promise<Repr> {
          return { content: null, meta: {} };
        }
      })(),
    };
  }

  class Settings extends SingletonKind {
    async content(ctx: RequestContext): Promise<Repr> {
      return { content: { theme: "dark" }, meta: {} };
    }
  }

  const app = new Site({
    users: new Users(),
    settings: new Settings(),
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
  });
});

// ---------------------------------------------------------------------------
// new Site() return type
// ---------------------------------------------------------------------------

describe("new Site() return type", () => {
  it("returns definition, options, registry, and resolve", () => {
    class Users extends CollectionKind {
      async list(ctx: RequestContext): Promise<Repr> {
        return { content: [], meta: {} };
      }
      async create(ctx: RequestContext): Promise<Repr> {
        return { content: await ctx.json(), meta: {} };
      }
    }

    const app = new Site({ users: new Users() });
    expect(app.definition).toBeDefined();
    expect(app.options).toBeDefined();
    expect(app.registry).toBeInstanceOf(TransformerRegistry);
    expect(typeof app.resolve).toBe("function");
  });

  it("accepts SiteOptions with auth config", () => {
    class JwtAuth extends ActionKind {
      async invoke(ctx: RequestContext): Promise<Repr> {
        return { content: { subject: "test" } as Identity, meta: {} };
      }
    }

    class Users extends CollectionKind {
      async list(ctx: RequestContext): Promise<Repr> {
        return { content: [], meta: {} };
      }
      async create(ctx: RequestContext): Promise<Repr> {
        return { content: await ctx.json(), meta: {} };
      }
    }

    const app = new Site(
      { "jwt-auth": new JwtAuth(), users: new Users() },
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
