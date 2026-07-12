import type { Spell } from "@/types/entities";
import {
  useSpellFilters,
  spellMatchesFilters,
  deriveSourceOptions,
  LEVEL_OPTIONS,
  SCHOOL_OPTIONS,
  CLASS_OPTIONS,
  CAST_TIME_OPTIONS,
  DURATION_OPTIONS,
  RANGE_OPTIONS,
  DAMAGE_TYPE_OPTIONS,
  SAVE_OPTIONS,
  CONDITION_OPTIONS,
  MISC_OPTIONS,
  type TriDimension,
} from "@/state/spellFilters";
import { PillFilter } from "./PillFilter";

/**
 * The filter sidebar for the spells page. Renders all filter dimensions as
 * collapsible pill groups. Filter state lives in the Zustand store; the
 * spells list reads the same store to apply the predicate.
 */
export function SpellFilterSidebar({ spells }: { spells: Spell[] }) {
  const f = useSpellFilters();
  // Subscribe to each set so React re-renders on toggle.
  const source = useSpellFilters((s) => s.source);
  const level = useSpellFilters((s) => s.level);
  const school = useSpellFilters((s) => s.school);
  const cls = useSpellFilters((s) => s.class);
  const castTime = useSpellFilters((s) => s.castTime);
  const duration = useSpellFilters((s) => s.duration);
  const range = useSpellFilters((s) => s.range);
  const damageType = useSpellFilters((s) => s.damageType);
  const save = useSpellFilters((s) => s.save);
  const condition = useSpellFilters((s) => s.condition);
  const misc = useSpellFilters((s) => s.misc);

  const sourceOptions = deriveSourceOptions(spells);
  const activeCount = f.activeCount();

  const cycle = (dim: TriDimension) => (value: string) => f.cycle(dim, value);
  const clear = (dim: TriDimension | "misc") => () => f.clearDimension(dim);

  return (
    <div className="flex h-full flex-col">
      {/* Header with active count and clear-all */}
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
        <PillFilter
          title="Source"
          options={sourceOptions}
          state={source}
          onCycle={cycle("source")}
          onClear={clear("source")}
          defaultOpen
        />
        <PillFilter
          title="Level"
          options={LEVEL_OPTIONS}
          state={level}
          onCycle={cycle("level")}
          onClear={clear("level")}
          defaultOpen
        />
        <PillFilter
          title="School"
          options={SCHOOL_OPTIONS}
          state={school}
          onCycle={cycle("school")}
          onClear={clear("school")}
        />
        <PillFilter
          title="Classes"
          options={CLASS_OPTIONS}
          state={cls}
          onCycle={cycle("class")}
          onClear={clear("class")}
        />
        <PillFilter
          title="Casting Time"
          options={CAST_TIME_OPTIONS}
          state={castTime}
          onCycle={cycle("castTime")}
          onClear={clear("castTime")}
        />
        <PillFilter
          title="Duration"
          options={DURATION_OPTIONS}
          state={duration}
          onCycle={cycle("duration")}
          onClear={clear("duration")}
        />
        <PillFilter
          title="Range"
          options={RANGE_OPTIONS}
          state={range}
          onCycle={cycle("range")}
          onClear={clear("range")}
        />
        <PillFilter
          title="Damage Type"
          options={DAMAGE_TYPE_OPTIONS}
          state={damageType}
          onCycle={cycle("damageType")}
          onClear={clear("damageType")}
        />
        <PillFilter
          title="Saving Throw"
          options={SAVE_OPTIONS}
          state={save}
          onCycle={cycle("save")}
          onClear={clear("save")}
        />
        <PillFilter
          title="Condition Inflicted"
          options={CONDITION_OPTIONS}
          state={condition}
          onCycle={cycle("condition")}
          onClear={clear("condition")}
        />
        <PillFilter
          title="Components & Misc"
          options={MISC_OPTIONS}
          selected={misc}
          onToggle={f.toggleMisc}
          onClear={clear("misc")}
        />
      </div>
    </div>
  );
}

/** Re-export the predicate so the page applies the same store state. */
export { spellMatchesFilters };
