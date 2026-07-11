import { create } from "zustand";
import type { Monster } from "@/types/entities";

/**
 * Bestiary filter state and the pure predicate that applies it.
 * Same architecture as spellFilters: Set<string> per dimension, AND-combined.
 */

export type FilterDimension =
  | "source"
  | "size"
  | "type"
  | "cr"
  | "immune"
  | "conditionImmune"
  | "environment"
  | "misc";

interface BestiaryFilterState {
  source: Set<string>;
  size: Set<string>;
  type: Set<string>;
  cr: Set<string>;
  immune: Set<string>;
  conditionImmune: Set<string>;
  environment: Set<string>;
  misc: Set<string>;

  toggle: (dim: FilterDimension, value: string) => void;
  clearDimension: (dim: FilterDimension) => void;
  clearAll: () => void;
  activeCount: () => number;
}

const EMPTY = () => new Set<string>();

export const useBestiaryFilters = create<BestiaryFilterState>((set, get) => ({
  source: EMPTY(),
  size: EMPTY(),
  type: EMPTY(),
  cr: EMPTY(),
  immune: EMPTY(),
  conditionImmune: EMPTY(),
  environment: EMPTY(),
  misc: EMPTY(),

  toggle: (dim, value) =>
    set((state) => {
      const next = new Set(state[dim]);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { [dim]: next } as Partial<BestiaryFilterState>;
    }),
  clearDimension: (dim) => set({ [dim]: EMPTY() } as Partial<BestiaryFilterState>),
  clearAll: () =>
    set({
      source: EMPTY(), size: EMPTY(), type: EMPTY(), cr: EMPTY(),
      immune: EMPTY(), conditionImmune: EMPTY(), environment: EMPTY(), misc: EMPTY(),
    }),
  activeCount: () => {
    const s = get();
    return DIMENSIONS.filter((d) => s[d].size > 0).length;
  },
}));

const DIMENSIONS: FilterDimension[] = [
  "source", "size", "type", "cr", "immune", "conditionImmune", "environment", "misc",
];

// --- Static option lists --------------------------------------------------

export const SIZE_OPTIONS = [
  { value: "T", label: "Tiny" },
  { value: "S", label: "Small" },
  { value: "M", label: "Medium" },
  { value: "L", label: "Large" },
  { value: "H", label: "Huge" },
  { value: "G", label: "Gargantuan" },
];

export const TYPE_OPTIONS = [
  "aberration", "beast", "celestial", "construct", "dragon", "elemental",
  "fey", "fiend", "giant", "humanoid", "monstrosity", "ooze", "plant", "undead",
].map((t) => ({ value: t, label: capitalize(t) }));

/** Individual CR values, ordered low to high. */
export const CR_OPTIONS = [
  { value: "0", label: "0" },
  { value: "1/8", label: "1/8" },
  { value: "1/4", label: "1/4" },
  { value: "1/2", label: "1/2" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6" },
  { value: "7", label: "7" },
  { value: "8", label: "8" },
  { value: "9", label: "9" },
  { value: "10", label: "10" },
  { value: "11", label: "11" },
  { value: "12", label: "12" },
  { value: "13", label: "13" },
  { value: "14", label: "14" },
  { value: "15", label: "15" },
  { value: "16", label: "16" },
  { value: "17", label: "17" },
  { value: "18", label: "18" },
  { value: "19", label: "19" },
  { value: "20", label: "20" },
  { value: "21", label: "21" },
  { value: "22", label: "22" },
  { value: "23", label: "23" },
  { value: "24", label: "24" },
  { value: "25", label: "25" },
  { value: "26", label: "26" },
  { value: "27", label: "27" },
  { value: "28", label: "28" },
  { value: "29", label: "29" },
  { value: "30", label: "30" },
];

export const IMMUNITY_OPTIONS = [
  "acid", "cold", "fire", "force", "lightning", "necrotic",
  "poison", "psychic", "radiant", "thunder",
  "bludgeoning", "piercing", "slashing",
].map((d) => ({ value: d, label: capitalize(d) }));

export const CONDITION_OPTIONS = [
  "blinded", "charmed", "deafened", "exhaustion", "frightened", "grappled",
  "incapacitated", "paralyzed", "petrified", "poisoned", "prone",
  "restrained", "stunned", "unconscious",
].map((c) => ({ value: c, label: capitalize(c) }));

export const ENVIRONMENT_OPTIONS = [
  "arctic", "coastal", "desert", "forest", "grassland", "hill",
  "mountain", "swamp", "underdark", "underwater", "urban",
].map((e) => ({ value: e, label: capitalize(e) }));

export const MISC_OPTIONS = [
  { value: "legendary", label: "Legendary" },
  { value: "spellcasting", label: "Spellcaster" },
  { value: "lair", label: "Lair / Lair Action" },
];

// --- Dynamic options ------------------------------------------------------

export function deriveSourceOptions(monsters: Monster[]) {
  const m = new Map<string, number>();
  for (const mon of monsters) m.set(mon.source, (m.get(mon.source) ?? 0) + 1);
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

// --- Matching predicate ---------------------------------------------------

export function monsterMatchesFilters(monster: Monster, f: BestiaryFilterState): boolean {
  if (f.source.size > 0 && !f.source.has(monster.source)) return false;

  if (f.size.size > 0) {
    const hit = monster.size.some((s) => f.size.has(s));
    if (!hit) return false;
  }

  if (f.type.size > 0) {
    const t = typeof monster.type === "string" ? monster.type : monster.type.type;
    if (!t || !f.type.has(t)) return false;
  }

  if (f.cr.size > 0) {
    const crStr = typeof monster.cr === "string" ? monster.cr : monster.cr?.cr ?? "0";
    if (!f.cr.has(crStr)) return false;
  }

  if (f.immune.size > 0) {
    const hits = (monster.immune ?? []).some((d) => f.immune.has(d));
    if (!hits) return false;
  }

  if (f.conditionImmune.size > 0) {
    const hits = (monster.conditionImmune ?? []).some((c) => f.conditionImmune.has(c));
    if (!hits) return false;
  }

  if (f.environment.size > 0) {
    const hits = (monster.environment ?? []).some((e) => {
      // Environment can be "forest" or "planar, abyss" — match the primary token
      const primary = e.split(",").pop()?.trim() ?? e;
      return f.environment.has(primary) || f.environment.has(e.trim());
    });
    if (!hits) return false;
  }

  if (f.misc.size > 0) {
    const hit = [...f.misc].every((m) => {
      if (m === "legendary") return !!(monster.legendary?.length);
      if (m === "spellcasting") return !!(monster.spellcasting?.length);
      if (m === "lair") return !!(monster.group?.length);
      return false;
    });
    if (!hit) return false;
  }

  return true;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
