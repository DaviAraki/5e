import type { Item } from "@/types/entities";
import { isConsumable } from "@/lib/itemFormatters";

/**
 * Pure loot-generation logic — no React, no I/O.
 *
 * Pulls random items from the pre-merged items dataset, filtered by rarity,
 * source book, and consumable mode. Randomness uses the Web Crypto API for
 * unbiased selection.
 */

/** Rarity tiers available as rollable buckets, in ascending order. */
export const LOOT_RARITIES = [
  "none",
  "common",
  "uncommon",
  "rare",
  "very rare",
  "legendary",
  "artifact",
] as const;

export type LootRarity = (typeof LOOT_RARITIES)[number];

export type ConsumableMode = "any" | "only" | "exclude";

export interface LootSettings {
  /** How many items to draw from each rarity bucket. */
  counts: Record<LootRarity, number>;
  /** Source codes to include; empty means all sources. */
  sources: Set<string>;
  /** Filter the pool by consumable-ness. */
  consumableMode: ConsumableMode;
}

export type LootPool = Record<LootRarity, Item[]>;
export type LootRoll = Record<LootRarity, Item[]>;

export function emptyLootCounts(): Record<LootRarity, number> {
  return { none: 0, common: 0, uncommon: 0, rare: 0, "very rare": 0, legendary: 0, artifact: 0 };
}

export function emptyLootRoll(): LootRoll {
  return { none: [], common: [], uncommon: [], rare: [], "very rare": [], legendary: [], artifact: [] };
}

/**
 * Build the rollable pool: items filtered by source + consumable mode,
 * partitioned by rarity. Each rarity bucket is an independent draw source.
 */
export function buildLootPool(items: Item[], settings: LootSettings): LootPool {
  const pool: LootPool = emptyLootRoll();

  for (const item of items) {
    if (settings.sources.size > 0 && !settings.sources.has(item.source)) continue;

    if (settings.consumableMode === "only" && !isConsumable(item)) continue;
    if (settings.consumableMode === "exclude" && isConsumable(item)) continue;

    const r = (item.rarity ?? "none") as LootRarity;
    if (r in pool) pool[r].push(item);
  }

  return pool;
}

/**
 * Draw `counts[r]` items from each rarity bucket without replacement.
 * Buckets smaller than the requested count simply return all available
 * items (graceful degradation, no error).
 */
export function rollLoot(pool: LootPool, counts: Record<LootRarity, number>): LootRoll {
  const result: LootRoll = emptyLootRoll();
  for (const r of LOOT_RARITIES) {
    const n = counts[r] ?? 0;
    if (n <= 0) continue;
    result[r] = cryptoPick(pool[r], n);
  }
  return result;
}

/**
 * Pick `n` distinct items from `arr` uniformly at random using the Web Crypto
 * API. Returns at most `min(n, arr.length)` items. Does not mutate the input.
 */
export function cryptoPick<T>(arr: readonly T[], n: number): T[] {
  if (n <= 0 || arr.length === 0) return [];
  const take = Math.min(n, arr.length);
  // Fisher–Yates partial shuffle over a copy, stopping after `take` picks.
  const copy = arr.slice();
  for (let i = 0; i < take; i++) {
    const j = i + cryptoIntBelow(copy.length - i);
    const tmp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = tmp;
  }
  return copy.slice(0, take);
}

/** Uniform random integer in [0, max) using crypto.getRandomValues. */
function cryptoIntBelow(max: number): number {
  if (max <= 0) return 0;
  // Reject values that would introduce modulo bias.
  const limit = Math.floor(0xffffffff / max) * max;
  const buf = new Uint32Array(1);
  let x = 0;
  do {
    crypto.getRandomValues(buf);
    x = buf[0] ?? 0;
  } while (x >= limit);
  return x % max;
}
