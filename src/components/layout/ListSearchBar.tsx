/** Search input + filter toggle button. Shared by the six filterable list pages. */
export default function ListSearchBar({
  search,
  onSearchChange,
  placeholder,
  filterActive,
  showFilters,
  onToggleFilters,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder: string;
  filterActive: number;
  showFilters: boolean;
  onToggleFilters: () => void;
}) {
  return (
    <div className="flex gap-2">
      <input
        type="search"
        placeholder={placeholder}
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="min-w-0 flex-1 rounded-md border border-border bg-bg-raised px-3 py-1.5 text-sm outline-none placeholder:text-fg-faint focus:border-accent"
      />
      <button
        type="button"
        onClick={onToggleFilters}
        className={`flex shrink-0 items-center gap-1 rounded-md border px-2.5 py-1.5 text-sm transition-colors ${
          showFilters || filterActive > 0
            ? "border-accent bg-accent-subtle text-accent"
            : "border-border text-fg-muted hover:text-fg"
        }`}
        title="Toggle filters"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M1.5 3.5h13M3.5 8h9M6 12.5h4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        {filterActive > 0 ? filterActive : ""}
      </button>
    </div>
  );
}
