/**
 * Blog Site — full dev server entry point.
 *
 * Run: pnpm dev
 *
 * Uses rikka-site's `serve()` with dev-only hooks:
 * - Custom HTML transformer (friendly titles, blog-layout wrapping)
 * - Static file serving (bundled custom elements, favicon)
 * - HTML enhancement (noscript fallback)
 * - Request logging
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { serve, type HttpResponse } from "@takanashi/rikka-site/node";
import { createHtmlTransformer } from "@takanashi/rikka-site";
import type { IncomingMessage } from "node:http";
import { app } from "./resources.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Custom HTML Transformer
// ---------------------------------------------------------------------------

function generateTitle(path: string, kind: string, _data: unknown): string {
  const titleMap: Record<string, string> = {
    "/": "Rikka Blog — A Resource-Orientated Blog",
    "/articles": "Articles — Rikka Blog",
    "/users": "Users — Rikka Blog",
    "/settings": "Settings — Rikka Blog",
    "/dashboard": "Dashboard — Rikka Blog",
  };
  if (titleMap[path]) return titleMap[path];
  if (path.startsWith("/articles/") && !path.includes("/comments/")) {
    return "Article — Rikka Blog";
  }
  const cleanPath = path === "/" ? "Home" : (path.split("/").pop() ?? path);
  return `${cleanPath} — Rikka Blog`;
}

const blogHtmlTransformer = createHtmlTransformer({
  defaultElement: "rikka-resource",
  hydration: "data-attr",
  serialization: "data-attr",
  title: generateTitle,
  layoutElement: "blog-layout",
  // Load as a module so it executes after the SDK module.
  scripts: [{ src: "/elements.js", module: true }],
  headHtml: `
  <meta name="description" content="A blog built with the Rikka framework demonstrating resource-oriented architecture, content negotiation, and Web Components.">
  <link rel="icon" data-emoji="R" />`,
});
// Win over the default htmlTransformer (priority 10)
blogHtmlTransformer.priority = 20;
app.registry.register(blogHtmlTransformer);

// ---------------------------------------------------------------------------
// Static file serving (dev-only, handled before rikka-site)
// ---------------------------------------------------------------------------

const ELEMENT_JS_FALLBACK = `
// Blog Site Custom Elements — not yet built.
// Run: pnpm build:elements
console.info("[Rikka Blog] Custom elements not loaded. Run \\u201cpnpm build:elements\\u201d to build them.");
`.trim();

const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#6366f1"/>
  <text x="16" y="23" text-anchor="middle" font-size="20" font-weight="bold" fill="white" font-family="system-ui">R</text>
</svg>`;

function tryServeStatic(urlPath: string): HttpResponse | undefined {
  if (urlPath === "/elements.js") {
    const filePath = join(__dirname, "..", "dist", "elements.js");
    if (existsSync(filePath)) {
      return {
        status: 200,
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          "Cache-Control": "no-cache",
        },
        body: readFileSync(filePath, "utf-8"),
      };
    }
    return {
      status: 200,
      headers: { "Content-Type": "application/javascript; charset=utf-8" },
      body: ELEMENT_JS_FALLBACK,
    };
  }
  if (urlPath === "/favicon.ico") {
    return {
      status: 200,
      headers: { "Content-Type": "image/svg+xml" },
      body: FAVICON_SVG,
    };
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// HTML enhancement (post-processing)
// ---------------------------------------------------------------------------

function enhanceHtmlOutput(html: string): string {
  if (html.includes("<blog-overlay>")) return html;
  // Inject blog-overlay for toast notifications & modal dialogs
  html = html.replace(
    "</body>",
    "  <blog-overlay></blog-overlay>\n</body>",
  );
  if (html.includes("<noscript>")) return html;
  return html.replace(
    "</body>",
    `  <noscript>
    <style>
      .noscript-warning { padding: 20px; background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; margin: 20px; color: #92400e; font-family: system-ui; }
      .noscript-warning strong { display: block; font-size: 1.1rem; margin-bottom: 4px; }
      script[type="application/ld+json"] { display: block; white-space: pre-wrap; font-family: monospace; font-size: 0.85rem; background: #f1f5f9; padding: 12px; border-radius: 6px; margin-top: 12px; overflow: auto; }
    </style>
    <div class="noscript-warning">
      <strong>JavaScript Required</strong>
      This page requires JavaScript to render the full UI. Below is the raw data:
    </div>
  </noscript>
</body>`,
  );
}

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

const startTimes = new WeakMap<IncomingMessage, number>();

function logRequest(
  method: string,
  path: string,
  status: number,
  duration: number,
) {
  const timestamp = new Date().toISOString();
  const color =
    status >= 500 ? "\x1b[31m" : status >= 400 ? "\x1b[33m" : "\x1b[32m";
  const reset = "\x1b[0m";
  console.log(
    `${timestamp} ${method} ${path} ${color}${status}${reset} ${duration.toFixed(0)}ms`,
  );
}

// ---------------------------------------------------------------------------
// Server hooks
// ---------------------------------------------------------------------------

const before = (req: IncomingMessage): HttpResponse | undefined => {
  const method = (req.method ?? "GET").toUpperCase();
  if (method !== "GET") return undefined;
  const urlPath = (req.url ?? "/").split("?")[0] ?? "/";
  const response = tryServeStatic(urlPath);
  if (response) {
    const start = startTimes.get(req) ?? performance.now();
    logRequest(method, urlPath, response.status, performance.now() - start);
  }
  return response;
};

const after = (response: HttpResponse, req: IncomingMessage): HttpResponse => {
  const start = startTimes.get(req) ?? performance.now();
  const urlPath = (req.url ?? "/").split("?")[0] ?? "/";
  let body = response.body;
  if (response.headers["Content-Type"]?.includes("text/html")) {
    body = enhanceHtmlOutput(body);
  }
  logRequest(
    (req.method ?? "GET").toUpperCase(),
    urlPath,
    response.status,
    performance.now() - start,
  );
  return { ...response, body };
};

const onRequest = (req: IncomingMessage): void => {
  startTimes.set(req, performance.now());
};

const onListen = (port: number, host: string): void => {
  console.log(`\n  🏠 Rikka Blog Site running at http://${host}:${port}\n`);
  console.log("  Content negotiation:");
  console.log("    GET  /articles                     → HTML page (with custom elements)");
  console.log("    GET  /articles?accept=json          → JSON array");
  console.log("    GET  /articles?accept=jsonld        → JSON-LD document");
  console.log("    GET  /articles?accept=csv           → CSV export");
  console.log("    GET  /articles?accept=text          → Plain text");
  console.log();
  console.log("  Pages (HTML with Custom Elements):");
  console.log("    GET  /                              → Landing page (hero + stats + links)");
  console.log("    GET  /articles                     → Article list (searchable, filterable cards)");
  console.log("    GET  /articles/1                   → Article detail (with comments)");
  console.log("    GET  /users                        → User list (avatar cards)");
  console.log("    GET  /dashboard                    → Dashboard (stat cards + table)");
  console.log("    GET  /settings                     → Settings view");
  console.log();
  console.log("  API endpoints:");
  console.log("    POST /articles                    → Create article");
  console.log("    PUT  /articles/1                  → Replace article");
  console.log("    PATCH /articles/1                 → Patch article");
  console.log("    DELETE /articles/1                → Delete article");
  console.log("    POST /users                       → Create user");
  console.log("    POST /actions/search              → Search articles");
  console.log();
  console.log("  Auth (Bearer token):");
  console.log("    admin-token   → read + write + admin");
  console.log("    author-token  → read + write");
  console.log("    reader-token  → read only");
  console.log();
  console.log("  Features:");
  console.log("    - Custom Elements: blog-layout, blog-home, blog-article-list, ...");
  console.log("    - Declarative Shadow DOM SSR");
  console.log("    - Content negotiation (5 formats)");
  console.log("    - CORS enabled");
  console.log();
};

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const PORT = Number(process.env["PORT"] ?? 3000);
const HOST = process.env["HOST"] ?? "127.0.0.1";

const server = serve(app, {
  port: PORT,
  host: HOST,
  before,
  after,
  onRequest,
  onListen,
});

const shutdown = async (signal: string) => {
  console.log(`\n[rikka-site] received ${signal}, shutting down...`);
  try {
    await server.close();
    console.log("[rikka-site] server closed");
    process.exit(0);
  } catch (err) {
    console.error("[rikka-site] error during shutdown:", err);
    process.exit(1);
  }
};
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
