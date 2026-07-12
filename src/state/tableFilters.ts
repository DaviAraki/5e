import { create } from "zustand";
import type { GameTable } from "@/types/entities";

export type FilterDimension = "source";

interface TableFilterState {
  source: Set<string>;
  toggle: (dim: FilterDimension, value: string) => void;
  clearDimension: (dim: FilterDimension) => void;
  clearAll: () => void;
  activeCount: () => number;
}

const EMPTY = () => new Set<string>();

export const useTableFilters = create<TableFilterState>((set, get) => ({
  source: EMPTY(),
  toggle: (dim, value) =>
    set((state) => {
      const next = new Set(state[dim]);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { [dim]: next } as Partial<TableFilterState>;
    }),
  clearDimension: (dim) => set({ [dim]: EMPTY() } as Partial<TableFilterState>),
  clearAll: () => set({ source: EMPTY() }),
  activeCount: () => (get().source.size > 0 ? 1 : 0),
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
  if (f.source.size > 0 && !f.source.has(t.source)) return false;
  return true;
}
