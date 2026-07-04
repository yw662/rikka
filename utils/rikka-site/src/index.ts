/**
 * @module rikka-site
 * Resource-oriented server framework with content negotiation.
 *
 * Core concepts:
 * - **ResourceKind** — Abstract base class for resource templates (config +
 *   factory). Kinds are mounted in the site tree and create per-request
 *   Resources via `resolve(params, path)`.
 * - **Resource** — Abstract base class for per-request resource instances.
 *   Carries `params` and `path` alongside handler methods (get, post, ...).
 * - **Repr** — A Resource's Representation: `{ content, meta }`. Returned by methods.
 * - **Schema** — Describes the shape of structured data
 * - **Transformer** — Converts structured values into raw bytes (JSON, HTML, CSV, ...)
 * - **RequestContext** — Unified request context (params, query, body, range, identity)
 * - **Auth** — Declarative authentication via auth resources and rules
 *
 * @example
 * ```ts
 * import { CollectionKind, CollectionResource, Site } from "@takanashi/rikka-site";
 *
 * class ArticlesKind extends CollectionKind {
 *   resolve(params, path) { return new ArticlesResource(params, path as string); }
 * }
 *
 * class ArticlesResource extends CollectionResource {
 *   async list(ctx) { return { content: [...articles], meta: {} }; }
 *   async create(ctx) {
 *     const article = { id: nextId++, ...(await ctx.json()) };
 *     articles.push(article);
 *     return { content: article, meta: { location: `./${article.id}` } };
 *   }
 * }
 *
 * const app = new Site({ articles: new ArticlesKind() });
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
  Repr,
  isRepr,
  isPartial,
  isBytes,
  isHttpError,
  HttpError,
  guessMimeType,
  isTextMime,
} from "./representation.js";
export type { ReprMeta, PartialContent } from "./representation.js";

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
export type {
  AuthConfig,
  AuthRule,
  AuthMatchResult,
  CorsConfig,
} from "./auth.js";

// Resource types and classes
export {
  ResourceKind,
  Resource,
  CollectionKind,
  CollectionResource,
  ItemKind,
  ItemResource,
  SingletonKind,
  SingletonResource,
  ReadOnlyKind,
  ReadOnlyResource,
  ActionKind,
  ActionResource,
  isResourceKind,
  isResource,
  resolveResource,
  getDescriptorSchema,
} from "./resource.js";
export type {
  ChildResolver,
  ChildrenMap,
  CustomElementConstructor,
  StaticResolver,
  Query,
  JsonQuery,
  GraphqlQuery,
  DaslQuery,
  UrlEncodedQuery,
} from "./resource.js";

// Events (SSE streaming)
export {
  EventsKind,
  EventsResource,
  createInMemoryEventSource,
  formatSseEvent,
} from "./events.js";
export type { EventSource, SseEvent, EventsKindOptions } from "./events.js";

// Site definition
export { Site } from "./site.js";
export type {
  SiteNode,
  SiteDefinition,
  SiteOptions,
  SiteAsset,
  HandleRequestOptions,
  ListenOptions,
  ListeningServer,
  NodeRequest,
  NodeResponse,
} from "./site.js";

// Service Worker generation and bundling
export {
  bundleServiceWorker,
  generateDefaultServiceWorker,
  invalidateServiceWorkerBundleCache,
} from "./service-worker.js";
export type {
  ServiceWorkerOptions,
  ServiceWorkerConfig,
  RouteCacheRule,
} from "./service-worker.js";

// Sitemap generation
export { generateSitemap } from "./sitemap.js";
export type { SitemapEntry } from "./sitemap.js";

// Content negotiation
export {
  negotiate,
  negotiateLanguage,
  parseQualityList,
  selectBest,
  isTypeAccepted,
} from "./negotiate.js";
export type { AcceptItem } from "./negotiate.js";

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
  directoryListingHtmlTransformer,
  webdavMultistatusTransformer,
  webdavLockTransformer,
  escapeHtml,
  escapeXml,
  formatSize,
} from "./transform.js";
export type {
  Transformer,
  TransformContext,
  TransformResult,
  HtmlTransformerConfig,
  HydrationStrategy,
  SerializationStrategy,
  ProtobufMessage,
  DirectoryListingData,
  WebdavMultistatusData,
  WebdavLockData,
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

// Node.js adapter: Site.listen() uses dynamic `import("node:http")` so
// bundlers for edge runtimes (Cloudflare Workers, Deno Deploy) never pull
// in `node:http`. The adapter types (ListenOptions, ListeningServer,
// NodeRequest, NodeResponse) are exported above for type-safe usage.
