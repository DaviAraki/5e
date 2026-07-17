import { describe, expect, it } from "vitest";
import type { Monster } from "@/types/entities";
import {
  deriveSourceOptions,
  monsterMatchesFilters,
  useBestiaryFilters,
} from "@/state/bestiaryFilters";
import { emptyTri } from "@/state/triStateFilter";

/**
 * Tests for monsterMatchesFilters — exercises union-shape handling for type
 * and cr, the environment token-expansion branch (full CSV vs trailing
 * segment), and the misc AND-flag (legendary / spellcasting / lair).
 */

// BestiaryFilterState is not exported; derive it from the store's state shape.
type BestiaryFilterState = ReturnType<typeof useBestiaryFilters.getState>;

const BASE_MONSTER = {
  name: "Goblin",
  source: "XMM",
  size: ["S"],
  type: "humanoid",
  alignment: ["N", "E"],
  ac: [12],
  hp: { average: 7, formula: "2d6" },
  speed: { walk: 30 },
  str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8,
  passive: 9,
  cr: "1/4",
  hasToken: false,
} as const;

function makeMonster(overrides: Partial<Monster> = {}): Monster {
  return { ...(BASE_MONSTER as unknown as Monster), ...overrides };
}

function emptyFilters(): BestiaryFilterState {
  return {
    ...useBestiaryFilters.getState(),
    source: emptyTri(),
    size: emptyTri(),
    type: emptyTri(),
    cr: emptyTri(),
    immune: emptyTri(),
    conditionImmune: emptyTri(),
    environment: emptyTri(),
    misc: new Set<string>(),
  };
}

function withTri(
  dim: "source" | "size" | "type" | "cr" | "immune" | "conditionImmune" | "environment",
  value: string,
  mode: "include" | "exclude" = "include",
): BestiaryFilterState {
  const f = emptyFilters();
  return {
    ...f,
    [dim]: mode === "include"
      ? { include: new Set([value]), exclude: new Set<string>() }
      : { include: new Set<string>(), exclude: new Set([value]) },
  };
}

describe("monsterMatchesFilters — passthrough", () => {
  it("returns true when no filters are active", () => {
    expect(monsterMatchesFilters(makeMonster(), emptyFilters())).toBe(true);
  });
});

describe("monsterMatchesFilters — source & size", () => {
  it("matches by source", () => {
    const m = makeMonster({ source: "XMM" });
    expect(monsterMatchesFilters(m, withTri("source", "XMM"))).toBe(true);
    expect(monsterMatchesFilters(m, withTri("source", "XPHB"))).toBe(false);
  });

  it("matches by size (multiple sizes are OR-combined)", () => {
    const m = makeMonster({ size: ["S", "M"] });
    expect(monsterMatchesFilters(m, withTri("size", "S"))).toBe(true);
    expect(monsterMatchesFilters(m, withTri("size", "M"))).toBe(true);
    expect(monsterMatchesFilters(m, withTri("size", "L"))).toBe(false);
  });
});

describe("monsterMatchesFilters — type (string | {type})", () => {
  it("handles string type", () => {
    const m = makeMonster({ type: "dragon" });
    expect(monsterMatchesFilters(m, withTri("type", "dragon"))).toBe(true);
    expect(monsterMatchesFilters(m, withTri("type", "beast"))).toBe(false);
  });

  it("handles object type with tags", () => {
    const m = makeMonster({ type: { type: "fiend", tags: ["demon"] } });
    expect(monsterMatchesFilters(m, withTri("type", "fiend"))).toBe(true);
  });
});

describe("monsterMatchesFilters — cr (string | {cr})", () => {
  it("handles string cr", () => {
    const m = makeMonster({ cr: "5" });
    expect(monsterMatchesFilters(m, withTri("cr", "5"))).toBe(true);
    expect(monsterMatchesFilters(m, withTri("cr", "1"))).toBe(false);
  });

  it("handles object cr with xp", () => {
    const m = makeMonster({ cr: { cr: "10", xp: 5900 } });
    expect(monsterMatchesFilters(m, withTri("cr", "10"))).toBe(true);
  });

  it("defaults object cr missing the cr field to '0'", () => {
    const m = makeMonster({ cr: { xp: 100 } as Monster["cr"] });
    expect(monsterMatchesFilters(m, withTri("cr", "0"))).toBe(true);
  });
});

describe("monsterMatchesFilters — immunities", () => {
  it("matches immune (OR-combined array)", () => {
    const m = makeMonster({ immune: ["fire", "poison"] });
    expect(monsterMatchesFilters(m, withTri("immune", "fire"))).toBe(true);
    expect(monsterMatchesFilters(m, withTri("immune", "cold"))).toBe(false);
  });

  it("matches conditionImmune", () => {
    const m = makeMonster({ conditionImmune: ["charmed"] });
    expect(monsterMatchesFilters(m, withTri("conditionImmune", "charmed"))).toBe(true);
  });

  it("treats undefined immunities as no-match for any concrete include", () => {
    const m = makeMonster();
    delete (m as Partial<Monster>).immune;
    expect(monsterMatchesFilters(m, withTri("immune", "fire"))).toBe(false);
  });
});

describe("monsterMatchesFilters — environment token expansion", () => {
  it("matches by primary environment token (the full string)", () => {
    const m = makeMonster({ environment: ["forest"] });
    expect(monsterMatchesFilters(m, withTri("environment", "forest"))).toBe(true);
    expect(monsterMatchesFilters(m, withTri("environment", "desert"))).toBe(false);
  });

  it("matches by trailing segment when environments are CSV-like ('forest, hill')", () => {
    // 5etools packs multiple environments in a single CSV string.
    const m = makeMonster({ environment: ["forest, hill"] });
    // Full-string token:
    expect(monsterMatchesFilters(m, withTri("environment", "forest, hill"))).toBe(true);
    // Trailing-segment token:
    expect(monsterMatchesFilters(m, withTri("environment", "hill"))).toBe(true);
  });

  it("expands each environment entry in an array independently", () => {
    const m = makeMonster({ environment: ["arctic", "mountain, coastal"] });
    expect(monsterMatchesFilters(m, withTri("environment", "arctic"))).toBe(true);
    expect(monsterMatchesFilters(m, withTri("environment", "mountain, coastal"))).toBe(true);
    expect(monsterMatchesFilters(m, withTri("environment", "coastal"))).toBe(true);
    expect(monsterMatchesFilters(m, withTri("environment", "desert"))).toBe(false);
  });
});

describe("monsterMatchesFilters — misc AND-flag", () => {
  it("'legendary' matches monsters with legendary actions", () => {
    const f = emptyFilters();
    const m = makeMonster({ legendary: [{ name: "Attack", entries: [] }] });
    expect(monsterMatchesFilters(m, { ...f, misc: new Set(["legendary"]) })).toBe(true);
    expect(monsterMatchesFilters(makeMonster(), { ...f, misc: new Set(["legendary"]) })).toBe(false);
  });

  it("'spellcasting' matches monsters with a spellcasting block", () => {
    const f = emptyFilters();
    const m = makeMonster({
      spellcasting: [{ name: "Innate", type: "innate", spells: {} }],
    });
    expect(monsterMatchesFilters(m, { ...f, misc: new Set(["spellcasting"]) })).toBe(true);
  });

  it("'lair' matches monsters with a group/lair reference", () => {
    const f = emptyFilters();
    const m = makeMonster({ group: ["Adult Red Dragon Lair"] });
    expect(monsterMatchesFilters(m, { ...f, misc: new Set(["lair"]) })).toBe(true);
  });

  it("AND-combines selected misc values", () => {
    const f = emptyFilters();
    const m = makeMonster({
      legendary: [{ name: "A", entries: [] }],
      spellcasting: [{ name: "S", type: "innate", spells: {} }],
    });
    expect(monsterMatchesFilters(m, { ...f, misc: new Set(["legendary", "spellcasting"]) })).toBe(true);
    expect(monsterMatchesFilters(m, { ...f, misc: new Set(["legendary", "lair"]) })).toBe(false);
  });
});

describe("deriveSourceOptions", () => {
  it("counts and sorts sources desc, with known labels", () => {
    const monsters = [
      makeMonster({ source: "XMM" }),
      makeMonster({ source: "XMM" }),
      makeMonster({ source: "XPHB" }),
    ];
    const out = deriveSourceOptions(monsters);
    expect(out[0]!.value).toBe("XMM");
    expect(out[0]!.label).toBe("Monster Manual");
    expect(out[1]!.value).toBe("XPHB");
  });
});
