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
 * A simplified schema type for describing data shapes.
 * Used by ResourceDescriptor and Transformer to declare data contracts.
 */
export type Schema =
  | SchemaAny
  | SchemaNull
  | SchemaBoolean
  | SchemaNumber
  | SchemaString
  | SchemaArray
  | SchemaObject;

// ---------------------------------------------------------------------------
// Type guard
// ---------------------------------------------------------------------------

/**
 * Check if a value is a Schema object (vs a MIME string).
 */
export function isSchema(input: Schema | string): input is Schema {
  return typeof input === "object" && input !== null && "type" in input;
}

// ---------------------------------------------------------------------------
// Schema matching
// ---------------------------------------------------------------------------

/**
 * Check if `sub` is a subtype of `sup`.
 *
 * - `{ type: "any" }` is a supertype of everything
 * - Same primitive type → match
 * - Array: items must be subtype
 * - Object: all of sup's properties must be present in sub with subtypes
 */
export function schemaMatches(sub: Schema, sup: Schema): boolean {
  // "any" is a supertype of everything
  if (sup.type === "any") return true;

  // Different type names → no match
  if (sub.type !== sup.type) return false;

  // Same primitive type → match
  if (
    sub.type === "null" || sub.type === "boolean" ||
    sub.type === "number" || sub.type === "string"
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
