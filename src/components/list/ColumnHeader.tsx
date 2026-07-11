export interface ColumnDef {
  label: string;
  title?: string;
  className: string;
}

/** Column header row above a scrollable list. `gap` defaults to "gap-2". */
export default function ColumnHeader({
  columns,
  gap = "gap-2",
}: {
  columns: ColumnDef[];
  gap?: string;
}) {
  return (
    <div
      className={`flex items-center ${gap} border-b border-border bg-bg-raised px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-fg-faint`}
    >
      {columns.map((col, i) => (
        <span key={i} className={col.className} title={col.title}>
          {col.label}
        </span>
      ))}
    </div>
  );
}
