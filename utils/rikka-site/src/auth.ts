/**
 * @module auth
 * Auth and CORS configuration for a site.
 *
 * Auth resources are ordinary Action resources in the site tree.
 * The auth config references them by name and declares which routes
 * require authentication.
 *
 * CORS is configured declaratively and handled automatically by handleRequest.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Authentication configuration for a site.
 */
export interface AuthConfig {
  /** Name of the auth resource in the site tree (must be an Action) */
  verifier: string;
  /** Rules that determine which paths require authentication */
  rules: AuthRule[];
}

/**
 * A single auth rule.
 * The first matching rule wins. If no rule matches, no auth is required.
 */
export interface AuthRule {
  /** Glob pattern for the path (e.g. "/users/**", "/admin/**", "/public/**") */
  match: string;
  /**
   * Name of the auth resource to use, or null to explicitly disable auth.
   * If omitted, defaults to the verifier.
   */
  auth?: string | null;
}

// ---------------------------------------------------------------------------
// Glob matching
// ---------------------------------------------------------------------------

/**
 * Match a path against a glob pattern.
 * Supports:
 * - `**` — matches any number of segments
 * - `*` — matches a single segment
 * - Exact string — matches exactly
 */
export function globMatch(pattern: string, path: string): boolean {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = path.split("/").filter(Boolean);
  return globWalk(patternParts, 0, pathParts, 0);
}

function globWalk(
  pattern: string[],
  pi: number,
  path: string[],
  xi: number,
): boolean {
  // Both exhausted → match
  if (pi === pattern.length && xi === path.length) return true;
  // Pattern exhausted but path remains → no match
  if (pi === pattern.length) return false;

  if (pattern[pi] === "**") {
    // ** matches zero or more segments
    // Try matching 0, 1, 2, ... segments
    for (let i = xi; i <= path.length; i++) {
      if (globWalk(pattern, pi + 1, path, i)) return true;
    }
    return false;
  }

  // Path exhausted but pattern remains → no match
  if (xi === path.length) return false;

  if (pattern[pi] === "*") {
    // * matches exactly one segment
    return globWalk(pattern, pi + 1, path, xi + 1);
  }

  // Exact match
  if (pattern[pi] === path[xi]) {
    return globWalk(pattern, pi + 1, path, xi + 1);
  }

  return false;
}

// ---------------------------------------------------------------------------
// Auth rule matching
// ---------------------------------------------------------------------------

/**
 * Find the auth resource name for a given path, or null if no auth is required.
 * Returns undefined if no rule matches (no auth required).
 */
export function matchAuthRule(
  path: string,
  rules: AuthRule[],
): string | null | undefined {
  for (const rule of rules) {
    if (globMatch(rule.match, path)) {
      if (rule.auth === null) return null; // explicitly no auth
      if (rule.auth === undefined) return undefined; // use verifier (handled by caller)
      return rule.auth;
    }
  }
  return undefined; // no matching rule → no auth
}

// ---------------------------------------------------------------------------
// CORS configuration
// ---------------------------------------------------------------------------

/**
 * CORS configuration for a site.
 * When provided, handleRequest automatically handles OPTIONS preflight
 * and adds CORS headers to all responses.
 *
 * @example
 * ```ts
 * // Simple: allow all origins
 * cors: {}
 *
 * // Specific origin
 * cors: { origin: "https://example.com" }
 *
 * // Multiple origins with dynamic matching
 * cors: {
 *   origin: ["https://example.com", "https://app.example.com"],
 *   credentials: true,
 *   headers: "Content-Type, Authorization, Accept, X-Request-ID",
 * }
 *
 * // Dynamic origin (e.g. allow all subdomains)
 * cors: {
 *   origin: (origin) => origin?.endsWith(".example.com") ? origin : undefined,
 *   credentials: true,
 * }
 * ```
 */
export interface CorsConfig {
  /**
   * Allowed origins. Supports:
   * - `undefined` → defaults to "*"
   * - `"*"` → allow all origins (cannot be used with credentials: true)
   * - `"https://example.com"` → single origin
   * - `["https://a.com", "https://b.com"]` → multiple origins (matched dynamically)
   * - `(origin: string | undefined) => string | undefined` → dynamic callback,
   *   receives the request Origin header, returns the allowed origin or undefined to deny
   */
  origin?: string | string[] | ((origin: string | undefined) => string | undefined);
  /** Allowed HTTP methods. Defaults to "GET, POST, PUT, PATCH, DELETE, OPTIONS". */
  methods?: string;
  /** Allowed request headers. Defaults to "Content-Type, Authorization, Accept". */
  headers?: string;
  /** Response headers to expose to the client. */
  exposeHeaders?: string;
  /** Preflight cache duration in seconds. Defaults to 86400. */
  maxAge?: number;
  /** Whether to allow credentials (cookies, auth headers). Defaults to false. */
  credentials?: boolean;
}

/**
 * Resolve the allowed origin from config and the incoming request's Origin header.
 * Returns the origin value to use in Access-Control-Allow-Origin, or undefined to deny.
 */
function resolveOrigin(
  config: CorsConfig,
  requestOrigin?: string,
): string | undefined {
  const { origin } = config;

  // No origin config → default to "*"
  if (origin === undefined) {
    return config.credentials ? undefined : "*";
  }

  // String: could be "*" or a specific origin
  if (typeof origin === "string") {
    return origin;
  }

  // Array: check if request origin is in the list
  if (Array.isArray(origin)) {
    if (!requestOrigin) return undefined;
    return origin.includes(requestOrigin) ? requestOrigin : undefined;
  }

  // Function: call with the request origin
  if (typeof origin === "function") {
    return origin(requestOrigin);
  }

  return undefined;
}

/**
 * Build CORS response headers from config and the incoming request's Origin header.
 */
export function corsHeaders(config?: CorsConfig, requestOrigin?: string): Record<string, string> {
  if (!config) return {};

  const allowOrigin = resolveOrigin(config, requestOrigin);
  if (allowOrigin === undefined) return {};

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": config.methods ?? "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": config.headers ?? "Content-Type, Authorization, Accept",
    ...(config.exposeHeaders ? { "Access-Control-Expose-Headers": config.exposeHeaders } : {}),
    "Access-Control-Max-Age": String(config.maxAge ?? 86400),
    ...(config.credentials ? { "Access-Control-Allow-Credentials": "true" } : {}),
  };
}
