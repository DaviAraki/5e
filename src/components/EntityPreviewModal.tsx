import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useEntityPreview } from "@/state/entityPreview";
import { resolveEntity } from "@/lib/resolveEntity";
import EntityContent from "@/components/EntityContent";

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
