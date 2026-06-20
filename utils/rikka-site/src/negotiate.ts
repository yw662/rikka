/**
 * @module negotiate
 * Content negotiation — determine the response representation
 * based on Accept header or ?accept query parameter.
 *
 * Only MIME types that have a registered transformer are considered valid.
 */

import type { TransformerRegistry } from "./transform.js";

/**
 * Result of content negotiation.
 */
export interface NegotiationResult {
  /** The negotiated Content-Type */
  contentType: string;
}

/**
 * Negotiate the best content type for a request.
 *
 * Resolution order:
 * 1. `?accept` query parameter (explicit override)
 * 2. `Accept` header (standard content negotiation with q-values)
 * 3. Default: text/html
 */
export function negotiate(
  registry: TransformerRegistry,
  acceptHeader?: string,
  acceptQuery?: string,
): NegotiationResult {
  // 1. Query parameter override
  if (acceptQuery) {
    const result = parseAcceptQuery(registry, acceptQuery);
    if (result) {
      return { contentType: result };
    }
  }

  // 2. Accept header
  if (acceptHeader) {
    const result = parseAcceptHeader(registry, acceptHeader);
    if (result) {
      return { contentType: result };
    }
  }

  // 3. Default to HTML
  return { contentType: "text/html" };
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

  // Check if it's a valid MIME type pattern that matches a transformer
  const types = registry.registeredOutputTypes();
  if (types.includes(normalized)) {
    return normalized;
  }

  return null;
}

/**
 * Parse an Accept header and find the best matching content type.
 * Uses quality factor (q) parsing and checks against registered transformers.
 */
function parseAcceptHeader(registry: TransformerRegistry, header: string): string | null {
  const entries = header.split(",").map((entry) => {
    const [type, ...params] = entry.trim().split(";");
    let q = 1.0;
    for (const param of params) {
      const [key, value] = param.trim().split("=");
      if (key === "q" && value) {
        q = parseFloat(value);
      }
    }
    return { type: type.trim().toLowerCase(), q };
  });

  // Sort by quality descending
  entries.sort((a, b) => b.q - a.q);

  for (const { type } of entries) {
    // Exact match with a registered transformer
    if (registry.findTransformer(type)) {
      return type;
    }

    // Wildcard matching
    if (type === "*/*") {
      // Return the highest priority transformer's type, or html
      return "text/html";
    }

    // type/* wildcard — find best match in that type family
    if (type.endsWith("/*")) {
      const prefix = type.split("/*")[0];
      const matching = registry.registeredOutputTypes().filter((t) => t.startsWith(prefix + "/"));
      if (matching.length > 0) {
        return matching[0];
      }
    }
  }

  return null;
}
