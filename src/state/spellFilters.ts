import { create } from "zustand";
import type { Spell } from "@/types/entities";
import {
  spSchoolToFull,
  isConcentration,
  isRitual,
} from "@/lib/spellFormatters";

/**
 * Spell filter state and the pure predicate that applies it.
 *
 * Each filter dimension stores a Set of selected values. Empty set = "no
 * filter" (show all). The matches() function AND-combines dimensions.
 *
 * The option lists are derived from the data at runtime (see deriveOptions),
 * so the store stays data-agnostic.
 */

// --- Option metadata (value -> display label) -----------------------------

export interface FilterOption {
  value: string;
  label: string;
}

export const LEVEL_OPTIONS: FilterOption[] = [
  { value: "0", label: "Cantrip" },
  { value: "1", label: "1st" },
  { value: "2", label: "2nd" },
  { value: "3", label: "3rd" },
  { value: "4", label: "4th" },
  { value: "5", label: "5th" },
  { value: "6", label: "6th" },
  { value: "7", label: "7th" },
  { value: "8", label: "8th" },
  { value: "9", label: "9th" },
];

export const SCHOOL_OPTIONS: FilterOption[] = [
  "A", "V", "N", "T", "C", "D", "I", "E",
].map((s) => ({ value: s, label: spSchoolToFull(s as Spell["school"]) }));

export const CLASS_OPTIONS: FilterOption[] = [
  "Artificer", "Bard", "Cleric", "Druid", "Paladin",
  "Ranger", "Sorcerer", "Warlock", "Wizard",
].map((c) => ({ value: c, label: c }));

export const CAST_TIME_OPTIONS: FilterOption[] = [
  { value: "action", label: "1 Action" },
  { value: "bonus", label: "Bonus Action" },
  { value: "reaction", label: "Reaction" },
  { value: "minute", label: "Minute" },
  { value: "hour", label: "Hour" },
];

export const DURATION_OPTIONS: FilterOption[] = [
  { value: "instant", label: "Instantaneous" },
  { value: "timed-short", label: "≤ 1 Minute" },
  { value: "timed-medium", label: "1 Min – 1 Hour" },
  { value: "timed-long", label: "≥ 1 Hour" },
  { value: "concentration", label: "Concentration" },
  { value: "permanent", label: "Permanent" },
  { value: "special", label: "Special" },
];

export const RANGE_OPTIONS: FilterOption[] = [
  { value: "self", label: "Self" },
  { value: "touch", label: "Touch" },
  { value: "point", label: "Ranged" },
  { value: "area", label: "Self (Area)" },
  { value: "special", label: "Special" },
];

export const DAMAGE_TYPE_OPTIONS: FilterOption[] = [
  "acid", "fire", "cold", "lightning", "poison", "necrotic",
  "radiant", "force", "psychic", "thunder",
  "bludgeoning", "piercing", "slashing",
].map((d) => ({ value: d, label: capitalize(d) }));

export const SAVE_OPTIONS: FilterOption[] = [
  "strength", "dexterity", "constitution",
  "intelligence", "wisdom", "charisma",
].map((s) => ({ value: s, label: capitalize(s) }));

export const CONDITION_OPTIONS: FilterOption[] = [
  "blinded", "charmed", "deafened", "frightened", "grappled",
  "incapacitated", "invisible", "paralyzed", "petrified", "poisoned",
  "prone", "restrained", "stunned", "unconscious",
].map((c) => ({ value: c, label: capitalize(c) }));

export const MISC_OPTIONS: FilterOption[] = [
  { value: "concentration", label: "Concentration" },
  { value: "ritual", label: "Ritual" },
  { value: "v", label: "Verbal" },
  { value: "s", label: "Somatic" },
  { value: "m", label: "Material" },
];

// --- Store shape ----------------------------------------------------------

interface SpellFilterState {
  source: Set<string>;
  level: Set<string>;
  school: Set<string>;
  class: Set<string>;
  castTime: Set<string>;
  duration: Set<string>;
  range: Set<string>;
  damageType: Set<string>;
  save: Set<string>;
  condition: Set<string>;
  misc: Set<string>;

  /** Toggle a value in the named dimension's set. */
  toggle: (dim: FilterDimension, value: string) => void;
  /** Clear one dimension. */
  clearDimension: (dim: FilterDimension) => void;
  /** Clear everything. */
  clearAll: () => void;
  /** Count of active (non-empty) dimensions. */
  activeCount: () => number;
}

export type FilterDimension =
  | "source"
  | "level"
  | "school"
  | "class"
  | "castTime"
  | "duration"
  | "range"
  | "damageType"
  | "save"
  | "condition"
  | "misc";

const EMPTY = () => new Set<string>();

export const useSpellFilters = create<SpellFilterState>((set, get) => ({
  source: EMPTY(),
  level: EMPTY(),
  school: EMPTY(),
  class: EMPTY(),
  castTime: EMPTY(),
  duration: EMPTY(),
  range: EMPTY(),
  damageType: EMPTY(),
  save: EMPTY(),
  condition: EMPTY(),
  misc: EMPTY(),

  toggle: (dim, value) =>
    set((state) => {
      const next = new Set(state[dim]);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { [dim]: next } as Partial<SpellFilterState>;
    }),
  clearDimension: (dim) => set({ [dim]: EMPTY() } as Partial<SpellFilterState>),
  clearAll: () =>
    set({
      source: EMPTY(),
      level: EMPTY(),
      school: EMPTY(),
      class: EMPTY(),
      castTime: EMPTY(),
      duration: EMPTY(),
      range: EMPTY(),
      damageType: EMPTY(),
      save: EMPTY(),
      condition: EMPTY(),
      misc: EMPTY(),
    }),
  activeCount: () => {
    const s = get();
    return DIMENSIONS.filter((d) => s[d].size > 0).length;
  },
}));

const DIMENSIONS: FilterDimension[] = [
  "source", "level", "school", "class", "castTime",
  "duration", "range", "damageType", "save", "condition", "misc",
];

// --- Matching predicate ---------------------------------------------------

/** Derive the source options from loaded spells (value=code, label=display). */
export function deriveSourceOptions(spells: Spell[]): FilterOption[] {
  const m = new Map<string, number>();
  for (const s of spells) m.set(s.source, (m.get(s.source) ?? 0) + 1);
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([code]) => ({ value: code, label: sourceLabel(code) }));
}

function sourceLabel(code: string): string {
  const m: Record<string, string> = {
    XPHB: "Player's Handbook",
    FRHoF: "Forge of the Elemental Giants",
    EFA: "Eberron: Friends and Foes",
    GrimHollowPG24: "Grim Hollow: Player's Guide (2024)",
  };
  return m[code] ?? code;
}

/** Does a spell pass every active filter dimension? */
export function spellMatchesFilters(spell: Spell, f: SpellFilterState): boolean {
  if (f.source.size > 0 && !f.source.has(spell.source)) return false;

  if (f.level.size > 0 && !f.level.has(String(spell.level))) return false;

  if (f.school.size > 0 && !f.school.has(spell.school)) return false;

  if (f.castTime.size > 0) {
    const unit = normalizeTimeUnit(spell.time[0]?.unit);
    if (!unit || !f.castTime.has(unit)) return false;
  }

  if (f.class.size > 0) {
    const classes = new Set<string>([
      ...(spell.classes?.fromClassList ?? []).map((c) => c.name),
      ...(spell.classes?.fromClassListVariant ?? []).map((c) => c.name),
      ...(spell.classes?.fromSubclass ?? []).map((sc) => sc.class.name),
    ]);
    const hit = [...f.class].some((c) => classes.has(c));
    if (!hit) return false;
  }

  if (f.duration.size > 0) {
    const tags = durationTags(spell);
    const hit = [...f.duration].some((d) => tags.has(d));
    if (!hit) return false;
  }

  if (f.range.size > 0) {
    const tag = rangeTag(spell);
    if (!tag || !f.range.has(tag)) return false;
  }

  if (f.damageType.size > 0) {
    const hits = (spell.damageInflict ?? []).some((d) => f.damageType.has(d));
    if (!hits) return false;
  }

  if (f.save.size > 0) {
    const hits = (spell.savingThrow ?? []).some((s) => f.save.has(s));
    if (!hits) return false;
  }

  if (f.condition.size > 0) {
    const hits = (spell.conditionInflict ?? []).some((c) => f.condition.has(c));
    if (!hits) return false;
  }

  if (f.misc.size > 0) {
    const hit = [...f.misc].every((m) => miscMatches(spell, m));
    if (!hit) return false;
  }

  return true;
}

function normalizeTimeUnit(u: string | undefined): string | null {
  if (!u) return null;
  if (u === "bonus action") return "bonus";
  return u;
}

function durationTags(spell: Spell): Set<string> {
  const tags = new Set<string>();
  for (const d of spell.duration) {
    tags.add(d.type);
    if (d.type === "timed") {
      const amt = d.duration.amount;
      const unit = d.duration.type;
      if (unit === "round" || unit === "minute" && amt <= 1) tags.add("timed-short");
      else if (unit === "minute" && amt > 1 || unit === "hour" && amt < 1) tags.add("timed-medium");

      if (unit === "minute") {
        if (amt <= 1) tags.add("timed-short");
        else tags.add("timed-medium");
      } else if (unit === "hour" || unit === "day") {
        tags.add("timed-long");
      }
    }
    if ("concentration" in d && d.concentration) tags.add("concentration");
  }
  if (isConcentration(spell)) tags.add("concentration");
  return tags;
}

function rangeTag(spell: Spell): string | null {
  const r = spell.range;
  if (r.type === "special") return "special";
  if (r.type === "point") {
    if (r.distance.type === "self") return "self";
    if (r.distance.type === "touch") return "touch";
    return "point";
  }
  // cone/cube/line/sphere/cylinder/radius/emanation → area around self
  return "area";
}

function miscMatches(spell: Spell, key: string): boolean {
  switch (key) {
    case "concentration":
      return isConcentration(spell);
    case "ritual":
      return isRitual(spell);
    case "v":
      return Boolean(spell.components?.v);
    case "s":
      return Boolean(spell.components?.s);
    case "m":
      return Boolean(spell.components?.m);
    default:
      return false;
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
