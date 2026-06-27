/**
 * @module database
 * DatabaseKind — schema-driven CRUD resource providing an entire database.
 *
 * Config takes a schema (SQL DDL string or structured {@link DatabaseSchema})
 * and the Kind exposes every table via `:table` and `:table/:id` routes.
 * The actual storage is handled by a pluggable {@link DatabaseDriver}; when
 * none is provided, an in-memory driver is created from the schema.
 *
 * @example
 * ```ts
 * const db = new DatabaseKind({
 *   schema: `
 *     CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT);
 *     CREATE TABLE posts (id INTEGER PRIMARY KEY, title TEXT, body TEXT);
 *   `,
 * });
 *
 * const app = site({ "db/": db });
 * // GET    /db              → list of tables
 * // GET    /db/users        → list users
 * // POST   /db/users        → create user
 * // GET    /db/users/42     → get user
 * // PUT    /db/users/42     → replace user
 * // PATCH  /db/users/42     → patch user
 * // DELETE /db/users/42     → delete user
 * ```
 */

import {
  ResourceKind,
  Resource,
  CollectionResource,
  ItemResource,
  ReadOnlyResource,
  Repr,
  type RequestContext,
  HttpError,
} from "@takanashi/rikka-site";

// ---------------------------------------------------------------------------
// Schema types
// ---------------------------------------------------------------------------

export type ColumnType = "string" | "number" | "boolean" | "date" | "json";

export interface ColumnSchema {
  name: string;
  type: ColumnType;
  nullable?: boolean;
  default?: unknown;
}

export interface ForeignKey {
  /** Local column that holds the reference (e.g. `author_id`). */
  column: string;
  /** Referenced table name (e.g. `users`). */
  references: string;
  /** Referenced column name (usually the PK, e.g. `id`). */
  referencedColumn: string;
}

export interface TableSchema {
  name: string;
  columns: ColumnSchema[];
  /** Primary key column name (default: `"id"`). */
  primaryKey?: string;
  /** Foreign key constraints declared on this table. */
  foreignKeys?: ForeignKey[];
}

export interface DatabaseSchema {
  tables: TableSchema[];
}

// ---------------------------------------------------------------------------
// Query / result types
// ---------------------------------------------------------------------------

export interface ListQuery {
  where?: Record<string, unknown>;
  limit?: number;
  offset?: number;
  sort?: string;
  order?: "asc" | "desc";
}

export interface ListResult<T = unknown> {
  items: T[];
  total?: number;
}

// ---------------------------------------------------------------------------
// DatabaseDriver — pluggable backend (like EventSource for EventsKind)
// ---------------------------------------------------------------------------

/**
 * Database driver — persistence interface for {@link DatabaseKind}.
 *
 * Operates on the whole database: every method takes a `table` name so a
 * single driver serves all tables defined in the schema. Implement this to
 * bridge any backend (SQLite, Postgres, MongoDB, ...).
 */
export interface DatabaseDriver {
  list(table: string, query?: ListQuery): Promise<ListResult>;
  get(table: string, id: string): Promise<unknown | null>;
  create(table: string, data: unknown): Promise<unknown & { id: string }>;
  /** PATCH: merge `patch` into the existing record. */
  update(table: string, id: string, patch: Partial<unknown>): Promise<unknown>;
  /**
   * PUT: replace the record with `data` (whole-record replacement, not merge).
   * Optional — when absent, {@link DatabaseItemResource.replace} responds
   * 501 Not Implemented rather than silently degrading to PATCH (merge),
   * because PUT and PATCH are distinct algebraic operations and conflating
   * them would violate the method's contract.
   */
  replace?(table: string, id: string, data: unknown): Promise<unknown>;
  delete(table: string, id: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// SQL DDL parser (powered by node-sql-parser)
// ---------------------------------------------------------------------------

// node-sql-parser ships as a CommonJS module; use a default import and
// destructure at runtime. The library includes its own type declarations.
//
// We import from the MySQL dialect build (`build/mysql`) rather than the
// package root so only one dialect parser (~270 KB) is bundled instead of
// all 14 (~6 MB). DDL syntax for CREATE TABLE is nearly identical across
// dialects, so MySQL handles standard `.sql` schema files fine. Users who
// need a different dialect can pass a structured {@link DatabaseSchema}
// instead of a SQL string.
import nodeSqlParser from "node-sql-parser/build/mysql";
const { Parser } = nodeSqlParser as {
  Parser: new () => { astify(sql: string): unknown };
};

/**
 * Parse a SQL DDL string into a {@link DatabaseSchema}.
 *
 * Backed by [`node-sql-parser`](https://www.npmjs.com/package/node-sql-parser),
 * so any DDL shape that library understands is supported — `CREATE TABLE`
 * with column constraints (`PRIMARY KEY`, `NOT NULL`, `DEFAULT`,
 * `REFERENCES`), table-level constraints (`PRIMARY KEY(...)`,
 * `FOREIGN KEY(...) REFERENCES ...`, `UNIQUE`, `CHECK`), `IF NOT EXISTS`,
 * quoted identifiers, and more.
 *
 * SQL types are mapped to the {@link ColumnType} union; unknown types fall
 * back to `"string"`.
 */
export function parseSqlSchema(sql: string): DatabaseSchema {
  const parser = new Parser();
  const ast = parser.astify(sql);
  const statements = Array.isArray(ast) ? ast : [ast];
  const tables: TableSchema[] = [];
  for (const node of statements) {
    const table = astToTable(node);
    if (table) tables.push(table);
  }
  return { tables };
}

/** Convert a `CREATE TABLE` AST node into a {@link TableSchema}. */
function astToTable(node: unknown): TableSchema | undefined {
  // Duck-type the AST: `node-sql-parser` emits `{ type: "create", keyword: "table", ... }`.
  const n = node as Record<string, unknown> | null;
  if (!n || n.type !== "create" || n.keyword !== "table") return undefined;

  const tableList = n.table as { table?: string }[] | undefined;
  const name = tableList?.[0]?.table;
  if (!name) return undefined;

  const columns: ColumnSchema[] = [];
  let primaryKey: string | undefined;
  const foreignKeys: ForeignKey[] = [];

  const defs = (n.create_definitions as Record<string, unknown>[]) ?? [];
  for (const def of defs) {
    if (def.resource === "column") {
      const col = columnFromAst(def);
      if (col) {
        columns.push(col.schema);
        if (col.isPrimaryKey && !primaryKey) primaryKey = col.schema.name;
        if (col.inlineFk) foreignKeys.push(col.inlineFk);
      }
      continue;
    }
    if (def.resource === "constraint") {
      const ct = String(def.constraint_type ?? "").toLowerCase();
      if (ct === "primary key") {
        const cols = (def.definition as { column?: string }[]) ?? [];
        if (!primaryKey && cols[0]?.column) primaryKey = cols[0].column;
        continue;
      }
      if (ct === "foreign key") {
        const fk = fkFromConstraintAst(def);
        if (fk) foreignKeys.push(fk);
        continue;
      }
      // UNIQUE / CHECK / INDEX / KEY — ignored.
    }
  }

  return { name, columns, primaryKey, foreignKeys };
}

interface ColumnFromAst {
  schema: ColumnSchema;
  isPrimaryKey: boolean;
  inlineFk?: ForeignKey;
}

/** Convert a column-definition AST node into a {@link ColumnSchema}. */
function columnFromAst(
  def: Record<string, unknown>,
): ColumnFromAst | undefined {
  const colRef = def.column as { column?: string } | undefined;
  const name = colRef?.column;
  if (!name) return undefined;

  const definition = def.definition as { dataType?: string } | undefined;
  const sqlType = definition?.dataType ?? "TEXT";
  const type = mapSqlType(sqlType);

  const nullable = def.nullable == null;
  const isPrimaryKey = def.primary_key != null;

  const defaultVal = extractDefault(def.default_val);
  const inlineFk = fkFromColumnAst(def);

  return {
    schema: { name, type, nullable, default: defaultVal },
    isPrimaryKey,
    inlineFk,
  };
}

/** Build a {@link ForeignKey} from an inline column `REFERENCES` clause. */
function fkFromColumnAst(def: Record<string, unknown>): ForeignKey | undefined {
  const ref = def.reference_definition as
    | { table?: { table?: string }[]; definition?: { column?: string }[] }
    | undefined;
  if (!ref) return undefined;
  const references = ref.table?.[0]?.table;
  const referencedColumn = ref.definition?.[0]?.column ?? "id";
  const column = (def.column as { column?: string } | undefined)?.column;
  if (!column || !references) return undefined;
  return { column, references, referencedColumn };
}

/** Build a {@link ForeignKey} from a table-level `FOREIGN KEY` constraint. */
function fkFromConstraintAst(
  def: Record<string, unknown>,
): ForeignKey | undefined {
  const localCols = (def.definition as { column?: string }[]) ?? [];
  const ref = def.reference_definition as
    | { table?: { table?: string }[]; definition?: { column?: string }[] }
    | undefined;
  const column = localCols[0]?.column;
  const references = ref?.table?.[0]?.table;
  const referencedColumn = ref?.definition?.[0]?.column ?? "id";
  if (!column || !references) return undefined;
  return { column, references, referencedColumn };
}

/** Extract a JS value from a `DEFAULT` clause AST node. */
function extractDefault(defaultVal: unknown): unknown {
  if (!defaultVal || typeof defaultVal !== "object") return undefined;
  const dv = defaultVal as { value?: { type?: string; value?: unknown } };
  const value = dv.value;
  if (!value) return undefined;
  switch (value.type) {
    case "single_quote_string":
    case "double_quote_string":
      return value.value;
    case "number":
      return value.value;
    case "bool":
      return value.value;
    case "null":
      return null;
    default:
      // function calls (e.g. CURRENT_TIMESTAMP), identifiers, etc.
      return undefined;
  }
}

function mapSqlType(raw: string): ColumnType {
  const t = raw.toUpperCase();
  if (
    /^(INT|INTEGER|BIGINT|SMALLINT|TINYINT|FLOAT|DOUBLE|DECIMAL|NUMERIC|REAL)/.test(
      t,
    )
  ) {
    return "number";
  }
  if (/^(BOOL|BOOLEAN)/.test(t)) return "boolean";
  if (/^(DATE|TIME|TIMESTAMP|DATETIME)/.test(t)) return "date";
  if (/^(JSON|JSONB|BLOB)/.test(t)) return "json";
  return "string"; // TEXT, VARCHAR, CHAR, CLOB, etc.
}

// ---------------------------------------------------------------------------
// In-memory driver (default — created from schema)
// ---------------------------------------------------------------------------

/**
 * Create an in-memory {@link DatabaseDriver} from a {@link DatabaseSchema}.
 *
 * Tables are created eagerly; records are stored in `Map`s with auto-increment
 * integer IDs. Useful for testing, prototyping, or single-process apps.
 */
export function createInMemoryDriver(schema: DatabaseSchema): DatabaseDriver & {
  /** Clear all records and reset ID counters. */
  reset(): void;
} {
  const stores = new Map<string, Map<string, Record<string, unknown>>>();
  const counters = new Map<string, number>();

  for (const table of schema.tables) {
    stores.set(table.name, new Map());
    counters.set(table.name, 0);
  }

  function getStore(table: string): Map<string, Record<string, unknown>> {
    const store = stores.get(table);
    if (!store) throw new HttpError(404, `Table not found: ${table}`);
    return store;
  }

  return {
    async list(table, query) {
      const store = getStore(table);
      let items = [...store.values()];
      if (query?.where) {
        items = items.filter((item) =>
          Object.entries(query.where!).every(([k, v]) => item[k] === v),
        );
      }
      if (query?.sort) {
        const sort = query.sort;
        const order = query.order ?? "asc";
        items.sort((a, b) => {
          const av = a[sort];
          const bv = b[sort];
          if (av === bv) return 0;
          const cmp = String(av) < String(bv) ? -1 : 1;
          return order === "desc" ? -cmp : cmp;
        });
      }
      const total = items.length;
      if (query?.offset) items = items.slice(query.offset);
      if (query?.limit) items = items.slice(0, query.limit);
      return { items, total };
    },

    async get(table, id) {
      const store = getStore(table);
      return store.get(id) ?? null;
    },

    async create(table, data) {
      const store = getStore(table);
      const next = (counters.get(table) ?? 0) + 1;
      counters.set(table, next);
      const id = String(next);
      const record = { ...(data as Record<string, unknown>), id };
      store.set(id, record);
      return record as unknown & { id: string };
    },

    async update(table, id, patch) {
      const store = getStore(table);
      const existing = store.get(id);
      if (!existing) throw new HttpError(404, "Not Found");
      const updated = { ...existing, ...patch };
      store.set(id, updated);
      return updated;
    },

    async replace(table, id, data) {
      const store = getStore(table);
      if (!store.has(id)) throw new HttpError(404, "Not Found");
      // PUT: whole-record replacement — do NOT merge with the existing record.
      const record = { ...(data as Record<string, unknown>), id };
      store.set(id, record);
      return record;
    },

    async delete(table, id) {
      const store = getStore(table);
      store.delete(id);
    },

    reset() {
      for (const store of stores.values()) store.clear();
      for (const name of counters.keys()) counters.set(name, 0);
    },
  };
}

// ---------------------------------------------------------------------------
// DatabaseKind — schema-driven, provides the whole database
// ---------------------------------------------------------------------------

export interface DatabaseKindOptions {
  /** Schema as SQL DDL string or structured object. */
  schema: string | DatabaseSchema;
  /** Custom driver. When omitted, an in-memory driver is created. */
  driver?: DatabaseDriver;
}

/**
 * DatabaseKind — provides an entire database via `:path*` routing.
 *
 * - `/` → list of table names
 * - `/:table` → collection (list / create)
 * - `/:table/:id` → item (get / put / patch / delete)
 *
 * The schema defines which tables exist; unknown tables return 404.
 */
export class DatabaseKind extends ResourceKind {
  readonly dbSchema: DatabaseSchema;
  readonly driver: DatabaseDriver;

  override children: { [key: string]: DatabaseKind } = { ":path*": this };

  constructor(options: DatabaseKindOptions) {
    super();
    this.dbSchema =
      typeof options.schema === "string"
        ? parseSqlSchema(options.schema)
        : options.schema;
    this.driver = options.driver ?? createInMemoryDriver(this.dbSchema);
  }

  /** Look up a table schema by name. */
  table(name: string): TableSchema | undefined {
    return this.dbSchema.tables.find((t) => t.name === name);
  }

  /**
   * Find the foreign-key relationship between two tables.
   *
   * - **has-many**: `toTable` has a FK referencing `fromTable`
   *   (e.g. `posts.author_id → users.id` means `users` has-many `posts`).
   * - **belongs-to**: `fromTable` has a FK referencing `toTable`
   *   (e.g. `posts.author_id → users.id` means `posts` belongs-to `users`).
   *
   * Returns `undefined` when no FK link exists between the two tables.
   */
  findRelation(
    fromTable: string,
    toTable: string,
  ):
    | {
        type: "has-many" | "belongs-to";
        fk: ForeignKey;
      }
    | undefined {
    // has-many: the related table has a FK pointing back to the source
    const toSchema = this.table(toTable);
    if (toSchema?.foreignKeys) {
      for (const fk of toSchema.foreignKeys) {
        if (fk.references === fromTable) {
          return { type: "has-many", fk };
        }
      }
    }
    // belongs-to: the source table has a FK pointing to the related table
    const fromSchema = this.table(fromTable);
    if (fromSchema?.foreignKeys) {
      for (const fk of fromSchema.foreignKeys) {
        if (fk.references === toTable) {
          return { type: "belongs-to", fk };
        }
      }
    }
    return undefined;
  }

  resolve(params: Record<string, string>): Resource {
    const rawPath = params.path ?? "";
    const segments = rawPath.split("/").filter((s) => s.length > 0);

    if (segments.length === 0) {
      return new DatabaseRootResource(params, this);
    }
    if (segments.length === 1) {
      return new DatabaseCollectionResource(params, this, segments[0]);
    }
    if (segments.length === 2) {
      return new DatabaseItemResource(params, this, segments[0], segments[1]);
    }
    if (segments.length === 3) {
      // /:table/:id/:related → association query via foreign key
      return new DatabaseAssociationResource(
        params,
        this,
        segments[0],
        segments[1],
        segments[2],
      );
    }
    // 4+ segments → not found
    throw new HttpError(404, "Not Found");
  }
}

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

/**
 * Root resource — lists all table names defined in the schema.
 */
export class DatabaseRootResource extends ReadOnlyResource {
  constructor(
    params: Record<string, string>,
    private kind: DatabaseKind,
  ) {
    super();
    this.params = params;
  }

  async content(_ctx: RequestContext): Promise<Repr> {
    return {
      content: this.kind.dbSchema.tables.map((t) => t.name),
      meta: {},
    };
  }
}

/**
 * Collection resource — handles list (GET) and create (POST) for one table.
 */
export class DatabaseCollectionResource extends CollectionResource {
  constructor(
    params: Record<string, string>,
    private kind: DatabaseKind,
    private tableName: string,
  ) {
    super();
    this.params = params;
  }

  private requireTable(): TableSchema {
    const table = this.kind.table(this.tableName);
    if (!table) throw new HttpError(404, `Table not found: ${this.tableName}`);
    return table;
  }

  async list(ctx: RequestContext): Promise<Repr> {
    this.requireTable();
    const query = parseListQuery(ctx);
    const result = await this.kind.driver.list(this.tableName, query);
    return { content: result.items, meta: {} };
  }

  async create(ctx: RequestContext): Promise<Repr> {
    this.requireTable();
    const data = await ctx.json();
    const created = await this.kind.driver.create(this.tableName, data);
    const id = (created as { id: string }).id;
    return Repr.created(created, `./${id}`);
  }
}

/**
 * Item resource — handles content (GET), replace (PUT), patch (PATCH),
 * delete (DELETE) for one record.
 */
export class DatabaseItemResource extends ItemResource {
  constructor(
    params: Record<string, string>,
    private kind: DatabaseKind,
    private tableName: string,
    private id: string,
  ) {
    super();
    this.params = params;
  }

  private requireTable(): TableSchema {
    const table = this.kind.table(this.tableName);
    if (!table) throw new HttpError(404, `Table not found: ${this.tableName}`);
    return table;
  }

  async content(_ctx: RequestContext): Promise<Repr> {
    this.requireTable();
    const item = await this.kind.driver.get(this.tableName, this.id);
    if (!item) throw new HttpError(404, "Not Found");
    return { content: item, meta: {} };
  }

  override async replace(ctx: RequestContext): Promise<Repr> {
    this.requireTable();
    const data = await ctx.json<Partial<unknown>>();
    // PUT: whole-record replacement. When the driver does not implement
    // replace, respond 501 rather than silently degrading to PATCH (merge) —
    // PUT and PATCH are distinct operations and must not be conflated.
    if (!this.kind.driver.replace) {
      throw new HttpError(
        501,
        "Not Implemented",
        "Driver does not support PUT (replace)",
      );
    }
    const updated = await this.kind.driver.replace(
      this.tableName,
      this.id,
      data,
    );
    return { content: updated, meta: {} };
  }

  override async patch(ctx: RequestContext): Promise<Repr> {
    this.requireTable();
    const data = await ctx.json<Partial<unknown>>();
    // PATCH: partial merge.
    const updated = await this.kind.driver.update(
      this.tableName,
      this.id,
      data,
    );
    return { content: updated, meta: {} };
  }

  override async delete(_ctx: RequestContext): Promise<Repr> {
    this.requireTable();
    await this.kind.driver.delete(this.tableName, this.id);
    return { content: null, meta: {} };
  }
}

/**
 * Association resource — serves related records via foreign-key analysis.
 *
 * Routes like `/:table/:id/:related` are resolved by inspecting the schema's
 * foreign keys:
 * - **has-many** (`posts.author_id → users.id`): `GET /users/42/posts`
 *   returns all posts where `author_id = 42`.
 * - **belongs-to** (`posts.author_id → users.id`): `GET /posts/42/users`
 *   returns the single user that post 42 references.
 *
 * Returns 404 when no FK link exists between the two tables.
 */
export class DatabaseAssociationResource extends ReadOnlyResource {
  constructor(
    params: Record<string, string>,
    private kind: DatabaseKind,
    private tableName: string,
    private id: string,
    private relatedTable: string,
  ) {
    super();
    this.params = params;
  }

  async content(ctx: RequestContext): Promise<Repr> {
    const relation = this.kind.findRelation(this.tableName, this.relatedTable);
    if (!relation) {
      throw new HttpError(
        404,
        `No relation between ${this.tableName} and ${this.relatedTable}`,
      );
    }

    if (relation.type === "has-many") {
      // Eagerly fetch the related collection filtered by the FK column.
      const query = parseListQuery(ctx);
      const result = await this.kind.driver.list(this.relatedTable, {
        ...query,
        where: { [relation.fk.column]: this.id },
      });
      return { content: result.items, meta: {} };
    }

    // belongs-to: fetch the source record, read the FK value, then fetch
    // the referenced record.
    const source = await this.kind.driver.get(this.tableName, this.id);
    if (!source) throw new HttpError(404, "Not Found");
    const fkValue = (source as Record<string, unknown>)[relation.fk.column];
    if (fkValue == null) {
      return { content: null, meta: {} };
    }
    const related = await this.kind.driver.get(
      this.relatedTable,
      String(fkValue),
    );
    if (!related) throw new HttpError(404, "Not Found");
    return { content: related, meta: {} };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseListQuery(ctx: RequestContext): ListQuery {
  const q: ListQuery = {};
  if (ctx.query.limit) {
    const n = parseInt(ctx.query.limit, 10);
    if (!Number.isNaN(n)) q.limit = n;
  }
  if (ctx.query.offset) {
    const n = parseInt(ctx.query.offset, 10);
    if (!Number.isNaN(n)) q.offset = n;
  }
  if (ctx.query.sort) q.sort = ctx.query.sort;
  if (ctx.query.order === "asc" || ctx.query.order === "desc") {
    q.order = ctx.query.order;
  }
  return q;
}
