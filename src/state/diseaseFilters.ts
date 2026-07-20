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

export { deriveSourceOptions } from "@/lib/sourceLabels";

export function diseaseMatchesFilters(d: Disease, f: DiseaseFilterState): boolean {
  if (!triMatch(f.source, [d.source])) return false;
  return true;
}
