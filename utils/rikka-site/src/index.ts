/**
 * @module rikka-site
 * Resource-oriented server framework with content negotiation.
 *
 * Core concepts:
 * - **Kind** — HTTP semantic constraint (Collection, Item, Singleton, ReadOnly, Action, Proxy)
 * - **Repr** — A Resource's Representation: `{ content, meta }`. Returned by methods.
 * - **Schema** — Describes the shape of structured data
 * - **ResourceKind** — Abstract base class for all resources; instances are mounted in the site tree
 * - **Transformer** — Converts structured values into raw bytes (JSON, HTML, CSV, ...)
 * - **RequestContext** — Unified request context (params, query, body, range, identity)
 * - **Auth** — Declarative authentication via auth resources and rules
 *
 * @example
 * ```ts
 * import { CollectionKind, Site } from "@takanashi/rikka-site";
 *
 * class Articles extends CollectionKind {
 *   async list(ctx) { return { content: [...articles], meta: {} }; }
 *   async create(ctx) {
 *     const article = { id: nextId++, ...(await ctx.json()) };
 *     articles.push(article);
 *     return { content: article, meta: { location: `./${article.id}` } };
 *   }
 * }
 *
 * const app = new Site({ articles: new Articles() });
 * ```
 */

// Schema
export {
  isRawSchema,
  isValueSchema,
  schemaMatches,
  anySchema,
  matchesMIME,
} from "./schema.js";
export type {
  Schema,
  SchemaAny,
  SchemaNull,
  SchemaBoolean,
  SchemaNumber,
  SchemaString,
  SchemaArray,
  SchemaObject,
  SchemaRaw,
} from "./schema.js";

// Repr
export {
  isRepr,
  isPartial,
  isBytes,
  isHttpError,
  HttpError,
} from "./representation.js";
export type { Repr, ReprMeta, PartialContent } from "./representation.js";

// Context
export {
  getHeader,
  createRequestContext,
  jsonBody,
  textBody,
  bytesBody,
} from "./context.js";
export type {
  RequestContext,
  RequestContextInit,
  Identity,
  RangeSpec,
  Range,
} from "./context.js";

// Auth
export { globMatch, matchAuthRule, corsHeaders } from "./auth.js";
export type { AuthConfig, AuthRule, CorsConfig } from "./auth.js";

// Resource types and classes
export {
  ResourceKind,
  Resource,
  CollectionResource,
  ItemResource,
  SingletonResource,
  ReadOnlyResource,
  ActionResource,
  ProxyResource,
  CollectionKind,
  ItemKind,
  SingletonKind,
  ReadOnlyKind,
  ActionKind,
  ProxyKind,
  StaticKind,
  isResourceKind,
  resolveResource,
  tryResolveTrailingSlash,
  getDescriptorSchema,
} from "./resource.js";
export type {
  ChildResolver,
  ChildrenMap,
  CustomElementConstructor,
  StaticResolver,
} from "./resource.js";

// Site definition
export { Site } from "./site.js";
export type {
  SiteNode,
  SiteDefinition,
  SiteOptions,
  SiteAsset,
} from "./site.js";

// Sitemap generation
export { generateSitemap } from "./sitemap.js";
export type { SitemapEntry } from "./sitemap.js";

// Content negotiation
export { negotiate } from "./negotiate.js";
export type { NegotiationResult } from "./negotiate.js";

// Transformers
export {
  TransformerRegistry,
  createHtmlTransformer,
  jsonTransformer,
  jsonldTransformer,
  csvTransformer,
  textTransformer,
  cborTransformer,
  protobuf,
  htmlTransformer,
} from "./transform.js";
export type {
  Transformer,
  TransformContext,
  TransformResult,
  HtmlTransformerConfig,
  HydrationStrategy,
  SerializationStrategy,
  ProtobufMessage,
} from "./transform.js";

// HTTP adapter
export { parseRangeHeader, buildLocationHeader } from "./server.js";
export type { HttpRequest, HttpResponse } from "./server.js";

// Edge runtime adapters
export {
  handleWebRequest,
  createFetchHandler,
  createCloudflareWorkerHandler,
  createCloudflarePagesHandler,
  createDenoDeployHandler,
} from "./edge.js";
export type { CloudflareEnv, CloudflareContext } from "./edge.js";

// Pagination
export { paginate } from "./pagination.js";
export type { PaginatedContent } from "./pagination.js";

// Note: the Node.js adapter is intentionally NOT re-exported from here.
// It lives in a separate `./node.js` entry point so non-Node bundlers
// (Cloudflare Workers, Deno Deploy) can skip pulling in `node:http`.
// Import it via `@takanashi/rikka-site/node` in Node-only code paths.
