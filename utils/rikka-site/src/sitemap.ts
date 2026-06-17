import type { SiteDefinition, SiteNode } from "./site.js";
import type { ResourceConstructor } from "./resource.js";

/** A single route entry in the sitemap */
export interface SitemapEntry {
  path: string;
  kind: string;
  element: string;
  children?: SitemapEntry[];
}

/**
 * Generate a sitemap from a SiteDefinition.
 * Walks the definition tree and extracts path/kind/element info.
 */
export function generateSitemap(definition: SiteDefinition): SitemapEntry[] {
  const entries: SitemapEntry[] = [];
  for (const [key, node] of Object.entries(definition)) {
    const entry = buildSitemapEntry(key, node);
    if (entry) entries.push(entry);
  }
  return entries;
}

function buildSitemapEntry(key: string, node: SiteNode): SitemapEntry | null {
  if (typeof node === "function") {
    // ResourceConstructor — instantiate to read kind/element/children
    try {
      const instance = new (node as ResourceConstructor)({}, `/${key}`);
      const entry: SitemapEntry = {
        path: `/${key}`,
        kind: instance.kind,
        element: (instance.element as string | undefined) ?? "",
      };
      if (instance.children) {
        entry.children = buildSitemapChildren(instance.children);
      }
      return entry;
    } catch {
      return { path: `/${key}`, kind: "Unknown", element: "" };
    }
  }

  if (typeof node === "object" && node !== null) {
    // Nested record — route group
    const children: SitemapEntry[] = [];
    for (const [childKey, childNode] of Object.entries(node)) {
      const childEntry = buildSitemapEntry(childKey, childNode);
      if (childEntry) children.push(childEntry);
    }
    return { path: `/${key}`, kind: "", element: "", children };
  }

  return null;
}

function buildSitemapChildren(childrenMap: Record<string, unknown>): SitemapEntry[] {
  const entries: SitemapEntry[] = [];
  for (const [key, value] of Object.entries(childrenMap)) {
    if (typeof value === "function") {
      try {
        const instance = new (value as ResourceConstructor)({}, key.startsWith(":") ? "/_" : `/${key}`);
        const entry: SitemapEntry = {
          path: key,
          kind: instance.kind,
          element: (instance.element as string | undefined) ?? "",
        };
        if (instance.children) {
          entry.children = buildSitemapChildren(instance.children as Record<string, unknown>);
        }
        entries.push(entry);
      } catch {
        entries.push({ path: key, kind: "Unknown", element: "" });
      }
    } else if (typeof value === "object" && value !== null) {
      const childEntries = buildSitemapChildren(value as Record<string, unknown>);
      entries.push({ path: key, kind: "", element: "", children: childEntries });
    }
  }
  return entries;
}
