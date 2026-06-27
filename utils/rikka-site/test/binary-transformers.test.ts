import { describe, it, expect } from "@rstest/core";
import {
  Site,
  CollectionKind,
  CollectionResource,
  cborTransformer,
  protobuf,
  type ProtobufMessage,
} from "../src/index.js";
import type { RequestContext, Repr } from "../src/index.js";

// ---------------------------------------------------------------------------
// CBOR encoder unit tests
// ---------------------------------------------------------------------------

describe("cborTransformer", () => {
  it("encodes null as 0xf6", async () => {
    const out = await cborTransformer.transform(
      { content: null, meta: {} },
      { path: "" },
    );
    const bytes = out.content as Uint8Array;
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(Array.from(bytes)).toEqual([0xf6]);
    expect(out.meta.type).toBe("application/cbor");
  });

  it("encodes undefined as 0xf7", async () => {
    const out = await cborTransformer.transform(
      { content: undefined, meta: {} },
      { path: "" },
    );
    expect(Array.from(out.content as Uint8Array)).toEqual([0xf7]);
  });

  it("encodes booleans", async () => {
    const t = await cborTransformer.transform(
      { content: true, meta: {} },
      { path: "" },
    );
    const f = await cborTransformer.transform(
      { content: false, meta: {} },
      { path: "" },
    );
    expect(Array.from(t.content as Uint8Array)).toEqual([0xf5]);
    expect(Array.from(f.content as Uint8Array)).toEqual([0xf4]);
  });

  it("encodes small unsigned integers inline", async () => {
    const out = await cborTransformer.transform(
      { content: 5, meta: {} },
      { path: "" },
    );
    expect(Array.from(out.content as Uint8Array)).toEqual([0x05]);
  });

  it("encodes 1-byte unsigned int (24-255) with 0x18 prefix", async () => {
    const out = await cborTransformer.transform(
      { content: 100, meta: {} },
      { path: "" },
    );
    expect(Array.from(out.content as Uint8Array)).toEqual([0x18, 100]);
  });

  it("encodes 2-byte unsigned int with 0x19 prefix", async () => {
    const out = await cborTransformer.transform(
      { content: 300, meta: {} },
      { path: "" },
    );
    expect(Array.from(out.content as Uint8Array)).toEqual([
      0x19, 0x01, 0x2c,
    ]);
  });

  it("encodes negative integers with major type 1", async () => {
    const out = await cborTransformer.transform(
      { content: -1, meta: {} },
      { path: "" },
    );
    expect(Array.from(out.content as Uint8Array)).toEqual([0x20]);
  });

  it("encodes floats as float64 (0xfb)", async () => {
    const out = await cborTransformer.transform(
      { content: 1.5, meta: {} },
      { path: "" },
    );
    const bytes = out.content as Uint8Array;
    expect(bytes[0]).toBe(0xfb);
    // 1.5 as float64 big-endian: 3f f8 00 00 00 00 00 00
    expect(Array.from(bytes.slice(1))).toEqual([
      0x3f, 0xf8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]);
  });

  it("encodes text strings as UTF-8 with major type 3", async () => {
    const out = await cborTransformer.transform(
      { content: "hi", meta: {} },
      { path: "" },
    );
    // "hi" → 0x62 (major 3, len 2) + 0x68 0x69
    expect(Array.from(out.content as Uint8Array)).toEqual([
      0x62, 0x68, 0x69,
    ]);
  });

  it("encodes Uint8Array as byte string (major type 2)", async () => {
    const out = await cborTransformer.transform(
      { content: new Uint8Array([1, 2, 3]), meta: {} },
      { path: "" },
    );
    // 0x43 (major 2, len 3) + 01 02 03
    expect(Array.from(out.content as Uint8Array)).toEqual([
      0x43, 0x01, 0x02, 0x03,
    ]);
  });

  it("encodes arrays with major type 4", async () => {
    const out = await cborTransformer.transform(
      { content: [1, 2], meta: {} },
      { path: "" },
    );
    // 0x82 (major 4, len 2) + 0x01 0x02
    expect(Array.from(out.content as Uint8Array)).toEqual([
      0x82, 0x01, 0x02,
    ]);
  });

  it("encodes objects as maps with major type 5", async () => {
    const out = await cborTransformer.transform(
      { content: { a: 1 }, meta: {} },
      { path: "" },
    );
    // 0xa1 (major 5, len 1) + "a" (0x61 0x61) + 1 (0x01)
    expect(Array.from(out.content as Uint8Array)).toEqual([
      0xa1, 0x61, 0x61, 0x01,
    ]);
  });

  it("encodes nested structures", async () => {
    const out = await cborTransformer.transform(
      { content: { list: [1, "x", true] }, meta: {} },
      { path: "" },
    );
    const bytes = out.content as Uint8Array;
    // map len 1: 0xa1
    // key "list": 0x64 0x6c 0x69 0x73 0x74
    // array len 3: 0x83
    // 1: 0x01, "x": 0x61 0x78, true: 0xf5
    expect(Array.from(bytes)).toEqual([
      0xa1, 0x64, 0x6c, 0x69, 0x73, 0x74,
      0x83, 0x01, 0x61, 0x78, 0xf5,
    ]);
  });
});

// ---------------------------------------------------------------------------
// protobuf factory tests
// ---------------------------------------------------------------------------

describe("protobuf(schema)", () => {
  it("returns a Transformer producing application/x-protobuf", async () => {
    const schema: ProtobufMessage = {
      encode: (msg) => new Uint8Array([0x08, Number((msg as { id: number }).id)]),
    };
    const xform = protobuf(schema);
    expect(xform.output).toEqual({ type: "raw", mime: "application/x-protobuf" });

    const out = await xform.transform(
      { content: { id: 42 }, meta: {} },
      { path: "" },
    ) as Repr;
    expect(out.content).toBeInstanceOf(Uint8Array);
    expect(Array.from(out.content as Uint8Array)).toEqual([0x08, 42]);
    expect(out.meta.type).toBe("application/x-protobuf");
  });

  it("is not registered by default (schema-based, opt-in)", () => {
    class ItemsKind extends CollectionKind {
      resolve(params: Record<string, string>) {
        const r = new ItemsResource();
        r.params = params;
        return r;
      }
    }
    class ItemsResource extends CollectionResource {
      async list(ctx: RequestContext): Promise<Repr> {
        return { content: [], meta: {} };
      }
      async create(ctx: RequestContext): Promise<Repr> {
        return { content: {}, meta: {} };
      }
    }
    const app = new Site({ items: new ItemsKind() });
    expect(app.registry.canProduce("application/x-protobuf")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// End-to-end: binary body flows through the pipeline as Uint8Array
// ---------------------------------------------------------------------------

describe("binary pipeline", () => {
  class ItemsKind extends CollectionKind {
    resolve(params: Record<string, string>) {
      const r = new ItemsResource();
      r.params = params;
      return r;
    }
  }
  class ItemsResource extends CollectionResource {
    async list(ctx: RequestContext): Promise<Repr> {
      return {
        content: [{ id: 1, name: "alpha" }, { id: 2, name: "beta" }],
        meta: {},
      };
    }
    async create(ctx: RequestContext): Promise<Repr> {
      return { content: { id: 0, name: "" }, meta: {} };
    }
  }

  it("returns Uint8Array body for ?accept=cbor", async () => {
    const app = new Site({ items: new ItemsKind() });
    const res = await app.handleRequest({
      method: "GET",
      path: "/items",
      acceptQuery: "cbor",
      headers: {},
    });
    expect(res.status).toBe(200);
    expect(res.headers["Content-Type"]).toBe("application/cbor");
    expect(res.body).toBeInstanceOf(Uint8Array);
    // First byte of a CBOR array of length 2: 0x82
    expect((res.body as Uint8Array)[0]).toBe(0x82);
  });

  it("returns Uint8Array body for ?accept=protobuf when registered", async () => {
    const schema: ProtobufMessage = {
      encode: () => new Uint8Array([0x08, 0x01]),
    };
    const app = new Site(
      { items: new ItemsKind() },
      { transformers: [protobuf(schema)] },
    );
    const res = await app.handleRequest({
      method: "GET",
      path: "/items",
      acceptQuery: "protobuf",
      headers: {},
    });
    expect(res.status).toBe(200);
    expect(res.headers["Content-Type"]).toBe("application/x-protobuf");
    expect(res.body).toBeInstanceOf(Uint8Array);
    expect(Array.from(res.body as Uint8Array)).toEqual([0x08, 0x01]);
  });

  it("cbor short name resolves via negotiate", async () => {
    const app = new Site({ items: new ItemsKind() });
    const res = await app.handleRequest({
      method: "GET",
      path: "/items",
      accept: "application/cbor",
      headers: {},
    });
    expect(res.headers["Content-Type"]).toBe("application/cbor");
    expect(res.body).toBeInstanceOf(Uint8Array);
  });
});
