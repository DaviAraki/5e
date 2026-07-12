import { create } from "zustand";
import type { Deity } from "@/types/entities";
import {
  type TriState,
  emptyTri,
  triCycle,
  triMatch,
  triSize,
} from "@/state/triStateFilter";

export type FilterDimension = "pantheon" | "source";

interface DeityFilterState {
  pantheon: TriState;
  source: TriState;
  cycle: (dim: FilterDimension, value: string) => void;
  clearDimension: (dim: FilterDimension) => void;
  clearAll: () => void;
  activeCount: () => number;
}

const DIMENSIONS: FilterDimension[] = ["pantheon", "source"];

export const useDeityFilters = create<DeityFilterState>((set, get) => ({
  pantheon: emptyTri(),
  source: emptyTri(),
  cycle: (dim, value) =>
    set((state) => ({ [dim]: triCycle(state[dim], value) }) as Partial<DeityFilterState>),
  clearDimension: (dim) => set({ [dim]: emptyTri() } as Partial<DeityFilterState>),
  clearAll: () => set({ pantheon: emptyTri(), source: emptyTri() }),
  activeCount: () => {
    const s = get();
    return DIMENSIONS.reduce((n, d) => n + triSize(s[d]), 0);
  },
}));

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
  if (!triMatch(f.source, [d.source])) return false;
  if (!triMatch(f.pantheon, d.pantheon ? [d.pantheon] : [])) return false;
  return true;
}
