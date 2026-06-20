import { describe, it, expect } from "@rstest/core";
import { Site, CollectionKind, createHtmlTransformer } from "../src/index.js";
import type { RequestContext, Repr } from "../src/index.js";

describe("HTML transformer serialization", () => {
  class Articles extends CollectionKind {
    element = "blog-article-list";
    async list(ctx: RequestContext): Promise<Repr> {
      return { content: [{ id: 1, title: "Hello" }], meta: {} };
    }
    async create(ctx: RequestContext): Promise<Repr> {
      return { content: { id: 2, title: "New" }, meta: {} };
    }
  }

  const app = new Site({ articles: new Articles() });

  async function renderHtml(serialization?: "data-attr" | "jsonld" | "both") {
    const transformer = createHtmlTransformer({
      layoutElement: "blog-layout",
      serialization,
    });
    app.registry.register(transformer);

    const resolved = app.resolve("/articles")!;
    const resource = resolved.kind;
    const path = resolved.path;
    const repr: Repr = { content: [{ id: 1, title: "Hello" }], meta: {} };
    const result = await transformer.transform(repr, { path, element: resource.element });

    app.registry.unregister(transformer);
    return result.content as string;
  }

  it("data-attr emits data-resource and no head JSON-LD", async () => {
    const html = await renderHtml("data-attr");
    expect(html).toContain("data-resource=");
    expect(html).not.toContain('<script type="application/ld+json">');
  });

  it("jsonld emits head JSON-LD and no data-resource", async () => {
    const html = await renderHtml("jsonld");
    expect(html).toContain('<script type="application/ld+json">');
    expect(html).not.toContain("data-resource=");
  });

  it("both emits data-resource and head JSON-LD", async () => {
    const html = await renderHtml("both");
    expect(html).toContain("data-resource=");
    expect(html).toContain('<script type="application/ld+json">');
  });

  it("default serialization is data-attr", async () => {
    const html = await renderHtml(undefined);
    expect(html).toContain("data-resource=");
    expect(html).not.toContain('<script type="application/ld+json">');
  });
});
