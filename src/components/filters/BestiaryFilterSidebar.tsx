import type { Monster } from "@/types/entities";
import {
  useBestiaryFilters,
  monsterMatchesFilters,
  deriveSourceOptions,
  SIZE_OPTIONS,
  TYPE_OPTIONS,
  CR_OPTIONS,
  IMMUNITY_OPTIONS,
  CONDITION_OPTIONS,
  ENVIRONMENT_OPTIONS,
  MISC_OPTIONS,
  type FilterDimension,
} from "@/state/bestiaryFilters";
import { PillFilter } from "./PillFilter";

/**
 * Filter sidebar for the bestiary. Reuses the same PillFilter components
 * as the spells page. Reads/writes the Zustand store.
 */
export function BestiaryFilterSidebar({ monsters }: { monsters: Monster[] }) {
  const f = useBestiaryFilters();
  const source = useBestiaryFilters((s) => s.source);
  const size = useBestiaryFilters((s) => s.size);
  const type = useBestiaryFilters((s) => s.type);
  const cr = useBestiaryFilters((s) => s.cr);
  const immune = useBestiaryFilters((s) => s.immune);
  const conditionImmune = useBestiaryFilters((s) => s.conditionImmune);
  const environment = useBestiaryFilters((s) => s.environment);
  const misc = useBestiaryFilters((s) => s.misc);

  const sourceOptions = deriveSourceOptions(monsters);
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
          <button
            type="button"
            onClick={() => f.clearAll()}
            className="text-xs text-accent hover:text-accent-hover"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <PillFilter title="Source" options={sourceOptions} selected={source} onToggle={toggle("source")} onClear={clear("source")} defaultOpen />
        <PillFilter title="Size" options={SIZE_OPTIONS} selected={size} onToggle={toggle("size")} onClear={clear("size")} defaultOpen />
        <PillFilter title="Type" options={TYPE_OPTIONS} selected={type} onToggle={toggle("type")} onClear={clear("type")} />
        <PillFilter title="Challenge Rating" options={CR_OPTIONS} selected={cr} onToggle={toggle("cr")} onClear={clear("cr")} />
        <PillFilter title="Damage Immunity" options={IMMUNITY_OPTIONS} selected={immune} onToggle={toggle("immune")} onClear={clear("immune")} />
        <PillFilter title="Condition Immunity" options={CONDITION_OPTIONS} selected={conditionImmune} onToggle={toggle("conditionImmune")} onClear={clear("conditionImmune")} />
        <PillFilter title="Environment" options={ENVIRONMENT_OPTIONS} selected={environment} onToggle={toggle("environment")} onClear={clear("environment")} />
        <PillFilter title="Special" options={MISC_OPTIONS} selected={misc} onToggle={toggle("misc")} onClear={clear("misc")} />
      </div>
    </div>
  );
}

export { monsterMatchesFilters };
