import { useState, type ReactNode } from "react";
import type { FilterOption } from "@/state/spellFilters";
import type { TriState } from "@/state/triStateFilter";

/**
 * FilterGroup — a collapsible section with a header (title + clear button).
 * Wraps any filter control.
 */
export function FilterGroup({
  title,
  activeCount,
  onClear,
  children,
  defaultOpen = false,
}: {
  title: string;
  activeCount?: number;
  onClear?: () => void;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border-subtle">
      <div className="flex items-center justify-between px-3 py-1.5">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-fg-muted hover:text-fg"
        >
          <span className="text-fg-faint">{open ? "▾" : "▸"}</span>
          {title}
          {activeCount ? (
            <span className="rounded-full bg-accent-subtle px-1.5 text-[10px] text-accent">
              {activeCount}
            </span>
          ) : null}
        </button>
        {activeCount && onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="text-[11px] text-fg-faint hover:text-fg-muted"
          >
            clear
          </button>
        ) : null}
      </div>
      {open && <div className="flex flex-wrap gap-1 px-3 pb-2.5">{children}</div>}
    </div>
  );
}

type PillState = "neutral" | "include" | "exclude";

/**
 * Pill — a single filter chip. In tri-state mode it cycles through three
 * visual states on click; in two-state mode it toggles active/inactive.
 */
export function Pill({
  label,
  state = "neutral",
  active,
  onClick,
}: {
  label: string;
  /** Tri-state mode: which state is active. */
  state?: PillState;
  /** Two-state mode: whether the pill is active. */
  active?: boolean;
  onClick: () => void;
}) {
  let cls: string;
  if (state === "include" || active) {
    cls = "border-accent bg-accent-subtle text-accent";
  } else if (state === "exclude") {
    cls = "border-red-500/60 bg-red-500/15 text-red-400 line-through";
  } else {
    cls = "border-border text-fg-muted hover:border-border-strong hover:text-fg";
  }
  return (
    <button
      type="button"
      onClick={onClick}
      title={
        state === "include"
          ? "Included — click to exclude"
          : state === "exclude"
            ? "Excluded — click to clear"
            : "Click to include"
      }
      className={`rounded-full border px-2 py-0.5 text-xs transition-colors ${cls}`}
    >
      {label}
    </button>
  );
}

/**
 * PillFilter — a FilterGroup rendering FilterOptions as pills.
 *
 * Defaults to tri-state mode (`state` prop): cycles neutral → include →
 * exclude → neutral via `onCycle`. For AND-flag dimensions that don't support
 * exclusion (e.g. "misc"), pass `mode="two-state"` with `selected` + `onToggle`
 * to get the legacy 2-state toggle behavior.
 */
export function PillFilter({
  title,
  options,
  state,
  onCycle,
  onClear,
  selected,
  onToggle,
  defaultOpen = false,
}: {
  title: string;
  options: FilterOption[];
  /** Tri-state: the dimension's include/exclude sets. */
  state?: TriState;
  /** Tri-state: callback when a pill is clicked. */
  onCycle?: (value: string) => void;
  /** Tri-state: reset the whole dimension. */
  onClear?: () => void;
  /** Two-state: the legacy selected set. */
  selected?: Set<string>;
  /** Two-state: legacy toggle callback. */
  onToggle?: (value: string) => void;
  defaultOpen?: boolean;
}) {
  const triMode = state !== undefined;
  const count = triMode
    ? state.include.size + state.exclude.size
    : (selected?.size ?? 0);

  // Build a stable clear handler for the group header.
  const handleClear = triMode ? onClear : undefined;

  return (
    <FilterGroup
      title={title}
      activeCount={count}
      onClear={handleClear}
      defaultOpen={defaultOpen}
    >
      {options.map((opt) => {
        if (triMode) {
          const st = state.include.has(opt.value)
            ? "include"
            : state.exclude.has(opt.value)
              ? "exclude"
              : "neutral";
          return (
            <Pill
              key={opt.value}
              label={opt.label}
              state={st}
              onClick={() => onCycle?.(opt.value)}
            />
          );
        }
        return (
          <Pill
            key={opt.value}
            label={opt.label}
            active={selected?.has(opt.value) ?? false}
            onClick={() => onToggle?.(opt.value)}
          />
        );
      })}
    </FilterGroup>
  );
}
