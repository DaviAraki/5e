import type { Disease } from "@/types/entities";
import EntryRenderer from "@/render/EntryRenderer";
import { sourceToAbv } from "@/lib/spellFormatters";
import ShareLinkButton from "@/components/ShareLinkButton";

/**
 * DiseaseStatBlock — displays a single disease (e.g. Weeping Pox).
 */
export default function DiseaseStatBlock({ disease }: { disease: Disease }) {
  const save = disease.save ? disease.save.toUpperCase() : null;
  return (
    <article className="mx-auto max-w-2xl px-4 py-6 font-serif text-fg">
      <div className="flex items-start justify-between gap-3 border-b-2 border-border pb-1">
        <h2 className="rd-heading text-2xl font-bold italic">{disease.name}</h2>
        <ShareLinkButton />
      </div>

      {(disease.dc || save || disease.duration) && (
        <div className="mt-3 border-b-2 border-border pb-2 text-sm">
          {disease.dc && save && <StatLine label="Saving Throw" value={`DC ${disease.dc} ${save}`} />}
          {disease.duration && <StatLine label="Duration" value={disease.duration} />}
        </div>
      )}

      <div className="mt-4 space-y-2 font-sans">
        {disease.entries.map((entry, i) => (
          <EntryRenderer key={i} entry={entry} />
        ))}
      </div>

      <footer className="mt-6 border-t border-border-subtle pt-2 text-xs text-fg-muted">
        Source: {sourceToAbv(disease.source)}
        {disease.page ? ` p.${disease.page}` : ""}
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
