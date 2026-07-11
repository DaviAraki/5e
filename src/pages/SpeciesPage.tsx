import { useMemo, useState } from "react";
import { useSpecies } from "@/data/DataLoader";
import { makeRef } from "@/data/entityRefs";
import SpeciesStatBlock from "@/components/StatBlock/SpeciesStatBlock";
import { SpeciesFilterSidebar, speciesMatchesFilters } from "@/components/filters/SpeciesFilterSidebar";
import { useSpeciesFilters } from "@/state/speciesFilters";
import { sourceToAbv } from "@/lib/spellFormatters";
import Centered from "@/components/layout/Centered";
import MasterDetailLayout from "@/components/layout/MasterDetailLayout";
import ListSearchBar from "@/components/layout/ListSearchBar";
import ColumnHeader, { type ColumnDef } from "@/components/list/ColumnHeader";
import { useMasterDetail } from "@/hooks/useMasterDetail";

/**
 * Responsive species browser with filters.
 */
export default function SpeciesPage() {
  const { data, isLoading, error } = useSpecies();
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const { selectedKey, isMobileDetail, setIsMobileDetail, select } = useMasterDetail();

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
    () => species.find((s) => makeRef(s.name, s.source) === selectedKey) ?? null,
    [species, selectedKey],
  );

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

  const columns: ColumnDef[] = [
    { label: "Species", className: "flex-1" },
    { label: "Size", title: "Size", className: "w-12 shrink-0 text-center" },
    { label: "Src", title: "Source", className: "w-12 shrink-0 text-right" },
  ];

  return (
    <MasterDetailLayout
      isMobileDetail={isMobileDetail}
      onBack={() => setIsMobileDetail(false)}
      backLabel="Species"
      listWidth="md:w-80"
      list={
        <>
          <div className="border-b border-border p-2">
            <ListSearchBar
              search={search}
              onSearchChange={setSearch}
              placeholder={`Search ${species.length} species…`}
              filterActive={filterActive}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters((s) => !s)}
            />
          </div>

          {showFilters && (
            <div className="max-h-[40vh] shrink-0 overflow-y-auto border-b border-border bg-bg md:max-h-[50vh]">
              <SpeciesFilterSidebar species={species} />
            </div>
          )}

          <ColumnHeader columns={columns} />

          <div className="flex-1 overflow-y-auto">
            {visible.map((s) => {
              const key = makeRef(s.name, s.source);
              const active = key === selectedKey;
              const sizeLabel = s.size?.[0] ?? "—";
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => select(key)}
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
        </>
      }
      detail={
        selected ? (
          <SpeciesStatBlock species={selected} />
        ) : (
          <Centered>
            <p className="text-fg-muted">Select a species to view details.</p>
          </Centered>
        )
      }
    />
  );
}
