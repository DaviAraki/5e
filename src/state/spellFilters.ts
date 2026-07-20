import { create } from "zustand";
import type { Spell } from "@/types/entities";
import {
  spSchoolToFull,
  isConcentration,
  isRitual,
} from "@/lib/spellFormatters";
import { capitalize } from "@/lib/text";
import { type FilterOption } from "@/lib/sourceLabels";
import {
  type TriState,
  emptyTri,
  triCycle,
  triIsEmpty,
  triMatch,
  triSize,
} from "@/state/triStateFilter";

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
// FilterOption is re-exported from lib/sourceLabels for backwards compat
// (PillFilter imports it from here). New code should import it directly.

export type { FilterOption } from "@/lib/sourceLabels";

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
  source: TriState;
  level: TriState;
  school: TriState;
  class: TriState;
  castTime: TriState;
  duration: TriState;
  range: TriState;
  damageType: TriState;
  save: TriState;
  condition: TriState;
  /** AND-flag dimension: stays 2-state (no exclude). */
  misc: Set<string>;

  /** Cycle a value in a tri-state dimension. */
  cycle: (dim: TriDimension, value: string) => void;
  /** Toggle a value in the 2-state misc dimension. */
  toggleMisc: (value: string) => void;
  /** Clear one dimension. */
  clearDimension: (dim: FilterDimension) => void;
  /** Clear everything. */
  clearAll: () => void;
  /** Count of active values across all dimensions. */
  activeCount: () => number;
}

/** Dimensions that use tri-state (include/exclude) semantics. */
export type TriDimension =
  | "source"
  | "level"
  | "school"
  | "class"
  | "castTime"
  | "duration"
  | "range"
  | "damageType"
  | "save"
  | "condition";

/** All dimensions, including the 2-state misc. */
export type FilterDimension = TriDimension | "misc";

const TRI_DIMENSIONS: TriDimension[] = [
  "source", "level", "school", "class", "castTime",
  "duration", "range", "damageType", "save", "condition",
];

export const useSpellFilters = create<SpellFilterState>((set, get) => ({
  source: emptyTri(),
  level: emptyTri(),
  school: emptyTri(),
  class: emptyTri(),
  castTime: emptyTri(),
  duration: emptyTri(),
  range: emptyTri(),
  damageType: emptyTri(),
  save: emptyTri(),
  condition: emptyTri(),
  misc: new Set<string>(),

  cycle: (dim, value) =>
    set((state) => ({ [dim]: triCycle(state[dim], value) }) as Partial<SpellFilterState>),
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
        : ({ [dim]: emptyTri() } as Partial<SpellFilterState>),
    ),
  clearAll: () =>
    set({
      source: emptyTri(),
      level: emptyTri(),
      school: emptyTri(),
      class: emptyTri(),
      castTime: emptyTri(),
      duration: emptyTri(),
      range: emptyTri(),
      damageType: emptyTri(),
      save: emptyTri(),
      condition: emptyTri(),
      misc: new Set<string>(),
    }),
  activeCount: () => {
    const s = get();
    return TRI_DIMENSIONS.reduce((n, d) => n + triSize(s[d]), 0) + s.misc.size;
  },
}));

// --- Matching predicate ---------------------------------------------------
// deriveSourceOptions is shared across all filter stores; re-export it so
// SpellFilterSidebar's existing import keeps working.

export { deriveSourceOptions } from "@/lib/sourceLabels";

/** Does a spell pass every active filter dimension? */
export function spellMatchesFilters(spell: Spell, f: SpellFilterState): boolean {
  if (!triMatch(f.source, [spell.source])) return false;

  if (!triMatch(f.level, [String(spell.level)])) return false;

  if (!triMatch(f.school, [spell.school])) return false;

  if (!triIsEmpty(f.castTime)) {
    const unit = normalizeTimeUnit(spell.time[0]?.unit);
    if (!unit || !triMatch(f.castTime, [unit])) return false;
  }

  if (!triIsEmpty(f.class)) {
    const classes = [
      ...(spell.classes?.fromClassList ?? []).map((c) => c.name),
      ...(spell.classes?.fromClassListVariant ?? []).map((c) => c.name),
      ...(spell.classes?.fromSubclass ?? []).map((sc) => sc.class.name),
    ];
    if (!triMatch(f.class, classes)) return false;
  }

  if (!triIsEmpty(f.duration)) {
    if (!triMatch(f.duration, durationTags(spell))) return false;
  }

  if (!triIsEmpty(f.range)) {
    const tag = rangeTag(spell);
    if (!tag || !triMatch(f.range, [tag])) return false;
  }

  if (!triIsEmpty(f.damageType)) {
    if (!triMatch(f.damageType, spell.damageInflict ?? [])) return false;
  }

  if (!triIsEmpty(f.save)) {
    if (!triMatch(f.save, spell.savingThrow ?? [])) return false;
  }

  if (!triIsEmpty(f.condition)) {
    if (!triMatch(f.condition, spell.conditionInflict ?? [])) return false;
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

// capitalize is imported from @/lib/text.
