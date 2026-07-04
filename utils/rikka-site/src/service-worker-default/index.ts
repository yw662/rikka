/// <reference lib="webworker" />
/**
 * Default rikka-site Service Worker entry.
 *
 * Bundled by esbuild into the script served at `/.well-known/service-worker.js`.
 * Config and version are injected at build time via esbuild `define`:
 *   - __RIKKA_SW_CONFIG__  — serialized ServiceWorkerConfig (RegExp values
 *     preserved via { __rikka_regex__, __rikka_flags__ } tagged objects)
 *   - __RIKKA_SW_VERSION__ — cache-busting string
 *
 * The bundle contains no rikka-site code — only standard SW APIs.
 */

declare const __RIKKA_SW_CONFIG__: ServiceWorkerConfig;
declare const __RIKKA_SW_VERSION__: string;

interface ServiceWorkerConfig {
  appId?: string;
  precache?: string[];
  routes?: RouteCacheRule[];
  exclude?: (string | RegExp)[];
}

interface RouteCacheRule {
  match: string | RegExp;
  strategy:
    | "cache-first"
    | "network-first"
    | "stale-while-revalidate"
    | "network-only";
  cacheName?: string;
}

const CONFIG = __RIKKA_SW_CONFIG__;
const VERSION = __RIKKA_SW_VERSION__;
const PREFIX = `rikka-sw-${CONFIG.appId || "default"}-`;
const sw = self as unknown as ServiceWorkerGlobalScope;

function reviveRegex(v: unknown): RegExp | unknown {
  if (
    v &&
    typeof v === "object" &&
    (v as { __rikka_regex__?: string }).__rikka_regex__
  ) {
    const tag = v as { __rikka_regex__: string; __rikka_flags__?: string };
    return new RegExp(tag.__rikka_regex__, tag.__rikka_flags__ || "");
  }
  return v;
}

function matchPattern(pattern: string | RegExp, url: URL): boolean {
  if (typeof pattern === "string") return url.pathname.startsWith(pattern);
  const re =
    pattern instanceof RegExp ? pattern : (reviveRegex(pattern) as RegExp);
  return re instanceof RegExp ? re.test(url.href) : false;
}

sw.addEventListener("install", (event: ExtendableEvent) => {
  const precache = CONFIG.precache || [];
  const doCache =
    precache.length > 0
      ? caches
          .open(PREFIX + "precache-" + VERSION)
          .then((c) => c.addAll(precache))
      : Promise.resolve();
  event.waitUntil(doCache.then(() => sw.skipWaiting()));
});

sw.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith(PREFIX) && !k.endsWith(VERSION))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => sw.clients.claim()),
  );
});

async function cacheFirst(req: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res && res.ok) cache.put(req, res.clone());
  return res;
}

async function networkFirst(
  req: Request,
  cacheName: string,
): Promise<Response> {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    const cached = await cache.match(req);
    if (cached) return cached;
    throw e;
  }
}

async function staleWhileRevalidate(
  req: Request,
  cacheName: string,
): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const network = fetch(req)
    .then((res) => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch((err) => {
      if (cached) return cached;
      throw err;
    });
  return cached || network;
}

interface WellKnownMatch {
  canonical: boolean;
  relative: string;
}

function parseWellKnown(
  pathname: string,
  rootPath: string,
): WellKnownMatch | null {
  if (!pathname.startsWith(rootPath)) return null;
  const rest = pathname.slice(rootPath.length);
  const marker = ".well-known/";
  const idx = rest.indexOf(marker);
  if (idx === -1) return null;
  const relative = rest.slice(idx + marker.length);
  return { canonical: idx === 0, relative };
}

function handleWellKnown(event: FetchEvent, req: Request, url: URL): boolean {
  const rootPath = new URL(sw.registration.scope).pathname;
  const wk = parseWellKnown(url.pathname, rootPath);
  if (!wk) return false;

  if (!wk.canonical) {
    const canonical = new URL(
      ".well-known/" + wk.relative,
      sw.registration.scope,
    );
    event.respondWith(fetch(new Request(canonical.href, req)));
    return true;
  }

  if (wk.relative === "service-worker.js") return true;

  if (wk.relative === "sdk/sdk.js" || wk.relative === "assets/elements.js") {
    event.respondWith(staleWhileRevalidate(req, PREFIX + "wellknown"));
    return true;
  }

  if (wk.relative.startsWith("assets/")) {
    event.respondWith(staleWhileRevalidate(req, PREFIX + "wellknown"));
    return true;
  }

  return false;
}

sw.addEventListener("fetch", (event: FetchEvent) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if ((CONFIG.exclude || []).some((p) => matchPattern(p, url))) return;

  if (handleWellKnown(event, req, url)) return;

  const rule = (CONFIG.routes || []).find((r) => matchPattern(r.match, url));
  if (!rule) return;
  if (rule.strategy === "network-only") return;

  const cacheName = PREFIX + (rule.cacheName || "default");
  if (rule.strategy === "cache-first") {
    event.respondWith(cacheFirst(req, cacheName));
  } else if (rule.strategy === "network-first") {
    event.respondWith(networkFirst(req, cacheName));
  } else if (rule.strategy === "stale-while-revalidate") {
    event.respondWith(staleWhileRevalidate(req, cacheName));
  }
});
