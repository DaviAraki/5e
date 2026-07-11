import type { Item } from "@/types/entities";
import {
  useItemFilters,
  itemMatchesFilters,
  deriveSourceOptions,
  RARITY_OPTIONS,
  TYPE_OPTIONS,
  MISC_OPTIONS,
  type FilterDimension,
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
        <PillFilter title="Rarity" options={RARITY_OPTIONS} selected={rarity} onToggle={toggle("rarity")} onClear={clear("rarity")} defaultOpen />
        <PillFilter title="Type" options={TYPE_OPTIONS} selected={type} onToggle={toggle("type")} onClear={clear("type")} />
        <PillFilter title="Special" options={MISC_OPTIONS} selected={misc} onToggle={toggle("misc")} onClear={clear("misc")} />
      </div>
    </div>
  );
}

export { itemMatchesFilters };
