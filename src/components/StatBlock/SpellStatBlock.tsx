import type { Spell } from "@/types/entities";
import EntryRenderer from "@/render/EntryRenderer";
import {
  spLevelSchoolRitualStr,
  spTimeToFull,
  spRangeToFull,
  spComponentsToFull,
  spDurationToFull,
  spClassesToFull,
  sourceToAbv,
  spSchoolToFull,
} from "@/lib/spellFormatters";

/**
 * SpellStatBlock — the right-hand detail pane for a selected spell.
 * Mirrors the classic 5etools spell stat block layout.
 */
export default function SpellStatBlock({ spell }: { spell: Spell }) {
  return (
    <article className="mx-auto max-w-2xl px-4 py-6 font-serif text-fg">
      {/* Title */}
      <h2 className="rd-heading border-b border-border-subtle pb-1 text-2xl font-bold">
        {spell.name}
      </h2>

      {/* School + level line */}
      <p className="mt-1 italic text-fg-muted">
        <span className={`text-school-${spell.school}`}>{spSchoolToFull(spell.school)}</span>
        {" — "}
        {spLevelSchoolRitualStr(spell)}
      </p>

      {/* Stat table */}
      <dl className="mt-3 divide-y divide-border-subtle border-y border-border-subtle text-sm">
        <StatRow label="Casting Time" value={spell.time.map(spTimeToFull).join(" or ")} />
        <StatRow label="Range" value={spRangeToFull(spell.range)} />
        <StatRow label="Components" value={spComponentsToFull(spell.components)} />
        <StatRow label="Duration" value={spell.duration.map(spDurationToFull).join(" or ")} />
        <StatRow label="Classes" value={spClassesToFull(spell.classes)} />
      </dl>

      {/* Body entries */}
      <div className="mt-4 space-y-2 font-sans">
        {spell.entries.map((entry, i) => (
          <EntryRenderer key={i} entry={entry} />
        ))}
      </div>

      {/* At Higher Levels */}
      {spell.entriesHigherLevel && spell.entriesHigherLevel.length > 0 && (
        <div className="mt-3 font-sans">
          {spell.entriesHigherLevel.map((entry, i) => (
            <EntryRenderer key={i} entry={entry} depth={1} />
          ))}
        </div>
      )}

      {/* Footer / source */}
      <footer className="mt-6 border-t border-border-subtle pt-2 text-xs text-fg-muted">
        Source: {sourceToAbv(spell.source)}
        {spell.page ? ` p.${spell.page}` : ""}
        {spell.damageInflict && spell.damageInflict.length > 0 && (
          <> · Damage: {spell.damageInflict.join(", ")}</>
        )}
        {spell.savingThrow && spell.savingThrow.length > 0 && (
          <> · Save: {spell.savingThrow.map(capitalize).join(", ")}</>
        )}
      </footer>
    </article>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 py-1">
      <dt className="w-32 shrink-0 font-semibold text-fg-muted">{label}</dt>
      <dd className="flex-1">{value}</dd>
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
