import { useMemo, useState } from "react";
import { useFeats } from "@/data/DataLoader";
import { makeRef } from "@/data/entityRefs";
import FeatStatBlock from "@/components/StatBlock/FeatStatBlock";
import { FeatFilterSidebar, featMatchesFilters } from "@/components/filters/FeatFilterSidebar";
import { useFeatFilters } from "@/state/featFilters";
import { useExcludedSources } from "@/state/sourceExclusions";
import { categoryToFull } from "@/lib/featFormatters";
import { sourceToAbv } from "@/lib/spellFormatters";
import Centered from "@/components/layout/Centered";
import MasterDetailLayout from "@/components/layout/MasterDetailLayout";
import ListSearchBar from "@/components/layout/ListSearchBar";
import ColumnHeader, { type ColumnDef } from "@/components/list/ColumnHeader";
import { useMasterDetail } from "@/hooks/useMasterDetail";

/**
 * Responsive feats browser with filters.
 */
export default function FeatsPage() {
  const { data, isLoading, error } = useFeats();
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const { selectedKey, isMobileDetail, setIsMobileDetail, select } = useMasterDetail();

  const feats = data?.entities ?? [];
  const filterSnapshot = useFeatFilters();
  const filterActive = filterSnapshot.activeCount();
  const excludedSources = useExcludedSources("feats");

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out = feats.filter((f) => {
      if (!featMatchesFilters(f, filterSnapshot)) return false;
      if (excludedSources.has(f.source)) return false;
      if (q && !f.name.toLowerCase().includes(q)) return false;
      return true;
    });
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }, [feats, search, filterSnapshot, excludedSources]);

  const selected = useMemo(
    () => feats.find((f) => makeRef(f.name, f.source) === selectedKey) ?? null,
    [feats, selectedKey],
  );

  if (isLoading) return <Centered>Loading feats…</Centered>;
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
    { label: "Feat", className: "flex-1" },
    { label: "Cat", title: "Category", className: "w-16 shrink-0 text-center" },
    { label: "Src", title: "Source", className: "w-12 shrink-0 text-right" },
  ];

  return (
    <MasterDetailLayout
      isMobileDetail={isMobileDetail}
      onBack={() => setIsMobileDetail(false)}
      backLabel="Feats"
      listWidth="md:w-80"
      list={
        <>
          <div className="border-b border-border p-2">
            <ListSearchBar
              search={search}
              onSearchChange={setSearch}
              placeholder={`Search ${feats.length} feats…`}
              filterActive={filterActive}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters((s) => !s)}
            />
          </div>

          {showFilters && (
            <div className="max-h-[40vh] shrink-0 overflow-y-auto border-b border-border bg-bg md:max-h-[50vh]">
              <FeatFilterSidebar feats={feats} />
            </div>
          )}

          <ColumnHeader columns={columns} />

          <div className="flex-1 overflow-y-auto">
            {visible.map((f) => {
              const key = makeRef(f.name, f.source);
              const active = key === selectedKey;
              const cat = f.category ? categoryToFull(f.category).slice(0, 4) : "—";
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => select(key)}
                  className={`flex w-full items-center gap-2 border-b border-border-subtle px-3 py-1.5 text-left text-sm transition-colors ${
                    active ? "bg-accent-subtle" : "hover:bg-bg-raised"
                  }`}
                >
                  <span className="flex-1 truncate font-medium">{f.name}</span>
                  {f.repeatable && (
                    <span className="text-xs text-accent" title="Repeatable">↻</span>
                  )}
                  <span className="w-16 shrink-0 text-center text-xs text-fg-muted">{cat}</span>
                  <span className="w-12 shrink-0 text-right text-xs text-fg-faint">{sourceToAbv(f.source)}</span>
                </button>
              );
            })}
            {visible.length === 0 && (
              <div className="p-4 text-center text-sm text-fg-muted">No feats match.</div>
            )}
          </div>
          <div className="border-t border-border px-3 py-1 text-xs text-fg-muted">
            {visible.length} / {feats.length} feats
          </div>
        </>
      }
      detail={
        selected ? (
          <FeatStatBlock feat={selected} />
        ) : (
          <Centered>
            <p className="text-fg-muted">Select a feat to view details.</p>
          </Centered>
        )
      }
    />
  );
}
