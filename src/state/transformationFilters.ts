import { create } from "zustand";
import type { Transformation } from "@/types/entities";

export type FilterDimension = "optionType" | "source";

interface TransformationFilterState {
  optionType: Set<string>;
  source: Set<string>;
  toggle: (dim: FilterDimension, value: string) => void;
  clearDimension: (dim: FilterDimension) => void;
  clearAll: () => void;
  activeCount: () => number;
}

const EMPTY = () => new Set<string>();

export const useTransformationFilters = create<TransformationFilterState>((set, get) => ({
  optionType: EMPTY(),
  source: EMPTY(),
  toggle: (dim, value) =>
    set((state) => {
      const next = new Set(state[dim]);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { [dim]: next } as Partial<TransformationFilterState>;
    }),
  clearDimension: (dim) => set({ [dim]: EMPTY() } as Partial<TransformationFilterState>),
  clearAll: () => set({ optionType: EMPTY(), source: EMPTY() }),
  activeCount: () => {
    const s = get();
    return DIMENSIONS.filter((d) => s[d].size > 0).length;
  },
}));

const DIMENSIONS: FilterDimension[] = ["optionType", "source"];

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

export function deriveSourceOptions(transformations: Transformation[]) {
  const m = new Map<string, number>();
  for (const t of transformations) m.set(t.source, (m.get(t.source) ?? 0) + 1);
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([code]) => ({ value: code, label: sourceLabel(code) }));
}

function sourceLabel(code: string): string {
  const map: Record<string, string> = {
    GrimHollowPG24: "Grim Hollow: Player's Guide (2024)",
  };
  return map[code] ?? code;
}

export function transformationMatchesFilters(t: Transformation, f: TransformationFilterState): boolean {
  if (f.source.size > 0 && !f.source.has(t.source)) return false;
  if (f.optionType.size > 0) {
    const types = t.optionType ?? [];
    const hit = types.some((ot) => f.optionType.has(ot));
    if (!hit) return false;
  }
  return true;
}
