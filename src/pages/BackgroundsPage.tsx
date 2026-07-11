import { useEffect, useMemo, useState } from "react";
import type { Background } from "@/types/entities";
import { useBackgrounds } from "@/data/DataLoader";
import BackgroundStatBlock from "@/components/StatBlock/BackgroundStatBlock";
import { BackgroundFilterSidebar, backgroundMatchesFilters } from "@/components/filters/BackgroundFilterSidebar";
import { useBackgroundFilters } from "@/state/backgroundFilters";
import { sourceToAbv } from "@/lib/spellFormatters";

/**
 * Responsive background browser with filters.
 */
export default function BackgroundsPage() {
  const { data, isLoading, error } = useBackgrounds();
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [isMobileDetail, setIsMobileDetail] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const backgrounds = data?.entities ?? [];
  const filterSnapshot = useBackgroundFilters();
  const filterActive = filterSnapshot.activeCount();

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out = backgrounds.filter((b) => {
      if (!backgroundMatchesFilters(b, filterSnapshot)) return false;
      if (q && !b.name.toLowerCase().includes(q)) return false;
      return true;
    });
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }, [backgrounds, search, filterSnapshot]);

  const selected = useMemo(
    () => backgrounds.find((b) => bgKey(b) === selectedKey) ?? null,
    [backgrounds, selectedKey],
  );

  function selectBg(key: string) {
    setSelectedKey(key);
    setIsMobileDetail(true);
  }

  useEffect(() => {
    if (!selectedKey) setIsMobileDetail(false);
  }, [selectedKey]);

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
    <div className="flex h-full">
      {/* LIST PANE */}
      <aside
        className={`${
          isMobileDetail ? "hidden md:flex" : "flex"
        } w-full flex-col border-border bg-bg-subtle md:w-72 md:shrink-0 md:border-r`}
      >
        <div className="border-b border-border p-2">
          <div className="flex gap-2">
            <input
              type="search"
              placeholder={`Search ${backgrounds.length} backgrounds…`}
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
        </div>

        {/* Collapsible filter panel */}
        {showFilters && (
          <div className="max-h-[40vh] shrink-0 overflow-y-auto border-b border-border bg-bg md:max-h-[50vh]">
            <BackgroundFilterSidebar backgrounds={backgrounds} />
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          {visible.map((b) => {
            const key = bgKey(b);
            const active = key === selectedKey;
            return (
              <button
                key={key}
                type="button"
                onClick={() => selectBg(key)}
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
            <span aria-hidden>←</span> Backgrounds
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {selected ? (
            <BackgroundStatBlock bg={selected} />
          ) : (
            <Centered>
              <p className="text-fg-muted">Select a background to view details.</p>
            </Centered>
          )}
        </div>
      </section>
    </div>
  );
}

function bgKey(b: Background): string {
  return `${b.name}|${b.source}`;
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center text-fg-muted">{children}</div>
  );
}
