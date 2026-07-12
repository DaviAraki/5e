import type { OptionalFeature } from "@/types/entities";
import {
  useOptionalFeatureFilters,
  optionalFeatureMatchesFilters,
  deriveSourceOptions,
  deriveFeatureTypeOptions,
  type FilterDimension,
} from "@/state/optionalFeatureFilters";
import { PillFilter } from "./PillFilter";

export function OptionalFeatureFilterSidebar({ features }: { features: OptionalFeature[] }) {
  const f = useOptionalFeatureFilters();
  const featureType = useOptionalFeatureFilters((s) => s.featureType);
  const source = useOptionalFeatureFilters((s) => s.source);

  const featureTypeOptions = deriveFeatureTypeOptions(features);
  const sourceOptions = deriveSourceOptions(features);
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
        <PillFilter title="Feature Type" options={featureTypeOptions} state={featureType} onCycle={cycle("featureType")} onClear={clear("featureType")} defaultOpen />
        <PillFilter title="Source" options={sourceOptions} state={source} onCycle={cycle("source")} onClear={clear("source")} />
      </div>
    </div>
  );
}

export { optionalFeatureMatchesFilters };
