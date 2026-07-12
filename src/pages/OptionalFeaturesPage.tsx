import { useMemo, useState } from "react";
import { useOptionalFeatures } from "@/data/DataLoader";
import { makeRef } from "@/data/entityRefs";
import OptionalFeatureStatBlock from "@/components/StatBlock/OptionalFeatureStatBlock";
import { OptionalFeatureFilterSidebar, optionalFeatureMatchesFilters } from "@/components/filters/OptionalFeatureFilterSidebar";
import { useOptionalFeatureFilters } from "@/state/optionalFeatureFilters";
import { sourceToAbv } from "@/lib/spellFormatters";
import Centered from "@/components/layout/Centered";
import MasterDetailLayout from "@/components/layout/MasterDetailLayout";
import ListSearchBar from "@/components/layout/ListSearchBar";
import ColumnHeader, { type ColumnDef } from "@/components/list/ColumnHeader";
import { useMasterDetail } from "@/hooks/useMasterDetail";

/**
 * Responsive optional-features browser with feature-type and source filters.
 * Includes Grim Hollow transformation boons/flaws, monster grimoire
 * specializations, and fighting-style options.
 */
export default function OptionalFeaturesPage() {
  const { data, isLoading, error } = useOptionalFeatures();
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const { selectedKey, isMobileDetail, setIsMobileDetail, select } = useMasterDetail();

  const features = data?.entities ?? [];
  const filterSnapshot = useOptionalFeatureFilters();
  const filterActive = filterSnapshot.activeCount();

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out = features.filter((f) => {
      if (!optionalFeatureMatchesFilters(f, filterSnapshot)) return false;
      if (q && !f.name.toLowerCase().includes(q)) return false;
      return true;
    });
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }, [features, search, filterSnapshot]);

  const selected = useMemo(
    () => features.find((f) => makeRef(f.name, f.source) === selectedKey) ?? null,
    [features, selectedKey],
  );

  if (isLoading) return <Centered>Loading optional features…</Centered>;
  if (error)
    return (
      <Centered>
        <div className="text-red-400">Failed to load: {String(error.message)}</div>
      </Centered>
    );

  const columns: ColumnDef[] = [
    { label: "Feature", className: "flex-1" },
    { label: "Type", className: "w-20 shrink-0 truncate" },
    { label: "Src", title: "Source", className: "w-12 shrink-0 text-right" },
  ];

  return (
    <MasterDetailLayout
      isMobileDetail={isMobileDetail}
      onBack={() => setIsMobileDetail(false)}
      backLabel="Optional Features"
      listWidth="md:w-96"
      list={
        <>
          <div className="border-b border-border p-2">
            <ListSearchBar
              search={search}
              onSearchChange={setSearch}
              placeholder={`Search ${features.length} optional features…`}
              filterActive={filterActive}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters((s) => !s)}
            />
          </div>
          {showFilters && (
            <div className="max-h-[40vh] shrink-0 overflow-y-auto border-b border-border bg-bg md:max-h-[50vh]">
              <OptionalFeatureFilterSidebar features={features} />
            </div>
          )}
          <ColumnHeader columns={columns} />
          <div className="flex-1 overflow-y-auto">
            {visible.map((f) => {
              const key = makeRef(f.name, f.source);
              const active = key === selectedKey;
              const type = f.featureType?.[0];
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
                  <span className="w-20 shrink-0 truncate text-xs text-fg-muted">{type ?? "—"}</span>
                  <span className="w-12 shrink-0 text-right text-xs text-fg-faint">{sourceToAbv(f.source)}</span>
                </button>
              );
            })}
            {visible.length === 0 && (
              <div className="p-4 text-center text-sm text-fg-muted">No optional features match.</div>
            )}
          </div>
          <div className="border-t border-border px-3 py-1 text-xs text-fg-muted">
            {visible.length} / {features.length} optional features
          </div>
        </>
      }
      detail={
        selected ? (
          <OptionalFeatureStatBlock feature={selected} />
        ) : (
          <Centered>
            <p className="text-fg-muted">Select an optional feature to view details.</p>
          </Centered>
        )
      }
    />
  );
}
