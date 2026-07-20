import { create } from "zustand";
import type { Species } from "@/types/entities";
import { capitalize } from "@/lib/text";
import {
  type TriState,
  emptyTri,
  triCycle,
  triMatch,
  triSize,
} from "@/state/triStateFilter";

export type FilterDimension = "size" | "speed" | "darkvision" | "resist" | "source";

interface SpeciesFilterState {
  size: TriState;
  speed: TriState;
  darkvision: TriState;
  resist: TriState;
  source: TriState;

  cycle: (dim: FilterDimension, value: string) => void;
  clearDimension: (dim: FilterDimension) => void;
  clearAll: () => void;
  activeCount: () => number;
}

const DIMENSIONS: FilterDimension[] = ["size", "speed", "darkvision", "resist", "source"];

export const useSpeciesFilters = create<SpeciesFilterState>((set, get) => ({
  size: emptyTri(),
  speed: emptyTri(),
  darkvision: emptyTri(),
  resist: emptyTri(),
  source: emptyTri(),

  cycle: (dim, value) =>
    set((state) => ({ [dim]: triCycle(state[dim], value) }) as Partial<SpeciesFilterState>),
  clearDimension: (dim) => set({ [dim]: emptyTri() } as Partial<SpeciesFilterState>),
  clearAll: () =>
    set({ size: emptyTri(), speed: emptyTri(), darkvision: emptyTri(), resist: emptyTri(), source: emptyTri() }),
  activeCount: () => {
    const s = get();
    return DIMENSIONS.reduce((n, d) => n + triSize(s[d]), 0);
  },
}));

export const SIZE_OPTIONS = [
  { value: "S", label: "Small" },
  { value: "M", label: "Medium" },
];

export const SPEED_OPTIONS = [
  { value: "25", label: "25 ft." },
  { value: "30", label: "30 ft." },
  { value: "35", label: "35 ft." },
];

export const DARKVISION_OPTIONS = [
  { value: "0", label: "None" },
  { value: "60", label: "60 ft." },
  { value: "120", label: "120 ft." },
];

export const RESIST_OPTIONS = [
  "poison", "fire", "cold", "lightning", "necrotic", "psychic", "radiant", "thunder",
].map((r) => ({ value: r, label: capitalize(r) }));

export { deriveSourceOptions } from "@/lib/sourceLabels";

export function speciesMatchesFilters(s: Species, f: SpeciesFilterState): boolean {
  if (!triMatch(f.source, [s.source])) return false;

  if (!triMatch(f.size, s.size ?? [])) return false;

  if (!triMatch(f.speed, [String(s.speed ?? "30")])) return false;

  if (!triMatch(f.darkvision, [s.darkvision != null ? String(s.darkvision) : "0"])) return false;

  if (!triMatch(f.resist, s.resist ?? [])) return false;

  return true;
}
