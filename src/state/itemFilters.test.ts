import { describe, expect, it } from "vitest";
import type { Item } from "@/types/entities";
import {
  deriveSourceOptions,
  itemMatchesFilters,
  useItemFilters,
} from "@/state/itemFilters";
import { emptyTri } from "@/state/triStateFilter";

/**
 * Tests for itemMatchesFilters — exercises the type-code parsing (split on
 * '|', $-coercion), the tri-state dimensions (source/type/rarity), and the
 * misc AND-flag (wondrous / reqAttune / weapon / armor).
 */

// ItemFilterState is not exported; derive it from the store's state shape.
type ItemFilterState = ReturnType<typeof useItemFilters.getState>;

const BASE_ITEM = {
  name: "Longsword",
  source: "XPHB",
  type: "M|XPHB",
  rarity: "common",
} as const;

function makeItem(overrides: Partial<Item> = {}): Item {
  return { ...(BASE_ITEM as unknown as Item), ...overrides };
}

function emptyFilters(): ItemFilterState {
  return {
    ...useItemFilters.getState(),
    source: emptyTri(),
    type: emptyTri(),
    rarity: emptyTri(),
    misc: new Set<string>(),
  };
}

function withTri(
  dim: "source" | "type" | "rarity",
  value: string,
  mode: "include" | "exclude" = "include",
): ItemFilterState {
  const f = emptyFilters();
  return {
    ...f,
    [dim]: mode === "include"
      ? { include: new Set([value]), exclude: new Set<string>() }
      : { include: new Set<string>(), exclude: new Set([value]) },
  };
}

describe("itemMatchesFilters — passthrough", () => {
  it("returns true when no filters are active", () => {
    expect(itemMatchesFilters(makeItem(), emptyFilters())).toBe(true);
  });
});

describe("itemMatchesFilters — source dimension", () => {
  it("matches by source (include / exclude)", () => {
    const item = makeItem({ source: "XPHB" });
    expect(itemMatchesFilters(item, withTri("source", "XPHB"))).toBe(true);
    expect(itemMatchesFilters(item, withTri("source", "XDMG"))).toBe(false);
    expect(itemMatchesFilters(item, withTri("source", "XPHB", "exclude"))).toBe(false);
  });
});

describe("itemMatchesFilters — rarity dimension", () => {
  it("matches by rarity, defaulting undefined rarity to 'none'", () => {
    expect(itemMatchesFilters(makeItem({ rarity: "rare" }), withTri("rarity", "rare"))).toBe(true);
    expect(itemMatchesFilters(makeItem({ rarity: "rare" }), withTri("rarity", "common"))).toBe(false);
    const noRarity = makeItem();
    delete (noRarity as Partial<Item>).rarity;
    expect(itemMatchesFilters(noRarity, withTri("rarity", "none"))).toBe(true);
  });
});

describe("itemMatchesFilters — type parsing", () => {
  it("extracts the code before the first '|'", () => {
    const item = makeItem({ type: "LA|XPHB" }); // Light Armor
    expect(itemMatchesFilters(item, withTri("type", "LA"))).toBe(true);
    expect(itemMatchesFilters(item, withTri("type", "M"))).toBe(false);
  });

  it("coerces codes starting with '$' to '$' (treasure)", () => {
    const item = makeItem({ type: "$G|XDMG" } as Partial<Item>);
    expect(itemMatchesFilters(item, withTri("type", "$"))).toBe(true);
    expect(itemMatchesFilters(item, withTri("type", "G"))).toBe(false);
  });

  it("uses the raw code when type is undefined (empty string candidate)", () => {
    const item = makeItem();
    delete (item as Partial<Item>).type;
    // No type filter -> passthrough. With a type filter, the empty candidate
    // never matches concrete codes.
    expect(itemMatchesFilters(item, emptyFilters())).toBe(true);
    expect(itemMatchesFilters(item, withTri("type", "M"))).toBe(false);
  });
});

describe("itemMatchesFilters — misc AND-flag", () => {
  it("wondrous flag matches the 'wondrous' misc key", () => {
    const wondrous = makeItem({ wondrous: true });
    const f = emptyFilters();
    expect(itemMatchesFilters(wondrous, { ...f, misc: new Set(["wondrous"]) })).toBe(true);
    expect(itemMatchesFilters(makeItem(), { ...f, misc: new Set(["wondrous"]) })).toBe(false);
  });

  it("reqAttune flag matches the 'reqAttune' misc key", () => {
    const attuned = makeItem({ reqAttune: true });
    const f = emptyFilters();
    expect(itemMatchesFilters(attuned, { ...f, misc: new Set(["reqAttune"]) })).toBe(true);
  });

  it("'weapon' misc matches weaponCategory or type starting with M/R", () => {
    const f = emptyFilters();
    const byCat = makeItem({ weaponCategory: "martial" });
    expect(itemMatchesFilters(byCat, { ...f, misc: new Set(["weapon"]) })).toBe(true);
    const byType = makeItem({ type: "R|XPHB" });
    expect(itemMatchesFilters(byType, { ...f, misc: new Set(["weapon"]) })).toBe(true);
    const armor = makeItem({ type: "LA|XPHB" });
    expect(itemMatchesFilters(armor, { ...f, misc: new Set(["weapon"]) })).toBe(false);
  });

  // FIXME: bug — the armor regex `/LA|MA|HA|S\b/` is fragile:
  //   - It matches any substring, so e.g. a hypothetical "ASTK" code would
  //     still match because of "S" + word boundary.
  //   - `\b` after a single capital "S" is unreliable against '|'-suffixed
  //     codes (e.g. "S|XPHB") because `|` is a non-word char, so the boundary
  //     fires before the `|` — the regex matches the "S" in "STK" too.
  //   The test below pins the current observed behavior (matches Light/Medium/
  //   Heavy armor and Shield). Tightening the regex is a separate fix.
  it("'armor' misc matches LA/MA/HA/S type codes (current behavior)", () => {
    const f = emptyFilters();
    for (const code of ["LA", "MA", "HA", "S"]) {
      const item = makeItem({ type: `${code}|XPHB` });
      expect(
        itemMatchesFilters(item, { ...f, misc: new Set(["armor"]) }),
        `expected armor match for type code ${code}`,
      ).toBe(true);
    }
    const weapon = makeItem({ type: "M|XPHB" });
    expect(itemMatchesFilters(weapon, { ...f, misc: new Set(["armor"]) })).toBe(false);
  });

  it("AND-combines selected misc values", () => {
    const f = emptyFilters();
    // A wondrous attuned item (no weapon type) passes wondrous+reqAttune but
    // not wondrous+weapon.
    const item = makeItem({ type: undefined, wondrous: true, reqAttune: true });
    expect(itemMatchesFilters(item, { ...f, misc: new Set(["wondrous", "reqAttune"]) })).toBe(true);
    expect(itemMatchesFilters(item, { ...f, misc: new Set(["wondrous", "weapon"]) })).toBe(false);
  });
});

describe("deriveSourceOptions", () => {
  it("counts sources and sorts by count desc, falling back to raw code for unknown", () => {
    const items = [
      makeItem({ source: "XDMG" }),
      makeItem({ source: "XDMG" }),
      makeItem({ source: "XPHB" }),
    ];
    const out = deriveSourceOptions(items);
    expect(out[0]!.value).toBe("XDMG");
    expect(out[0]!.label).toBe("Dungeon Master's Guide"); // known label
    expect(out[1]!.value).toBe("XPHB");
  });
});
