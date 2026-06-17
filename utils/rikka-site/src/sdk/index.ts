/**
 * @takanashi/rikka-site SDK — auto-injected client-side runtime.
 *
 * Exposed as `window.__rikka` for convenience, or importable from
 * `/.well-known/sdk/sdk.js` as an ES module.
 */

import { findResourceData, findResourceDataAsync } from "./hydration.js";
import {
  createRouter,
  matchRoute,
  navigate,
  readSitemapFromDom,
} from "./router.js";
import {
  apiRequest,
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
  ApiError,
} from "./api.js";

export { findResourceData, findResourceDataAsync } from "./hydration.js";
export {
  createRouter,
  matchRoute,
  navigate,
  readSitemapFromDom,
  type Router,
  type RouteEntry,
  type RouteMatch,
  type Sitemap,
  type NavigateOptions,
} from "./router.js";
export {
  apiRequest,
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
  ApiError,
  type ApiRequestInit,
} from "./api.js";

/**
 * Shape of `window.__rikka`. Useful for type-safe access from custom element
 * bundles that consume the injected SDK.
 */
export interface RikkaSdk {
  findResourceData: typeof findResourceData;
  findResourceDataAsync: typeof findResourceDataAsync;
  createRouter: typeof createRouter;
  matchRoute: typeof matchRoute;
  navigate: typeof navigate;
  readSitemapFromDom: typeof readSitemapFromDom;
  apiRequest: typeof apiRequest;
  apiGet: typeof apiGet;
  apiPost: typeof apiPost;
  apiPut: typeof apiPut;
  apiPatch: typeof apiPatch;
  apiDelete: typeof apiDelete;
  ApiError: typeof ApiError;
}

// Auto-expose on window
if (typeof window !== "undefined") {
  (window as any).__rikka = {
    findResourceData,
    findResourceDataAsync,
    createRouter,
    matchRoute,
    navigate,
    readSitemapFromDom,
    apiRequest,
    apiGet,
    apiPost,
    apiPut,
    apiPatch,
    apiDelete,
    ApiError,
  };
}
