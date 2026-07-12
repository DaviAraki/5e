import type { Language } from "@/types/entities";
import EntryRenderer from "@/render/EntryRenderer";
import { sourceToAbv } from "@/lib/spellFormatters";
import ShareLinkButton from "@/components/ShareLinkButton";

/**
 * LanguageStatBlock — displays a single language (e.g. Castinellan, Common).
 */
export default function LanguageStatBlock({ language }: { language: Language }) {
  const typeLabel = language.type ? language.type.charAt(0).toUpperCase() + language.type.slice(1) : null;
  return (
    <article className="mx-auto max-w-2xl px-4 py-6 font-serif text-fg">
      <div className="flex items-start justify-between gap-3 border-b-2 border-border pb-1">
        <h2 className="rd-heading text-2xl font-bold italic">{language.name}</h2>
        <ShareLinkButton />
      </div>
      {typeLabel && (
        <p className="mt-0.5 text-sm italic text-fg-muted">{typeLabel} Language</p>
      )}

      {language.script && (
        <div className="mt-3 border-b-2 border-border pb-2 text-sm">
          <StatLine label="Script" value={language.script} />
        </div>
      )}

      <div className="mt-4 space-y-2 font-sans">
        {language.entries.map((entry, i) => (
          <EntryRenderer key={i} entry={entry} />
        ))}
      </div>

      <footer className="mt-6 border-t border-border-subtle pt-2 text-xs text-fg-muted">
        Source: {sourceToAbv(language.source)}
        {language.page ? ` p.${language.page}` : ""}
      </footer>
    </article>
  );
}

function StatLine({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <p>
      <span className="font-bold">{label}</span> <span className="text-fg">{value}</span>
    </p>
  );
}
