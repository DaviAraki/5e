import { useMemo, useState } from "react";
import { useLegendaryGroups } from "@/data/DataLoader";
import { makeRef } from "@/data/entityRefs";
import LegendaryGroupStatBlock from "@/components/StatBlock/LegendaryGroupStatBlock";
import { LegendaryGroupFilterSidebar, legendaryGroupMatchesFilters } from "@/components/filters/LegendaryGroupFilterSidebar";
import { useLegendaryGroupFilters } from "@/state/legendaryGroupFilters";
import { sourceToAbv } from "@/lib/spellFormatters";
import Centered from "@/components/layout/Centered";
import MasterDetailLayout from "@/components/layout/MasterDetailLayout";
import ListSearchBar from "@/components/layout/ListSearchBar";
import ColumnHeader, { type ColumnDef } from "@/components/list/ColumnHeader";
import { useMasterDetail } from "@/hooks/useMasterDetail";

/**
 * Responsive legendary groups browser with source filter.
 */
export default function LegendaryGroupsPage() {
  const { data, isLoading, error } = useLegendaryGroups();
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const { selectedKey, isMobileDetail, setIsMobileDetail, select } = useMasterDetail();

  const groups = data?.entities ?? [];
  const filterSnapshot = useLegendaryGroupFilters();
  const filterActive = filterSnapshot.activeCount();

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out = groups.filter((g) => {
      if (!legendaryGroupMatchesFilters(g, filterSnapshot)) return false;
      if (q && !g.name.toLowerCase().includes(q)) return false;
      return true;
    });
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }, [groups, search, filterSnapshot]);

  const selected = useMemo(
    () => groups.find((g) => makeRef(g.name, g.source) === selectedKey) ?? null,
    [groups, selectedKey],
  );

  if (isLoading) return <Centered>Loading legendary groups…</Centered>;
  if (error)
    return (
      <Centered>
        <div className="text-red-400">Failed to load: {String(error.message)}</div>
      </Centered>
    );

  const columns: ColumnDef[] = [
    { label: "Group", className: "flex-1" },
    { label: "Src", title: "Source", className: "w-12 shrink-0 text-right" },
  ];

  return (
    <MasterDetailLayout
      isMobileDetail={isMobileDetail}
      onBack={() => setIsMobileDetail(false)}
      backLabel="Legendary Groups"
      listWidth="md:w-80"
      list={
        <>
          <div className="border-b border-border p-2">
            <ListSearchBar
              search={search}
              onSearchChange={setSearch}
              placeholder={`Search ${groups.length} legendary groups…`}
              filterActive={filterActive}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters((s) => !s)}
            />
          </div>
          {showFilters && (
            <div className="max-h-[40vh] shrink-0 overflow-y-auto border-b border-border bg-bg md:max-h-[50vh]">
              <LegendaryGroupFilterSidebar groups={groups} />
            </div>
          )}
          <ColumnHeader columns={columns} />
          <div className="flex-1 overflow-y-auto">
            {visible.map((g) => {
              const key = makeRef(g.name, g.source);
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
                  <span className="flex-1 truncate font-medium">{g.name}</span>
                  <span className="w-12 shrink-0 text-right text-xs text-fg-faint">{sourceToAbv(g.source)}</span>
                </button>
              );
            })}
            {visible.length === 0 && (
              <div className="p-4 text-center text-sm text-fg-muted">No legendary groups match.</div>
            )}
          </div>
          <div className="border-t border-border px-3 py-1 text-xs text-fg-muted">
            {visible.length} / {groups.length} legendary groups
          </div>
        </>
      }
      detail={
        selected ? (
          <LegendaryGroupStatBlock group={selected} />
        ) : (
          <Centered>
            <p className="text-fg-muted">Select a legendary group to view details.</p>
          </Centered>
        )
      }
    />
  );
}
