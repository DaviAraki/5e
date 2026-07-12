import { useMemo, useState } from "react";
import { useBackgrounds } from "@/data/DataLoader";
import { makeRef } from "@/data/entityRefs";
import BackgroundStatBlock from "@/components/StatBlock/BackgroundStatBlock";
import { BackgroundFilterSidebar, backgroundMatchesFilters } from "@/components/filters/BackgroundFilterSidebar";
import { useBackgroundFilters } from "@/state/backgroundFilters";
import { useExcludedSources } from "@/state/sourceExclusions";
import { sourceToAbv } from "@/lib/spellFormatters";
import Centered from "@/components/layout/Centered";
import MasterDetailLayout from "@/components/layout/MasterDetailLayout";
import ListSearchBar from "@/components/layout/ListSearchBar";
import { useMasterDetail } from "@/hooks/useMasterDetail";

/**
 * Responsive background browser with filters.
 */
export default function BackgroundsPage() {
  const { data, isLoading, error } = useBackgrounds();
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const { selectedKey, isMobileDetail, setIsMobileDetail, select } = useMasterDetail();

  const backgrounds = data?.entities ?? [];
  const filterSnapshot = useBackgroundFilters();
  const filterActive = filterSnapshot.activeCount();
  const excludedSources = useExcludedSources("backgrounds");

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out = backgrounds.filter((b) => {
      if (!backgroundMatchesFilters(b, filterSnapshot)) return false;
      if (excludedSources.has(b.source)) return false;
      if (q && !b.name.toLowerCase().includes(q)) return false;
      return true;
    });
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }, [backgrounds, search, filterSnapshot, excludedSources]);

  const selected = useMemo(
    () => backgrounds.find((b) => makeRef(b.name, b.source) === selectedKey) ?? null,
    [backgrounds, selectedKey],
  );

  if (isLoading) return <Centered>Loading backgrounds…</Centered>;
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
    <MasterDetailLayout
      isMobileDetail={isMobileDetail}
      onBack={() => setIsMobileDetail(false)}
      backLabel="Backgrounds"
      listWidth="md:w-72"
      list={
        <>
          <div className="border-b border-border p-2">
            <ListSearchBar
              search={search}
              onSearchChange={setSearch}
              placeholder={`Search ${backgrounds.length} backgrounds…`}
              filterActive={filterActive}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters((s) => !s)}
            />
          </div>

          {showFilters && (
            <div className="max-h-[40vh] shrink-0 overflow-y-auto border-b border-border bg-bg md:max-h-[50vh]">
              <BackgroundFilterSidebar backgrounds={backgrounds} />
            </div>
          )}
          <div className="flex-1 overflow-y-auto">
            {visible.map((b) => {
              const key = makeRef(b.name, b.source);
              const active = key === selectedKey;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => select(key)}
                  className={`flex w-full items-center gap-2 border-b border-border-subtle px-3 py-2 text-left text-sm transition-colors ${
                    active ? "bg-accent-subtle" : "hover:bg-bg-raised"
                  }`}
                >
                  <span className="flex-1 truncate font-medium">{b.name}</span>
                  <span className="shrink-0 text-xs text-fg-faint">
                    {sourceToAbv(b.source)}
                  </span>
                </button>
              );
            })}
            {visible.length === 0 && (
              <div className="p-4 text-center text-sm text-fg-muted">No backgrounds match.</div>
            )}
          </div>
          <div className="border-t border-border px-3 py-1 text-xs text-fg-muted">
            {visible.length} / {backgrounds.length} backgrounds
          </div>
        </>
      }
      detail={
        selected ? (
          <BackgroundStatBlock bg={selected} />
        ) : (
          <Centered>
            <p className="text-fg-muted">Select a background to view details.</p>
          </Centered>
        )
      }
    />
  );
}
