/** Mobile-only back bar shown at the top of the detail pane on narrow screens. */
export default function MobileBackBar({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center border-b border-border bg-bg-subtle px-2 py-2 md:hidden">
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-1 rounded-md px-3 py-1 text-sm text-accent hover:bg-bg-raised"
      >
        <span aria-hidden>←</span> {label}
      </button>
    </div>
  );
}
