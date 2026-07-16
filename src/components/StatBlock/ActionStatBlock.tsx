import type { ActionTime } from "@/types/entities";
import type { Action } from "@/types/entities";
import EntryRenderer from "@/render/EntryRenderer";
import { sourceToAbv } from "@/lib/spellFormatters";
import ShareLinkButton from "@/components/ShareLinkButton";

/** ActionTime → "1 action" / "1 bonus action" / "1 reaction". */
function actionTimeToFull(t: ActionTime): string {
  const unitDisplay: Record<string, string> = {
    action: "action",
    bonus: "bonus action",
    "bonus action": "bonus action",
    reaction: "reaction",
  };
  const unit = unitDisplay[t.unit] ?? t.unit;
  const plural = t.number > 1 ? "s" : "";
  const base = `${t.number} ${unit}${plural}`;
  return t.condition ? `${base} (${t.condition})` : base;
}

/**
 * ActionStatBlock — displays a single combat action (e.g. Dodge, Hide).
 */
export default function ActionStatBlock({ action }: { action: Action }) {
  return (
    <article className="mx-auto max-w-2xl px-4 py-6 font-serif text-fg">
      <div className="flex items-start justify-between gap-3 border-b-2 border-border pb-1">
        <h2 className="rd-heading text-2xl font-bold italic">{action.name}</h2>
        <ShareLinkButton />
      </div>

      {action.time?.length ? (
        <p className="mt-2 font-sans text-sm text-fg-muted">
          {action.time.map(actionTimeToFull).join(", ")}
        </p>
      ) : null}

      <div className="mt-4 space-y-2 font-sans">
        {action.entries.map((entry, i) => (
          <EntryRenderer key={i} entry={entry} />
        ))}
      </div>

      <footer className="mt-6 border-t border-border-subtle pt-2 text-xs text-fg-muted">
        Source: {sourceToAbv(action.source)}
        {action.page ? ` p.${action.page}` : ""}
      </footer>
    </article>
  );
}
