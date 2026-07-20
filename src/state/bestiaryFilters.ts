import { create } from "zustand";
import type { Monster } from "@/types/entities";
import { capitalize } from "@/lib/text";
import {
  type TriState,
  emptyTri,
  triCycle,
  triIsEmpty,
  triMatch,
  triSize,
} from "@/state/triStateFilter";

/**
 * Bestiary filter state and the pure predicate that applies it.
 * Tri-state (include/exclude) dimensions AND-combined; misc is a 2-state AND-flag.
 */

export type TriDimension =
  | "source"
  | "size"
  | "type"
  | "cr"
  | "immune"
  | "conditionImmune"
  | "environment";

export type FilterDimension = TriDimension | "misc";

interface BestiaryFilterState {
  source: TriState;
  size: TriState;
  type: TriState;
  cr: TriState;
  immune: TriState;
  conditionImmune: TriState;
  environment: TriState;
  misc: Set<string>;

  cycle: (dim: TriDimension, value: string) => void;
  toggleMisc: (value: string) => void;
  clearDimension: (dim: FilterDimension) => void;
  clearAll: () => void;
  activeCount: () => number;
}

const TRI_DIMENSIONS: TriDimension[] = [
  "source", "size", "type", "cr", "immune", "conditionImmune", "environment",
];

export const useBestiaryFilters = create<BestiaryFilterState>((set, get) => ({
  source: emptyTri(),
  size: emptyTri(),
  type: emptyTri(),
  cr: emptyTri(),
  immune: emptyTri(),
  conditionImmune: emptyTri(),
  environment: emptyTri(),
  misc: new Set<string>(),

  cycle: (dim, value) =>
    set((state) => ({ [dim]: triCycle(state[dim], value) }) as Partial<BestiaryFilterState>),
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
        : ({ [dim]: emptyTri() } as Partial<BestiaryFilterState>),
    ),
  clearAll: () =>
    set({
      source: emptyTri(), size: emptyTri(), type: emptyTri(), cr: emptyTri(),
      immune: emptyTri(), conditionImmune: emptyTri(), environment: emptyTri(), misc: new Set<string>(),
    }),
  activeCount: () => {
    const s = get();
    return TRI_DIMENSIONS.reduce((n, d) => n + triSize(s[d]), 0) + s.misc.size;
  },
}));

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

// deriveSourceOptions + sourceLabel are shared across all filter stores;
// see lib/sourceLabels. Re-exported here so the BestiaryFilterSidebar's
// existing import keeps working.
export { deriveSourceOptions } from "@/lib/sourceLabels";

// --- Matching predicate ---------------------------------------------------

export function monsterMatchesFilters(monster: Monster, f: BestiaryFilterState): boolean {
  if (!triMatch(f.source, [monster.source])) return false;

  if (!triIsEmpty(f.size)) {
    if (!triMatch(f.size, monster.size)) return false;
  }

  if (!triIsEmpty(f.type)) {
    const t = typeof monster.type === "string" ? monster.type : monster.type.type;
    if (!t || !triMatch(f.type, [t])) return false;
  }

  if (!triIsEmpty(f.cr)) {
    const crStr = typeof monster.cr === "string" ? monster.cr : monster.cr?.cr ?? "0";
    if (!triMatch(f.cr, [crStr])) return false;
  }

  if (!triIsEmpty(f.immune)) {
    if (!triMatch(f.immune, monster.immune ?? [])) return false;
  }

  if (!triIsEmpty(f.conditionImmune)) {
    if (!triMatch(f.conditionImmune, monster.conditionImmune ?? [])) return false;
  }

  if (!triIsEmpty(f.environment)) {
    // Expand each raw environment into candidate tokens (primary + full).
    const candidates: string[] = [];
    for (const e of monster.environment ?? []) {
      candidates.push(e.trim());
      candidates.push(e.split(",").pop()?.trim() ?? e);
    }
    if (!triMatch(f.environment, candidates)) return false;
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

// capitalize is imported from @/lib/text.
