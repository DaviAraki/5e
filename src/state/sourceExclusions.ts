import { create } from "zustand";

/**
 * Per-category source-book exclusion state.
 *
 * Unlike the include-based `source` dimension in each category's filter store
 * (which whitelists sources), this store blacklists sources per category.
 * An entity is hidden if its `source` is in the exclusion set for the page's
 * category, regardless of the include filter.
 *
 * Kept in a separate store so the existing per-category filter stores and
 * their matching predicates stay untouched; pages apply the exclusion as an
 * additional filter step.
 */

interface SourceExclusionState {
  /** category key → set of excluded source codes. */
  excluded: Record<string, Set<string>>;
  /** Toggle a source code in/out of a category's exclusion set. */
  toggle: (category: string, source: string) => void;
  /** Clear all exclusions for a category. */
  clear: (category: string) => void;
}

export const useSourceExclusions = create<SourceExclusionState>((set) => ({
  excluded: {},
  toggle: (category, source) =>
    set((state) => {
      const current = state.excluded[category] ?? new Set<string>();
      const next = new Set(current);
      if (next.has(source)) next.delete(source);
      else next.add(source);
      return { excluded: { ...state.excluded, [category]: next } };
    }),
  clear: (category) =>
    set((state) => ({
      excluded: { ...state.excluded, [category]: new Set<string>() },
    })),
}));

const EMPTY_SET = new Set<string>();

/**
 * Subscribe to a category's exclusion set. Returns a stable empty reference
 * when unset so identity comparisons in useMemo deps behave.
 */
export function useExcludedSources(category: string): Set<string> {
  return useSourceExclusions((s) => s.excluded[category] ?? EMPTY_SET);
}


