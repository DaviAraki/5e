import { useMemo, useState } from "react";
import { useTransformations } from "@/data/DataLoader";
import { makeRef } from "@/data/entityRefs";
import TransformationStatBlock from "@/components/StatBlock/TransformationStatBlock";
import { TransformationFilterSidebar, transformationMatchesFilters } from "@/components/filters/TransformationFilterSidebar";
import { useTransformationFilters } from "@/state/transformationFilters";
import { useExcludedSources } from "@/state/sourceExclusions";
import { sourceToAbv } from "@/lib/spellFormatters";
import Centered from "@/components/layout/Centered";
import MasterDetailLayout from "@/components/layout/MasterDetailLayout";
import ListSearchBar from "@/components/layout/ListSearchBar";
import ColumnHeader, { type ColumnDef } from "@/components/list/ColumnHeader";
import { useMasterDetail } from "@/hooks/useMasterDetail";

/**
 * Responsive transformations browser with type and source filters.
 * Grim Hollow's signature mechanic: multi-stage character transformations.
 */
export default function TransformationsPage() {
  const { data, isLoading, error } = useTransformations();
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const { selectedKey, isMobileDetail, setIsMobileDetail, select } = useMasterDetail();

  const transformations = data?.entities ?? [];
  const filterSnapshot = useTransformationFilters();
  const filterActive = filterSnapshot.activeCount();
  const excludedSources = useExcludedSources("transformations");

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out = transformations.filter((t) => {
      if (!transformationMatchesFilters(t, filterSnapshot)) return false;
      if (excludedSources.has(t.source)) return false;
      if (q && !t.name.toLowerCase().includes(q)) return false;
      return true;
    });
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }, [transformations, search, filterSnapshot, excludedSources]);

  const selected = useMemo(
    () => transformations.find((t) => makeRef(t.name, t.source) === selectedKey) ?? null,
    [transformations, selectedKey],
  );

  if (isLoading) return <Centered>Loading transformations…</Centered>;
  if (error)
    return (
      <Centered>
        <div className="text-red-400">Failed to load: {String(error.message)}</div>
      </Centered>
    );

  const columns: ColumnDef[] = [
    { label: "Transformation", className: "flex-1" },
    { label: "Type", className: "w-24 shrink-0 truncate" },
    { label: "Src", title: "Source", className: "w-12 shrink-0 text-right" },
  ];

  return (
    <MasterDetailLayout
      isMobileDetail={isMobileDetail}
      onBack={() => setIsMobileDetail(false)}
      backLabel="Transformations"
      listWidth="md:w-96"
      list={
        <>
          <div className="border-b border-border p-2">
            <ListSearchBar
              search={search}
              onSearchChange={setSearch}
              placeholder={`Search ${transformations.length} transformations…`}
              filterActive={filterActive}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters((s) => !s)}
            />
          </div>
          {showFilters && (
            <div className="max-h-[40vh] shrink-0 overflow-y-auto border-b border-border bg-bg md:max-h-[50vh]">
              <TransformationFilterSidebar transformations={transformations} />
            </div>
          )}
          <ColumnHeader columns={columns} />
          <div className="flex-1 overflow-y-auto">
            {visible.map((t) => {
              const key = makeRef(t.name, t.source);
              const active = key === selectedKey;
              const type = t.optionType?.join(", ");
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
                  <span className="w-24 shrink-0 truncate text-xs text-fg-muted">{type ?? "—"}</span>
                  <span className="w-12 shrink-0 text-right text-xs text-fg-faint">{sourceToAbv(t.source)}</span>
                </button>
              );
            })}
            {visible.length === 0 && (
              <div className="p-4 text-center text-sm text-fg-muted">No transformations match.</div>
            )}
          </div>
          <div className="border-t border-border px-3 py-1 text-xs text-fg-muted">
            {visible.length} / {transformations.length} transformations
          </div>
        </>
      }
      detail={
        selected ? (
          <TransformationStatBlock transformation={selected} />
        ) : (
          <Centered>
            <p className="text-fg-muted">Select a transformation to view details.</p>
          </Centered>
        )
      }
    />
  );
}
