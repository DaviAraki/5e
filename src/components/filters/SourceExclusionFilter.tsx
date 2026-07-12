import { useState } from "react";
import type { FilterOption } from "@/state/spellFilters";
import { useSourceExclusions } from "@/state/sourceExclusions";

/**
 * SourceExclusionFilter — a collapsible "Exclude Books" section.
 *
 * Renders the same source options as the include-based Source filter, but
 * with blacklist semantics: clicking a book toggles whether it is *excluded*
 * from the list. Excluded books are shown as active (red-tinted) pills.
 *
 * Independent of the per-category filter stores, so it composes cleanly with
 * the existing include-based Source dimension.
 */
export function SourceExclusionFilter({
  category,
  options,
}: {
  category: string;
  options: FilterOption[];
}) {
  const excluded = useSourceExclusions((s) => s.excluded[category] ?? EMPTY);
  const toggle = useSourceExclusions((s) => s.toggle);
  const clear = useSourceExclusions((s) => s.clear);
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border-subtle">
      <div className="flex items-center justify-between px-3 py-1.5">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-fg-muted hover:text-fg"
        >
          <span className="text-fg-faint">{open ? "▾" : "▸"}</span>
          Exclude Books
          {excluded.size > 0 && (
            <span className="rounded-full bg-red-500/15 px-1.5 text-[10px] text-red-400">
              {excluded.size}
            </span>
          )}
        </button>
        {excluded.size > 0 && (
          <button
            type="button"
            onClick={() => clear(category)}
            className="text-[11px] text-fg-faint hover:text-fg-muted"
          >
            clear
          </button>
        )}
      </div>
      {open && (
        <div className="flex flex-wrap gap-1 px-3 pb-2.5">
          {options.map((opt) => {
            const active = excluded.has(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(category, opt.value)}
                className={`rounded-full border px-2 py-0.5 text-xs transition-colors ${
                  active
                    ? "border-red-500/60 bg-red-500/15 text-red-400 line-through"
                    : "border-border text-fg-muted hover:border-border-strong hover:text-fg"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const EMPTY = new Set<string>();
