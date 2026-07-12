import type { Condition } from "@/types/entities";
import EntryRenderer from "@/render/EntryRenderer";
import { sourceToAbv } from "@/lib/spellFormatters";
import ShareLinkButton from "@/components/ShareLinkButton";

/**
 * ConditionStatBlock — displays a single condition (e.g. Bleeding, Blinded).
 */
export default function ConditionStatBlock({ condition }: { condition: Condition }) {
  return (
    <article className="mx-auto max-w-2xl px-4 py-6 font-serif text-fg">
      <div className="flex items-start justify-between gap-3 border-b-2 border-border pb-1">
        <h2 className="rd-heading text-2xl font-bold italic">{condition.name}</h2>
        <ShareLinkButton />
      </div>

      <div className="mt-4 space-y-2 font-sans">
        {condition.entries.map((entry, i) => (
          <EntryRenderer key={i} entry={entry} />
        ))}
      </div>

      <footer className="mt-6 border-t border-border-subtle pt-2 text-xs text-fg-muted">
        Source: {sourceToAbv(condition.source)}
        {condition.page ? ` p.${condition.page}` : ""}
      </footer>
    </article>
  );
}
