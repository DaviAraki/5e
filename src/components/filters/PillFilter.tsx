import { useState, type ReactNode } from "react";
import type { FilterOption } from "@/state/spellFilters";

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

/**
 * Pill — a single toggleable filter chip.
 */
export function Pill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-2 py-0.5 text-xs transition-colors ${
        active
          ? "border-accent bg-accent-subtle text-accent"
          : "border-border text-fg-muted hover:border-border-strong hover:text-fg"
      }`}
    >
      {label}
    </button>
  );
}

/**
 * PillFilter — a FilterGroup rendering a list of FilterOptions as pills.
 * Toggles membership in the given Set via the onChange callback.
 */
export function PillFilter({
  title,
  options,
  selected,
  onToggle,
  onClear,
  defaultOpen = false,
}: {
  title: string;
  options: FilterOption[];
  selected: Set<string>;
  onToggle: (value: string) => void;
  onClear: () => void;
  defaultOpen?: boolean;
}) {
  return (
    <FilterGroup
      title={title}
      activeCount={selected.size}
      onClear={onClear}
      defaultOpen={defaultOpen}
    >
      {options.map((opt) => (
        <Pill
          key={opt.value}
          label={opt.label}
          active={selected.has(opt.value)}
          onClick={() => onToggle(opt.value)}
        />
      ))}
    </FilterGroup>
  );
}
