import { create } from "zustand";
import type { Background } from "@/types/entities";
import { capitalize } from "@/lib/text";
import {
  type TriState,
  emptyTri,
  triCycle,
  triMatch,
  triSize,
} from "@/state/triStateFilter";

/**
 * Background filter state: skill proficiencies + ability scores + source.
 * All dimensions are tri-state (include/exclude).
 */

export type FilterDimension = "skill" | "ability" | "source";

interface BackgroundFilterState {
  skill: TriState;
  ability: TriState;
  source: TriState;

  cycle: (dim: FilterDimension, value: string) => void;
  clearDimension: (dim: FilterDimension) => void;
  clearAll: () => void;
  activeCount: () => number;
}

const DIMENSIONS: FilterDimension[] = ["skill", "ability", "source"];

export const useBackgroundFilters = create<BackgroundFilterState>((set, get) => ({
  skill: emptyTri(),
  ability: emptyTri(),
  source: emptyTri(),

  cycle: (dim, value) =>
    set((state) => ({ [dim]: triCycle(state[dim], value) }) as Partial<BackgroundFilterState>),
  clearDimension: (dim) => set({ [dim]: emptyTri() } as Partial<BackgroundFilterState>),
  clearAll: () => set({ skill: emptyTri(), ability: emptyTri(), source: emptyTri() }),
  activeCount: () => {
    const s = get();
    return DIMENSIONS.reduce((n, d) => n + triSize(s[d]), 0);
  },
}));

export const SKILL_OPTIONS = [
  "acrobatics", "animal handling", "arcana", "athletics", "deception",
  "history", "insight", "intimidation", "investigation", "medicine",
  "nature", "perception", "performance", "persuasion", "religion",
  "sleight of hand", "stealth", "survival",
].map((s) => ({ value: s, label: capitalize(s) }));

export const ABILITY_OPTIONS = [
  { value: "str", label: "Strength" },
  { value: "dex", label: "Dexterity" },
  { value: "con", label: "Constitution" },
  { value: "int", label: "Intelligence" },
  { value: "wis", label: "Wisdom" },
  { value: "cha", label: "Charisma" },
];

export { deriveSourceOptions } from "@/lib/sourceLabels";

/** Extract skill names from a background's skillProficiencies (including choose.from). */
export function getBackgroundSkills(bg: Background): Set<string> {
  const skills = new Set<string>();
  for (const sp of bg.skillProficiencies ?? []) {
    for (const k of Object.keys(sp)) {
      if (k === "choose") {
        const from = (sp as Record<string, unknown>).choose as { from?: string[] } | undefined;
        from?.from?.forEach((s) => skills.add(s));
      } else {
        skills.add(k);
      }
    }
  }
  return skills;
}

/** Extract ability score codes from the entries list "Ability Scores:" item. */
export function getBackgroundAbilities(bg: Background): Set<string> {
  const abilities = new Set<string>();
  const fullToAbv: Record<string, string> = {
    strength: "str", dexterity: "dex", constitution: "con",
    intelligence: "int", wisdom: "wis", charisma: "cha",
  };
  for (const e of bg.entries ?? []) {
    if (typeof e !== "object" || e.type !== "list" || !e.items) continue;
    for (const item of e.items) {
      if (typeof item === "object" && /Ability Scores/i.test(String(item.name ?? ""))) {
        const entry = typeof item.entry === "string" ? item.entry : "";
        const found = entry.match(/\b(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\b/gi);
        if (found) {
          for (const f of found) {
            const abv = fullToAbv[f.toLowerCase()];
            if (abv) abilities.add(abv);
          }
        }
      }
    }
  }
  return abilities;
}

export function backgroundMatchesFilters(bg: Background, f: BackgroundFilterState): boolean {
  if (!triMatch(f.source, [bg.source])) return false;

  if (!triMatch(f.skill, getBackgroundSkills(bg))) return false;

  if (!triMatch(f.ability, getBackgroundAbilities(bg))) return false;

  return true;
}
