import { describe, expect, it } from "vitest";
import type { Feat } from "@/types/entities";
import { abilityToFull, categoryToFull, prerequisiteToFull } from "@/lib/featFormatters";

/**
 * Tests for the feat display formatters. Focus on the branchy bits:
 * abilityToFull (choose.from branch with amount*count math) and
 * prerequisiteToFull (4-field group cascade joined with ' or ').
 */

describe("categoryToFull", () => {
  it.each([
    ["G", "General"],
    ["O", "Origin"],
    ["D", "Dragonmark"],
    ["DG", "Dark Gift"],
    ["FS", "Fighting Style"],
    ["FS:P", "Fighting Style (Paladin)"],
    ["FS:R", "Fighting Style (Ranger)"],
    ["EB", "Epic Boon"],
    ["ZZZ", "ZZZ"], // unknown -> raw
  ])("category %s -> %s", (code, expected) => {
    expect(categoryToFull(code)).toBe(expected);
  });

  it("returns '' for undefined", () => {
    expect(categoryToFull(undefined)).toBe("");
  });
});

describe("abilityToFull", () => {
  it("returns '' for undefined / empty array", () => {
    expect(abilityToFull(undefined)).toBe("");
    expect(abilityToFull([])).toBe("");
  });

  it("formats a flat ability increase: {str:1} -> 'Str +1'", () => {
    expect(abilityToFull([{ str: 1 }] as unknown as Feat["ability"])).toBe("Str +1");
  });

  it("formats multiple flat entries joined by ', '", () => {
    expect(abilityToFull([{ str: 1 }, { dex: 2 }] as unknown as Feat["ability"])).toBe(
      "Str +1, Dex +2",
    );
  });

  it("skips hidden entries", () => {
    expect(abilityToFull([{ hidden: true, str: 1 }, { dex: 1 }] as unknown as Feat["ability"])).toBe(
      "Dex +1",
    );
  });

  it("formats choose.from with the amount*count math", () => {
    // amount * count multiplied into the prefix.
    const out = abilityToFull([
      { choose: { from: ["str", "dex"], amount: 1, count: 2 } },
    ] as unknown as Feat["ability"]);
    expect(out).toBe("+2 Str or Dex");
  });

  it("defaults choose amount to 1 and count to 1 when absent", () => {
    const out = abilityToFull([
      { choose: { from: ["int"] } },
    ] as unknown as Feat["ability"]);
    expect(out).toBe("+1 Int");
  });
});

describe("prerequisiteToFull", () => {
  it("returns '' for undefined / empty array", () => {
    expect(prerequisiteToFull(undefined)).toBe("");
    expect(prerequisiteToFull([])).toBe("");
  });

  it("formats a level prerequisite", () => {
    expect(prerequisiteToFull([{ level: 4 }] as unknown as Feat["prerequisite"])).toBe("Level 4+");
  });

  it("formats an ability-score prerequisite", () => {
    expect(prerequisiteToFull([{ ability: [{ str: 13 }] }] as unknown as Feat["prerequisite"])).toBe(
      "Str 13+",
    );
  });

  it("formats a campaign prerequisite as a comma-joined list", () => {
    expect(
      prerequisiteToFull([
        { campaign: ["Ravenloft", "Eberron"] },
      ] as unknown as Feat["prerequisite"]),
    ).toBe("Campaign: Ravenloft, Eberron");
  });

  it("formats spellcasting / proficiency flags", () => {
    expect(
      prerequisiteToFull([
        { spellcasting: true, proficiency: true },
      ] as unknown as Feat["prerequisite"]),
    ).toBe("Spellcasting, Proficiency required");
  });

  it("joins multiple groups with ' or '", () => {
    expect(
      prerequisiteToFull([
        { level: 5 },
        { ability: [{ wis: 13 }] },
      ] as unknown as Feat["prerequisite"]),
    ).toBe("Level 5+ or Wis 13+");
  });
});
