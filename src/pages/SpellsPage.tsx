import { useEffect, useMemo, useState } from "react";
import type { Spell } from "@/types/entities";
import { useSpells } from "@/data/DataLoader";
import SpellStatBlock from "@/components/StatBlock/SpellStatBlock";
import { SpellFilterSidebar, spellMatchesFilters } from "@/components/filters/SpellFilterSidebar";
import { useSpellFilters } from "@/state/spellFilters";
import {
  spTimeToShort,
  spSchoolToAbv,
  sourceToAbv,
  isConcentration,
} from "@/lib/spellFormatters";

type SortKey = "name" | "level" | "school" | "time";

/**
 * Responsive layout with filters.
 * - Desktop (lg+): filters | list | detail side by side.
 * - Tablet/mobile: list full-width; a Filters toggle reveals the sidebar
 *   overlay, and tapping a spell slides detail in.
 */
export default function SpellsPage() {
  const { data, isLoading, error } = useSpells();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [isMobileDetail, setIsMobileDetail] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const spells = data?.entities ?? [];

  // Read filter store reactively (subscribe to all sets via a shallow snapshot).
  const filterSnapshot = useSpellFilters();
  const filterActive = filterSnapshot.activeCount();

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out = spells.filter((s) => {
      if (!spellMatchesFilters(s, filterSnapshot)) return false;
      if (q) {
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesSchool = spSchoolToAbv(s.school).toLowerCase().includes(q);
        if (!matchesName && !matchesSchool) return false;
      }
      return true;
    });
    return out.sort((a, b) => compareSpells(a, b, sortKey));
  }, [spells, search, sortKey, filterSnapshot]);

  const selected = useMemo(
    () => spells.find((s) => spellKey(s) === selectedKey) ?? null,
    [spells, selectedKey],
  );

  /** Selecting a spell: store it and, on mobile, switch to detail view. */
  function selectSpell(key: string) {
    setSelectedKey(key);
    setIsMobileDetail(true);
  }

  /** Back button on mobile detail: return to the list. */
  function backToList() {
    setIsMobileDetail(false);
  }

  // When the selected spell clears, make sure mobile returns to list.
  useEffect(() => {
    if (!selectedKey) setIsMobileDetail(false);
  }, [selectedKey]);

  if (isLoading) return <Centered>Loading spells…</Centered>;
  if (error)
    return (
      <Centered>
        <div className="text-red-400">
          Failed to load: {String(error.message)}
          <div className="mt-2 text-xs text-fg-muted">
            Did you run <code className="rounded bg-bg-raised px-1">npm run gen</code> in apps/web?
          </div>
        </div>
      </Centered>
    );

  return (
    <div className="flex h-full">
      {/* LIST PANE */}
      {/* On mobile: hidden when detail is open. On desktop: always visible. */}
      <aside
        className={`${
          isMobileDetail ? "hidden md:flex" : "flex"
        } w-full flex-col border-border bg-bg-subtle md:w-96 md:shrink-0 md:border-r`}
      >
        <div className="border-b border-border p-2">
          <div className="flex gap-2">
            <input
              type="search"
              placeholder={`Search ${spells.length} spells…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-w-0 flex-1 rounded-md border border-border bg-bg-raised px-3 py-1.5 text-sm outline-none placeholder:text-fg-faint focus:border-accent"
            />
            <button
              type="button"
              onClick={() => setShowFilters((s) => !s)}
              className={`flex shrink-0 items-center gap-1 rounded-md border px-2.5 py-1.5 text-sm transition-colors ${
                showFilters || filterActive > 0
                  ? "border-accent bg-accent-subtle text-accent"
                  : "border-border text-fg-muted hover:text-fg"
              }`}
              title="Toggle filters"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M1.5 3.5h13M3.5 8h9M6 12.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {filterActive > 0 ? filterActive : ""}
            </button>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs">
            <span className="text-fg-muted">Sort:</span>
            {(["name", "level", "school", "time"] as SortKey[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setSortKey(k)}
                className={`rounded px-2 py-0.5 capitalize ${
                  sortKey === k
                    ? "bg-accent-subtle text-accent"
                    : "text-fg-muted hover:bg-bg-raised"
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        {/* Collapsible filter panel */}
        {showFilters && (
          <div className="max-h-[40vh] shrink-0 overflow-y-auto border-b border-border bg-bg md:max-h-[50vh]">
            <SpellFilterSidebar spells={spells} />
          </div>
        )}

        {/* Column header — fixed above the scrollable list.
            Wider gap-3 and w-8 on Conc so labels don't collide. */}
        <div className="flex items-center gap-3 border-b border-border bg-bg-raised px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-fg-faint">
          <span className="w-6 shrink-0 text-center" title="Spell level (C = cantrip)">
            Lvl
          </span>
          <span className="flex-1">Name</span>
          <span className="w-8 shrink-0 text-center" title="Requires concentration">
            Conc
          </span>
          <span className="w-14 shrink-0 text-right" title="School of magic">
            School
          </span>
          <span className="w-12 shrink-0 text-right" title="Casting time">
            Cast
          </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {visible.map((spell) => {
            const key = spellKey(spell);
            const active = key === selectedKey;
            return (
              <button
                key={key}
                type="button"
                onClick={() => selectSpell(key)}
                className={`flex w-full items-center gap-3 border-b border-border-subtle px-3 py-1.5 text-left text-sm transition-colors ${
                  active ? "bg-accent-subtle" : "hover:bg-bg-raised"
                }`}
              >
                <span
                  className={`w-6 shrink-0 text-center text-xs font-semibold ${
                    spell.level === 0 ? "text-fg-muted" : "text-accent"
                  }`}
                >
                  {spell.level === 0 ? "C" : spell.level}
                </span>
                <span className="flex-1 truncate font-medium">{spell.name}</span>
                <span className="w-8 shrink-0 text-center">
                  {isConcentration(spell) ? (
                    <span title="Concentration" className="text-xs font-bold text-accent">
                      C
                    </span>
                  ) : null}
                </span>
                <span className="w-14 shrink-0 text-right text-xs text-fg-muted">
                  {spSchoolToAbv(spell.school)}
                </span>
                <span className="w-12 shrink-0 text-right text-xs text-fg-muted">
                  {spell.time[0] ? spTimeToShort(spell.time[0]) : ""}
                </span>
              </button>
            );
          })}
          {visible.length === 0 && (
            <div className="p-4 text-center text-sm text-fg-muted">No spells match.</div>
          )}
        </div>
        <div className="border-t border-border px-3 py-1 text-xs text-fg-muted">
          {visible.length} / {spells.length} spells
        </div>
      </aside>

      {/* DETAIL PANE */}
      {/* On mobile: shown full-width when a spell is selected. On desktop: always visible beside the list. */}
      <section
        className={`${
          isMobileDetail ? "flex" : "hidden md:flex"
        } absolute inset-0 top-0 z-10 flex-1 flex-col overflow-hidden bg-bg md:static md:z-auto`}
      >
        {/* Mobile back bar */}
        <div className="flex items-center border-b border-border bg-bg-subtle px-2 py-2 md:hidden">
          <button
            type="button"
            onClick={backToList}
            className="flex items-center gap-1 rounded-md px-3 py-1 text-sm text-accent hover:bg-bg-raised"
          >
            <span aria-hidden>←</span> Spells
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {selected ? (
            <SpellStatBlock spell={selected} />
          ) : (
            <Centered>
              <div className="text-center">
                <p className="text-fg-muted">Select a spell to view details.</p>
                <p className="mt-1 text-xs text-fg-faint">
                  {visible.length} spells loaded
                  {spells[0] ? ` from ${sourceToAbv(spells[0].source)}…` : "…"}
                </p>
              </div>
            </Centered>
          )}
        </div>
      </section>
    </div>
  );
}

function spellKey(s: Spell): string {
  return `${s.name}|${s.source}`;
}

function compareSpells(a: Spell, b: Spell, key: SortKey): number {
  switch (key) {
    case "name":
      return a.name.localeCompare(b.name);
    case "level":
      return a.level - b.level || a.name.localeCompare(b.name);
    case "school":
      return a.school.localeCompare(b.school) || a.name.localeCompare(b.name);
    case "time":
      return (
        timeSortValue(a.time[0]) - timeSortValue(b.time[0]) ||
        a.name.localeCompare(b.name)
      );
    default:
      return 0;
  }
}

/** Normalised sort weight for casting time (action < bonus < reaction < min < hour). */
function timeSortValue(t: Spell["time"][number] | undefined): number {
  if (!t) return 999;
  const order: Record<string, number> = {
    action: 0,
    bonus: 1,
    "bonus action": 1,
    reaction: 2,
    round: 3,
    minute: 4,
    hour: 5,
  };
  return (order[t.unit] ?? 9) * 100 + t.number;
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center text-fg-muted">{children}</div>
  );
}
