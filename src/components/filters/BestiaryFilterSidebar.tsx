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
  type TriDimension,
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
  const cycle = (dim: TriDimension) => (value: string) => f.cycle(dim, value);
  const clear = (dim: TriDimension | "misc") => () => f.clearDimension(dim);

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
        <PillFilter title="Source" options={sourceOptions} state={source} onCycle={cycle("source")} onClear={clear("source")} defaultOpen />
        <PillFilter title="Size" options={SIZE_OPTIONS} state={size} onCycle={cycle("size")} onClear={clear("size")} defaultOpen />
        <PillFilter title="Type" options={TYPE_OPTIONS} state={type} onCycle={cycle("type")} onClear={clear("type")} />
        <PillFilter title="Challenge Rating" options={CR_OPTIONS} state={cr} onCycle={cycle("cr")} onClear={clear("cr")} />
        <PillFilter title="Damage Immunity" options={IMMUNITY_OPTIONS} state={immune} onCycle={cycle("immune")} onClear={clear("immune")} />
        <PillFilter title="Condition Immunity" options={CONDITION_OPTIONS} state={conditionImmune} onCycle={cycle("conditionImmune")} onClear={clear("conditionImmune")} />
        <PillFilter title="Environment" options={ENVIRONMENT_OPTIONS} state={environment} onCycle={cycle("environment")} onClear={clear("environment")} />
        <PillFilter title="Special" options={MISC_OPTIONS} selected={misc} onToggle={f.toggleMisc} onClear={clear("misc")} />
      </div>
    </div>
  );
}

export { monsterMatchesFilters };
