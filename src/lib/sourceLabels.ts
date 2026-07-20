/**
 * Canonical long-form display labels for 5e source codes.
 *
 * Used by the filter sidebars' source dropdowns. Previously every per-category
 * filter store carried its own partial copy of this map, which meant labels
 * drifted (e.g. legendaryGroupFilters knew only 1 source code while
 * bestiaryFilters knew 14). Consolidating here gives every category the full
 * set for free.
 *
 * Note: this is distinct from `spellFormatters.SOURCE_TO_DISPLAY`, which maps
 * to *short* abbreviations (XPHB → "PHB") for compact footer badges. Both maps
 * are intentional — different UI surfaces need different label densities.
 */

/** A labelled filter value, used by every category's pill / select UI. */
export interface FilterOption {
  value: string;
  label: string;
}

export const SOURCE_LABELS: Readonly<Record<string, string>> = {
  // 2024 core books
  XPHB: "Player's Handbook",
  XDMG: "Dungeon Master's Guide",
  XMM: "Monster Manual",
  XSAC: "Sage Advice Compendium",

  // Campaign / setting sources
  EFA: "Eberron: Friends and Foes",
  RHW: "Ravenloft: The Horrors Within",
  FRAiF: "Forge of the Elemental Giants",
  FRHoF: "Forge of the Elemental Giants",
  WttHC: "Welcome to the Hidden City",
  HotB: "Heart of the Beholder",
  LFL: "Legends of the Forgotten Lands",
  NF: "Nightfall",
  ABH: "Ancient Blood & Honor",

  // Grim Hollow (3rd-party)
  GrimHollowCG24: "Grim Hollow: Campaign Guide (2024)",
  GrimHollowPG24: "Grim Hollow: Player's Guide (2024)",
  GrimHollowMG24: "Grim Hollow: Monster Grimoire (2024)",
};

/** Long-form source label, falling back to the raw code if unknown. */
export function sourceLabel(code: string): string {
  return SOURCE_LABELS[code] ?? code;
}

/**
 * Build the source filter's option list from the entities present in a
 * dataset, sorted by frequency desc so the most common sources appear first.
 *
 * Previously copy-pasted verbatim across 14 filter stores; centralized here so
 * the counting + sorting logic lives in exactly one place.
 */
export function deriveSourceOptions<T extends { source: string }>(
  entities: T[],
): FilterOption[] {
  const counts = new Map<string, number>();
  for (const e of entities) counts.set(e.source, (counts.get(e.source) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([code]) => ({ value: code, label: sourceLabel(code) }));
}
