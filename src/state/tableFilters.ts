import { create } from "zustand";
import type { GameTable } from "@/types/entities";
import {
  type TriState,
  emptyTri,
  triCycle,
  triMatch,
  triSize,
} from "@/state/triStateFilter";

export type FilterDimension = "source";

interface TableFilterState {
  source: TriState;
  cycle: (dim: FilterDimension, value: string) => void;
  clearDimension: (dim: FilterDimension) => void;
  clearAll: () => void;
  activeCount: () => number;
}

export const useTableFilters = create<TableFilterState>((set, get) => ({
  source: emptyTri(),
  cycle: (dim, value) =>
    set((state) => ({ [dim]: triCycle(state[dim], value) }) as Partial<TableFilterState>),
  clearDimension: (dim) => set({ [dim]: emptyTri() } as Partial<TableFilterState>),
  clearAll: () => set({ source: emptyTri() }),
  activeCount: () => triSize(get().source),
}));

export { deriveSourceOptions } from "@/lib/sourceLabels";

export function tableMatchesFilters(t: GameTable, f: TableFilterState): boolean {
  if (!triMatch(f.source, [t.source])) return false;
  return true;
}
