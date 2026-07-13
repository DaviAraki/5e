import { useQueryClient } from "@tanstack/react-query";
import { useEntityPreview } from "@/state/entityPreview";
import { resolveEntity } from "@/lib/resolveEntity";
import EntityContent from "@/components/EntityContent";

/**
 * Heavy body of the entity preview popover (resolveEntity + the full
 * EntityContent tree: StatBlocks, EntryRenderer, formatters). Split out from
 * {@link EntityPreviewModal} so it is code-split and only loaded when a preview
 * is actually opened, keeping the initial bundle lean.
 */
export default function EntityPreviewModalBody() {
  const { open, closePreview } = useEntityPreview();
  const queryClient = useQueryClient();

  // `open` is non-null here — the parent gates rendering on it — but guard for
  // the case where it closes before the chunk finishes mounting.
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
