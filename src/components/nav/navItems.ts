/**
 * Grouped navigation config — the single source of truth consumed by the
 * desktop {@link Header} (category dropdowns), the mobile {@link MobileNav}
 * (sectioned drawer), and the landing page (grouped tile grid).
 *
 * Order matters: groups render top-to-bottom / left-to-right in every surface.
 */

export interface NavEntry {
  to: string;
  label: string;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavEntry[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "characters",
    label: "Characters",
    items: [
      { to: "/classes", label: "Classes" },
      { to: "/species", label: "Species" },
      { to: "/backgrounds", label: "Backgrounds" },
      { to: "/feats", label: "Feats" },
      { to: "/optional-features", label: "Optional Features" },
    ],
  },
  {
    id: "magic",
    label: "Magic",
    items: [
      { to: "/spells", label: "Spells" },
      { to: "/spellbook", label: "Spell Book" },
      { to: "/conditions", label: "Conditions" },
      { to: "/diseases", label: "Diseases" },
      { to: "/transformations", label: "Transformations" },
    ],
  },
  {
    id: "bestiary-lore",
    label: "Bestiary & Lore",
    items: [
      { to: "/bestiary", label: "Bestiary" },
      { to: "/legendary-groups", label: "Legendary Groups" },
      { to: "/deities", label: "Deities" },
    ],
  },
  {
    id: "treasure",
    label: "Treasure",
    items: [
      { to: "/items", label: "Items" },
      { to: "/loot", label: "Loot" },
    ],
  },
  {
    id: "reference",
    label: "Reference",
    items: [
      { to: "/languages", label: "Languages" },
      { to: "/tables", label: "Tables" },
      { to: "/books", label: "Books" },
    ],
  },
];
