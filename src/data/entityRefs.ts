import type { EntityRef } from "@/types/entities";

/**
 * Helpers for the 5etools `name|source` composite-key convention.
 * Keys are case-insensitive on lookup; we normalize to lower-case for keys.
 */

export interface ResolvedRef {
  name: string;
  source: string;
}

/** Parse "Fireball|XPHB" into { name, source }. Source defaults to "" if absent. */
export function parseRef(ref: EntityRef): ResolvedRef {
  const [name, source = ""] = ref.split("|");
  return { name: name ?? "", source };
}

/** Build a normalized storage key: "fireball|xphb". */
export function refKey(ref: EntityRef): string {
  return ref.toLowerCase();
}

/** Build a ref from parts. */
export function makeRef(name: string, source: string): EntityRef {
  return `${name}|${source}`;
}

/**
 * Index an entity array by its composite key for O(1) cross-reference lookup.
 * Used by HoverCard / spell-list resolution.
 */
export function indexByRef<T extends { name: string; source: string }>(
  entities: T[],
): Map<string, T> {
  const map = new Map<string, T>();
  for (const e of entities) {
    map.set(refKey(makeRef(e.name, e.source)), e);
  }
  return map;
}

/**
 * The URL hash fragment format used by the legacy site for deep links.
 * e.g. "spells.html#fireball=xphb" — name (lowercased) = source (lowercased).
 */
export function refToHash(name: string, source: string): string {
  return `${name.toLowerCase()}=${source.toLowerCase()}`;
}
