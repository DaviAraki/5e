import { useState } from "react";
import type { Book } from "@/types/entities";
import { useBookContent } from "@/hooks/useBookContent";
import EntryRenderer from "@/render/EntryRenderer";

/** Book detail view: cover, metadata, and chapter navigation with readable content. */
export default function BookDetail({
  book,
  onBack,
}: {
  book: Book;
  onBack: () => void;
}) {
  const { data: chapters, isLoading } = useBookContent(book.id);
  const [activeChapter, setActiveChapter] = useState(0);
  const [coverError, setCoverError] = useState(false);
  const showCover = book.cover && !coverError;

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
            {showCover ? (
              <img
                src={`${import.meta.env.BASE_URL}${book.cover!.path}`}
                alt={book.name}
                className="h-full w-full object-cover"
                onError={() => setCoverError(true)}
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
