import type { Transformation } from "@/types/entities";
import {
  useTransformationFilters,
  transformationMatchesFilters,
  deriveSourceOptions,
  deriveOptionTypeOptions,
  type FilterDimension,
} from "@/state/transformationFilters";
import { PillFilter } from "./PillFilter";

export function TransformationFilterSidebar({ transformations }: { transformations: Transformation[] }) {
  const f = useTransformationFilters();
  const optionType = useTransformationFilters((s) => s.optionType);
  const source = useTransformationFilters((s) => s.source);

  const optionTypeOptions = deriveOptionTypeOptions(transformations);
  const sourceOptions = deriveSourceOptions(transformations);
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
        <PillFilter title="Type" options={optionTypeOptions} state={optionType} onCycle={cycle("optionType")} onClear={clear("optionType")} defaultOpen />
        <PillFilter title="Source" options={sourceOptions} state={source} onCycle={cycle("source")} onClear={clear("source")} />
      </div>
    </div>
  );
}

export { transformationMatchesFilters };
