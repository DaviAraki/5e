import { useQuery } from "@tanstack/react-query";
import { DATASETS } from "@/data/datasets";
import type { ItemData, ClassData } from "@/data/datasets";
import type {
  Action,
  Background,
  Book,
  Condition,
  Deity,
  Disease,
  Feat,
  GameTable,
  Language,
  LegendaryGroup,
  Monster,
  OptionalFeature,
  ResolvedData,
  Species,
  Spell,
  Transformation,
  VariantRule,
} from "@/types/entities";

/**
 * Runtime data fetching for the pre-merged, One-edition datasets.
 *
 * The resolved files ship as static committed data under
 * public/data/resolved/. In a production build they're emitted to
 * dist/data/resolved/.
 *
 * The dataset catalog (query key + fetcher + reshape) lives in
 * `@/data/datasets.ts`; the hooks here are thin typed wrappers around it.
 * `main.tsx` consumes the same catalog for deep-link preloading, so the two
 * can no longer drift.
 */

export type { ItemData, ClassData } from "@/data/datasets";

/**
 * Generic single-dataset hook. The explicit <T> lets each typed hook pin its
 * return shape, since the registry's `DatasetEntry.load` is typed as
 * `() => Promise<unknown>` (the catalog is intentionally heterogeneous).
 */
function useDataset<T>(key: readonly [string], load: () => Promise<T>) {
  return useQuery({
    queryKey: key,
    queryFn: load,
  });
}

export function useSpells() {
  return useDataset<ResolvedData<Spell>>(DATASETS.spells.key, DATASETS.spells.load);
}
export function useMonsters() {
  return useDataset<ResolvedData<Monster>>(DATASETS.monsters.key, DATASETS.monsters.load);
}
export function useItems() {
  return useDataset<ItemData>(DATASETS.items.key, DATASETS.items.load);
}
export function useClasses() {
  return useDataset<ClassData>(DATASETS.classes.key, DATASETS.classes.load);
}
export function useBackgrounds() {
  return useDataset<ResolvedData<Background>>(DATASETS.backgrounds.key, DATASETS.backgrounds.load);
}
export function useSpecies() {
  return useDataset<ResolvedData<Species>>(DATASETS.species.key, DATASETS.species.load);
}
export function useFeats() {
  return useDataset<ResolvedData<Feat>>(DATASETS.feats.key, DATASETS.feats.load);
}
export function useVariantRules() {
  return useDataset<ResolvedData<VariantRule>>(DATASETS.variantrules.key, DATASETS.variantrules.load);
}
export function useBooks() {
  return useDataset<ResolvedData<Book>>(DATASETS.books.key, DATASETS.books.load);
}
export function useConditions() {
  return useDataset<ResolvedData<Condition>>(DATASETS.conditions.key, DATASETS.conditions.load);
}
export function useActions() {
  return useDataset<ResolvedData<Action>>(DATASETS.actions.key, DATASETS.actions.load);
}
export function useDeities() {
  return useDataset<ResolvedData<Deity>>(DATASETS.deities.key, DATASETS.deities.load);
}
export function useDiseases() {
  return useDataset<ResolvedData<Disease>>(DATASETS.diseases.key, DATASETS.diseases.load);
}
export function useLanguages() {
  return useDataset<ResolvedData<Language>>(DATASETS.languages.key, DATASETS.languages.load);
}
export function useLegendaryGroups() {
  return useDataset<ResolvedData<LegendaryGroup>>(DATASETS.legendarygroups.key, DATASETS.legendarygroups.load);
}
export function useTables() {
  return useDataset<ResolvedData<GameTable>>(DATASETS.tables.key, DATASETS.tables.load);
}
export function useTransformations() {
  return useDataset<ResolvedData<Transformation>>(DATASETS.transformations.key, DATASETS.transformations.load);
}
export function useOptionalFeatures() {
  return useDataset<ResolvedData<OptionalFeature>>(DATASETS.optionalfeatures.key, DATASETS.optionalfeatures.load);
}
