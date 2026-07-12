import { create } from "zustand";
import type { Disease } from "@/types/entities";

export type FilterDimension = "source";

interface DiseaseFilterState {
  source: Set<string>;
  toggle: (dim: FilterDimension, value: string) => void;
  clearDimension: (dim: FilterDimension) => void;
  clearAll: () => void;
  activeCount: () => number;
}

const EMPTY = () => new Set<string>();

export const useDiseaseFilters = create<DiseaseFilterState>((set, get) => ({
  source: EMPTY(),
  toggle: (dim, value) =>
    set((state) => {
      const next = new Set(state[dim]);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { [dim]: next } as Partial<DiseaseFilterState>;
    }),
  clearDimension: (dim) => set({ [dim]: EMPTY() } as Partial<DiseaseFilterState>),
  clearAll: () => set({ source: EMPTY() }),
  activeCount: () => (get().source.size > 0 ? 1 : 0),
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
  if (f.source.size > 0 && !f.source.has(d.source)) return false;
  return true;
}
