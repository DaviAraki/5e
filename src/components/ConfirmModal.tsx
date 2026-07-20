import { useEffect } from "react";
import { useConfirmModal, closeConfirm } from "@/state/confirmModal";

/**
 * Lightweight confirmation modal. Reuses the same overlay pattern as
 * EntityPreviewModal (fixed inset-0 z-50 bg-black/60) with Escape-to-close and
 * backdrop-click-to-close.
 *
 * State lives in the `confirmModal` Zustand store (mirrors entityPreview), so
 * any caller — hooked or not — can trigger it via `requestConfirm(opts)`.
 * Render `<ConfirmModal />` once in the App tree.
 */

export { requestConfirm, closeConfirm, type ConfirmOptions } from "@/state/confirmModal";

export default function ConfirmModal() {
  const active = useConfirmModal((s) => s.active);

  useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeConfirm();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  if (!active) return null;

  const onConfirm = active.onConfirm;
  function confirm() {
    closeConfirm();
    onConfirm();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={closeConfirm}
    >
      <div
        className="w-full max-w-sm rounded-lg border border-border bg-bg shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-4">
          <p className="text-sm text-fg">{active.message}</p>
        </div>
        <div className="flex gap-2 border-t border-border-subtle px-4 py-3">
          <button
            type="button"
            onClick={closeConfirm}
            className="flex-1 rounded-md border border-border px-3 py-1.5 text-sm text-fg-muted hover:text-fg"
          >
            {active.cancelLabel ?? "Cancel"}
          </button>
          <button
            type="button"
            onClick={confirm}
            className={`flex-1 rounded-md border px-3 py-1.5 text-sm ${
              active.destructive
                ? "border-red-500/50 text-red-400 hover:bg-red-950/30"
                : "border-accent bg-accent-subtle text-accent hover:bg-accent"
            }`}
          >
            {active.confirmLabel ?? "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
