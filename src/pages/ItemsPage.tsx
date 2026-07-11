import { useEffect, useMemo, useState } from "react";
import type { Item } from "@/types/entities";
import { useItems } from "@/data/DataLoader";
import ItemStatBlock from "@/components/StatBlock/ItemStatBlock";
import { ItemFilterSidebar, itemMatchesFilters } from "@/components/filters/ItemFilterSidebar";
import { useItemFilters } from "@/state/itemFilters";
import { rarityToFull } from "@/lib/itemFormatters";
import { sourceToAbv } from "@/lib/spellFormatters";

type SortKey = "name" | "rarity";

/**
 * Responsive item browser with filters.
 */
export default function ItemsPage() {
  const { data, isLoading, error } = useItems();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [isMobileDetail, setIsMobileDetail] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const items = data?.items ?? [];
  const filterSnapshot = useItemFilters();
  const filterActive = filterSnapshot.activeCount();

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out = items.filter((it) => {
      if (!itemMatchesFilters(it, filterSnapshot)) return false;
      if (q && !it.name.toLowerCase().includes(q)) return false;
      return true;
    });
    return out.sort((a, b) => {
      if (sortKey === "rarity")
        return raritySortValue(a.rarity) - raritySortValue(b.rarity) || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    });
  }, [items, search, sortKey, filterSnapshot]);

  const selected = useMemo(
    () => items.find((it) => itemKey(it) === selectedKey) ?? null,
    [items, selectedKey],
  );

  function selectItem(key: string) {
    setSelectedKey(key);
    setIsMobileDetail(true);
  }

  useEffect(() => {
    if (!selectedKey) setIsMobileDetail(false);
  }, [selectedKey]);

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

  return (
    <div className="flex h-full">
      {/* LIST PANE */}
      <aside
        className={`${
          isMobileDetail ? "hidden md:flex" : "flex"
        } w-full flex-col border-border bg-bg-subtle md:w-80 md:shrink-0 md:border-r`}
      >
        <div className="border-b border-border p-2">
          <div className="flex gap-2">
            <input
              type="search"
              placeholder={`Search ${items.length} items…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-w-0 flex-1 rounded-md border border-border bg-bg-raised px-3 py-1.5 text-sm outline-none placeholder:text-fg-faint focus:border-accent"
            />
            <button
              type="button"
              onClick={() => setShowFilters((s) => !s)}
              className={`flex shrink-0 items-center gap-1 rounded-md border px-2.5 py-1.5 text-sm transition-colors ${
                showFilters || filterActive > 0
                  ? "border-accent bg-accent-subtle text-accent"
                  : "border-border text-fg-muted hover:text-fg"
              }`}
              title="Toggle filters"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M1.5 3.5h13M3.5 8h9M6 12.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {filterActive > 0 ? filterActive : ""}
            </button>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs">
            <span className="text-fg-muted">Sort:</span>
            {(["name", "rarity"] as SortKey[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setSortKey(k)}
                className={`rounded px-2 py-0.5 capitalize ${
                  sortKey === k
                    ? "bg-accent-subtle text-accent"
                    : "text-fg-muted hover:bg-bg-raised"
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        {/* Collapsible filter panel */}
        {showFilters && (
          <div className="max-h-[40vh] shrink-0 overflow-y-auto border-b border-border bg-bg md:max-h-[50vh]">
            <ItemFilterSidebar items={items} />
          </div>
        )}

        {/* Column header */}
        <div className="flex items-center gap-2 border-b border-border bg-bg-raised px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-fg-faint">
          <span className="flex-1">Name</span>
          <span className="w-16 shrink-0 text-center" title="Rarity">Rarity</span>
          <span className="w-12 shrink-0 text-right" title="Source">Src</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {visible.map((it) => {
            const key = itemKey(it);
            const active = key === selectedKey;
            return (
              <button
                key={key}
                type="button"
                onClick={() => selectItem(key)}
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
      </aside>

      {/* DETAIL PANE */}
      <section
        className={`${
          isMobileDetail ? "flex" : "hidden md:flex"
        } absolute inset-0 top-0 z-10 flex-1 flex-col overflow-hidden bg-bg md:static md:z-auto`}
      >
        <div className="flex items-center border-b border-border bg-bg-subtle px-2 py-2 md:hidden">
          <button
            type="button"
            onClick={() => setIsMobileDetail(false)}
            className="flex items-center gap-1 rounded-md px-3 py-1 text-sm text-accent hover:bg-bg-raised"
          >
            <span aria-hidden>←</span> Items
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {selected ? (
            <ItemStatBlock item={selected} />
          ) : (
            <Centered>
              <p className="text-fg-muted">Select an item to view details.</p>
            </Centered>
          )}
        </div>
      </section>
    </div>
  );
}

function itemKey(it: Item): string {
  return `${it.name}|${it.source}`;
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

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center text-fg-muted">{children}</div>
  );
}
