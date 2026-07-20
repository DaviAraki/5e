import { create } from "zustand";
import type { Item } from "@/types/entities";
import { capitalize } from "@/lib/text";
import {
  type TriState,
  emptyTri,
  triCycle,
  triMatch,
  triSize,
} from "@/state/triStateFilter";

/**
 * Item filter state and predicate. Tri-state (include/exclude) for source,
 * type, rarity; misc is a 2-state AND-flag.
 */

export type TriDimension = "source" | "type" | "rarity";
export type FilterDimension = TriDimension | "misc";

interface ItemFilterState {
  source: TriState;
  type: TriState;
  rarity: TriState;
  misc: Set<string>;

  cycle: (dim: TriDimension, value: string) => void;
  toggleMisc: (value: string) => void;
  clearDimension: (dim: FilterDimension) => void;
  clearAll: () => void;
  activeCount: () => number;
}

const TRI_DIMENSIONS: TriDimension[] = ["source", "type", "rarity"];

export const useItemFilters = create<ItemFilterState>((set, get) => ({
  source: emptyTri(),
  type: emptyTri(),
  rarity: emptyTri(),
  misc: new Set<string>(),

  cycle: (dim, value) =>
    set((state) => ({ [dim]: triCycle(state[dim], value) }) as Partial<ItemFilterState>),
  toggleMisc: (value) =>
    set((state) => {
      const next = new Set(state.misc);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { misc: next };
    }),
  clearDimension: (dim) =>
    set(
      dim === "misc"
        ? { misc: new Set<string>() }
        : ({ [dim]: emptyTri() } as Partial<ItemFilterState>),
    ),
  clearAll: () =>
    set({ source: emptyTri(), type: emptyTri(), rarity: emptyTri(), misc: new Set<string>() }),
  activeCount: () => {
    const s = get();
    return TRI_DIMENSIONS.reduce((n, d) => n + triSize(s[d]), 0) + s.misc.size;
  },
}));

export const RARITY_OPTIONS = [
  "none", "common", "uncommon", "rare", "very rare", "legendary", "artifact",
].map((r) => ({ value: r, label: r === "none" ? "Mundane" : capitalize(r) }));

export const TYPE_OPTIONS = [
  { value: "M", label: "Melee Weapon" },
  { value: "R", label: "Ranged Weapon" },
  { value: "A", label: "Ammunition" },
  { value: "LA", label: "Light Armor" },
  { value: "MA", label: "Medium Armor" },
  { value: "HA", label: "Heavy Armor" },
  { value: "S", label: "Shield" },
  { value: "P", label: "Potion" },
  { value: "SCF", label: "Spellcasting Focus" },
  { value: "WD", label: "Wand" },
  { value: "RD", label: "Rod" },
  { value: "STK", label: "Staff" },
  { value: "RG", label: "Ring" },
  { value: "SCN", label: "Scroll" },
  { value: "G", label: "Adventuring Gear" },
  { value: "$", label: "Treasure" },
];

export const MISC_OPTIONS = [
  { value: "wondrous", label: "Wondrous Item" },
  { value: "reqAttune", label: "Requires Attunement" },
  { value: "weapon", label: "Weapon" },
  { value: "armor", label: "Armor" },
];

export { deriveSourceOptions } from "@/lib/sourceLabels";

export function itemMatchesFilters(item: Item, f: ItemFilterState): boolean {
  if (!triMatch(f.source, [item.source])) return false;

  const rawType = item.type ?? "";
  const code = rawType.split("|")[0] ?? rawType;
  const cleanCode = code.startsWith("$") ? "$" : code;
  if (!triMatch(f.type, [cleanCode])) return false;

  if (!triMatch(f.rarity, [item.rarity ?? "none"])) return false;

  if (f.misc.size > 0) {
    const hit = [...f.misc].every((m) => {
      if (m === "wondrous") return !!item.wondrous;
      if (m === "reqAttune") return !!item.reqAttune;
      if (m === "weapon") return !!item.weaponCategory || item.type?.startsWith("M") || item.type?.startsWith("R");
      if (m === "armor") return /LA|MA|HA|S\b/.test(item.type ?? "");
      return false;
    });
    if (!hit) return false;
  }

  return true;
}
