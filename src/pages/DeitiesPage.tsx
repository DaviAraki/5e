import { useMemo, useState } from "react";
import { useDeities } from "@/data/DataLoader";
import { makeRef } from "@/data/entityRefs";
import DeityStatBlock from "@/components/StatBlock/DeityStatBlock";
import { DeityFilterSidebar, deityMatchesFilters } from "@/components/filters/DeityFilterSidebar";
import { useDeityFilters } from "@/state/deityFilters";
import { useExcludedSources } from "@/state/sourceExclusions";
import { sourceToAbv } from "@/lib/spellFormatters";
import Centered from "@/components/layout/Centered";
import MasterDetailLayout from "@/components/layout/MasterDetailLayout";
import ListSearchBar from "@/components/layout/ListSearchBar";
import ColumnHeader, { type ColumnDef } from "@/components/list/ColumnHeader";
import { useMasterDetail } from "@/hooks/useMasterDetail";

/**
 * Responsive deities browser with pantheon and source filters.
 */
export default function DeitiesPage() {
  const { data, isLoading, error } = useDeities();
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const { selectedKey, isMobileDetail, setIsMobileDetail, select } = useMasterDetail();

  const deities = data?.entities ?? [];
  const filterSnapshot = useDeityFilters();
  const filterActive = filterSnapshot.activeCount();
  const excludedSources = useExcludedSources("deities");

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out = deities.filter((d) => {
      if (!deityMatchesFilters(d, filterSnapshot)) return false;
      if (excludedSources.has(d.source)) return false;
      if (q && !d.name.toLowerCase().includes(q)) return false;
      return true;
    });
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }, [deities, search, filterSnapshot, excludedSources]);

  const selected = useMemo(
    () => deities.find((d) => makeRef(d.name, d.source) === selectedKey) ?? null,
    [deities, selectedKey],
  );

  if (isLoading) return <Centered>Loading deities…</Centered>;
  if (error)
    return (
      <Centered>
        <div className="text-red-400">Failed to load: {String(error.message)}</div>
      </Centered>
    );

  const columns: ColumnDef[] = [
    { label: "Deity", className: "flex-1" },
    { label: "Pantheon", className: "w-24 shrink-0 truncate" },
    { label: "Src", title: "Source", className: "w-12 shrink-0 text-right" },
  ];

  return (
    <MasterDetailLayout
      isMobileDetail={isMobileDetail}
      onBack={() => setIsMobileDetail(false)}
      backLabel="Deities"
      listWidth="md:w-96"
      list={
        <>
          <div className="border-b border-border p-2">
            <ListSearchBar
              search={search}
              onSearchChange={setSearch}
              placeholder={`Search ${deities.length} deities…`}
              filterActive={filterActive}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters((s) => !s)}
            />
          </div>
          {showFilters && (
            <div className="max-h-[40vh] shrink-0 overflow-y-auto border-b border-border bg-bg md:max-h-[50vh]">
              <DeityFilterSidebar deities={deities} />
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
                  <span className="w-24 shrink-0 truncate text-xs text-fg-muted">{d.pantheon ?? "—"}</span>
                  <span className="w-12 shrink-0 text-right text-xs text-fg-faint">{sourceToAbv(d.source)}</span>
                </button>
              );
            })}
            {visible.length === 0 && (
              <div className="p-4 text-center text-sm text-fg-muted">No deities match.</div>
            )}
          </div>
          <div className="border-t border-border px-3 py-1 text-xs text-fg-muted">
            {visible.length} / {deities.length} deities
          </div>
        </>
      }
      detail={
        selected ? (
          <DeityStatBlock deity={selected} />
        ) : (
          <Centered>
            <p className="text-fg-muted">Select a deity to view details.</p>
          </Centered>
        )
      }
    />
  );
}
