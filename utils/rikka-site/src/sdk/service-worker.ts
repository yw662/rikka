/**
 * rikka-site client-side Service Worker registration helper.
 *
 * The SDK is loaded from `<root>/.well-known/sdk/sdk.js`, so `import.meta.url`
 * always points at that canonical path (the HTML transformer injects a
 * path-relative `src`, and any non-canonical request is 301-redirected by
 * the server). From that stable anchor we derive both the SW script URL and
 * the registration scope as **absolute URLs** computed by the browser:
 *
 *   sdkUrl      = <root>/.well-known/sdk/sdk.js
 *   swUrl       = <root>/.well-known/service-worker.js   (../service-worker.js)
 *   scope       = <root>/                                (../../)
 *
 * Using `import.meta.url` as the base (not `location.href`) is mandatory:
 * - It guarantees `swUrl` lands on the canonical path. The SW spec rejects
 *   3xx responses for SW scripts, so a non-canonical `swUrl` that triggers
 *   the server's 301 would silently fail registration.
 * - It guarantees `scope` is always `<root>/`, independent of the current
 *   page depth, so all pages share a single SW registration.
 *
 * The server returns `Service-Worker-Allowed: ..` for the SW script, which
 * the browser resolves relative to the response URL — also landing on
 * `<root>/` — allowing this broader scope.
 */

export interface RegisterServiceWorkerOptions {
  /**
   * Passed through to `navigator.serviceWorker.register`. Defaults to
   * `"imports"` (the browser default), meaning the main SW script bypasses
   * HTTP cache while imported scripts use it.
   */
  updateViaCache?: "all" | "imports" | "none";
}

/**
 * Register the rikka-site Service Worker at the canonical
 * `/.well-known/service-worker.js` URL, scoped to the rikka-site mount root.
 *
 * Returns `undefined` when SW is unavailable (non-secure context, unsupported
 * browser, or running in a non-browser environment).
 */
export async function registerServiceWorker(
  options?: RegisterServiceWorkerOptions,
): Promise<ServiceWorkerRegistration | undefined> {
  if (
    typeof navigator === "undefined" ||
    !("serviceWorker" in navigator)
  ) {
    return undefined;
  }

  const sdkUrl = new URL(import.meta.url);
  const swUrl = new URL("../service-worker.js", sdkUrl);
  const scope = new URL("../../", sdkUrl);

  return navigator.serviceWorker.register(swUrl.href, {
    scope: scope.href,
    updateViaCache: options?.updateViaCache ?? "imports",
  });
}
