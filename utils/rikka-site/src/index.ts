/**
 * @module rikka-site
 * Resource-oriented server framework with content negotiation.
 *
 * Core concepts:
 * - **Kind** — HTTP semantic constraint (Collection, Item, Singleton, ReadOnly, Action, Proxy)
 * - **Repr** — A Resource's Representation: `{ content, meta }`. Returned by methods.
 * - **Schema** — Describes the shape of structured data
 * - **ResourceFactory** — A function from config to constructor (Kind factory)
 * - **Resource** — Resolved from a URL path; has methods (list, content, create, ...)
 * - **Transformer** — Converts structured values into raw bytes (JSON, HTML, CSV, ...)
 * - **RequestContext** — Unified request context (params, query, body, range, identity)
 * - **Auth** — Declarative authentication via auth resources and rules
 *
 * @example
 * ```ts
 * import { Collection, Site } from "@takanashi/rikka-site";
 *
 * const Articles = Collection(() => ({
 *   list: (ctx) => ({ content: [...articles], meta: {} }),
 *   create: (ctx) => {
 *     const article = { id: nextId++, ...ctx.body };
 *     articles.push(article);
 *     return { content: article, meta: { location: `./${article.id}` } };
 *   },
 * }));
 *
 * const app = new Site({ articles: Articles() });
 * ```
 */

// Schema
export { isSchema, schemaMatches, anySchema } from "./schema.js";
export type {
  Schema,
  SchemaAny,
  SchemaNull,
  SchemaBoolean,
  SchemaNumber,
  SchemaString,
  SchemaArray,
  SchemaObject,
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
export { getHeader } from "./context.js";
export type { RequestContext, Identity, RangeSpec, Range } from "./context.js";

// Auth
export { globMatch, matchAuthRule, corsHeaders } from "./auth.js";
export type { AuthConfig, AuthRule, CorsConfig } from "./auth.js";

// Kind system
export {
  KindMethods,
  KindOperations,
  kindAllowsMethod,
  kindAllowsOperation,
} from "./kind.js";
export type { Kind } from "./kind.js";

// Resource types and classes
export {
  Collection,
  Item,
  Singleton,
  ReadOnly,
  Action,
  Proxy,
  Static,
  resolveResource,
  tryResolveTrailingSlash,
  getDescriptorSchema,
  Resource,
  CollectionResource,
  ItemResource,
  SingletonResource,
  ReadOnlyResource,
  ActionResource,
  ProxyResource,
  StaticResource,
} from "./resource.js";
export type {
  ChildResolver,
  ChildrenMap,
  CustomElementConstructor,
  Handler,
  ProxyTarget,
  ResourceFactory,
  ResourceConstructor,
  StaticResolver,
} from "./resource.js";

// Site definition
export { Site } from "./site.js";
export type { SiteNode, SiteDefinition, SiteOptions, SiteAsset } from "./site.js";

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
  htmlTransformer,
} from "./transform.js";
export type {
  Transformer,
  TransformContext,
  TransformResult,
  HtmlTransformerConfig,
  HydrationStrategy,
  SerializationStrategy,
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
