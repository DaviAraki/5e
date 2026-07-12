import type { OptionalFeature } from "@/types/entities";
import EntryRenderer from "@/render/EntryRenderer";
import { sourceToAbv } from "@/lib/spellFormatters";
import ShareLinkButton from "@/components/ShareLinkButton";

/**
 * OptionalFeatureStatBlock — displays a single optional feature (boon/flaw,
 * monster grimoire specialization, fighting style option, etc.).
 */
export default function OptionalFeatureStatBlock({ feature }: { feature: OptionalFeature }) {
  const typeLabel = feature.featureType?.join(", ");
  return (
    <article className="mx-auto max-w-2xl px-4 py-6 font-serif text-fg">
      <div className="flex items-start justify-between gap-3 border-b-2 border-border pb-1">
        <h2 className="rd-heading text-2xl font-bold italic">{feature.name}</h2>
        <ShareLinkButton />
      </div>
      {typeLabel && (
        <p className="mt-0.5 text-sm italic text-fg-muted">{typeLabel}</p>
      )}

      {feature.prerequisite?.length ? (
        <div className="mt-3 border-b-2 border-border pb-2 text-sm">
          <p>
            <span className="font-bold">Prerequisite</span>{" "}
            <span className="text-fg">
              {feature.prerequisite.map((p) => (typeof p === "string" ? p : "")).join(" ") ||
                "See description"}
            </span>
          </p>
        </div>
      ) : null}

      <div className="mt-4 space-y-2 font-sans">
        {feature.entries.map((entry, i) => (
          <EntryRenderer key={i} entry={entry} />
        ))}
      </div>

      <footer className="mt-6 border-t border-border-subtle pt-2 text-xs text-fg-muted">
        Source: {sourceToAbv(feature.source)}
        {feature.page ? ` p.${feature.page}` : ""}
      </footer>
    </article>
  );
}
