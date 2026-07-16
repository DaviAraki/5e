import { useQueryClient } from "@tanstack/react-query";
import type { EntityType } from "@/state/entityPreview";
import { useEntityPreview } from "@/state/entityPreview";
import { resolveEntity } from "@/lib/resolveEntity";
import EntityContent from "@/components/EntityContent";
import {
  useSpells,
  useMonsters,
  useItems,
  useFeats,
  useConditions,
  useActions,
  useVariantRules,
} from "@/data/DataLoader";

/**
 * Heavy body of the entity preview popover (resolveEntity + the full
 * EntityContent tree: StatBlocks, EntryRenderer, formatters). Split out from
 * {@link EntityPreviewModal} so it is code-split and only loaded when a preview
 * is actually opened, keeping the initial bundle lean.
 */
export default function EntityPreviewModalBody() {
  const { open, closePreview } = useEntityPreview();

  // `open` is non-null here — the parent gates rendering on it — but guard for
  // the case where it closes before the chunk finishes mounting.
  if (!open) return null;

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
        <EntityPreviewBody type={open.type} name={open.name} source={open.source} />
      </div>
    </div>
  );
}

/**
 * Renders the previewed entity, ensuring its backing dataset is loaded first.
 *
 * On a deep-linked page the relevant React Query cache may be empty (e.g. a
 * user lands on /spells and previews a {@@creature} link before ever visiting
 * /bestiary). Each entity type has a dedicated loader component that fires its
 * own query; picking by type keeps hooks unconditional (rules-of-hooks safe).
 */
function EntityPreviewBody({
  type,
  name,
  source,
}: {
  type: EntityType;
  name: string;
  source: string;
}) {
  switch (type) {
    case "spell":
      return <SpellLoader name={name} source={source} />;
    case "creature":
      return <CreatureLoader name={name} source={source} />;
    case "item":
      return <ItemLoader name={name} source={source} />;
    case "feat":
      return <FeatLoader name={name} source={source} />;
    case "condition":
      return <ConditionLoader name={name} source={source} />;
    case "action":
      return <ActionLoader name={name} source={source} />;
    case "variantrule":
      return <VariantRuleLoader name={name} source={source} />;
    default:
      return <ResolvedEntity type={type} name={name} source={source} />;
  }
}

/** Reads the (now-warm) cache and renders the entity, or the not-found fallback. */
function ResolvedEntity({
  type,
  name,
  source,
}: {
  type: EntityType;
  name: string;
  source: string;
}) {
  const queryClient = useQueryClient();
  const entity = resolveEntity(queryClient, type, name, source);

  if (entity) {
    return <EntityContent type={type} data={entity} />;
  }

  return (
    <div className="p-6 text-center text-sm text-fg-muted">
      <p>
        "{name}" ({source}) not loaded.
      </p>
      <p className="mt-1 text-xs text-fg-faint">
        This entity may be from a source not included in the current dataset.
      </p>
    </div>
  );
}

// Per-type loader: fires its single dataset query unconditionally, then renders.
// React Query re-renders on fetch resolve, so ResolvedEntity picks up the cache.

function SpellLoader({ name, source }: { name: string; source: string }) {
  useSpells();
  return <ResolvedEntity type="spell" name={name} source={source} />;
}

function CreatureLoader({ name, source }: { name: string; source: string }) {
  useMonsters();
  return <ResolvedEntity type="creature" name={name} source={source} />;
}

function ItemLoader({ name, source }: { name: string; source: string }) {
  useItems();
  return <ResolvedEntity type="item" name={name} source={source} />;
}

function FeatLoader({ name, source }: { name: string; source: string }) {
  useFeats();
  return <ResolvedEntity type="feat" name={name} source={source} />;
}

function ConditionLoader({ name, source }: { name: string; source: string }) {
  useConditions();
  return <ResolvedEntity type="condition" name={name} source={source} />;
}

function ActionLoader({ name, source }: { name: string; source: string }) {
  useActions();
  return <ResolvedEntity type="action" name={name} source={source} />;
}

function VariantRuleLoader({ name, source }: { name: string; source: string }) {
  useVariantRules();
  return <ResolvedEntity type="variantrule" name={name} source={source} />;
}
