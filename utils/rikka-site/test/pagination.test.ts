import { describe, it, expect } from "@rstest/core";
import { paginate } from "../src/pagination.js";
import type { RangeSpec } from "../src/context.js";

describe("paginate", () => {
  const items = [1, 2, 3, 4, 5];

  it("returns full content when no range is provided", () => {
    const repr = paginate(items);
    expect(repr.content).toEqual(items);
    expect(repr.meta).toEqual({});
  });

  it("returns full content when range unit is not items", () => {
    const range: RangeSpec = { unit: "bytes", ranges: [{ start: 0, end: 2 }], total: 5 };
    expect(paginate(items, range).content).toEqual(items);
  });

  it("returns partial content for an items range", () => {
    const range: RangeSpec = { unit: "items", ranges: [{ start: 1, end: 3 }], total: 5 };
    const repr = paginate(items, range);
    expect(repr.content).toEqual({
      unit: "items",
      data: [[1, [2, 3, 4]]],
      total: 5,
    });
  });

  it("falls back to items.length when total is not a number", () => {
    const range: RangeSpec = { unit: "items", ranges: [{ start: 0, end: 1 }], total: "*" };
    const content = paginate(items, range).content as { total: number };
    expect(content.total).toBe(5);
  });

  it("handles open-ended ranges", () => {
    const range: RangeSpec = { unit: "items", ranges: [{ start: 2, end: undefined }], total: 5 };
    const content = paginate(items, range).content as { data: [[number, number[]]] };
    expect(content.data[0]![1]).toEqual([3, 4, 5]);
  });

  it("returns full content for empty range segments", () => {
    const range: RangeSpec = { unit: "items", ranges: [], total: 5 };
    expect(paginate(items, range).content).toEqual(items);
  });
});
