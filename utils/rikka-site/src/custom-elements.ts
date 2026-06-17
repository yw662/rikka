/**
 * @module custom-elements
 * Custom element registry and browser bundling for rikka-site.
 *
 * - `Site` receives a `customElements` map of export-name → class.
 * - Classes returned by `rikka-elements/defineElement` carry `static tagName`.
 * - The browser bundle is produced from `customElementsEntry` via esbuild.
 * - Bundled output is served at `.well-known/assets/elements.js` from any
 *   resource path (path-independent relative URLs).
 */

import type { CustomElementConstructor } from "./resource.js";

export interface CustomElementRegistryEntry {
  /** Export name as given in SiteOptions.customElements. */
  exportName: string;
  /** The custom element class. */
  ctor: CustomElementConstructor;
  /** Tag name, read from the class static `tagName` property. */
  tag: string;
}

/**
 * Build a tag registry from the user-supplied custom element class map.
 */
export function buildCustomElementRegistry(
  customElements: Record<string, CustomElementConstructor> | undefined,
): CustomElementRegistryEntry[] {
  if (!customElements) return [];
  const registry: CustomElementRegistryEntry[] = [];
  for (const [exportName, ctor] of Object.entries(customElements)) {
    const tag = (ctor as unknown as { tagName?: string }).tagName;
    if (typeof tag !== "string") {
      throw new TypeError(
        `Custom element "${exportName}" does not have a static tagName. ` +
          "Make sure it was created with defineElement() from @takanashi/rikka-elements.",
      );
    }
    registry.push({ exportName, ctor, tag });
  }
  return registry;
}

interface BundleCache {
  entry: string;
  mtime: number;
  code: string;
}

let bundleCache: BundleCache | null = null;

/**
 * Bundle the custom element entry module for the browser using esbuild.
 * Results are cached until the entry file mtime changes.
 */
export async function bundleCustomElements(
  entry: string | URL,
): Promise<{ code: string; type: string }> {
  const nodeFs = await import("node:fs");
  const nodeUrl = await import("node:url");
  const { build } = await import("esbuild");

  const entryPath = entry instanceof URL ? nodeUrl.fileURLToPath(entry) : entry;

  const stat = nodeFs.statSync(entryPath);
  if (bundleCache && bundleCache.entry === entryPath && bundleCache.mtime === stat.mtimeMs) {
    return { code: bundleCache.code, type: "application/javascript; charset=utf-8" };
  }

  const result = await build({
    entryPoints: [entryPath],
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "es2022",
    write: false,
  });

  const file = result.outputFiles?.[0];
  if (!file) {
    throw new Error(`esbuild produced no output for custom element entry: ${entryPath}`);
  }

  bundleCache = { entry: entryPath, mtime: stat.mtimeMs, code: file.text };
  return { code: file.text, type: "application/javascript; charset=utf-8" };
}

/**
 * Invalidate the bundle cache. Useful in tests and long-running dev servers.
 */
export function invalidateCustomElementBundleCache(): void {
  bundleCache = null;
}
