import { describe, it, expect } from "@rstest/core";
import {
  CollectionKind,
  ItemKind,
  Site,
  jsonBody,
  textBody,
  bytesBody,
  createRequestContext,
  handleWebRequest,
} from "../src/index.js";
import type { Repr, RequestContext } from "../src/index.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function readStream(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  if (chunks.length === 0) return new Uint8Array(0);
  if (chunks.length === 1) return chunks[0]!;
  const total = chunks.reduce((n, c) => n + c.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

async function streamToText(stream: ReadableStream<Uint8Array>): Promise<string> {
  return new TextDecoder().decode(await readStream(stream));
}

/** Read any HttpResponse body shape as a string. */
async function bodyText(
  body: string | Uint8Array | ReadableStream<Uint8Array>,
): Promise<string> {
  if (typeof body === "string") return body;
  if (body instanceof Uint8Array) return new TextDecoder().decode(body);
  return streamToText(body);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Streaming request body", () => {
  it("ctx.json() lazily parses a JSON body stream", async () => {
    class Echo extends CollectionKind {
      async list(ctx: RequestContext): Promise<Repr> {
        return { content: [], meta: {} };
      }
      async create(ctx: RequestContext): Promise<Repr> {
        const body = await ctx.json<{ name: string; age: number }>();
        return { content: { received: body }, meta: {} };
      }
    }

    const app = new Site({ users: new Echo() });
    const response = await app.handleRequest({
      method: "POST",
      path: "/users",
      accept: "application/json",
      body: jsonBody({ name: "Alice", age: 30 }),
    });

    expect(response.status).toBe(200);
    const parsed = JSON.parse(await bodyText(response.body));
    expect(parsed.received).toEqual({ name: "Alice", age: 30 });
  });

  it("ctx.text() lazily reads a text body stream", async () => {
    class Echo extends CollectionKind {
      async list(ctx: RequestContext): Promise<Repr> {
        return { content: [], meta: {} };
      }
      async create(ctx: RequestContext): Promise<Repr> {
        const text = await ctx.text();
        return { content: { length: text.length }, meta: {} };
      }
    }

    const app = new Site({ echo: new Echo() });
    const response = await app.handleRequest({
      method: "POST",
      path: "/echo",
      accept: "application/json",
      body: textBody("hello world"),
    });

    expect(response.status).toBe(200);
    const parsed = JSON.parse(await bodyText(response.body));
    expect(parsed.length).toBe(11);
  });

  it("ctx.bytes() lazily reads raw bytes", async () => {
    const raw = new Uint8Array([0x00, 0x01, 0x02, 0xff]);
    class Echo extends CollectionKind {
      async list(ctx: RequestContext): Promise<Repr> {
        return { content: [], meta: {} };
      }
      async create(ctx: RequestContext): Promise<Repr> {
        const bytes = await ctx.bytes();
        return { content: { byteLength: bytes.byteLength }, meta: {} };
      }
    }

    const app = new Site({ echo: new Echo() });
    const response = await app.handleRequest({
      method: "POST",
      path: "/echo",
      accept: "application/json",
      body: bytesBody(raw),
    });

    expect(response.status).toBe(200);
    const parsed = JSON.parse(await bodyText(response.body));
    expect(parsed.byteLength).toBe(4);
  });

  it("ctx.json() caches the result — multiple calls return the same value", async () => {
    let callCount = 0;
    class Echo extends CollectionKind {
      async list(ctx: RequestContext): Promise<Repr> {
        return { content: [], meta: {} };
      }
      async create(ctx: RequestContext): Promise<Repr> {
        callCount++;
        const a = await ctx.json();
        const b = await ctx.json();
        return { content: { same: a === b, a, b }, meta: {} };
      }
    }

    const app = new Site({ echo: new Echo() });
    const response = await app.handleRequest({
      method: "POST",
      path: "/echo",
      accept: "application/json",
      body: jsonBody({ x: 1 }),
    });

    expect(response.status).toBe(200);
    const parsed = JSON.parse(await bodyText(response.body));
    expect(parsed.same).toBe(true);
    expect(parsed.a).toEqual({ x: 1 });
    expect(parsed.b).toEqual({ x: 1 });
  });

  it("ctx.json() returns undefined when there is no body", async () => {
    class Echo extends CollectionKind {
      async list(ctx: RequestContext): Promise<Repr> {
        return { content: [], meta: {} };
      }
      async create(ctx: RequestContext): Promise<Repr> {
        const body = await ctx.json();
        return { content: { body }, meta: {} };
      }
    }

    const app = new Site({ echo: new Echo() });
    const response = await app.handleRequest({
      method: "POST",
      path: "/echo",
      accept: "application/json",
      // no body field
    });

    expect(response.status).toBe(200);
    const parsed = JSON.parse(await bodyText(response.body));
    expect(parsed.body).toBeUndefined();
  });

  it("GET requests don't read the body — handler that ignores body works fine", async () => {
    class Users extends CollectionKind {
      async list(ctx: RequestContext): Promise<Repr> {
        return { content: [{ id: 1 }], meta: {} };
      }
      async create(ctx: RequestContext): Promise<Repr> {
        return { content: await ctx.json(), meta: {} };
      }
    }

    const app = new Site({ users: new Users() });
    const response = await app.handleRequest({
      method: "GET",
      path: "/users",
      accept: "application/json",
    });

    expect(response.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------

describe("Streaming response body", () => {
  it("handler can return a ReadableStream as Repr content", async () => {
    const data = new TextEncoder().encode("streamed content");
    class Stream extends ItemKind {
      async content(ctx: RequestContext): Promise<Repr> {
        return {
          content: bytesBody(data),
          meta: { type: "application/octet-stream" },
        };
      }
    }

    const app = new Site({ stream: new Stream() });
    const response = await app.handleRequest({
      method: "GET",
      path: "/stream",
    });

    expect(response.status).toBe(200);
    expect(response.headers["Content-Type"]).toBe("application/octet-stream");
    expect(response.body).toBeInstanceOf(ReadableStream);

    const text = await streamToText(response.body as ReadableStream<Uint8Array>);
    expect(text).toBe("streamed content");
  });

  it("handler can return a large stream without buffering", async () => {
    // Create a stream that produces 10 chunks of 1KB each
    const totalChunks = 10;
    const chunkSize = 1024;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (let i = 0; i < totalChunks; i++) {
          controller.enqueue(new Uint8Array(chunkSize).fill(i));
        }
        controller.close();
      },
    });

    class Stream extends ItemKind {
      async content(ctx: RequestContext): Promise<Repr> {
        return {
          content: stream,
          meta: { type: "application/octet-stream" },
        };
      }
    }

    const app = new Site({ big: new Stream() });
    const response = await app.handleRequest({
      method: "GET",
      path: "/big",
    });

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(ReadableStream);

    const bytes = await readStream(response.body as ReadableStream<Uint8Array>);
    expect(bytes.byteLength).toBe(totalChunks * chunkSize);
    // Verify chunk boundaries
    expect(bytes[0]).toBe(0);
    expect(bytes[chunkSize]).toBe(1);
    expect(bytes[chunkSize * 9]).toBe(9);
  });
});

// ---------------------------------------------------------------------------

describe("createRequestContext helper", () => {
  it("accepts a plain value for body (auto-wrapped as JSON stream)", async () => {
    const ctx = createRequestContext({
      method: "POST",
      path: "/test",
      body: { name: "Bob" },
    });

    const result = await ctx.json<{ name: string }>();
    expect(result).toEqual({ name: "Bob" });
  });

  it("accepts a ReadableStream for body", async () => {
    const ctx = createRequestContext({
      method: "POST",
      path: "/test",
      body: jsonBody({ name: "Alice" }),
    });

    const result = await ctx.json<{ name: string }>();
    expect(result).toEqual({ name: "Alice" });
  });

  it("provides default values for omitted fields", async () => {
    const ctx = createRequestContext({});
    expect(ctx.method).toBe("GET");
    expect(ctx.path).toBe("/");
    expect(ctx.params).toEqual({});
    expect(ctx.query).toEqual({});
    expect(ctx.headers).toEqual({});
    expect(ctx.body).toBeUndefined();

    const json = await ctx.json();
    expect(json).toBeUndefined();

    const text = await ctx.text();
    expect(text).toBe("");

    const bytes = await ctx.bytes();
    expect(bytes.byteLength).toBe(0);
  });

  it("text() and bytes() return the same underlying data", async () => {
    const ctx = createRequestContext({
      body: textBody("hello"),
    });

    const text = await ctx.text();
    const bytes = await ctx.bytes();

    expect(text).toBe("hello");
    expect(new TextDecoder().decode(bytes)).toBe("hello");
  });
});

// ---------------------------------------------------------------------------

describe("handleWebRequest with streaming", () => {
  it("passes request body as a stream to the handler", async () => {
    class Echo extends CollectionKind {
      async list(ctx: RequestContext): Promise<Repr> {
        return { content: [], meta: {} };
      }
      async create(ctx: RequestContext): Promise<Repr> {
        const body = await ctx.json<{ name: string }>();
        return { content: body, meta: {} };
      }
    }

    const app = new Site({ echo: new Echo() });
    const request = new Request("http://localhost/echo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ name: "Charlie" }),
    });

    const response = await handleWebRequest(app, request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ name: "Charlie" });
  });

  it("streams response body through to the Web Response", async () => {
    const data = new TextEncoder().encode("web stream test");
    class Stream extends ItemKind {
      async content(ctx: RequestContext): Promise<Repr> {
        return {
          content: bytesBody(data),
          meta: { type: "application/octet-stream" },
        };
      }
    }

    const app = new Site({ stream: new Stream() });
    const request = new Request("http://localhost/stream");
    const response = await handleWebRequest(app, request);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/octet-stream");

    const body = await response.arrayBuffer();
    expect(new Uint8Array(body)).toEqual(data);
  });
});
