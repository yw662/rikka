import { describe, it, expect, rs } from "@rstest/core";
import {
  signal,
  computed,
  effect,
  Signal,
  store,
  raw,
  signalOf,
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

describe("store", () => {
  it("creates a reactive store from a plain object", () => {
    const state = store({ name: "Alice", age: 30 });
    expect(state.name).toBe("Alice");
    expect(state.age).toBe(30);
  });

  it("creates a reactive store from an array", () => {
    const arr = store([1, 2, 3]);
    expect(arr[0]).toBe(1);
    expect(arr.length).toBe(3);
  });

  it("allows setting properties", () => {
    const state = store({ name: "Alice" });
    state.name = "Bob";
    expect(state.name).toBe("Bob");
  });

  it("tracks property reads in computed", () => {
    const state = store({ name: "Alice", age: 30 });
    const greeting = computed(() => `Hello, ${state.name}!`);
    expect(greeting.get()).toBe("Hello, Alice!");
    state.name = "Bob";
    expect(greeting.get()).toBe("Hello, Bob!");
  });

  it("provides fine-grained reactivity", () => {
    const state = store({ name: "Alice", age: 30 });
    let nameReads = 0;
    let ageReads = 0;
    const nameDerived = computed(() => {
      nameReads++;
      return state.name;
    });
    const ageDerived = computed(() => {
      ageReads++;
      return state.age;
    });
    nameDerived.get();
    ageDerived.get();
    expect(nameReads).toBe(1);
    expect(ageReads).toBe(1);

    state.age = 31;
    nameDerived.get();
    ageDerived.get();
    expect(nameReads).toBe(1);
    expect(ageReads).toBe(2);
  });

  it("handles nested objects", () => {
    const state = store({
      user: { name: "Alice", address: { city: "Wonderland" } },
    });
    expect(state.user.name).toBe("Alice");
    expect(state.user.address.city).toBe("Wonderland");
  });

  it("tracks nested property reads in computed", () => {
    const state = store({ user: { name: "Alice" } });
    const greeting = computed(() => `Hello, ${state.user.name}!`);
    expect(greeting.get()).toBe("Hello, Alice!");
    state.user.name = "Bob";
    expect(greeting.get()).toBe("Hello, Bob!");
  });

  it("handles replacing nested objects", () => {
    const state = store({ user: { name: "Alice", age: 30 } });
    const greeting = computed(() => `Hello, ${state.user.name}!`);
    expect(greeting.get()).toBe("Hello, Alice!");
    state.user = { name: "Bob", age: 25 };
    expect(greeting.get()).toBe("Hello, Bob!");
    expect(state.user.age).toBe(25);
  });

  it("supports array push", () => {
    const arr = store([1, 2, 3]);
    arr.push(4);
    expect(arr.length).toBe(4);
    expect(arr[3]).toBe(4);
  });

  it("supports array pop", () => {
    const arr = store([1, 2, 3]);
    const last = arr.pop();
    expect(last).toBe(3);
    expect(arr.length).toBe(2);
  });

  it("tracks array length in computed", () => {
    const arr = store([1, 2, 3]);
    const len = computed(() => arr.length);
    expect(len.get()).toBe(3);
    arr.push(4);
    expect(len.get()).toBe(4);
  });

  it("tracks array items in computed", () => {
    const arr = store([1, 2, 3]);
    const first = computed(() => arr[0]);
    expect(first.get()).toBe(1);
    arr[0] = 10;
    expect(first.get()).toBe(10);
  });

  it("re-runs effect when store property changes", async () => {
    const state = store({ count: 0 });
    const values: number[] = [];
    effect(() => {
      values.push(state.count);
    });
    expect(values).toEqual([0]);
    state.count = 1;
    await new Promise((r) => setTimeout(r, 50));
    expect(values[values.length - 1]).toBe(1);
  });

  it("re-runs effect when nested property changes", async () => {
    const state = store({ user: { name: "Alice" } });
    const values: string[] = [];
    effect(() => {
      values.push(state.user.name);
    });
    expect(values).toEqual(["Alice"]);
    state.user.name = "Bob";
    await new Promise((r) => setTimeout(r, 50));
    expect(values[values.length - 1]).toBe("Bob");
  });

  it("returns raw data via raw()", () => {
    const data = { name: "Alice", age: 30 };
    const state = store(data);
    const rawData = raw(state);
    expect(rawData).toBe(data);
    expect(rawData.name).toBe("Alice");
  });

  it("raw() returns the argument if not a store", () => {
    const obj = { name: "Alice" };
    expect(raw(obj)).toBe(obj);
  });

  it("handles delete property", () => {
    const state = store({ name: "Alice" as string | undefined, age: 30 });
    expect(state.name).toBe("Alice");
    delete state.name;
    expect(state.name).toBeUndefined();
  });

  it("notifies effects on delete", async () => {
    const state = store({ name: "Alice" as string | undefined });
    const values: (string | undefined)[] = [];
    effect(() => {
      values.push(state.name);
    });
    expect(values).toEqual(["Alice"]);
    delete state.name;
    await new Promise((r) => setTimeout(r, 50));
    expect(values[values.length - 1]).toBeUndefined();
  });

  it("does not wrap non-plain objects (Date, etc.)", () => {
    const state = store({ date: new Date("2024-01-01") });
    expect(state.date instanceof Date).toBe(true);
    expect(state.date.getFullYear()).toBe(2024);
  });

  it("handles adding new properties", () => {
    const state = store({} as { name?: string });
    state.name = "Alice";
    expect(state.name).toBe("Alice");
  });

  it("store() on an existing store returns the same store", () => {
    const state = store({ name: "Alice" });
    const again = store(state);
    expect(again).toBe(state);
  });

  it("unwraps store proxies on assignment", () => {
    const inner = store({ name: "Alice" });
    const outer = store({ user: {} as { name: string } });
    outer.user = inner;
    const rawData = raw(outer);
    expect(rawData.user).toBe(raw(inner));
  });

  it("batches synchronous store updates in effect", async () => {
    const state = store({ a: 1, b: 2 });
    const values: string[] = [];
    effect(() => {
      values.push(`${state.a},${state.b}`);
    });
    expect(values).toEqual(["1,2"]);
    state.a = 10;
    state.b = 20;
    await new Promise((r) => setTimeout(r, 50));
    expect(values[values.length - 1]).toBe("10,20");
  });

  it("works with computed chaining", () => {
    const state = store({ count: 1 });
    const doubled = computed(() => state.count * 2);
    const quadrupled = computed(() => doubled.get() * 2);
    expect(quadrupled.get()).toBe(4);
    state.count = 3;
    expect(quadrupled.get()).toBe(12);
  });

  it("supports array splice", () => {
    const arr = store([1, 2, 3, 4, 5]);
    const removed = arr.splice(1, 2);
    expect(removed).toEqual([2, 3]);
    expect(arr.length).toBe(3);
    expect(arr[1]).toBe(4);
  });

  it("supports array shift", () => {
    const arr = store([1, 2, 3]);
    const first = arr.shift();
    expect(first).toBe(1);
    expect(arr.length).toBe(2);
    expect(arr[0]).toBe(2);
  });

  it("supports array unshift", () => {
    const arr = store([2, 3]);
    arr.unshift(1);
    expect(arr.length).toBe(3);
    expect(arr[0]).toBe(1);
  });

  it("supports array sort", () => {
    const arr = store([3, 1, 2]);
    arr.sort();
    expect(arr[0]).toBe(1);
    expect(arr[1]).toBe(2);
    expect(arr[2]).toBe(3);
  });

  it("supports array reverse", () => {
    const arr = store([1, 2, 3]);
    arr.reverse();
    expect(arr[0]).toBe(3);
    expect(arr[2]).toBe(1);
  });

  it("supports array map", () => {
    const arr = store([1, 2, 3]);
    const result = arr.map((x) => x * 2);
    expect(result).toEqual([2, 4, 6]);
  });

  it("supports array filter", () => {
    const arr = store([1, 2, 3, 4]);
    const result = arr.filter((x) => x % 2 === 0);
    expect(result).toEqual([2, 4]);
  });

  it("supports array forEach", () => {
    const arr = store([1, 2, 3]);
    const collected: number[] = [];
    arr.forEach((x) => collected.push(x));
    expect(collected).toEqual([1, 2, 3]);
  });

  it("supports array includes", () => {
    const arr = store([1, 2, 3]);
    expect(arr.includes(2)).toBe(true);
    expect(arr.includes(5)).toBe(false);
  });

  it("supports array indexOf", () => {
    const arr = store([1, 2, 3, 2]);
    expect(arr.indexOf(2)).toBe(1);
    expect(arr.indexOf(5)).toBe(-1);
  });

  it("supports array find", () => {
    const arr = store([1, 2, 3]);
    expect(arr.find((x) => x > 1)).toBe(2);
    expect(arr.find((x) => x > 10)).toBeUndefined();
  });

  it("supports array reduce", () => {
    const arr = store([1, 2, 3]);
    expect(arr.reduce((sum, x) => sum + x, 0)).toBe(6);
  });

  it("supports array slice", () => {
    const arr = store([1, 2, 3, 4]);
    expect(arr.slice(1, 3)).toEqual([2, 3]);
  });

  it("supports array concat", () => {
    const arr = store([1, 2]);
    expect(arr.concat([3, 4])).toEqual([1, 2, 3, 4]);
  });

  it("supports array join", () => {
    const arr = store([1, 2, 3]);
    expect(arr.join("-")).toBe("1-2-3");
  });

  it("does not re-notify when setting same value (Object.is)", () => {
    const state = store({ name: "Alice" });
    let runs = 0;
    const derived = computed(() => {
      runs++;
      return state.name;
    });
    derived.get();
    expect(runs).toBe(1);
    state.name = "Alice";
    derived.get();
    expect(runs).toBe(1);
  });

  it("handles deeply nested objects (3+ levels)", () => {
    const state = store({
      a: { b: { c: { d: "deep" } } },
    });
    expect(state.a.b.c.d).toBe("deep");
    state.a.b.c.d = "deeper";
    expect(state.a.b.c.d).toBe("deeper");
  });

  it("tracks deeply nested property in computed", () => {
    const state = store({ a: { b: { c: 1 } } });
    const derived = computed(() => state.a.b.c * 10);
    expect(derived.get()).toBe(10);
    state.a.b.c = 5;
    expect(derived.get()).toBe(50);
  });

  it("handles null property values", () => {
    const state = store({ value: null as string | null });
    expect(state.value).toBeNull();
    state.value = "hello";
    expect(state.value).toBe("hello");
  });

  it("handles undefined property values", () => {
    const state = store({ value: undefined as string | undefined });
    expect(state.value).toBeUndefined();
    state.value = "hello";
    expect(state.value).toBe("hello");
  });

  it("handles empty object", () => {
    const state = store({});
    expect(Object.keys(state)).toEqual([]);
  });

  it("handles empty array", () => {
    const arr = store([] as number[]);
    expect(arr.length).toBe(0);
    arr.push(1);
    expect(arr.length).toBe(1);
  });

  it("handles Symbol keys", () => {
    const sym = Symbol("key");
    const state = store({ [sym]: "symbol-value" } as { [sym]: string });
    expect((state as any)[sym]).toBe("symbol-value");
    (state as any)[sym] = "new-value";
    expect((state as any)[sym]).toBe("new-value");
  });

  it("handles numeric string keys on objects", () => {
    const state = store({ "0": "zero", "1": "one" } as Record<string, string>);
    expect(state["0"]).toBe("zero");
    state["1"] = "ONE";
    expect(state["1"]).toBe("ONE");
  });

  it("Object.keys returns keys of the store", () => {
    const state = store({ a: 1, b: 2, c: 3 });
    expect(Object.keys(state)).toEqual(["a", "b", "c"]);
  });

  it("Object.values returns values of the store", () => {
    const state = store({ a: 1, b: 2 });
    expect(Object.values(state)).toEqual([1, 2]);
  });

  it("Object.entries returns entries of the store", () => {
    const state = store({ a: 1, b: 2 });
    expect(Object.entries(state)).toEqual([
      ["a", 1],
      ["b", 2],
    ]);
  });

  it("supports for...in iteration", () => {
    const state = store({ a: 1, b: 2, c: 3 });
    const keys: string[] = [];
    for (const key in state) {
      keys.push(key);
    }
    expect(keys).toEqual(["a", "b", "c"]);
  });

  it("supports for...of on array store", () => {
    const arr = store([10, 20, 30]);
    const collected: number[] = [];
    for (const item of arr) {
      collected.push(item);
    }
    expect(collected).toEqual([10, 20, 30]);
  });

  it("JSON.stringify serializes store data", () => {
    const state = store({ name: "Alice", age: 30 });
    const json = JSON.stringify(state);
    expect(JSON.parse(json)).toEqual({ name: "Alice", age: 30 });
  });

  it("spread operator copies store values", () => {
    const state = store({ a: 1, b: 2 });
    const copy = { ...state };
    expect(copy).toEqual({ a: 1, b: 2 });
    expect(copy).not.toBe(raw(state));
  });

  it("destructured properties lose reactivity", () => {
    const state = store({ name: "Alice" });
    const { name } = state;
    expect(name).toBe("Alice");
    state.name = "Bob";
    expect(name).toBe("Alice");
  });

  it("computed caches value when store property has not changed", () => {
    const state = store({ count: 1 });
    let runs = 0;
    const derived = computed(() => {
      runs++;
      return state.count * 10;
    });
    derived.get();
    derived.get();
    derived.get();
    expect(runs).toBe(1);
  });

  it("effect dispose stops tracking store changes", async () => {
    const state = store({ count: 0 });
    const values: number[] = [];
    const dispose = effect(() => {
      values.push(state.count);
    });
    expect(values).toEqual([0]);
    dispose();
    state.count = 1;
    await new Promise((r) => setTimeout(r, 50));
    expect(values).toEqual([0]);
  });

  it("effect cleanup runs when store property changes", async () => {
    const state = store({ count: 0 });
    const cleanups: number[] = [];
    effect(() => {
      state.count;
      return () => {
        cleanups.push(state.count);
      };
    });
    state.count = 1;
    await new Promise((r) => setTimeout(r, 50));
    expect(cleanups.length).toBe(1);
  });

  it("array with nested objects", () => {
    const arr = store([{ name: "Alice" }, { name: "Bob" }]);
    expect(arr[0].name).toBe("Alice");
    arr[0].name = "Charlie";
    expect(arr[0].name).toBe("Charlie");
  });

  it("replacing entire array", () => {
    const state = store({ items: [1, 2, 3] as number[] });
    const len = computed(() => state.items.length);
    expect(len.get()).toBe(3);
    state.items = [4, 5];
    expect(len.get()).toBe(2);
    expect(state.items[0]).toBe(4);
  });

  it("array push triggers effect", async () => {
    const arr = store([1, 2, 3]);
    const lengths: number[] = [];
    effect(() => {
      lengths.push(arr.length);
    });
    expect(lengths).toEqual([3]);
    arr.push(4);
    await new Promise((r) => setTimeout(r, 50));
    expect(lengths[lengths.length - 1]).toBe(4);
  });

  it("array splice triggers effect", async () => {
    const arr = store([1, 2, 3]);
    const lengths: number[] = [];
    effect(() => {
      lengths.push(arr.length);
    });
    expect(lengths).toEqual([3]);
    arr.splice(1, 1);
    await new Promise((r) => setTimeout(r, 50));
    expect(lengths[lengths.length - 1]).toBe(2);
  });

  it("multiple effects on same property", async () => {
    const state = store({ count: 0 });
    const values1: number[] = [];
    const values2: number[] = [];
    effect(() => {
      values1.push(state.count);
    });
    effect(() => {
      values2.push(state.count);
    });
    state.count = 5;
    await new Promise((r) => setTimeout(r, 50));
    expect(values1[values1.length - 1]).toBe(5);
    expect(values2[values2.length - 1]).toBe(5);
  });

  it("handles setting property to same object reference", () => {
    const obj = { name: "Alice" };
    const state = store({ user: obj });
    let runs = 0;
    const derived = computed(() => {
      runs++;
      return state.user.name;
    });
    derived.get();
    expect(runs).toBe(1);
    state.user = obj;
    derived.get();
    expect(runs).toBe(1);
  });

  it("raw() on nested store returns nested raw object", () => {
    const state = store({ user: { name: "Alice" } });
    const userRaw = raw(state.user);
    expect(userRaw).toEqual({ name: "Alice" });
    expect(userRaw).not.toBe(state.user);
  });

  it("handles boolean property values", () => {
    const state = store({ active: true, disabled: false });
    expect(state.active).toBe(true);
    expect(state.disabled).toBe(false);
    state.active = false;
    expect(state.active).toBe(false);
  });

  it("handles numeric property values", () => {
    const state = store({ count: 0, pi: 3.14 });
    expect(state.count).toBe(0);
    expect(state.pi).toBeCloseTo(3.14);
  });

  it("handles RegExp without wrapping", () => {
    const state = store({ pattern: /test/gi });
    expect(state.pattern instanceof RegExp).toBe(true);
    expect(state.pattern.test("TEST")).toBe(true);
  });

  it("handles Map without wrapping", () => {
    const m = new Map([["key", "value"]]);
    const state = store({ map: m });
    expect(state.map).toBe(m);
    expect(state.map.get("key")).toBe("value");
  });

  it("handles Set without wrapping", () => {
    const s = new Set([1, 2, 3]);
    const state = store({ set: s });
    expect(state.set).toBe(s);
    expect(state.set.has(2)).toBe(true);
  });

  it("supports has check with in operator", () => {
    const state = store({ name: "Alice" });
    expect("name" in state).toBe(true);
    expect("age" in state).toBe(false);
  });

  it("supports Object.getOwnPropertyNames", () => {
    const state = store({ a: 1, b: 2 });
    expect(Object.getOwnPropertyNames(state)).toEqual(["a", "b"]);
  });

  it("setting property to undefined then back to value", () => {
    const state = store({ name: "Alice" as string | undefined });
    state.name = undefined;
    expect(state.name).toBeUndefined();
    state.name = "Bob";
    expect(state.name).toBe("Bob");
  });

  it("Array.isArray returns true for array store", () => {
    const arr = store([1, 2, 3]);
    expect(Array.isArray(arr)).toBe(true);
  });

  it("typeof returns object for object store", () => {
    const state = store({ name: "Alice" });
    expect(typeof state).toBe("object");
  });

  it("toString on store array", () => {
    const arr = store([1, 2, 3]);
    expect(arr.toString()).toBe("1,2,3");
  });

  it("NaN value does not re-notify (Object.is)", () => {
    const state = store({ value: NaN });
    let runs = 0;
    const derived = computed(() => {
      runs++;
      return state.value;
    });
    derived.get();
    expect(runs).toBe(1);
    state.value = NaN;
    derived.get();
    expect(runs).toBe(1);
  });

  it("0 and -0 are distinct values (Object.is)", () => {
    const state = store({ value: 0 });
    expect(Object.is(state.value, 0)).toBe(true);
    state.value = -0;
    expect(Object.is(state.value, -0)).toBe(true);
    expect(Object.is(state.value, 0)).toBe(false);
  });

  it("0 to -0 triggers re-notification (Object.is)", () => {
    const state = store({ value: 0 });
    let runs = 0;
    const derived = computed(() => {
      runs++;
      return state.value;
    });
    derived.get();
    expect(runs).toBe(1);
    state.value = -0;
    derived.get();
    expect(runs).toBe(2);
  });

  it("supports array every", () => {
    const arr = store([2, 4, 6]);
    expect(arr.every((x) => x % 2 === 0)).toBe(true);
    expect(arr.every((x) => x > 3)).toBe(false);
  });

  it("supports array some", () => {
    const arr = store([1, 2, 3]);
    expect(arr.some((x) => x > 2)).toBe(true);
    expect(arr.some((x) => x > 10)).toBe(false);
  });

  it("supports array findIndex", () => {
    const arr = store([1, 2, 3]);
    expect(arr.findIndex((x) => x > 1)).toBe(1);
    expect(arr.findIndex((x) => x > 10)).toBe(-1);
  });

  it("supports array flat", () => {
    const arr = store([
      [1, 2],
      [3, 4],
    ] as number[][]);
    expect(arr.flat()).toEqual([1, 2, 3, 4]);
  });

  it("supports array flatMap", () => {
    const arr = store([1, 2, 3]);
    expect(arr.flatMap((x) => [x, x * 2])).toEqual([1, 2, 2, 4, 3, 6]);
  });

  it("supports array fill", () => {
    const arr = store([1, 2, 3, 4]);
    arr.fill(0, 1, 3);
    expect(arr[0]).toBe(1);
    expect(arr[1]).toBe(0);
    expect(arr[2]).toBe(0);
    expect(arr[3]).toBe(4);
  });

  it("supports array at", () => {
    const arr = store([10, 20, 30]);
    expect(arr.at(0)).toBe(10);
    expect(arr.at(-1)).toBe(30);
    expect(arr.at(5)).toBeUndefined();
  });

  it("supports array entries iterator", () => {
    const arr = store(["a", "b"]);
    const result = [...arr.entries()];
    expect(result).toEqual([
      [0, "a"],
      [1, "b"],
    ]);
  });

  it("supports array keys iterator", () => {
    const arr = store(["a", "b", "c"]);
    const result = [...arr.keys()];
    expect(result).toEqual([0, 1, 2]);
  });

  it("supports array values iterator", () => {
    const arr = store([10, 20]);
    const result = [...arr.values()];
    expect(result).toEqual([10, 20]);
  });

  it("setting array length truncates the array", () => {
    const arr = store([1, 2, 3, 4, 5]);
    arr.length = 3;
    expect(arr.length).toBe(3);
    expect(arr[3]).toBeUndefined();
  });

  it("setting array length to 0 clears the array", () => {
    const arr = store([1, 2, 3]);
    arr.length = 0;
    expect(arr.length).toBe(0);
  });

  it("spread operator on store array", () => {
    const arr = store([1, 2, 3]);
    const copy = [...arr];
    expect(copy).toEqual([1, 2, 3]);
    expect(Array.isArray(copy)).toBe(true);
  });

  it("Array.from on store array", () => {
    const arr = store([1, 2, 3]);
    const copy = Array.from(arr);
    expect(copy).toEqual([1, 2, 3]);
  });

  it("handles object with null prototype", () => {
    const obj = Object.create(null);
    obj.name = "Alice";
    const state = store(obj);
    expect(state.name).toBe("Alice");
    state.name = "Bob";
    expect(state.name).toBe("Bob");
  });

  it("handles function property values without wrapping", () => {
    const fn = () => 42;
    const state = store({ callback: fn });
    expect(state.callback).toBe(fn);
    expect(state.callback()).toBe(42);
  });

  it("handles getter properties on initial object", () => {
    const state = store({
      first: "Alice",
      last: "Smith",
      get full() {
        return `${this.first} ${this.last}`;
      },
    });
    expect(state.full).toBe("Alice Smith");
  });

  it("raw() on null returns null", () => {
    expect(raw(null as any)).toBeNull();
  });

  it("raw() on undefined returns undefined", () => {
    expect(raw(undefined as any)).toBeUndefined();
  });

  it("raw() on primitive returns the primitive", () => {
    expect(raw(42 as any)).toBe(42);
    expect(raw("hello" as any)).toBe("hello");
  });

  it("Object.assign merges into store", () => {
    const state = store({ a: 1 } as Record<string, number>);
    Object.assign(state, { b: 2, c: 3 });
    expect(state.a).toBe(1);
    expect(state.b).toBe(2);
    expect(state.c).toBe(3);
  });

  it("deleting non-existent property does not notify", async () => {
    const state = store({ name: "Alice" });
    let runs = 0;
    const derived = computed(() => {
      runs++;
      return state.name;
    });
    derived.get();
    expect(runs).toBe(1);
    delete (state as any).nonExistent;
    derived.get();
    expect(runs).toBe(1);
  });

  it("store mutations reflect in raw object", () => {
    const data = { name: "Alice", age: 30 };
    const state = store(data);
    state.name = "Bob";
    expect(raw(state).name).toBe("Bob");
  });

  it("nested store mutations reflect in raw object", () => {
    const state = store({ user: { name: "Alice" } });
    state.user.name = "Bob";
    expect(raw(state).user.name).toBe("Bob");
  });

  it("two stores sharing same nested object are independent", () => {
    const shared = { name: "Alice" };
    const state1 = store({ user: shared });
    const state2 = store({ user: shared });
    state1.user.name = "Bob";
    expect(state2.user.name).toBe("Bob");
  });

  it("store with toString/valueOf methods", () => {
    const state = store({
      value: 42,
      toString() {
        return `value: ${state.value}`;
      },
    });
    expect(String(state)).toBe("value: 42");
  });

  it("array lastIndexOf", () => {
    const arr = store([1, 2, 3, 2, 1]);
    expect(arr.lastIndexOf(2)).toBe(3);
    expect(arr.lastIndexOf(5)).toBe(-1);
  });

  it("array reduceRight", () => {
    const arr = store([1, 2, 3]);
    expect(arr.reduceRight((acc, x) => acc + x, 0)).toBe(6);
  });

  it("replacing nested object triggers effect on nested property", async () => {
    const state = store({ user: { name: "Alice" } });
    const values: string[] = [];
    effect(() => {
      values.push(state.user.name);
    });
    expect(values).toEqual(["Alice"]);
    state.user = { name: "Bob" };
    await new Promise((r) => setTimeout(r, 50));
    expect(values[values.length - 1]).toBe("Bob");
  });

  it("adding new property triggers effect", async () => {
    const state = store({} as Record<string, string>);
    const values: string[] = [];
    effect(() => {
      values.push(state.name ?? "undefined");
    });
    expect(values).toEqual(["undefined"]);
    state.name = "Alice";
    await new Promise((r) => setTimeout(r, 50));
    expect(values[values.length - 1]).toBe("Alice");
  });
});

describe("signalOf", () => {
  it("returns a Signal.State for a top-level property", () => {
    const state = store({ name: "Alice", age: 30 });
    const nameSignal = signalOf(state, "name");
    expect(Signal.isState(nameSignal)).toBe(true);
    expect(nameSignal.get()).toBe("Alice");
  });

  it("returns a Signal.State for a nested property via multi-key path", () => {
    const state = store({ user: { name: "Alice" } });
    const nameSignal = signalOf(state, "user", "name");
    expect(nameSignal.get()).toBe("Alice");
  });

  it("returns a Signal.State for deeply nested path (3+ levels)", () => {
    const state = store({ a: { b: { c: { d: "deep" } } } });
    const dSignal = signalOf(state, "a", "b", "c", "d");
    expect(dSignal.get()).toBe("deep");
  });

  it("returns a Signal.State for a top-level object property", () => {
    const state = store({ user: { name: "Alice" } });
    const userSignal = signalOf(state, "user");
    expect(userSignal.get()).toEqual({ name: "Alice" });
  });

  it(".set() updates the store property", () => {
    const state = store({ name: "Alice" });
    const nameSignal = signalOf(state, "name");
    nameSignal.set("Bob");
    expect(state.name).toBe("Bob");
    expect(nameSignal.get()).toBe("Bob");
  });

  it(".set() on nested signal updates the store", () => {
    const state = store({ user: { name: "Alice" } });
    const nameSignal = signalOf(state, "user", "name");
    nameSignal.set("Bob");
    expect(state.user.name).toBe("Bob");
    expect(nameSignal.get()).toBe("Bob");
  });

  it("store property change reflects in signalOf", () => {
    const state = store({ name: "Alice" });
    const nameSignal = signalOf(state, "name");
    state.name = "Bob";
    expect(nameSignal.get()).toBe("Bob");
  });

  it("nested store property change reflects in signalOf", () => {
    const state = store({ user: { name: "Alice" } });
    const nameSignal = signalOf(state, "user", "name");
    state.user.name = "Bob";
    expect(nameSignal.get()).toBe("Bob");
  });

  it("returns the same signal instance for the same property", () => {
    const state = store({ name: "Alice" });
    const s1 = signalOf(state, "name");
    const s2 = signalOf(state, "name");
    expect(s1).toBe(s2);
  });

  it("lazily creates signal on first call", () => {
    const state = store({ name: "Alice" });
    const signalsBefore = (state as any)[Symbol.for("rikka.signals")];
    const nameSignal = signalOf(state, "name");
    expect(nameSignal.get()).toBe("Alice");
    const s2 = signalOf(state, "name");
    expect(s2).toBe(nameSignal);
  });

  it("works with array index path", () => {
    const arr = store([10, 20, 30]);
    const firstSignal = signalOf(arr, 0);
    expect(firstSignal.get()).toBe(10);
    firstSignal.set(99);
    expect(arr[0]).toBe(99);
  });

  it("works with nested array in object", () => {
    const state = store({ items: [1, 2, 3] });
    const itemSignal = signalOf(state, "items", 1);
    expect(itemSignal.get()).toBe(2);
    itemSignal.set(20);
    expect(state.items[1]).toBe(20);
  });

  it("throws when called on a non-store target", () => {
    const plain = { name: "Alice" };
    expect(() => signalOf(plain as any, "name")).toThrow(
      "signalOf: target is not a store",
    );
  });

  it("works with computed", () => {
    const state = store({ name: "Alice" });
    const nameSignal = signalOf(state, "name");
    const greeting = computed(() => `Hello, ${nameSignal.get()}!`);
    expect(greeting.get()).toBe("Hello, Alice!");
    state.name = "Bob";
    expect(greeting.get()).toBe("Hello, Bob!");
  });

  it("works with effect", async () => {
    const state = store({ count: 0 });
    const countSignal = signalOf(state, "count");
    const values: number[] = [];
    effect(() => {
      values.push(countSignal.get());
    });
    expect(values).toEqual([0]);
    state.count = 1;
    await new Promise((r) => setTimeout(r, 50));
    expect(values[values.length - 1]).toBe(1);
  });

  it(".set() triggers effects", async () => {
    const state = store({ count: 0 });
    const countSignal = signalOf(state, "count");
    const values: number[] = [];
    effect(() => {
      values.push(countSignal.get());
    });
    expect(values).toEqual([0]);
    countSignal.set(5);
    await new Promise((r) => setTimeout(r, 50));
    expect(values[values.length - 1]).toBe(5);
    expect(state.count).toBe(5);
  });

  it("signalOf on nested proxy obtained from store", () => {
    const state = store({ user: { name: "Alice" } });
    const userProxy = state.user;
    const nameSignal = signalOf(userProxy, "name");
    expect(nameSignal.get()).toBe("Alice");
    nameSignal.set("Bob");
    expect(state.user.name).toBe("Bob");
  });

  it("signalOf after property was never accessed", () => {
    const state = store({ name: "Alice", age: 30 });
    const ageSignal = signalOf(state, "age");
    expect(ageSignal.get()).toBe(30);
  });

  it("signalOf on property added after store creation", () => {
    const state = store({} as { name?: string });
    state.name = "Alice";
    const nameSignal = signalOf(state, "name");
    expect(nameSignal.get()).toBe("Alice");
  });

  it("signalOf with number key on object", () => {
    const state = store({ 0: "zero", 1: "one" } as Record<string, string>);
    const s = signalOf(state, "0");
    expect(s.get()).toBe("zero");
  });

  it("signalOf on array length", () => {
    const arr = store([1, 2, 3]);
    const lenSignal = signalOf(arr, "length");
    expect(lenSignal.get()).toBe(3);
    arr.push(4);
    expect(lenSignal.get()).toBe(4);
  });

  it("signalOf .set() on nested path triggers computed recompute", () => {
    const state = store({ a: { b: 1 } });
    const bSignal = signalOf(state, "a", "b");
    const doubled = computed(() => bSignal.get() * 2);
    expect(doubled.get()).toBe(2);
    bSignal.set(5);
    expect(doubled.get()).toBe(10);
    expect(state.a.b).toBe(5);
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

  it("multiple effects on different properties are independent", async () => {
    const state = store({ x: 1, y: 2 });
    const xValues: number[] = [];
    const yValues: number[] = [];
    effect(() => {
      xValues.push(state.x);
    });
    effect(() => {
      yValues.push(state.y);
    });
    expect(xValues).toEqual([1]);
    expect(yValues).toEqual([2]);
    state.x = 10;
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

describe("store additional edge cases", () => {
  it("accessing non-existent property returns undefined", () => {
    const state = store({ name: "Alice" } as { name: string; age?: number });
    expect(state.age).toBeUndefined();
  });

  it("store array sort triggers effect", async () => {
    const arr = store([3, 1, 2]);
    const values: string[] = [];
    effect(() => {
      values.push(arr.join(","));
    });
    expect(values).toEqual(["3,1,2"]);
    arr.sort();
    await new Promise((r) => setTimeout(r, 50));
    expect(values[values.length - 1]).toBe("1,2,3");
  });

  it("store array reverse triggers effect", async () => {
    const arr = store([1, 2, 3]);
    const values: string[] = [];
    effect(() => {
      values.push(arr.join(","));
    });
    expect(values).toEqual(["1,2,3"]);
    arr.reverse();
    await new Promise((r) => setTimeout(r, 50));
    expect(values[values.length - 1]).toBe("3,2,1");
  });

  it("store array map returns raw values from nested objects", () => {
    const arr = store([{ name: "Alice" }, { name: "Bob" }]);
    const names = arr.map((item) => item.name);
    expect(names).toEqual(["Alice", "Bob"]);
  });

  it("store with self-referencing property", () => {
    const state = store({ name: "Alice", self: null as any });
    state.self = state;
    expect(state.self.name).toBe("Alice");
  });

  it("store array fill triggers effect", async () => {
    const arr = store([1, 2, 3, 4]);
    const values: number[] = [];
    effect(() => {
      values.push(arr[1]);
    });
    expect(values).toEqual([2]);
    arr.fill(0, 1, 3);
    await new Promise((r) => setTimeout(r, 50));
    expect(values[values.length - 1]).toBe(0);
  });

  it("store with very deep nesting", () => {
    const deep: any = { value: "leaf" };
    let current = deep;
    for (let i = 0; i < 50; i++) {
      current = { child: current };
    }
    const state = store(current);
    let target: any = state;
    for (let i = 0; i < 50; i++) {
      target = target.child;
    }
    expect(target.value).toBe("leaf");
  });

  it("store property set to same primitive does not re-notify", () => {
    const state = store({ count: 5 });
    let runs = 0;
    const derived = computed(() => {
      runs++;
      return state.count;
    });
    derived.get();
    expect(runs).toBe(1);
    state.count = 5;
    derived.get();
    expect(runs).toBe(1);
  });

  it("store with ArrayBuffer does not wrap", () => {
    const buffer = new ArrayBuffer(8);
    const state = store({ buffer });
    expect(state.buffer).toBe(buffer);
    expect(state.buffer instanceof ArrayBuffer).toBe(true);
  });

  it("store array includes with NaN", () => {
    const arr = store([1, NaN, 3]);
    expect(arr.includes(NaN)).toBe(true);
  });

  it("store array copyWithin", () => {
    const arr = store([1, 2, 3, 4, 5]);
    arr.copyWithin(0, 3, 5);
    expect(arr[0]).toBe(4);
    expect(arr[1]).toBe(5);
  });

  it("store with DataView does not wrap", () => {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    const state = store({ view });
    expect(state.view).toBe(view);
    expect(state.view instanceof DataView).toBe(true);
  });

  it("store array splice with no removal adds items", () => {
    const arr = store([1, 2, 3]);
    arr.splice(1, 0, 10, 20);
    expect(arr.length).toBe(5);
    expect(arr[1]).toBe(10);
    expect(arr[2]).toBe(20);
  });

  it("store nested array with computed tracking", () => {
    const state = store({
      items: [
        [1, 2],
        [3, 4],
      ] as number[][],
    });
    const flat = computed(() => state.items.flat());
    expect(flat.get()).toEqual([1, 2, 3, 4]);
    state.items = [
      [5, 6],
      [7, 8],
    ];
    expect(flat.get()).toEqual([5, 6, 7, 8]);
  });

  it("store with Int8Array does not wrap", () => {
    const typed = new Int8Array([1, 2, 3]);
    const state = store({ data: typed });
    expect(state.data).toBe(typed);
    expect(state.data instanceof Int8Array).toBe(true);
  });

  it("store delete then re-add property", () => {
    const state = store({ name: "Alice" as string | undefined });
    delete state.name;
    expect(state.name).toBeUndefined();
    state.name = "Bob";
    expect(state.name).toBe("Bob");
  });

  it("store array shift on empty array", () => {
    const arr = store([] as number[]);
    const result = arr.shift();
    expect(result).toBeUndefined();
    expect(arr.length).toBe(0);
  });

  it("store array pop on empty array", () => {
    const arr = store([] as number[]);
    const result = arr.pop();
    expect(result).toBeUndefined();
    expect(arr.length).toBe(0);
  });

  describe("nested proxy reference stability", () => {
    it("old proxy reference reflects new data after replacement", () => {
      const state = store({ user: { name: "Alice" } });
      const oldUser = state.user;

      state.user = { name: "Bob" };

      expect(oldUser.name).toBe("Bob");
      expect(state.user.name).toBe("Bob");
    });

    it("old proxy $signal reflects new data after replacement", () => {
      const state = store({ user: { name: "Alice" } });
      const nameSignal = signalOf(state, "user", "name");

      state.user = { name: "Bob" };

      expect(nameSignal.get()).toBe("Bob");
      expect(signalOf(state, "user", "name").get()).toBe("Bob");
    });

    it("old proxy and new proxy are the same object", () => {
      const state = store({ user: { name: "Alice" } });
      const oldUser = state.user;

      state.user = { name: "Bob" };

      expect(state.user).toBe(oldUser);
    });

    it("deep nesting: old proxy reflects new data after root replacement", () => {
      const state = store({ a: { b: { c: 1 } } });
      const bProxy = state.a.b;
      const cSignal = signalOf(bProxy, "c");

      state.a = { b: { c: 2 } };

      expect(bProxy.c).toBe(2);
      expect(cSignal.get()).toBe(2);
      expect(state.a.b.c).toBe(2);
    });

    it("effect re-runs when nested object replaced and old signal is read", async () => {
      const state = store({ user: { name: "Alice" } });
      const nameSignal = signalOf(state, "user", "name");
      const values: string[] = [];

      effect(() => {
        values.push(nameSignal.get());
      });
      expect(values).toEqual(["Alice"]);

      state.user = { name: "Bob" };
      await new Promise((r) => setTimeout(r, 50));
      expect(values[values.length - 1]).toBe("Bob");
    });

    it("raw() on old proxy returns current raw object", () => {
      const state = store({ user: { name: "Alice" } });
      const oldUser = state.user;

      state.user = { name: "Bob" };

      expect(raw(oldUser)).toEqual({ name: "Bob" });
    });

    it("writing through old proxy updates current data", () => {
      const state = store({ user: { name: "Alice" } });
      const oldUser = state.user;

      state.user = { name: "Bob" };
      oldUser.name = "Charlie";

      expect(state.user.name).toBe("Charlie");
      expect(raw(state).user.name).toBe("Charlie");
    });

    it("sync handles properties removed in new object", () => {
      const state = store({
        user: { name: "Alice", age: 30 } as { name: string; age?: number },
      });
      const ageSignal = signalOf(state, "user", "age");

      state.user = { name: "Bob" };

      expect(ageSignal.get()).toBeUndefined();
      expect(state.user.name).toBe("Bob");
    });

    it("sync handles properties added in new object", () => {
      const state = store({
        user: { name: "Alice" } as { name: string; age?: number },
      });
      const oldUser = state.user;

      state.user = { name: "Bob", age: 25 };

      expect(oldUser.name).toBe("Bob");
      expect(oldUser.age).toBe(25);
    });

    it("signalOf(state, 'user') remains correct after replacement", () => {
      const state = store({ user: { name: "Alice" } });
      const userSignal = signalOf(state, "user");

      state.user = { name: "Bob" };

      expect(userSignal.get()).toEqual({ name: "Bob" });
      expect(signalOf(state, "user").get()).toEqual({ name: "Bob" });
    });

    it("nested array replacement: old proxy reflects new data", () => {
      const state = store({ items: [1, 2, 3] as number[] });
      const oldItems = state.items;

      state.items = [4, 5];

      expect(oldItems.length).toBe(2);
      expect(oldItems[0]).toBe(4);
      expect(state.items[0]).toBe(4);
    });

    it("multiple sequential replacements", () => {
      const state = store({ user: { name: "Alice" } });
      const oldUser = state.user;
      const nameSignal = signalOf(oldUser, "name");

      state.user = { name: "Bob" };
      expect(oldUser.name).toBe("Bob");
      expect(nameSignal.get()).toBe("Bob");

      state.user = { name: "Charlie" };
      expect(oldUser.name).toBe("Charlie");
      expect(nameSignal.get()).toBe("Charlie");
    });

    it("replace nested object with null then restore", () => {
      const state = store({ user: { name: "Alice" } } as any);
      const oldUser = state.user as any;
      const nameSignal = signalOf(oldUser, "name");

      state.user = null;
      expect(nameSignal.get()).toBeUndefined();

      state.user = { name: "Bob" };
      expect(oldUser.name).toBe("Bob");
      expect(nameSignal.get()).toBe("Bob");
    });

    it("replace nested object with primitive then restore", () => {
      const state = store({ user: { name: "Alice" } } as any);
      const oldUser = state.user as any;
      const nameSignal = signalOf(oldUser, "name");

      state.user = "not an object";
      expect(nameSignal.get()).toBeUndefined();

      state.user = { name: "Bob" };
      expect(oldUser.name).toBe("Bob");
      expect(nameSignal.get()).toBe("Bob");
    });

    it("delete nested property then re-add: old signal syncs", () => {
      const state = store({
        user: { name: "Alice", age: 30 } as { name: string; age?: number },
      });
      const ageSignal = signalOf(state, "user", "age");

      delete state.user.age;
      expect(ageSignal.get()).toBeUndefined();

      state.user.age = 25;
      expect(ageSignal.get()).toBe(25);
    });

    it("delete parent property then re-add: nested proxy recovers", () => {
      const state = store({ user: { name: "Alice" } } as any);
      const oldUser = state.user as any;
      const nameSignal = signalOf(oldUser, "name");

      delete state.user;
      expect(nameSignal.get()).toBeUndefined();

      state.user = { name: "Bob" };
      expect(oldUser.name).toBe("Bob");
      expect(nameSignal.get()).toBe("Bob");
    });

    it("deep nesting: replace middle level syncs deeper signals", () => {
      const state = store({ a: { b: { c: 1, d: 2 } } });
      const bProxy = state.a.b;
      const cSignal = signalOf(bProxy, "c");
      const dSignal = signalOf(bProxy, "d");

      state.a = { b: { c: 10, d: 20 } };

      expect(bProxy.c).toBe(10);
      expect(bProxy.d).toBe(20);
      expect(cSignal.get()).toBe(10);
      expect(dSignal.get()).toBe(20);
    });

    it("deep nesting: replace root syncs all levels", () => {
      const state = store({ a: { b: { c: { d: 1 } } } });
      const bProxy = state.a.b;
      const cProxy = bProxy.c;
      const dSignal = signalOf(cProxy, "d");

      state.a = { b: { c: { d: 99 } } };

      expect(bProxy.c.d).toBe(99);
      expect(cProxy.d).toBe(99);
      expect(dSignal.get()).toBe(99);
    });

    it("property changes from object to primitive: nested signals sync to undefined", () => {
      const state = store({ user: { name: "Alice" } } as any);
      const oldUser = state.user as any;
      const nameSignal = signalOf(oldUser, "name");

      state.user = 42;
      expect(nameSignal.get()).toBeUndefined();
    });

    it("computed with old signal reference after replacement", () => {
      const state = store({ user: { name: "Alice" } });
      const nameSignal = signalOf(state, "user", "name");
      const greeting = computed(() => `Hello, ${nameSignal.get()}!`);

      expect(greeting.get()).toBe("Hello, Alice!");
      state.user = { name: "Bob" };
      expect(greeting.get()).toBe("Hello, Bob!");
    });

    it("effect with old signal after delete and re-add", async () => {
      const state = store({ user: { name: "Alice" } } as any);
      const nameSignal = signalOf(state, "user", "name");
      const values: (string | undefined)[] = [];

      effect(() => {
        values.push(nameSignal.get());
      });
      expect(values).toEqual(["Alice"]);

      delete state.user;
      await new Promise((r) => setTimeout(r, 50));
      expect(values[values.length - 1]).toBeUndefined();

      state.user = { name: "Bob" };
      await new Promise((r) => setTimeout(r, 50));
      expect(values[values.length - 1]).toBe("Bob");
    });

    it("writing through old proxy after delete and re-add", () => {
      const state = store({ user: { name: "Alice" } } as any);
      const oldUser = state.user as any;

      delete state.user;
      state.user = { name: "Bob" };

      oldUser.name = "Charlie";
      expect(state.user.name).toBe("Charlie");
    });

    it("nested array push through old proxy after replacement", () => {
      const state = store({ items: [1, 2, 3] as number[] });
      const oldItems = state.items;

      state.items = [4, 5];
      oldItems.push(6);

      expect(state.items.length).toBe(3);
      expect(state.items[2]).toBe(6);
    });

    it("Object.keys on old proxy after replacement", () => {
      const state = store({ user: { name: "Alice", age: 30 } } as any);
      const oldUser = state.user as any;

      state.user = { name: "Bob" };

      expect(Object.keys(oldUser)).toEqual(["name"]);
    });

    it("for...in on old proxy after replacement", () => {
      const state = store({
        user: { name: "Alice", age: 30 } as Record<string, unknown>,
      });
      const oldUser = state.user;

      state.user = { name: "Bob" };

      const keys: string[] = [];
      for (const key in oldUser) {
        keys.push(key);
      }
      expect(keys).toEqual(["name"]);
    });

    it("JSON.stringify on old proxy after replacement", () => {
      const state = store({ user: { name: "Alice" } });
      const oldUser = state.user;

      state.user = { name: "Bob" };

      expect(JSON.stringify(oldUser)).toBe('{"name":"Bob"}');
    });

    it("spread operator on old proxy after replacement", () => {
      const state = store({ user: { name: "Alice" } });
      const oldUser = state.user;

      state.user = { name: "Bob" };

      const copy = { ...oldUser };
      expect(copy).toEqual({ name: "Bob" });
    });
  });
});
