import { create } from "zustand";
import type { Language } from "@/types/entities";
import {
  type TriState,
  emptyTri,
  triCycle,
  triMatch,
  triSize,
} from "@/state/triStateFilter";

export type FilterDimension = "type" | "source";

interface LanguageFilterState {
  type: TriState;
  source: TriState;
  cycle: (dim: FilterDimension, value: string) => void;
  clearDimension: (dim: FilterDimension) => void;
  clearAll: () => void;
  activeCount: () => number;
}

const DIMENSIONS: FilterDimension[] = ["type", "source"];

export const useLanguageFilters = create<LanguageFilterState>((set, get) => ({
  type: emptyTri(),
  source: emptyTri(),
  cycle: (dim, value) =>
    set((state) => ({ [dim]: triCycle(state[dim], value) }) as Partial<LanguageFilterState>),
  clearDimension: (dim) => set({ [dim]: emptyTri() } as Partial<LanguageFilterState>),
  clearAll: () => set({ type: emptyTri(), source: emptyTri() }),
  activeCount: () => {
    const s = get();
    return DIMENSIONS.reduce((n, d) => n + triSize(s[d]), 0);
  },
}));

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
  if (!triMatch(f.source, [l.source])) return false;
  if (!triMatch(f.type, l.type ? [l.type] : [])) return false;
  return true;
}
