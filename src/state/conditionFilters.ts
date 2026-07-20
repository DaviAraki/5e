import { create } from "zustand";
import type { Condition } from "@/types/entities";
import {
  type TriState,
  emptyTri,
  triCycle,
  triMatch,
  triSize,
} from "@/state/triStateFilter";

export type FilterDimension = "source";

interface ConditionFilterState {
  source: TriState;
  cycle: (dim: FilterDimension, value: string) => void;
  clearDimension: (dim: FilterDimension) => void;
  clearAll: () => void;
  activeCount: () => number;
}

export const useConditionFilters = create<ConditionFilterState>((set, get) => ({
  source: emptyTri(),
  cycle: (dim, value) =>
    set((state) => ({ [dim]: triCycle(state[dim], value) }) as Partial<ConditionFilterState>),
  clearDimension: (dim) => set({ [dim]: emptyTri() } as Partial<ConditionFilterState>),
  clearAll: () => set({ source: emptyTri() }),
  activeCount: () => triSize(get().source),
}));

export { deriveSourceOptions } from "@/lib/sourceLabels";

export function conditionMatchesFilters(c: Condition, f: ConditionFilterState): boolean {
  if (!triMatch(f.source, [c.source])) return false;
  return true;
}
