import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useEntityPreview, type EntityType } from "@/state/entityPreview";
import type { ResolvedData, Spell, Monster, Item, Feat, VariantRule } from "@/types/entities";
import SpellStatBlock from "@/components/StatBlock/SpellStatBlock";
import MonsterStatBlock from "@/components/StatBlock/MonsterStatBlock";
import ItemStatBlock from "@/components/StatBlock/ItemStatBlock";
import FeatStatBlock from "@/components/StatBlock/FeatStatBlock";
import VariantRuleStatBlock from "@/components/StatBlock/VariantRuleStatBlock";

/**
 * EntityPreviewModal — a popover that shows a quick-look of any entity
 * referenced by an inline {@tag} link. Resolves the entity from the React
 * Query cache (loaded by the page the user is currently on + preloaded
 * datasets), so it works without a network round-trip.
 *
 * Only entity types we support are shown; others display a "not available"
 * message with a link to the relevant page.
 */
export default function EntityPreviewModal() {
  const { open, closePreview } = useEntityPreview();
  const queryClient = useQueryClient();

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePreview();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, closePreview]);

  if (!open) return null;

  const entity = resolveEntity(queryClient, open.type, open.name, open.source);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={closePreview}
    >
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-bg shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-bg-subtle px-4 py-2">
          <span className="text-xs uppercase tracking-wide text-fg-faint">
            {open.type} preview
          </span>
          <button
            type="button"
            onClick={closePreview}
            className="rounded px-2 py-0.5 text-fg-muted hover:bg-bg-raised hover:text-fg"
          >
            ✕
          </button>
        </div>
        {entity ? (
          <EntityContent type={open.type} data={entity} />
        ) : (
          <div className="p-6 text-center text-sm text-fg-muted">
            <p>
              "{open.name}" ({open.source}) not loaded.
            </p>
            <p className="mt-1 text-xs text-fg-faint">
              This entity may be from a source not included in the current dataset.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/** Resolve an entity from the React Query cache by type + name|source. */
function resolveEntity(
  qc: ReturnType<typeof useQueryClient>,
  type: EntityType,
  name: string,
  source: string,
): unknown | null {
  const nameLower = name.toLowerCase();
  const sourceLower = source.toLowerCase();

  const find = <T extends { name: string; source: string }>(data: T[] | undefined): T | null => {
    if (!data) return null;
    return (
      data.find(
        (e) => e.name.toLowerCase() === nameLower && e.source.toLowerCase() === sourceLower,
      ) ?? null
    );
  };

  switch (type) {
    case "spell": {
      const data = qc.getQueryData<ResolvedData<Spell>>(["spells"]);
      return find(data?.entities);
    }
    case "creature": {
      const data = qc.getQueryData<ResolvedData<Monster>>(["monsters"]);
      return find(data?.entities);
    }
    case "item": {
      const data = qc.getQueryData<{ items: Item[] }>(["items"]);
      return find(data?.items);
    }
    case "feat": {
      const data = qc.getQueryData<ResolvedData<Feat>>(["feats"]);
      return find(data?.entities);
    }
    case "variantrule": {
      const data = qc.getQueryData<ResolvedData<VariantRule>>(["variantrules"]);
      return find(data?.entities);
    }
    default:
      return null;
  }
}

/** Render the resolved entity with the appropriate stat block. */
function EntityContent({ type, data }: { type: EntityType; data: unknown }) {
  switch (type) {
    case "spell":
      return <SpellStatBlock spell={data as Spell} />;
    case "creature":
      return <MonsterStatBlock monster={data as Monster} />;
    case "item":
      return <ItemStatBlock item={data as Item} />;
    case "feat":
      return <FeatStatBlock feat={data as Feat} />;
    case "variantrule":
      return <VariantRuleStatBlock vr={data as VariantRule} />;
    default:
      return <div className="p-4 text-sm text-fg-muted">Preview not available for this entity type.</div>;
  }
}
