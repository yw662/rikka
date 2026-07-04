/**
 * Node server entry point — `src/index.ts`.
 *
 * Verifies the minimal Node.js server starts and serves all 6 Kinds +
 * auth + 404 + CORS preflight. This is the entry users run with
 * `pnpm dev` / `pnpm start` (or `node --import tsx src/index.ts`) — no
 * wrangler, no edge runtime.
 *
 * The entry imports `./resources.js` and calls `app.listen()` to start
 * the server. We capture the port via the `PORT` env var to keep tests
 * deterministic.
 */

import { describe, it, expect, afterAll } from "@rstest/core";
import * as http from "node:http";
import { probe } from "./helpers.js";

let port: number;

describe("src/index.ts (Node entry)", () => {
  // Start the entry in a child process so the test process isn't the server.
  const PORT = 4100 + Math.floor(Math.random() * 200);
  let serverProc: ReturnType<typeof import("node:child_process").spawn> | null = null;

  afterAll(async () => {
    if (serverProc && !serverProc.killed) {
      serverProc.kill("SIGTERM");
      await new Promise((r) => setTimeout(r, 200));
    }
  });

  it("starts a server and serves all six Kinds + auth + 404", async () => {
    const { spawn } = await import("node:child_process");
    const tsxBin = `${process.cwd()}/node_modules/.bin/tsx`;

    serverProc = spawn(tsxBin, ["src/index.ts"], {
      env: { ...process.env, PORT: String(PORT) },
      stdio: ["ignore", "pipe", "pipe"],
    });

    // Wait for "listening on" line
    await new Promise<void>((resolve, reject) => {
      const onData = (chunk: Buffer) => {
        const s = chunk.toString("utf8");
        if (s.includes("listening on")) {
          serverProc?.stdout?.off("data", onData);
          resolve();
        }
      };
      serverProc!.stdout!.on("data", onData);
      serverProc!.stderr!.on("data", (c) => process.stderr.write(c));
      setTimeout(() => reject(new Error("server didn't start in 5s")), 5000);
    });

    port = PORT;

    // 1. ReadOnly — blog home
    const home = await probe(port, { path: "/", headers: { accept: "text/html" } });
    expect(home.status).toBe(200);
    expect(home.headers["content-type"]).toContain("text/html");
    expect(home.body).toContain("<!DOCTYPE html>");
    // Default HTML transformer injects SDK, custom element bundle and favicon
    expect(home.body).toContain('src="./.well-known/sdk/sdk.js"');
    expect(home.body).toContain('src="./.well-known/assets/elements.js"');
    expect(home.body).toContain('<link rel="icon" href="./.well-known/assets/favicon.ico">');

    // 2. Collection — articles list (JSON)
    const articles = await probe(port, {
      path: "/articles",
      headers: { accept: "application/json" },
    });
    expect(articles.status).toBe(200);
    expect(articles.headers["content-type"]).toContain("application/json");
    const list = JSON.parse(articles.body);
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);

    // 3. Item — single article
    const article = await probe(port, {
      path: "/articles/1",
      headers: { accept: "application/json" },
    });
    expect(article.status).toBe(200);
    const item = JSON.parse(article.body);
    expect(item.id).toBe(1);
    expect(item.title).toBe("Hello Rikka");

    // 4. Singleton — settings
    const settings = await probe(port, {
      path: "/settings",
      headers: { accept: "application/json" },
    });
    expect(settings.status).toBe(200);
    const s = JSON.parse(settings.body);
    expect(s.siteName).toBe("Rikka Blog");
    expect(s.theme).toBe("dark");

    // 5. ReadOnly — dashboard
    const dash = await probe(port, {
      path: "/dashboard",
      headers: { accept: "application/json" },
    });
    expect(dash.status).toBe(200);
    const d = JSON.parse(dash.body);
    expect(d.articleCount).toBeGreaterThan(0);

    // 6. Action — search (auth required)
    const searchNoAuth = await probe(port, {
      method: "POST",
      path: "/actions/search",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: "Rikka" }),
    });
    expect(searchNoAuth.status).toBe(401);

    const searchWithAuth = await probe(port, {
      method: "POST",
      path: "/actions/search",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        authorization: "Bearer reader-token",
      },
      body: JSON.stringify({ query: "Rikka" }),
    });
    expect(searchWithAuth.status).toBe(200);
    const results = JSON.parse(searchWithAuth.body);
    expect(results.length).toBeGreaterThan(0);

    // 7. 404 for unknown path
    const nf = await probe(port, { path: "/no-such-thing" });
    expect(nf.status).toBe(404);

    // 8. CORS preflight
    const pre = await probe(port, {
      method: "OPTIONS",
      path: "/articles",
      headers: {
        origin: "https://example.com",
        "access-control-request-method": "POST",
      },
    });
    expect(pre.status).toBe(204);
    expect(pre.headers["access-control-allow-origin"]).toBe("*");
    expect(pre.headers["access-control-allow-methods"]).toContain("POST");

    // 10. Mutating endpoints (writes require auth — Issue 1 fix)
    const created = await probe(port, {
      method: "POST",
      path: "/articles",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        authorization: "Bearer admin-token",
      },
      body: JSON.stringify({ title: "node-entry test", body: "x", tags: ["test"] }),
    });
    expect(created.status).toBe(201);
    const createdLoc = created.headers["location"];
    expect(createdLoc).toBeTruthy();

    const got = await probe(port, {
      path: `/articles/${createdLoc}`,
      headers: { accept: "application/json" },
    });
    expect(got.status).toBe(200);
    expect(JSON.parse(got.body).title).toBe("node-entry test");

    const deleted = await probe(port, {
      method: "DELETE",
      path: `/articles/${createdLoc}`,
      headers: { authorization: "Bearer admin-token" },
    });
    expect(deleted.status).toBe(204);

    // 11. 404 on second DELETE (HttpError 404 from handler)
    const deletedAgain = await probe(port, {
      method: "DELETE",
      path: `/articles/${createdLoc}`,
      headers: { authorization: "Bearer admin-token" },
    });
    expect(deletedAgain.status).toBe(404);

    // 12. 405 for wrong method (auth required first, then method check)
    const wrong = await probe(port, {
      method: "DELETE",
      path: "/users",
      headers: { authorization: "Bearer admin-token" },
    });
    expect(wrong.status).toBe(405);
  }, 15000);
});
