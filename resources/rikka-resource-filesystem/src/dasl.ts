/**
 * @module dasl
 * DASL XML (RFC 5323) parsing and evaluation.
 *
 * Used by {@link DavFileSystemResource} to back both the SEARCH method
 * (RFC 5323) and the QUERY method (RFC 10008). The DASL XML body is parsed
 * into a structured {@link DaslSearch} request; the caller is responsible
 * for collecting candidate entries that match the `<D:from>` scopes and
 * then applying {@link evalWhere} / {@link applyOrderby} / limit to filter
 * the result set.
 *
 * Supported DASL operators:
 * - Comparisons: `eq`, `lt`, `gt`, `lte`, `gte`, `like`
 * - Logical: `and`, `or`, `not`
 * - Existence: `isdefined`, `iscollection`
 * - Full-text: `contains` (matched against `displayname` — the resource body
 *   is not available at the storage layer)
 *
 * Supported DAV properties (case-insensitive):
 * - `displayname` — file or directory name
 * - `getcontentlength` — size in bytes (0 for directories)
 * - `getlastmodified` — last modification timestamp
 * - `iscollection` — `1` if directory, `0` otherwise
 * - `resourcetype` — `collection` for directories, empty string otherwise
 */

import { XMLParser } from "fast-xml-parser";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A flattened entry used by DASL evaluation. Built by the caller from
 * storage-level `DirectoryEntry` / `FileStat` values.
 */
export interface DaslEntry {
  /** URL path (absolute, site-rooted, e.g. `/dav/subdir/file.txt`). */
  href: string;
  /** File or directory name (last path segment). */
  name: string;
  /** Size in bytes (0 for directories). */
  size: number;
  /** Last modification date. */
  modified: Date;
  /** Whether this entry is a directory. */
  isDirectory: boolean;
}

/** A single search scope (`<D:scope>` inside `<D:from>`). */
export interface DaslScope {
  /** The scope href as written in the XML (absolute or relative URL path). */
  href: string;
  /** Depth: `0` = self only, `1` = self + immediate children, `infinity` = recursive. */
  depth: "0" | "1" | "infinity";
}

/** A parsed DASL condition (`<D:where>`). */
export interface DaslCondition {
  type:
    | "eq" | "lt" | "gt" | "lte" | "gte" | "like"
    | "and" | "or" | "not"
    | "isdefined" | "iscollection" | "contains";
  /** Property name for comparison / isdefined operators. */
  prop?: string;
  /** Comparison value (string form) for comparison / like / contains. */
  value?: string;
  /** Child conditions for `and`, `or`, `not`. */
  children?: DaslCondition[];
}

/** A parsed order clause (`<D:order>` inside `<D:orderby>`). */
export interface DaslOrder {
  /** Property name to sort by. */
  prop: string;
  /** Sort direction. Default `asc`. */
  direction: "asc" | "desc";
}

/** A parsed DASL search request (`<D:searchrequest><D:basicsearch>`). */
export interface DaslSearch {
  /** Properties to project into the response (`<D:select>`). Empty = all. */
  select?: string[];
  /** Search scopes (`<D:from>`). At least one. */
  from: DaslScope[];
  /** Where condition (`<D:where>`). */
  where?: DaslCondition;
  /** Order clauses (`<D:orderby>`). Multiple = lexicographic sort. */
  orderby?: DaslOrder[];
  /** Maximum number of results (`<D:limit><D:nresults>`). */
  limit?: number;
}

// ---------------------------------------------------------------------------
// XML parser — shared instance configured for DASL
// ---------------------------------------------------------------------------

const parser = new XMLParser({
  // DASL uses the `DAV:` namespace everywhere; strip prefixes (D:, A:, etc.).
  removeNSPrefix: true,
  // Keep values as strings; we convert to numbers at evaluation time.
  parseTagValue: false,
  parseAttributeValue: false,
  // Trim whitespace in text values.
  trimValues: true,
  // Treat self-closing tags like `<D:displayname/>` as `""` rather than `null`.
  // (Empty string is more convenient when the property is just a name marker.)
  // textNodeName is the default "key" for text content; with this setting,
  // `<D:literal>42</D:literal>` becomes `{ literal: "42" }`.
});

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

/** Normalize a value that may be a single object or an array into an array. */
function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

/** Get the single key of an object, throwing if there isn't exactly one. */
function soleKey(node: Record<string, unknown>, ctx: string): string {
  const keys = Object.keys(node);
  if (keys.length !== 1) {
    throw new Error(
      `${ctx}: expected exactly one operator, got [${keys.join(", ")}]`,
    );
  }
  return keys[0];
}

/**
 * Extract the property name from a `<D:prop>` element.
 * `<D:prop><D:displayname/></D:prop>` → `"displayname"`.
 */
function extractProp(content: Record<string, unknown>): string {
  const prop = content.prop as Record<string, unknown> | undefined;
  if (!prop || typeof prop !== "object") {
    throw new Error("DASL operator missing <D:prop>");
  }
  const propNames = Object.keys(prop);
  if (propNames.length !== 1) {
    throw new Error(
      `DASL <D:prop> must contain exactly one property, got [${propNames.join(", ")}]`,
    );
  }
  return propNames[0];
}

/** Extract the literal text from a `<D:literal>` element. */
function extractLiteral(content: Record<string, unknown>): string {
  const literal = content.literal;
  if (literal === undefined || literal === null) {
    throw new Error("DASL operator missing <D:literal>");
  }
  // fast-xml-parser may produce `""`, a string, or `{"#text": "..."}` for
  // mixed content. Normalise to a string.
  if (typeof literal === "string") return literal;
  if (typeof literal === "object" && "#text" in literal) {
    return String((literal as { "#text": unknown })["#text"]);
  }
  return String(literal);
}

const LEAF_COMPARE_OPS = new Set([
  "eq", "lt", "gt", "lte", "gte", "like", "contains",
]);

/**
 * Parse a single DASL condition. `node` is a one-key object whose key is
 * the operator name (e.g. `{ eq: { prop: ..., literal: ... } }`).
 */
function parseCondition(node: Record<string, unknown>): DaslCondition {
  const op = soleKey(node, "DASL condition");
  const content = (node[op] as Record<string, unknown> | undefined) ?? {};

  if (op === "and" || op === "or") {
    // Children: each key in `content` is a child operator name; the value
    // is either a single object (one child of that operator) or an array
    // (multiple children of the same operator).
    const children: DaslCondition[] = [];
    for (const childOp of Object.keys(content)) {
      const childContent = content[childOp];
      for (const childNode of asArray(childContent as Record<string, unknown>)) {
        children.push(parseCondition({ [childOp]: childNode }));
      }
    }
    return { type: op, children };
  }

  if (op === "not") {
    const childOp = soleKey(content as Record<string, unknown>, "DASL 'not'");
    const childContent = (content as Record<string, unknown>)[childOp];
    const childNodes = asArray(childContent as Record<string, unknown>);
    if (childNodes.length !== 1) {
      throw new Error("DASL 'not' requires exactly one child condition");
    }
    return {
      type: "not",
      children: [parseCondition({ [childOp]: childNodes[0] })],
    };
  }

  if (op === "iscollection") {
    return { type: "iscollection" };
  }

  if (op === "isdefined") {
    return {
      type: "isdefined",
      prop: extractProp(content as Record<string, unknown>),
    };
  }

  if (LEAF_COMPARE_OPS.has(op)) {
    return {
      type: op as DaslCondition["type"],
      prop: extractProp(content as Record<string, unknown>),
      value: extractLiteral(content as Record<string, unknown>),
    };
  }

  throw new Error(`Unknown DASL operator: ${op}`);
}

/**
 * Parse a DASL XML search request body into a structured {@link DaslSearch}.
 *
 * @throws Error if the XML is malformed or doesn't conform to the DASL
 *   basicsearch structure.
 */
export function parseDasl(xml: string): DaslSearch {
  let doc: unknown;
  try {
    doc = parser.parse(xml);
  } catch (err) {
    throw new Error(`Invalid XML: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Navigate to <D:searchrequest><D:basicsearch>
  const root = doc as { searchrequest?: { basicsearch?: Record<string, unknown> } };
  const basic = root?.searchrequest?.basicsearch;
  if (!basic) {
    throw new Error("DASL XML missing <D:searchrequest><D:basicsearch>");
  }

  // <D:from><D:scope> — one or more scopes
  const fromNode = basic.from as { scope?: unknown } | undefined;
  const scopeList = asArray(fromNode?.scope as Record<string, unknown> | Record<string, unknown>[]);
  const scopes: DaslScope[] = scopeList.map(
    (s): DaslScope => {
      const node = s as Record<string, unknown>;
      const href = String(node.href ?? "");
      const rawDepth = String(node.depth ?? "1").toLowerCase();
      const depth: DaslScope["depth"] =
        rawDepth === "0" ? "0" : rawDepth === "infinity" ? "infinity" : "1";
      return { href, depth };
    },
  );
  if (scopes.length === 0) {
    throw new Error("DASL <D:from> must contain at least one <D:scope>");
  }

  // <D:select><D:prop> — optional property projection
  let select: string[] | undefined;
  const selectNode = basic.select as { prop?: Record<string, unknown> } | undefined;
  if (selectNode?.prop) {
    select = Object.keys(selectNode.prop);
  }

  // <D:where> — optional condition
  let where: DaslCondition | undefined;
  const whereNode = basic.where as Record<string, unknown> | undefined;
  if (whereNode) {
    where = parseCondition(whereNode);
  }

  // <D:orderby><D:order> — optional sort orders
  let orderby: DaslOrder[] | undefined;
  const orderbyNode = basic.orderby as { order?: unknown } | undefined;
  if (orderbyNode?.order) {
    const orderList = asArray(orderbyNode.order as Record<string, unknown> | Record<string, unknown>[]);
    orderby = orderList.map((o): DaslOrder => {
      const node = o as Record<string, unknown>;
      const prop = extractProp(node);
      // <D:descending/> → desc; otherwise (including <D:ascending/> or neither) → asc.
      const direction: DaslOrder["direction"] =
        "descending" in node ? "desc" : "asc";
      return { prop, direction };
    });
  }

  // <D:limit><D:nresults> — optional maximum number of results
  let limit: number | undefined;
  const limitNode = basic.limit as { nresults?: unknown } | undefined;
  if (limitNode?.nresults !== undefined) {
    const n = Number(limitNode.nresults);
    if (Number.isFinite(n) && n >= 0) limit = Math.floor(n);
  }

  return { select, from: scopes, where, orderby, limit };
}

// ---------------------------------------------------------------------------
// Evaluation
// ---------------------------------------------------------------------------

/**
 * Read a DAV property from a {@link DaslEntry} as a comparable value.
 * Returns `undefined` for unknown / unsupported properties.
 */
export function getDaslProp(
  entry: DaslEntry,
  prop: string,
): string | number | undefined {
  switch (prop.toLowerCase()) {
    case "displayname":
      return entry.name;
    case "getcontentlength":
      return entry.size;
    case "getlastmodified":
      // Compare by epoch millis (numeric).
      return entry.modified.getTime();
    case "iscollection":
      return entry.isDirectory ? 1 : 0;
    case "resourcetype":
      return entry.isDirectory ? "collection" : "";
    case "getcontenttype":
      // Not available at the storage layer — caller can populate it.
      return undefined;
    default:
      return undefined;
  }
}

/** Compare an entry's property against a literal value. Returns -1, 0, or 1. */
function compareProp(
  entry: DaslEntry,
  prop: string,
  literal: string,
): number {
  const actual = getDaslProp(entry, prop);
  if (actual === undefined) return -1;

  if (typeof actual === "number") {
    const num = Number(literal);
    if (Number.isNaN(num)) {
      // Fall back to string comparison when the literal isn't a number.
      const actualStr = String(actual);
      return actualStr < literal ? -1 : actualStr > literal ? 1 : 0;
    }
    return actual < num ? -1 : actual > num ? 1 : 0;
  }

  const actualStr = String(actual);
  return actualStr < literal ? -1 : actualStr > literal ? 1 : 0;
}

/**
 * Match a string against a DASL `<D:like>` pattern.
 * DASL uses SQL-like patterns: `_` matches any single character,
 * `%` matches any sequence of characters. Matching is case-insensitive
 * (mirroring typical DASL server behaviour).
 */
function likeMatch(value: string, pattern: string): boolean {
  // Build a regex from the pattern: escape regex specials, then translate _ and %.
  const regexStr =
    "^" +
    pattern
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/_/g, ".")
      .replace(/%/g, ".*") +
    "$";
  return new RegExp(regexStr, "i").test(value);
}

/** Evaluate a DASL condition against a single entry. */
export function evalWhere(
  entry: DaslEntry,
  cond: DaslCondition,
): boolean {
  switch (cond.type) {
    case "and":
      return cond.children!.every((c) => evalWhere(entry, c));
    case "or":
      return cond.children!.some((c) => evalWhere(entry, c));
    case "not":
      return !evalWhere(entry, cond.children![0]);
    case "eq":
      return compareProp(entry, cond.prop!, cond.value!) === 0;
    case "lt":
      return compareProp(entry, cond.prop!, cond.value!) < 0;
    case "gt":
      return compareProp(entry, cond.prop!, cond.value!) > 0;
    case "lte":
      return compareProp(entry, cond.prop!, cond.value!) <= 0;
    case "gte":
      return compareProp(entry, cond.prop!, cond.value!) >= 0;
    case "like": {
      const actual = getDaslProp(entry, cond.prop!);
      return actual !== undefined && likeMatch(String(actual), cond.value!);
    }
    case "isdefined":
      return getDaslProp(entry, cond.prop!) !== undefined;
    case "iscollection":
      return entry.isDirectory;
    case "contains": {
      // RFC 5323 §5.15: `contains` performs a full-text search over the
      // resource body. We don't read file bodies here (would require I/O
      // per candidate and a full-text index for scale). Match against the
      // display name as a pragmatic approximation.
      return likeMatch(entry.name, cond.value!);
    }
    default:
      return false;
  }
}

/** Compare two property values for sorting. */
function compareValues(a: unknown, b: unknown): number {
  if (a === undefined && b === undefined) return 0;
  if (a === undefined) return -1;
  if (b === undefined) return 1;
  if (typeof a === "number" && typeof b === "number") {
    return a < b ? -1 : a > b ? 1 : 0;
  }
  const as = String(a);
  const bs = String(b);
  return as < bs ? -1 : as > bs ? 1 : 0;
}

/**
 * Apply `<D:orderby>` to a list of entries. Returns a new sorted array.
 * Multiple order clauses produce lexicographic multi-key sort.
 */
export function applyOrderby(
  entries: DaslEntry[],
  orders: DaslOrder[],
): DaslEntry[] {
  return [...entries].sort((a, b) => {
    for (const order of orders) {
      const av = getDaslProp(a, order.prop);
      const bv = getDaslProp(b, order.prop);
      const cmp = compareValues(av, bv);
      if (cmp !== 0) return order.direction === "desc" ? -cmp : cmp;
    }
    return 0;
  });
}
