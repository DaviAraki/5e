import type { GameTable } from "@/types/entities";
import EntryRenderer from "@/render/EntryRenderer";
import { sourceToAbv } from "@/lib/spellFormatters";
import ShareLinkButton from "@/components/ShareLinkButton";

/**
 * TableStatBlock — displays a lookup table with its column headers, rows,
 * and any intro/outro prose. Falls back to entries if no rows are present.
 */
export default function TableStatBlock({ table }: { table: GameTable }) {
  const colLabels = table.colLabels ?? [];
  const colStyles = table.colStyles ?? [];
  const rows = table.rows ?? [];

  return (
    <article className="mx-auto max-w-3xl px-4 py-6 font-serif text-fg">
      <div className="flex items-start justify-between gap-3 border-b-2 border-border pb-1">
        <h2 className="rd-heading text-2xl font-bold italic">{table.name}</h2>
        <ShareLinkButton />
      </div>

      {table.intro && (
        <div className="mt-3 space-y-2 font-sans">
          {table.intro.map((entry, i) => (
            <EntryRenderer key={i} entry={entry} />
          ))}
        </div>
      )}

      {colLabels.length > 0 && rows.length > 0 && (
        <div className="mt-4 overflow-x-auto font-sans">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {colLabels.map((label, i) => (
                  <th
                    key={i}
                    className={`border border-border px-2 py-1 text-left ${colStyles[i] ?? ""}`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className="odd:bg-bg-raised">
                  {(row as unknown[]).map((cell, ci) => (
                    <td
                      key={ci}
                      className={`border border-border-subtle px-2 py-1 align-top ${colStyles[ci] ?? ""}`}
                    >
                      {renderCell(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {table.entries?.length && (
        <div className="mt-4 space-y-2 font-sans">
          {table.entries.map((entry, i) => (
            <EntryRenderer key={i} entry={entry} />
          ))}
        </div>
      )}

      {table.outro && (
        <div className="mt-3 space-y-2 font-sans">
          {table.outro.map((entry, i) => (
            <EntryRenderer key={i} entry={entry} />
          ))}
        </div>
      )}

      <footer className="mt-6 border-t border-border-subtle pt-2 text-xs text-fg-muted">
        Source: {sourceToAbv(table.source)}
        {table.page ? ` p.${table.page}` : ""}
      </footer>
    </article>
  );
}

/** Render a table cell — strings may contain 5etools inline tags. */
function renderCell(cell: unknown) {
  if (cell === null || cell === undefined) return null;
  if (typeof cell === "string" || typeof cell === "number") return String(cell);
  if (typeof cell === "object") {
    return <EntryRenderer entry={cell as never} />;
  }
  return String(cell);
}
