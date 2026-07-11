import { create } from "zustand";
import type { Feat } from "@/types/entities";

export type FilterDimension = "category" | "ability" | "misc" | "source";

interface FeatFilterState {
  category: Set<string>;
  ability: Set<string>;
  misc: Set<string>;
  source: Set<string>;

  toggle: (dim: FilterDimension, value: string) => void;
  clearDimension: (dim: FilterDimension) => void;
  clearAll: () => void;
  activeCount: () => number;
}

const EMPTY = () => new Set<string>();

export const useFeatFilters = create<FeatFilterState>((set, get) => ({
  category: EMPTY(),
  ability: EMPTY(),
  misc: EMPTY(),
  source: EMPTY(),

  toggle: (dim, value) =>
    set((state) => {
      const next = new Set(state[dim]);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { [dim]: next } as Partial<FeatFilterState>;
    }),
  clearDimension: (dim) => set({ [dim]: EMPTY() } as Partial<FeatFilterState>),
  clearAll: () => set({ category: EMPTY(), ability: EMPTY(), misc: EMPTY(), source: EMPTY() }),
  activeCount: () => {
    const s = get();
    return DIMENSIONS.filter((d) => s[d].size > 0).length;
  },
}));

const DIMENSIONS: FilterDimension[] = ["category", "ability", "misc", "source"];

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
  if (f.source.size > 0 && !f.source.has(feat.source)) return false;

  if (f.category.size > 0) {
    if (!feat.category || !f.category.has(feat.category)) return false;
  }

  if (f.ability.size > 0) {
    const abilities = getFeatAbilities(feat);
    const hit = [...f.ability].some((a) => abilities.has(a));
    if (!hit) return false;
  }

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
