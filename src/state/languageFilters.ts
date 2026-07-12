import { create } from "zustand";
import type { Language } from "@/types/entities";

export type FilterDimension = "type" | "source";

interface LanguageFilterState {
  type: Set<string>;
  source: Set<string>;
  toggle: (dim: FilterDimension, value: string) => void;
  clearDimension: (dim: FilterDimension) => void;
  clearAll: () => void;
  activeCount: () => number;
}

const EMPTY = () => new Set<string>();

export const useLanguageFilters = create<LanguageFilterState>((set, get) => ({
  type: EMPTY(),
  source: EMPTY(),
  toggle: (dim, value) =>
    set((state) => {
      const next = new Set(state[dim]);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { [dim]: next } as Partial<LanguageFilterState>;
    }),
  clearDimension: (dim) => set({ [dim]: EMPTY() } as Partial<LanguageFilterState>),
  clearAll: () => set({ type: EMPTY(), source: EMPTY() }),
  activeCount: () => {
    const s = get();
    return DIMENSIONS.filter((d) => s[d].size > 0).length;
  },
}));

const DIMENSIONS: FilterDimension[] = ["type", "source"];

export const TYPE_OPTIONS = [
  { value: "standard", label: "Standard" },
  { value: "exotic", label: "Exotic" },
  { value: "secret", label: "Secret" },
];

export function deriveSourceOptions(languages: Language[]) {
  const m = new Map<string, number>();
  for (const l of languages) m.set(l.source, (m.get(l.source) ?? 0) + 1);
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([code]) => ({ value: code, label: sourceLabel(code) }));
}

function sourceLabel(code: string): string {
  const map: Record<string, string> = {
    XPHB: "Player's Handbook",
    GrimHollowPG24: "Grim Hollow: Player's Guide (2024)",
    GrimHollowMG24: "Grim Hollow: Monster Grimoire (2024)",
  };
  return map[code] ?? code;
}

export function languageMatchesFilters(l: Language, f: LanguageFilterState): boolean {
  if (f.source.size > 0 && !f.source.has(l.source)) return false;
  if (f.type.size > 0) {
    if (!l.type || !f.type.has(l.type)) return false;
  }
  return true;
}
