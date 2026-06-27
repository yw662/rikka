import { describe, it, expect } from "@rstest/core";
import { Site, CollectionKind, CollectionResource, createHtmlTransformer } from "../src/index.js";
import type { RequestContext, Repr } from "../src/index.js";

describe("HTML transformer meta / lang / noscript / openGraph", () => {
  class ArticlesKind extends CollectionKind {
    resolve(params: Record<string, string>) {
      const r = new ArticlesResource();
      r.params = params;
      return r;
    }
  }
  class ArticlesResource extends CollectionResource {
    element = "blog-article-list";
    async list(ctx: RequestContext): Promise<Repr> {
      return { content: [{ id: 1, title: "Hello" }], meta: {} };
    }
    async create(ctx: RequestContext): Promise<Repr> {
      return { content: { id: 0, title: "" }, meta: {} };
    }
  }

  const app = new Site({ articles: new ArticlesKind() });
  const resource = app.resolve("/articles")!;
  const path = resource.path;
  const repr: Repr = {
    content: [{ id: 1, title: "Hello" }],
    meta: { type: "application/json" },
  };

  it("omits html lang when neither repr.meta.lang nor config.lang is set", async () => {
    const transformer = createHtmlTransformer();
    const result = await transformer.transform(repr, { path, element: resource.element });
    expect(result.content).not.toContain("<html lang=");
    expect(result.content).toContain("<html>");
  });

  it("uses repr.meta.lang over config.lang", async () => {
    const transformer = createHtmlTransformer({ lang: "en" });
    const result = await transformer.transform(
      { ...repr, meta: { ...repr.meta, lang: "zh-CN" } },
      { path, element: resource.element },
    );
    expect(result.content).toContain('<html lang="zh-CN">');
  });

  it("falls back to config.lang", async () => {
    const transformer = createHtmlTransformer({ lang: "ja" });
    const result = await transformer.transform(repr, { path, element: resource.element });
    expect(result.content).toContain('<html lang="ja">');
  });

  it("injects custom <meta name=...> tags", async () => {
    const transformer = createHtmlTransformer({
      meta: (_path, data) => ({
        description: `Articles: ${(data as { title: string }[]).length}`,
        robots: "index,follow",
      }),
    });
    const result = await transformer.transform(repr, { path, element: resource.element });
    expect(result.content).toContain(
      '<meta name="description" content="Articles: 1">',
    );
    expect(result.content).toContain(
      '<meta name="robots" content="index,follow">',
    );
  });

  it("injects Open Graph tags when openGraph is true", async () => {
    const transformer = createHtmlTransformer({
      title: "Articles",
      meta: () => ({ description: "List of articles" }),
      openGraph: true,
    });
    const result = await transformer.transform(repr, { path, element: resource.element });
    expect(result.content).toContain(
      '<meta property="og:title" content="Articles">',
    );
    expect(result.content).toContain(
      '<meta property="og:description" content="List of articles">',
    );
  });

  it("injects custom Open Graph tags from function", async () => {
    const transformer = createHtmlTransformer({
      openGraph: (path, data) => ({
        "og:type": path === "/articles" ? "website" : "article",
        "og:count": String((data as unknown[]).length),
      }),
    });
    const result = await transformer.transform(repr, { path, element: resource.element });
    expect(result.content).toContain(
      '<meta property="og:type" content="website">',
    );
    expect(result.content).toContain('<meta property="og:count" content="1">');
  });

  it("injects a noscript fallback with raw data when enabled", async () => {
    const transformer = createHtmlTransformer({ noscript: true });
    const result = await transformer.transform(repr, { path, element: resource.element });
    expect(result.content).toContain("<noscript>");
    expect(result.content).toContain("Hello");
    expect(result.content).toContain("</noscript>");
  });

  it("does not inject noscript by default", async () => {
    const transformer = createHtmlTransformer();
    const result = await transformer.transform(repr, { path, element: resource.element });
    expect(result.content).not.toContain("<noscript>");
  });
});
