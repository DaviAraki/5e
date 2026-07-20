import { useMemo, useState } from "react";
import type { Book } from "@/types/entities";
import { useBooks } from "@/data/DataLoader";
import BookCard from "@/components/books/BookCard";
import BookDetail from "@/components/books/BookDetail";
import Centered from "@/components/layout/Centered";

/**
 * Books page — a browsable reference of all source books.
 * - Edition filter toggle (2024+ / All)
 * - Grid of book covers grouped by category
 * - Clicking a book lazy-loads its readable chapter content
 */

const GROUP_ORDER = [
  "core", "supplement", "supplement-alt", "setting", "setting-alt",
  "screen", "organized-play", "recipe", "homecraft", "other",
];

const GROUP_LABELS: Record<string, string> = {
  core: "Core Rulebooks",
  supplement: "Supplements",
  "supplement-alt": "Supplements (Third-Party)",
  setting: "Setting Books",
  "setting-alt": "Setting Books (Third-Party)",
  screen: "DM Screens",
  "organized-play": "Organized Play",
  recipe: "Recipes",
  homecraft: "Home Crafts",
  other: "Other",
};

type EditionFilter = "one" | "all";

export default function BooksPage() {
  const { data, isLoading, error } = useBooks();
  const [search, setSearch] = useState("");
  const [editionFilter, setEditionFilter] = useState<EditionFilter>("one");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const books = data?.entities ?? [];

  const filtered = useMemo(() => {
    let out = books;
    if (editionFilter === "one") {
      out = out.filter((b) => b.isOneEdition);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      out = out.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.id.toLowerCase().includes(q) ||
          b.source.toLowerCase().includes(q),
      );
    }
    return out;
  }, [books, search, editionFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, Book[]>();
    for (const b of filtered) {
      const g = b.group ?? "other";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(b);
    }
    return [...map.entries()].sort(
      ([a], [b]) =>
        (GROUP_ORDER.indexOf(a) ?? 99) - (GROUP_ORDER.indexOf(b) ?? 99),
    );
  }, [filtered]);

  const selected = useMemo(
    () => books.find((b) => bookKey(b) === selectedKey) ?? null,
    [books, selectedKey],
  );

  if (isLoading) return <Centered>Loading books…</Centered>;
  if (error)
    return (
      <Centered>
        <div className="text-red-400">Failed to load: {String(error.message)}</div>
      </Centered>
    );

  return (
    <div className="h-full overflow-y-auto bg-bg">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4 flex items-center gap-3">
          <h1 className="font-serif text-2xl font-bold text-fg">Source Books</h1>
          <span className="text-sm text-fg-muted">({filtered.length} books)</span>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <input
            type="search"
            placeholder="Search books…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-0 flex-1 rounded-md border border-border bg-bg-raised px-3 py-1.5 text-sm outline-hidden placeholder:text-fg-faint focus:border-accent md:max-w-xs"
          />
          <div className="flex items-center gap-1 text-xs">
            <span className="text-fg-muted">Edition:</span>
            {(["one", "all"] as EditionFilter[]).map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEditionFilter(e)}
                className={`rounded px-2 py-0.5 ${
                  editionFilter === e
                    ? "bg-accent-subtle text-accent"
                    : "text-fg-muted hover:bg-bg-raised"
                }`}
              >
                {e === "one" ? "2024+" : "All"}
              </button>
            ))}
          </div>
        </div>

        {selected ? (
          <BookDetail book={selected} onBack={() => setSelectedKey(null)} />
        ) : (
          <div className="space-y-8">
            {grouped.map(([group, groupBooks]) => (
              <section key={group}>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-fg-muted">
                  {GROUP_LABELS[group] ?? group}
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {groupBooks.map((b) => (
                    <BookCard
                      key={bookKey(b)}
                      book={b}
                      onClick={() => setSelectedKey(bookKey(b))}
                    />
                  ))}
                </div>
              </section>
            ))}
            {grouped.length === 0 && (
              <p className="text-center text-sm text-fg-muted">No books match.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function bookKey(b: Book): string {
  return `${b.id}|${b.source}`;
}
