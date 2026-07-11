import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Book, Entry } from "@/types/entities";
import { useBooks } from "@/data/DataLoader";
import EntryRenderer from "@/render/EntryRenderer";

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

  if (isLoading)
    return (
      <div className="flex h-full items-center justify-center text-fg-muted">
        Loading books…
      </div>
    );
  if (error)
    return (
      <div className="flex h-full items-center justify-center text-red-400">
        Failed to load: {String(error.message)}
      </div>
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
            className="min-w-0 flex-1 rounded-md border border-border bg-bg-raised px-3 py-1.5 text-sm outline-none placeholder:text-fg-faint focus:border-accent md:max-w-xs"
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

function BookCard({ book, onClick }: { book: Book; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col gap-1.5 rounded-lg border border-border p-2 text-left transition-colors hover:border-accent hover:bg-bg-subtle"
    >
      <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-md bg-bg-raised">
        {book.cover ? (
          <img
            src={`/${book.cover.path}`}
            alt={book.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-2xl font-bold text-fg-faint">{book.id}</span>
        )}
      </div>
      <span className="line-clamp-2 text-xs font-medium text-fg">{book.name}</span>
      <span className="text-[10px] text-fg-faint">
        {book.published?.slice(0, 4)}
      </span>
    </button>
  );
}

/** Per-book content fetch hook. Lazy-loads chapters on demand. */
function useBookContent(bookId: string | undefined) {
  return useQuery({
    queryKey: ["book-content", bookId],
    queryFn: async () => {
      if (!bookId) return [];
      const res = await fetch(`/data/resolved/books/${bookId.toLowerCase()}.json`);
      if (!res.ok) return [];
      return (await res.json()) as Array<{ name?: string; entries?: Entry[] }>;
    },
    enabled: !!bookId,
  });
}

function BookDetail({ book, onBack }: { book: Book; onBack: () => void }) {
  const { data: chapters, isLoading } = useBookContent(book.id);
  const [activeChapter, setActiveChapter] = useState(0);

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 flex items-center gap-1 text-sm text-accent hover:text-accent-hover"
      >
        <span aria-hidden>←</span> All books
      </button>

      <div className="flex gap-4">
        <div className="hidden w-32 shrink-0 sm:block">
          <div className="aspect-[3/4] overflow-hidden rounded-lg border border-border bg-bg-raised">
            {book.cover ? (
              <img
                src={`/${book.cover.path}`}
                alt={book.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-2xl font-bold text-fg-faint">
                {book.id}
              </div>
            )}
          </div>
        </div>
        <div className="flex-1">
          <h2 className="font-serif text-xl font-bold text-fg">{book.name}</h2>
          <dl className="mt-2 space-y-0.5 text-sm text-fg-muted">
            <div>
              <dt className="inline font-semibold text-fg">Source: </dt>
              <dd className="inline">{book.source}</dd>
            </div>
            {book.author && (
              <div>
                <dt className="inline font-semibold text-fg">Author: </dt>
                <dd className="inline">{book.author}</dd>
              </div>
            )}
            {book.published && (
              <div>
                <dt className="inline font-semibold text-fg">Published: </dt>
                <dd className="inline">{book.published}</dd>
              </div>
            )}
            {book.level && (
              <div>
                <dt className="inline font-semibold text-fg">Levels: </dt>
                <dd className="inline">
                  {book.level.start}–{book.level.end}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Chapter navigation + readable content */}
      {isLoading ? (
        <p className="mt-6 text-sm text-fg-muted">Loading chapters…</p>
      ) : chapters && chapters.length > 0 ? (
        <div className="mt-6">
          {/* Chapter selector */}
          <div className="mb-4 flex flex-wrap gap-1">
            {chapters.map((ch, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveChapter(i)}
                className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                  i === activeChapter
                    ? "border-accent bg-accent-subtle text-accent"
                    : "border-border text-fg-muted hover:border-border-strong hover:text-fg"
                }`}
              >
                {ch.name ?? `Chapter ${i + 1}`}
              </button>
            ))}
          </div>

          {/* Chapter content */}
          <div className="rounded-lg border border-border bg-bg-subtle p-4 font-sans">
            {chapters[activeChapter]?.entries?.map((entry, i) => (
              <EntryRenderer key={i} entry={entry} />
            ))}
          </div>
        </div>
      ) : (
        book.contents &&
        book.contents.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-fg-muted">
              Table of Contents
            </h3>
            <div className="space-y-2">
              {book.contents.map((ch, i) => (
                <div
                  key={i}
                  className="rounded-md border border-border-subtle px-3 py-2"
                >
                  <p className="text-sm font-semibold text-fg">{ch.name}</p>
                  {ch.headers && ch.headers.length > 0 && (
                    <p className="mt-0.5 text-xs text-fg-muted">
                      {ch.headers.join(" • ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}
