/**
 * @module service-worker
 * Service Worker script generation and bundling for rikka-site.
 *
 * - `SiteOptions.serviceWorker` accepts either a custom `source` module
 *   (bundled with esbuild, like `customElementsEntry`) or a `config` object
 *   that drives the built-in default SW entry at `service-worker-default/`.
 * - The resulting script is served at `/.well-known/service-worker.js` with
 *   `Service-Worker-Allowed: ..` so it can register to the rikka-site mount
 *   root without anyone knowing the absolute mount path.
 * - The SW script itself contains no rikka-site code — it only uses Cache API,
 *   fetch, and the standard SW event handlers.
 */

/**
 * A single URL-pattern → cache-strategy rule.
 *
 * `match` is evaluated against the request URL:
 * - `string` — matched if the URL pathname starts with the string
 * - `RegExp` — matched if the regex tests the full URL string
 *
 * Function matchers are intentionally not supported in the default template
 * (they cannot be serialized into the generated script). Use `source` for
 * custom logic.
 */
export interface RouteCacheRule {
  match: string | RegExp;
  strategy:
    | "cache-first"
    | "network-first"
    | "stale-while-revalidate"
    | "network-only";
  /** Optional cache bucket name. Defaults to "default". */
  cacheName?: string;
}

/**
 * Configuration for the built-in default Service Worker template.
 */
export interface ServiceWorkerConfig {
  /** App-specific identifier for cache namespace isolation. Defaults to "default". */
  appId?: string;
  /** URLs to pre-cache during the install phase. */
  precache?: string[];
  /** Per-route cache strategy rules, evaluated in order; first match wins. */
  routes?: RouteCacheRule[];
  /** URL patterns to never intercept (passthrough to network). */
  exclude?: (string | RegExp)[];
}

/**
 * Either a custom SW script source or a config for the default template.
 */
export interface ServiceWorkerOptions {
  /**
   * Custom SW script entry module. Bundled with esbuild (browser target,
   * ESM format). Accepts a filesystem path or `file:` URL — same convention
   * as `SiteOptions.customElementsEntry`.
   */
  source?: string | URL;
  /**
   * Configuration for the built-in default SW template. Ignored when
   * `source` is provided.
   */
  config?: ServiceWorkerConfig;
}

interface BundleCache {
  source: string;
  mtime: number;
  code: string;
}

let bundleCache: BundleCache | null = null;

/**
 * Bundle a custom Service Worker entry module for the browser using esbuild.
 * Results are cached until the source file mtime changes.
 *
 * Mirrors the bundling approach in custom-elements.ts.
 */
export async function bundleServiceWorker(
  source: string | URL,
): Promise<{ code: string; type: string }> {
  const nodeFs = await import("node:fs");
  const nodeUrl = await import("node:url");
  const { build } = await import("esbuild");

  const sourcePath =
    source instanceof URL ? nodeUrl.fileURLToPath(source) : source;
  const stat = nodeFs.statSync(sourcePath);

  if (
    bundleCache &&
    bundleCache.source === sourcePath &&
    bundleCache.mtime === stat.mtimeMs
  ) {
    return {
      code: bundleCache.code,
      type: "application/javascript; charset=utf-8",
    };
  }

  const result = await build({
    entryPoints: [sourcePath],
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "es2022",
    write: false,
  });

  const file = result.outputFiles?.[0];
  if (!file) {
    throw new Error(
      `esbuild produced no output for service worker entry: ${sourcePath}`,
    );
  }

  bundleCache = { source: sourcePath, mtime: stat.mtimeMs, code: file.text };
  return { code: file.text, type: "application/javascript; charset=utf-8" };
}

/**
 * Invalidate the bundle cache. Useful in tests and long-running dev servers.
 */
export function invalidateServiceWorkerBundleCache(): void {
  bundleCache = null;
}

/**
 * Serialize a ServiceWorkerConfig into a JSON string that survives embedding
 * in a JS source. RegExp values are preserved via a tagged-object form so the
 * SW runtime can revive them into real RegExp objects.
 */
function serializeConfig(config: ServiceWorkerConfig): string {
  return JSON.stringify(config, (_key, value) => {
    if (value instanceof RegExp) {
      return { __rikka_regex__: value.source, __rikka_flags__: value.flags };
    }
    return value;
  });
}

/**
 * Generate the default Service Worker script by bundling the TypeScript entry
 * at `service-worker-default/index.ts` with esbuild.
 *
 * Config and version are injected at build time via esbuild `define` — the
 * SW source sees them as plain values, no runtime parsing needed.
 *
 * The bundle is self-contained: no rikka-site code is included, only standard
 * SW APIs. Results are not cached here; the Site instance caches the promise
 * via `_serviceWorkerScript`.
 */
export async function generateDefaultServiceWorker(
  config: ServiceWorkerConfig,
): Promise<{ code: string; type: string }> {
  const nodeUrl = await import("node:url");
  const nodePath = await import("node:path");
  const { build } = await import("esbuild");

  // In Node.js ESM, import.meta.url is a file: URL string. In test bundlers
  // (rstest/rspack) it may be a non-string object — fall back to cwd-relative.
  const metaUrl = import.meta.url;
  const entryPath =
    typeof metaUrl === "string" && metaUrl.startsWith("file:")
      ? nodeUrl.fileURLToPath(
          new URL("./service-worker-default/index.ts", metaUrl),
        )
      : nodePath.join(
          process.cwd(),
          "src",
          "service-worker-default",
          "index.ts",
        );

  const serializedConfig = serializeConfig(config);
  const nodeCrypto = await import("node:crypto");
  const version = nodeCrypto.createHash("sha1").update(serializedConfig).digest("hex").slice(0, 16);
  const result = await build({
    entryPoints: [entryPath],
    bundle: true,
    format: "iife",
    platform: "browser",
    target: "es2022",
    write: false,
    define: {
      __RIKKA_SW_CONFIG__: serializedConfig,
      __RIKKA_SW_VERSION__: JSON.stringify(version),
    },
  });

  const file = result.outputFiles?.[0];
  if (!file) {
    throw new Error(
      "esbuild produced no output for default service worker entry",
    );
  }

  return { code: file.text, type: "application/javascript; charset=utf-8" };
}
