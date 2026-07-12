import { create } from "zustand";
import type { Deity } from "@/types/entities";

export type FilterDimension = "pantheon" | "source";

interface DeityFilterState {
  pantheon: Set<string>;
  source: Set<string>;
  toggle: (dim: FilterDimension, value: string) => void;
  clearDimension: (dim: FilterDimension) => void;
  clearAll: () => void;
  activeCount: () => number;
}

const EMPTY = () => new Set<string>();

export const useDeityFilters = create<DeityFilterState>((set, get) => ({
  pantheon: EMPTY(),
  source: EMPTY(),
  toggle: (dim, value) =>
    set((state) => {
      const next = new Set(state[dim]);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { [dim]: next } as Partial<DeityFilterState>;
    }),
  clearDimension: (dim) => set({ [dim]: EMPTY() } as Partial<DeityFilterState>),
  clearAll: () => set({ pantheon: EMPTY(), source: EMPTY() }),
  activeCount: () => {
    const s = get();
    return DIMENSIONS.filter((d) => s[d].size > 0).length;
  },
}));

const DIMENSIONS: FilterDimension[] = ["pantheon", "source"];

/** Build pantheon options dynamically from the loaded deities. */
export function derivePantheonOptions(deities: Deity[]) {
  const m = new Map<string, number>();
  for (const d of deities) {
    if (!d.pantheon) continue;
    m.set(d.pantheon, (m.get(d.pantheon) ?? 0) + 1);
  }
  return [...m.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([code, count]) => ({ value: code, label: `${code} (${count})` }));
}

export function deriveSourceOptions(deities: Deity[]) {
  const m = new Map<string, number>();
  for (const d of deities) m.set(d.source, (m.get(d.source) ?? 0) + 1);
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([code]) => ({ value: code, label: sourceLabel(code) }));
}

function sourceLabel(code: string): string {
  const map: Record<string, string> = {
    GrimHollowCG24: "Grim Hollow: Campaign Guide (2024)",
  };
  return map[code] ?? code;
}

export function deityMatchesFilters(d: Deity, f: DeityFilterState): boolean {
  if (f.source.size > 0 && !f.source.has(d.source)) return false;
  if (f.pantheon.size > 0) {
    if (!d.pantheon || !f.pantheon.has(d.pantheon)) return false;
  }
  return true;
}
