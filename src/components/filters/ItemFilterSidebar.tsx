import type { Item } from "@/types/entities";
import {
  useItemFilters,
  itemMatchesFilters,
  deriveSourceOptions,
  RARITY_OPTIONS,
  TYPE_OPTIONS,
  MISC_OPTIONS,
  type TriDimension,
} from "@/state/itemFilters";
import { PillFilter } from "./PillFilter";

export function ItemFilterSidebar({ items }: { items: Item[] }) {
  const f = useItemFilters();
  const source = useItemFilters((s) => s.source);
  const type = useItemFilters((s) => s.type);
  const rarity = useItemFilters((s) => s.rarity);
  const misc = useItemFilters((s) => s.misc);

  const sourceOptions = deriveSourceOptions(items);
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
        <PillFilter title="Rarity" options={RARITY_OPTIONS} state={rarity} onCycle={cycle("rarity")} onClear={clear("rarity")} defaultOpen />
        <PillFilter title="Type" options={TYPE_OPTIONS} state={type} onCycle={cycle("type")} onClear={clear("type")} />
        <PillFilter title="Special" options={MISC_OPTIONS} selected={misc} onToggle={f.toggleMisc} onClear={clear("misc")} />
      </div>
    </div>
  );
}

export { itemMatchesFilters };
