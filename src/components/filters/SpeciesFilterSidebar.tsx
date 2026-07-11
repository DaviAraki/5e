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
        <PillFilter title="Size" options={SIZE_OPTIONS} selected={size} onToggle={toggle("size")} onClear={clear("size")} defaultOpen />
        <PillFilter title="Speed" options={SPEED_OPTIONS} selected={speed} onToggle={toggle("speed")} onClear={clear("speed")} />
        <PillFilter title="Darkvision" options={DARKVISION_OPTIONS} selected={darkvision} onToggle={toggle("darkvision")} onClear={clear("darkvision")} />
        <PillFilter title="Damage Resistance" options={RESIST_OPTIONS} selected={resist} onToggle={toggle("resist")} onClear={clear("resist")} />
        <PillFilter title="Source" options={sourceOptions} selected={source} onToggle={toggle("source")} onClear={clear("source")} />
      </div>
    </div>
  );
}

export { speciesMatchesFilters };
