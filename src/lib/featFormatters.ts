import type { Feat } from "@/types/entities";

const CATEGORY_TO_FULL: Record<string, string> = {
  G: "General",
  O: "Origin",
  D: "Dragonmark",
  DG: "Dark Gift",
  FS: "Fighting Style",
  "FS:P": "Fighting Style (Paladin)",
  "FS:R": "Fighting Style (Ranger)",
  EB: "Epic Boon",
};

export function categoryToFull(cat: string | undefined): string {
  if (!cat) return "";
  return CATEGORY_TO_FULL[cat] ?? cat;
}

/** Format the ability array: [{str:1}] → "Strength +1", [{choose:{from:["str","dex"]}}] → "+1 Str or Dex". */
export function abilityToFull(ability: Feat["ability"]): string {
  if (!ability || ability.length === 0) return "";
  const parts: string[] = [];
  for (const entry of ability) {
    if (entry.hidden) continue; // Skip hidden ASI (like Ability Score Improvement)
    const keys = Object.keys(entry).filter((k) => k !== "hidden" && k !== "max");
    for (const k of keys) {
      if (k === "choose") {
        const choose = entry[k] as { from?: string[]; amount?: number; count?: number };
        const from = choose.from ?? [];
        const amount = choose.amount ?? 1;
        const label = from.map((a) => capitalize(a.slice(0, 3))).join(" or ");
        const count = choose.count ?? 1;
        parts.push(`+${amount * count} ${label}`);
      } else if (typeof entry[k] === "number") {
        parts.push(`${capitalize(k.slice(0, 3))} +${entry[k] as number}`);
      }
    }
  }
  return parts.join(", ");
}

export function prerequisiteToFull(prereq: Feat["prerequisite"]): string {
  if (!prereq || prereq.length === 0) return "";
  const groups: string[] = [];
  for (const group of prereq) {
    const parts: string[] = [];
    if (group.level) parts.push(`Level ${group.level}+`);
    if (group.ability) {
      const abs = group.ability as Record<string, number>[];
      for (const ab of abs) {
        for (const [k, v] of Object.entries(ab)) {
          parts.push(`${capitalize(k.slice(0, 3))} ${v}+`);
        }
      }
    }
    if (group.campaign) parts.push(`Campaign: ${(group.campaign as string[]).join(", ")}`);
    if (group.spellcasting) parts.push("Spellcasting");
    if (group.proficiency) parts.push("Proficiency required");
    if (parts.length) groups.push(parts.join(", "));
  }
  return groups.join(" or ");
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
