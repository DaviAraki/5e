import { create } from "zustand";
import type { LegendaryGroup } from "@/types/entities";

export type FilterDimension = "source";

interface LegendaryGroupFilterState {
  source: Set<string>;
  toggle: (dim: FilterDimension, value: string) => void;
  clearDimension: (dim: FilterDimension) => void;
  clearAll: () => void;
  activeCount: () => number;
}

const EMPTY = () => new Set<string>();

export const useLegendaryGroupFilters = create<LegendaryGroupFilterState>((set, get) => ({
  source: EMPTY(),
  toggle: (dim, value) =>
    set((state) => {
      const next = new Set(state[dim]);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { [dim]: next } as Partial<LegendaryGroupFilterState>;
    }),
  clearDimension: (dim) => set({ [dim]: EMPTY() } as Partial<LegendaryGroupFilterState>),
  clearAll: () => set({ source: EMPTY() }),
  activeCount: () => (get().source.size > 0 ? 1 : 0),
}));

export function deriveSourceOptions(groups: LegendaryGroup[]) {
  const m = new Map<string, number>();
  for (const g of groups) m.set(g.source, (m.get(g.source) ?? 0) + 1);
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([code]) => ({ value: code, label: sourceLabel(code) }));
}

function sourceLabel(code: string): string {
  const map: Record<string, string> = {
    GrimHollowMG24: "Grim Hollow: Monster Grimoire (2024)",
  };
  return map[code] ?? code;
}

export function legendaryGroupMatchesFilters(g: LegendaryGroup, f: LegendaryGroupFilterState): boolean {
  if (f.source.size > 0 && !f.source.has(g.source)) return false;
  return true;
}
