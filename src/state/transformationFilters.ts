import { create } from "zustand";
import type { Transformation } from "@/types/entities";
import {
  type TriState,
  emptyTri,
  triCycle,
  triMatch,
  triSize,
} from "@/state/triStateFilter";

export type FilterDimension = "optionType" | "source";

interface TransformationFilterState {
  optionType: TriState;
  source: TriState;
  cycle: (dim: FilterDimension, value: string) => void;
  clearDimension: (dim: FilterDimension) => void;
  clearAll: () => void;
  activeCount: () => number;
}

const DIMENSIONS: FilterDimension[] = ["optionType", "source"];

export const useTransformationFilters = create<TransformationFilterState>((set, get) => ({
  optionType: emptyTri(),
  source: emptyTri(),
  cycle: (dim, value) =>
    set((state) => ({ [dim]: triCycle(state[dim], value) }) as Partial<TransformationFilterState>),
  clearDimension: (dim) => set({ [dim]: emptyTri() } as Partial<TransformationFilterState>),
  clearAll: () => set({ optionType: emptyTri(), source: emptyTri() }),
  activeCount: () => {
    const s = get();
    return DIMENSIONS.reduce((n, d) => n + triSize(s[d]), 0);
  },
}));

/** Build optionType options dynamically (values are open-ended). */
export function deriveOptionTypeOptions(transformations: Transformation[]) {
  const m = new Map<string, number>();
  for (const t of transformations) {
    const types = t.optionType ?? [];
    for (const ot of types) m.set(ot, (m.get(ot) ?? 0) + 1);
  }
  return [...m.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([code]) => ({ value: code, label: code }));
}

export { deriveSourceOptions } from "@/lib/sourceLabels";

export function transformationMatchesFilters(t: Transformation, f: TransformationFilterState): boolean {
  if (!triMatch(f.source, [t.source])) return false;
  if (!triMatch(f.optionType, t.optionType ?? [])) return false;
  return true;
}
