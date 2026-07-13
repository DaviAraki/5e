import { lazy, Suspense, useEffect } from "react";
import { useEntityPreview } from "@/state/entityPreview";

// The full EntityContent tree (StatBlocks, EntryRenderer, formatters) is only
// needed once a preview opens. Code-splitting it keeps the initial bundle — and
// thus first-paint main-thread work — minimal.
const EntityPreviewModalBody = lazy(
  () => import("@/components/EntityPreviewModalBody"),
);

/**
 * EntityPreviewModal — a popover that shows a quick-look of any entity
 * referenced by an inline {@tag} link. Always mounted so it can register the
 * Escape handler; the heavy body loads lazily on first open.
 */
export default function EntityPreviewModal() {
  const { open, closePreview } = useEntityPreview();

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

  return (
    <Suspense fallback={null}>
      <EntityPreviewModalBody />
    </Suspense>
  );
}
