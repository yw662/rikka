import { describe, it, expect, beforeEach, afterEach } from "@rstest/core";
import { findResourceData, findResourceDataAsync } from "../src/sdk/hydration.js";
import {
  matchRoute,
  readSitemapFromDom,
  createRouter,
} from "../src/sdk/router.js";
import type { Sitemap } from "../src/sdk/router.js";

beforeEach(() => {
  document.body.innerHTML = "";
  document.head.innerHTML = "";
});

describe("findResourceData", () => {
  it("reads data-resource attribute", () => {
    const el = document.createElement("div");
    el.setAttribute("data-resource", JSON.stringify({ id: 1 }));
    document.body.appendChild(el);
    expect(findResourceData(el)).toEqual({ id: 1 });
  });

  it("reads DSDOM template JSON", () => {
    const el = document.createElement("div");
    el.innerHTML = `<template shadowrootmode="open"><script type="application/json">[1,2,3]</script></template>`;
    document.body.appendChild(el);
    expect(findResourceData(el)).toEqual([1, 2, 3]);
  });

  it("reads global JSON-LD script and unwraps @graph", () => {
    const script = document.createElement("script");
    script.setAttribute("type", "application/ld+json");
    script.textContent = JSON.stringify({ "@graph": [{ id: 1 }] });
    document.head.appendChild(script);
    expect(findResourceData()).toEqual([{ id: 1 }]);
  });

  it("returns JSON-LD object verbatim when no @graph", () => {
    const script = document.createElement("script");
    script.setAttribute("type", "application/ld+json");
    script.textContent = JSON.stringify({ id: 2 });
    document.head.appendChild(script);
    expect(findResourceData()).toEqual({ id: 2 });
  });

  it("returns null when no data is found", () => {
    expect(findResourceData()).toBeNull();
  });
});

describe("findResourceDataAsync", () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns sync data immediately when available", async () => {
    const el = document.createElement("div");
    el.setAttribute("data-resource", JSON.stringify({ a: 1 }));
    expect(await findResourceDataAsync(el)).toEqual({ a: 1 });
  });

  it("fetches JSON when sync data is missing", async () => {
    globalThis.fetch = async (input: RequestInfo | URL) => {
      const url = new URL(input.toString(), "http://localhost");
      expect(url.searchParams.get("accept")).toBe("json");
      return {
        ok: true,
        json: async () => [{ b: 2 }],
      } as unknown as Response;
    };
    expect(await findResourceDataAsync()).toEqual([{ b: 2 }]);
  });

  it("returns null when fetch fails", async () => {
    globalThis.fetch = async () => ({ ok: false, json: async () => ({}) } as unknown as Response);
    expect(await findResourceDataAsync()).toBeNull();
  });
});

describe("matchRoute", () => {
  const sitemap: Sitemap = {
    routes: [
      {
        path: "articles",
        kind: "Collection",
        element: "blog-article-list",
        children: [
          { path: ":articleId", kind: "Item", element: "blog-article-detail" },
        ],
      },
      { path: "users", kind: "Collection", element: "blog-user-list" },
    ],
  };

  it("matches an exact route", () => {
    expect(matchRoute(sitemap, "/users")).toEqual({
      route: sitemap.routes[1],
      params: {},
    });
  });

  it("matches a parameterized child route", () => {
    expect(matchRoute(sitemap, "/articles/42")).toEqual({
      route: sitemap.routes[0]!.children![0],
      params: { articleId: "42" },
    });
  });

  it("returns null for unmatched paths", () => {
    expect(matchRoute(sitemap, "/nope")).toBeNull();
  });
});

describe("readSitemapFromDom", () => {
  it("reads sitemap from the data-sitemap script", () => {
    const script = document.createElement("script");
    script.setAttribute("type", "application/json");
    script.setAttribute("data-sitemap", "");
    script.textContent = JSON.stringify({ routes: [{ path: "", kind: "ReadOnly", element: "blog-home" }] });
    document.head.appendChild(script);
    expect(readSitemapFromDom()).toEqual({
      routes: [{ path: "", kind: "ReadOnly", element: "blog-home" }],
    });
  });

  it("returns null when no sitemap script exists", () => {
    expect(readSitemapFromDom()).toBeNull();
  });
});

describe("createRouter", () => {
  const sitemap: Sitemap = {
    routes: [{ path: "articles", kind: "Collection", element: "blog-article-list" }],
  };

  const originalFetch = globalThis.fetch;
  const originalPushState = history.pushState;

  beforeEach(() => {
    globalThis.fetch = async () => ({
      ok: true,
      text: async () =>
        `<html><head><title>Articles</title></head><body><rikka-resource path="/articles" data-resource="[]"></rikka-resource></body></html>`,
    } as unknown as Response);
    history.pushState = () => {};
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    history.pushState = originalPushState;
  });

  it("intercepts internal link clicks", () => {
    const router = createRouter(sitemap);
    router.start();
    const a = document.createElement("a");
    a.setAttribute("href", "/articles");
    document.body.appendChild(a);

    let fetchCalled = false;
    globalThis.fetch = async () => {
      fetchCalled = true;
      return {
        ok: true,
        text: async () =>
          `<html><head><title>Articles</title></head><body><rikka-resource path="/articles" data-resource="[]"></rikka-resource></body></html>`,
      } as unknown as Response;
    };

    a.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(fetchCalled).toBe(true);
    router.stop();
  });

  it("does not intercept external links", () => {
    const router = createRouter(sitemap);
    router.start();
    const a = document.createElement("a");
    a.setAttribute("href", "https://example.com");
    document.body.appendChild(a);

    let fetchCalled = false;
    globalThis.fetch = async () => {
      fetchCalled = true;
      return { ok: true, text: async () => "" } as unknown as Response;
    };

    a.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(fetchCalled).toBe(false);
    router.stop();
  });
});

import "../src/sdk/index.js";

describe("SDK index", () => {
  it("exposes __rikka on window", () => {
    const rikka = (window as any).__rikka;
    expect(rikka).toBeDefined();
    expect(typeof rikka.findResourceData).toBe("function");
    expect(typeof rikka.findResourceDataAsync).toBe("function");
    expect(typeof rikka.matchRoute).toBe("function");
    expect(typeof rikka.createRouter).toBe("function");
    expect(typeof rikka.navigate).toBe("function");
    expect(typeof rikka.readSitemapFromDom).toBe("function");
  });
});
