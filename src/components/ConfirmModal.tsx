import { useEffect, useState } from "react";

/**
 * Lightweight confirmation modal. Reuses the same overlay pattern as
 * EntityPreviewModal (fixed inset-0 z-50 bg-black/60) with Escape-to-close and
 * backdrop-click-to-close.
 *
 * Usage:
 *   const confirm = useConfirm();
 *   if (await confirm("Remove Fireball?")) doRemove();
 *
 * Or the imperative form:
 *   const { request } = useConfirmState();
 *   request({ message, confirmLabel, onConfirm });
 */

interface ConfirmOptions {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
}

let setter: ((s: ConfirmState | null) => void) | null = null;
let current: ConfirmState | null = null;

/** Request a confirmation. Imperative — callable from anywhere. */
export function requestConfirm(opts: ConfirmOptions): void {
  current = { ...opts, open: true };
  setter?.(current);
}

/** Close the modal without confirming. */
export function closeConfirm(): void {
  current = null;
  setter?.(null);
}

/**
 * Hook that mounts the modal's state into the React tree. Render `<ConfirmModal />`
 * once (e.g. in App), then call `requestConfirm(...)` from anywhere.
 */
export default function ConfirmModal() {
  const [state, setState] = useState<ConfirmState | null>(null);

  useEffect(() => {
    setter = setState;
    return () => {
      setter = null;
    };
  }, []);

  useEffect(() => {
    if (!state) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeConfirm();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state]);

  if (!state) return null;

  const onConfirm = state.onConfirm;
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
          <p className="text-sm text-fg">{state.message}</p>
        </div>
        <div className="flex gap-2 border-t border-border-subtle px-4 py-3">
          <button
            type="button"
            onClick={closeConfirm}
            className="flex-1 rounded-md border border-border px-3 py-1.5 text-sm text-fg-muted hover:text-fg"
          >
            {state.cancelLabel ?? "Cancel"}
          </button>
          <button
            type="button"
            onClick={confirm}
            className={`flex-1 rounded-md border px-3 py-1.5 text-sm ${
              state.destructive
                ? "border-red-500/50 text-red-400 hover:bg-red-950/30"
                : "border-accent bg-accent-subtle text-accent hover:bg-accent"
            }`}
          >
            {state.confirmLabel ?? "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
