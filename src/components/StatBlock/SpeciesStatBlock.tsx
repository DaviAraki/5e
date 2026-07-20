import type { Species } from "@/types/entities";
import EntryRenderer from "@/render/EntryRenderer";
import { sourceToAbv } from "@/lib/spellFormatters";
import ShareLinkButton from "@/components/ShareLinkButton";
import { StatLine } from "@/components/StatBlock/StatLine";

/**
 * SpeciesStatBlock — displays a playable species/race.
 * Header: name + creature type/size/speed summary.
 * Stats: Size, Speed, Darkvision, Resistances (if present).
 * Traits: each entry block (Darkvision, Fey Ancestry, etc.).
 */
export default function SpeciesStatBlock({ species }: { species: Species }) {
  const hasStats =
    species.size || species.speed || species.darkvision || species.resist?.length;

  return (
    <article className="mx-auto max-w-2xl px-4 py-6 font-serif text-fg">
      <div className="flex items-start justify-between gap-3 border-b-2 border-border pb-1">
        <h2 className="rd-heading text-2xl font-bold italic">{species.name}</h2>
        <ShareLinkButton />
      </div>

      {/* Creature type line */}
      {species.creatureTypes && species.creatureTypes.length > 0 && (
        <p className="mt-0.5 text-sm italic text-fg-muted">
          {species.creatureTypes.map(capitalize).join(", ")}
        </p>
      )}

      {/* Core stats */}
      {hasStats && (
        <div className="mt-3 border-b-2 border-border pb-2 text-sm">
          {species.size && (
            <StatLine label="Size" value={species.size.map(sizeToFull).join(" or ")} />
          )}
          {species.speed != null && <StatLine label="Speed" value={`${species.speed} ft.`} />}
          {species.darkvision != null && (
            <StatLine label="Darkvision" value={`${species.darkvision} ft.`} />
          )}
          {species.resist?.length && (
            <StatLine label="Damage Resistance" value={species.resist.map(capitalize).join(", ")} />
          )}
        </div>
      )}

      {/* Traits */}
      <div className="mt-4 space-y-3 font-sans">
        {species.entries.map((entry, i) => (
          <EntryRenderer key={i} entry={entry} />
        ))}
      </div>

      <footer className="mt-6 border-t border-border-subtle pt-2 text-xs text-fg-muted">
        Source: {sourceToAbv(species.source)}
        {species.page ? ` p.${species.page}` : ""}
      </footer>
    </article>
  );
}

const SIZE_MAP: Record<string, string> = {
  S: "Small",
  M: "Medium",
  L: "Large",
  T: "Tiny",
};

function sizeToFull(code: string): string {
  return SIZE_MAP[code] ?? code;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
