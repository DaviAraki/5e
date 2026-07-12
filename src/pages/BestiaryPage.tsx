import { useMemo, useState } from "react";
import type { Monster } from "@/types/entities";
import { useMonsters } from "@/data/DataLoader";
import { makeRef } from "@/data/entityRefs";
import MonsterStatBlock from "@/components/StatBlock/MonsterStatBlock";
import { BestiaryFilterSidebar, monsterMatchesFilters } from "@/components/filters/BestiaryFilterSidebar";
import { useBestiaryFilters } from "@/state/bestiaryFilters";
import { crToFull } from "@/lib/monsterFormatters";
import { sourceToAbv } from "@/lib/spellFormatters";
import Centered from "@/components/layout/Centered";
import MasterDetailLayout from "@/components/layout/MasterDetailLayout";
import ListSearchBar from "@/components/layout/ListSearchBar";
import SortBar from "@/components/list/SortBar";
import { useMasterDetail } from "@/hooks/useMasterDetail";

type SortKey = "name" | "cr";

/**
 * Responsive bestiary browser with filters.
 */
export default function BestiaryPage() {
  const { data, isLoading, error } = useMonsters();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [showFilters, setShowFilters] = useState(false);
  const { selectedKey, isMobileDetail, setIsMobileDetail, select } = useMasterDetail();

  const monsters = data?.entities ?? [];
  const filterSnapshot = useBestiaryFilters();
  const filterActive = filterSnapshot.activeCount();

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out = monsters.filter((m) => {
      if (!monsterMatchesFilters(m, filterSnapshot)) return false;
      if (q && !m.name.toLowerCase().includes(q)) return false;
      return true;
    });
    return out.sort((a, b) => {
      if (sortKey === "cr") return crSortValue(a.cr) - crSortValue(b.cr) || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    });
  }, [monsters, search, sortKey, filterSnapshot]);

  const selected = useMemo(
    () => monsters.find((m) => makeRef(m.name, m.source) === selectedKey) ?? null,
    [monsters, selectedKey],
  );

  if (isLoading) return <Centered>Loading monsters…</Centered>;
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
      backLabel="Bestiary"
      listWidth="md:w-80"
      list={
        <>
          <div className="border-b border-border p-2">
            <ListSearchBar
              search={search}
              onSearchChange={setSearch}
              placeholder={`Search ${monsters.length} monsters…`}
              filterActive={filterActive}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters((s) => !s)}
            />
            <SortBar
              keys={["name", "cr"] as SortKey[]}
              value={sortKey}
              onChange={setSortKey}
              labelFn={(k) => (k === "cr" ? "Challenge" : k)}
            />
          </div>

          {showFilters && (
            <div className="max-h-[40vh] shrink-0 overflow-y-auto border-b border-border bg-bg md:max-h-[50vh]">
              <BestiaryFilterSidebar monsters={monsters} />
            </div>
          )}
          <div className="flex-1 overflow-y-auto">
            {visible.map((m) => {
              const key = makeRef(m.name, m.source);
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
                  <span className="flex-1 truncate font-medium">{m.name}</span>
                  <span className="shrink-0 text-xs font-semibold text-accent">
                    CR {crToFull(m.cr)}
                  </span>
                  <span className="shrink-0 text-xs text-fg-faint">
                    {sourceToAbv(m.source)}
                  </span>
                </button>
              );
            })}
            {visible.length === 0 && (
              <div className="p-4 text-center text-sm text-fg-muted">No monsters match.</div>
            )}
          </div>
          <div className="border-t border-border px-3 py-1 text-xs text-fg-muted">
            {visible.length} / {monsters.length} monsters
          </div>
        </>
      }
      detail={
        selected ? (
          <MonsterStatBlock monster={selected} />
        ) : (
          <Centered>
            <p className="text-fg-muted">Select a monster to view details.</p>
          </Centered>
        )
      }
    />
  );
}

/** Sort weight for CR — handles fractions (1/4 = 0.25) and objects. */
function crSortValue(cr: Monster["cr"]): number {
  if (cr == null) return 999;
  const crStr = typeof cr === "string" ? cr : String(cr.cr);
  const num = parseFloat(crStr);
  if (!Number.isNaN(num)) return num;
  // Fractional like "1/4"
  const parts = crStr.split("/").map(Number);
  if (parts.length === 2 && parts[1]) {
    return (parts[0] ?? 0) / parts[1];
  }
  return 999;
}
