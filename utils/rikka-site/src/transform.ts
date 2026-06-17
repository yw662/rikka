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
 *   output: "text/csv",
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

import type { Schema } from "./schema.js";
import { isSchema, schemaMatches, anySchema } from "./schema.js";
import type { Resource } from "./resource.js";
import type { Repr } from "./representation.js";
import { isBytes } from "./representation.js";
import type { SitemapEntry } from "./sitemap.js";

// ---------------------------------------------------------------------------
// TransformContext
// ---------------------------------------------------------------------------

/**
 * Context provided to transformer functions.
 */
export interface TransformContext {
  /** The resource being transformed */
  resource: Resource;
}

// ---------------------------------------------------------------------------
// Transformer — unified interface
// ---------------------------------------------------------------------------

/**
 * A transformer converts one Repr into another.
 *
 * - `input` is a Schema (matches structured/value content) or a MIME string (matches raw content)
 * - `output` is a Schema (produces structured/value content) or a MIME string (produces raw content)
 * - `transform` receives a Repr and context, returns a new Repr
 */
export interface Transformer {
  /** Input specification: Schema for value, MIME string for raw */
  input: Schema | string;
  /** Output specification: Schema for value, MIME string for raw */
  output: Schema | string;
  /** Priority for negotiation (higher = preferred, default 0) */
  priority?: number;
  /** Transform a Repr into another Repr */
  transform(
    repr: Repr,
    ctx: TransformContext,
  ): Repr | Promise<Repr>;
}

// ---------------------------------------------------------------------------
// Transformer registry
// ---------------------------------------------------------------------------

interface TransformerEntry {
  transformer: Transformer;
  input: Schema | string;
  output: Schema | string;
  priority: number;
}

/**
 * Check if a Repr's content is raw (pre-serialized bytes).
 */
function isRawRepr(repr: Repr): boolean {
  return isBytes(repr.content);
}

/**
 * Get the MIME type of a Repr's content.
 * For raw content, uses meta.type. For value content, returns undefined.
 */
function reprMimeType(repr: Repr): string | undefined {
  if (isRawRepr(repr)) return repr.meta.type;
  return undefined;
}

/**
 * Convert a raw Repr's content to string.
 */
function rawContentToString(content: string | Uint8Array): string {
  if (typeof content === "string") return content;
  return new TextDecoder().decode(content);
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
      .filter((e) => !isSchema(e.output) && (e.output as string).toLowerCase().trim() === norm)
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
      .filter((e) => isSchema(e.input) && schemaMatches(schema, e.input as Schema))
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
        if (isSchema(e.input)) return false;
        return matchesMIME(e.input as string, norm);
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
        if (!isSchema(e.input)) return false;
        if (isSchema(e.output)) return false;
        return (
          schemaMatches(schema, e.input as Schema) &&
          (e.output as string).toLowerCase().trim() === norm
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
        if (isSchema(e.input) || isSchema(e.output)) return false;
        return (
          matchesMIME(e.input as string, inputNorm) &&
          (e.output as string).toLowerCase().trim() === targetNorm
        );
      })
      .sort((a, b) => b.priority - a.priority);
    return matches[0]?.transformer ?? null;
  }

  /** Get all registered output MIME types (from transformers that produce raw). */
  registeredOutputTypes(): string[] {
    return this.entries
      .filter((e) => !isSchema(e.output))
      .map((e) => e.output as string);
  }

  /** Check if a transformer exists that can produce the target type. */
  canProduce(targetType: string): boolean {
    const norm = targetType.toLowerCase().trim();
    return this.entries.some((e) => {
      if (isSchema(e.output)) return false;
      return (e.output as string).toLowerCase().trim() === norm;
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
    repr: Repr,
    targetContentType: string,
  ): Promise<TransformResult> {
    const targetNorm = targetContentType.toLowerCase().trim();
    const ctx: TransformContext = { resource };
    const schema = resource.schema ?? anySchema;

    // Step 1: If value content, apply Value→Value transformers
    if (!isRawRepr(repr)) {
      const valueToValue = this.entries
        .filter((e) => isSchema(e.input) && isSchema(e.output))
        .filter((e) => schemaMatches(schema, e.input as Schema))
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
        return { body: rawContentToString(repr.content as string | Uint8Array), contentType: repr.meta.type! };
      }
    }

    // Step 3: If value content, try direct Value→Raw(target)
    if (!isRawRepr(repr)) {
      const direct = this.findValueToRawTransformer(schema, targetNorm);
      if (direct) {
        const result = await direct.transform(repr, ctx);
        if (isRawRepr(result)) {
          return { body: rawContentToString(result.content as string | Uint8Array), contentType: result.meta.type! };
        }
        // Transformer returned value instead of raw — stringify as JSON
        return {
          body: JSON.stringify(result.content, null, 2),
          contentType: targetNorm,
        };
      }

      // Step 4: Try Value→Raw(intermediate)→Raw→Raw(target) chain
      const valueToRawEntries = this.entries
        .filter((e) => isSchema(e.input) && !isSchema(e.output))
        .filter((e) => schemaMatches(schema, e.input as Schema))
        .sort((a, b) => b.priority - a.priority);

      for (const v2rEntry of valueToRawEntries) {
        const intermediateMime = (v2rEntry.output as string).toLowerCase().trim();
        const r2rTransformer = this.findRawToRawTransformer(intermediateMime, targetNorm);
        if (r2rTransformer) {
          const intermediate = await v2rEntry.transformer.transform(repr, ctx);
          if (isRawRepr(intermediate)) {
            const final = await r2rTransformer.transform(intermediate, ctx);
            if (isRawRepr(final)) {
              return { body: rawContentToString(final.content as string | Uint8Array), contentType: final.meta.type! };
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
          return { body: rawContentToString(result.content as string | Uint8Array), contentType: result.meta.type! };
        }
      }
      // No transformer — return as-is
      return { body: rawContentToString(repr.content as string | Uint8Array), contentType: repr.meta.type ?? "application/octet-stream" };
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
    repr: Repr,
    contentType: string,
  ): Promise<TransformResult> {
    return this.transformPipeline(resource, repr, contentType);
  }

  /** Convenience: transform raw data into a target content type. */
  async transformData(
    resource: Resource,
    data: unknown,
    targetContentType: string,
  ): Promise<TransformResult> {
    const repr: Repr = { content: data, meta: {} };
    return this.transformPipeline(resource, repr, targetContentType);
  }
}

// ---------------------------------------------------------------------------
// Transformation pipeline result
// ---------------------------------------------------------------------------

/**
 * Result of the transformation pipeline.
 */
export interface TransformResult {
  body: string;
  contentType: string;
}

// ---------------------------------------------------------------------------
// MIME matching helper
// ---------------------------------------------------------------------------

/**
 * Check if a MIME type pattern matches a concrete MIME type.
 */
function matchesMIME(pattern: string, concrete: string): boolean {
  if (pattern === concrete) return true;
  if (pattern.endsWith("/*")) {
    const prefix = pattern.slice(0, -2);
    return concrete.startsWith(prefix + "/");
  }
  return false;
}

// ---------------------------------------------------------------------------
// Built-in transformers
// ---------------------------------------------------------------------------

/**
 * JSON-LD helper — shared by jsonldTransformer and htmlTransformer.
 */
function toJsonLd(resource: Resource, data: unknown): Record<string, unknown> {
  const { path } = resource;
  const context = resource.context ?? "https://rikka.dev/context";
  const type = resource.jsonldType ?? resource.kind;

  if (Array.isArray(data)) {
    return { "@context": context, "@id": path, "@type": type, "@graph": data };
  }

  if (typeof data === "object" && data !== null) {
    return {
      "@context": context,
      "@id": path,
      "@type": type,
      ...(data as Record<string, unknown>),
    };
  }

  return { "@context": context, "@id": path, "@type": type, value: data };
}

/**
 * Built-in: Value(any) → Raw("application/json")
 */
export const jsonTransformer: Transformer = {
  input: anySchema,
  output: "application/json",
  priority: 0,
  transform(repr: Repr): Repr {
    return { content: JSON.stringify(repr.content, null, 2), meta: { type: "application/json" } };
  },
};

/**
 * Built-in: Value(any) → Raw("application/ld+json")
 */
export const jsonldTransformer: Transformer = {
  input: anySchema,
  output: "application/ld+json",
  priority: 0,
  transform(repr: Repr, ctx: TransformContext): Repr {
    return {
      content: JSON.stringify(toJsonLd(ctx.resource, repr.content), null, 2),
      meta: { type: "application/ld+json" },
    };
  },
};

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
export type HydrationStrategy = "none" | "data-attr" | "dsdom" | "jsonld" | "early-hint";

/**
 * Serialization strategy for embedding resource data in server-rendered HTML.
 */
export type SerializationStrategy = "data-attr" | "jsonld" | "both";

/**
 * Configuration for the HTML transformer.
 */
export interface HtmlTransformerConfig {
  /**
   * Map from resource kind to custom element tag name.
   * If a resource has no `element` field, this map is consulted.
   *
   * @example { Collection: "blog-article-list", Item: "blog-article" }
   */
  elementMap?: Partial<Record<string, string>>;

  /**
   * Default custom element tag name when no resource-specific or kind-specific
   * element is found. Defaults to "rikka-resource".
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
   * Receives the resource's path, kind, and data; returns a title string.
   * Defaults to `"Kind: /path"`.
   */
  title?: string | ((path: string, kind: string, data: unknown) => string);

  /**
   * Layout wrapper element tag name.
   * When set, the body content is wrapped inside this element,
   * which typically provides shared chrome (header, nav, footer).
   *
   * The layout element receives attributes: `data-path`, `data-kind`.
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
   * When true, adds `<script type="module" src="/_rikka/sdk.js">` to the page.
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
}

/**
 * Create an HTML transformer with optional configuration.
 *
 * Element resolution order:
 * 1. `resource.element` — resource-specific custom element
 * 2. `config.elementMap[resource.kind]` — kind-specific element
 * 3. `config.defaultElement` — fallback element
 * 4. `"rikka-resource"` — built-in default
 */
export function createHtmlTransformer(config?: HtmlTransformerConfig): Transformer {
  const elementMap = config?.elementMap ?? {};
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

  return {
    input: anySchema,
    output: "text/html",
    priority: 10,
    transform(repr: Repr, ctx: TransformContext): Repr {
      const { path } = ctx.resource;
      const kind = ctx.resource.kind;
      const data = repr.content;

      // Resolve custom element tag
      const tag =
        (ctx.resource.element as string | undefined) ??
        elementMap[kind] ??
        defaultElement;

      // Resolve page title
      let pageTitle: string;
      if (typeof titleConfig === "function") {
        pageTitle = titleConfig(path, kind, data);
      } else if (typeof titleConfig === "string") {
        pageTitle = titleConfig;
      } else {
        pageTitle = `${kind}: ${path}`;
      }

      // Build custom element attributes (base)
      const baseAttrs = `path="${escapeHtml(path)}" kind="${escapeHtml(kind)}"`;

      // Build body content based on hydration strategy
      const bodyContent = buildElementHtml(
        tag,
        baseAttrs,
        path,
        data,
        strategy,
        ctx.resource,
        serialization,
      );

      // Wrap in layout element if configured
      let finalBodyContent = bodyContent;
      if (layoutTag) {
        const layoutAttrs = `data-path="${escapeHtml(path)}" data-kind="${escapeHtml(kind)}"`;
        finalBodyContent = `<${layoutTag} ${layoutAttrs}>\n  ${bodyContent}\n</${layoutTag}>`;
      }

      // Build <head> extras — for early-hint, add Link preload headers as <link> tags
      let extraHeadLinks = "";
      if (strategy === "early-hint") {
        extraHeadLinks = `\n  <link rel="preload" href="${escapeHtml(path)}?accept=json" as="fetch" crossorigin>`;
      }

      const scriptTags = scripts.map((s) => {
        if (typeof s === "string") {
          return `  <script src="${escapeHtml(s)}"><\/script>`;
        }
        const attrs: string[] = [`src="${escapeHtml(s.src)}"`];
        if (s.module) attrs.push("type=\"module\"");
        if (s.async) attrs.push("async");
        return `  <script ${attrs.join(" ")}><\/script>`;
      }).join("\n");

      const stylesheetTags = stylesheets.map((s) =>
        `  <link rel="stylesheet" href="${escapeHtml(s)}">`,
      ).join("\n");

      // SDK script tag
      const sdkTag = sdkEnabled
        ? '\n  <script type="module" src="/_rikka/sdk.js"><\/script>'
        : "";

      // JSON-LD data tag
      const jsonldData = JSON.stringify(toJsonLd(ctx.resource, data), null, 2);
      const jsonldTag =
        serialization === "jsonld" || serialization === "both"
          ? `\n  <script type="application/ld+json">${jsonldData}</script>`
          : "";

      // Sitemap data tag
      const sitemapTag = sitemap
        ? `\n  <script type="application/json" data-sitemap>${escapeHtml(JSON.stringify({ routes: sitemap }))}</script>`
        : "";

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(pageTitle)}</title>${extraHeadLinks}${stylesheetTags ? "\n" + stylesheetTags : ""}${sdkTag}${scriptTags ? "\n" + scriptTags : ""}${jsonldTag}${sitemapTag}${headExtra ? "\n" + headExtra : ""}
</head>
<body>
  ${finalBodyContent}
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
  path: string,
  data: unknown,
  strategy: HydrationStrategy,
  resource: Resource,
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
      const jsonld = JSON.stringify(toJsonLd(resource, data), null, 2);
      return `<${tag} ${baseAttrs}>
  <script type="application/ld+json">${jsonld}</script>
</${tag}>`;
    }

    case "early-hint": {
      const dataHref = `${path}?accept=json`;
      return `<${tag} ${baseAttrs} data-href="${escapeHtml(dataHref)}">\n</${tag}>`;
    }
  }
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
