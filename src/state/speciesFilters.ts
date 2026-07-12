import { create } from "zustand";
import type { Species } from "@/types/entities";

export type FilterDimension = "size" | "speed" | "darkvision" | "resist" | "source";

interface SpeciesFilterState {
  size: Set<string>;
  speed: Set<string>;
  darkvision: Set<string>;
  resist: Set<string>;
  source: Set<string>;

  toggle: (dim: FilterDimension, value: string) => void;
  clearDimension: (dim: FilterDimension) => void;
  clearAll: () => void;
  activeCount: () => number;
}

const EMPTY = () => new Set<string>();

export const useSpeciesFilters = create<SpeciesFilterState>((set, get) => ({
  size: EMPTY(),
  speed: EMPTY(),
  darkvision: EMPTY(),
  resist: EMPTY(),
  source: EMPTY(),

  toggle: (dim, value) =>
    set((state) => {
      const next = new Set(state[dim]);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { [dim]: next } as Partial<SpeciesFilterState>;
    }),
  clearDimension: (dim) => set({ [dim]: EMPTY() } as Partial<SpeciesFilterState>),
  clearAll: () =>
    set({ size: EMPTY(), speed: EMPTY(), darkvision: EMPTY(), resist: EMPTY(), source: EMPTY() }),
  activeCount: () => {
    const s = get();
    return DIMENSIONS.filter((d) => s[d].size > 0).length;
  },
}));

const DIMENSIONS: FilterDimension[] = ["size", "speed", "darkvision", "resist", "source"];

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

export function deriveSourceOptions(species: Species[]) {
  const m = new Map<string, number>();
  for (const s of species) m.set(s.source, (m.get(s.source) ?? 0) + 1);
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([code]) => ({ value: code, label: sourceLabel(code) }));
}

function sourceLabel(code: string): string {
  const map: Record<string, string> = {
    XPHB: "Player's Handbook",
    XDMG: "Dungeon Master's Guide",
    EFA: "Eberron: Friends and Foes",
    RHW: "Ravenloft: The Horrors Within",
    FRAiF: "Forge of the Elemental Giants",
    WttHC: "Welcome to the Hidden City",
    FRHoF: "Forge of the Elemental Giants",
    GrimHollowPG24: "Grim Hollow: Player's Guide (2024)",
  };
  return map[code] ?? code;
}

export function speciesMatchesFilters(s: Species, f: SpeciesFilterState): boolean {
  if (f.source.size > 0 && !f.source.has(s.source)) return false;

  if (f.size.size > 0) {
    const hit = (s.size ?? []).some((sz) => f.size.has(sz));
    if (!hit) return false;
  }

  if (f.speed.size > 0) {
    const sp = String(s.speed ?? "30");
    if (!f.speed.has(sp)) return false;
  }

  if (f.darkvision.size > 0) {
    const dv = s.darkvision != null ? String(s.darkvision) : "0";
    if (!f.darkvision.has(dv)) return false;
  }

  if (f.resist.size > 0) {
    const hit = (s.resist ?? []).some((r) => f.resist.has(r));
    if (!hit) return false;
  }

  return true;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
