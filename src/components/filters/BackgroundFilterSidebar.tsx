import type { Background } from "@/types/entities";
import {
  useBackgroundFilters,
  backgroundMatchesFilters,
  deriveSourceOptions,
  SKILL_OPTIONS,
  ABILITY_OPTIONS,
  type FilterDimension,
} from "@/state/backgroundFilters";
import { PillFilter } from "./PillFilter";
import { SourceExclusionFilter } from "./SourceExclusionFilter";

export function BackgroundFilterSidebar({ backgrounds }: { backgrounds: Background[] }) {
  const f = useBackgroundFilters();
  const skill = useBackgroundFilters((s) => s.skill);
  const ability = useBackgroundFilters((s) => s.ability);
  const source = useBackgroundFilters((s) => s.source);

  const sourceOptions = deriveSourceOptions(backgrounds);
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
        <PillFilter title="Skill Proficiency" options={SKILL_OPTIONS} selected={skill} onToggle={toggle("skill")} onClear={clear("skill")} defaultOpen />
        <PillFilter title="Ability Score" options={ABILITY_OPTIONS} selected={ability} onToggle={toggle("ability")} onClear={clear("ability")} defaultOpen />
        <PillFilter title="Source" options={sourceOptions} selected={source} onToggle={toggle("source")} onClear={clear("source")} />
        <SourceExclusionFilter category="backgrounds" options={sourceOptions} />
      </div>
    </div>
  );
}

export { backgroundMatchesFilters };
