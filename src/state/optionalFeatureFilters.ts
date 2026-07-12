import { create } from "zustand";
import type { OptionalFeature } from "@/types/entities";

export type FilterDimension = "featureType" | "source";

interface OptionalFeatureFilterState {
  featureType: Set<string>;
  source: Set<string>;
  toggle: (dim: FilterDimension, value: string) => void;
  clearDimension: (dim: FilterDimension) => void;
  clearAll: () => void;
  activeCount: () => number;
}

const EMPTY = () => new Set<string>();

export const useOptionalFeatureFilters = create<OptionalFeatureFilterState>((set, get) => ({
  featureType: EMPTY(),
  source: EMPTY(),
  toggle: (dim, value) =>
    set((state) => {
      const next = new Set(state[dim]);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { [dim]: next } as Partial<OptionalFeatureFilterState>;
    }),
  clearDimension: (dim) => set({ [dim]: EMPTY() } as Partial<OptionalFeatureFilterState>),
  clearAll: () => set({ featureType: EMPTY(), source: EMPTY() }),
  activeCount: () => {
    const s = get();
    return DIMENSIONS.filter((d) => s[d].size > 0).length;
  },
}));

const DIMENSIONS: FilterDimension[] = ["featureType", "source"];

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

export function deriveSourceOptions(features: OptionalFeature[]) {
  const m = new Map<string, number>();
  for (const f of features) m.set(f.source, (m.get(f.source) ?? 0) + 1);
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([code]) => ({ value: code, label: sourceLabel(code) }));
}

function sourceLabel(code: string): string {
  const map: Record<string, string> = {
    XPHB: "Player's Handbook",
    GrimHollowPG24: "Grim Hollow: Player's Guide (2024)",
  };
  return map[code] ?? code;
}

export function optionalFeatureMatchesFilters(
  f: OptionalFeature,
  state: OptionalFeatureFilterState,
): boolean {
  if (state.source.size > 0 && !state.source.has(f.source)) return false;
  if (state.featureType.size > 0) {
    const types = f.featureType ?? [];
    const hit = types.some((ft) => state.featureType.has(ft));
    if (!hit) return false;
  }
  return true;
}
