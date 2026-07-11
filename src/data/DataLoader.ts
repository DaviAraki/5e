import { useQuery } from "@tanstack/react-query";
import type {
  Background,
  Book,
  Class,
  Feat,
  Item,
  ItemGroup,
  Monster,
  ResolvedData,
  Species,
  Spell,
  Subclass,
  VariantRule,
} from "@/types/entities";

/**
 * Runtime data fetching for the pre-merged, One-edition datasets.
 *
 * The resolved files ship as static committed data under
 * public/data/resolved/. In a production build they're emitted to
 * dist/data/resolved/.
 */

const RESOLVED_BASE = "/data/resolved";

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`Failed to load ${path}: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export function useSpells() {
  return useQuery({
    queryKey: ["spells"],
    queryFn: () =>
      fetchJson<ResolvedData<Spell>>(`${RESOLVED_BASE}/spells.json`),
  });
}

export function useMonsters() {
  return useQuery({
    queryKey: ["monsters"],
    queryFn: () =>
      fetchJson<ResolvedData<Monster>>(`${RESOLVED_BASE}/bestiary.json`),
  });
}

export interface ItemData {
  items: Item[];
  itemGroups: ItemGroup[];
}

export function useItems() {
  return useQuery({
    queryKey: ["items"],
    queryFn: async (): Promise<ItemData> => {
      const data = await fetchJson<
        ResolvedData<Item> & { itemGroups?: ItemGroup[] }
      >(`${RESOLVED_BASE}/items.json`);
      return {
        items: data.entities,
        itemGroups: data.itemGroups ?? [],
      };
    },
  });
}

export interface ClassData {
  classes: Class[];
  subclasses: Subclass[];
}

export function useClasses() {
  return useQuery({
    queryKey: ["classes"],
    queryFn: async (): Promise<ClassData> => {
      const [classRes, subclassRes] = await Promise.all([
        fetchJson<ResolvedData<Class>>(`${RESOLVED_BASE}/classes.json`),
        fetchJson<ResolvedData<Subclass>>(`${RESOLVED_BASE}/subclasses.json`),
      ]);
      return {
        classes: classRes.entities,
        subclasses: subclassRes.entities,
      };
    },
  });
}

export function useBackgrounds() {
  return useQuery({
    queryKey: ["backgrounds"],
    queryFn: () =>
      fetchJson<ResolvedData<Background>>(`${RESOLVED_BASE}/backgrounds.json`),
  });
}

export function useSpecies() {
  return useQuery({
    queryKey: ["species"],
    queryFn: () =>
      fetchJson<ResolvedData<Species>>(`${RESOLVED_BASE}/species.json`),
  });
}

export function useFeats() {
  return useQuery({
    queryKey: ["feats"],
    queryFn: () =>
      fetchJson<ResolvedData<Feat>>(`${RESOLVED_BASE}/feats.json`),
  });
}

export function useVariantRules() {
  return useQuery({
    queryKey: ["variantrules"],
    queryFn: () =>
      fetchJson<ResolvedData<VariantRule>>(`${RESOLVED_BASE}/variantrules.json`),
  });
}

export function useBooks() {
  return useQuery({
    queryKey: ["books"],
    queryFn: () =>
      fetchJson<ResolvedData<Book>>(`${RESOLVED_BASE}/books.json`),
  });
}
