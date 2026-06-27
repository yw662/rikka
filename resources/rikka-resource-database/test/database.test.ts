import { describe, it, expect } from "@rstest/core";
import {
  DatabaseKind,
  parseSqlSchema,
  createInMemoryDriver,
  type DatabaseSchema,
  type DatabaseDriver,
} from "../src/index.js";
import { resolveResource, type RequestContext } from "@takanashi/rikka-site";

// ---------------------------------------------------------------------------
// Schema fixtures
// ---------------------------------------------------------------------------

const SQL_SCHEMA = `
  CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT
  );
  CREATE TABLE posts (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT,
    author_id INTEGER,
    FOREIGN KEY (author_id) REFERENCES users(id)
  );
  CREATE TABLE comments (
    id INTEGER PRIMARY KEY,
    body TEXT,
    post_id INTEGER REFERENCES posts(id)
  );
`;

const STRUCTURED_SCHEMA: DatabaseSchema = {
  tables: [
    {
      name: "users",
      columns: [
        { name: "id", type: "number" },
        { name: "name", type: "string" },
        { name: "email", type: "string", nullable: true },
      ],
      primaryKey: "id",
    },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type CtxOverrides = Partial<Omit<RequestContext, "json">> & {
  json?: () => Promise<unknown>;
};

function makeCtx(overrides: CtxOverrides = {}): RequestContext {
  return {
    method: "GET",
    path: "/db",
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
// parseSqlSchema tests
// ---------------------------------------------------------------------------

describe("parseSqlSchema", () => {
  it("parses CREATE TABLE statements", () => {
    const schema = parseSqlSchema(SQL_SCHEMA);
    expect(schema.tables).toHaveLength(3);
    expect(schema.tables[0].name).toBe("users");
    expect(schema.tables[1].name).toBe("posts");
    expect(schema.tables[2].name).toBe("comments");
  });

  it("parses columns with types", () => {
    const schema = parseSqlSchema(SQL_SCHEMA);
    const users = schema.tables[0];
    expect(users.columns).toHaveLength(3);
    expect(users.columns[0]).toMatchObject({ name: "id", type: "number" });
    expect(users.columns[1]).toMatchObject({ name: "name", type: "string" });
    expect(users.columns[2]).toMatchObject({ name: "email", type: "string" });
  });

  it("detects PRIMARY KEY column constraint", () => {
    const schema = parseSqlSchema(SQL_SCHEMA);
    expect(schema.tables[0].primaryKey).toBe("id");
  });

  it("detects table-level PRIMARY KEY(col)", () => {
    const schema = parseSqlSchema(`
      CREATE TABLE items (id INTEGER, name TEXT, PRIMARY KEY(id));
    `);
    expect(schema.tables[0].primaryKey).toBe("id");
  });

  it("maps SQL types to ColumnType", () => {
    const schema = parseSqlSchema(`
      CREATE TABLE typed (
        a INTEGER,
        b TEXT,
        c BOOLEAN,
        d TIMESTAMP,
        e JSON
      );
    `);
    const cols = schema.tables[0].columns;
    expect(cols[0].type).toBe("number");
    expect(cols[1].type).toBe("string");
    expect(cols[2].type).toBe("boolean");
    expect(cols[3].type).toBe("date");
    expect(cols[4].type).toBe("json");
  });

  it("detects NOT NULL constraint", () => {
    const schema = parseSqlSchema(`
      CREATE TABLE t (a TEXT NOT NULL, b TEXT);
    `);
    expect(schema.tables[0].columns[0].nullable).toBe(false);
    expect(schema.tables[0].columns[1].nullable).toBe(true);
  });

  it("handles IF NOT EXISTS", () => {
    const schema = parseSqlSchema(`
      CREATE TABLE IF NOT EXISTS t (id INTEGER);
    `);
    expect(schema.tables[0].name).toBe("t");
  });

  it("handles quoted identifiers", () => {
    const schema = parseSqlSchema(`
      CREATE TABLE "mytable" (id INTEGER);
    `);
    expect(schema.tables[0].name).toBe("mytable");
  });

  it("parses table-level FOREIGN KEY constraints", () => {
    const schema = parseSqlSchema(SQL_SCHEMA);
    const posts = schema.tables.find((t) => t.name === "posts")!;
    expect(posts.foreignKeys).toBeDefined();
    expect(posts.foreignKeys).toHaveLength(1);
    expect(posts.foreignKeys![0]).toMatchObject({
      column: "author_id",
      references: "users",
      referencedColumn: "id",
    });
  });

  it("parses inline REFERENCES constraints", () => {
    const schema = parseSqlSchema(SQL_SCHEMA);
    const comments = schema.tables.find((t) => t.name === "comments")!;
    expect(comments.foreignKeys).toBeDefined();
    expect(comments.foreignKeys).toHaveLength(1);
    expect(comments.foreignKeys![0]).toMatchObject({
      column: "post_id",
      references: "posts",
      referencedColumn: "id",
    });
  });

  it("skips UNIQUE/CHECK constraints but keeps FKs", () => {
    const schema = parseSqlSchema(`
      CREATE TABLE t (
        id INTEGER PRIMARY KEY,
        other_id INTEGER,
        email TEXT,
        FOREIGN KEY (other_id) REFERENCES others(id),
        UNIQUE (email)
      );
    `);
    expect(schema.tables[0].columns).toHaveLength(3);
    expect(schema.tables[0].foreignKeys).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// DatabaseKind tests
// ---------------------------------------------------------------------------

describe("DatabaseKind", () => {
  it("uses self-referencing :path* catch-all children", () => {
    const kind = new DatabaseKind({ schema: SQL_SCHEMA });
    expect(kind.children).toBeDefined();
    expect(kind.children![":path*"]).toBe(kind);
  });

  it("accepts SQL DDL string schema", () => {
    const kind = new DatabaseKind({ schema: SQL_SCHEMA });
    expect(kind.dbSchema.tables).toHaveLength(3);
    expect(kind.table("users")).toBeDefined();
    expect(kind.table("posts")).toBeDefined();
    expect(kind.table("comments")).toBeDefined();
  });

  it("accepts structured DatabaseSchema", () => {
    const kind = new DatabaseKind({ schema: STRUCTURED_SCHEMA });
    expect(kind.dbSchema.tables).toHaveLength(1);
    expect(kind.table("users")).toBeDefined();
  });

  it("creates in-memory driver by default", () => {
    const kind = new DatabaseKind({ schema: SQL_SCHEMA });
    expect(kind.driver).toBeDefined();
    expect(typeof kind.driver.list).toBe("function");
  });

  it("accepts custom driver", () => {
    const custom: DatabaseDriver = {
      async list() { return { items: [], total: 0 }; },
      async get() { return null; },
      async create() { return { id: "1" }; },
      async update() { return {}; },
      async delete() {},
    };
    const kind = new DatabaseKind({ schema: SQL_SCHEMA, driver: custom });
    expect(kind.driver).toBe(custom);
  });

  it("resolves root resource for empty path", () => {
    const kind = new DatabaseKind({ schema: SQL_SCHEMA });
    const resource = resolveResource(kind, [], "/db");
    expect(resource).not.toBeNull();
  });

  it("resolves collection resource for /:table", () => {
    const kind = new DatabaseKind({ schema: SQL_SCHEMA });
    const resource = resolveResource(kind, ["users"], "/db/users");
    expect(resource).not.toBeNull();
    expect(resource!.params.path).toBe("users");
  });

  it("resolves item resource for /:table/:id", () => {
    const kind = new DatabaseKind({ schema: SQL_SCHEMA });
    const resource = resolveResource(kind, ["users", "42"], "/db/users/42");
    expect(resource).not.toBeNull();
    expect(resource!.params.path).toBe("users/42");
  });

  it("root resource lists all table names", async () => {
    const kind = new DatabaseKind({ schema: SQL_SCHEMA });
    const resource = resolveResource(kind, [], "/db");
    const repr = await (resource as unknown as { content: (ctx: RequestContext) => Promise<unknown> }).content(
      makeCtx(),
    );
    expect((repr as { content: string[] }).content).toEqual(["users", "posts", "comments"]);
  });

  it("collection resource lists items", async () => {
    const kind = new DatabaseKind({ schema: SQL_SCHEMA });
    await kind.driver.create("users", { name: "Alice", email: "alice@test.com" });
    await kind.driver.create("users", { name: "Bob", email: "bob@test.com" });

    const resource = resolveResource(kind, ["users"], "/db/users");
    const repr = await (resource as unknown as { list: (ctx: RequestContext) => Promise<unknown> }).list(
      makeCtx({ path: "/db/users" }),
    );
    expect((repr as { content: unknown[] }).content).toHaveLength(2);
  });

  it("collection resource creates item with location", async () => {
    const kind = new DatabaseKind({ schema: SQL_SCHEMA });
    const resource = resolveResource(kind, ["users"], "/db/users");

    const repr = await (resource as unknown as { create: (ctx: RequestContext) => Promise<unknown> }).create(
      makeCtx({
        method: "POST",
        path: "/db/users",
        json: async () => ({ name: "Charlie", email: "charlie@test.com" }),
      }),
    );
    const result = repr as { content: { id: string; name: string }; meta: { location: string } };
    expect(result.content.name).toBe("Charlie");
    expect(result.content.id).toBe("1");
    expect(result.meta.location).toBe("./1");
  });

  it("item resource returns 404 for missing record", async () => {
    const kind = new DatabaseKind({ schema: SQL_SCHEMA });
    const resource = resolveResource(kind, ["users", "999"], "/db/users/999");

    await expect(
      (resource as unknown as { content: (ctx: RequestContext) => Promise<unknown> }).content(
        makeCtx({ path: "/db/users/999" }),
      ),
    ).rejects.toThrow("Not Found");
  });

  it("collection resource returns 404 for unknown table", async () => {
    const kind = new DatabaseKind({ schema: SQL_SCHEMA });
    const resource = resolveResource(kind, ["nonexistent"], "/db/nonexistent");

    await expect(
      (resource as unknown as { list: (ctx: RequestContext) => Promise<unknown> }).list(
        makeCtx({ path: "/db/nonexistent" }),
      ),
    ).rejects.toThrow("Table not found");
  });

  it("full CRUD cycle", async () => {
    const kind = new DatabaseKind({ schema: SQL_SCHEMA });

    // Create
    const collResource = resolveResource(kind, ["users"], "/db/users");
    const created = await (collResource as unknown as { create: (ctx: RequestContext) => Promise<unknown> }).create(
      makeCtx({
        method: "POST",
        path: "/db/users",
        json: async () => ({ name: "Dave", email: "dave@test.com" }),
      }),
    );
    const userId = (created as { content: { id: string } }).content.id;

    // Read
    const itemResource = resolveResource(kind, ["users", userId], `/db/users/${userId}`);
    const ctx = makeCtx({ path: `/db/users/${userId}` });
    const read = await (itemResource as unknown as { content: (ctx: RequestContext) => Promise<unknown> }).content(ctx);
    expect((read as { content: { name: string } }).content.name).toBe("Dave");

    // Update (PUT)
    const updated = await (itemResource as unknown as { replace: (ctx: RequestContext) => Promise<unknown> }).replace(
      makeCtx({
        method: "PUT",
        path: `/db/users/${userId}`,
        json: async () => ({ name: "Dave Jr.", email: "dave@test.com" }),
      }),
    );
    expect((updated as { content: { name: string } }).content.name).toBe("Dave Jr.");

    // Delete
    await (itemResource as unknown as { delete: (ctx: RequestContext) => Promise<unknown> }).delete(ctx);

    // Verify deleted
    await expect(
      (itemResource as unknown as { content: (ctx: RequestContext) => Promise<unknown> }).content(ctx),
    ).rejects.toThrow("Not Found");
  });

  it("isolates records between tables", async () => {
    const kind = new DatabaseKind({ schema: SQL_SCHEMA });
    await kind.driver.create("users", { name: "Alice" });
    await kind.driver.create("posts", { title: "Hello" });

    const usersResource = resolveResource(kind, ["users"], "/db/users");
    const postsResource = resolveResource(kind, ["posts"], "/db/posts");

    const usersRepr = await (usersResource as unknown as { list: (ctx: RequestContext) => Promise<unknown> }).list(
      makeCtx({ path: "/db/users" }),
    );
    const postsRepr = await (postsResource as unknown as { list: (ctx: RequestContext) => Promise<unknown> }).list(
      makeCtx({ path: "/db/posts" }),
    );

    expect((usersRepr as { content: unknown[] }).content).toHaveLength(1);
    expect((postsRepr as { content: unknown[] }).content).toHaveLength(1);
  });

  it("supports list query params (limit/offset/sort)", async () => {
    const kind = new DatabaseKind({ schema: SQL_SCHEMA });
    await kind.driver.create("users", { name: "Charlie" });
    await kind.driver.create("users", { name: "Alice" });
    await kind.driver.create("users", { name: "Bob" });

    const resource = resolveResource(kind, ["users"], "/db/users");
    const repr = await (resource as unknown as { list: (ctx: RequestContext) => Promise<unknown> }).list(
      makeCtx({
        path: "/db/users",
        query: { sort: "name", order: "asc", limit: "2", offset: "1" },
      }),
    );
    const items = (repr as { content: { name: string }[] }).content;
    expect(items).toHaveLength(2);
    expect(items[0].name).toBe("Bob");
    expect(items[1].name).toBe("Charlie");
  });

  // -------------------------------------------------------------------------
  // Foreign-key association queries
  // -------------------------------------------------------------------------

  it("findRelation detects has-many", () => {
    const kind = new DatabaseKind({ schema: SQL_SCHEMA });
    const rel = kind.findRelation("users", "posts");
    expect(rel).toBeDefined();
    expect(rel!.type).toBe("has-many");
    expect(rel!.fk.column).toBe("author_id");
  });

  it("findRelation detects belongs-to", () => {
    const kind = new DatabaseKind({ schema: SQL_SCHEMA });
    const rel = kind.findRelation("posts", "users");
    expect(rel).toBeDefined();
    expect(rel!.type).toBe("belongs-to");
    expect(rel!.fk.column).toBe("author_id");
  });

  it("findRelation returns undefined for unrelated tables", () => {
    const kind = new DatabaseKind({ schema: SQL_SCHEMA });
    expect(kind.findRelation("users", "comments")).toBeUndefined();
  });

  it("has-many association: GET /users/:id/posts returns related posts", async () => {
    const kind = new DatabaseKind({ schema: SQL_SCHEMA });
    await kind.driver.create("users", { name: "Alice", email: "a@x.com" });
    await kind.driver.create("posts", { title: "P1", author_id: "1" });
    await kind.driver.create("posts", { title: "P2", author_id: "1" });
    await kind.driver.create("posts", { title: "Other", author_id: "999" });

    const resource = resolveResource(kind, ["users", "1", "posts"], "/db/users/1/posts");
    const repr = await (resource as unknown as { content: (ctx: RequestContext) => Promise<unknown> }).content(
      makeCtx({ path: "/db/users/1/posts" }),
    );
    const items = (repr as { content: { title: string }[] }).content;
    expect(items).toHaveLength(2);
    expect(items.map((p) => p.title).sort()).toEqual(["P1", "P2"]);
  });

  it("belongs-to association: GET /posts/:id/users returns the author", async () => {
    const kind = new DatabaseKind({ schema: SQL_SCHEMA });
    await kind.driver.create("users", { name: "Alice", email: "a@x.com" });
    await kind.driver.create("posts", { title: "Hello", author_id: "1" });

    const resource = resolveResource(kind, ["posts", "1", "users"], "/db/posts/1/users");
    const repr = await (resource as unknown as { content: (ctx: RequestContext) => Promise<unknown> }).content(
      makeCtx({ path: "/db/posts/1/users" }),
    );
    expect((repr as { content: { name: string } }).content.name).toBe("Alice");
  });

  it("association returns 404 when no FK relation exists", async () => {
    const kind = new DatabaseKind({ schema: SQL_SCHEMA });
    const resource = resolveResource(kind, ["users", "1", "comments"], "/db/users/1/comments");
    await expect(
      (resource as unknown as { content: (ctx: RequestContext) => Promise<unknown> }).content(
        makeCtx({ path: "/db/users/1/comments" }),
      ),
    ).rejects.toThrow("No relation");
  });

  it("has-many association supports query params (limit/sort)", async () => {
    const kind = new DatabaseKind({ schema: SQL_SCHEMA });
    await kind.driver.create("users", { name: "Alice" });
    await kind.driver.create("posts", { title: "C", author_id: "1" });
    await kind.driver.create("posts", { title: "A", author_id: "1" });
    await kind.driver.create("posts", { title: "B", author_id: "1" });

    const resource = resolveResource(kind, ["users", "1", "posts"], "/db/users/1/posts");
    const repr = await (resource as unknown as { content: (ctx: RequestContext) => Promise<unknown> }).content(
      makeCtx({
        path: "/db/users/1/posts",
        query: { sort: "title", order: "asc", limit: "2" },
      }),
    );
    const items = (repr as { content: { title: string }[] }).content;
    expect(items).toHaveLength(2);
    expect(items[0].title).toBe("A");
    expect(items[1].title).toBe("B");
  });

  it("resolves association resource for 3-segment path", () => {
    const kind = new DatabaseKind({ schema: SQL_SCHEMA });
    const resource = resolveResource(kind, ["users", "42", "posts"], "/db/users/42/posts");
    expect(resource).not.toBeNull();
    expect(resource!.params.path).toBe("users/42/posts");
  });
});

// ---------------------------------------------------------------------------
// createInMemoryDriver tests
// ---------------------------------------------------------------------------

describe("createInMemoryDriver", () => {
  it("creates driver with CRUD methods", () => {
    const driver = createInMemoryDriver(STRUCTURED_SCHEMA);
    expect(typeof driver.list).toBe("function");
    expect(typeof driver.get).toBe("function");
    expect(typeof driver.create).toBe("function");
    expect(typeof driver.update).toBe("function");
    expect(typeof driver.delete).toBe("function");
    expect(typeof driver.reset).toBe("function");
  });

  it("reset clears all records", async () => {
    const driver = createInMemoryDriver(STRUCTURED_SCHEMA);
    await driver.create("users", { name: "Alice" });
    expect((await driver.list("users")).items).toHaveLength(1);

    driver.reset();
    expect((await driver.list("users")).items).toHaveLength(0);
  });

  it("throws 404 for unknown table", async () => {
    const driver = createInMemoryDriver(STRUCTURED_SCHEMA);
    await expect(driver.list("nonexistent")).rejects.toThrow("Table not found");
  });

  it("supports where filter", async () => {
    const driver = createInMemoryDriver(STRUCTURED_SCHEMA);
    await driver.create("users", { name: "Alice", email: "a@test.com" });
    await driver.create("users", { name: "Bob", email: "b@test.com" });
    await driver.create("users", { name: "Alice", email: "c@test.com" });

    const result = await driver.list("users", { where: { name: "Alice" } });
    expect(result.items).toHaveLength(2);
  });
});
