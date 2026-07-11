import type { VariantRule } from "@/types/entities";
import EntryRenderer from "@/render/EntryRenderer";
import { sourceToAbv } from "@/lib/spellFormatters";

/**
 * VariantRuleStatBlock — a simple rule reference display.
 */
export default function VariantRuleStatBlock({ vr }: { vr: VariantRule }) {
  return (
    <article className="px-4 py-6 font-serif text-fg">
      <h2 className="rd-heading border-b-2 border-border pb-1 text-xl font-bold italic">
        {vr.name}
      </h2>
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
