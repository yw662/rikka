import { describe, it, expect } from "@rstest/core";
import {
  EventsKind,
  createInMemoryEventSource,
  formatSseEvent,
  type SseEvent,
} from "../src/index.js";
import type { RequestContext } from "../src/context.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCtx(overrides: Partial<RequestContext> = {}): RequestContext {
  return {
    method: "GET",
    path: "/events/test",
    params: { channelId: "test" },
    query: {},
    headers: {},
    json: async () => ({}),
    text: async () => "",
    bytes: async () => new Uint8Array(),
    ...overrides,
  } as RequestContext;
}

async function readStream(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.length;
  }
  return new TextDecoder().decode(merged);
}

const CHANNEL = "test";

// ---------------------------------------------------------------------------
// formatSseEvent tests
// ---------------------------------------------------------------------------

describe("formatSseEvent", () => {
  it("formats basic data event", () => {
    const result = formatSseEvent({ data: "hello" });
    expect(result).toBe("data: hello\n\n");
  });

  it("formats event with type", () => {
    const result = formatSseEvent({ data: "hello", event: "greeting" });
    expect(result).toBe("event: greeting\ndata: hello\n\n");
  });

  it("formats event with id", () => {
    const result = formatSseEvent({ data: "hello", id: "42" });
    expect(result).toBe("data: hello\nid: 42\n\n");
  });

  it("formats event with retry", () => {
    const result = formatSseEvent({ data: "hello", retry: 5000 });
    expect(result).toBe("data: hello\nretry: 5000\n\n");
  });

  it("JSON-stringifies non-string data", () => {
    const result = formatSseEvent({ data: { foo: "bar", n: 42 } });
    expect(result).toBe('data: {"foo":"bar","n":42}\n\n');
  });

  it("splits multi-line data into multiple data: lines", () => {
    const result = formatSseEvent({ data: "line1\nline2\nline3" });
    expect(result).toBe("data: line1\ndata: line2\ndata: line3\n\n");
  });

  it("formats complete event with all fields", () => {
    const result = formatSseEvent({
      data: "hello",
      event: "message",
      id: "100",
      retry: 3000,
    });
    expect(result).toBe("event: message\ndata: hello\nid: 100\nretry: 3000\n\n");
  });
});

// ---------------------------------------------------------------------------
// EventsKind tests
// ---------------------------------------------------------------------------

describe("EventsKind", () => {
  it("uses self-referencing :channelId catch-all children", () => {
    const kind = new EventsKind(createInMemoryEventSource());
    expect(kind.children).toBeDefined();
    expect(kind.children![":channelId"]).toBe(kind);
  });

  it("resolves EventsResource with channelId param", () => {
    const kind = new EventsKind(createInMemoryEventSource());
    const resource = kind.resolve({ channelId: "alerts" });
    expect(resource).toBeDefined();
    expect(resource.kind).toBe(kind);
    expect(resource.params.channelId).toBe("alerts");
  });

  it("returns text/event-stream content type", async () => {
    const bus = createInMemoryEventSource();
    const kind = new EventsKind(bus, { heartbeatMs: 0 });
    const resource = kind.resolve({ channelId: CHANNEL });
    const repr = await resource.content(makeCtx());
    expect(repr.meta.type).toBe("text/event-stream");
    expect(repr.content).toBeInstanceOf(ReadableStream);
    // Close the stream immediately
    bus.close(CHANNEL);
    await (repr.content as ReadableStream<Uint8Array>).cancel();
  });

  it("streams events from the source for the requested channel", async () => {
    const bus = createInMemoryEventSource();
    const kind = new EventsKind(bus, { heartbeatMs: 0 });
    const resource = kind.resolve({ channelId: CHANNEL });

    const repr = await resource.content(makeCtx());
    const stream = repr.content as ReadableStream<Uint8Array>;

    // Emit events then close
    bus.emit(CHANNEL, { data: "first" });
    bus.emit(CHANNEL, { data: "second", event: "custom" });
    bus.close(CHANNEL);

    const output = await readStream(stream);
    expect(output).toContain("data: first\n\n");
    expect(output).toContain("event: custom\ndata: second\n\n");
  });

  it("isolates events between channels", async () => {
    const bus = createInMemoryEventSource();
    const kind = new EventsKind(bus, { heartbeatMs: 0 });

    const resourceA = kind.resolve({ channelId: "a" });
    const resourceB = kind.resolve({ channelId: "b" });

    const reprA = await resourceA.content(makeCtx({ params: { channelId: "a" } }));
    const reprB = await resourceB.content(makeCtx({ params: { channelId: "b" } }));

    bus.emit("a", { data: "only-a" });
    bus.emit("b", { data: "only-b" });
    bus.close();

    const [outA, outB] = await Promise.all([
      readStream(reprA.content as ReadableStream<Uint8Array>),
      readStream(reprB.content as ReadableStream<Uint8Array>),
    ]);

    expect(outA).toContain("data: only-a");
    expect(outA).not.toContain("data: only-b");
    expect(outB).toContain("data: only-b");
    expect(outB).not.toContain("data: only-a");
  });

  it("sends retry hint on connect when configured", async () => {
    const bus = createInMemoryEventSource();
    const kind = new EventsKind(bus, { heartbeatMs: 0, retryMs: 3000 });
    const resource = kind.resolve({ channelId: CHANNEL });

    const repr = await resource.content(makeCtx());
    bus.close(CHANNEL);
    const output = await readStream(repr.content as ReadableStream<Uint8Array>);
    expect(output.startsWith("retry: 3000\n\n")).toBe(true);
  });

  it("passes channel and lastEventId to source for resumption", async () => {
    // Use a custom source that records the subscribe options
    let receivedChannel: string | undefined;
    let receivedLastEventId: string | undefined;
    const source = {
      subscribe(opts?: { channel?: string; lastEventId?: string }) {
        receivedChannel = opts?.channel;
        receivedLastEventId = opts?.lastEventId;
        return (async function* () {
          yield { data: "event1", id: "10" };
        })();
      },
    };
    const kind = new EventsKind(source, { heartbeatMs: 0 });
    const resource = kind.resolve({ channelId: "alerts" });

    const repr = await resource.content(
      makeCtx({
        params: { channelId: "alerts" },
        headers: { "last-event-id": "5" },
      }),
    );
    await readStream(repr.content as ReadableStream<Uint8Array>);

    expect(receivedChannel).toBe("alerts");
    expect(receivedLastEventId).toBe("5");
  });

  it("supports JSON event data", async () => {
    const bus = createInMemoryEventSource();
    const kind = new EventsKind(bus, { heartbeatMs: 0 });
    const resource = kind.resolve({ channelId: CHANNEL });

    const repr = await resource.content(makeCtx());
    bus.emit(CHANNEL, { data: { user: "alice", action: "login" } });
    bus.close(CHANNEL);

    const output = await readStream(repr.content as ReadableStream<Uint8Array>);
    expect(output).toContain('data: {"user":"alice","action":"login"}');
  });

  it("heartbeat is disabled when heartbeatMs is 0", async () => {
    const bus = createInMemoryEventSource();
    const kind = new EventsKind(bus, { heartbeatMs: 0 });
    const resource = kind.resolve({ channelId: CHANNEL });

    const repr = await resource.content(makeCtx());
    bus.emit(CHANNEL, { data: "event" });
    bus.close(CHANNEL);

    const output = await readStream(repr.content as ReadableStream<Uint8Array>);
    expect(output).not.toContain("heartbeat");
  });

  it("default heartbeatMs is 15000", () => {
    const kind = new EventsKind(createInMemoryEventSource());
    expect(kind.heartbeatMs).toBe(15000);
  });

  it("in-memory source supports multiple subscribers per channel", async () => {
    const bus = createInMemoryEventSource();
    const kind = new EventsKind(bus, { heartbeatMs: 0 });

    const resource1 = kind.resolve({ channelId: CHANNEL });
    const resource2 = kind.resolve({ channelId: CHANNEL });

    const repr1 = await resource1.content(makeCtx());
    const repr2 = await resource2.content(makeCtx());

    bus.emit(CHANNEL, { data: "broadcast" });
    bus.close(CHANNEL);

    const [out1, out2] = await Promise.all([
      readStream(repr1.content as ReadableStream<Uint8Array>),
      readStream(repr2.content as ReadableStream<Uint8Array>),
    ]);

    expect(out1).toContain("data: broadcast");
    expect(out2).toContain("data: broadcast");
  });

  it("close(channel) only closes one channel", async () => {
    const bus = createInMemoryEventSource();
    const kind = new EventsKind(bus, { heartbeatMs: 0 });

    const resourceA = kind.resolve({ channelId: "a" });
    const resourceB = kind.resolve({ channelId: "b" });

    const reprA = await resourceA.content(makeCtx({ params: { channelId: "a" } }));
    const reprB = await resourceB.content(makeCtx({ params: { channelId: "b" } }));

    bus.close("a");
    // b should still receive events
    bus.emit("b", { data: "still-here" });
    bus.close("b");

    const [outA, outB] = await Promise.all([
      readStream(reprA.content as ReadableStream<Uint8Array>),
      readStream(reprB.content as ReadableStream<Uint8Array>),
    ]);

    // a was closed before any emit, so no data
    expect(outA).toBe("");
    expect(outB).toContain("data: still-here");
  });
});
