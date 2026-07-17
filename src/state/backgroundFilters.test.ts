import { describe, expect, it } from "vitest";
import type { Background } from "@/types/entities";
import {
  backgroundMatchesFilters,
  deriveSourceOptions,
  getBackgroundAbilities,
  getBackgroundSkills,
  useBackgroundFilters,
} from "@/state/backgroundFilters";

/**
 * Tests for the background filter extractors — these are the branchiest pure
 * functions in the file:
 *   - getBackgroundSkills walks skillProficiencies, handling the 'choose.from'
 *     nested list and the flat-key shape.
 *   - getBackgroundAbilities regex-extracts ability names out of a free-text
 *     'Ability Scores' list entry and maps them to str/dex/con/int/wis/cha.
 * Both feed the predicate, so they're tested directly + through it.
 */

type BackgroundFilterState = ReturnType<typeof useBackgroundFilters.getState>;

const BG = (overrides: Partial<Background> = {}): Background =>
  ({ name: "X", source: "XPHB", entries: [], ...overrides }) as Background;

function withTri(
  dim: "skill" | "ability" | "source",
  value: string,
): BackgroundFilterState {
  const f = useBackgroundFilters.getState();
  f.clearAll();
  return {
    ...f,
    [dim]: { include: new Set([value]), exclude: new Set<string>() },
  };
}

describe("getBackgroundSkills", () => {
  it("extracts flat-key skills", () => {
    const bg = BG({
      skillProficiencies: [{ insight: true, religion: true } as unknown as Record<string, unknown>],
    });
    expect([...getBackgroundSkills(bg)].sort()).toEqual(["insight", "religion"]);
  });

  it("expands choose.from arrays", () => {
    const bg = BG({
      skillProficiencies: [
        { choose: { from: ["stealth", "arcana"] } } as unknown as Record<string, unknown>,
      ],
    });
    expect([...getBackgroundSkills(bg)].sort()).toEqual(["arcana", "stealth"]);
  });

  it("combines flat keys + choose.from", () => {
    const bg = BG({
      skillProficiencies: [
        {
          athletics: true,
          choose: { from: ["stealth"] },
        } as unknown as Record<string, unknown>,
      ],
    });
    expect([...getBackgroundSkills(bg)].sort()).toEqual(["athletics", "stealth"]);
  });

  it("returns an empty set when skillProficiencies is absent", () => {
    expect(getBackgroundSkills(BG()).size).toBe(0);
  });
});

describe("getBackgroundAbilities", () => {
  it("extracts full ability names from the 'Ability Scores' list entry and maps to codes", () => {
    const bg = BG({
      entries: [
        {
          type: "list",
          items: [
            {
              name: "Ability Scores",
              entry: "Increase your Strength or Dexterity by 1.",
            } as unknown as never,
          ],
        } as unknown as never,
      ],
    });
    expect([...getBackgroundAbilities(bg)].sort()).toEqual(["dex", "str"]);
  });

  it("ignores list entries that don't match the Ability Scores name", () => {
    const bg = BG({
      entries: [
        {
          type: "list",
          items: [{ name: "Equipment", entry: "Strength mentioned here" } as unknown as never],
        } as unknown as never,
      ],
    });
    expect(getBackgroundAbilities(bg).size).toBe(0);
  });

  it("ignores entries that are not type:'list'", () => {
    const bg = BG({
      entries: [{ type: "entries", name: "Ability Scores", items: [] } as unknown as never],
    });
    expect(getBackgroundAbilities(bg).size).toBe(0);
  });

  it("returns an empty set when entries is absent", () => {
    expect(getBackgroundAbilities(BG()).size).toBe(0);
  });
});

describe("backgroundMatchesFilters", () => {
  it("returns true when no filters are active", () => {
    const f = useBackgroundFilters.getState();
    f.clearAll();
    expect(backgroundMatchesFilters(BG(), f)).toBe(true);
  });

  it("filters by source", () => {
    expect(backgroundMatchesFilters(BG({ source: "XPHB" }), withTri("source", "XPHB"))).toBe(true);
    expect(backgroundMatchesFilters(BG({ source: "XDMG" }), withTri("source", "XPHB"))).toBe(false);
  });

  it("filters by skill (delegates to getBackgroundSkills)", () => {
    const bg = BG({
      skillProficiencies: [{ stealth: true } as unknown as Record<string, unknown>],
    });
    expect(backgroundMatchesFilters(bg, withTri("skill", "stealth"))).toBe(true);
    expect(backgroundMatchesFilters(bg, withTri("skill", "arcana"))).toBe(false);
  });

  it("filters by ability (delegates to getBackgroundAbilities)", () => {
    const bg = BG({
      entries: [
        {
          type: "list",
          items: [{ name: "Ability Scores", entry: "Increase Constitution." } as unknown as never],
        } as unknown as never,
      ],
    });
    expect(backgroundMatchesFilters(bg, withTri("ability", "con"))).toBe(true);
    expect(backgroundMatchesFilters(bg, withTri("ability", "str"))).toBe(false);
  });
});

describe("deriveSourceOptions", () => {
  it("counts sources and sorts desc", () => {
    const bgs = [BG({ source: "XPHB" }), BG({ source: "XPHB" }), BG({ source: "XDMG" })];
    const out = deriveSourceOptions(bgs);
    expect(out[0]!.value).toBe("XPHB");
    expect(out[1]!.value).toBe("XDMG");
  });
});
