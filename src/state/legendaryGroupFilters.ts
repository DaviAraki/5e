import { create } from "zustand";
import type { LegendaryGroup } from "@/types/entities";
import {
  type TriState,
  emptyTri,
  triCycle,
  triMatch,
  triSize,
} from "@/state/triStateFilter";

export type FilterDimension = "source";

interface LegendaryGroupFilterState {
  source: TriState;
  cycle: (dim: FilterDimension, value: string) => void;
  clearDimension: (dim: FilterDimension) => void;
  clearAll: () => void;
  activeCount: () => number;
}

export const useLegendaryGroupFilters = create<LegendaryGroupFilterState>((set, get) => ({
  source: emptyTri(),
  cycle: (dim, value) =>
    set((state) => ({ [dim]: triCycle(state[dim], value) }) as Partial<LegendaryGroupFilterState>),
  clearDimension: (dim) => set({ [dim]: emptyTri() } as Partial<LegendaryGroupFilterState>),
  clearAll: () => set({ source: emptyTri() }),
  activeCount: () => triSize(get().source),
}));

export { deriveSourceOptions } from "@/lib/sourceLabels";

export function legendaryGroupMatchesFilters(g: LegendaryGroup, f: LegendaryGroupFilterState): boolean {
  if (!triMatch(f.source, [g.source])) return false;
  return true;
}
