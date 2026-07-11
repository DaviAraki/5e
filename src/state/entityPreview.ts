import { create } from "zustand";

/**
 * Global store for the entity preview popover. Any entity link can trigger
 * `openPreview` to show a quick-look modal without navigating away from the
 * current page. The modal resolves the entity from React Query caches.
 */

export type EntityType =
  | "spell"
  | "creature"
  | "item"
  | "condition"
  | "feat"
  | "background"
  | "species"
  | "class"
  | "skill"
  | "variantrule"
  | "status"
  | "action"
  | "book";

interface PreviewState {
  /** null = closed; otherwise the entity to preview. */
  open: { type: EntityType; name: string; source: string } | null;
  openPreview: (entity: { type: EntityType; name: string; source: string }) => void;
  closePreview: () => void;
}

export const useEntityPreview = create<PreviewState>((set) => ({
  open: null,
  openPreview: (entity) => set({ open: entity }),
  closePreview: () => set({ open: null }),
}));

/** Map an inline-tag name to an EntityType for the preview store. */
export function tagToEntityType(tag: string): EntityType | null {
  const map: Record<string, EntityType> = {
    spell: "spell",
    creature: "creature",
    monster: "creature",
    item: "item",
    condition: "condition",
    status: "status",
    feat: "feat",
    background: "background",
    race: "species",
    class: "class",
    skill: "skill",
    action: "action",
    variantrule: "variantrule",
  };
  return map[tag] ?? null;
}
