import type { Species } from "@/types/entities";
import {
  useSpeciesFilters,
  speciesMatchesFilters,
  deriveSourceOptions,
  SIZE_OPTIONS,
  SPEED_OPTIONS,
  DARKVISION_OPTIONS,
  RESIST_OPTIONS,
  type FilterDimension,
} from "@/state/speciesFilters";
import { PillFilter } from "./PillFilter";

export function SpeciesFilterSidebar({ species }: { species: Species[] }) {
  const f = useSpeciesFilters();
  const size = useSpeciesFilters((s) => s.size);
  const speed = useSpeciesFilters((s) => s.speed);
  const darkvision = useSpeciesFilters((s) => s.darkvision);
  const resist = useSpeciesFilters((s) => s.resist);
  const source = useSpeciesFilters((s) => s.source);

  const sourceOptions = deriveSourceOptions(species);
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
        <PillFilter title="Size" options={SIZE_OPTIONS} state={size} onCycle={cycle("size")} onClear={clear("size")} defaultOpen />
        <PillFilter title="Speed" options={SPEED_OPTIONS} state={speed} onCycle={cycle("speed")} onClear={clear("speed")} />
        <PillFilter title="Darkvision" options={DARKVISION_OPTIONS} state={darkvision} onCycle={cycle("darkvision")} onClear={clear("darkvision")} />
        <PillFilter title="Damage Resistance" options={RESIST_OPTIONS} state={resist} onCycle={cycle("resist")} onClear={clear("resist")} />
        <PillFilter title="Source" options={sourceOptions} state={source} onCycle={cycle("source")} onClear={clear("source")} />
      </div>
    </div>
  );
}

export { speciesMatchesFilters };
