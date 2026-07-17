import { describe, expect, it } from "vitest";
import type { Feat } from "@/types/entities";
import {
  deriveSourceOptions,
  featMatchesFilters,
  useFeatFilters,
} from "@/state/featFilters";

/**
 * Tests for featMatchesFilters. The private getFeatAbilities helper is the
 * branchiest function (walks the ability array, recurses into choose.from,
 * skips hidden entries, only collects keys whose value is a number) — it's
 * exercised through the predicate.
 */

type FeatFilterState = ReturnType<typeof useFeatFilters.getState>;

const FEAT = (overrides: Partial<Feat> = {}): Feat =>
  ({ name: "X", source: "XPHB", entries: [], ...overrides }) as Feat;

function emptyFilters(): FeatFilterState {
  const f = useFeatFilters.getState();
  f.clearAll();
  return f;
}

function withTri(dim: "category" | "ability" | "source", value: string): FeatFilterState {
  const f = emptyFilters();
  return { ...f, [dim]: { include: new Set([value]), exclude: new Set<string>() } };
}

describe("featMatchesFilters — passthrough & source", () => {
  it("returns true with no filters active", () => {
    expect(featMatchesFilters(FEAT(), emptyFilters())).toBe(true);
  });

  it("filters by source", () => {
    expect(featMatchesFilters(FEAT({ source: "XPHB" }), withTri("source", "XPHB"))).toBe(true);
    expect(featMatchesFilters(FEAT({ source: "XDMG" }), withTri("source", "XPHB"))).toBe(false);
  });
});

describe("featMatchesFilters — category", () => {
  it("matches by category, treating undefined as no-match for concrete includes", () => {
    expect(featMatchesFilters(FEAT({ category: "G" }), withTri("category", "G"))).toBe(true);
    expect(featMatchesFilters(FEAT({ category: "G" }), withTri("category", "O"))).toBe(false);
    const noCat = FEAT();
    delete (noCat as Partial<Feat>).category;
    expect(featMatchesFilters(noCat, withTri("category", "G"))).toBe(false);
  });
});

describe("featMatchesFilters — ability (getFeatAbilities)", () => {
  it("collects flat ability keys whose value is a number", () => {
    const feat = FEAT({
      ability: [{ str: 1 }, { dex: 1 }] as unknown as Feat["ability"],
    });
    expect(featMatchesFilters(feat, withTri("ability", "str"))).toBe(true);
    expect(featMatchesFilters(feat, withTri("ability", "dex"))).toBe(true);
    expect(featMatchesFilters(feat, withTri("ability", "con"))).toBe(false);
  });

  it("expands choose.from arrays", () => {
    const feat = FEAT({
      ability: [{ choose: { from: ["str", "dex"], amount: 1 } }] as unknown as Feat["ability"],
    });
    expect(featMatchesFilters(feat, withTri("ability", "str"))).toBe(true);
    expect(featMatchesFilters(feat, withTri("ability", "dex"))).toBe(true);
  });

  it("skips entries flagged hidden", () => {
    const feat = FEAT({
      ability: [{ hidden: true, str: 1 }] as unknown as Feat["ability"],
    });
    expect(featMatchesFilters(feat, withTri("ability", "str"))).toBe(false);
  });

  it("collects ANY numeric-valued key (no ability allowlist)", () => {
    // getFeatAbilities adds every key whose value is a number — including
    // metadata keys like 'max'. Pinning current behavior; tightening to an
    // ability allowlist would be a separate change.
    const feat = FEAT({
      ability: [{ str: 1, max: 20 }] as unknown as Feat["ability"],
    });
    expect(featMatchesFilters(feat, withTri("ability", "str"))).toBe(true);
    expect(featMatchesFilters(feat, withTri("ability", "max"))).toBe(true);
    expect(featMatchesFilters(feat, withTri("ability", "hidden"))).toBe(false);
  });
});

describe("featMatchesFilters — misc AND-flag", () => {
  it("'repeatable' matches feats flagged repeatable", () => {
    const f = emptyFilters();
    const feat = FEAT({ repeatable: true });
    expect(featMatchesFilters(feat, { ...f, misc: new Set(["repeatable"]) })).toBe(true);
    expect(featMatchesFilters(FEAT(), { ...f, misc: new Set(["repeatable"]) })).toBe(false);
  });

  it("'spells' matches feats with additionalSpells", () => {
    const f = emptyFilters();
    const feat = FEAT({ additionalSpells: [{ x: 1 }] as unknown as Feat["additionalSpells"] });
    expect(featMatchesFilters(feat, { ...f, misc: new Set(["spells"]) })).toBe(true);
    expect(featMatchesFilters(FEAT(), { ...f, misc: new Set(["spells"]) })).toBe(false);
  });

  it("AND-combines selected misc values", () => {
    const f = emptyFilters();
    const feat = FEAT({ repeatable: true, additionalSpells: [{ x: 1 }] as unknown as Feat["additionalSpells"] });
    expect(featMatchesFilters(feat, { ...f, misc: new Set(["repeatable", "spells"]) })).toBe(true);
    expect(featMatchesFilters(feat, { ...f, misc: new Set(["repeatable", "unknown"]) })).toBe(false);
  });
});

describe("deriveSourceOptions", () => {
  it("counts sources desc", () => {
    const out = deriveSourceOptions([FEAT({ source: "XPHB" }), FEAT({ source: "XDMG" })]);
    expect(out.map((o) => o.value)).toEqual(["XPHB", "XDMG"]);
  });
});
