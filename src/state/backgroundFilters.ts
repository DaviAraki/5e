import { create } from "zustand";
import type { Background } from "@/types/entities";

/**
 * Background filter state: skill proficiencies + ability scores.
 * Same architecture as spell/bestiary/item filters.
 */

export type FilterDimension = "skill" | "ability" | "source";

interface BackgroundFilterState {
  skill: Set<string>;
  ability: Set<string>;
  source: Set<string>;

  toggle: (dim: FilterDimension, value: string) => void;
  clearDimension: (dim: FilterDimension) => void;
  clearAll: () => void;
  activeCount: () => number;
}

const EMPTY = () => new Set<string>();

export const useBackgroundFilters = create<BackgroundFilterState>((set, get) => ({
  skill: EMPTY(),
  ability: EMPTY(),
  source: EMPTY(),

  toggle: (dim, value) =>
    set((state) => {
      const next = new Set(state[dim]);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { [dim]: next } as Partial<BackgroundFilterState>;
    }),
  clearDimension: (dim) => set({ [dim]: EMPTY() } as Partial<BackgroundFilterState>),
  clearAll: () => set({ skill: EMPTY(), ability: EMPTY(), source: EMPTY() }),
  activeCount: () => {
    const s = get();
    return DIMENSIONS.filter((d) => s[d].size > 0).length;
  },
}));

const DIMENSIONS: FilterDimension[] = ["skill", "ability", "source"];

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

export function deriveSourceOptions(backgrounds: Background[]) {
  const m = new Map<string, number>();
  for (const b of backgrounds) m.set(b.source, (m.get(b.source) ?? 0) + 1);
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
    HotB: "Heart of the Beholder",
    LFL: "Legends of the Forgotten Lands",
    NF: "Nightfall",
    ABH: "Ancient Blood & Honor",
    FRHoF: "Forge of the Elemental Giants",
  };
  return map[code] ?? code;
}

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
  if (f.source.size > 0 && !f.source.has(bg.source)) return false;

  if (f.skill.size > 0) {
    const skills = getBackgroundSkills(bg);
    const hit = [...f.skill].some((s) => skills.has(s));
    if (!hit) return false;
  }

  if (f.ability.size > 0) {
    const abilities = getBackgroundAbilities(bg);
    const hit = [...f.ability].some((a) => abilities.has(a));
    if (!hit) return false;
  }

  return true;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
