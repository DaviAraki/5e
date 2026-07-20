import type { ReactNode } from "react";
import type {
  Entry,
  EntriesEntry,
  ListEntry,
  TableEntry,
  InsetEntry,
  QuoteEntry,
  ImageEntry,
  GalleryEntry,
  ItemEntry,
} from "@/types/entities";
import { isSafeUrl } from "@/lib/urlSafety";
import InlineText from "./InlineText";

/**
 * Derive a stable React key for an Entry. Prefer name (most entries carry
 * one), then type, falling back to the array index — the last is acceptable
 * only for arrays that never reorder or splice, which is true for the 5e
 * data files' `entries`/`items` lists (they're authored, immutable content).
 *
 * Previously every recursion used bare `key={i}`, which is fragile against
 * insertion/deletion during authoring edits and breaks sibling reconciliation
 * when two entries share content.
 */
function entryKey(entry: Entry, index: number): string | number {
  if (typeof entry === "string") return `${index}:${entry.slice(0, 16)}`;
  if (typeof entry === "number") return `${index}:n${entry}`;
  if (entry && typeof entry === "object") {
    if (typeof entry.name === "string") return `${index}:${entry.name}`;
    if (typeof entry.type === "string") return `${index}:${entry.type}`;
  }
  return index;
}

/**
 * EntryRenderer — recursively renders the 5etools structured `Entry` union.
 *
 * This is the v1 subset of the ~46-type render.js dispatcher. It handles the
 * fundamental types that appear in spell/monster/item stat blocks:
 *   string | number (base cases)
 *   entries | section (named sections, recurse)
 *   list (ul/ol)
 *   table
 *   inset | insetReadaloud
 *   quote
 *   image | gallery
 *   item | itemSub (list-item bodies)
 *
 * Unknown types fall back to rendering their name + nested entries (if any).
 */

export interface EntryRendererProps {
  entry: Entry;
  depth?: number;
}

export default function EntryRenderer({ entry, depth = 0 }: EntryRendererProps): ReactNode {
  // Base cases
  if (typeof entry === "string") return <p className="rd-text"><InlineText text={entry} /></p>;
  if (typeof entry === "number") return <span>{entry}</span>;
  if (entry === null || typeof entry !== "object") return null;

  const type = entry.type ?? "entries";

  switch (type) {
    case "entries":
    case "section":
      return renderEntries(entry as EntriesEntry, depth);
    case "list":
      return renderList(entry as ListEntry);
    case "table":
      return renderTable(entry as TableEntry);
    case "inset":
    case "insetReadaloud":
      return renderInset(entry as InsetEntry, type === "insetReadaloud");
    case "quote":
      return renderQuote(entry as QuoteEntry);
    case "image":
      return renderImage(entry as ImageEntry);
    case "gallery":
      return renderGallery(entry as GalleryEntry);
    case "item":
    case "itemSub":
    case "itemSpell":
      return renderItem(entry as ItemEntry, type === "itemSub");
    case "inline":
    case "inlineBlock": {
      // Inline entries render their children without block wrappers.
      const children = (entry as { entries?: Entry[] }).entries ?? [];
      return (
        <span>
          {children.map((c, i) => (
            <EntryRenderer key={entryKey(c, i)} entry={c} depth={depth} />
          ))}
        </span>
      );
    }
    case "hr":
      return <hr className="my-2 border-border-subtle" />;
    default:
      return renderUnknown(entry, depth);
  }
}

function renderEntries(e: EntriesEntry, depth: number): ReactNode {
  const Heading = (depth < 1 ? "h4" : "h5") as "h4" | "h5";
  return (
    <div className="rd-entries my-1">
      {e.name && (
        <Heading className="rd-heading text-base font-bold">
          <InlineText text={e.name} />.
        </Heading>
      )}
      {(e.entries ?? []).map((child, i) => (
        <EntryRenderer key={entryKey(child, i)} entry={child} depth={depth + 1} />
      ))}
    </div>
  );
}

function renderList(e: ListEntry): ReactNode {
  const ordered = e.style === "list-numbered";
  const items = e.items ?? [];
  const ListTag = ordered ? "ol" : "ul";
  const hang = e.style?.includes("hang");
  return (
    <ListTag
      className={`rd-list my-1 space-y-0.5 pl-5 ${ordered ? "list-decimal" : "list-disc"} ${
        hang ? "list-none pl-0" : ""
      }`}
      start={e.start}
    >
      {items.map((item, i) => (
        <li key={entryKey(item, i)} className={hang ? "rd-list-item-hang" : ""}>
          <EntryRenderer entry={item} />
        </li>
      ))}
    </ListTag>
  );
}

function renderTable(e: TableEntry): ReactNode {
  return (
    <div className="rd-table my-2 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        {e.caption != null && (
          <caption className="caption-top pb-1 text-center font-semibold text-fg-muted">
            <EntryRenderer entry={e.caption} />
          </caption>
        )}
        {e.colLabels && (
          <thead>
            <tr>
              {e.colLabels.map((label, i) => (
                <th
                  key={i}
                  className="border border-border-subtle bg-bg-raised px-2 py-1 text-left font-semibold"
                >
                  <EntryRenderer entry={label} />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {e.rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className="border border-border-subtle px-2 py-1 align-top">
                  <EntryRenderer entry={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderInset(e: InsetEntry, readaloud: boolean): ReactNode {
  return (
    <div
      className={`rd-inset my-2 rounded-md border-l-2 border-border-strong bg-bg-raised px-3 py-2 ${
        readaloud ? "italic" : ""
      }`}
    >
      {e.name && (
        <p className="font-semibold">
          <InlineText text={typeof e.name === "string" ? e.name : String(e.name)} />
        </p>
      )}
      {(e.entries ?? []).map((child, i) => (
        <EntryRenderer key={entryKey(child, i)} entry={child} />
      ))}
    </div>
  );
}

function renderQuote(e: QuoteEntry): ReactNode {
  return (
    <blockquote className="rd-quote my-2 border-l-2 border-accent bg-bg-subtle px-3 py-2 italic">
      {(e.entries ?? []).map((child, i) => (
        <div key={entryKey(child, i)}>“<EntryRenderer entry={child} />”</div>
      ))}
      {e.by && (
        <footer className="mt-1 text-right text-fg-muted">
          — <InlineText text={typeof e.by === "string" ? e.by : String(e.by)} />
        </footer>
      )}
    </blockquote>
  );
}

function renderImage(e: ImageEntry): ReactNode {
  const href = e.href?.path;
  if (!href) return null;
  // Validate the data-derived path. Render only same-origin paths; reject any
  // absolute URL with a scheme (a poisoned data file could otherwise point the
  // <img src> at an arbitrary endpoint for SSRF-style GETs).
  const src = `/${href}`;
  if (!isSafeUrl(src)) return null;
  // Legacy paths are relative to the site root; v1 may not ship all images.
  return (
    <figure className="rd-image my-2">
      <img
        src={src}
        alt={typeof e.title === "string" ? e.title : ""}
        className="max-w-full rounded-md"
        loading="lazy"
      />
      {(e.title || e.credit) && (
        <figcaption className="text-xs text-fg-muted">
          {e.title && <span>{String(e.title)}. </span>}
          {e.credit && <span>Illustration: {String(e.credit)}</span>}
        </figcaption>
      )}
    </figure>
  );
}

function renderGallery(e: GalleryEntry): ReactNode {
  return (
    <div className="rd-gallery my-2 grid grid-cols-2 gap-2">
      {e.images.map((img, i) => (
        <EntryRenderer key={entryKey(img, i)} entry={img} />
      ))}
    </div>
  );
}

function renderItem(e: ItemEntry, italic: boolean): ReactNode {
  return (
    <div className="rd-item my-0.5">
      {e.name && (
        <span className={italic ? "italic" : "font-semibold"}>
          <InlineText text={typeof e.name === "string" ? e.name : String(e.name)} />.{" "}
        </span>
      )}
      {e.entry != null ? (
        <EntryRenderer entry={e.entry} />
      ) : (
        (e.entries ?? []).map((c, i) => <EntryRenderer key={entryKey(c, i)} entry={c} />)
      )}
    </div>
  );
}

function renderUnknown(e: object, depth: number): ReactNode {
  const obj = e as { type?: string; name?: Entry; entries?: Entry[]; items?: Entry[] };
  const children = obj.entries ?? obj.items ?? [];
  return (
    <div className="my-1 rounded border border-dashed border-border-subtle px-2 py-1 text-fg-muted">
      {obj.name && (
        <span className="font-semibold">
          {typeof obj.name === "string" ? obj.name : JSON.stringify(obj.name)}.{" "}
        </span>
      )}
      {children.map((c, i) => (
        <EntryRenderer key={entryKey(c, i)} entry={c} depth={depth + 1} />
      ))}
      {children.length === 0 && !obj.name && (
        <span className="text-xs">[unhandled entry type: {obj.type}]</span>
      )}
    </div>
  );
}

/** Convenience: render an array of entries. */
export function renderEntriesArray(entries: Entry[], depth = 0): ReactNode {
  return entries.map((e, i) => <EntryRenderer key={i} entry={e} depth={depth} />);
}
