import { useMemo, useState } from "react";
import type { Item } from "@/types/entities";
import { useItems } from "@/data/DataLoader";
import { makeRef } from "@/data/entityRefs";
import ItemStatBlock from "@/components/StatBlock/ItemStatBlock";
import { ItemFilterSidebar, itemMatchesFilters } from "@/components/filters/ItemFilterSidebar";
import { useItemFilters } from "@/state/itemFilters";
import { useExcludedSources } from "@/state/sourceExclusions";
import { rarityToFull } from "@/lib/itemFormatters";
import { sourceToAbv } from "@/lib/spellFormatters";
import Centered from "@/components/layout/Centered";
import MasterDetailLayout from "@/components/layout/MasterDetailLayout";
import ListSearchBar from "@/components/layout/ListSearchBar";
import SortBar from "@/components/list/SortBar";
import ColumnHeader, { type ColumnDef } from "@/components/list/ColumnHeader";
import { useMasterDetail } from "@/hooks/useMasterDetail";

type SortKey = "name" | "rarity";

/**
 * Responsive item browser with filters.
 */
export default function ItemsPage() {
  const { data, isLoading, error } = useItems();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [showFilters, setShowFilters] = useState(false);
  const { selectedKey, isMobileDetail, setIsMobileDetail, select } = useMasterDetail();

  const items = data?.items ?? [];
  const filterSnapshot = useItemFilters();
  const filterActive = filterSnapshot.activeCount();
  const excludedSources = useExcludedSources("items");

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out = items.filter((it) => {
      if (!itemMatchesFilters(it, filterSnapshot)) return false;
      if (excludedSources.has(it.source)) return false;
      if (q && !it.name.toLowerCase().includes(q)) return false;
      return true;
    });
    return out.sort((a, b) => {
      if (sortKey === "rarity")
        return raritySortValue(a.rarity) - raritySortValue(b.rarity) || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    });
  }, [items, search, sortKey, filterSnapshot, excludedSources]);

  const selected = useMemo(
    () => items.find((it) => makeRef(it.name, it.source) === selectedKey) ?? null,
    [items, selectedKey],
  );

  if (isLoading) return <Centered>Loading items…</Centered>;
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
    { label: "Name", className: "flex-1" },
    { label: "Rarity", title: "Rarity", className: "w-16 shrink-0 text-center" },
    { label: "Src", title: "Source", className: "w-12 shrink-0 text-right" },
  ];

  return (
    <MasterDetailLayout
      isMobileDetail={isMobileDetail}
      onBack={() => setIsMobileDetail(false)}
      backLabel="Items"
      listWidth="md:w-80"
      list={
        <>
          <div className="border-b border-border p-2">
            <ListSearchBar
              search={search}
              onSearchChange={setSearch}
              placeholder={`Search ${items.length} items…`}
              filterActive={filterActive}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters((s) => !s)}
            />
            <SortBar
              keys={["name", "rarity"] as SortKey[]}
              value={sortKey}
              onChange={setSortKey}
            />
          </div>

          {showFilters && (
            <div className="max-h-[40vh] shrink-0 overflow-y-auto border-b border-border bg-bg md:max-h-[50vh]">
              <ItemFilterSidebar items={items} />
            </div>
          )}

          <ColumnHeader columns={columns} />

          <div className="flex-1 overflow-y-auto">
            {visible.map((it) => {
              const key = makeRef(it.name, it.source);
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
                  <span className="flex-1 truncate font-medium">{it.name}</span>
                  <span className="w-16 shrink-0 text-center text-xs text-fg-muted">
                    {rarityLabel(it)}
                  </span>
                  <span className="w-12 shrink-0 text-right text-xs text-fg-faint">
                    {sourceToAbv(it.source)}
                  </span>
                </button>
              );
            })}
            {visible.length === 0 && (
              <div className="p-4 text-center text-sm text-fg-muted">No items match.</div>
            )}
          </div>
          <div className="border-t border-border px-3 py-1 text-xs text-fg-muted">
            {visible.length} / {items.length} items
          </div>
        </>
      }
      detail={
        selected ? (
          <ItemStatBlock item={selected} />
        ) : (
          <Centered>
            <p className="text-fg-muted">Select an item to view details.</p>
          </Centered>
        )
      }
    />
  );
}

function rarityLabel(it: Item): string {
  if (it.wondrous) return "Wond";
  const r = rarityToFull(it.rarity);
  if (!r || r === "Mundane") return "—";
  return r.slice(0, 4);
}

/** Sort weight: mundane < common < uncommon < rare < very rare < legendary < artifact */
function raritySortValue(rarity: string | undefined): number {
  const order: Record<string, number> = {
    none: 0,
    common: 1,
    uncommon: 2,
    rare: 3,
    "very rare": 4,
    legendary: 5,
    artifact: 6,
    varies: 7,
    "unknown (magic)": 8,
  };
  return order[rarity ?? "none"] ?? 9;
}
