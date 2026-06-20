/**
 * @module schema
 * Schema — describes the shape of Value Representation data.
 *
 * Used by:
 * - Resource.schema — declares what a handler returns
 * - Transformer.input — declares what data shape a transformer accepts
 * - SDK generation — produces TypeScript interfaces
 */

// ---------------------------------------------------------------------------
// Schema types
// ---------------------------------------------------------------------------

export interface SchemaAny {
  type: "any";
}

export interface SchemaNull {
  type: "null";
}

export interface SchemaBoolean {
  type: "boolean";
}

export interface SchemaNumber {
  type: "number";
}

export interface SchemaString {
  type: "string";
}

export interface SchemaArray {
  type: "array";
  items?: Schema;
}

export interface SchemaObject {
  type: "object";
  properties?: Record<string, Schema>;
}

/**
 * Raw content schema — matches pre-serialized bytes with a specific MIME type.
 *
 * Used by Transformer.input/output to declare that a transformer consumes
 * or produces raw (already-serialized) content, identified by MIME type
 * (supports wildcards like `image/*`).
 */
export interface SchemaRaw {
  type: "raw";
  /** MIME type, e.g. "application/json", "image/*" */
  mime: string;
}

/**
 * A simplified schema type for describing data shapes.
 * Used by ResourceDescriptor and Transformer to declare data contracts.
 *
 * - `SchemaRaw` (`{ type: "raw", mime }`) describes raw/pre-serialized content
 * - All other variants describe structured/value content
 */
export type Schema =
  | SchemaAny
  | SchemaNull
  | SchemaBoolean
  | SchemaNumber
  | SchemaString
  | SchemaArray
  | SchemaObject
  | SchemaRaw;

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

/**
 * Check if a schema describes raw (pre-serialized) content.
 */
export function isRawSchema(schema: Schema): schema is SchemaRaw {
  return schema.type === "raw";
}

/**
 * Check if a schema describes structured/value content (not raw).
 */
export function isValueSchema(schema: Schema): boolean {
  return schema.type !== "raw";
}

// ---------------------------------------------------------------------------
// Schema matching
// ---------------------------------------------------------------------------

/**
 * Check if `sub` is a subtype of `sup`.
 *
 * - `{ type: "any" }` is a supertype of everything (including `raw`)
 * - `{ type: "raw", mime }` matches `raw` with compatible MIME (wildcard support)
 * - Same primitive type → match
 * - Array: items must be subtype
 * - Object: all of sup's properties must be present in sub with subtypes
 */
export function schemaMatches(sub: Schema, sup: Schema): boolean {
  // "any" is a supertype of everything
  if (sup.type === "any") return true;

  // raw matches raw with MIME pattern matching
  if (sub.type === "raw" && sup.type === "raw") {
    return matchesMIME(sup.mime, sub.mime);
  }

  // raw vs non-raw → no match
  if (sub.type === "raw" || sup.type === "raw") return false;

  // Different type names → no match
  if (sub.type !== sup.type) return false;

  // Same primitive type → match
  if (
    sub.type === "null" ||
    sub.type === "boolean" ||
    sub.type === "number" ||
    sub.type === "string"
  ) {
    return true;
  }

  // Array: check items recursively
  if (sub.type === "array" && sup.type === "array") {
    if (!sup.items) return true; // sup accepts any items
    if (!sub.items) return false; // sub has no item constraint
    return schemaMatches(sub.items, sup.items);
  }

  // Object: all of sup's properties must be present in sub with subtypes
  if (sub.type === "object" && sup.type === "object") {
    if (!sup.properties) return true; // sup accepts any object
    if (!sub.properties) return false; // sub has no property constraint

    for (const [key, supProp] of Object.entries(sup.properties)) {
      const subProp = sub.properties[key];
      if (!subProp) return false;
      if (!schemaMatches(subProp, supProp)) return false;
    }
    return true;
  }

  return false;
}

/**
 * The universal schema — matches everything.
 */
export const anySchema: Schema = { type: "any" };

// ---------------------------------------------------------------------------
// MIME matching
// ---------------------------------------------------------------------------

/**
 * Check if a MIME type pattern matches a concrete MIME type.
 * Supports wildcards: `image/*` matches `image/png`, `image/jpeg`, etc.
 */
export function matchesMIME(pattern: string, concrete: string): boolean {
  const p = pattern.toLowerCase().trim();
  const c = concrete.toLowerCase().trim();
  if (p === c) return true;
  if (p.endsWith("/*")) {
    const prefix = p.slice(0, -2);
    return c.startsWith(prefix + "/");
  }
  return false;
}
