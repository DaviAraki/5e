import { describe, expect, it } from "vitest";
import {
  emptyTri,
  triCycle,
  triIsEmpty,
  triMatch,
  triSize,
} from "@/state/triStateFilter";

/**
 * Foundation tests for the tri-state filter primitives.
 *
 * Every category filter (`spellFilters`, `bestiaryFilters`, `itemFilters`, ...)
 * AND-combines tri-state dimensions via triMatch, and cycles values via
 * triCycle. A regression here silently corrupts every filter UI, so this file
 * pins the state-machine + matching semantics precisely.
 */

describe("emptyTri / triIsEmpty", () => {
  it("emptyTri returns two empty sets", () => {
    const t = emptyTri();
    expect(t.include).toBeInstanceOf(Set);
    expect(t.exclude).toBeInstanceOf(Set);
    expect(t.include.size).toBe(0);
    expect(t.exclude.size).toBe(0);
    expect(triIsEmpty(t)).toBe(true);
  });

  it("triIsEmpty is false when either set has members", () => {
    expect(triIsEmpty({ include: new Set(["a"]), exclude: new Set() })).toBe(false);
    expect(triIsEmpty({ include: new Set(), exclude: new Set(["a"]) })).toBe(false);
  });
});

describe("triSize", () => {
  it("sums include and exclude cardinality", () => {
    expect(triSize(emptyTri())).toBe(0);
    expect(triSize({ include: new Set(["a", "b"]), exclude: new Set() })).toBe(2);
    expect(triSize({ include: new Set(["a"]), exclude: new Set(["x", "y"]) })).toBe(3);
  });
});

describe("triCycle", () => {
  it("cycles neutral -> include -> exclude -> neutral", () => {
    const start = emptyTri();
    const inc = triCycle(start, "fire");
    expect([...inc.include]).toEqual(["fire"]);
    expect([...inc.exclude]).toEqual([]);

    const exc = triCycle(inc, "fire");
    expect([...exc.include]).toEqual([]);
    expect([...exc.exclude]).toEqual(["fire"]);

    const back = triCycle(exc, "fire");
    expect(back.include.size).toBe(0);
    expect(back.exclude.size).toBe(0);
  });

  it("does not affect other values in the same dimension", () => {
    let t = triCycle(emptyTri(), "fire");
    t = triCycle(t, "cold");
    t = triCycle(t, "fire"); // fire -> exclude
    expect([...t.include]).toEqual(["cold"]);
    expect([...t.exclude]).toEqual(["fire"]);
  });

  it("is immutable — original TriState is untouched", () => {
    const original = emptyTri();
    triCycle(original, "fire");
    expect(original.include.size).toBe(0);
    expect(original.exclude.size).toBe(0);
  });
});

describe("triMatch", () => {
  it("returns true when the dimension is inactive (both sets empty)", () => {
    expect(triMatch(emptyTri(), ["fire"])).toBe(true);
    expect(triMatch(emptyTri(), [])).toBe(true);
    expect(triMatch(emptyTri(), new Set(["fire"]))).toBe(true);
  });

  describe("include semantics (OR)", () => {
    it("passes if ANY candidate value is in the include set", () => {
      const t = { include: new Set(["fire", "cold"]), exclude: new Set<string>() };
      expect(triMatch(t, ["fire"])).toBe(true);
      expect(triMatch(t, ["cold", "acid"])).toBe(true);
    });

    it("fails if NO candidate value is in the include set", () => {
      const t = { include: new Set(["fire"]), exclude: new Set<string>() };
      expect(triMatch(t, ["acid"])).toBe(false);
      expect(triMatch(t, [])).toBe(false);
    });
  });

  describe("exclude semantics (OR-reject)", () => {
    it("fails if ANY candidate value is in the exclude set", () => {
      const t = { include: new Set<string>(), exclude: new Set(["fire"]) };
      expect(triMatch(t, ["fire"])).toBe(false);
      expect(triMatch(t, ["fire", "cold"])).toBe(false); // any excluded -> fail
    });

    it("passes if no candidate value is excluded and include is empty", () => {
      const t = { include: new Set<string>(), exclude: new Set(["fire"]) };
      expect(triMatch(t, ["cold"])).toBe(true);
      expect(triMatch(t, [])).toBe(true); // nothing tripped, no include requirement
    });
  });

  describe("both include and exclude active", () => {
    it("must pass include AND must not trip exclude", () => {
      const t = {
        include: new Set(["fire", "cold"]),
        exclude: new Set(["acid"]),
      };
      expect(triMatch(t, ["fire"])).toBe(true); // included, not excluded
      expect(triMatch(t, ["fire", "acid"])).toBe(false); // excluded value present
      expect(triMatch(t, ["acid"])).toBe(false); // not included
      expect(triMatch(t, ["lightning"])).toBe(false); // not included
    });
  });

  it("accepts any re-iterable Iterable<string> (array, Set)", () => {
    const t = { include: new Set(["fire"]), exclude: new Set<string>() };
    expect(triMatch(t, new Set(["fire", "cold"]))).toBe(true);
  });

  // FIXME: footgun — triMatch iterates `values` TWICE (once for the exclude
  // pass, once for the include pass). Single-use iterables like generators
  // will appear empty on the second pass and produce wrong results. Pinning
  // current behavior; callers must pass re-iterable values.
  it("does NOT support single-use iterables (generator exhausted on second pass)", () => {
    const t = { include: new Set(["fire"]), exclude: new Set<string>() };
    function* gen() {
      yield "fire";
    }
    // First pass (exclude) consumes the generator; second pass (include) sees nothing.
    expect(triMatch(t, gen())).toBe(false);
  });
});
