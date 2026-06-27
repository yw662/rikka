import type { SiteDefinition, SiteNode } from "./site.js";
import { isResourceKind } from "./resource.js";
import type { ChildrenMap } from "./resource.js";

/** A single route entry in the sitemap */
export interface SitemapEntry {
  path: string;
  element: string;
  children?: SitemapEntry[];
}

/**
 * Generate a sitemap from a SiteDefinition.
 * Walks the definition tree and extracts path/element info.
 */
export function generateSitemap(definition: SiteDefinition): SitemapEntry[] {
  const entries: SitemapEntry[] = [];
  const visited = new WeakSet<object>();
  for (const [key, node] of Object.entries(definition)) {
    const entry = buildSitemapEntry(key, node, visited);
    if (entry) entries.push(entry);
  }
  return entries;
}

function buildSitemapEntry(key: string, node: SiteNode, visited: WeakSet<object>): SitemapEntry | null {
  if (isResourceKind(node)) {
    const entry: SitemapEntry = {
      path: `/${key}`,
      element: (node.element as string | undefined) ?? "",
    };
    if (node.children && !visited.has(node)) {
      visited.add(node);
      entry.children = buildSitemapChildren(node.children, visited);
    }
    return entry;
  }

  if (typeof node === "object" && node !== null) {
    const children: SitemapEntry[] = [];
    for (const [childKey, childNode] of Object.entries(node)) {
      const childEntry = buildSitemapEntry(childKey, childNode as SiteNode, visited);
      if (childEntry) children.push(childEntry);
    }
    return { path: `/${key}`, element: "", children };
  }

  return null;
}

function buildSitemapChildren(childrenMap: ChildrenMap, visited: WeakSet<object>): SitemapEntry[] {
  const entries: SitemapEntry[] = [];
  for (const [key, value] of Object.entries(childrenMap)) {
    if (isResourceKind(value)) {
      const entry: SitemapEntry = {
        path: key,
        element: (value.element as string | undefined) ?? "",
      };
      if (value.children && !visited.has(value)) {
        visited.add(value);
        entry.children = buildSitemapChildren(value.children, visited);
      }
      entries.push(entry);
    } else if (typeof value === "object" && value !== null) {
      const childEntries = buildSitemapChildren(value as ChildrenMap, visited);
      entries.push({ path: key, element: "", children: childEntries });
    }
  }
  return entries;
}
