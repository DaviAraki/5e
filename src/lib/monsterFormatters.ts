import type {
  Monster,
  MonsterSize,
  MonsterType,
  MonsterAc,
  MonsterHp,
  MonsterSpeed,
} from "@/types/entities";

/**
 * Pure formatters ported from js/parser.js (Parser.mon* helpers).
 * Convert monster data codes into display strings.
 */

const SIZE_TO_FULL: Record<MonsterSize, string> = {
  T: "Tiny",
  S: "Small",
  M: "Medium",
  L: "Large",
  H: "Huge",
  G: "Gargantuan",
  V: "Varies",
};

export function sizeToFull(sizes: MonsterSize[]): string {
  return sizes.map((s) => SIZE_TO_FULL[s] ?? s).join(" or ");
}

export function typeToFull(type: MonsterType): string {
  if (typeof type === "string") return type;
  let base = type.type;
  if (type.swarm) {
    base = `Swarm of ${SIZE_TO_FULL[type.swarm.size] ?? type.swarm.size} ${base}s`;
  }
  const tags = (type.tags ?? []) as unknown[];
  const tagStr = tags
    .map((t) => {
      if (typeof t === "string") return t;
      const obj = t as { tag: string; prefix?: string };
      const prefix = obj.prefix ? `${obj.prefix} ` : "";
      return `${prefix}${obj.tag}`;
    })
    .join(", ");
  return tagStr ? `${base} (${tagStr})` : base;
}

const ALIGN_TO_FULL: Record<string, string> = {
  A: "Any",
  C: "Chaotic",
  L: "Lawful",
  N: "Neutral",
  G: "Good",
  E: "Evil",
  U: "Unaligned",
  NX: "Neutral",
  NY: "Neutral",
  NZ: "Neutral",
  CE: "Chaotic Evil",
  LE: "Lawful Evil",
  NE: "Neutral Evil",
  CG: "Chaotic Good",
  LG: "Lawful Good",
  NG: "Neutral Good",
  CN: "Chaotic Neutral",
  LN: "Lawful Neutral",
  NN: "True Neutral",
};

export function alignmentToFull(align: string[]): string {
  if (!align || align.length === 0) return "Unaligned";
  // Some entries have notes like "C,E" split, or single codes
  const joined = align.join(" ");
  if (ALIGN_TO_FULL[joined]) return ALIGN_TO_FULL[joined];
  // Try each code
  return align
    .map((a) => ALIGN_TO_FULL[a] ?? capitalize(a))
    .join(" ");
}

export function acToFull(acArray: MonsterAc[]): string {
  return acArray
    .map((ac) => {
      if (typeof ac === "number") return String(ac);
      if ("special" in ac) return ac.special;
      let str = String(ac.ac);
      if (ac.from && ac.from.length) str += ` (${ac.from.join(", ")})`;
      if (ac.condition) str += ` ${ac.condition}`;
      return str;
    })
    .join(", ");
}

export function hpToFull(hp: MonsterHp): string {
  if ("special" in hp) return hp.special;
  return `${hp.average} (${hp.formula})`;
}

export function speedToFull(speed: MonsterSpeed): string {
  const parts: string[] = [];
  const fmt = (val: number | { number: number; condition?: string } | undefined, label: string) => {
    if (val == null) return;
    if (typeof val === "number") {
      parts.push(`${val} ft.${label !== "walk" ? ` ${label}` : ""}`);
    } else {
      const cond = val.condition ? ` ${val.condition}` : "";
      parts.push(`${val.number} ft.${label !== "walk" ? ` ${label}` : ""}${cond}`);
    }
  };
  fmt(speed.walk, "walk");
  fmt(speed.fly, "fly");
  fmt(speed.swim, "swim");
  fmt(speed.burrow, "burrow");
  fmt(speed.climb, "climb");
  if (speed.canHover) parts.push("(hover)");
  return parts.join(", ");
}

export function crToFull(cr: Monster["cr"]): string {
  if (cr == null) return "—";
  if (typeof cr === "string") return formatCrFraction(cr);
  if (typeof cr === "object" && "cr" in cr) return formatCrFraction(String(cr.cr));
  return String(cr);
}

function formatCrFraction(cr: string): string {
  const map: Record<string, string> = {
    "0": "0",
    "1/8": "1/8",
    "1/4": "1/4",
    "1/2": "1/2",
  };
  return map[cr] ?? cr;
}

export function crToXp(cr: Monster["cr"]): string {
  const XP_TABLE: Record<string, number> = {
    "0": 10, "1/8": 25, "1/4": 50, "1/2": 100,
    "1": 200, "2": 450, "3": 700, "4": 1100, "5": 1800,
    "6": 2300, "7": 2900, "8": 3900, "9": 5000, "10": 5900,
    "11": 7200, "12": 8400, "13": 10000, "14": 11500, "15": 13000,
    "16": 15000, "17": 18000, "18": 20000, "19": 22000, "20": 25000,
    "21": 33000, "22": 41000, "23": 50000, "24": 62000, "25": 75000,
    "26": 90000, "27": 105000, "28": 120000, "29": 135000, "30": 155000,
  };
  const crStr = typeof cr === "string" ? cr : typeof cr === "object" && "cr" in cr ? String(cr.cr) : "0";
  const xp = XP_TABLE[crStr] ?? 0;
  return xp.toLocaleString();
}

/** Ability score → modifier string (e.g. 14 → "+2", 8 → "-1"). */
export function abilityMod(score: number): string {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : String(mod);
}

/** Saving throws → "Dex +7, Wis +6". */
export function savesToFull(save: Record<string, string> | undefined): string {
  if (!save) return "";
  return Object.entries(save)
    .map(([k, v]) => `${capitalize(k)} ${v}`)
    .join(", ");
}

export function skillsToFull(skill: Record<string, string> | undefined): string {
  if (!skill) return "";
  return Object.entries(skill)
    .map(([k, v]) => `${capitalize(k)} ${v}`)
    .join(", ");
}

/** Damage type list → "Acid" or "Acid, Fire". */
export function damageListToList(list: string[] | undefined): string {
  if (!list || list.length === 0) return "";
  return list.map(capitalize).join(", ");
}

export function sensesToFull(senses: string[] | undefined, passive: number): string {
  const parts: string[] = [];
  if (senses && senses.length) parts.push(...senses);
  parts.push(`Passive Perception ${passive}`);
  return parts.join(", ");
}

export function languagesToFull(languages: string[] | undefined): string {
  if (!languages || languages.length === 0) return "—";
  return languages.join(", ");
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
