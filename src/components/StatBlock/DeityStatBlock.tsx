import type { Deity } from "@/types/entities";
import EntryRenderer from "@/render/EntryRenderer";
import { sourceToAbv } from "@/lib/spellFormatters";
import ShareLinkButton from "@/components/ShareLinkButton";
import { StatLine } from "@/components/StatBlock/StatLine";

/**
 * DeityStatBlock — displays a single deity (e.g. Empyreus, Arch Seraph of Valor).
 */
export default function DeityStatBlock({ deity }: { deity: Deity }) {
  const domains = deity.domains?.length ? deity.domains.join(", ") : null;
  return (
    <article className="mx-auto max-w-2xl px-4 py-6 font-serif text-fg">
      <div className="flex items-start justify-between gap-3 border-b-2 border-border pb-1">
        <div>
          <h2 className="rd-heading text-2xl font-bold italic">{deity.name}</h2>
          {deity.title && (
            <p className="text-sm italic text-fg-muted">{deity.title}</p>
          )}
        </div>
        <ShareLinkButton />
      </div>

      {(deity.pantheon || domains || deity.alignment) && (
        <div className="mt-3 border-b-2 border-border pb-2 text-sm">
          {deity.pantheon && <StatLine label="Pantheon" value={deity.pantheon} />}
          {domains && <StatLine label="Domains" value={domains} />}
          {deity.alignment && <StatLine label="Alignment" value={deity.alignment.join(" ")} />}
        </div>
      )}

      <div className="mt-4 space-y-2 font-sans">
        {deity.entries.map((entry, i) => (
          <EntryRenderer key={i} entry={entry} />
        ))}
      </div>

      <footer className="mt-6 border-t border-border-subtle pt-2 text-xs text-fg-muted">
        Source: {sourceToAbv(deity.source)}
        {deity.page ? ` p.${deity.page}` : ""}
      </footer>
    </article>
  );
}
