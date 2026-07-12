import { useMemo, useState } from "react";
import { useLanguages } from "@/data/DataLoader";
import { makeRef } from "@/data/entityRefs";
import LanguageStatBlock from "@/components/StatBlock/LanguageStatBlock";
import { LanguageFilterSidebar, languageMatchesFilters } from "@/components/filters/LanguageFilterSidebar";
import { useLanguageFilters } from "@/state/languageFilters";
import { useExcludedSources } from "@/state/sourceExclusions";
import { sourceToAbv } from "@/lib/spellFormatters";
import Centered from "@/components/layout/Centered";
import MasterDetailLayout from "@/components/layout/MasterDetailLayout";
import ListSearchBar from "@/components/layout/ListSearchBar";
import ColumnHeader, { type ColumnDef } from "@/components/list/ColumnHeader";
import { useMasterDetail } from "@/hooks/useMasterDetail";

/**
 * Responsive languages browser with type and source filters.
 */
export default function LanguagesPage() {
  const { data, isLoading, error } = useLanguages();
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const { selectedKey, isMobileDetail, setIsMobileDetail, select } = useMasterDetail();

  const languages = data?.entities ?? [];
  const filterSnapshot = useLanguageFilters();
  const filterActive = filterSnapshot.activeCount();
  const excludedSources = useExcludedSources("languages");

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out = languages.filter((l) => {
      if (!languageMatchesFilters(l, filterSnapshot)) return false;
      if (excludedSources.has(l.source)) return false;
      if (q && !l.name.toLowerCase().includes(q)) return false;
      return true;
    });
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }, [languages, search, filterSnapshot, excludedSources]);

  const selected = useMemo(
    () => languages.find((l) => makeRef(l.name, l.source) === selectedKey) ?? null,
    [languages, selectedKey],
  );

  if (isLoading) return <Centered>Loading languages…</Centered>;
  if (error)
    return (
      <Centered>
        <div className="text-red-400">Failed to load: {String(error.message)}</div>
      </Centered>
    );

  const columns: ColumnDef[] = [
    { label: "Language", className: "flex-1" },
    { label: "Type", className: "w-16 shrink-0 text-center" },
    { label: "Src", title: "Source", className: "w-12 shrink-0 text-right" },
  ];

  return (
    <MasterDetailLayout
      isMobileDetail={isMobileDetail}
      onBack={() => setIsMobileDetail(false)}
      backLabel="Languages"
      listWidth="md:w-80"
      list={
        <>
          <div className="border-b border-border p-2">
            <ListSearchBar
              search={search}
              onSearchChange={setSearch}
              placeholder={`Search ${languages.length} languages…`}
              filterActive={filterActive}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters((s) => !s)}
            />
          </div>
          {showFilters && (
            <div className="max-h-[40vh] shrink-0 overflow-y-auto border-b border-border bg-bg md:max-h-[50vh]">
              <LanguageFilterSidebar languages={languages} />
            </div>
          )}
          <ColumnHeader columns={columns} />
          <div className="flex-1 overflow-y-auto">
            {visible.map((l) => {
              const key = makeRef(l.name, l.source);
              const active = key === selectedKey;
              const type = l.type ? l.type.charAt(0).toUpperCase() : "—";
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => select(key)}
                  className={`flex w-full items-center gap-2 border-b border-border-subtle px-3 py-1.5 text-left text-sm transition-colors ${
                    active ? "bg-accent-subtle" : "hover:bg-bg-raised"
                  }`}
                >
                  <span className="flex-1 truncate font-medium">{l.name}</span>
                  <span className="w-16 shrink-0 text-center text-xs text-fg-muted">{type}</span>
                  <span className="w-12 shrink-0 text-right text-xs text-fg-faint">{sourceToAbv(l.source)}</span>
                </button>
              );
            })}
            {visible.length === 0 && (
              <div className="p-4 text-center text-sm text-fg-muted">No languages match.</div>
            )}
          </div>
          <div className="border-t border-border px-3 py-1 text-xs text-fg-muted">
            {visible.length} / {languages.length} languages
          </div>
        </>
      }
      detail={
        selected ? (
          <LanguageStatBlock language={selected} />
        ) : (
          <Centered>
            <p className="text-fg-muted">Select a language to view details.</p>
          </Centered>
        )
      }
    />
  );
}
