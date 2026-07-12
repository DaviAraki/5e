import { useMemo, useState } from "react";
import { useTables } from "@/data/DataLoader";
import { makeRef } from "@/data/entityRefs";
import TableStatBlock from "@/components/StatBlock/TableStatBlock";
import { TableFilterSidebar, tableMatchesFilters } from "@/components/filters/TableFilterSidebar";
import { useTableFilters } from "@/state/tableFilters";
import { useExcludedSources } from "@/state/sourceExclusions";
import { sourceToAbv } from "@/lib/spellFormatters";
import Centered from "@/components/layout/Centered";
import MasterDetailLayout from "@/components/layout/MasterDetailLayout";
import ListSearchBar from "@/components/layout/ListSearchBar";
import ColumnHeader, { type ColumnDef } from "@/components/list/ColumnHeader";
import { useMasterDetail } from "@/hooks/useMasterDetail";

/**
 * Responsive lookup-tables browser with source filter.
 */
export default function TablesPage() {
  const { data, isLoading, error } = useTables();
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const { selectedKey, isMobileDetail, setIsMobileDetail, select } = useMasterDetail();

  const tables = data?.entities ?? [];
  const filterSnapshot = useTableFilters();
  const filterActive = filterSnapshot.activeCount();
  const excludedSources = useExcludedSources("tables");

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out = tables.filter((t) => {
      if (!tableMatchesFilters(t, filterSnapshot)) return false;
      if (excludedSources.has(t.source)) return false;
      if (q && !t.name.toLowerCase().includes(q)) return false;
      return true;
    });
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }, [tables, search, filterSnapshot, excludedSources]);

  const selected = useMemo(
    () => tables.find((t) => makeRef(t.name, t.source) === selectedKey) ?? null,
    [tables, selectedKey],
  );

  if (isLoading) return <Centered>Loading tables…</Centered>;
  if (error)
    return (
      <Centered>
        <div className="text-red-400">Failed to load: {String(error.message)}</div>
      </Centered>
    );

  const columns: ColumnDef[] = [
    { label: "Table", className: "flex-1" },
    { label: "Src", title: "Source", className: "w-12 shrink-0 text-right" },
  ];

  return (
    <MasterDetailLayout
      isMobileDetail={isMobileDetail}
      onBack={() => setIsMobileDetail(false)}
      backLabel="Tables"
      listWidth="md:w-80"
      list={
        <>
          <div className="border-b border-border p-2">
            <ListSearchBar
              search={search}
              onSearchChange={setSearch}
              placeholder={`Search ${tables.length} tables…`}
              filterActive={filterActive}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters((s) => !s)}
            />
          </div>
          {showFilters && (
            <div className="max-h-[40vh] shrink-0 overflow-y-auto border-b border-border bg-bg md:max-h-[50vh]">
              <TableFilterSidebar tables={tables} />
            </div>
          )}
          <ColumnHeader columns={columns} />
          <div className="flex-1 overflow-y-auto">
            {visible.map((t) => {
              const key = makeRef(t.name, t.source);
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
                  <span className="flex-1 truncate font-medium">{t.name}</span>
                  <span className="w-12 shrink-0 text-right text-xs text-fg-faint">{sourceToAbv(t.source)}</span>
                </button>
              );
            })}
            {visible.length === 0 && (
              <div className="p-4 text-center text-sm text-fg-muted">No tables match.</div>
            )}
          </div>
          <div className="border-t border-border px-3 py-1 text-xs text-fg-muted">
            {visible.length} / {tables.length} tables
          </div>
        </>
      }
      detail={
        selected ? (
          <TableStatBlock table={selected} />
        ) : (
          <Centered>
            <p className="text-fg-muted">Select a table to view details.</p>
          </Centered>
        )
      }
    />
  );
}
