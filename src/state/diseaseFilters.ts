import { create } from "zustand";
import type { Disease } from "@/types/entities";
import {
  type TriState,
  emptyTri,
  triCycle,
  triMatch,
  triSize,
} from "@/state/triStateFilter";

export type FilterDimension = "source";

interface DiseaseFilterState {
  source: TriState;
  cycle: (dim: FilterDimension, value: string) => void;
  clearDimension: (dim: FilterDimension) => void;
  clearAll: () => void;
  activeCount: () => number;
}

export const useDiseaseFilters = create<DiseaseFilterState>((set, get) => ({
  source: emptyTri(),
  cycle: (dim, value) =>
    set((state) => ({ [dim]: triCycle(state[dim], value) }) as Partial<DiseaseFilterState>),
  clearDimension: (dim) => set({ [dim]: emptyTri() } as Partial<DiseaseFilterState>),
  clearAll: () => set({ source: emptyTri() }),
  activeCount: () => triSize(get().source),
}));

export function deriveSourceOptions(diseases: Disease[]) {
  const m = new Map<string, number>();
  for (const d of diseases) m.set(d.source, (m.get(d.source) ?? 0) + 1);
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([code]) => ({ value: code, label: sourceLabel(code) }));
}

function sourceLabel(code: string): string {
  const map: Record<string, string> = {
    GrimHollowCG24: "Grim Hollow: Campaign Guide (2024)",
    GrimHollowMG24: "Grim Hollow: Monster Grimoire (2024)",
  };
  return map[code] ?? code;
}

export function diseaseMatchesFilters(d: Disease, f: DiseaseFilterState): boolean {
  if (!triMatch(f.source, [d.source])) return false;
  return true;
}
