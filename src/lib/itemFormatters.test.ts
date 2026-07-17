import { describe, expect, it } from "vitest";
import type { Item } from "@/types/entities";
import {
  attunementToFull,
  damageToFull,
  isConsumable,
  itemSubtitle,
  propertiesToFull,
  rarityToFull,
  typeToFull,
  valueToFull,
  weightToFull,
} from "@/lib/itemFormatters";

/**
 * Tests for the item display formatters. Focus on the high-bug-surface
 * functions: valueToFull (gp/sp/cp modulo math), itemSubtitle (cascading
 * if/else + regex), typeToFull (split-on-|, $-prefix strip), and isConsumable
 * (which feeds the loot generator).
 */

describe("typeToFull", () => {
  it("maps a bare code", () => {
    expect(typeToFull("M")).toBe("Melee Weapon");
    expect(typeToFull("LA")).toBe("Light Armor");
    expect(typeToFull("S")).toBe("Shield");
  });

  it("strips the '|source' suffix before lookup", () => {
    expect(typeToFull("M|XPHB")).toBe("Melee Weapon");
    expect(typeToFull("RG|XDMG")).toBe("Ring");
  });

  it("strips a leading '$' (treasure) before lookup", () => {
    expect(typeToFull("$G|XDMG")).toBe("Adventuring Gear");
    expect(typeToFull("$")).toBe("Treasure");
  });

  it("returns the raw code when unknown", () => {
    expect(typeToFull("ZZZ")).toBe("ZZZ");
  });

  it("returns empty for undefined/empty input", () => {
    expect(typeToFull(undefined)).toBe("");
    expect(typeToFull("")).toBe("");
  });
});

describe("rarityToFull", () => {
  it.each([
    ["common", "Common"],
    ["uncommon", "Uncommon"],
    ["rare", "Rare"],
    ["legendary", "Legendary"],
    ["artifact", "Artifact"],
  ])("rarity %s -> %s", (r, expected) => {
    expect(rarityToFull(r)).toBe(expected);
  });

  it("returns '' for none / undefined", () => {
    expect(rarityToFull("none")).toBe("");
    expect(rarityToFull(undefined)).toBe("");
  });

  it("returns 'Magic Item' for the 'unknown (magic)' code", () => {
    expect(rarityToFull("unknown (magic)")).toBe("Magic Item");
  });
});

describe("valueToFull (cp -> gp/sp/cp)", () => {
  it.each([
    [undefined, ""],
    [0, ""],
    [100, "1 gp"],
    [200, "2 gp"],
    [150, "150 cp"], // 1.5 gp -> falls back to cp (non-integer gp)
    [10, "1 sp"],
    [50, "5 sp"], // 0.5 gp, < 1 gp -> sp
    [5, "5 cp"], // < 10 cp -> cp
    [1, "1 cp"],
  ])("cp %i -> %s", (cp, expected) => {
    expect(valueToFull(cp)).toBe(expected);
  });
});

describe("weightToFull", () => {
  it.each([
    [undefined, ""],
    [1, "1 lb"],
    [2, "2 lbs"],
    [0.5, "0.5 lbs"],
  ])("weight %s -> %s", (w, expected) => {
    expect(weightToFull(w as number | undefined)).toBe(expected);
  });
});

describe("attunementToFull", () => {
  it.each([
    [true, "Requires Attunement"],
    [false, ""],
    ["by a wizard", "Attunement (by a wizard)"],
    [undefined, ""],
  ])("attune %s -> %s", (req, expected) => {
    expect(attunementToFull(req as Item["reqAttune"])).toBe(expected);
  });
});

describe("damageToFull", () => {
  it("formats primary damage with type", () => {
    expect(damageToFull("1d8", undefined, "S")).toBe("1d8 Slashing");
  });

  it("appends versatile damage in parentheses", () => {
    expect(damageToFull("1d8", "1d10", "S")).toBe("1d8 Slashing (versatile 1d10 Slashing)");
  });

  it("omits damage type when undefined", () => {
    expect(damageToFull("1d6")).toBe("1d6 ");
  });

  it("returns empty when dmg1 is absent", () => {
    expect(damageToFull(undefined)).toBe("");
  });
});

describe("itemSubtitle", () => {
  it("builds 'Armor (medium), very rare (Requires Attunement)'-style strings", () => {
    const item: Item = {
      name: "X", source: "XPHB", type: "MA|XPHB", rarity: "very rare", reqAttune: true,
    } as Item;
    // rarityToFull only capitalizes the first letter ("very rare" -> "Very rare").
    expect(itemSubtitle(item)).toBe("Medium Armor, Very rare, (Requires Attunement)");
  });

  it("prefers 'Wondrous Item' when wondrous is set", () => {
    const item: Item = { name: "X", source: "XPHB", type: "W|XPHB", wondrous: true } as Item;
    expect(itemSubtitle(item).startsWith("Wondrous Item")).toBe(true);
  });

  it("uses 'Staff' when staff flag set", () => {
    const item: Item = { name: "X", source: "XPHB", type: "STK|XPHB", staff: true } as Item;
    expect(itemSubtitle(item).startsWith("Staff")).toBe(true);
  });

  it("uses 'Poison' when poison flag set", () => {
    const item: Item = { name: "X", source: "XPHB", poison: true } as Item;
    expect(itemSubtitle(item).startsWith("Poison")).toBe(true);
  });

  it("uses weaponCategory as '<Category> Weapon'", () => {
    const item: Item = {
      name: "X", source: "XPHB", type: "M|XPHB", weaponCategory: "martial",
    } as Item;
    expect(itemSubtitle(item).startsWith("Martial Weapon")).toBe(true);
  });

  it("falls back to the type label for armor/shield", () => {
    const item: Item = { name: "X", source: "XPHB", type: "S|XPHB" } as Item;
    expect(itemSubtitle(item)).toBe("Shield");
  });
});

describe("propertiesToFull", () => {
  it("maps property codes via the table", () => {
    expect(propertiesToFull(["V", "F"])).toBe("Versatile, Finesse");
  });

  it("strips a '|source' suffix on each property", () => {
    expect(propertiesToFull(["2H|XPHB"])).toBe("Two-Handed");
  });

  it("returns empty for undefined / empty array", () => {
    expect(propertiesToFull(undefined)).toBe("");
    expect(propertiesToFull([])).toBe("");
  });

  it("passes unknown codes through unchanged", () => {
    expect(propertiesToFull(["ZZZ"])).toBe("ZZZ");
  });
});

describe("isConsumable", () => {
  it("returns true when miscTags includes 'CNS'", () => {
    const item: Item = { name: "Potion of Healing", source: "XPHB", miscTags: ["CNS"] } as Item;
    expect(isConsumable(item)).toBe(true);
  });

  it("returns true for consumable type codes without the CNS tag (fallback)", () => {
    expect(isConsumable({ name: "X", source: "XPHB", type: "P|XPHB" } as Item)).toBe(true); // Potion
    expect(isConsumable({ name: "X", source: "XPHB", type: "SC|XPHB" } as Item)).toBe(true); // Scroll-ish
    expect(isConsumable({ name: "X", source: "XPHB", type: "EXP|XPHB" } as Item)).toBe(true); // Explosive
    expect(isConsumable({ name: "X", source: "XPHB", type: "FD|XPHB" } as Item)).toBe(true); // Food
  });

  it("strips a leading '$' before checking the code", () => {
    expect(isConsumable({ name: "X", source: "XPHB", type: "$P|XDMG" } as Item)).toBe(true);
  });

  it("returns false for non-consumable items", () => {
    expect(isConsumable({ name: "X", source: "XPHB", type: "M|XPHB" } as Item)).toBe(false); // Melee Weapon
    expect(isConsumable({ name: "X", source: "XPHB", type: "LA|XPHB" } as Item)).toBe(false); // Light Armor
    expect(isConsumable({ name: "X", source: "XPHB" } as Item)).toBe(false); // No type
  });
});
