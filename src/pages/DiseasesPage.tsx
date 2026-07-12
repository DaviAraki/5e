import { useMemo, useState } from "react";
import { useDiseases } from "@/data/DataLoader";
import { makeRef } from "@/data/entityRefs";
import DiseaseStatBlock from "@/components/StatBlock/DiseaseStatBlock";
import { DiseaseFilterSidebar, diseaseMatchesFilters } from "@/components/filters/DiseaseFilterSidebar";
import { useDiseaseFilters } from "@/state/diseaseFilters";
import { sourceToAbv } from "@/lib/spellFormatters";
import Centered from "@/components/layout/Centered";
import MasterDetailLayout from "@/components/layout/MasterDetailLayout";
import ListSearchBar from "@/components/layout/ListSearchBar";
import ColumnHeader, { type ColumnDef } from "@/components/list/ColumnHeader";
import { useMasterDetail } from "@/hooks/useMasterDetail";

/**
 * Responsive diseases browser with source filter.
 */
export default function DiseasesPage() {
  const { data, isLoading, error } = useDiseases();
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const { selectedKey, isMobileDetail, setIsMobileDetail, select } = useMasterDetail();

  const diseases = data?.entities ?? [];
  const filterSnapshot = useDiseaseFilters();
  const filterActive = filterSnapshot.activeCount();

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out = diseases.filter((d) => {
      if (!diseaseMatchesFilters(d, filterSnapshot)) return false;
      if (q && !d.name.toLowerCase().includes(q)) return false;
      return true;
    });
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }, [diseases, search, filterSnapshot]);

  const selected = useMemo(
    () => diseases.find((d) => makeRef(d.name, d.source) === selectedKey) ?? null,
    [diseases, selectedKey],
  );

  if (isLoading) return <Centered>Loading diseases…</Centered>;
  if (error)
    return (
      <Centered>
        <div className="text-red-400">Failed to load: {String(error.message)}</div>
      </Centered>
    );

  const columns: ColumnDef[] = [
    { label: "Disease", className: "flex-1" },
    { label: "Src", title: "Source", className: "w-12 shrink-0 text-right" },
  ];

  return (
    <MasterDetailLayout
      isMobileDetail={isMobileDetail}
      onBack={() => setIsMobileDetail(false)}
      backLabel="Diseases"
      listWidth="md:w-80"
      list={
        <>
          <div className="border-b border-border p-2">
            <ListSearchBar
              search={search}
              onSearchChange={setSearch}
              placeholder={`Search ${diseases.length} diseases…`}
              filterActive={filterActive}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters((s) => !s)}
            />
          </div>
          {showFilters && (
            <div className="max-h-[40vh] shrink-0 overflow-y-auto border-b border-border bg-bg md:max-h-[50vh]">
              <DiseaseFilterSidebar diseases={diseases} />
            </div>
          )}
          <ColumnHeader columns={columns} />
          <div className="flex-1 overflow-y-auto">
            {visible.map((d) => {
              const key = makeRef(d.name, d.source);
              const active = key === selectedKey;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => select(key)}
                  className={`flex w-full items-center gap-2 border-b border-border-subtle px-3 py-1.5 text-left text-sm transition-colors ${
                    active ? "bg-accent-subtle" : "hover:bg-bg-raised"
                  }`}
                >
                  <span className="flex-1 truncate font-medium">{d.name}</span>
                  <span className="w-12 shrink-0 text-right text-xs text-fg-faint">{sourceToAbv(d.source)}</span>
                </button>
              );
            })}
            {visible.length === 0 && (
              <div className="p-4 text-center text-sm text-fg-muted">No diseases match.</div>
            )}
          </div>
          <div className="border-t border-border px-3 py-1 text-xs text-fg-muted">
            {visible.length} / {diseases.length} diseases
          </div>
        </>
      }
      detail={
        selected ? (
          <DiseaseStatBlock disease={selected} />
        ) : (
          <Centered>
            <p className="text-fg-muted">Select a disease to view details.</p>
          </Centered>
        )
      }
    />
  );
}
