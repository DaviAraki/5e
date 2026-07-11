import type { Spell } from "@/types/entities";
import EntryRenderer from "@/render/EntryRenderer";
import { makeRef, refKey } from "@/data/entityRefs";
import { useSpellBook } from "@/state/spellBook";
import ShareLinkButton from "@/components/ShareLinkButton";
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
  const activeBookId = useSpellBook((s) => s.activeBookId);
  const activeBookName = useSpellBook((s) =>
    s.activeBookId ? s.books[s.activeBookId]?.name ?? null : null,
  );
  const inBook = useSpellBook((s) => {
    if (!s.activeBookId) return false;
    return refKey(makeRef(spell.name, spell.source)) in (s.books[s.activeBookId]?.spells ?? {});
  });
  const addToBook = useSpellBook((s) => s.addToBook);
  const removeFromBook = useSpellBook((s) => s.removeFromBook);

  function toggleBook() {
    if (!activeBookId) return;
    const key = refKey(makeRef(spell.name, spell.source));
    if (inBook) removeFromBook(activeBookId, key);
    else addToBook(activeBookId, key);
  }

  return (
    <article className="mx-auto max-w-2xl px-4 py-6 font-serif text-fg">
      {/* Title + spell-book action */}
      <div className="flex items-start justify-between gap-3 border-b border-border-subtle pb-1">
        <h2 className="rd-heading text-2xl font-bold">{spell.name}</h2>
        <div className="flex shrink-0 items-center gap-2">
          <ShareLinkButton />
          <button
          type="button"
          disabled={activeBookId == null}
          onClick={toggleBook}
          title={
            activeBookId == null
              ? "Create a spell book first"
              : inBook
                ? `Remove from ${activeBookName ?? "spell book"}`
                : `Add to ${activeBookName ?? "spell book"}`
          }
          className={`shrink-0 rounded-md border px-2.5 py-1 font-sans text-xs transition-colors ${
            activeBookId == null
              ? "cursor-not-allowed border-border-subtle text-fg-faint"
              : inBook
                ? "border-accent bg-accent-subtle text-accent"
                : "border-border text-fg-muted hover:border-accent hover:text-accent"
          }`}
        >
          {inBook ? "✓ In Book" : "+ Add to Book"}
        </button>
        </div>
      </div>

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
