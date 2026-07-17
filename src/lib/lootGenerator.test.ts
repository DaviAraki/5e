import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Item } from "@/types/entities";
import {
  type LootSettings,
  LOOT_RARITIES,
  buildLootPool,
  cryptoPick,
  emptyLootCounts,
  emptyLootRoll,
  rollLoot,
} from "@/lib/lootGenerator";

/**
 * Tests for the loot generator.
 *
 * buildLootPool / emptyLootCounts / emptyLootRoll are pure and deterministic.
 * cryptoPick and rollLoot consume crypto.getRandomValues; we stub it to a
 * deterministic PRNG (a linear congruential generator) so the partial
 * Fisher-Yates is reproducible, then assert structural invariants rather than
 * exact picks (the LCG sequence is an implementation detail of the test, not
 * of the code under test).
 */

const ITEM = (name: string, overrides: Partial<Item> = {}): Item =>
  ({ name, source: "XDMG", rarity: "uncommon", ...overrides }) as Item;

function settings(overrides: Partial<LootSettings> = {}): LootSettings {
  return {
    counts: emptyLootCounts(),
    sources: new Set(),
    consumableMode: "any",
    ...overrides,
  };
}

// --- pure helpers ---

describe("emptyLootCounts / emptyLootRoll", () => {
  it("every rarity key is present and zeroed/empty", () => {
    const counts = emptyLootCounts();
    const roll = emptyLootRoll();
    for (const r of LOOT_RARITIES) {
      expect(counts[r]).toBe(0);
      expect(roll[r]).toEqual([]);
    }
  });
});

describe("buildLootPool", () => {
  it("partitions items by rarity and respects the source filter", () => {
    const items = [
      ITEM("A", { rarity: "common", source: "XPHB" }),
      ITEM("B", { rarity: "common", source: "XDMG" }),
      ITEM("C", { rarity: "rare", source: "XDMG" }),
    ];
    const pool = buildLootPool(items, settings({ sources: new Set(["XDMG"]) }));
    expect(pool.common.map((i) => i.name)).toEqual(["B"]);
    expect(pool.rare.map((i) => i.name)).toEqual(["C"]);
    expect(pool.uncommon).toEqual([]);
  });

  it("consumableMode 'only' keeps only consumables", () => {
    const items = [
      ITEM("Potion", { rarity: "common", miscTags: ["CNS"] }),
      ITEM("Sword", { rarity: "common", type: "M|XPHB" }),
    ];
    const pool = buildLootPool(items, settings({ consumableMode: "only" }));
    expect(pool.common.map((i) => i.name)).toEqual(["Potion"]);
  });

  it("consumableMode 'exclude' drops consumables", () => {
    const items = [
      ITEM("Potion", { rarity: "common", miscTags: ["CNS"] }),
      ITEM("Sword", { rarity: "common", type: "M|XPHB" }),
    ];
    const pool = buildLootPool(items, settings({ consumableMode: "exclude" }));
    expect(pool.common.map((i) => i.name)).toEqual(["Sword"]);
  });

  it("items without a rarity fall into the 'none' bucket", () => {
    const item = ITEM("Plain", { rarity: undefined });
    delete (item as Partial<Item>).rarity;
    const pool = buildLootPool([item], settings());
    expect(pool.none.map((i) => i.name)).toEqual(["Plain"]);
  });

  it("returns an empty pool for no items", () => {
    const pool = buildLootPool([], settings());
    for (const r of LOOT_RARITIES) expect(pool[r]).toEqual([]);
  });
});

// --- crypto-dependent helpers (with deterministic mock) ---

describe("cryptoPick", () => {
  it("returns [] when n <= 0 or arr is empty", () => {
    expect(cryptoPick([1, 2, 3], 0)).toEqual([]);
    expect(cryptoPick([], 5)).toEqual([]);
  });

  it("returns at most min(n, arr.length) items without mutating the input", () => {
    const arr = [1, 2, 3, 4, 5];
    const snapshot = arr.slice();
    const out = cryptoPick(arr, 3);
    expect(out).toHaveLength(3);
    expect(out.every((x) => arr.includes(x))).toBe(true);
    expect(new Set(out).size).toBe(3); // distinct
    expect(arr).toEqual(snapshot); // not mutated
  });

  it("returns all items when n >= arr.length", () => {
    const arr = [1, 2, 3];
    const out = cryptoPick(arr, 10);
    expect(out.sort()).toEqual([1, 2, 3]);
  });
});

describe("rollLoot", () => {
  // Deterministic LCG so crypto.getRandomValues is reproducible. Seeded per
  // test via vi.fn() returning successive values.
  let sequence: number[] = [];
  let originalGetRandomValues: typeof crypto.getRandomValues;

  beforeEach(() => {
    originalGetRandomValues = crypto.getRandomValues;
    // Generate a long pseudorandom sequence; each call to getRandomValues
    // consumes the next element.
    let seed = 123456789;
    sequence = Array.from({ length: 1000 }, () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed >>> 0;
    });
    let i = 0;
    crypto.getRandomValues = vi.fn((buf: Uint32Array) => {
      for (let k = 0; k < buf.length; k++) {
        buf[k] = sequence[i % sequence.length]!;
        i++;
      }
      return buf;
    }) as typeof crypto.getRandomValues;
  });

  afterEach(() => {
    crypto.getRandomValues = originalGetRandomValues;
  });

  it("draws the requested count from each rarity bucket", () => {
    const pool = buildLootPool(
      Array.from({ length: 10 }, (_, i) => ITEM(`C${i}`, { rarity: "common" })),
      settings(),
    );
    const counts = emptyLootCounts();
    counts.common = 4;
    const roll = rollLoot(pool, counts);
    expect(roll.common).toHaveLength(4);
    expect(new Set(roll.common.map((i) => i.name)).size).toBe(4); // distinct
  });

  it("degrades gracefully when the bucket is smaller than the request", () => {
    const pool = buildLootPool(
      [ITEM("Only", { rarity: "rare" })],
      settings(),
    );
    const counts = emptyLootCounts();
    counts.rare = 5;
    const roll = rollLoot(pool, counts);
    expect(roll.rare.map((i) => i.name)).toEqual(["Only"]);
  });

  it("skips buckets whose count is 0", () => {
    const pool = buildLootPool([ITEM("A", { rarity: "common" })], settings());
    const roll = rollLoot(pool, emptyLootCounts());
    for (const r of LOOT_RARITIES) expect(roll[r]).toEqual([]);
  });
});
