import { describe, expect, it } from "vitest";
import type { Monster } from "@/types/entities";
import {
  abilityMod,
  acToFull,
  alignmentToFull,
  crToFull,
  crToXp,
  damageListToList,
  hpToFull,
  languagesToFull,
  savesToFull,
  sensesToFull,
  sizeToFull,
  skillsToFull,
  speedToFull,
  typeToFull,
} from "@/lib/monsterFormatters";

/**
 * Tests for the monster display formatters. Focus on the shape-handling
 * functions: speedToFull (number-vs-object closure), acToFull (number /
 * {special} / {ac, from, condition}), typeToFull (swarm + tags), and the
 * lookup tables (crToXp, alignment, size). crToXp uses toLocaleString(), so
 * we assert via numeric-parsing rather than exact string.
 */

describe("sizeToFull", () => {
  it("joins multiple sizes with ' or '", () => {
    expect(sizeToFull(["S", "M"])).toBe("Small or Medium");
  });
  it("returns a single size alone", () => {
    expect(sizeToFull(["L"])).toBe("Large");
  });
});

describe("typeToFull", () => {
  it("returns the type string as-is", () => {
    expect(typeToFull("dragon")).toBe("dragon");
  });

  it("formats a swarm of a given size", () => {
    expect(typeToFull({ type: "rat", swarm: { isSwarm: true, size: "T" } })).toBe(
      "Swarm of Tiny rats",
    );
  });

  it("formats object type with string tags", () => {
    expect(typeToFull({ type: "humanoid", tags: ["goblinoid"] })).toBe("humanoid (goblinoid)");
  });

  it("formats object type with prefix-tag objects", () => {
    expect(
      typeToFull({
        type: "fiend",
        tags: [{ prefix: "demon", tag: "tanar'ri" }] as unknown as string[],
      }),
    ).toBe("fiend (demon tanar'ri)");
  });

  it("returns the base type when no tags/swarm", () => {
    expect(typeToFull({ type: "beast" })).toBe("beast");
  });
});

describe("alignmentToFull", () => {
  it.each([
    [["C", "E"], "Chaotic Evil"],
    [["L", "G"], "Lawful Good"],
    [["N", "E"], "Neutral Evil"],
    [["NN"], "True Neutral"], // 5etools packs True Neutral as the single code "NN"
    [["C", "N"], "Chaotic Neutral"],
  ])("alignment %j -> %s", (codes, expected) => {
    expect(alignmentToFull(codes)).toBe(expected);
  });

  it("returns 'Unaligned' for empty array", () => {
    expect(alignmentToFull([])).toBe("Unaligned");
  });

  it("maps a single 'A' (any)", () => {
    expect(alignmentToFull(["A"])).toBe("Any");
  });

  it("falls back to per-code lookup for unknown codes", () => {
    expect(alignmentToFull(["Z", "X"])).toBe("Z X");
  });
});

describe("acToFull", () => {
  it("formats a numeric AC", () => {
    expect(acToFull([15])).toBe("15");
  });

  it("formats a {special} AC", () => {
    expect(acToFull([{ special: "no armor" }])).toBe("no armor");
  });

  it("formats AC with 'from' sources and condition", () => {
    expect(acToFull([{ ac: 18, from: ["natural armor"] }])).toBe("18 (natural armor)");
    expect(acToFull([{ ac: 16, from: ["mage armor"], condition: "with mage armor" }])).toBe(
      "16 (mage armor) with mage armor",
    );
  });

  it("joins multiple AC entries with ', '", () => {
    expect(acToFull([12, { ac: 14, from: ["shield"] }])).toBe("12, 14 (shield)");
  });
});

describe("hpToFull", () => {
  it("formats average + formula", () => {
    expect(hpToFull({ average: 7, formula: "2d6" })).toBe("7 (2d6)");
  });

  it("returns the special string as-is", () => {
    expect(hpToFull({ special: "see statblock" })).toBe("see statblock");
  });
});

describe("speedToFull", () => {
  it("formats a walk speed with no label", () => {
    expect(speedToFull({ walk: 30 })).toBe("30 ft.");
  });

  it("appends the label for non-walk speeds", () => {
    expect(speedToFull({ walk: 30, fly: 60 })).toBe("30 ft., 60 ft. fly");
  });

  it("handles object-valued speeds with a condition", () => {
    expect(speedToFull({ walk: 30, fly: { number: 60, condition: "(hover)" } })).toBe(
      "30 ft., 60 ft. fly (hover)",
    );
  });

  it("includes '(hover)' when canHover is set", () => {
    expect(speedToFull({ walk: 0, fly: 60, canHover: true })).toBe("0 ft., 60 ft. fly, (hover)");
  });

  it("handles only non-walk speeds", () => {
    expect(speedToFull({ swim: 40 })).toBe("40 ft. swim");
  });
});

describe("crToFull", () => {
  it.each([
    ["0", "0"],
    ["1/8", "1/8"],
    ["1/4", "1/4"],
    ["1/2", "1/2"],
    ["5", "5"],
    ["30", "30"],
  ])("string cr %s -> %s", (cr, expected) => {
    expect(crToFull(cr)).toBe(expected);
  });

  it("handles object cr", () => {
    expect(crToFull({ cr: "10", xp: 5900 })).toBe("10");
  });

  it("returns '—' for null/undefined cr", () => {
    // crToFull guards against null/undefined at runtime even though the
    // Monster type requires a value; cast to exercise the defensive branch.
    expect(crToFull(null as unknown as Monster["cr"])).toBe("—");
    expect(crToFull(undefined as unknown as Monster["cr"])).toBe("—");
  });
});

describe("crToXp", () => {
  // crToXp uses Number.prototype.toLocaleString(), which is locale-dependent.
  // Parse digits out of the result so the assertion is locale-stable.
  const xpOf = (cr: Monster["cr"]): number => Number(crToXp(cr).replace(/[^\d]/g, ""));

  it.each([
    ["0", 10],
    ["1/8", 25],
    ["1/4", 50],
    ["1/2", 100],
    ["1", 200],
    ["20", 25000],
    ["30", 155000],
  ])("cr %s -> %i xp", (cr, expected) => {
    expect(xpOf(cr)).toBe(expected);
  });

  it("returns 0 for unknown cr codes", () => {
    expect(xpOf("999")).toBe(0);
  });

  it("handles object cr", () => {
    expect(xpOf({ cr: "5", xp: 1800 })).toBe(1800);
  });
});

describe("abilityMod", () => {
  it.each([
    [10, "+0"],
    [14, "+2"],
    [8, "-1"],
    [1, "-5"],
    [20, "+5"],
    [11, "+0"],
  ])("score %i -> %s", (score, expected) => {
    expect(abilityMod(score)).toBe(expected);
  });
});

describe("savesToFull / skillsToFull", () => {
  it("formats saves as 'Dex +7, Wis +6'", () => {
    expect(savesToFull({ dex: "+7", wis: "+6" })).toBe("Dex +7, Wis +6");
  });

  it("returns empty for undefined saves", () => {
    expect(savesToFull(undefined)).toBe("");
  });

  it("formats skills", () => {
    expect(skillsToFull({ stealth: "+6" })).toBe("Stealth +6");
  });
});

describe("damageListToList", () => {
  it("capitalizes and joins with ', '", () => {
    expect(damageListToList(["acid", "fire"])).toBe("Acid, Fire");
  });

  it("returns empty for undefined / empty", () => {
    expect(damageListToList(undefined)).toBe("");
    expect(damageListToList([])).toBe("");
  });
});

describe("sensesToFull", () => {
  it("appends passive perception", () => {
    expect(sensesToFull(["darkvision 60 ft."], 12)).toBe("darkvision 60 ft., Passive Perception 12");
  });

  it("works with only passive perception", () => {
    expect(sensesToFull(undefined, 10)).toBe("Passive Perception 10");
  });
});

describe("languagesToFull", () => {
  it("joins languages with ', '", () => {
    expect(languagesToFull(["Common", "Elvish"])).toBe("Common, Elvish");
  });

  it("returns '—' for none", () => {
    expect(languagesToFull([])).toBe("—");
    expect(languagesToFull(undefined)).toBe("—");
  });
});
