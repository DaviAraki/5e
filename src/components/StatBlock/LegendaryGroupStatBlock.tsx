import type { Entry } from "@/types/entities";
import type { LegendaryGroup } from "@/types/entities";
import EntryRenderer from "@/render/EntryRenderer";
import { sourceToAbv } from "@/lib/spellFormatters";
import ShareLinkButton from "@/components/ShareLinkButton";

/**
 * LegendaryGroupStatBlock — displays lair actions and regional effects
 * for a named monster/group (e.g. Blightscale Dragon).
 */
export default function LegendaryGroupStatBlock({ group }: { group: LegendaryGroup }) {
  const lair = (group.lairActions ?? []) as Entry[];
  const regional = (group.regionalEffects ?? []) as Entry[];
  return (
    <article className="mx-auto max-w-2xl px-4 py-6 font-serif text-fg">
      <div className="flex items-start justify-between gap-3 border-b-2 border-border pb-1">
        <h2 className="rd-heading text-2xl font-bold italic">{group.name}</h2>
        <ShareLinkButton />
      </div>
      <p className="mt-0.5 text-sm italic text-fg-muted">Legendary Group</p>

      {lair.length > 0 && (
        <section className="mt-4">
          <h3 className="rd-heading mb-1 font-bold">Lair Actions</h3>
          <div className="space-y-2 font-sans">
            {lair.map((entry, i) => (
              <EntryRenderer key={i} entry={entry} />
            ))}
          </div>
        </section>
      )}

      {regional.length > 0 && (
        <section className="mt-4">
          <h3 className="rd-heading mb-1 font-bold">Regional Effects</h3>
          <div className="space-y-2 font-sans">
            {regional.map((entry, i) => (
              <EntryRenderer key={i} entry={entry} />
            ))}
          </div>
        </section>
      )}

      <footer className="mt-6 border-t border-border-subtle pt-2 text-xs text-fg-muted">
        Source: {sourceToAbv(group.source)}
        {group.page ? ` p.${group.page}` : ""}
      </footer>
    </article>
  );
}
