import type { Book } from "@/types/entities";

/** Book cover tile for the grid view. */
export default function BookCard({
  book,
  onClick,
}: {
  book: Book;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col gap-1.5 rounded-lg border border-border p-2 text-left transition-colors hover:border-accent hover:bg-bg-subtle"
    >
      <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-md bg-bg-raised">
        {book.cover ? (
          <img
            src={`${import.meta.env.BASE_URL}${book.cover.path}`}
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
