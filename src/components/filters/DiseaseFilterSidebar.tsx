import type { Disease } from "@/types/entities";
import {
  useDiseaseFilters,
  diseaseMatchesFilters,
  deriveSourceOptions,
  type FilterDimension,
} from "@/state/diseaseFilters";
import { PillFilter } from "./PillFilter";

export function DiseaseFilterSidebar({ diseases }: { diseases: Disease[] }) {
  const f = useDiseaseFilters();
  const source = useDiseaseFilters((s) => s.source);

  const sourceOptions = deriveSourceOptions(diseases);
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

export { diseaseMatchesFilters };
