import { memo } from "react";
import type { Feat } from "@/types/entities";
import EntryRenderer from "@/render/EntryRenderer";
import { categoryToFull, abilityToFull, prerequisiteToFull } from "@/lib/featFormatters";
import { sourceToAbv } from "@/lib/spellFormatters";
import ShareLinkButton from "@/components/ShareLinkButton";
import { StatLine } from "@/components/StatBlock/StatLine";

/**
 * FeatStatBlock — displays a single feat.
 * Header: name + category subtitle.
 * Stats: ability increase, prerequisite, repeatable (if present).
 * Body: the feat's entries (mechanics text).
 */
const FeatStatBlock = memo(function FeatStatBlock({ feat }: { feat: Feat }) {
  const category = categoryToFull(feat.category);
  const ability = abilityToFull(feat.ability);
  const prereq = prerequisiteToFull(feat.prerequisite);

  return (
    <article className="mx-auto max-w-2xl px-4 py-6 font-serif text-fg">
      <div className="flex items-start justify-between gap-3 border-b-2 border-border pb-1">
        <h2 className="rd-heading text-2xl font-bold italic">{feat.name}</h2>
        <ShareLinkButton />
      </div>
      {category && (
        <p className="mt-0.5 text-sm italic text-fg-muted">
          {category} Feat
          {feat.repeatable && !feat.repeatableHidden && " (Repeatable)"}
        </p>
      )}

      {/* Quick stats */}
      {(ability || prereq) && (
        <div className="mt-3 border-b-2 border-border pb-2 text-sm">
          {ability && <StatLine label="Ability" value={ability} />}
          {prereq && <StatLine label="Prerequisite" value={prereq} />}
        </div>
      )}

      {/* Body */}
      <div className="mt-4 space-y-2 font-sans">
        {feat.entries.map((entry, i) => (
          <EntryRenderer key={i} entry={entry} />
        ))}
      </div>

      <footer className="mt-6 border-t border-border-subtle pt-2 text-xs text-fg-muted">
        Source: {sourceToAbv(feat.source)}
        {feat.page ? ` p.${feat.page}` : ""}
      </footer>
    </article>
  );
});

export default FeatStatBlock;
