import { useMemo, useState } from "react";
import { useConditions } from "@/data/DataLoader";
import { makeRef } from "@/data/entityRefs";
import ConditionStatBlock from "@/components/StatBlock/ConditionStatBlock";
import { ConditionFilterSidebar, conditionMatchesFilters } from "@/components/filters/ConditionFilterSidebar";
import { useConditionFilters } from "@/state/conditionFilters";
import { sourceToAbv } from "@/lib/spellFormatters";
import Centered from "@/components/layout/Centered";
import MasterDetailLayout from "@/components/layout/MasterDetailLayout";
import ListSearchBar from "@/components/layout/ListSearchBar";
import ColumnHeader, { type ColumnDef } from "@/components/list/ColumnHeader";
import { useMasterDetail } from "@/hooks/useMasterDetail";

/**
 * Responsive conditions browser with source filter.
 */
export default function ConditionsPage() {
  const { data, isLoading, error } = useConditions();
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const { selectedKey, isMobileDetail, setIsMobileDetail, select } = useMasterDetail();

  const conditions = data?.entities ?? [];
  const filterSnapshot = useConditionFilters();
  const filterActive = filterSnapshot.activeCount();

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out = conditions.filter((c) => {
      if (!conditionMatchesFilters(c, filterSnapshot)) return false;
      if (q && !c.name.toLowerCase().includes(q)) return false;
      return true;
    });
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }, [conditions, search, filterSnapshot]);

  const selected = useMemo(
    () => conditions.find((c) => makeRef(c.name, c.source) === selectedKey) ?? null,
    [conditions, selectedKey],
  );

  if (isLoading) return <Centered>Loading conditions…</Centered>;
  if (error)
    return (
      <Centered>
        <div className="text-red-400">Failed to load: {String(error.message)}</div>
      </Centered>
    );

  const columns: ColumnDef[] = [
    { label: "Condition", className: "flex-1" },
    { label: "Src", title: "Source", className: "w-12 shrink-0 text-right" },
  ];

  return (
    <MasterDetailLayout
      isMobileDetail={isMobileDetail}
      onBack={() => setIsMobileDetail(false)}
      backLabel="Conditions"
      listWidth="md:w-80"
      list={
        <>
          <div className="border-b border-border p-2">
            <ListSearchBar
              search={search}
              onSearchChange={setSearch}
              placeholder={`Search ${conditions.length} conditions…`}
              filterActive={filterActive}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters((s) => !s)}
            />
          </div>
          {showFilters && (
            <div className="max-h-[40vh] shrink-0 overflow-y-auto border-b border-border bg-bg md:max-h-[50vh]">
              <ConditionFilterSidebar conditions={conditions} />
            </div>
          )}
          <ColumnHeader columns={columns} />
          <div className="flex-1 overflow-y-auto">
            {visible.map((c) => {
              const key = makeRef(c.name, c.source);
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
                  <span className="flex-1 truncate font-medium">{c.name}</span>
                  <span className="w-12 shrink-0 text-right text-xs text-fg-faint">{sourceToAbv(c.source)}</span>
                </button>
              );
            })}
            {visible.length === 0 && (
              <div className="p-4 text-center text-sm text-fg-muted">No conditions match.</div>
            )}
          </div>
          <div className="border-t border-border px-3 py-1 text-xs text-fg-muted">
            {visible.length} / {conditions.length} conditions
          </div>
        </>
      }
      detail={
        selected ? (
          <ConditionStatBlock condition={selected} />
        ) : (
          <Centered>
            <p className="text-fg-muted">Select a condition to view details.</p>
          </Centered>
        )
      }
    />
  );
}
