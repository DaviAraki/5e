import { useMemo, useState } from "react";
import type { Book, Item } from "@/types/entities";
import { useItems, useBooks } from "@/data/DataLoader";
import { useEntityPreview } from "@/state/entityPreview";
import { FilterGroup, Pill } from "@/components/filters/PillFilter";
import Centered from "@/components/layout/Centered";
import {
  itemSubtitle,
  rarityToFull,
  valueToFull,
} from "@/lib/itemFormatters";
import {
  type ConsumableMode,
  type LootRarity,
  type LootRoll,
  type LootSettings,
  LOOT_RARITIES,
  buildLootPool,
  emptyLootCounts,
  rollLoot,
} from "@/lib/lootGenerator";

/**
 * Random Loot Generator — a standalone tool page.
 *
 * The user picks how many items to draw from each rarity bucket, selects
 * source books (all by default), and toggles a consumable filter, then rolls
 * a random hoard from the pre-merged items dataset.
 */

const RARITY_LABEL: Record<LootRarity, string> = {
  none: "Mundane",
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  "very rare": "Very Rare",
  legendary: "Legendary",
  artifact: "Artifact",
};

const CONSUMABLE_MODES: { value: ConsumableMode; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "only", label: "Only Consumables" },
  { value: "exclude", label: "No Consumables" },
];

interface SourceOption {
  value: string;
  label: string;
  count: number;
}

export default function LootPage() {
  const { data: itemData, isLoading, error } = useItems();
  const { data: bookData } = useBooks();
  const { openPreview } = useEntityPreview();

  const items = itemData?.items ?? [];
  const books = bookData?.entities ?? [];

  // Source options derived from the items dataset, labelled from books.json.
  const sourceOptions = useMemo<SourceOption[]>(
    () => deriveSourceOptions(items, books),
    [items, books],
  );

  // All sources selected by default.
  const [counts, setCounts] = useState<Record<LootRarity, number>>(emptyLootCounts());
  const [sources, setSources] = useState<Set<string>>(() => new Set(sourceOptions.map((o) => o.value)));
  const [consumableMode, setConsumableMode] = useState<ConsumableMode>("any");
  const [roll, setRoll] = useState<LootRoll | null>(null);

  // Keep the default source selection in sync until the user touches it.
  const [sourcesTouched, setSourcesTouched] = useState(false);
  if (!sourcesTouched && sources.size === 0 && sourceOptions.length > 0) {
    setSources(new Set(sourceOptions.map((o) => o.value)));
  }

  const settings: LootSettings = { counts, sources, consumableMode };

  const totalCount = useMemo(
    () => LOOT_RARITIES.reduce((sum, r) => sum + (roll?.[r].length ?? 0), 0),
    [roll],
  );
  const totalValue = useMemo(
    () =>
      roll
        ? LOOT_RARITIES.reduce(
            (sum, r) => sum + roll[r].reduce((s, it) => s + (it.value ?? 0), 0),
            0,
          )
        : 0,
    [roll],
  );

  if (isLoading) return <Centered>Loading items…</Centered>;
  if (error)
    return (
      <Centered>
        <div className="text-red-400">Failed to load: {String(error.message)}</div>
      </Centered>
    );

  const handleRoll = () => {
    const pool = buildLootPool(items, settings);
    setRoll(rollLoot(pool, counts));
  };

  const handleClear = () => {
    setCounts(emptyLootCounts());
    setRoll(null);
  };

  const toggleSource = (code: string) => {
    setSourcesTouched(true);
    setSources((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const selectAllSources = () => {
    setSourcesTouched(true);
    setSources(new Set(sourceOptions.map((o) => o.value)));
  };
  const clearSources = () => {
    setSourcesTouched(true);
    setSources(new Set());
  };

  return (
    <div className="h-full overflow-y-auto bg-bg">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 flex items-center gap-3">
          <h1 className="font-serif text-2xl font-bold text-fg">Loot Generator</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-[320px_1fr]">
          {/* Config panel */}
          <section className="space-y-4">
            <div className="rounded-lg border border-border bg-bg-subtle">
              <h2 className="border-b border-border-subtle px-3 py-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">
                Quantities
              </h2>
              <div className="space-y-1.5 p-3">
                {LOOT_RARITIES.map((r) => (
                  <div key={r} className="flex items-center justify-between gap-3">
                    <label htmlFor={`count-${r}`} className="text-sm text-fg">
                      {RARITY_LABEL[r]}
                    </label>
                    <input
                      id={`count-${r}`}
                      type="number"
                      min={0}
                      value={counts[r]}
                      onChange={(e) =>
                        setCounts((prev) => ({
                          ...prev,
                          [r]: Math.max(0, Number(e.target.value) || 0),
                        }))
                      }
                      className="w-20 rounded-md border border-border bg-bg-raised px-2 py-1 text-sm text-right outline-hidden focus:border-accent"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-bg-subtle">
              <h2 className="border-b border-border-subtle px-3 py-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">
                Consumables
              </h2>
              <div className="flex flex-wrap gap-1 p-3">
                {CONSUMABLE_MODES.map((m) => (
                  <Pill
                    key={m.value}
                    label={m.label}
                    active={consumableMode === m.value}
                    onClick={() => setConsumableMode(m.value)}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-bg-subtle">
              <div className="flex items-center justify-between border-b border-border-subtle px-3 py-2">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
                  Sources
                </h2>
                <div className="flex gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={selectAllSources}
                    className="text-fg-faint hover:text-fg-muted"
                  >
                    all
                  </button>
                  <button
                    type="button"
                    onClick={clearSources}
                    className="text-fg-faint hover:text-fg-muted"
                  >
                    none
                  </button>
                </div>
              </div>
              <FilterGroup
                title="Books"
                activeCount={sources.size}
                onClear={clearSources}
                defaultOpen
              >
                {sourceOptions.map((opt) => (
                  <Pill
                    key={opt.value}
                    label={`${opt.label} (${opt.count})`}
                    active={sources.has(opt.value)}
                    onClick={() => toggleSource(opt.value)}
                  />
                ))}
              </FilterGroup>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRoll}
                className="flex-1 rounded-md bg-accent px-3 py-2 text-sm font-semibold text-bg transition-colors hover:bg-accent-strong"
              >
                {roll ? "Reroll" : "Roll"}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="rounded-md border border-border px-3 py-2 text-sm text-fg-muted transition-colors hover:bg-bg-raised hover:text-fg"
              >
                Clear
              </button>
            </div>
          </section>

          {/* Results panel */}
          <section>
            {roll === null ? (
              <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border text-sm text-fg-muted">
                Pick quantities and roll to generate loot.
              </div>
            ) : totalCount === 0 ? (
              <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border text-sm text-fg-muted">
                No items match — adjust filters or quantities.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3 text-sm text-fg-muted">
                  <span>
                    <span className="font-semibold text-fg">{totalCount}</span> items
                  </span>
                  <span className="text-fg-faint">•</span>
                  <span>
                    <span className="font-semibold text-fg">{valueToFull(totalValue) || "0 gp"}</span> total value
                  </span>
                </div>

                {LOOT_RARITIES.filter((r) => roll[r].length > 0).map((r) => (
                  <div key={r} className="rounded-lg border border-border bg-bg-subtle">
                    <h3 className="border-b border-border-subtle px-3 py-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">
                      {RARITY_LABEL[r]}{" "}
                      <span className="text-fg-faint">({roll[r].length})</span>
                    </h3>
                    <ul className="divide-y divide-border-subtle">
                      {roll[r].map((item) => (
                        <li key={`${item.name}|${item.source}`}>
                          <LootItemRow
                            item={item}
                            onPreview={() =>
                              openPreview({
                                type: "item",
                                name: item.name,
                                source: item.source,
                              })
                            }
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function LootItemRow({ item, onPreview }: { item: Item; onPreview: () => void }) {
  const subtitle = itemSubtitle(item);
  const value = valueToFull(item.value);
  const rarity = rarityToFull(item.rarity);

  return (
    <button
      type="button"
      onClick={onPreview}
      className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-bg-raised"
    >
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-fg">{item.name}</div>
        {subtitle && (
          <div className="truncate text-xs text-fg-muted">{subtitle}</div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3 text-xs text-fg-muted">
        {rarity && <span>{rarity}</span>}
        {value && <span>{value}</span>}
      </div>
    </button>
  );
}

/**
 * Derive source options from the items dataset, labelled from books.json.
 * Falls back to the raw code for sources not present in books.json.
 */
function deriveSourceOptions(items: Item[], books: Book[]): SourceOption[] {
  const counts = new Map<string, number>();
  for (const it of items) counts.set(it.source, (counts.get(it.source) ?? 0) + 1);

  const labelById = new Map<string, string>();
  for (const b of books) labelById.set(b.id, b.name);
  for (const b of books) {
    if (b.source && !labelById.has(b.source)) labelById.set(b.source, b.name);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([code, count]) => ({
      value: code,
      label: labelById.get(code) ?? code,
      count,
    }));
}
