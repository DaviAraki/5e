import { create } from "zustand";
import type { Feat } from "@/types/entities";
import {
  type TriState,
  emptyTri,
  triCycle,
  triMatch,
  triSize,
} from "@/state/triStateFilter";

export type TriDimension = "category" | "ability" | "source";
export type FilterDimension = TriDimension | "misc";

interface FeatFilterState {
  category: TriState;
  ability: TriState;
  misc: Set<string>;
  source: TriState;

  cycle: (dim: TriDimension, value: string) => void;
  toggleMisc: (value: string) => void;
  clearDimension: (dim: FilterDimension) => void;
  clearAll: () => void;
  activeCount: () => number;
}

const TRI_DIMENSIONS: TriDimension[] = ["category", "ability", "source"];

export const useFeatFilters = create<FeatFilterState>((set, get) => ({
  category: emptyTri(),
  ability: emptyTri(),
  misc: new Set<string>(),
  source: emptyTri(),

  cycle: (dim, value) =>
    set((state) => ({ [dim]: triCycle(state[dim], value) }) as Partial<FeatFilterState>),
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
        : ({ [dim]: emptyTri() } as Partial<FeatFilterState>),
    ),
  clearAll: () => set({ category: emptyTri(), ability: emptyTri(), misc: new Set<string>(), source: emptyTri() }),
  activeCount: () => {
    const s = get();
    return TRI_DIMENSIONS.reduce((n, d) => n + triSize(s[d]), 0) + s.misc.size;
  },
}));

export const CATEGORY_OPTIONS = [
  { value: "G", label: "General" },
  { value: "O", label: "Origin" },
  { value: "FS", label: "Fighting Style" },
  { value: "EB", label: "Epic Boon" },
  { value: "D", label: "Dragonmark" },
  { value: "DG", label: "Dark Gift" },
];

export const ABILITY_OPTIONS = [
  { value: "str", label: "Strength" },
  { value: "dex", label: "Dexterity" },
  { value: "con", label: "Constitution" },
  { value: "int", label: "Intelligence" },
  { value: "wis", label: "Wisdom" },
  { value: "cha", label: "Charisma" },
];

export const MISC_OPTIONS = [
  { value: "repeatable", label: "Repeatable" },
  { value: "spells", label: "Grants Spells" },
];

export function deriveSourceOptions(feats: Feat[]) {
  const m = new Map<string, number>();
  for (const f of feats) m.set(f.source, (m.get(f.source) ?? 0) + 1);
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([code]) => ({ value: code, label: sourceLabel(code) }));
}

function sourceLabel(code: string): string {
  const map: Record<string, string> = {
    XPHB: "Player's Handbook",
    XDMG: "Dungeon Master's Guide",
    EFA: "Eberron: Friends and Foes",
    RHW: "Ravenloft: The Horrors Within",
    FRAiF: "Forge of the Elemental Giants",
    WttHC: "Welcome to the Hidden City",
    FRHoF: "Forge of the Elemental Giants",
    GrimHollowPG24: "Grim Hollow: Player's Guide (2024)",
    GrimHollowMG24: "Grim Hollow: Monster Grimoire (2024)",
  };
  return map[code] ?? code;
}

/** Extract ability codes from a feat's ability array (including choose.from). */
function getFeatAbilities(feat: Feat): Set<string> {
  const abilities = new Set<string>();
  for (const entry of feat.ability ?? []) {
    if (entry.hidden) continue;
    for (const k of Object.keys(entry)) {
      if (k === "choose") {
        const choose = entry[k] as { from?: string[] };
        choose.from?.forEach((a) => abilities.add(a));
      } else if (typeof entry[k] === "number") {
        abilities.add(k);
      }
    }
  }
  return abilities;
}

export function featMatchesFilters(feat: Feat, f: FeatFilterState): boolean {
  if (!triMatch(f.source, [feat.source])) return false;

  if (!triMatch(f.category, feat.category ? [feat.category] : [])) return false;

  if (!triMatch(f.ability, getFeatAbilities(feat))) return false;

  if (f.misc.size > 0) {
    const hit = [...f.misc].every((m) => {
      if (m === "repeatable") return !!feat.repeatable;
      if (m === "spells") return !!feat.additionalSpells?.length;
      return false;
    });
    if (!hit) return false;
  }

  return true;
}
