import { describe, it, expect } from "@rstest/core";
import { signal, computed, effect, resource } from "../src/index.js";

/** Resolves after `ms`, delivering `value`. Lets us control fetch timing. */
function delayed<T>(value: T, ms = 20): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/** Rejects after `ms` with `err`. */
function delayedReject<T>(err: unknown, ms = 20): Promise<T> {
  return new Promise((_, reject) => setTimeout(() => reject(err), ms));
}

/** Wait for pending microtasks / timers to flush. */
function flush(ms = 30): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

describe("resource — no source", () => {
  it("starts in pending state with loading=true", () => {
    const r = resource(() => delayed(1));
    expect(r.state.get()).toBe("pending");
    expect(r.value.get()).toBe(undefined);
    expect(r.error.get()).toBe(undefined);
    expect(r.loading.get()).toBe(true);
    r.dispose();
  });

  it("transitions to ready when the fetcher resolves", async () => {
    const r = resource(() => delayed("hello"));
    await flush();
    expect(r.state.get()).toBe("ready");
    expect(r.value.get()).toBe("hello");
    expect(r.error.get()).toBe(undefined);
    expect(r.loading.get()).toBe(false);
    r.dispose();
  });

  it("transitions to errored when the fetcher rejects", async () => {
    const r = resource(() => delayedReject(new Error("boom")));
    await flush();
    expect(r.state.get()).toBe("errored");
    expect(r.value.get()).toBe(undefined);
    expect(r.error.get()).toBeInstanceOf(Error);
    expect((r.error.get() as Error).message).toBe("boom");
    expect(r.loading.get()).toBe(false);
    r.dispose();
  });

  it("does not re-fetch on its own", async () => {
    let runs = 0;
    const r = resource(() => {
      runs++;
      return delayed(runs);
    });
    await flush();
    expect(runs).toBe(1);
    await flush();
    expect(runs).toBe(1);
    r.dispose();
  });
});

describe("resource — with source", () => {
  it("reads the source value and passes it to the fetcher", async () => {
    const userId = signal(1);
    const seen: number[] = [];
    const r = resource(userId, (id) => {
      seen.push(id);
      return delayed(`user-${id}`);
    });
    expect(seen).toEqual([1]);
    await flush();
    expect(r.value.get()).toBe("user-1");

    userId.set(2);
    await flush();
    expect(seen).toEqual([1, 2]);
    expect(r.value.get()).toBe("user-2");
    r.dispose();
  });

  it("accepts a plain accessor function as source", async () => {
    const a = signal(10);
    const r = resource(() => a.get(), (v) => delayed(v * 2));
    await flush();
    expect(r.value.get()).toBe(20);
    a.set(5);
    await flush();
    expect(r.value.get()).toBe(10);
    r.dispose();
  });

  it("accepts a Signal.Computed as source", async () => {
    const base = signal(3);
    const d = computed(() => base.get() * 2);
    const r = resource(d, (v) => delayed(v));
    await flush();
    expect(r.value.get()).toBe(6);
    base.set(5);
    await flush();
    expect(r.value.get()).toBe(10);
    r.dispose();
  });
});

describe("resource — race condition (last-write-wins)", () => {
  it("discards stale results when source changes rapidly", async () => {
    const id = signal(1);
    const r = resource(id, (v) => delayed(v, 50));
    // Don't wait for id=1 to resolve; switch immediately.
    id.set(2);
    id.set(3);
    await flush(80);
    // Only the latest source value should be reflected.
    expect(r.value.get()).toBe(3);
    r.dispose();
  });

  it("aborts the previous fetch's signal on source change", async () => {
    const id = signal(1);
    const aborted: boolean[] = [];
    const r = resource(id, (_v, info) => {
      info.signal.addEventListener("abort", () => aborted.push(true));
      return delayed(`u${_v}`, 50);
    });
    id.set(2);
    await flush(60);
    expect(aborted.length).toBeGreaterThanOrEqual(1);
    r.dispose();
  });
});

describe("resource — refetch", () => {
  it("re-runs the fetcher when refetch() is called", async () => {
    let runs = 0;
    const r = resource(() => {
      runs++;
      return delayed(runs);
    });
    await flush();
    expect(runs).toBe(1);
    r.refetch();
    await flush();
    expect(runs).toBe(2);
    expect(r.value.get()).toBe(2);
    r.dispose();
  });

  it("sets info.refetching=true for refetch-triggered runs", async () => {
    const flags: boolean[] = [];
    const r = resource((info) => {
      flags.push(info.refetching);
      return delayed(1);
    });
    expect(flags).toEqual([false]);
    r.refetch();
    await flush();
    expect(flags).toEqual([false, true]);
    r.dispose();
  });

  it("refetching flag resets after a refetch (source change → false)", async () => {
    const id = signal(1);
    const flags: boolean[] = [];
    const r = resource(id, (_v, info) => {
      flags.push(info.refetching);
      return delayed(1);
    });
    expect(flags).toEqual([false]);
    r.refetch();
    await flush();
    expect(flags).toEqual([false, true]);
    id.set(2);
    await flush();
    expect(flags).toEqual([false, true, false]);
    r.dispose();
  });
});

describe("resource — mutate", () => {
  it("replaces the value without re-fetching", async () => {
    let runs = 0;
    const r = resource(() => {
      runs++;
      return delayed("original");
    });
    await flush();
    expect(runs).toBe(1);
    expect(r.value.get()).toBe("original");

    r.mutate("patched");
    expect(r.value.get()).toBe("patched");
    expect(runs).toBe(1);
    expect(r.state.get()).toBe("ready");
    r.dispose();
  });

  it("accepts an updater function", async () => {
    const r = resource(() => delayed(10));
    await flush();
    r.mutate((prev) => (prev ?? 0) + 5);
    expect(r.value.get()).toBe(15);
    r.dispose();
  });
});

describe("resource — sync throw in fetcher", () => {
  it("transitions to errored when the fetcher throws synchronously", () => {
    const r = resource(() => {
      throw new Error("sync boom");
    });
    expect(r.state.get()).toBe("errored");
    expect(r.error.get()).toBeInstanceOf(Error);
    expect((r.error.get() as Error).message).toBe("sync boom");
    expect(r.loading.get()).toBe(false);
    r.dispose();
  });
});

describe("resource — dispose", () => {
  it("stops tracking the source", async () => {
    const id = signal(1);
    let runs = 0;
    const r = resource(id, (v) => {
      runs++;
      return delayed(v);
    });
    await flush();
    expect(runs).toBe(1);
    r.dispose();
    id.set(2);
    await flush();
    expect(runs).toBe(1);
  });

  it("aborts the in-flight fetch", async () => {
    let aborted = false;
    const r = resource((info) => {
      info.signal.addEventListener("abort", () => (aborted = true));
      return delayed("x", 100);
    });
    r.dispose();
    expect(aborted).toBe(true);
  });
});

describe("resource — fine-grained signals", () => {
  it("value, state, error, loading are distinct signals", async () => {
    const r = resource(() => delayed("data"));
    expect(r.value).not.toBe(r.loading);
    expect(r.state).not.toBe(r.error);
    expect(r.value).not.toBe(r.state);
    await flush();
    r.dispose();
  });

  it("mutate does not notify loading/state/error subscribers", async () => {
    const r = resource(() => delayed("original"));
    await flush();

    let loadingChanges = 0;
    let stateChanges = 0;
    const d1 = effect(() => {
      r.loading.get();
      loadingChanges++;
    });
    const d2 = effect(() => {
      r.state.get();
      stateChanges++;
    });
    expect(loadingChanges).toBe(1);
    expect(stateChanges).toBe(1);

    r.mutate("new");
    await flush();
    expect(loadingChanges).toBe(1);
    expect(stateChanges).toBe(1);
    d1();
    d2();
    r.dispose();
  });
});
