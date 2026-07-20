import { create } from "zustand";
import type { OptionalFeature } from "@/types/entities";
import {
  type TriState,
  emptyTri,
  triCycle,
  triMatch,
  triSize,
} from "@/state/triStateFilter";

export type FilterDimension = "featureType" | "source";

interface OptionalFeatureFilterState {
  featureType: TriState;
  source: TriState;
  cycle: (dim: FilterDimension, value: string) => void;
  clearDimension: (dim: FilterDimension) => void;
  clearAll: () => void;
  activeCount: () => number;
}

const DIMENSIONS: FilterDimension[] = ["featureType", "source"];

export const useOptionalFeatureFilters = create<OptionalFeatureFilterState>((set, get) => ({
  featureType: emptyTri(),
  source: emptyTri(),
  cycle: (dim, value) =>
    set((state) => ({ [dim]: triCycle(state[dim], value) }) as Partial<OptionalFeatureFilterState>),
  clearDimension: (dim) => set({ [dim]: emptyTri() } as Partial<OptionalFeatureFilterState>),
  clearAll: () => set({ featureType: emptyTri(), source: emptyTri() }),
  activeCount: () => {
    const s = get();
    return DIMENSIONS.reduce((n, d) => n + triSize(s[d]), 0);
  },
}));

/** Build featureType options dynamically (e.g. AH:TB, MGS, FS). */
export function deriveFeatureTypeOptions(features: OptionalFeature[]) {
  const m = new Map<string, number>();
  for (const f of features) {
    const types = f.featureType ?? [];
    for (const ft of types) m.set(ft, (m.get(ft) ?? 0) + 1);
  }
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([code, count]) => ({ value: code, label: `${code} (${count})` }));
}

export { deriveSourceOptions } from "@/lib/sourceLabels";

export function optionalFeatureMatchesFilters(
  f: OptionalFeature,
  state: OptionalFeatureFilterState,
): boolean {
  if (!triMatch(state.source, [f.source])) return false;
  if (!triMatch(state.featureType, f.featureType ?? [])) return false;
  return true;
}
