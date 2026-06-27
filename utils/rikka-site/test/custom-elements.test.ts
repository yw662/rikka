/**
 * Tests for rikka-site custom element integration:
 * - class registry validation
 * - on-demand bundling and serving
 * - HTML transformer script injection
 * - static asset serving
 */

import { describe, it, expect, beforeEach, afterEach } from "@rstest/core";
import {
  Site,
  ReadOnlyKind,
  ReadOnlyResource,
  type HttpRequest,
  type RequestContext,
  type Repr,
} from "../src/index.js";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildCustomElementRegistry,
  invalidateCustomElementBundleCache,
} from "../src/custom-elements.js";
import { TestElement } from "./fixtures/elements-entry.js";

function makeRequest(overrides: Partial<HttpRequest>): HttpRequest {
  return {
    method: "GET",
    path: "/",
    headers: {},
    query: {},
    ...overrides,
  };
}

class BadElement {
  // no static tagName
}

/** A ReadOnly resource that returns an empty object — used as a placeholder root. */
class EmptyKind extends ReadOnlyKind {
  resolve(params: Record<string, string>) {
    const r = new EmptyResource();
    r.params = params;
    return r;
  }
}
class EmptyResource extends ReadOnlyResource {
  async content(ctx: RequestContext): Promise<Repr> {
    return { content: {}, meta: {} };
  }
}

describe("custom element registry", () => {
  it("builds a registry from defineElement classes", () => {
    const registry = buildCustomElementRegistry({ TestElement });
    expect(registry).toHaveLength(1);
    expect(registry[0]!.exportName).toBe("TestElement");
    expect(registry[0]!.tag).toBe("test-element");
  });

  it("throws when a class lacks a static tagName", () => {
    expect(() =>
      buildCustomElementRegistry({ BadElement: BadElement as any }),
    ).toThrow("static tagName");
  });
});

describe("custom element bundle serving", () => {
  const entryPath = join(process.cwd(), "test/fixtures/elements-entry.ts");

  beforeEach(() => {
    invalidateCustomElementBundleCache();
  });

  it("serves a bundled entry at /.well-known/assets/elements.js", async () => {
    const app = new Site(
      { "": new EmptyKind() },
      {
        customElements: { TestElement },
        customElementsEntry: entryPath,
      },
    );

    const response = await app.handleRequest(
      makeRequest({ path: "/.well-known/assets/elements.js" }),
    );
    expect(response.status).toBe(200);
    expect(response.headers["Content-Type"]).toContain("application/javascript");
    const body = response.body as string;
    expect(body.length).toBeGreaterThan(0);
    expect(body).toContain("test-element");
  });

  it("returns 404 when no entry is configured", async () => {
    const app = new Site(
      { "": new EmptyKind() },
      { customElements: { TestElement } },
    );
    const response = await app.handleRequest(
      makeRequest({ path: "/.well-known/assets/elements.js" }),
    );
    expect(response.status).toBe(404);
  });
});

describe("static asset serving", () => {
  let assetDir: string;

  beforeEach(() => {
    assetDir = join(tmpdir(), `rikka-site-asset-test-${Date.now()}`);
    mkdirSync(assetDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(assetDir, { recursive: true, force: true });
  });

  it("serves registered text assets", async () => {
    const robotsPath = join(assetDir, "robots.txt");
    writeFileSync(robotsPath, "User-agent: *\nDisallow:\n");

    const app = new Site(
      { "": new EmptyKind() },
      {
        assets: {
          "robots.txt": { source: robotsPath },
        },
      },
    );

    const response = await app.handleRequest(
      makeRequest({ path: "/.well-known/assets/robots.txt" }),
    );
    expect(response.status).toBe(200);
    expect(response.headers["Content-Type"]).toContain("text/plain");
    expect(new TextDecoder().decode(response.body as Uint8Array)).toContain(
      "User-agent",
    );
  });

  it("serves binary assets with inferred content type", async () => {
    const iconPath = join(assetDir, "favicon.ico");
    writeFileSync(iconPath, Buffer.from([0x00, 0x00, 0x01, 0x00]));

    const app = new Site(
      { "": new EmptyKind() },
      {
        assets: {
          "favicon.ico": { source: iconPath },
        },
      },
    );

    const response = await app.handleRequest(
      makeRequest({ path: "/.well-known/assets/favicon.ico" }),
    );
    expect(response.status).toBe(200);
    expect(response.headers["Content-Type"]).toBe("image/x-icon");
    expect(response.body).toBeInstanceOf(Uint8Array);
  });

  it("returns 404 for unknown assets", async () => {
    const app = new Site(
      { "": new EmptyKind() },
      {},
    );
    const response = await app.handleRequest(
      makeRequest({ path: "/.well-known/assets/missing.js" }),
    );
    expect(response.status).toBe(404);
  });
});

describe("HTML transformer asset links", () => {
  const entryPath = join(process.cwd(), "test/fixtures/elements-entry.ts");

  beforeEach(() => {
    invalidateCustomElementBundleCache();
  });

  it("injects a relative custom element script", async () => {
    const app = new Site(
      { "": new EmptyKind() },
      {
        customElements: { TestElement },
        customElementsEntry: entryPath,
      },
    );

    const response = await app.handleRequest(
      makeRequest({ path: "/", headers: { accept: "text/html" } }),
    );
    expect(response.status).toBe(200);
    const html = response.body as string;
    expect(html).toContain('src="./.well-known/assets/elements.js"');
  });

  it("uses ../.well-known/assets for nested paths", async () => {
    const app = new Site(
      {
        articles: new EmptyKind(),
      },
      {
        customElements: { TestElement },
        customElementsEntry: entryPath,
      },
    );

    const response = await app.handleRequest(
      makeRequest({ path: "/articles", headers: { accept: "text/html" } }),
    );
    expect(response.status).toBe(200);
    const html = response.body as string;
    expect(html).toContain('src="../.well-known/assets/elements.js"');
  });

  it("injects a favicon link when favicon.ico asset is registered", async () => {
    const iconPath = join(tmpdir(), `rikka-favicon-${Date.now()}.ico`);
    writeFileSync(iconPath, "<svg></svg>");

    const app = new Site(
      { "": new EmptyKind() },
      {
        assets: {
          "favicon.ico": { source: iconPath },
        },
      },
    );

    const response = await app.handleRequest(
      makeRequest({ path: "/", headers: { accept: "text/html" } }),
    );
    expect(response.status).toBe(200);
    const html = response.body as string;
    expect(html).toContain('<link rel="icon" href="./.well-known/assets/favicon.ico">');
  });
});
