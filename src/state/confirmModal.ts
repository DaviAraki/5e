import { create } from "zustand";

/**
 * Global store for the imperative confirm dialog.
 *
 * Previously this was implemented as a module-level singleton with an
 * effect-wired setter in `ConfirmModal.tsx` — an anti-pattern that mixes
 * global mutable state with React state ownership. Moving it to a Zustand
 * store mirrors `entityPreview.ts` and gives us the same predictable model:
 * one source of truth, callable from anywhere via `requestConfirm` /
 * `closeConfirm`.
 */

export interface ConfirmOptions {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}

interface ConfirmState {
  /** null = closed; otherwise the active confirmation. */
  active: ConfirmOptions | null;
  /** Open the modal with the given options. */
  requestConfirm: (opts: ConfirmOptions) => void;
  /** Close without invoking onConfirm. */
  closeConfirm: () => void;
}

export const useConfirmModal = create<ConfirmState>((set) => ({
  active: null,
  requestConfirm: (opts) => set({ active: opts }),
  closeConfirm: () => set({ active: null }),
}));

/** Imperative accessor for callers that don't need reactive subscription. */
export function requestConfirm(opts: ConfirmOptions): void {
  useConfirmModal.getState().requestConfirm(opts);
}

/** Imperative close. */
export function closeConfirm(): void {
  useConfirmModal.getState().closeConfirm();
}
