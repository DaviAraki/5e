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

export { deriveSourceOptions } from "@/lib/sourceLabels";

export function languageMatchesFilters(l: Language, f: LanguageFilterState): boolean {
  if (!triMatch(f.source, [l.source])) return false;
  if (!triMatch(f.type, l.type ? [l.type] : [])) return false;
  return true;
}
