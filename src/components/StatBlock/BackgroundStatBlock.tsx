import type { Background } from "@/types/entities";
import EntryRenderer from "@/render/EntryRenderer";
import { sourceToAbv } from "@/lib/spellFormatters";

/**
 * BackgroundStatBlock — displays a single background.
 * 2024/One backgrounds store everything in a `list` entry with labeled items:
 * Ability Scores, Feat, Skill Proficiencies, Tool Proficiency, Equipment.
 * Some backgrounds also have a separate feature block (data.isFeature).
 */
export default function BackgroundStatBlock({ bg }: { bg: Background }) {
  // Separate the feature block (if any) from the rest of the entries.
  const featureEntry = bg.entries.find(
    (e) => typeof e === "object" && "data" in e && (e as { data?: { isFeature?: boolean } }).data?.isFeature,
  );
  const otherEntries = bg.entries.filter((e) => e !== featureEntry);

  return (
    <article className="mx-auto max-w-2xl px-4 py-6 font-serif text-fg">
      <h2 className="rd-heading border-b-2 border-border pb-1 text-2xl font-bold italic">
        {bg.name}
      </h2>

      {/* Body entries (the proficiency/equipment list + any extra blocks) */}
      <div className="mt-4 space-y-3 font-sans">
        {otherEntries.map((entry, i) => (
          <EntryRenderer key={i} entry={entry} />
        ))}
      </div>

      {/* Feature block (if present separately) */}
      {featureEntry && (
        <div className="mt-4 border-l-2 border-accent pl-3 font-sans">
          <EntryRenderer entry={featureEntry} />
        </div>
      )}

      <footer className="mt-6 border-t border-border-subtle pt-2 text-xs text-fg-muted">
        Source: {sourceToAbv(bg.source)}
        {bg.page ? ` p.${bg.page}` : ""}
      </footer>
    </article>
  );
}
