import { useEffect, useMemo, useState } from "react";
import type { Species } from "@/types/entities";
import { useSpecies } from "@/data/DataLoader";
import SpeciesStatBlock from "@/components/StatBlock/SpeciesStatBlock";
import { SpeciesFilterSidebar, speciesMatchesFilters } from "@/components/filters/SpeciesFilterSidebar";
import { useSpeciesFilters } from "@/state/speciesFilters";
import { sourceToAbv } from "@/lib/spellFormatters";

/**
 * Responsive species browser with filters.
 */
export default function SpeciesPage() {
  const { data, isLoading, error } = useSpecies();
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [isMobileDetail, setIsMobileDetail] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const species = data?.entities ?? [];
  const filterSnapshot = useSpeciesFilters();
  const filterActive = filterSnapshot.activeCount();

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out = species.filter((s) => {
      if (!speciesMatchesFilters(s, filterSnapshot)) return false;
      if (q && !s.name.toLowerCase().includes(q)) return false;
      return true;
    });
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }, [species, search, filterSnapshot]);

  const selected = useMemo(
    () => species.find((s) => speciesKey(s) === selectedKey) ?? null,
    [species, selectedKey],
  );

  function selectSpecies(key: string) {
    setSelectedKey(key);
    setIsMobileDetail(true);
  }

  useEffect(() => {
    if (!selectedKey) setIsMobileDetail(false);
  }, [selectedKey]);

  if (isLoading) return <Centered>Loading species…</Centered>;
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
      <aside
        className={`${
          isMobileDetail ? "hidden md:flex" : "flex"
        } w-full flex-col border-border bg-bg-subtle md:w-80 md:shrink-0 md:border-r`}
      >
        <div className="border-b border-border p-2">
          <div className="flex gap-2">
            <input
              type="search"
              placeholder={`Search ${species.length} species…`}
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
        </div>

        {showFilters && (
          <div className="max-h-[40vh] shrink-0 overflow-y-auto border-b border-border bg-bg md:max-h-[50vh]">
            <SpeciesFilterSidebar species={species} />
          </div>
        )}

        <div className="flex items-center gap-2 border-b border-border bg-bg-raised px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-fg-faint">
          <span className="flex-1">Species</span>
          <span className="w-12 shrink-0 text-center" title="Size">Size</span>
          <span className="w-12 shrink-0 text-right" title="Source">Src</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {visible.map((s) => {
            const key = speciesKey(s);
            const active = key === selectedKey;
            const sizeLabel = s.size?.[0] ?? "—";
            return (
              <button
                key={key}
                type="button"
                onClick={() => selectSpecies(key)}
                className={`flex w-full items-center gap-2 border-b border-border-subtle px-3 py-1.5 text-left text-sm transition-colors ${
                  active ? "bg-accent-subtle" : "hover:bg-bg-raised"
                }`}
              >
                <span className="flex-1 truncate font-medium">{s.name}</span>
                <span className="w-12 shrink-0 text-center text-xs text-fg-muted">{sizeLabel}</span>
                <span className="w-12 shrink-0 text-right text-xs text-fg-faint">{sourceToAbv(s.source)}</span>
              </button>
            );
          })}
          {visible.length === 0 && (
            <div className="p-4 text-center text-sm text-fg-muted">No species match.</div>
          )}
        </div>
        <div className="border-t border-border px-3 py-1 text-xs text-fg-muted">
          {visible.length} / {species.length} species
        </div>
      </aside>

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
            <span aria-hidden>←</span> Species
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {selected ? (
            <SpeciesStatBlock species={selected} />
          ) : (
            <Centered>
              <p className="text-fg-muted">Select a species to view details.</p>
            </Centered>
          )}
        </div>
      </section>
    </div>
  );
}

function speciesKey(s: Species): string {
  return `${s.name}|${s.source}`;
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center text-fg-muted">{children}</div>
  );
}
