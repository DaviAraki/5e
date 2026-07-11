import type { Item } from "@/types/entities";

/**
 * Pure formatters for item display.
 * Type codes → human labels, rarity formatting, value conversion, etc.
 */

/** Item type codes → category labels. The code may have a `|source` suffix. */
const TYPE_TO_FULL: Record<string, string> = {
  // Weapons
  M: "Melee Weapon",
  R: "Ranged Weapon",
  A: "Ammunition",
  // Armor
  LA: "Light Armor",
  MA: "Medium Armor",
  HA: "Heavy Armor",
  S: "Shield",
  // Gear
  G: "Adventuring Gear",
  P: "Potion",
  SCF: "Spellcasting Focus",
  W: "Wondrous Item",
  WD: "Wand",
  RD: "Rod",
  STK: "Staff",
  RG: "Ring",
  SCN: "Scroll",
  INS: "Instrument",
  T: "Tool",
  TG: "Trade Good",
  MNT: "Mount",
  TAH: "Tack and Harness",
  FD: "Food and Drink",
  AT: "Artisan Tool",
  EXP: "Explosive",
  VEH: "Vehicle",
  SHP: "Ship",
  AIR: "Air Vehicle",
  GV: "Generic Variant",
  GS: "Gaming Set",
  AF: "Furniture",
  TB: "Trade Barrier",
  OTH: "Other",
  None: "—",
  $: "Treasure",
};

export function typeToFull(type: string | undefined): string {
  if (!type) return "";
  const code = type.split("|")[0] ?? type;
  // Strip leading $ (treasure prefix)
  const clean = code.startsWith("$") ? code.slice(1) : code;
  return TYPE_TO_FULL[clean] ?? TYPE_TO_FULL[code] ?? code;
}

export function rarityToFull(rarity: string | undefined): string {
  if (!rarity || rarity === "none") return "";
  if (rarity === "unknown (magic)") return "Magic Item";
  return capitalize(rarity);
}

/** Convert copper-piece value to gold/silver/copper display. */
export function valueToFull(cp: number | undefined): string {
  if (cp == null) return "";
  if (cp === 0) return "";
  const gp = cp / 100;
  if (gp >= 1) {
    return gp % 1 === 0 ? `${gp} gp` : `${cp} cp`;
  }
  const sp = cp / 10;
  if (sp >= 1) return `${sp} sp`;
  return `${cp} cp`;
}

export function weightToFull(w: number | undefined): string {
  if (w == null) return "";
  return `${w} lb${w !== 1 ? "s" : ""}`;
}

export function attunementToFull(reqAttune: Item["reqAttune"]): string {
  if (reqAttune === true) return "Requires Attunement";
  if (typeof reqAttune === "string") return `Attunement (${reqAttune})`;
  return "";
}

export function damageToFull(dmg1?: string, dmg2?: string, dmgType?: string): string {
  if (!dmg1) return "";
  const typeFull = dmgTypeToFull(dmgType);
  let str = `${dmg1} ${typeFull}`;
  if (dmg2) str += ` (versatile ${dmg2} ${typeFull})`;
  return str;
}

const DMG_TYPE_MAP: Record<string, string> = {
  S: "Slashing",
  B: "Bludgeoning",
  P: "Piercing",
  N: "Necrotic",
  R: "Radiant",
};

function dmgTypeToFull(code?: string): string {
  if (!code) return "";
  return DMG_TYPE_MAP[code] ?? capitalize(code);
}

/** Build the subtitle line: "Armor (medium), very rare (requires attunement)". */
export function itemSubtitle(item: Item): string {
  const parts: string[] = [];
  const typeLabel = typeToFull(item.type);
  const isWeapon = item.weaponCategory || /Weapon/.test(typeLabel);
  const isArmor = /Armor|Shield/.test(typeLabel);

  if (item.wondrous) parts.push("Wondrous Item");
  else if (item.staff) parts.push("Staff");
  else if (item.poison) parts.push("Poison");
  else if (isWeapon) {
    if (item.weaponCategory) parts.push(capitalize(item.weaponCategory) + " Weapon");
    else parts.push(typeLabel);
  } else if (isArmor) {
    parts.push(typeLabel);
  } else if (typeLabel) {
    parts.push(typeLabel);
  }

  const rarity = rarityToFull(item.rarity);
  if (rarity) parts.push(rarity);

  const attune = attunementToFull(item.reqAttune);
  if (attune) parts.push(`(${attune})`);

  return parts.filter(Boolean).join(", ");
}

/** Format the property array (V=versatile, H=heavy, 2H=two-handed, etc.). */
export function propertiesToFull(props: string[] | undefined): string {
  if (!props || props.length === 0) return "";
  const map: Record<string, string> = {
    V: "Versatile",
    H: "Heavy",
    "2H": "Two-Handed",
    F: "Finesse",
    L: "Light",
    R: "Reach",
    T: "Thrown",
    A: "Ammunition",
    S: "Special",
    "LR": "Light Range",
    RL: "Reload",
  };
  return props
    .map((p) => map[p.split("|")[0] ?? p] ?? p)
    .join(", ");
}

/** Item type codes that are inherently consumable (potions, scrolls, etc.). */
const CONSUMABLE_TYPE_CODES = new Set(["P", "SC", "EXP", "FD"]);

/**
 * Whether an item is a consumable. The dataset tags consumables explicitly via
 * `miscTags: ["CNS"]` (136 items — all potions, scrolls, explosives, food);
 * the type-code fallback covers any item missing the tag.
 */
export function isConsumable(item: Item): boolean {
  if (item.miscTags?.includes("CNS")) return true;
  const code = (item.type ?? "").split("|")[0] ?? "";
  return CONSUMABLE_TYPE_CODES.has(code.replace(/^\$/, ""));
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
