import { describe, expect, it } from "vitest";
import type { Spell } from "@/types/entities";
import {
  isConcentration,
  isRitual,
  ordinal,
  sourceToAbv,
  spClassesToFull,
  spComponentsToFull,
  spDurationToFull,
  spLevelSchoolRitualStr,
  spLevelSchoolStr,
  spRangeToFull,
  spSchoolToAbv,
  spSchoolToFull,
  spSchoolLabel,
  spTimeToFull,
  spTimeToShort,
} from "@/lib/spellFormatters";

/**
 * Tests for the spell display formatters. Focus on the high-branch functions:
 * spRangeToFull (nested switch + mile pluralization), spDurationToFull (switch
 * + nested ternaries), spTimeToFull/Short (map + pluralization + condition),
 * spComponentsToFull (string-vs-object material). Table-driven it.each for the
 * lookup-table functions (schools, sources, ordinals).
 */

const SPELL = (overrides: Partial<Spell> = {}): Spell =>
  ({
    name: "X",
    source: "XPHB",
    page: 1,
    level: 0,
    school: "V",
    time: [{ number: 1, unit: "action" }],
    range: { type: "point", distance: { type: "self" } },
    components: {},
    duration: [{ type: "instant" }],
    entries: [],
    ...overrides,
  }) as Spell;

describe("spSchoolToFull / spSchoolToAbv / spSchoolLabel", () => {
  it.each([
    ["A", "Abjuration"],
    ["V", "Evocation"],
    ["N", "Necromancy"],
    ["T", "Transmutation"],
    ["C", "Conjuration"],
    ["D", "Divination"],
    ["I", "Illusion"],
    ["E", "Enchantment"],
    ["P", "Psionics"],
  ] as const)("spSchoolToFull(%s) -> %s", (code, full) => {
    expect(spSchoolToFull(code)).toBe(full);
    expect(spSchoolLabel({ school: code })).toBe(full);
    expect(spSchoolToAbv(code)).toBe(code);
  });
});

describe("ordinal", () => {
  it.each([
    [0, "zeroth"],
    [1, "1st"],
    [2, "2nd"],
    [3, "3rd"],
    [4, "4th"],
    [9, "9th"],
  ])("ordinal(%i) -> %s", (n, expected) => {
    expect(ordinal(n)).toBe(expected);
  });

  it("falls back to '<n>th' for values outside the table", () => {
    expect(ordinal(10)).toBe("10th");
    expect(ordinal(100)).toBe("100th");
  });
});

describe("spLevelSchoolStr / spLevelSchoolRitualStr", () => {
  it("cantrip at level 0", () => {
    expect(spLevelSchoolStr({ level: 0, school: "V" })).toBe("evocation cantrip");
  });

  it("'<n>th-level <school>' for leveled spells", () => {
    expect(spLevelSchoolStr({ level: 3, school: "V" })).toBe("3rd-level evocation");
    expect(spLevelSchoolStr({ level: 1, school: "A" })).toBe("1st-level abjuration");
  });

  it("appends ' (ritual)' when meta.ritual is true", () => {
    expect(spLevelSchoolRitualStr(SPELL({ level: 1, school: "D", meta: { ritual: true } }))).toBe(
      "1st-level divination (ritual)",
    );
    expect(spLevelSchoolRitualStr(SPELL({ level: 1, school: "D" }))).toBe("1st-level divination");
  });
});

describe("spTimeToFull", () => {
  it.each([
    [{ number: 1, unit: "action" }, "1 action"],
    [{ number: 1, unit: "bonus action" }, "1 bonus action"],
    [{ number: 1, unit: "bonus" }, "1 bonus action"],
    [{ number: 1, unit: "reaction" }, "1 reaction"],
    [{ number: 1, unit: "minute" }, "1 minute"],
    [{ number: 10, unit: "minute" }, "10 minutes"],
    [{ number: 1, unit: "hour" }, "1 hour"],
    [{ number: 8, unit: "hour" }, "8 hours"],
    [{ number: 1, unit: "round" }, "1 round"],
  ])("time %j -> %s", (time, expected) => {
    expect(spTimeToFull(time as Spell["time"][number])).toBe(expected);
  });

  it("appends a condition suffix when present", () => {
    expect(spTimeToFull({ number: 1, unit: "reaction", condition: "when hit" })).toBe(
      "1 reaction (when hit)",
    );
  });
});

describe("spTimeToShort", () => {
  it.each([
    [{ number: 1, unit: "action" }, "1 A"],
    [{ number: 1, unit: "bonus action" }, "1 BA"],
    [{ number: 1, unit: "reaction" }, "1 R"],
    [{ number: 1, unit: "minute" }, "1 Min"],
    [{ number: 1, unit: "hour" }, "1 Hr"],
    [{ number: 1, unit: "round" }, "1 Rnd"],
  ])("short time %j -> %s", (time, expected) => {
    expect(spTimeToShort(time as Spell["time"][number])).toBe(expected);
  });
});

describe("spRangeToFull", () => {
  describe("point range", () => {
    it.each([
      [{ type: "self" }, "Self"],
      [{ type: "touch" }, "Touch"],
      [{ type: "feet", amount: 150 }, "150 feet"],
      [{ type: "mile", amount: 1 }, "1 mile"],
      [{ type: "mile", amount: 3 }, "3 miles"],
      [{ type: "special" }, "Special"],
    ])("point %j -> %s", (distance, expected) => {
      const range = { type: "point", distance } as Spell["range"];
      expect(spRangeToFull(range)).toBe(expected);
    });
  });

  it.each([
    ["cone", 15],
    ["cube", 5],
    ["line", 60],
    ["sphere", 10],
    ["cylinder", 20],
    ["radius", 30],
    ["emanation", 30],
  ] as const)("area %s -> 'Self (<n>-foot %s)'", (shape, amount) => {
    const range = { type: shape, distance: { type: "feet", amount } } as Spell["range"];
    expect(spRangeToFull(range)).toBe(`Self (${amount}-foot ${shape})`);
  });

  it("returns 'Special' for type 'special'", () => {
    expect(spRangeToFull({ type: "special" })).toBe("Special");
  });
});

describe("spComponentsToFull", () => {
  it("returns empty for undefined components", () => {
    expect(spComponentsToFull(undefined)).toBe("");
  });

  it("joins V, S, M in fixed order", () => {
    expect(spComponentsToFull({ v: true, s: true, m: "bat guano" })).toBe("V, S, M (bat guano)");
  });

  it("omits absent components", () => {
    expect(spComponentsToFull({ v: true })).toBe("V");
    expect(spComponentsToFull({ s: true })).toBe("S");
    expect(spComponentsToFull({ m: "ruby dust" })).toBe("M (ruby dust)");
  });

  it("handles the object form of material component", () => {
    expect(spComponentsToFull({ m: { text: "a 100gp gem", cost: 100, consume: true } })).toBe(
      "M (a 100gp gem)",
    );
  });
});

describe("spDurationToFull", () => {
  it.each([
    [{ type: "instant" }, "Instantaneous"],
    [{ type: "permanent" }, "Permanent"],
    [{ type: "special" }, "Special"],
  ])("simple duration %j -> %s", (d, expected) => {
    expect(spDurationToFull(d as Spell["duration"][number])).toBe(expected);
  });

  it.each([
    [{ type: "timed", duration: { type: "round", amount: 1 } }, "1 round"],
    [{ type: "timed", duration: { type: "minute", amount: 10 } }, "10 minutes"],
    [{ type: "timed", duration: { type: "hour", amount: 8 } }, "8 hours"],
    [{ type: "timed", duration: { type: "day", amount: 1 } }, "1 day"],
  ])("timed %j -> %s", (d, expected) => {
    expect(spDurationToFull(d as Spell["duration"][number])).toBe(expected);
  });

  it("prepends 'up to ' when the duration flag is set", () => {
    const d = { type: "timed", duration: { type: "hour", amount: 1, upTo: true } } as Spell["duration"][number];
    expect(spDurationToFull(d)).toBe("up to 1 hour");
  });

  it("prepends 'Concentration, ' for concentration durations", () => {
    const d = {
      type: "timed",
      duration: { type: "minute", amount: 10 },
      concentration: true,
    } as Spell["duration"][number];
    expect(spDurationToFull(d)).toBe("Concentration, 10 minutes");
  });
});

describe("spClassesToFull", () => {
  it("deduplicates and alphabetizes class names across all three lists", () => {
    const classes = {
      fromClassList: [{ name: "Wizard", source: "XPHB" }],
      fromClassListVariant: [{ name: "Sorcerer", source: "XPHB", definedInSource: "XPHB" }],
      fromSubclass: [{
        class: { name: "Wizard", source: "XPHB" },
        subclass: { name: "War", source: "XPHB" },
      }],
    };
    expect(spClassesToFull(classes)).toBe("Sorcerer, Wizard");
  });

  it("returns empty when classes is undefined", () => {
    expect(spClassesToFull(undefined)).toBe("");
  });
});

describe("sourceToAbv", () => {
  it.each([
    ["XPHB", "PHB"],
    ["XDMG", "DMG"],
    ["XMM", "MM"],
    ["XSAC", "SAC"],
    ["GrimHollowCG24", "GH:CG'24"],
    ["UNKNOWN", "UNKNOWN"], // passthrough for unknown codes
  ])("sourceToAbv(%s) -> %s", (src, expected) => {
    expect(sourceToAbv(src)).toBe(expected);
  });
});

describe("isConcentration / isRitual", () => {
  it("isConcentration is true iff any duration entry has concentration=true", () => {
    expect(isConcentration(SPELL({
      duration: [{ type: "timed", duration: { type: "minute", amount: 10 }, concentration: true }],
    }))).toBe(true);
    expect(isConcentration(SPELL({ duration: [{ type: "instant" }] }))).toBe(false);
  });

  it("isRitual reflects meta.ritual", () => {
    expect(isRitual(SPELL({ meta: { ritual: true } }))).toBe(true);
    expect(isRitual(SPELL())).toBe(false);
  });
});
