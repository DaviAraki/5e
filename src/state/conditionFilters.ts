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

export function deriveSourceOptions(conditions: Condition[]) {
  const m = new Map<string, number>();
  for (const c of conditions) m.set(c.source, (m.get(c.source) ?? 0) + 1);
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([code]) => ({ value: code, label: sourceLabel(code) }));
}

function sourceLabel(code: string): string {
  const map: Record<string, string> = {
    XPHB: "Player's Handbook",
    XDMG: "Dungeon Master's Guide",
    GrimHollowCG24: "Grim Hollow: Campaign Guide (2024)",
    GrimHollowPG24: "Grim Hollow: Player's Guide (2024)",
    GrimHollowMG24: "Grim Hollow: Monster Grimoire (2024)",
  };
  return map[code] ?? code;
}

export function conditionMatchesFilters(c: Condition, f: ConditionFilterState): boolean {
  if (!triMatch(f.source, [c.source])) return false;
  return true;
}
