import { describe, it, expect, rs } from "@rstest/core";
import {
  signal,
  computed,
  effect,
  untracked,
  Signal,
} from "../src/index.js";

describe("signal", () => {
  it("creates a Signal.State with initial value", () => {
    const s = signal(42);
    expect(s.get()).toBe(42);
  });

  it("can be set and read", () => {
    const s = signal("hello");
    expect(s.get()).toBe("hello");
    s.set("world");
    expect(s.get()).toBe("world");
  });

  it("works with different types", () => {
    const num = signal(0);
    const str = signal("");
    const bool = signal(false);
    const obj = signal({ x: 1 });
    const arr = signal([1, 2, 3]);

    expect(num.get()).toBe(0);
    expect(str.get()).toBe("");
    expect(bool.get()).toBe(false);
    expect(obj.get()).toEqual({ x: 1 });
    expect(arr.get()).toEqual([1, 2, 3]);
  });

  it("is a Signal.State", () => {
    const s = signal(0);
    expect(Signal.isState(s)).toBe(true);
    expect(Signal.isComputed(s)).toBe(false);
  });
});

describe("computed", () => {
  it("derives value from signals", () => {
    const a = signal(1);
    const b = signal(2);
    const sum = computed(() => a.get() + b.get());
    expect(sum.get()).toBe(3);
  });

  it("recomputes when dependencies change", () => {
    const a = signal(1);
    const doubled = computed(() => a.get() * 2);
    expect(doubled.get()).toBe(2);
    a.set(5);
    expect(doubled.get()).toBe(10);
  });

  it("caches value until dependency changes", () => {
    let callCount = 0;
    const a = signal(1);
    const derived = computed(() => {
      callCount++;
      return a.get() * 3;
    });
    derived.get();
    derived.get();
    derived.get();
    expect(callCount).toBe(1);
    a.set(2);
    derived.get();
    expect(callCount).toBe(2);
  });

  it("supports chained computations", () => {
    const a = signal(1);
    const b = computed(() => a.get() + 1);
    const c = computed(() => b.get() * 2);
    expect(c.get()).toBe(4);
    a.set(3);
    expect(c.get()).toBe(8);
  });

  it("is a Signal.Computed", () => {
    const c = computed(() => 1);
    expect(Signal.isComputed(c)).toBe(true);
    expect(Signal.isState(c)).toBe(false);
  });

  it("does not notify when value is the same (Object.is)", () => {
    const a = signal({ x: 1 });
    let recomputes = 0;
    const derived = computed(() => {
      recomputes++;
      return a.get().x;
    });
    derived.get();
    expect(recomputes).toBe(1);
    const sameObj = a.get();
    a.set(sameObj);
    derived.get();
    expect(recomputes).toBe(1);
  });
});

describe("effect", () => {
  it("runs immediately", () => {
    const fn = rs.fn();
    effect(fn);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("re-runs when dependencies change", async () => {
    const a = signal(1);
    const fn = rs.fn(() => {
      a.get();
    });
    effect(fn);
    expect(fn).toHaveBeenCalledTimes(1);
    a.set(2);
    await new Promise((r) => setTimeout(r, 50));
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("returns a dispose function", async () => {
    const a = signal(1);
    const fn = rs.fn(() => {
      a.get();
    });
    const dispose = effect(fn);
    expect(fn).toHaveBeenCalledTimes(1);
    dispose();
    a.set(2);
    await new Promise((r) => setTimeout(r, 50));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("runs cleanup function before next execution", async () => {
    const a = signal(1);
    const cleanup = rs.fn();
    const fn = rs.fn(() => {
      a.get();
      return cleanup;
    });
    effect(fn);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(cleanup).not.toHaveBeenCalled();
    a.set(2);
    await new Promise((r) => setTimeout(r, 50));
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it("runs cleanup when disposed", () => {
    const cleanup = rs.fn();
    const dispose = effect(() => cleanup);
    expect(cleanup).not.toHaveBeenCalled();
    dispose();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it("tracks multiple signals", async () => {
    const a = signal(1);
    const b = signal(2);
    const values: string[] = [];
    effect(() => {
      values.push(`${a.get()},${b.get()}`);
    });
    expect(values).toEqual(["1,2"]);
    a.set(10);
    await new Promise((r) => setTimeout(r, 50));
    b.set(20);
    await new Promise((r) => setTimeout(r, 50));
    expect(values.length).toBeGreaterThanOrEqual(2);
    expect(values[values.length - 1]).toBe("10,20");
  });

  it("batches synchronous updates", async () => {
    const a = signal(1);
    const b = signal(2);
    const values: string[] = [];
    effect(() => {
      values.push(`${a.get()},${b.get()}`);
    });
    expect(values).toEqual(["1,2"]);
    a.set(10);
    b.set(20);
    await new Promise((r) => setTimeout(r, 50));
    expect(values[values.length - 1]).toBe("10,20");
  });
});
describe("effect edge cases", () => {
  it("dispose called multiple times is safe", async () => {
    const a = signal(1);
    const fn = rs.fn(() => {
      a.get();
    });
    const dispose = effect(fn);
    expect(fn).toHaveBeenCalledTimes(1);
    dispose();
    dispose();
    dispose();
    a.set(2);
    await new Promise((r) => setTimeout(r, 50));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("effect that queues signal update converges", async () => {
    const a = signal(0);
    let runs = 0;
    const dispose = effect(() => {
      runs++;
      const val = a.get();
      if (val < 5) {
        queueMicrotask(() => a.set(val + 1));
      }
    });
    expect(runs).toBe(1);
    await new Promise((r) => setTimeout(r, 200));
    expect(a.get()).toBe(5);
    expect(runs).toBeLessThan(20);
    dispose();
  });

  it("error in effect re-run does not break other effects", async () => {
    const a = signal(1);
    let shouldThrow = false;
    effect(() => {
      a.get();
      if (shouldThrow) throw new Error("effect error");
    });
    const values: number[] = [];
    effect(() => {
      values.push(a.get());
    });
    expect(values).toEqual([1]);
    shouldThrow = true;
    a.set(2);
    await new Promise((r) => setTimeout(r, 50));
    shouldThrow = false;
    a.set(3);
    await new Promise((r) => setTimeout(r, 50));
    expect(values[values.length - 1]).toBe(3);
  });

  it("multiple effects on independent signals do not cross-trigger", async () => {
    const x = signal(1);
    const y = signal(2);
    const xValues: number[] = [];
    const yValues: number[] = [];
    effect(() => {
      xValues.push(x.get());
    });
    effect(() => {
      yValues.push(y.get());
    });
    expect(xValues).toEqual([1]);
    expect(yValues).toEqual([2]);
    x.set(10);
    await new Promise((r) => setTimeout(r, 50));
    expect(xValues[xValues.length - 1]).toBe(10);
    expect(yValues).toEqual([2]);
  });

  it("effect with no signal dependency runs once", () => {
    const fn = rs.fn(() => {});
    const dispose = effect(fn);
    expect(fn).toHaveBeenCalledTimes(1);
    dispose();
  });

  it("forwards initial-run error to onError", () => {
    const onError = rs.fn();
    const err = new Error("boom");
    expect(() => effect(() => { throw err; }, onError)).not.toThrow();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBe(err);
  });

  it("forwards re-run error to onError", async () => {
    const a = signal(1);
    let shouldThrow = false;
    const onError = rs.fn();
    effect(() => {
      a.get();
      if (shouldThrow) throw new Error("re-run boom");
    }, onError);
    expect(onError).not.toHaveBeenCalled();
    shouldThrow = true;
    a.set(2);
    await new Promise((r) => setTimeout(r, 50));
    expect(onError).toHaveBeenCalledTimes(1);
    expect((onError.mock.calls[0][0] as Error).message).toBe("re-run boom");
  });

  it("swallows errors thrown by onError itself", async () => {
    const a = signal(1);
    let shouldThrow = false;
    // onError itself throws; effect must not propagate and must not break
    // the signal watcher notification loop on subsequent runs.
    const onError = () => { throw new Error("onError boom"); };
    expect(() => effect(() => {
      a.get();
      if (shouldThrow) throw new Error("effect boom");
    }, onError)).not.toThrow();

    shouldThrow = true;
    // Re-run should still fire (signal watcher must survive onError throwing)
    expect(() => a.set(2)).not.toThrow();
    await new Promise((r) => setTimeout(r, 50));
  });

  it("does not call onError when effect does not throw", () => {
    const onError = rs.fn();
    effect(() => {}, onError);
    expect(onError).not.toHaveBeenCalled();
  });
});

describe("effect abort signal", () => {
  it("passes a non-aborted AbortSignal to fn", () => {
    let signal: AbortSignal | undefined;
    effect((s) => {
      signal = s;
    });
    expect(signal).toBeDefined();
    expect(signal!.aborted).toBe(false);
  });

  it("aborts the signal on dispose", () => {
    let signal: AbortSignal | undefined;
    const dispose = effect((s) => {
      signal = s;
    });
    expect(signal!.aborted).toBe(false);
    dispose();
    expect(signal!.aborted).toBe(true);
  });

  it("aborts the previous signal on re-run", async () => {
    const a = signal(1);
    const signals: AbortSignal[] = [];
    effect((s) => {
      a.get();
      signals.push(s);
    });
    expect(signals).toHaveLength(1);
    expect(signals[0].aborted).toBe(false);

    a.set(2);
    await new Promise((r) => setTimeout(r, 50));
    expect(signals).toHaveLength(2);
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
  });

  it("aborts on dispose even if fn threw", () => {
    let captured: AbortSignal | undefined;
    const dispose = effect((s) => {
      captured = s;
      throw new Error("boom");
    });
    expect(captured).toBeDefined();
    dispose();
    expect(captured!.aborted).toBe(true);
  });

  it("does not double-call cleanup when fn throws on re-run", async () => {
    const a = signal(1);
    const cleanup = rs.fn();
    let shouldThrow = false;
    effect(() => {
      a.get();
      if (shouldThrow) throw new Error("boom");
      return cleanup;
    });
    expect(cleanup).not.toHaveBeenCalled();

    shouldThrow = true;
    a.set(2);
    await new Promise((r) => setTimeout(r, 50));
    // fn threw — cleanup from the previous run was called once
    expect(cleanup).toHaveBeenCalledTimes(1);

    shouldThrow = false;
    a.set(3);
    await new Promise((r) => setTimeout(r, 50));
    // fn succeeded — the old (already-called) cleanup must NOT be called again
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it("is backwards compatible with fn that ignores the signal", async () => {
    const a = signal(1);
    const fn = rs.fn(() => {
      a.get();
    });
    effect(fn);
    expect(fn).toHaveBeenCalledTimes(1);
    a.set(2);
    await new Promise((r) => setTimeout(r, 50));
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe("computed edge cases", () => {
  it("computed with no signal dependency returns constant", () => {
    const derived = computed(() => 42);
    expect(derived.get()).toBe(42);
    expect(derived.get()).toBe(42);
  });

  it("diamond dependency recomputes correctly", () => {
    const a = signal(1);
    let bRuns = 0;
    let cRuns = 0;
    let dRuns = 0;
    const b = computed(() => {
      bRuns++;
      return a.get() * 2;
    });
    const c = computed(() => {
      cRuns++;
      return a.get() * 3;
    });
    const d = computed(() => {
      dRuns++;
      return b.get() + c.get();
    });
    d.get();
    expect(bRuns).toBe(1);
    expect(cRuns).toBe(1);
    expect(dRuns).toBe(1);
    a.set(10);
    d.get();
    expect(bRuns).toBe(2);
    expect(cRuns).toBe(2);
    expect(dRuns).toBe(2);
  });

  it("computed with conditional dependency only tracks accessed signals", () => {
    const a = signal(1);
    const b = signal(10);
    const cond = signal(true);
    let runs = 0;
    const derived = computed(() => {
      runs++;
      return cond.get() ? a.get() : b.get();
    });
    derived.get();
    expect(runs).toBe(1);
    b.set(20);
    derived.get();
    expect(runs).toBe(1);
    cond.set(false);
    derived.get();
    expect(runs).toBe(2);
    a.set(2);
    derived.get();
    expect(runs).toBe(2);
  });
});

describe("untracked", () => {
  it("returns the function's result", () => {
    const s = signal(42);
    expect(untracked(() => s.get())).toBe(42);
    expect(untracked(() => "plain")).toBe("plain");
    expect(untracked(() => 1 + 2)).toBe(3);
  });

  it("reads inside untracked do not establish a dependency in the surrounding effect", async () => {
    const tracked = signal(0);
    const peeked = signal(0);
    const runs: number[] = [];

    effect(() => {
      runs.push(tracked.get());
      untracked(() => peeked.get());
    });

    expect(runs).toEqual([0]);

    // Changing `peeked` must NOT re-run the effect.
    peeked.set(99);
    await new Promise((r) => setTimeout(r, 50));
    expect(runs).toEqual([0]);

    // Changing `tracked` must re-run the effect.
    tracked.set(1);
    await new Promise((r) => setTimeout(r, 50));
    expect(runs[1]).toBe(1);
  });

  it("reads inside untracked do not establish a dependency in a computed", () => {
    const tracked = signal(0);
    const peeked = signal(0);
    let runs = 0;

    const derived = computed(() => {
      runs++;
      return tracked.get() + untracked(() => peeked.get());
    });

    expect(derived.get()).toBe(0);
    expect(runs).toBe(1);

    // Changing `peeked` does NOT invalidate the computed.
    peeked.set(10);
    expect(derived.get()).toBe(0);
    expect(runs).toBe(1);

    // Changing `tracked` invalidates the computed.
    tracked.set(5);
    expect(derived.get()).toBe(15);
    expect(runs).toBe(2);
  });

  it("nested untracked boundaries compose correctly", () => {
    const a = signal(1);
    const b = signal(10);
    const c = signal(100);
    let runs = 0;

    const derived = computed(() => {
      runs++;
      const x = a.get();
      const y = untracked(() => b.get() + untracked(() => c.get()));
      return x + y;
    });

    expect(derived.get()).toBe(111);
    expect(runs).toBe(1);

    b.set(20);
    c.set(200);
    expect(derived.get()).toBe(111);
    expect(runs).toBe(1);

    a.set(2);
    expect(derived.get()).toBe(222);
    expect(runs).toBe(2);
  });

  it("reads inside an effect created during untracked still subscribe normally", async () => {
    const s = signal(0);
    let observed = -1;
    const dispose = untracked(() => {
      // The outer effect that owns the surrounding reactive context is the
      // untracked boundary, but creating a new effect inside should still
      // subscribe to `s` like any other effect.
      return effect(() => {
        observed = s.get();
      });
    });
    expect(observed).toBe(0);
    s.set(7);
    await new Promise((r) => setTimeout(r, 50));
    expect(observed).toBe(7);
    dispose();
  });
});

