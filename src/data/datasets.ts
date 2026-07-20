/**
 * Single source of truth for the resolved-dataset catalog.
 *
 * Each entry pairs the React Query key with a `load` function that knows how
 * to fetch + reshape that dataset (e.g. items dedupes, classes joins
 * subclasses). Both the runtime hooks (`DataLoader.use*`) and the deep-link
 * preload (`main.tsx`) consume this registry, so the route→fetch mapping lives
 * in exactly one place — previously it was duplicated as a hand-synced table
 * in `main.tsx` (~100 LOC) that drifted from `DataLoader.ts`.
 *
 * The `route` field is the first URL path segment (e.g. "spells",
 * "bestiary", "optional-features").
 */

import { dedupeByRef } from "@/data/entityRefs";
import type {
  Action,
  Background,
  Book,
  Class,
  Condition,
  Deity,
  Disease,
  Feat,
  GameTable,
  Item,
  ItemGroup,
  Language,
  LegendaryGroup,
  Monster,
  OptionalFeature,
  ResolvedData,
  Species,
  Spell,
  Subclass,
  Transformation,
  VariantRule,
} from "@/types/entities";

const RESOLVED_BASE = `${import.meta.env.BASE_URL}data/resolved`;

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`Failed to load ${path}: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export interface ItemData {
  items: Item[];
  itemGroups: ItemGroup[];
}
export interface ClassData {
  classes: Class[];
  subclasses: Subclass[];
}

/** A dataset entry: its query key, its route segment, and how to load it. */
export interface DatasetEntry {
  /** React Query cache key. */
  key: readonly [string];
  /** First URL path segment of the page that consumes this dataset. */
  route: string;
  /** Fetch + reshape. Returns the exact shape the use* hook caches. */
  load: () => Promise<unknown>;
}

/** Fetch a single-file ResolvedData<T> by file name. */
function loadResolved<T>(file: string): () => Promise<ResolvedData<T>> {
  return () => fetchJson<ResolvedData<T>>(`${RESOLVED_BASE}/${file}`);
}

/**
 * The catalog. Add new datasets here; DataLoader + main.tsx pick them up
 * automatically.
 */
export const DATASETS = {
  spells: {
    key: ["spells"] as const,
    route: "spells",
    load: loadResolved<Spell>("spells.json"),
  },
  monsters: {
    key: ["monsters"] as const,
    route: "bestiary",
    load: loadResolved<Monster>("bestiary.json"),
  },
  items: {
    key: ["items"] as const,
    route: "items",
    load: async (): Promise<ItemData> => {
      const data = await fetchJson<ResolvedData<Item> & { itemGroups?: ItemGroup[] }>(
        `${RESOLVED_BASE}/items.json`,
      );
      return {
        // dedupeByRef guards against dirty resolved data: vendor magicvariant
        // templates ship without a `source` and collapse into a few colliding
        // keys, producing duplicated rows and broken React keys.
        items: dedupeByRef(data.entities),
        itemGroups: dedupeByRef(data.itemGroups ?? []),
      };
    },
  },
  classes: {
    key: ["classes"] as const,
    route: "classes",
    load: async (): Promise<ClassData> => {
      const [classRes, subclassRes] = await Promise.all([
        fetchJson<ResolvedData<Class>>(`${RESOLVED_BASE}/classes.json`),
        fetchJson<ResolvedData<Subclass>>(`${RESOLVED_BASE}/subclasses.json`),
      ]);
      return { classes: classRes.entities, subclasses: subclassRes.entities };
    },
  },
  backgrounds: {
    key: ["backgrounds"] as const,
    route: "backgrounds",
    load: loadResolved<Background>("backgrounds.json"),
  },
  species: {
    key: ["species"] as const,
    route: "species",
    load: loadResolved<Species>("species.json"),
  },
  feats: {
    key: ["feats"] as const,
    route: "feats",
    load: loadResolved<Feat>("feats.json"),
  },
  variantrules: {
    key: ["variantrules"] as const,
    route: "variantrules",
    load: loadResolved<VariantRule>("variantrules.json"),
  },
  books: {
    key: ["books"] as const,
    route: "books",
    load: loadResolved<Book>("books.json"),
  },
  conditions: {
    key: ["conditions"] as const,
    route: "conditions",
    load: loadResolved<Condition>("conditions.json"),
  },
  actions: {
    key: ["actions"] as const,
    route: "actions",
    load: loadResolved<Action>("actions.json"),
  },
  deities: {
    key: ["deities"] as const,
    route: "deities",
    load: loadResolved<Deity>("deities.json"),
  },
  diseases: {
    key: ["diseases"] as const,
    route: "diseases",
    load: loadResolved<Disease>("diseases.json"),
  },
  languages: {
    key: ["languages"] as const,
    route: "languages",
    load: loadResolved<Language>("languages.json"),
  },
  legendarygroups: {
    key: ["legendarygroups"] as const,
    route: "legendary-groups",
    load: loadResolved<LegendaryGroup>("legendarygroups.json"),
  },
  tables: {
    key: ["tables"] as const,
    route: "tables",
    load: loadResolved<GameTable>("tables.json"),
  },
  transformations: {
    key: ["transformations"] as const,
    route: "transformations",
    load: loadResolved<Transformation>("transformations.json"),
  },
  optionalfeatures: {
    key: ["optionalfeatures"] as const,
    route: "optional-features",
    load: loadResolved<OptionalFeature>("optionalfeatures.json"),
  },
} satisfies Record<string, DatasetEntry>;

/** Look up a dataset by its URL route segment. */
export function datasetForRoute(routeSegment: string): DatasetEntry | undefined {
  return Object.values(DATASETS).find((d) => d.route === routeSegment);
}

/** The small cross-reference datasets to prefetch on idle (for the preview popover). */
export const IDLE_PREFETCH_KEYS = [
  "feats",
  "variantrules",
  "conditions",
  "diseases",
  "deities",
  "languages",
  "legendarygroups",
  "tables",
  "transformations",
  "optionalfeatures",
] as const;
