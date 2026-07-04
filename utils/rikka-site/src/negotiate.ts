/**
 * @module negotiate
 * Content negotiation — shared q-value primitives plus MIME and language
 * negotiation helpers.
 *
 * Accept and Accept-Language share the same syntax (`<item>; q=<0-1>` with
 * wildcards). The parsing half is generic; the matching half differs by
 * dimension (MIME wildcards vs language prefix matching).
 *
 * The framework owns the final decision on MIME (it can run transformers to
 * convert), but for language it can only accept what the resource produces
 * (no translation transformer). Neither dimension ever returns 4xx — the
 * framework always produces *some* representation.
 */

import type { TransformerRegistry } from "./transform.js";

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

/**
 * A single item from an `Accept-*` header, with its quality factor.
 * Sorted by `q` descending when produced by {@link parseQualityList}.
 */
export interface AcceptItem {
  /** The requested item (lowercased): a MIME type, a language tag, or `*`. */
  item: string;
  /** Quality factor (0–1). Items with q=0 mean "not acceptable". */
  q: number;
}

/**
 * Parse any `Accept-*` header into a list of {@link AcceptItem}s, sorted by
 * `q` descending. Shared by Accept (MIME) and Accept-Language.
 *
 * @example
 * ```ts
 * parseQualityList("en;q=0.8, zh;q=0.9, *;q=0.1")
 * // → [{ item: "zh", q: 0.9 }, { item: "en", q: 0.8 }, { item: "*", q: 0.1 }]
 * ```
 */
export function parseQualityList(header: string): AcceptItem[] {
  const entries = header.split(",").map((entry) => {
    const [item, ...params] = entry.trim().split(";");
    let q = 1.0;
    for (const param of params) {
      const [key, value] = param.trim().split("=");
      if (key === "q" && value) {
        q = parseFloat(value);
      }
    }
    return { item: item.trim().toLowerCase(), q };
  });
  entries.sort((a, b) => b.q - a.q);
  return entries;
}

/**
 * Select the best available item given a parsed preference list.
 *
 * Iterates `parsed` in q-descending order; for each, returns the first
 * `available` item that `match` accepts. Returns `null` if no match.
 *
 * @param parsed   Output of {@link parseQualityList}, sorted by q desc.
 * @param available What the server can produce (MIME types from registry,
 *                  or languages from the resource).
 * @param match     Predicate: does `requested` (from header) accept `avail`?
 */
export function selectBest(
  parsed: AcceptItem[],
  available: string[],
  match: (requested: string, avail: string) => boolean,
): string | null {
  for (const { item, q } of parsed) {
    if (q === 0) continue; // q=0 means "not acceptable"
    for (const avail of available) {
      if (match(item, avail.toLowerCase())) return avail;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// MIME negotiation
// ---------------------------------------------------------------------------

/**
 * Negotiate the best content type for a request.
 *
 * Resolution order:
 * 1. `?accept` query parameter (explicit override)
 * 2. `Accept` header (standard content negotiation with q-values)
 *
 * Returns `null` when no acceptable type is found — the caller decides the
 * fallback. For Value content, `buildResponse` falls back to the resource's
 * `meta.type` (or `application/json` when unset); for Raw content, it uses
 * the resource's `meta.type` or a path-guessed MIME. Browsers sending
 * `Accept: text/html,...` get HTML through negotiation, not as a default.
 *
 * Wildcard entries (star-slash-star, text-slash-star) are real matches,
 * not fallbacks — they resolve to a concrete registered type.
 */
export function negotiate(
  registry: TransformerRegistry,
  acceptHeader?: string,
  acceptQuery?: string,
): string | null {
  // 1. Query parameter override
  if (acceptQuery) {
    const result = parseAcceptQuery(registry, acceptQuery);
    if (result) {
      return result;
    }
  }

  // 2. Accept header
  if (acceptHeader) {
    const result = matchAcceptHeader(registry, acceptHeader);
    if (result) {
      return result;
    }
  }

  // 3. No match
  return null;
}

/**
 * Check whether a specific MIME type is listed in the Accept header.
 *
 * Used by `buildResponse` to decide whether to honor the resource's
 * `meta.type` directly (type in Accept = no conversion) or to negotiate
 * a different type (type not in Accept = run transformer).
 *
 * Wildcards in the Accept header are respected: a `text/`-prefixed wildcard
 * covers any text type, and a bare star wildcard covers everything.
 *
 * Returns `true` if no Accept header is present (no preference = accept all).
 */
export function isTypeAccepted(acceptHeader: string | undefined, type: string): boolean {
  if (!acceptHeader) return true;
  const parsed = parseQualityList(acceptHeader);
  const lower = type.toLowerCase();
  for (const { item, q } of parsed) {
    if (q === 0) continue;
    if (item === lower || item === "*/*") return true;
    if (item.endsWith("/*") && lower.startsWith(item.split("/*")[0] + "/")) return true;
  }
  return false;
}

/**
 * Parse the ?accept query parameter.
 * Accepts a full MIME type, a short name, or checks against registered transformers.
 */
function parseAcceptQuery(registry: TransformerRegistry, value: string): string | null {
  const normalized = value.trim().toLowerCase();

  // Short names
  if (normalized === "html") return "text/html";
  if (normalized === "json") return "application/json";
  if (normalized === "jsonld" || normalized === "json-ld") return "application/ld+json";
  if (normalized === "csv") return "text/csv";
  if (normalized === "text") return "text/plain";
  if (normalized === "cbor") return "application/cbor";
  if (normalized === "protobuf" || normalized === "proto") return "application/x-protobuf";
  if (normalized === "xml") return "text/xml";

  // Try as a MIME subtype: "csv" → "text/csv", "plain" → "text/plain"
  const subtypeMatch = registry.registeredOutputTypes().find((t) => {
    const subtype = t.split("/")[1];
    return subtype === normalized;
  });
  if (subtypeMatch) {
    return subtypeMatch;
  }

  // Check if it's a registered MIME type
  if (registry.findTransformer(normalized)) {
    return normalized;
  }

  return null;
}

/**
 * Match an Accept header against the transformer registry using q-values
 * and MIME wildcards. Built on {@link parseQualityList}.
 */
function matchAcceptHeader(
  registry: TransformerRegistry,
  header: string,
): string | null {
  const parsed = parseQualityList(header);

  for (const { item, q } of parsed) {
    if (q === 0) continue;

    // Exact match with a registered transformer
    if (registry.findTransformer(item)) {
      return item;
    }

    // */* wildcard — matches any registered type; return the first one
    if (item === "*/*") {
      const types = registry.registeredOutputTypes();
      if (types.length > 0) return types[0];
      return null;
    }

    // type/* wildcard — find best match in that type family
    if (item.endsWith("/*")) {
      const prefix = item.split("/*")[0];
      const matching = registry
        .registeredOutputTypes()
        .filter((t) => t.startsWith(prefix + "/"));
      if (matching.length > 0) {
        return matching[0];
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Language negotiation
// ---------------------------------------------------------------------------

/**
 * Match a requested language tag against an available one.
 *
 * - Exact match (case-insensitive): `"en"` matches `"en"`.
 * - Prefix match: `"en"` matches `"en-US"` (client accepts any English variant).
 *   The reverse (`"en-US"` matching `"en"`) does NOT match — the client asked
 *   for a specific variant, and the server only has the generic one.
 * - Wildcard: `"*"` matches anything.
 */
function matchLanguage(requested: string, avail: string): boolean {
  if (requested === "*") return true;
  if (requested === avail) return true;
  // "en" matches "en-us" (prefix), but NOT vice versa
  if (avail.startsWith(requested + "-")) return true;
  return false;
}

/**
 * Resolve the best language from an `Accept-Language` header.
 *
 * This is a **hint resolver** for resources, not "the negotiation." The
 * resource calls this with its own `available` locale set to pick the best
 * match. The framework has no language registry — only the resource knows
 * what languages it can produce.
 *
 * @returns The best matching language from `available`, or `null` if no match.
 *          The resource decides its own fallback when `null` is returned.
 */
export function negotiateLanguage(
  acceptLanguage: string | undefined,
  available: string[],
): string | null {
  if (!acceptLanguage || available.length === 0) return null;
  const parsed = parseQualityList(acceptLanguage);
  return selectBest(parsed, available, matchLanguage);
}
