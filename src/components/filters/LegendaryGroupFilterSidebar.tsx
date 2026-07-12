import type { LegendaryGroup } from "@/types/entities";
import {
  useLegendaryGroupFilters,
  legendaryGroupMatchesFilters,
  deriveSourceOptions,
  type FilterDimension,
} from "@/state/legendaryGroupFilters";
import { PillFilter } from "./PillFilter";

export function LegendaryGroupFilterSidebar({ groups }: { groups: LegendaryGroup[] }) {
  const f = useLegendaryGroupFilters();
  const source = useLegendaryGroupFilters((s) => s.source);

  const sourceOptions = deriveSourceOptions(groups);
  const activeCount = f.activeCount();
  const cycle = (dim: FilterDimension) => (value: string) => f.cycle(dim, value);
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
        <PillFilter title="Source" options={sourceOptions} state={source} onCycle={cycle("source")} onClear={clear("source")} defaultOpen />
      </div>
    </div>
  );
}

export { legendaryGroupMatchesFilters };
