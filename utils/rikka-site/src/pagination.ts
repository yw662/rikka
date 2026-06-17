/**
 * @module pagination
 * Pagination helper for Collection resources.
 *
 * Slices an array of items based on `ctx.range` (unit: "items") and returns
 * a {@link Repr} whose content is a {@link PartialContent} shape, causing the
 * server to emit a 206 Partial Content response.
 *
 * @example
 * ```ts
 * import { paginate } from "@takanashi/rikka-site";
 *
 * const Articles = Collection(() => ({
 *   list(ctx) {
 *     return paginate(allArticles, ctx.range);
 *   },
 * }));
 * ```
 */

import type { RangeSpec } from "./context.js";
import type { Repr } from "./representation.js";

// ---------------------------------------------------------------------------
// PaginatedContent — convenience type for partial content shape
// ---------------------------------------------------------------------------

/**
 * Shape of a paginated (partial) content payload.
 *
 * Matches the {@link PartialContent} interface but with a generic data slot
 * so callers get typed slices.
 */
export interface PaginatedContent<T> {
  /** Unit of the segments — always "items" for this helper. */
  unit: "items";
  /** Single segment: [offset, slicedItems]. */
  data: [[number, T[]]];
  /** Total size of the complete collection. */
  total: number;
}

// ---------------------------------------------------------------------------
// paginate()
// ---------------------------------------------------------------------------

/**
 * Paginate an array of items based on `ctx.range` (unit: "items").
 *
 * - If no range is provided or `range.unit !== "items"`, returns all items
 *   as a plain `{ content, meta }` Repr (full content, 200).
 * - Otherwise, slices the array according to the first range segment and
 *   returns a Repr whose content is a {@link PartialContent} (206).
 *
 * @param items  The full collection to paginate.
 * @param range  Parsed `Range` header from `ctx.range`. Pass `null` or omit
 *               for full-content mode.
 */
export function paginate<T>(
  items: T[],
  range?: RangeSpec | null,
): Repr {
  // No range or wrong unit → return full content
  if (!range || range.unit !== "items") {
    return { content: items, meta: {} };
  }

  // Use only the first range segment
  const seg = range.ranges[0];
  if (!seg) {
    return { content: items, meta: {} };
  }

  const offset = seg.start ?? 0;
  const end = seg.end ?? items.length - 1;
  const limit = end - offset + 1;

  const sliced = items.slice(offset, offset + limit);

  const content: PaginatedContent<T> = {
    unit: "items",
    data: [[offset, sliced]],
    total: typeof range.total === "number" ? range.total : items.length,
  };

  return { content, meta: {} };
}
