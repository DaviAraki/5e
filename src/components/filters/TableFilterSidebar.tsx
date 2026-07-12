import type { GameTable } from "@/types/entities";
import {
  useTableFilters,
  tableMatchesFilters,
  deriveSourceOptions,
  type FilterDimension,
} from "@/state/tableFilters";
import { PillFilter } from "./PillFilter";
import { SourceExclusionFilter } from "./SourceExclusionFilter";

export function TableFilterSidebar({ tables }: { tables: GameTable[] }) {
  const f = useTableFilters();
  const source = useTableFilters((s) => s.source);

  const sourceOptions = deriveSourceOptions(tables);
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
        <PillFilter title="Source" options={sourceOptions} selected={source} onToggle={toggle("source")} onClear={clear("source")} defaultOpen />
        <SourceExclusionFilter category="tables" options={sourceOptions} />
      </div>
    </div>
  );
}

export { tableMatchesFilters };
