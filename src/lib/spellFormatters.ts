import type {
  Spell,
  SpellSchool,
  SpellRange,
  SpellTime,
  SpellComponents,
  SpellDuration,
  SpellClasses,
} from "@/types/entities";

/**
 * Pure formatters ported from js/parser.js (Parser.sp* helpers).
 * These produce the display strings shown on the spells page / stat block.
 * Keep these pure: input data in, display string out.
 */

const SCHOOL_TO_FULL: Record<SpellSchool, string> = {
  A: "Abjuration",
  V: "Evocation",
  N: "Necromancy",
  T: "Transmutation",
  C: "Conjuration",
  D: "Divination",
  I: "Illusion",
  E: "Enchantment",
  P: "Psionics",
};

const SCHOOL_TO_ABV: Record<SpellSchool, string> = {
  A: "A",
  V: "V",
  N: "N",
  T: "T",
  C: "C",
  D: "D",
  I: "I",
  E: "E",
  P: "P",
};

export function spSchoolToFull(school: SpellSchool): string {
  return SCHOOL_TO_FULL[school] ?? school;
}

export function spSchoolToAbv(school: SpellSchool): string {
  return SCHOOL_TO_ABV[school] ?? school;
}

/** "Evocation" — used in card/list labels. */
export function spSchoolLabel(spell: Pick<Spell, "school">): string {
  return spSchoolToFull(spell.school);
}

/** "3rd-level evocation" — the stat-block first line fragment. */
export function spLevelSchoolStr(spell: Pick<Spell, "level" | "school">): string {
  const school = spSchoolToFull(spell.school).toLowerCase();
  if (spell.level === 0) return `${school} cantrip`;
  return `${ordinal(spell.level)}-level ${school}`;
}

/** "3rd-level evocation (ritual)" — with ritual marker if present. */
export function spLevelSchoolRitualStr(spell: Spell): string {
  const base = spLevelSchoolStr(spell);
  return spell.meta?.ritual ? `${base} (ritual)` : base;
}

const ORDINAL_WORDS = [
  "zeroth",
  "1st",
  "2nd",
  "3rd",
  "4th",
  "5th",
  "6th",
  "7th",
  "8th",
  "9th",
];

export function ordinal(n: number): string {
  return ORDINAL_WORDS[n] ?? `${n}th`;
}

/** "1 action" / "1 bonus action" / "1 reaction (when...)" */
export function spTimeToFull(time: SpellTime): string {
  const unitDisplay: Record<SpellTime["unit"], string> = {
    action: "action",
    bonus: "bonus action",
    "bonus action": "bonus action",
    reaction: "reaction",
    minute: "minute",
    hour: "hour",
    round: "round",
  };
  const unit = unitDisplay[time.unit] ?? time.unit;
  const plural = time.number > 1 ? "s" : "";
  const base = `${time.number} ${unit}${plural}`;
  return time.condition ? `${base} (${time.condition})` : base;
}

export function spTimeToShort(time: SpellTime): string {
  const unitAbv: Record<SpellTime["unit"], string> = {
    action: "A",
    bonus: "BA",
    "bonus action": "BA",
    reaction: "R",
    minute: "Min",
    hour: "Hr",
    round: "Rnd",
  };
  return `${time.number} ${unitAbv[time.unit] ?? time.unit}`;
}

/** Range → "150 feet" / "Self" / "Touch" / "Self (10-foot radius)" / "Special" */
export function spRangeToFull(range: SpellRange): string {
  switch (range.type) {
    case "point": {
      const d = range.distance;
      switch (d.type) {
        case "touch":
          return "Touch";
        case "self":
          return "Self";
        case "special":
          return "Special";
        case "feet":
          return `${d.amount} feet`;
        case "mile":
          return `${d.amount} mile${(d.amount ?? 0) > 1 ? "s" : ""}`;
        default:
          return "Special";
      }
    }
    case "cone":
    case "cube":
    case "line":
    case "sphere":
    case "cylinder":
    case "radius":
    case "emanation": {
      const shape = range.type;
      const amount = range.distance.amount;
      return `Self (${amount}-foot ${shape})`;
    }
    case "special":
      return "Special";
    default:
      return "Special";
  }
}

/** Components → "V, S, M (a ball of bat guano and sulfur)" */
export function spComponentsToFull(c: SpellComponents | undefined): string {
  if (!c) return "";
  const parts: string[] = [];
  if (c.v) parts.push("V");
  if (c.s) parts.push("S");
  if (c.m) parts.push(`M (${c.m})`);
  return parts.join(", ");
}

/** Duration → "Instantaneous" / "1 minute" / "Concentration, up to 1 hour" / "Special" */
export function spDurationToFull(d: SpellDuration): string {
  switch (d.type) {
    case "instant":
      return "Instantaneous";
    case "timed": {
      const { type, amount, upTo } = d.duration;
      const plural = amount > 1 ? "s" : "";
      const prefix = upTo ? "up to " : "";
      const dur = `${prefix}${amount} ${type}${plural}`;
      return d.concentration ? `Concentration, ${dur}` : dur;
    }
    case "permanent":
      return "Permanent";
    case "special":
      return "Special";
    default:
      return "Special";
  }
}

/** Extract the primary class names for display: "Sorcerer, Wizard" */
export function spClassesToFull(classes: SpellClasses | undefined): string {
  if (!classes) return "";
  const names = new Set<string>();
  classes.fromClassList?.forEach((c) => names.add(c.name));
  classes.fromClassListVariant?.forEach((c) => names.add(c.name));
  // Subclass-only spells still belong to the parent class
  classes.fromSubclass?.forEach((sc) => names.add(sc.class.name));
  return [...names].sort().join(", ");
}

/** Source code → display abbreviation. XPHB → "PHB" for 2024 sources. */
const SOURCE_TO_DISPLAY: Record<string, string> = {
  XPHB: "PHB",
  XDMG: "DMG",
  XMM: "MM",
  XSAC: "SAC",
  EFA: "EFA",
  FRHoF: "FRHoF",
  GrimHollowCG24: "GH:CG'24",
  GrimHollowPG24: "GH:PG'24",
  GrimHollowMG24: "GH:MG'24",
};

export function sourceToAbv(source: string): string {
  return SOURCE_TO_DISPLAY[source] ?? source;
}

/** "C" concentration marker for list views. */
export function isConcentration(spell: Spell): boolean {
  return spell.duration.some((d) => "concentration" in d && d.concentration);
}

export function isRitual(spell: Spell): boolean {
  return Boolean(spell.meta?.ritual);
}
