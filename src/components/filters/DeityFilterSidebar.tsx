import type { Deity } from "@/types/entities";
import {
  useDeityFilters,
  deityMatchesFilters,
  deriveSourceOptions,
  derivePantheonOptions,
  type FilterDimension,
} from "@/state/deityFilters";
import { PillFilter } from "./PillFilter";
import { SourceExclusionFilter } from "./SourceExclusionFilter";

export function DeityFilterSidebar({ deities }: { deities: Deity[] }) {
  const f = useDeityFilters();
  const pantheon = useDeityFilters((s) => s.pantheon);
  const source = useDeityFilters((s) => s.source);

  const pantheonOptions = derivePantheonOptions(deities);
  const sourceOptions = deriveSourceOptions(deities);
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
        <PillFilter title="Pantheon" options={pantheonOptions} selected={pantheon} onToggle={toggle("pantheon")} onClear={clear("pantheon")} defaultOpen />
        <PillFilter title="Source" options={sourceOptions} selected={source} onToggle={toggle("source")} onClear={clear("source")} />
        <SourceExclusionFilter category="deities" options={sourceOptions} />
      </div>
    </div>
  );
}

export { deityMatchesFilters };
