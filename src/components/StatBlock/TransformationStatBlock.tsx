import type { Transformation } from "@/types/entities";
import EntryRenderer from "@/render/EntryRenderer";
import { sourceToAbv } from "@/lib/spellFormatters";
import ShareLinkButton from "@/components/ShareLinkButton";

/**
 * TransformationStatBlock — displays a Grim Hollow transformation
 * (e.g. Aberrant Horror, Lycanthrope): a multi-stage character option with
 * nested boon/flaw entries. The Entry[] DSL handles the nested structure.
 */
export default function TransformationStatBlock({ transformation }: { transformation: Transformation }) {
  const typeLabel = transformation.optionType?.join(", ");
  return (
    <article className="mx-auto max-w-2xl px-4 py-6 font-serif text-fg">
      <div className="flex items-start justify-between gap-3 border-b-2 border-border pb-1">
        <h2 className="rd-heading text-2xl font-bold italic">{transformation.name}</h2>
        <ShareLinkButton />
      </div>
      {typeLabel && (
        <p className="mt-0.5 text-sm italic text-fg-muted">{typeLabel}</p>
      )}

      <div className="mt-4 space-y-2 font-sans">
        {transformation.entries.map((entry, i) => (
          <EntryRenderer key={i} entry={entry} />
        ))}
      </div>

      <footer className="mt-6 border-t border-border-subtle pt-2 text-xs text-fg-muted">
        Source: {sourceToAbv(transformation.source)}
        {transformation.page ? ` p.${transformation.page}` : ""}
      </footer>
    </article>
  );
}
