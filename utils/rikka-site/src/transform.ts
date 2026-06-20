/**
 * @module transform
 * Transformer — Repr → Repr transformation pipeline.
 *
 * Transformers convert one Repr into another. The pipeline works directly
 * with the public `Repr = { content, meta }` type — no separate internal
 * representation types.
 *
 * A Repr is "value" (structured data) when `content` is not bytes;
 * it is "raw" (pre-serialized) when `content` is `string | Uint8Array`
 * and `meta.type` carries the MIME type.
 *
 * Pipeline:
 *   Repr(value) → [Value→Value transformers] → Repr(value')
 *               → [Value→Raw transformer]    → Repr(raw, meta.type = mimeType)
 *               → [Raw→Raw transformer]       → Repr(raw, meta.type = mimeType')
 *
 * Transformers are managed through a {@link TransformerRegistry} instance.
 * The `Site` constructor creates a registry and registers the built-in
 * transformers automatically.
 *
 * @example
 * ```ts
 * import { TransformerRegistry } from "@takanashi/rikka-site";
 * import type { Transformer, TransformContext, Repr } from "@takanashi/rikka-site";
 *
 * // Value(array-of-objects) → Raw("text/csv")
 * const csvTransformer: Transformer = {
 *   input: { type: "array", items: { type: "object" } },
 *   output: { type: "raw", mime: "text/csv" },
 *   transform(repr, ctx) {
 *     if (!Array.isArray(repr.content)) return { content: "", meta: { type: "text/csv" } };
 *     const rows = repr.content.map(row => Object.values(row as Record<string, unknown>).join(","));
 *     return { content: [Object.keys(repr.content[0] as Record<string, unknown>).join(","), ...rows].join("\n"), meta: { type: "text/csv" } };
 *   },
 * };
 *
 * const registry = new TransformerRegistry();
 * registry.register(csvTransformer);
 * ```
 */

import type { Schema, SchemaRaw } from "./schema.js";
import {
  isRawSchema,
  schemaMatches,
  anySchema,
  matchesMIME,
} from "./schema.js";
import type { Resource } from "./resource.js";
import type { Repr, ReprMeta } from "./representation.js";
import { isBytes } from "./representation.js";
import type { SitemapEntry } from "./sitemap.js";
import type { CustomElementRegistryEntry } from "./custom-elements.js";
import type { SiteAsset } from "./site.js";

// ---------------------------------------------------------------------------
// TransformContext
// ---------------------------------------------------------------------------

/**
 * Context provided to transformer functions.
 */
export interface TransformContext {
  /** The per-request mount path of the resource (e.g. `/articles/42`) */
  path: string;
  /** Custom element tag name for HTML representation (from resource.element) */
  element?: unknown;
  /** JSON-LD @context URI (from resource.context) */
  context?: string;
  /** JSON-LD @type (from resource.jsonldType) */
  jsonldType?: string;
}

// ---------------------------------------------------------------------------
// Transformer — unified interface
// ---------------------------------------------------------------------------

/**
 * A transformer converts one Repr into another.
 *
 * - `input` is a Schema: value schemas (e.g. `{ type: "array" }`) match
 *   structured content; `{ type: "raw", mime }` matches pre-serialized content
 * - `output` is a Schema: value schemas produce structured content;
 *   `{ type: "raw", mime }` produces pre-serialized content
 * - `transform` receives a Repr and context, returns a new Repr
 */
export interface Transformer {
  /** Input specification: value Schema or `{ type: "raw", mime }` */
  input: Schema;
  /** Output specification: value Schema or `{ type: "raw", mime }` */
  output: Schema;
  /** Priority for negotiation (higher = preferred, default 0) */
  priority?: number;
  /** Transform a Repr into another Repr */
  transform(repr: Repr, ctx: TransformContext): Repr | Promise<Repr>;
}

// ---------------------------------------------------------------------------
// Transformer registry
// ---------------------------------------------------------------------------

interface TransformerEntry {
  transformer: Transformer;
  input: Schema;
  output: Schema;
  priority: number;
}

/**
 * Check if a Repr's content is raw (pre-serialized bytes).
 */
function isRawRepr(repr: Repr): boolean {
  return isBytes(repr.content);
}

/**
 * Registry for managing transformers and executing the transformation pipeline.
 *
 * Create an instance, register transformers, then use `transform()` or
 * `transformData()` to convert representations.
 */
export class TransformerRegistry {
  private entries: TransformerEntry[] = [];

  constructor(initial?: Transformer[]) {
    if (initial) {
      for (const t of initial) this.register(t);
    }
  }

  /** Register a transformer. */
  register(transformer: Transformer): void {
    const priority = transformer.priority ?? 0;

    // Remove existing entry with same transformer instance
    const existingIdx = this.entries.findIndex(
      (e) => e.transformer === transformer,
    );
    if (existingIdx !== -1) {
      this.entries.splice(existingIdx, 1);
    }

    this.entries.push({
      transformer,
      input: transformer.input,
      output: transformer.output,
      priority,
    });
  }

  /** Unregister a transformer. */
  unregister(transformer: Transformer): void {
    const idx = this.entries.findIndex((e) => e.transformer === transformer);
    if (idx !== -1) {
      this.entries.splice(idx, 1);
    }
  }

  /** Find a transformer for a MIME type (convenience lookup). */
  findTransformer(requestedType: string): Transformer | null {
    const norm = requestedType.toLowerCase().trim();
    const entry = this.entries
      .filter(
        (e) =>
          isRawSchema(e.output) && e.output.mime.toLowerCase().trim() === norm,
      )
      .sort((a, b) => b.priority - a.priority)[0];
    return entry?.transformer ?? null;
  }

  /**
   * Find transformers that can accept value content with the given schema.
   * Returns transformers whose input Schema is a supertype of `schema`,
   * sorted by priority (descending).
   */
  findValueTransformers(schema: Schema): Transformer[] {
    return this.entries
      .filter((e) => !isRawSchema(e.input) && schemaMatches(schema, e.input))
      .sort((a, b) => b.priority - a.priority)
      .map((e) => e.transformer);
  }

  /**
   * Find transformers that can accept raw content with the given MIME type.
   * Supports wildcard matching (e.g. "image/*" matches "image/png").
   */
  findRawTransformers(mimeType: string): Transformer[] {
    const norm = mimeType.toLowerCase().trim();
    return this.entries
      .filter((e) => {
        if (!isRawSchema(e.input)) return false;
        return matchesMIME(e.input.mime, norm);
      })
      .sort((a, b) => b.priority - a.priority)
      .map((e) => e.transformer);
  }

  /**
   * Find the best Value→Raw transformer for a target MIME type.
   * The transformer's input Schema must match the given schema.
   */
  findValueToRawTransformer(
    schema: Schema,
    targetMime: string,
  ): Transformer | null {
    const norm = targetMime.toLowerCase().trim();
    const matches = this.entries
      .filter((e) => {
        if (isRawSchema(e.input)) return false;
        if (!isRawSchema(e.output)) return false;
        return (
          schemaMatches(schema, e.input) &&
          e.output.mime.toLowerCase().trim() === norm
        );
      })
      .sort((a, b) => b.priority - a.priority);
    return matches[0]?.transformer ?? null;
  }

  /** Find a Raw→Raw transformer from inputMime to targetMime. */
  findRawToRawTransformer(
    inputMime: string,
    targetMime: string,
  ): Transformer | null {
    const inputNorm = inputMime.toLowerCase().trim();
    const targetNorm = targetMime.toLowerCase().trim();
    const matches = this.entries
      .filter((e) => {
        if (!isRawSchema(e.input) || !isRawSchema(e.output)) return false;
        return (
          matchesMIME(e.input.mime, inputNorm) &&
          e.output.mime.toLowerCase().trim() === targetNorm
        );
      })
      .sort((a, b) => b.priority - a.priority);
    return matches[0]?.transformer ?? null;
  }

  /** Get all registered output MIME types (from transformers that produce raw). */
  registeredOutputTypes(): string[] {
    return this.entries
      .filter((e): e is TransformerEntry & { output: SchemaRaw } =>
        isRawSchema(e.output),
      )
      .map((e) => e.output.mime);
  }

  /** Check if a transformer exists that can produce the target type. */
  canProduce(targetType: string): boolean {
    const norm = targetType.toLowerCase().trim();
    return this.entries.some((e) => {
      if (!isRawSchema(e.output)) return false;
      return e.output.mime.toLowerCase().trim() === norm;
    });
  }

  /**
   * Execute the transformation pipeline for a resource.
   *
   * Pipeline:
   * 1. If content is value, apply Value→Value transformers (by priority)
   * 2. If content is already raw with target MIME → done
   * 3. If content is value, try direct Value→Raw(target) transformer
   * 4. If no direct, try Value→Raw(intermediate)→Raw→Raw(target) chain
   * 5. If content is raw with different MIME → try Raw→Raw
   * 6. Fallback to JSON
   */
  async transformPipeline(
    resource: Resource,
    path: string,
    repr: Repr,
    targetContentType: string,
  ): Promise<TransformResult> {
    const targetNorm = targetContentType.toLowerCase().trim();
    const ctx: TransformContext = {
      path,
      element: resource.element,
      context: resource.context,
      jsonldType: resource.jsonldType,
    };
    const schema = resource.schema ?? anySchema;

    // Step 1: If value content, apply Value→Value transformers
    if (!isRawRepr(repr)) {
      const valueToValue = this.entries
        .filter((e) => !isRawSchema(e.input) && !isRawSchema(e.output))
        .filter((e) => schemaMatches(schema, e.input))
        .sort((a, b) => b.priority - a.priority);

      for (const entry of valueToValue) {
        repr = await entry.transformer.transform(repr, ctx);
        // If transformer produced raw content, stop Value→Value chain
        if (isRawRepr(repr)) break;
      }
    }

    // Step 2: If already raw with target MIME → done
    if (isRawRepr(repr)) {
      const currentMime = repr.meta.type?.toLowerCase().trim() ?? "";
      if (currentMime === targetNorm) {
        return {
          body: repr.content as
            | string
            | Uint8Array
            | ReadableStream<Uint8Array>,
          contentType: repr.meta.type!,
        };
      }
    }

    // Step 3: If value content, try direct Value→Raw(target)
    if (!isRawRepr(repr)) {
      const direct = this.findValueToRawTransformer(schema, targetNorm);
      if (direct) {
        const result = await direct.transform(repr, ctx);
        if (isRawRepr(result)) {
          return {
            body: result.content as
              | string
              | Uint8Array
              | ReadableStream<Uint8Array>,
            contentType: result.meta.type!,
          };
        }
        // Transformer returned value instead of raw — stringify as JSON
        return {
          body: JSON.stringify(result.content, null, 2),
          contentType: targetNorm,
        };
      }

      // Step 4: Try Value→Raw(intermediate)→Raw→Raw(target) chain
      const valueToRawEntries = this.entries
        .filter(
          (e): e is TransformerEntry & { output: SchemaRaw } =>
            !isRawSchema(e.input) && isRawSchema(e.output),
        )
        .filter((e) => schemaMatches(schema, e.input))
        .sort((a, b) => b.priority - a.priority);

      for (const v2rEntry of valueToRawEntries) {
        const intermediateMime = v2rEntry.output.mime.toLowerCase().trim();
        const r2rTransformer = this.findRawToRawTransformer(
          intermediateMime,
          targetNorm,
        );
        if (r2rTransformer) {
          const intermediate = await v2rEntry.transformer.transform(repr, ctx);
          if (isRawRepr(intermediate)) {
            const final = await r2rTransformer.transform(intermediate, ctx);
            if (isRawRepr(final)) {
              return {
                body: final.content as
                  | string
                  | Uint8Array
                  | ReadableStream<Uint8Array>,
                contentType: final.meta.type!,
              };
            }
          }
        }
      }
    }

    // Step 5: If raw with different MIME, try Raw→Raw
    if (isRawRepr(repr)) {
      const currentMime = repr.meta.type?.toLowerCase().trim() ?? "";
      const r2r = this.findRawToRawTransformer(currentMime, targetNorm);
      if (r2r) {
        const result = await r2r.transform(repr, ctx);
        if (isRawRepr(result)) {
          return {
            body: result.content as
              | string
              | Uint8Array
              | ReadableStream<Uint8Array>,
            contentType: result.meta.type!,
          };
        }
      }
      // No transformer — return as-is
      return {
        body: repr.content as string | Uint8Array | ReadableStream<Uint8Array>,
        contentType: repr.meta.type ?? "application/octet-stream",
      };
    }

    // Step 6: Fallback to JSON
    return {
      body: JSON.stringify(repr.content, null, 2),
      contentType: "application/json",
    };
  }

  /**
   * Transform a resource's representation to a target content type.
   * Delegates to {@link transformPipeline}.
   */
  async transform(
    resource: Resource,
    path: string,
    repr: Repr,
    contentType: string,
  ): Promise<TransformResult> {
    return this.transformPipeline(resource, path, repr, contentType);
  }

  /** Convenience: transform raw data into a target content type. */
  async transformData(
    resource: Resource,
    path: string,
    data: unknown,
    targetContentType: string,
  ): Promise<TransformResult> {
    const repr: Repr = { content: data, meta: {} };
    return this.transformPipeline(resource, path, repr, targetContentType);
  }
}

// ---------------------------------------------------------------------------
// Transformation pipeline result
// ---------------------------------------------------------------------------

/**
 * Result of the transformation pipeline.
 *
 * `body` is:
 * - `string` for text formats (JSON, HTML, CSV, …)
 * - `Uint8Array` for binary formats (CBOR, protobuf, …)
 * - `ReadableStream<Uint8Array>` for streamed/proxied content
 *
 * Binary transformers produce `Uint8Array` content which flows through the
 * pipeline unchanged — it is never decoded via TextDecoder, so arbitrary
 * byte sequences are preserved. Streamed content is passed through as-is.
 */
export interface TransformResult {
  body: string | Uint8Array | ReadableStream<Uint8Array>;
  contentType: string;
}

// ---------------------------------------------------------------------------
// Built-in transformers
// ---------------------------------------------------------------------------

/**
 * JSON-LD helper — shared by jsonldTransformer and htmlTransformer.
 */
function toJsonLd(
  ctx: TransformContext,
  data: unknown,
): Record<string, unknown> {
  const context = ctx.context ?? "https://rikka.dev/context";
  const type = ctx.jsonldType;
  const path = ctx.path;

  if (Array.isArray(data)) {
    const node: Record<string, unknown> = { "@context": context, "@id": path, "@graph": data };
    if (type) node["@type"] = type;
    return node;
  }

  if (typeof data === "object" && data !== null) {
    const node: Record<string, unknown> = {
      "@context": context,
      "@id": path,
      ...(data as Record<string, unknown>),
    };
    if (type) node["@type"] = type;
    return node;
  }

  const node: Record<string, unknown> = { "@context": context, "@id": path, value: data };
  if (type) node["@type"] = type;
  return node;
}

/**
 * Built-in: Value(any) → Raw("application/json")
 */
export const jsonTransformer: Transformer = {
  input: anySchema,
  output: { type: "raw", mime: "application/json" },
  priority: 0,
  transform(repr: Repr): Repr {
    return {
      content: JSON.stringify(repr.content, null, 2),
      meta: { type: "application/json" },
    };
  },
};

/**
 * Built-in: Value(any) → Raw("application/ld+json")
 */
export const jsonldTransformer: Transformer = {
  input: anySchema,
  output: { type: "raw", mime: "application/ld+json" },
  priority: 0,
  transform(repr: Repr, ctx: TransformContext): Repr {
    return {
      content: JSON.stringify(
        toJsonLd(ctx, repr.content),
        null,
        2,
      ),
      meta: { type: "application/ld+json" },
    };
  },
};

// ---------------------------------------------------------------------------
// Built-in CSV transformer — array-of-objects → text/csv (RFC 4180)
// ---------------------------------------------------------------------------

/**
 * Quote a CSV field per RFC 4180: wrap in double quotes if it contains
 * comma, quote, newline, or carriage return; escape inner quotes by doubling.
 */
function csvField(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Built-in: Value(array-of-objects) → Raw("text/csv")
 *
 * Serializes an array of plain objects as CSV following RFC 4180:
 * - First row is the header (object keys, in insertion order)
 * - Each subsequent row is one object's values
 * - Fields containing comma, quote, or newline are quoted and escaped
 * - Empty arrays produce an empty body
 */
export const csvTransformer: Transformer = {
  input: { type: "array", items: { type: "object" } },
  output: { type: "raw", mime: "text/csv" },
  priority: 0,
  transform(repr: Repr): Repr {
    const data = repr.content;
    if (!Array.isArray(data) || data.length === 0) {
      return { content: "", meta: { type: "text/csv" } };
    }
    // Collect header keys from the first row (insertion order)
    const first = data[0] as Record<string, unknown>;
    const keys = Object.keys(first);
    const header = keys.map(csvField).join(",");
    const rows = data.map((row) => {
      const obj = row as Record<string, unknown>;
      return keys.map((k) => csvField(obj[k])).join(",");
    });
    return {
      content: [header, ...rows].join("\r\n"),
      meta: { type: "text/csv" },
    };
  },
};

// ---------------------------------------------------------------------------
// Built-in plain-text transformer — any → text/plain
// ---------------------------------------------------------------------------

/**
 * Built-in: Value(any) → Raw("text/plain")
 *
 * Renders a human-readable plain-text view of the resource:
 * - Arrays: one item per line, objects as `key: value` pairs
 * - Objects: `key: value` pairs, one per line
 * - Primitives: their string representation
 *
 * Useful for debugging, curl output, and accessibility fallbacks.
 */
export const textTransformer: Transformer = {
  input: anySchema,
  output: { type: "raw", mime: "text/plain" },
  priority: 0,
  transform(repr: Repr, ctx: TransformContext): Repr {
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
// Built-in CBOR transformer — any → application/cbor (RFC 8949)
// ---------------------------------------------------------------------------

/**
 * Encode a value as CBOR (Concise Binary Object Representation, RFC 8949).
 *
 * Self-contained encoder — no external dependency. Supports the JSON data
 * model plus `Uint8Array` (encoded as CBOR major type 2, byte string):
 * - `null` / `undefined` → simple values (0xf6 / 0xf7)
 * - `boolean`            → true (0xf5) / false (0xf4)
 * - integers             → unsigned (major 0) or negative (major 1), smallest
 *                          width among 1B / 2B / 4B / 8B
 * - non-integer numbers  → float64 (0xfb), big-endian
 * - `string`             → text string (major 3), UTF-8
 * - `Uint8Array`         → byte string (major 2)
 * - `Array`              → array (major 4)
 * - plain objects        → map (major 5), keys encoded as text strings
 *
 * Output is a `Uint8Array` that flows through the pipeline as raw bytes —
 * it is never decoded via TextDecoder, so arbitrary byte sequences survive.
 */
function cborEncode(value: unknown): Uint8Array {
  const out: number[] = [];
  cborWrite(value, out);
  return new Uint8Array(out);
}

/** Write the CBOR "head" (initial byte + length argument) for a major type. */
function cborHead(major: number, len: number, out: number[]): void {
  const mt = major << 5;
  if (len < 24) {
    out.push(mt | len);
  } else if (len < 0x100) {
    out.push(mt | 24, len);
  } else if (len < 0x10000) {
    out.push(mt | 25, (len >> 8) & 0xff, len & 0xff);
  } else if (len < 0x100000000) {
    out.push(
      mt | 26,
      (len >>> 24) & 0xff,
      (len >> 16) & 0xff,
      (len >> 8) & 0xff,
      len & 0xff,
    );
  } else {
    // 8-byte length — needs BigInt for the high bits.
    out.push(mt | 27);
    const hi = Math.floor(len / 0x100000000);
    const lo = len >>> 0;
    out.push(
      (hi >>> 24) & 0xff,
      (hi >> 16) & 0xff,
      (hi >> 8) & 0xff,
      hi & 0xff,
      (lo >>> 24) & 0xff,
      (lo >> 16) & 0xff,
      (lo >> 8) & 0xff,
      lo & 0xff,
    );
  }
}

function cborWrite(value: unknown, out: number[]): void {
  if (value === null) {
    out.push(0xf6);
    return;
  }
  if (value === undefined) {
    out.push(0xf7);
    return;
  }
  if (value === true) {
    out.push(0xf5);
    return;
  }
  if (value === false) {
    out.push(0xf4);
    return;
  }
  if (typeof value === "number") {
    cborWriteNumber(value, out);
    return;
  }
  if (typeof value === "string") {
    const utf8 = new TextEncoder().encode(value);
    cborHead(3, utf8.length, out);
    for (const b of utf8) out.push(b);
    return;
  }
  if (value instanceof Uint8Array) {
    cborHead(2, value.length, out);
    for (const b of value) out.push(b);
    return;
  }
  if (Array.isArray(value)) {
    cborHead(4, value.length, out);
    for (const item of value) cborWrite(item, out);
    return;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    cborHead(5, keys.length, out);
    for (const k of keys) {
      const utf8 = new TextEncoder().encode(k);
      cborHead(3, utf8.length, out);
      for (const b of utf8) out.push(b);
      cborWrite(obj[k], out);
    }
    return;
  }
  // Unknown type (function, symbol, bigint without dedicated branch) → null.
  out.push(0xf6);
}

function cborWriteNumber(n: number, out: number[]): void {
  if (Number.isInteger(n) && n >= 0 && n <= 0x1fffffffffffff) {
    cborHead(0, n, out);
    return;
  }
  if (Number.isInteger(n) && n < 0 && n >= -0x1fffffffffffff) {
    cborHead(1, -1 - n, out);
    return;
  }
  // Float64 (0xfb), big-endian.
  out.push(0xfb);
  const buf = new ArrayBuffer(8);
  new Float64Array(buf)[0] = n;
  const view = new Uint8Array(buf);
  for (let i = 7; i >= 0; i--) out.push(view[i]!);
}

/**
 * Built-in: Value(any) → Raw("application/cbor")
 *
 * Serializes structured data as CBOR (RFC 8949). CBOR is a binary superset
 * of the JSON data model — more compact, faster to parse, and preserves
 * `Uint8Array` as byte strings. The output is a `Uint8Array` that travels
 * through the pipeline as raw bytes without any string conversion.
 */
export const cborTransformer: Transformer = {
  input: anySchema,
  output: { type: "raw", mime: "application/cbor" },
  priority: 0,
  transform(repr: Repr): Repr {
    return {
      content: cborEncode(repr.content),
      meta: { type: "application/cbor" },
    };
  },
};

// ---------------------------------------------------------------------------
// Protobuf transformer factory — protobuf(schema) returns a Transformer
// ---------------------------------------------------------------------------

/**
 * Duck-typed interface for a Protocol Buffers message type.
 *
 * Any object with an `encode(message): Uint8Array` method qualifies. This
 * matches [protobufjs](https://github.com/protobufjs/protobuf.js) `Type`
 * instances (`Type.encode(message).finish()`) when wrapped, as well as
 * hand-rolled encoders. rikka-site does **not** depend on protobufjs —
 * you bring your own schema/encoder.
 *
 * @example
 * ```ts
 * import protobufjs from "protobufjs";
 * import { protobuf, Site } from "@takanashi/rikka-site";
 *
 * const Root = await protobufjs.load("user.proto");
 * const User = Root.lookupType("app.User");
 *
 * // Wrap protobufjs Type to satisfy ProtobufMessage:
 * const userSchema = {
 *   encode: (msg: unknown) => User.encode(msg).finish(),
 * };
 *
 * const app = new Site(
 *   { users: Users() },
 *   { transformers: [protobuf(userSchema)] },
 * );
 * // GET /users?accept=protobuf → application/x-protobuf bytes
 * ```
 */
export interface ProtobufMessage {
  /** Serialize a message object into protobuf bytes. */
  encode(message: unknown): Uint8Array;
}

/**
 * Create a Protocol Buffers transformer bound to a message schema.
 *
 * Protobuf is schema-based — unlike JSON or CBOR it cannot serialize
 * arbitrary objects without a pre-defined message type. Therefore
 * `protobuf` is a **factory**: `protobuf(schema)` returns a `Transformer`
 * specialized to one message type.
 *
 * The `schema` is duck-typed (see {@link ProtobufMessage}), so rikka-site
 * stays free of a protobufjs dependency. Pass a protobufjs `Type` (wrapped
 * to call `.finish()`), a generated class, or any object with an
 * `encode(message): Uint8Array` method.
 *
 * The resulting transformer produces `application/x-protobuf` bytes
 * (`Uint8Array`) that flow through the pipeline as raw bytes.
 *
 * @example
 * ```ts
 * import { protobuf } from "@takanashi/rikka-site";
 *
 * const xform = protobuf({
 *   encode: (msg) => myEncoder(msg),
 * });
 * ```
 */
export function protobuf(schema: ProtobufMessage): Transformer {
  return {
    input: anySchema,
    output: { type: "raw", mime: "application/x-protobuf" },
    priority: 0,
    transform(repr: Repr): Repr {
      return {
        content: schema.encode(repr.content),
        meta: { type: "application/x-protobuf" },
      };
    },
  };
}

// ---------------------------------------------------------------------------
// HTML transformer — configurable, with custom element and DSDOM support
// ---------------------------------------------------------------------------

/**
 * Hydration strategy for Custom Element HTML output.
 *
 * Controls how (and whether) resource data is embedded in the server-rendered
 * HTML so that client-side Custom Elements can hydrate without extra network
 * requests.
 *
 * - `"none"`      — No data embedded. CEs must fetch their own data (pure CSR).
 *                    Smallest HTML payload; highest client cost.
 * - `"data-attr"` — Data serialized as a `data-resource` JSON attribute on the
 *                    custom element tag. Simple, reliable, works everywhere.
 *                    Recommended default for most applications.
 * - `"dsdom"`     — Full Declarative Shadow DOM SSR. The server executes the
 *                    custom element's render function (via jsdom or similar) and
 *                    embeds the fully-rendered shadow DOM inside
 *                    `<template shadowrootmode="open">`. Zero FOUC but requires
 *                    a server-side JS runtime and careful signal handling.
 * - `"jsonld"`    — Data embedded as `<script type="application/ld+json">`
 *                    inside the custom element's light DOM. Uses JSON-LD format
 *                    with @context, @id, @type fields. Good for SEO and
 *                    structured data consumers.
 * - `"early-hint"`— No inline data. Instead, the server emits `Link:` preload
 *                    headers pointing to the JSON endpoint for each resource.
 *                    The browser preloads the data before the CE connects;
 *                    the CE reads it from cache or fetches on demand.
 *                    Good for large payloads where inline bloat is a concern.
 */
export type HydrationStrategy =
  | "none"
  | "data-attr"
  | "dsdom"
  | "jsonld"
  | "early-hint";

/**
 * Serialization strategy for embedding resource data in server-rendered HTML.
 */
export type SerializationStrategy = "data-attr" | "jsonld" | "both";

/**
 * Configuration for the HTML transformer.
 */
export interface HtmlTransformerConfig {
  /**
   * Default custom element tag name when no resource-specific element is found.
   * Defaults to "rikka-resource".
   */
  defaultElement?: string;

  /**
   * Hydration strategy — controls how resource data is delivered to client-side
   * Custom Elements for hydration.
   *
   * @default "data-attr"
   */
  hydration?: HydrationStrategy;

  /**
   * Serialization strategy — controls which format is used to embed resource
   * data in the server-rendered HTML. The default is `"data-attr"`, which emits
   * a single `data-resource` attribute and keeps the payload small.
   *
   * - `"data-attr"` — JSON data in the `data-resource` attribute (default)
   * - `"jsonld"`    — JSON-LD `<script type="application/ld+json">` in `<head>`
   * - `"both"`      — both formats (larger payload, useful for SEO + hydration)
   *
   * @default "data-attr"
   */
  serialization?: SerializationStrategy;

  /**
   * Custom page title generator.
   * Receives the resource's path and data; returns a title string.
   * Defaults to the path.
   */
  title?: string | ((path: string, data: unknown) => string);

  /**
   * Layout wrapper element tag name.
   * When set, the body content is wrapped inside this element,
   * which typically provides shared chrome (header, nav, footer).
   *
   * The layout element receives attribute: `data-path`.
   */
  layoutElement?: string;

  /**
   * Additional inline scripts to inject into `<head>`.
   * Each entry is either a URL string (rendered as `<script src="...">`)
   * or an object `{ src, module?, async? }` for finer control.
   */
  scripts?: (string | { src: string; module?: boolean; async?: boolean })[];

  /**
   * Additional stylesheets to inject into `<head>`.
   * Each entry is a URL string rendered as `<link rel="stylesheet" href="...">`.
   */
  stylesheets?: string[];

  /**
   * Additional raw HTML to append to `<head>`.
   * Useful for meta tags, inline styles, etc.
   */
  headHtml?: string;

  /**
   * Whether to inject the rikka-site SDK script tag.
   * When true, adds `<script type="module" src=".well-known/sdk/sdk.js">` to the page.
   * The SDK provides findResourceData(), createRouter(), etc.
   * @default true
   */
  sdk?: boolean;

  /**
   * Sitemap data to embed in the page for client-side routing.
   * When provided, a `<script type="application/json" data-sitemap>` tag
   * is added to the head, enabling the SDK's router to match paths.
   */
  sitemap?: SitemapEntry[];

  /**
   * Custom elements registered with the site. When non-empty, a module script
   * pointing to `/.well-known/assets/elements.js` is injected into `<head>`.
   */
  customElements?: CustomElementRegistryEntry[];

  /**
   * Static assets registered with the site. When a `favicon.ico` asset is
   * present, a `<link rel="icon" href="...">` tag is injected into `<head>`.
   */
  assets?: Record<string, SiteAsset>;

  /**
   * Content language fallback. If `repr.meta.lang` is set, it takes precedence.
   * When neither is set, the `<html lang="...">` attribute is omitted.
   */
  lang?: string;

  /**
   * Whether to inject a `<noscript>` fallback that shows the raw resource data
   * for clients without JavaScript. Defaults to `false`.
   */
  noscript?: boolean;

  /**
   * Custom `<meta name="...">` generator.
   * Receives path, data, and repr meta; returns a map of name → content.
   */
  meta?: (
    path: string,
    data: unknown,
    meta: ReprMeta,
  ) => Record<string, string>;

  /**
   * Open Graph tag generator.
   * - `true` infers basic OG tags from the page title and `meta()` output.
   * - A function returns a map of property → content for `<meta property="...">`.
   */
  openGraph?:
    | boolean
    | ((
        path: string,
        data: unknown,
        meta: ReprMeta,
      ) => Record<string, string>);
}

/**
 * Create an HTML transformer with optional configuration.
 *
 * Element resolution order:
 * 1. `resource.element` — resource-specific custom element (via ctx.element)
 * 2. `config.defaultElement` — fallback element
 * 3. `"rikka-resource"` — built-in default
 */
export function createHtmlTransformer(
  config?: HtmlTransformerConfig,
): Transformer {
  const defaultElement = config?.defaultElement ?? "rikka-resource";
  const strategy: HydrationStrategy = config?.hydration ?? "data-attr";
  const serialization: SerializationStrategy =
    config?.serialization ?? "data-attr";

  const layoutTag = config?.layoutElement;
  const titleConfig = config?.title;
  const scripts = config?.scripts ?? [];
  const stylesheets = config?.stylesheets ?? [];
  const headExtra = config?.headHtml;
  const sdkEnabled = config?.sdk !== false;
  const sitemap = config?.sitemap;
  const customElements = config?.customElements ?? [];
  const assets = config?.assets ?? {};
  const langFallback = config?.lang;
  const noscriptEnabled = config?.noscript === true;
  const metaFn = config?.meta;
  const openGraphFn = config?.openGraph;

  return {
    input: anySchema,
    output: { type: "raw", mime: "text/html" },
    priority: 10,
    transform(repr: Repr, ctx: TransformContext): Repr {
      const { path } = ctx;
      const data = repr.content;

      // Resolve custom element tag
      const tag =
        (ctx.element as string | undefined) ??
        defaultElement;

      // Resolve page title
      let pageTitle: string;
      if (typeof titleConfig === "function") {
        pageTitle = titleConfig(path, data);
      } else if (typeof titleConfig === "string") {
        pageTitle = titleConfig;
      } else {
        pageTitle = path;
      }

      // Build custom element attributes (base)
      const baseAttrs = `path="${escapeHtml(path)}"`;

      // Build body content based on hydration strategy
      const bodyContent = buildElementHtml(
        tag,
        baseAttrs,
        ctx,
        data,
        strategy,
        serialization,
      );

      // Wrap in layout element if configured
      let finalBodyContent = bodyContent;
      if (layoutTag) {
        const layoutAttrs = `data-path="${escapeHtml(path)}"`;
        finalBodyContent = `<${layoutTag} ${layoutAttrs}>\n  ${bodyContent}\n</${layoutTag}>`;
      }

      // Build <head> extras — for early-hint, add Link preload headers as <link> tags
      let extraHeadLinks = "";
      if (strategy === "early-hint") {
        extraHeadLinks = `\n  <link rel="preload" href="${escapeHtml(path)}?accept=json" as="fetch" crossorigin>`;
      }

      const scriptTags = scripts
        .map((s) => {
          if (typeof s === "string") {
            return `  <script src="${escapeHtml(s)}"><\/script>`;
          }
          const attrs: string[] = [`src="${escapeHtml(s.src)}"`];
          if (s.module) attrs.push('type="module"');
          if (s.async) attrs.push("async");
          return `  <script ${attrs.join(" ")}><\/script>`;
        })
        .join("\n");

      const stylesheetTags = stylesheets
        .map((s) => `  <link rel="stylesheet" href="${escapeHtml(s)}">`)
        .join("\n");

      // SDK script tag — path-independent relative URL
      const sdkTag = sdkEnabled
        ? `\n  <script type="module" src="${escapeHtml(relativeToRoot(path, ".well-known/sdk/sdk.js"))}"><\/script>`
        : "";

      // Custom element bundle script — only when elements are registered
      const elementsHref =
        customElements.length > 0
          ? relativeToRoot(path, ".well-known/assets/elements.js")
          : null;
      const elementsTag = elementsHref
        ? `\n  <script type="module" src="${escapeHtml(elementsHref)}"><\/script>`
        : "";

      // Favicon link — only when a favicon.ico asset is registered
      const faviconHref = assets["favicon.ico"]
        ? relativeToRoot(path, ".well-known/assets/favicon.ico")
        : null;
      const faviconTag = faviconHref
        ? `\n  <link rel="icon" href="${escapeHtml(faviconHref)}">`
        : "";

      // JSON-LD data tag
      const jsonldData = JSON.stringify(
        toJsonLd(ctx, data),
        null,
        2,
      );
      const jsonldTag =
        serialization === "jsonld" || serialization === "both"
          ? `\n  <script type="application/ld+json">${jsonldData}</script>`
          : "";

      // Sitemap data tag
      const sitemapTag = sitemap
        ? `\n  <script type="application/json" data-sitemap>${escapeHtml(JSON.stringify({ routes: sitemap }))}</script>`
        : "";

      // Language attribute — inferred from repr meta or config, omitted if absent
      const pageLang = repr.meta.lang ?? langFallback;
      const langAttr = pageLang ? ` lang="${escapeHtml(pageLang)}"` : "";

      // Dynamic <meta name="..."> tags
      const metaMap = metaFn ? metaFn(path, data, repr.meta) : {};
      const metaTags = Object.entries(metaMap)
        .map(
          ([name, content]) =>
            `\n  <meta name="${escapeHtml(name)}" content="${escapeHtml(content)}">`,
        )
        .join("");

      // Open Graph <meta property="..."> tags
      let ogMap: Record<string, string> = {};
      if (openGraphFn === true) {
        ogMap = { "og:title": pageTitle };
        if (metaMap.description) ogMap["og:description"] = metaMap.description;
      } else if (typeof openGraphFn === "function") {
        ogMap = openGraphFn(path, data, repr.meta);
      }
      const ogTags = Object.entries(ogMap)
        .map(
          ([property, content]) =>
            `\n  <meta property="${escapeHtml(property)}" content="${escapeHtml(content)}">`,
        )
        .join("");

      // Noscript fallback showing raw resource data
      const noscriptTag = noscriptEnabled
        ? `\n  <noscript>\n    <pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre>\n  </noscript>`
        : "";

      const html = `<!DOCTYPE html>
<html${langAttr}>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(pageTitle)}</title>${metaTags}${ogTags}${faviconTag}${extraHeadLinks}${stylesheetTags ? "\n" + stylesheetTags : ""}${sdkTag}${elementsTag}${scriptTags ? "\n" + scriptTags : ""}${jsonldTag}${sitemapTag}${headExtra ? "\n" + headExtra : ""}
</head>
<body>
  ${finalBodyContent}${noscriptTag}
</body>
</html>`;

      return { content: html, meta: { type: "text/html" } };
    },
  };
}

/**
 * Build the custom element HTML markup for a given hydration strategy.
 *
 * Strategies are mutually exclusive — each emits exactly one form of
 * embedded data (or none). For "jsonld", a `<script type="application/ld+json">`
 * is generated from the resource data using the shared `toJsonLd` helper.
 */
function buildElementHtml(
  tag: string,
  baseAttrs: string,
  ctx: TransformContext,
  data: unknown,
  strategy: HydrationStrategy,
  serialization: SerializationStrategy,
): string {
  switch (strategy) {
    case "none": {
      return `<${tag} ${baseAttrs}>\n</${tag}>`;
    }

    case "data-attr": {
      if (serialization === "jsonld") {
        return `<${tag} ${baseAttrs}>\n</${tag}>`;
      }
      const dataJson = JSON.stringify(data);
      const dataAttr = `data-resource="${escapeHtml(dataJson)}"`;
      return `<${tag} ${baseAttrs} ${dataAttr}>\n</${tag}>`;
    }

    case "dsdom": {
      const dataJson = JSON.stringify(data);
      return `<${tag} ${baseAttrs}>
  <template shadowrootmode="open">
    <script type="application/json">${escapeHtml(dataJson)}</script>
  </template>
</${tag}>`;
    }

    case "jsonld": {
      const jsonld = JSON.stringify(
        toJsonLd(ctx, data),
        null,
        2,
      );
      return `<${tag} ${baseAttrs}>
  <script type="application/ld+json">${jsonld}</script>
</${tag}>`;
    }

    case "early-hint": {
      const dataHref = `${ctx.path}?accept=json`;
      return `<${tag} ${baseAttrs} data-href="${escapeHtml(dataHref)}">\n</${tag}>`;
    }
  }
}

function relativeToRoot(path: string, target: string): string {
  const depth = path.split("/").filter(Boolean).length;
  const prefix = depth === 0 ? "./" : "../".repeat(depth);
  return prefix + target;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Built-in: Value(any) → Raw("text/html")
 * Default HTML transformer with no custom element configuration.
 */
export const htmlTransformer: Transformer = createHtmlTransformer();
