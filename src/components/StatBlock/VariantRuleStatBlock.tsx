import type { VariantRule } from "@/types/entities";
import EntryRenderer from "@/render/EntryRenderer";
import { sourceToAbv } from "@/lib/spellFormatters";
import ShareLinkButton from "@/components/ShareLinkButton";

/**
 * VariantRuleStatBlock — a simple rule reference display.
 */
export default function VariantRuleStatBlock({ vr }: { vr: VariantRule }) {
  return (
    <article className="px-4 py-6 font-serif text-fg">
      <div className="flex items-start justify-between gap-3 border-b-2 border-border pb-1">
        <h2 className="rd-heading text-xl font-bold italic">{vr.name}</h2>
        <ShareLinkButton />
      </div>
      <div className="mt-3 space-y-2 font-sans text-sm">
        {vr.entries.map((entry, i) => (
          <EntryRenderer key={i} entry={entry} />
        ))}
      </div>
      <footer className="mt-4 border-t border-border-subtle pt-2 text-xs text-fg-muted">
        Source: {sourceToAbv(vr.source)}
        {vr.page ? ` p.${vr.page}` : ""}
      </footer>
    </article>
  );
}
