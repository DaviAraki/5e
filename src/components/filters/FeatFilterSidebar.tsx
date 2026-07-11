import type { Feat } from "@/types/entities";
import {
  useFeatFilters,
  featMatchesFilters,
  deriveSourceOptions,
  CATEGORY_OPTIONS,
  ABILITY_OPTIONS,
  MISC_OPTIONS,
  type FilterDimension,
} from "@/state/featFilters";
import { PillFilter } from "./PillFilter";

export function FeatFilterSidebar({ feats }: { feats: Feat[] }) {
  const f = useFeatFilters();
  const category = useFeatFilters((s) => s.category);
  const ability = useFeatFilters((s) => s.ability);
  const misc = useFeatFilters((s) => s.misc);
  const source = useFeatFilters((s) => s.source);

  const sourceOptions = deriveSourceOptions(feats);
  const activeCount = f.activeCount();
  const toggle = (dim: FilterDimension) => (value: string) => f.toggle(dim, value);
  const clear = (dim: FilterDimension) => () => f.clearDimension(dim);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-sm font-semibold text-fg">
          Filters {activeCount > 0 && <span className="text-fg-muted">({activeCount})</span>}
        </span>
        {activeCount > 0 && (
          <button type="button" onClick={() => f.clearAll()} className="text-xs text-accent hover:text-accent-hover">
            Clear all
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        <PillFilter title="Category" options={CATEGORY_OPTIONS} selected={category} onToggle={toggle("category")} onClear={clear("category")} defaultOpen />
        <PillFilter title="Ability Score" options={ABILITY_OPTIONS} selected={ability} onToggle={toggle("ability")} onClear={clear("ability")} />
        <PillFilter title="Special" options={MISC_OPTIONS} selected={misc} onToggle={toggle("misc")} onClear={clear("misc")} />
        <PillFilter title="Source" options={sourceOptions} selected={source} onToggle={toggle("source")} onClear={clear("source")} />
      </div>
    </div>
  );
}

export { featMatchesFilters };
