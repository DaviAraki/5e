import { describe, expect, it } from "vitest";
import type { Spell } from "@/types/entities";
import {
  deriveSourceOptions,
  spellMatchesFilters,
  useSpellFilters,
} from "@/state/spellFilters";
import { emptyTri } from "@/state/triStateFilter";

/**
 * Tests for spellMatchesFilters — covers all 10 tri-state dimensions plus the
 * misc AND-flag dimension, and the private helpers durationTags / rangeTag /
 * miscMatches / normalizeTimeUnit exercised through the predicate.
 *
 * Each test builds a minimal Spell fixture and a filter state with a single
 * active dimension, then asserts pass/fail.
 */

// SpellFilterState is not exported; derive it from the store's state shape.
type SpellFilterState = ReturnType<typeof useSpellFilters.getState>;

const BASE_SPELL = {
  name: "Fireball",
  source: "XPHB",
  page: 1,
  level: 3,
  school: "V",
  time: [{ number: 1, unit: "action" }],
  range: { type: "point", distance: { type: "feet", amount: 150 } },
  components: { v: true, s: true, m: "bat guano" },
  duration: [{ type: "instant" }],
  entries: [],
} as const;

/** Deep-mutable fixture builder; merges partial Spell overrides. */
function makeSpell(overrides: Partial<Spell> = {}): Spell {
  return { ...(BASE_SPELL as unknown as Spell), ...overrides };
}

/** Build a SpellFilterState with one dimension set to a single include value. */
function filterWith(
  dim: keyof SpellFilterState,
  value: string,
  mode: "include" | "exclude" = "include",
): SpellFilterState {
  const f = useSpellFilters.getState();
  f.clearAll();
  if (dim === "misc") {
    return { ...f, misc: new Set([value]) };
  }
  const tri = mode === "include"
    ? { include: new Set([value]), exclude: new Set<string>() }
    : { include: new Set<string>(), exclude: new Set([value]) };
  return { ...f, [dim]: tri };
}

describe("spellMatchesFilters", () => {
  it("returns true when no filters are active", () => {
    const none = { ...useSpellFilters.getState(), ...emptyAll() } as SpellFilterState;
    expect(spellMatchesFilters(makeSpell(), none)).toBe(true);
  });

  // --- source ---
  it("filters by source (include / exclude)", () => {
    const spell = makeSpell({ source: "XPHB" });
    expect(spellMatchesFilters(spell, filterWith("source", "XPHB"))).toBe(true);
    expect(spellMatchesFilters(spell, filterWith("source", "XDMG"))).toBe(false);
    expect(spellMatchesFilters(spell, filterWith("source", "XPHB", "exclude"))).toBe(false);
  });

  // --- level ---
  it("filters by level (stringified)", () => {
    const spell = makeSpell({ level: 3 });
    expect(spellMatchesFilters(spell, filterWith("level", "3"))).toBe(true);
    expect(spellMatchesFilters(spell, filterWith("level", "0"))).toBe(false);
  });

  // --- school ---
  it("filters by school code", () => {
    const spell = makeSpell({ school: "V" });
    expect(spellMatchesFilters(spell, filterWith("school", "V"))).toBe(true);
    expect(spellMatchesFilters(spell, filterWith("school", "A"))).toBe(false);
  });

  // --- castTime (exercises normalizeTimeUnit) ---
  it("filters by cast time, normalizing 'bonus action' to 'bonus'", () => {
    const bonus = makeSpell({ time: [{ number: 1, unit: "bonus action" }] });
    expect(spellMatchesFilters(bonus, filterWith("castTime", "bonus"))).toBe(true);
    expect(spellMatchesFilters(bonus, filterWith("castTime", "action"))).toBe(false);

    const action = makeSpell({ time: [{ number: 1, unit: "action" }] });
    expect(spellMatchesFilters(action, filterWith("castTime", "action"))).toBe(true);
  });

  it("rejects spells with no time[0] when castTime filter is active", () => {
    const spell = makeSpell({ time: [] });
    expect(spellMatchesFilters(spell, filterWith("castTime", "action"))).toBe(false);
  });

  // --- class ---
  it("filters by class across fromClassList / fromClassListVariant / fromSubclass", () => {
    const spell = makeSpell({
      classes: {
        fromClassList: [{ name: "Sorcerer", source: "XPHB" }],
        fromClassListVariant: [{ name: "Wizard", source: "XPHB", definedInSource: "XPHB" }],
        fromSubclass: [{
          class: { name: "Cleric", source: "XPHB" },
          subclass: { name: "Light", source: "XPHB" },
        }],
      },
    });
    expect(spellMatchesFilters(spell, filterWith("class", "Sorcerer"))).toBe(true);
    expect(spellMatchesFilters(spell, filterWith("class", "Wizard"))).toBe(true);
    expect(spellMatchesFilters(spell, filterWith("class", "Cleric"))).toBe(true);
    expect(spellMatchesFilters(spell, filterWith("class", "Bard"))).toBe(false);
  });

  // --- duration (exercises durationTags) ---
  describe("duration tags", () => {
    it("tags instant spells as 'instant'", () => {
      const spell = makeSpell({ duration: [{ type: "instant" }] });
      expect(spellMatchesFilters(spell, filterWith("duration", "instant"))).toBe(true);
    });

    it("tags timed minute<=1 as 'timed-short'", () => {
      const spell = makeSpell({
        duration: [{ type: "timed", duration: { type: "minute", amount: 1 } }],
      });
      expect(spellMatchesFilters(spell, filterWith("duration", "timed-short"))).toBe(true);
      expect(spellMatchesFilters(spell, filterWith("duration", "timed-medium"))).toBe(false);
    });

    it("tags timed minute>1 as 'timed-medium'", () => {
      const spell = makeSpell({
        duration: [{ type: "timed", duration: { type: "minute", amount: 10 } }],
      });
      expect(spellMatchesFilters(spell, filterWith("duration", "timed-medium"))).toBe(true);
      expect(spellMatchesFilters(spell, filterWith("duration", "timed-short"))).toBe(false);
    });

    it("tags timed hour/day as 'timed-long'", () => {
      const hour = makeSpell({
        duration: [{ type: "timed", duration: { type: "hour", amount: 1 } }],
      });
      const day = makeSpell({
        duration: [{ type: "timed", duration: { type: "day", amount: 1 } }],
      });
      expect(spellMatchesFilters(hour, filterWith("duration", "timed-long"))).toBe(true);
      expect(spellMatchesFilters(day, filterWith("duration", "timed-long"))).toBe(true);
    });

    it("tags concentration durations as 'concentration'", () => {
      const spell = makeSpell({
        duration: [{ type: "timed", duration: { type: "minute", amount: 10 }, concentration: true }],
      });
      expect(spellMatchesFilters(spell, filterWith("duration", "concentration"))).toBe(true);
    });

    it("tags permanent / special", () => {
      const perm = makeSpell({ duration: [{ type: "permanent" }] });
      const spec = makeSpell({ duration: [{ type: "special" }] });
      expect(spellMatchesFilters(perm, filterWith("duration", "permanent"))).toBe(true);
      expect(spellMatchesFilters(spec, filterWith("duration", "special"))).toBe(true);
    });

    // FIXME: bug — durationTags lines 289-290 use mixed ||/&& precedence:
    //   `unit === "round" || unit === "minute" && amt <= 1`
    // evaluates as `round || (minute && amt<=1)`, making the `&& amt<=1` guard
    // partly dead (lines 292-297 re-derive the same tags for minutes). The
    // round-branch tag is exercised below to pin current behavior.
    it("tags a round-duration spell with 'timed-short' (current observed behavior)", () => {
      const spell = makeSpell({
        duration: [{ type: "timed", duration: { type: "round", amount: 1 } }],
      });
      expect(spellMatchesFilters(spell, filterWith("duration", "timed-short"))).toBe(true);
    });
  });

  // --- range (exercises rangeTag) ---
  describe("range tags", () => {
    const cases: Array<[string, Partial<Spell>["range"]]> = [
      ["self", { type: "point", distance: { type: "self" } }],
      ["touch", { type: "point", distance: { type: "touch" } }],
      ["point", { type: "point", distance: { type: "feet", amount: 120 } }],
      ["area", { type: "sphere", distance: { type: "feet", amount: 20 } }],
      ["special", { type: "special" }],
    ];
    for (const [tag, range] of cases) {
      it(`tags range type as '${tag}'`, () => {
        const spell = makeSpell({ range: range as Spell["range"] });
        expect(spellMatchesFilters(spell, filterWith("range", tag))).toBe(true);
      });
    }
  });

  // --- damageType / save / condition (array-OR matching) ---
  it("filters by damageType (any match passes)", () => {
    const spell = makeSpell({ damageInflict: ["fire"] });
    expect(spellMatchesFilters(spell, filterWith("damageType", "fire"))).toBe(true);
    expect(spellMatchesFilters(spell, filterWith("damageType", "cold"))).toBe(false);
  });

  it("filters by save (any match passes)", () => {
    const spell = makeSpell({ savingThrow: ["dex"] });
    expect(spellMatchesFilters(spell, filterWith("save", "dex"))).toBe(true);
    expect(spellMatchesFilters(spell, filterWith("save", "con"))).toBe(false);
  });

  it("filters by condition inflicted (any match passes)", () => {
    const spell = makeSpell({ conditionInflict: ["blinded"] });
    expect(spellMatchesFilters(spell, filterWith("condition", "blinded"))).toBe(true);
    expect(spellMatchesFilters(spell, filterWith("condition", "charmed"))).toBe(false);
  });

  // --- misc (AND-flag: ALL selected misc values must match) ---
  describe("misc AND-flag", () => {
    const concRitualV = makeSpell({
      duration: [{ type: "timed", duration: { type: "minute", amount: 10 }, concentration: true }],
      meta: { ritual: true },
      components: { v: true, s: false, m: "" },
    });

    it("concentration misc matches a concentration spell", () => {
      expect(spellMatchesFilters(concRitualV, filterWith("misc", "concentration"))).toBe(true);
    });

    it("ritual misc matches a ritual spell", () => {
      expect(spellMatchesFilters(concRitualV, filterWith("misc", "ritual"))).toBe(true);
    });

    it("v/s/m misc match the relevant component flags", () => {
      expect(spellMatchesFilters(concRitualV, filterWith("misc", "v"))).toBe(true);
      expect(spellMatchesFilters(concRitualV, filterWith("misc", "s"))).toBe(false);
      expect(spellMatchesFilters(concRitualV, filterWith("misc", "m"))).toBe(false);
    });

    it("AND-combines: multiple misc values must all match", () => {
      // Build a misc filter set with two values.
      const f = useSpellFilters.getState();
      f.clearAll();
      const both = { ...f, misc: new Set(["concentration", "ritual"]) } as SpellFilterState;
      expect(spellMatchesFilters(concRitualV, both)).toBe(true);
      const mixed = { ...f, misc: new Set(["concentration", "s"]) } as SpellFilterState;
      expect(spellMatchesFilters(concRitualV, mixed)).toBe(false);
    });

    it("unknown misc key returns false (defensive default)", () => {
      expect(spellMatchesFilters(concRitualV, filterWith("misc", "unknownTag"))).toBe(false);
    });
  });

  // --- cross-dimension AND combination ---
  it("AND-combines active dimensions: one failing dimension rejects the spell", () => {
    const f = useSpellFilters.getState();
    f.clearAll();
    const combined: SpellFilterState = {
      ...f,
      source: { include: new Set(["XPHB"]), exclude: new Set() },
      level: { include: new Set(["3"]), exclude: new Set() },
    };
    expect(spellMatchesFilters(makeSpell(), combined)).toBe(true); // both pass
    const failLevel = { ...combined, level: { include: new Set(["4"]), exclude: new Set<string>() } };
    expect(spellMatchesFilters(makeSpell(), failLevel)).toBe(false);
  });
});

describe("deriveSourceOptions", () => {
  it("counts sources and sorts by count desc, labeling known codes", () => {
    const spells = [
      makeSpell({ source: "XPHB" }),
      makeSpell({ source: "XPHB" }),
      makeSpell({ source: "XDMG" }),
    ];
    const out = deriveSourceOptions(spells);
    expect(out[0]).toEqual({ value: "XPHB", label: "Player's Handbook" });
    expect(out[1]).toEqual({ value: "XDMG", label: "XDMG" }); // unknown label -> raw code
  });

  it("returns an empty array for no spells", () => {
    expect(deriveSourceOptions([])).toEqual([]);
  });
});

/** Build a fully-empty filter state (every tri dimension empty, misc empty). */
function emptyAll(): Partial<SpellFilterState> {
  return {
    source: emptyTri(),
    level: emptyTri(),
    school: emptyTri(),
    class: emptyTri(),
    castTime: emptyTri(),
    duration: emptyTri(),
    range: emptyTri(),
    damageType: emptyTri(),
    save: emptyTri(),
    condition: emptyTri(),
    misc: new Set<string>(),
  };
}
