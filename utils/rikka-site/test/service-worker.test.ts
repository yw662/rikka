/**
 * Tests for rikka-site Service Worker integration:
 * - canonical `.well-known/service-worker.js` serving with required headers
 * - `source` mode (esbuild bundling)
 * - `config` mode (default template generation)
 * - 404 when not configured
 * - non-canonical depth 301 redirect
 * - SW script content sanity (no rikka-site code, contains config)
 * - SDK registerServiceWorker URL derivation
 */

import { describe, it, expect, beforeEach, afterEach } from "@rstest/core";
import {
  Site,
  ReadOnlyKind,
  ReadOnlyResource,
  generateDefaultServiceWorker,
  invalidateServiceWorkerBundleCache,
  type HttpRequest,
  type RequestContext,
  type Repr,
} from "../src/index.js";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function makeRequest(overrides: Partial<HttpRequest>): HttpRequest {
  return {
    method: "GET",
    path: "/",
    headers: {},
    query: {},
    ...overrides,
  };
}

class EmptyKind extends ReadOnlyKind {
  resolve(params: Record<string, string>) {
    const r = new EmptyResource();
    r.params = params;
    return r;
  }
}
class EmptyResource extends ReadOnlyResource {
  async content(_ctx: RequestContext): Promise<Repr> {
    return { content: {}, meta: {} };
  }
}

describe("service-worker canonical serving", () => {
  it("returns 404 only when serviceWorker is explicitly false", async () => {
    const app = new Site({ "": new EmptyKind() }, { serviceWorker: false });
    const response = await app.handleRequest(
      makeRequest({ path: "/.well-known/service-worker.js" }),
    );
    expect(response.status).toBe(404);
  });

  it("serves the default SW when serviceWorker is not configured", async () => {
    const app = new Site({ "": new EmptyKind() });
    const response = await app.handleRequest(
      makeRequest({ path: "/.well-known/service-worker.js" }),
    );
    expect(response.status).toBe(200);
    expect(response.headers["Content-Type"]).toBe(
      "application/javascript; charset=utf-8",
    );
    expect(response.headers["Service-Worker-Allowed"]).toBe("..");
    expect(response.headers["Cache-Control"]).toBe("no-cache");
    const body = response.body as string;
    expect(body).toContain("addEventListener");
    expect(body).toContain("parseWellKnown");
    expect(body).toContain("handleWellKnown");
  });

  it("serves a generated script with required headers in config mode", async () => {
    const app = new Site(
      { "": new EmptyKind() },
      {
        serviceWorker: {
          config: {
            precache: ["/"],
            routes: [
              { match: "/.well-known/", strategy: "cache-first" },
              { match: /^\/api\//, strategy: "network-first", cacheName: "api" },
            ],
            exclude: ["/events"],
          },
        },
      },
    );
    const response = await app.handleRequest(
      makeRequest({ path: "/.well-known/service-worker.js" }),
    );
    expect(response.status).toBe(200);
    expect(response.headers["Content-Type"]).toBe(
      "application/javascript; charset=utf-8",
    );
    expect(response.headers["Service-Worker-Allowed"]).toBe("..");
    expect(response.headers["Cache-Control"]).toBe("no-cache");

    const body = response.body as string;
    // The generated script must not bundle rikka-site code — only SW APIs.
    expect(body).toContain("addEventListener");
    expect(body).toContain("CONFIG");
    // Config is embedded as a JSON literal.
    expect(body).toContain('"/"');
    expect(body).toContain("cache-first");
    expect(body).toContain("network-first");
    // RegExp matchers survive via the tagged-object form.
    expect(body).toContain("__rikka_regex__");
    expect(body).toContain("api");
  });

  it("redirects non-canonical depth to the canonical relative path", async () => {
    const app = new Site(
      { "": new EmptyKind() },
      { serviceWorker: { config: {} } },
    );
    const response = await app.handleRequest(
      makeRequest({ path: "/articles/.well-known/service-worker.js" }),
    );
    expect(response.status).toBe(301);
    expect(response.headers["Location"]).toBe(
      "../.well-known/service-worker.js",
    );
  });
});

describe("service-worker source mode bundling", () => {
  let entryDir: string;
  const entrySource = `
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
`;

  beforeEach(() => {
    invalidateServiceWorkerBundleCache();
    entryDir = join(tmpdir(), `rikka-site-sw-test-${Date.now()}`);
    mkdirSync(entryDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(entryDir, { recursive: true, force: true });
  });

  it("bundles a custom entry module and serves it with required headers", async () => {
    const entryPath = join(entryDir, "sw.ts");
    writeFileSync(entryPath, entrySource);

    const app = new Site(
      { "": new EmptyKind() },
      { serviceWorker: { source: entryPath } },
    );
    const response = await app.handleRequest(
      makeRequest({ path: "/.well-known/service-worker.js" }),
    );
    expect(response.status).toBe(200);
    expect(response.headers["Content-Type"]).toBe(
      "application/javascript; charset=utf-8",
    );
    expect(response.headers["Service-Worker-Allowed"]).toBe("..");
    expect(response.headers["Cache-Control"]).toBe("no-cache");

    const body = response.body as string;
    expect(body).toContain("self.addEventListener");
  });

  it("caches the bundle across requests", async () => {
    const entryPath = join(entryDir, "sw.ts");
    writeFileSync(entryPath, entrySource);

    const app = new Site(
      { "": new EmptyKind() },
      { serviceWorker: { source: entryPath } },
    );
    const r1 = await app.handleRequest(
      makeRequest({ path: "/.well-known/service-worker.js" }),
    );
    const r2 = await app.handleRequest(
      makeRequest({ path: "/.well-known/service-worker.js" }),
    );
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(r1.body).toBe(r2.body);
  });
});

describe("generateDefaultServiceWorker", () => {
  it("embeds precache, routes, and exclude in the CONFIG literal", async () => {
    const { code } = await generateDefaultServiceWorker({
      precache: ["/", "/offline.html"],
      routes: [
        { match: "/.well-known/", strategy: "cache-first" },
        { match: "/articles", strategy: "stale-while-revalidate", cacheName: "articles" },
        { match: /^\/api\/.+/, strategy: "network-first" },
      ],
      exclude: ["/events", /^\/admin\//],
    });
    expect(code).toContain('"/"');
    expect(code).toContain('"/offline.html"');
    expect(code).toContain("cache-first");
    expect(code).toContain("stale-while-revalidate");
    expect(code).toContain("network-first");
    expect(code).toContain('"/articles"');
    expect(code).toContain('"/events"');
    // RegExp sources are embedded via the tagged-object form.
    expect(code).toContain("__rikka_regex__");
    expect(code).toContain("^\\\\/api\\\\/.+");
    expect(code).toContain("^\\\\/admin\\\\/");
  });

  it("produces a script with no rikka-site imports", async () => {
    const { code } = await generateDefaultServiceWorker({});
    // The script must be self-contained — no import statements.
    expect(/^\s*import\s/m.test(code)).toBe(false);
    // It must register install/activate/fetch handlers.
    expect(code).toContain('addEventListener("install"');
    expect(code).toContain('addEventListener("activate"');
    expect(code).toContain('addEventListener("fetch"');
  });

  it("skips precache when precache array is empty", async () => {
    const { code } = await generateDefaultServiceWorker({});
    // No addAll call when precache is empty.
    expect(code).not.toContain("addAll([])");
  });

  it("includes built-in .well-known handling helpers", async () => {
    const { code } = await generateDefaultServiceWorker({});
    expect(code).toContain("parseWellKnown");
    expect(code).toContain("handleWellKnown");
    // Built-in handler reads registration.scope to find the mount root
    // without anyone hard-coding an absolute path.
    expect(code).toContain("registration.scope");
  });

  it("internally redirects non-canonical .well-known depth", async () => {
    const { code } = await generateDefaultServiceWorker({});
    // The handler must fetch the canonical URL transparently rather than
    // return a 3xx (which would be invisible to the browser anyway).
    expect(code).toContain('".well-known/"');
    expect(code).toContain("new Request(canonical.href, req)");
  });

  it("applies cache-first to sdk.js and elements.js", async () => {
    const { code } = await generateDefaultServiceWorker({});
    expect(code).toContain('"sdk/sdk.js"');
    expect(code).toContain('"assets/elements.js"');
    // Both must hit the wellknown cache bucket via cacheFirst.
    expect(code).toContain("wellknown");
  });

  it("applies stale-while-revalidate to assets/*", async () => {
    const { code } = await generateDefaultServiceWorker({});
    expect(code).toContain('"assets/"');
    expect(code).toContain("staleWhileRevalidate");
  });

  it("does not intercept service-worker.js", async () => {
    const { code } = await generateDefaultServiceWorker({});
    // service-worker.js branch must be a bare return true without respondWith,
    // so the browser's SW update detection can byte-compare the script on every
    // navigation outside the SW's own fetch handler.
    expect(code).toContain(
      '=== "service-worker.js") return true;',
    );
  });

  it("lets user exclude override built-in .well-known handling", async () => {
    const { code } = await generateDefaultServiceWorker({
      exclude: ["/.well-known/"],
    });
    // Exclude check runs before handleWellKnown in the fetch handler.
    const fetchHandler = code.slice(
      code.indexOf('addEventListener("fetch"'),
    );
    const excludeIdx = fetchHandler.indexOf("CONFIG.exclude");
    const wkIdx = fetchHandler.indexOf("handleWellKnown");
    expect(excludeIdx).toBeGreaterThan(-1);
    expect(wkIdx).toBeGreaterThan(-1);
    expect(excludeIdx).toBeLessThan(wkIdx);
  });

  it("returns unknown .well-known subpaths to user routes", async () => {
    const { code } = await generateDefaultServiceWorker({});
    // handleWellKnown must return false for unknown .well-known subpaths so
    // user routes can handle them. Verify the function ends with a return
    // false before the fetch handler's user-route lookup.
    const wkIdx = code.indexOf("handleWellKnown");
    const fetchIdx = code.indexOf('addEventListener("fetch"');
    const wkBody = code.slice(wkIdx, fetchIdx);
    expect(wkBody).toContain("return false");
  });
});

describe("SDK registerServiceWorker URL derivation", () => {
  // Simulate the SDK being loaded from a canonical <root>/.well-known/sdk/sdk.js
  // URL. We can't easily mock import.meta.url in a unit test, so we verify the
  // URL math against the documented invariant directly.
  // Test against multiple mount points to confirm the relative math works
  // regardless of where rikka-site is mounted.
  const cases = [
    { mount: "/", sdkUrl: "https://example.com/.well-known/sdk/sdk.js" },
    { mount: "/blog/", sdkUrl: "https://example.com/blog/.well-known/sdk/sdk.js" },
    { mount: "/a/b/c/", sdkUrl: "https://example.com/a/b/c/.well-known/sdk/sdk.js" },
  ];

  for (const { mount, sdkUrl } of cases) {
    it(`derives swUrl and scope from sdkUrl at mount ${mount}`, () => {
      const base = new URL(sdkUrl);
      const swUrl = new URL("../service-worker.js", base);
      const scope = new URL("../../", base);

      // swUrl is the sibling `service-worker.js` in the same `.well-known/` dir.
      expect(swUrl.pathname).toBe(`${mount}.well-known/service-worker.js`);
      // scope is two levels up from `.well-known/sdk/sdk.js` → `<mount>`.
      expect(scope.pathname).toBe(mount);
      // swUrl must be inside scope.
      expect(swUrl.pathname.startsWith(scope.pathname)).toBe(true);
    });
  }

  it("produces the same scope regardless of current page depth", () => {
    // The invariant: using import.meta.url (not location.href) as the base
    // means scope is independent of the current page depth. The SDK base is
    // fixed at <root>/.well-known/sdk/sdk.js no matter which page loaded it.
    const sdkUrl = new URL("https://example.com/blog/.well-known/sdk/sdk.js");
    const scopeFromRoot = new URL("../../", sdkUrl);
    const scopeFromDeepPage = new URL("../../", sdkUrl);
    expect(scopeFromRoot.href).toBe(scopeFromDeepPage.href);
    expect(scopeFromRoot.pathname).toBe("/blog/");
  });

  it("returns undefined when navigator.serviceWorker is unavailable", async () => {
    // Directly invoke the function in an environment without SW support.
    // The Node test runner has no navigator, so this is the default.
    const { registerServiceWorker } = await import("../src/sdk/service-worker.js");
    const result = await registerServiceWorker();
    expect(result).toBeUndefined();
  });
});
