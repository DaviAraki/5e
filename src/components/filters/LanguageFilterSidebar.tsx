import type { Language } from "@/types/entities";
import {
  useLanguageFilters,
  languageMatchesFilters,
  deriveSourceOptions,
  TYPE_OPTIONS,
  type FilterDimension,
} from "@/state/languageFilters";
import { PillFilter } from "./PillFilter";
import { SourceExclusionFilter } from "./SourceExclusionFilter";

export function LanguageFilterSidebar({ languages }: { languages: Language[] }) {
  const f = useLanguageFilters();
  const type = useLanguageFilters((s) => s.type);
  const source = useLanguageFilters((s) => s.source);

  const sourceOptions = deriveSourceOptions(languages);
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
        <PillFilter title="Type" options={TYPE_OPTIONS} selected={type} onToggle={toggle("type")} onClear={clear("type")} defaultOpen />
        <PillFilter title="Source" options={sourceOptions} selected={source} onToggle={toggle("source")} onClear={clear("source")} />
        <SourceExclusionFilter category="languages" options={sourceOptions} />
      </div>
    </div>
  );
}

export { languageMatchesFilters };
