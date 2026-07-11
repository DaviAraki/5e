import { useEffect, useMemo, useState } from "react";
import type { Monster } from "@/types/entities";
import { useMonsters } from "@/data/DataLoader";
import MonsterStatBlock from "@/components/StatBlock/MonsterStatBlock";
import { BestiaryFilterSidebar, monsterMatchesFilters } from "@/components/filters/BestiaryFilterSidebar";
import { useBestiaryFilters } from "@/state/bestiaryFilters";
import { crToFull } from "@/lib/monsterFormatters";
import { sourceToAbv } from "@/lib/spellFormatters";

type SortKey = "name" | "cr";

/**
 * Responsive bestiary browser with filters.
 */
export default function BestiaryPage() {
  const { data, isLoading, error } = useMonsters();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [isMobileDetail, setIsMobileDetail] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const monsters = data?.entities ?? [];
  const filterSnapshot = useBestiaryFilters();
  const filterActive = filterSnapshot.activeCount();

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out = monsters.filter((m) => {
      if (!monsterMatchesFilters(m, filterSnapshot)) return false;
      if (q && !m.name.toLowerCase().includes(q)) return false;
      return true;
    });
    return out.sort((a, b) => {
      if (sortKey === "cr") return crSortValue(a.cr) - crSortValue(b.cr) || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    });
  }, [monsters, search, sortKey, filterSnapshot]);

  const selected = useMemo(
    () => monsters.find((m) => monsterKey(m) === selectedKey) ?? null,
    [monsters, selectedKey],
  );

  function selectMonster(key: string) {
    setSelectedKey(key);
    setIsMobileDetail(true);
  }

  useEffect(() => {
    if (!selectedKey) setIsMobileDetail(false);
  }, [selectedKey]);

  if (isLoading) return <Centered>Loading monsters…</Centered>;
  if (error)
    return (
      <Centered>
        <div className="text-red-400">
          Failed to load: {String(error.message)}
          <div className="mt-2 text-xs text-fg-muted">
            Did you run <code className="rounded bg-bg-raised px-1">npm run gen</code>?
          </div>
        </div>
      </Centered>
    );

  return (
    <div className="flex h-full">
      {/* LIST PANE */}
      <aside
        className={`${
          isMobileDetail ? "hidden md:flex" : "flex"
        } w-full flex-col border-border bg-bg-subtle md:w-80 md:shrink-0 md:border-r`}
      >
        <div className="border-b border-border p-2">
          <div className="flex gap-2">
            <input
              type="search"
              placeholder={`Search ${monsters.length} monsters…`}
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
            {(["name", "cr"] as SortKey[]).map((k) => (
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
                {k === "cr" ? "Challenge" : k}
              </button>
            ))}
          </div>
        </div>

        {/* Collapsible filter panel */}
        {showFilters && (
          <div className="max-h-[40vh] shrink-0 overflow-y-auto border-b border-border bg-bg md:max-h-[50vh]">
            <BestiaryFilterSidebar monsters={monsters} />
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          {visible.map((m) => {
            const key = monsterKey(m);
            const active = key === selectedKey;
            return (
              <button
                key={key}
                type="button"
                onClick={() => selectMonster(key)}
                className={`flex w-full items-center gap-2 border-b border-border-subtle px-3 py-1.5 text-left text-sm transition-colors ${
                  active ? "bg-accent-subtle" : "hover:bg-bg-raised"
                }`}
              >
                <span className="flex-1 truncate font-medium">{m.name}</span>
                <span className="shrink-0 text-xs font-semibold text-accent">
                  CR {crToFull(m.cr)}
                </span>
                <span className="shrink-0 text-xs text-fg-faint">
                  {sourceToAbv(m.source)}
                </span>
              </button>
            );
          })}
          {visible.length === 0 && (
            <div className="p-4 text-center text-sm text-fg-muted">No monsters match.</div>
          )}
        </div>
        <div className="border-t border-border px-3 py-1 text-xs text-fg-muted">
          {visible.length} / {monsters.length} monsters
        </div>
      </aside>

      {/* DETAIL PANE */}
      <section
        className={`${
          isMobileDetail ? "flex" : "hidden md:flex"
        } absolute inset-0 top-0 z-10 flex-1 flex-col overflow-hidden bg-bg md:static md:z-auto`}
      >
        <div className="flex items-center border-b border-border bg-bg-subtle px-2 py-2 md:hidden">
          <button
            type="button"
            onClick={() => setIsMobileDetail(false)}
            className="flex items-center gap-1 rounded-md px-3 py-1 text-sm text-accent hover:bg-bg-raised"
          >
            <span aria-hidden>←</span> Bestiary
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {selected ? (
            <MonsterStatBlock monster={selected} />
          ) : (
            <Centered>
              <p className="text-fg-muted">Select a monster to view details.</p>
            </Centered>
          )}
        </div>
      </section>
    </div>
  );
}

function monsterKey(m: Monster): string {
  return `${m.name}|${m.source}`;
}

/** Sort weight for CR — handles fractions (1/4 = 0.25) and objects. */
function crSortValue(cr: Monster["cr"]): number {
  if (cr == null) return 999;
  const crStr = typeof cr === "string" ? cr : String(cr.cr);
  const num = parseFloat(crStr);
  if (!Number.isNaN(num)) return num;
  // Fractional like "1/4"
  const parts = crStr.split("/").map(Number);
  if (parts.length === 2 && parts[1]) {
    return (parts[0] ?? 0) / parts[1];
  }
  return 999;
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center text-fg-muted">{children}</div>
  );
}
