import type { Deity } from "@/types/entities";
import {
  useDeityFilters,
  deityMatchesFilters,
  deriveSourceOptions,
  derivePantheonOptions,
  type FilterDimension,
} from "@/state/deityFilters";
import { PillFilter } from "./PillFilter";

export function DeityFilterSidebar({ deities }: { deities: Deity[] }) {
  const f = useDeityFilters();
  const pantheon = useDeityFilters((s) => s.pantheon);
  const source = useDeityFilters((s) => s.source);

  const pantheonOptions = derivePantheonOptions(deities);
  const sourceOptions = deriveSourceOptions(deities);
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
        <PillFilter title="Pantheon" options={pantheonOptions} state={pantheon} onCycle={cycle("pantheon")} onClear={clear("pantheon")} defaultOpen />
        <PillFilter title="Source" options={sourceOptions} state={source} onCycle={cycle("source")} onClear={clear("source")} />
      </div>
    </div>
  );
}

export { deityMatchesFilters };
