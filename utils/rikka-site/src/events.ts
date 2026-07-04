/**
 * @module events
 * EventsKind — Server-Sent Events (SSE) streaming from pluggable sources.
 *
 * Represents a whole message queue: routes `events/:channelId` to a stream
 * backed by an {@link EventSource}. The source manages per-channel
 * subscribers, so a single EventsKind can serve many channels.
 *
 * Features:
 * - Pluggable {@link EventSource} (Kafka, Redis Pub/Sub, MQTT, ...)
 * - Channel-based routing (`events/:channelId`)
 * - Last-Event-ID resumption (client sends header on reconnect)
 * - Heartbeat keep-alive (configurable interval)
 *
 * @example
 * ```ts
 * import { site, EventsKind, createInMemoryEventSource } from "@takanashi/rikka-site";
 *
 * const bus = createInMemoryEventSource();
 * const app = site({
 *   "events/": new EventsKind(bus, { heartbeatMs: 15000 }),
 * });
 * // GET /events/alerts → text/event-stream for the "alerts" channel
 * bus.emit("alerts", { data: "hello" });
 * ```
 */

import {
  ResourceKind,
  ReadOnlyResource,
} from "./resource.js";
import type { Repr } from "./representation.js";
import type { RequestContext } from "./context.js";

// ---------------------------------------------------------------------------
// Event source interface
// ---------------------------------------------------------------------------

/**
 * A single SSE event.
 */
export interface SseEvent {
  /** Event payload. If not a string, it's JSON-stringified. */
  data: unknown;
  /** Event type (sent as `event:` line). Defaults to "message". */
  event?: string;
  /** Event ID (sent as `id:` line, enables resumption). */
  id?: string;
  /** Reconnection hint in ms (sent as `retry:` line). */
  retry?: number;
}

/**
 * Pluggable event source — produces events for SSE streaming.
 *
 * Implement this to bridge any message broker (Kafka, Redis, MQTT, ...)
 * into an SSE endpoint. The `channel` parameter selects which queue/topic
 * to subscribe to; `lastEventId` enables resumption when a client
 * reconnects with a `Last-Event-ID` header.
 *
 * @example
 * ```ts
 * class KafkaEventSource implements EventSource {
 *   constructor(private group: string) {}
 *   async *subscribe(opts) {
 *     const topic = opts?.channel ?? "default";
 *     const consumer = createConsumer(topic, this.group, opts?.lastEventId);
 *     for await (const msg of consumer) {
 *       yield { data: msg.value.toString(), id: msg.offset };
 *     }
 *   }
 * }
 * ```
 */
export interface EventSource {
  subscribe(options?: { channel?: string; lastEventId?: string }): AsyncIterable<SseEvent>;
}

// ---------------------------------------------------------------------------
// EventsKind
// ---------------------------------------------------------------------------

export interface EventsKindOptions {
  /** Heartbeat interval in ms (0 = disabled, default: 15000). */
  heartbeatMs?: number;
  /** Default retry hint in ms (sent on connection open). */
  retryMs?: number;
}

/**
 * EventsKind — SSE streaming endpoint for a whole message queue.
 *
 * Catch-all `:channelId` selects the channel. The same Kind instance handles
 * all channels; per-channel dispatch is delegated to the {@link EventSource}.
 *
 * Returns a `text/event-stream` response backed by a {@link ReadableStream}
 * that pulls from the source for the requested channel.
 */
export class EventsKind extends ResourceKind {
  readonly source: EventSource;
  readonly heartbeatMs: number;
  readonly retryMs?: number;

  override children: { [key: string]: EventsKind } = { ":channelId": this };

  constructor(source: EventSource, options?: EventsKindOptions) {
    super();
    this.source = source;
    this.heartbeatMs = options?.heartbeatMs ?? 15000;
    this.retryMs = options?.retryMs;
  }

  resolve(params: Record<string, string>): EventsResource {
    return new EventsResource(params, this);
  }
}

/**
 * EventsResource — per-request SSE stream for one channel.
 */
export class EventsResource extends ReadOnlyResource {
  constructor(
    params: Record<string, string>,
    readonly kind: EventsKind,
  ) {
    super();
    this.params = params;
  }

  async content(ctx: RequestContext): Promise<Repr> {
    const channel = this.params.channelId ?? "";
    const lastEventId = ctx.headers["last-event-id"];
    const encoder = new TextEncoder();
    const heartbeatMs = this.kind.heartbeatMs;
    const retryMs = this.kind.retryMs;
    const source = this.kind.source;
    const subscribeFn = source.subscribe.bind(source);
    let closed = false;
    let heartbeatTimer: ReturnType<typeof setInterval> | undefined;
    let sourceIterator: AsyncIterator<SseEvent> | undefined;

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        // Send retry hint on connect
        if (retryMs !== undefined) {
          controller.enqueue(encoder.encode(`retry: ${retryMs}\n\n`));
        }

        // Heartbeat — SSE comment lines keep the connection alive
        if (heartbeatMs > 0) {
          heartbeatTimer = setInterval(() => {
            if (closed) return;
            try {
              controller.enqueue(encoder.encode(`: heartbeat\n\n`));
            } catch {
              // Controller might be closed
            }
          }, heartbeatMs);
        }

        try {
          const iterable = subscribeFn({ channel, lastEventId });
          sourceIterator = iterable[Symbol.asyncIterator]();
          let result: IteratorResult<SseEvent>;
          while (!(result = await sourceIterator.next()).done) {
            if (closed) break;
            controller.enqueue(encoder.encode(formatSseEvent(result.value)));
          }
        } catch {
          // Source error — close the stream
        } finally {
          closed = true;
          if (heartbeatTimer) clearInterval(heartbeatTimer);
          await sourceIterator?.return?.(undefined);
          try {
            controller.close();
          } catch {
            // Already closed
          }
        }
      },

      cancel() {
        closed = true;
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        sourceIterator?.return?.(undefined);
      },
    });

    return {
      content: stream,
      meta: { type: "text/event-stream" },
    };
  }
}

// ---------------------------------------------------------------------------
// SSE formatting
// ---------------------------------------------------------------------------

/**
 * Format an SSE event as a string per the HTML spec.
 *
 * Each field is on its own line (`field: value\n`). Multi-line `data` is
 * split into multiple `data:` lines. The event is terminated by a blank line.
 */
export function formatSseEvent(event: SseEvent): string {
  const lines: string[] = [];

  if (event.event) {
    lines.push(`event: ${event.event}`);
  }

  const data = typeof event.data === "string"
    ? event.data
    : JSON.stringify(event.data);

  // Multi-line data: each line gets its own `data:` prefix
  for (const line of data.split("\n")) {
    lines.push(`data: ${line}`);
  }

  if (event.id !== undefined) {
    lines.push(`id: ${event.id}`);
  }

  if (event.retry !== undefined) {
    lines.push(`retry: ${event.retry}`);
  }

  // Blank line terminates the event
  return lines.join("\n") + "\n\n";
}

// ---------------------------------------------------------------------------
// In-memory event source (for testing and simple pub/sub)
// ---------------------------------------------------------------------------

/**
 * In-memory event source — simple per-channel pub/sub for testing or
 * single-process apps.
 *
 * @example
 * ```ts
 * const bus = createInMemoryEventSource();
 * const app = site({ "events/": new EventsKind(bus) });
 * bus.emit("alerts", { data: "hello" });
 * ```
 */
export function createInMemoryEventSource(): EventSource & {
  emit(channel: string, event: SseEvent): void;
  close(channel?: string): void;
} {
  // channel name → subscribers
  const channels = new Map<string, Set<{
    push: (event: SseEvent) => void;
    done: () => void;
  }>>();

  function getSubscribers(channel: string): Set<{
    push: (event: SseEvent) => void;
    done: () => void;
  }> {
    let subs = channels.get(channel);
    if (!subs) {
      subs = new Set();
      channels.set(channel, subs);
    }
    return subs;
  }

  return {
    subscribe(options?: { channel?: string; lastEventId?: string }) {
      const channel = options?.channel ?? "";
      const subscribers = getSubscribers(channel);
      const queue: SseEvent[] = [];
      let resolveNext: ((value: IteratorResult<SseEvent>) => void) | null = null;
      let done = false;
      let lastId = options?.lastEventId;

      const sub = {
        push(event: SseEvent) {
          if (done) return;
          if (resolveNext) {
            const r = resolveNext;
            resolveNext = null;
            r({ value: event, done: false });
          } else {
            queue.push(event);
          }
          if (event.id !== undefined) lastId = event.id;
        },
        done() {
          if (done) return;
          done = true;
          if (resolveNext) {
            const r = resolveNext;
            resolveNext = null;
            r({ value: undefined, done: true });
          }
        },
      };

      subscribers.add(sub);

      const iterator: AsyncIterator<SseEvent> = {
        next(): Promise<IteratorResult<SseEvent>> {
          if (queue.length > 0) {
            return Promise.resolve({ value: queue.shift()!, done: false });
          }
          if (done) {
            return Promise.resolve({ value: undefined, done: true });
          }
          return new Promise((resolve) => {
            resolveNext = resolve;
          });
        },
        return(): Promise<IteratorResult<SseEvent>> {
          subscribers.delete(sub);
          done = true;
          return Promise.resolve({ value: undefined, done: true });
        },
      };

      return {
        [Symbol.asyncIterator]() {
          return iterator;
        },
      };
    },

    emit(channel: string, event: SseEvent) {
      const subs = channels.get(channel);
      if (!subs) return;
      for (const sub of subs) {
        sub.push(event);
      }
    },

    close(channel?: string) {
      if (channel !== undefined) {
        const subs = channels.get(channel);
        if (subs) {
          for (const sub of subs) sub.done();
          subs.clear();
          channels.delete(channel);
        }
      } else {
        for (const subs of channels.values()) {
          for (const sub of subs) sub.done();
          subs.clear();
        }
        channels.clear();
      }
    },
  };
}
