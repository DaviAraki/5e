import { create } from "zustand";
import type { Item } from "@/types/entities";

/**
 * Item filter state and predicate. Same architecture as spell/bestiary filters.
 */

export type FilterDimension = "source" | "type" | "rarity" | "misc";

interface ItemFilterState {
  source: Set<string>;
  type: Set<string>;
  rarity: Set<string>;
  misc: Set<string>;

  toggle: (dim: FilterDimension, value: string) => void;
  clearDimension: (dim: FilterDimension) => void;
  clearAll: () => void;
  activeCount: () => number;
}

const EMPTY = () => new Set<string>();

export const useItemFilters = create<ItemFilterState>((set, get) => ({
  source: EMPTY(),
  type: EMPTY(),
  rarity: EMPTY(),
  misc: EMPTY(),

  toggle: (dim, value) =>
    set((state) => {
      const next = new Set(state[dim]);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { [dim]: next } as Partial<ItemFilterState>;
    }),
  clearDimension: (dim) => set({ [dim]: EMPTY() } as Partial<ItemFilterState>),
  clearAll: () =>
    set({ source: EMPTY(), type: EMPTY(), rarity: EMPTY(), misc: EMPTY() }),
  activeCount: () => {
    const s = get();
    return DIMENSIONS.filter((d) => s[d].size > 0).length;
  },
}));

const DIMENSIONS: FilterDimension[] = ["source", "type", "rarity", "misc"];

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

export function deriveSourceOptions(items: Item[]) {
  const m = new Map<string, number>();
  for (const it of items) m.set(it.source, (m.get(it.source) ?? 0) + 1);
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([code]) => ({ value: code, label: sourceLabel(code) }));
}

function sourceLabel(code: string): string {
  const map: Record<string, string> = {
    XMM: "Monster Manual",
    XPHB: "Player's Handbook",
    XDMG: "Dungeon Master's Guide",
    RHW: "Ravenloft: The Horrors Within",
    FRAiF: "Forge of the Elemental Giants",
    WttHC: "Welcome to the Hidden City",
    EFA: "Eberron: Friends and Foes",
    HotB: "Heart of the Beholder",
    LFL: "Legends of the Forgotten Lands",
    NF: "Nightfall",
    ABH: "Ancient Blood & Honor",
  };
  return map[code] ?? code;
}

export function itemMatchesFilters(item: Item, f: ItemFilterState): boolean {
  if (f.source.size > 0 && !f.source.has(item.source)) return false;

  if (f.type.size > 0) {
    const rawType = item.type ?? "";
    const code = rawType.split("|")[0] ?? rawType;
    const isTreasure = code.startsWith("$");
    const cleanCode = isTreasure ? "$" : code;
    if (!f.type.has(cleanCode)) return false;
  }

  if (f.rarity.size > 0) {
    const r = item.rarity ?? "none";
    if (!f.rarity.has(r)) return false;
  }

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

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
