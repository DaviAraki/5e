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

export function deriveSourceOptions(tables: GameTable[]) {
  const m = new Map<string, number>();
  for (const t of tables) m.set(t.source, (m.get(t.source) ?? 0) + 1);
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

export function tableMatchesFilters(t: GameTable, f: TableFilterState): boolean {
  if (!triMatch(f.source, [t.source])) return false;
  return true;
}
