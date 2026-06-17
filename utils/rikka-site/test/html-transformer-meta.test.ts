import { describe, it, expect } from "@rstest/core";
import { Site, Collection, createHtmlTransformer } from "../src/index.js";
import type { Repr } from "../src/representation.js";

describe("HTML transformer meta / lang / noscript / openGraph", () => {
  const Articles = Collection(() => ({
    list: () => [{ id: 1, title: "Hello" }],
    element: "blog-article-list",
  }));

  const app = new Site({ articles: Articles() });
  const resource = app.resolve("/articles")!;
  const repr: Repr = {
    content: [{ id: 1, title: "Hello" }],
    meta: { type: "application/json" },
  };

  it("omits html lang when neither repr.meta.lang nor config.lang is set", async () => {
    const transformer = createHtmlTransformer();
    const result = await transformer.transform(repr, { resource });
    expect(result.content).not.toContain("<html lang=");
    expect(result.content).toContain("<html>");
  });

  it("uses repr.meta.lang over config.lang", async () => {
    const transformer = createHtmlTransformer({ lang: "en" });
    const result = await transformer.transform(
      { ...repr, meta: { ...repr.meta, lang: "zh-CN" } },
      { resource },
    );
    expect(result.content).toContain('<html lang="zh-CN">');
  });

  it("falls back to config.lang", async () => {
    const transformer = createHtmlTransformer({ lang: "ja" });
    const result = await transformer.transform(repr, { resource });
    expect(result.content).toContain('<html lang="ja">');
  });

  it("injects custom <meta name=...> tags", async () => {
    const transformer = createHtmlTransformer({
      meta: (_path, _kind, data) => ({
        description: `Articles: ${(data as { title: string }[]).length}`,
        robots: "index,follow",
      }),
    });
    const result = await transformer.transform(repr, { resource });
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
    const result = await transformer.transform(repr, { resource });
    expect(result.content).toContain(
      '<meta property="og:title" content="Articles">',
    );
    expect(result.content).toContain(
      '<meta property="og:description" content="List of articles">',
    );
  });

  it("injects custom Open Graph tags from function", async () => {
    const transformer = createHtmlTransformer({
      openGraph: (_path, kind, data) => ({
        "og:type": kind === "Collection" ? "website" : "article",
        "og:count": String((data as unknown[]).length),
      }),
    });
    const result = await transformer.transform(repr, { resource });
    expect(result.content).toContain(
      '<meta property="og:type" content="website">',
    );
    expect(result.content).toContain('<meta property="og:count" content="1">');
  });

  it("injects a noscript fallback with raw data when enabled", async () => {
    const transformer = createHtmlTransformer({ noscript: true });
    const result = await transformer.transform(repr, { resource });
    expect(result.content).toContain("<noscript>");
    expect(result.content).toContain("Hello");
    expect(result.content).toContain("</noscript>");
  });

  it("does not inject noscript by default", async () => {
    const transformer = createHtmlTransformer();
    const result = await transformer.transform(repr, { resource });
    expect(result.content).not.toContain("<noscript>");
  });
});
