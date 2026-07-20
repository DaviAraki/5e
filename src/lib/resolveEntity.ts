import type { useQueryClient } from "@tanstack/react-query";
import type { EntityType } from "@/state/entityPreview";
import type { ResolvedData, Spell, Monster, Item, Feat, VariantRule, Condition, Action } from "@/types/entities";

/**
 * Resolve an entity from the React Query cache by type + name|source.
 *
 * Generic over the return entity type so callers get a typed value back instead
 * of `unknown` (previously this returned `unknown | null` and every caller had
 * to cast with `data as Spell`, losing type safety at the resolver seam).
 *
 * The `<T>` is constrained by the caller — `EntityContent` calls
 * `resolveEntity<Spell>(...)` and the switch maps each entity type to its
 * cache shape, so the cast is centralized here rather than scattered across
 * render sites.
 */
export function resolveEntity<T>(
  qc: ReturnType<typeof useQueryClient>,
  type: EntityType,
  name: string,
  source: string,
): T | null {
  const nameLower = name.toLowerCase();
  const sourceLower = source.toLowerCase();

  const find = <U extends { name: string; source: string }>(data: U[] | undefined): U | null => {
    if (!data) return null;
    return (
      data.find(
        (e) => e.name.toLowerCase() === nameLower && e.source.toLowerCase() === sourceLower,
      ) ?? null
    );
  };

  let result: { name: string; source: string } | null = null;
  switch (type) {
    case "spell": {
      const data = qc.getQueryData<ResolvedData<Spell>>(["spells"]);
      result = find(data?.entities);
      break;
    }
    case "creature": {
      const data = qc.getQueryData<ResolvedData<Monster>>(["monsters"]);
      result = find(data?.entities);
      break;
    }
    case "item": {
      const data = qc.getQueryData<{ items: Item[] }>(["items"]);
      result = find(data?.items);
      break;
    }
    case "feat": {
      const data = qc.getQueryData<ResolvedData<Feat>>(["feats"]);
      result = find(data?.entities);
      break;
    }
    case "condition": {
      const data = qc.getQueryData<ResolvedData<Condition>>(["conditions"]);
      result = find(data?.entities);
      break;
    }
    case "action": {
      const data = qc.getQueryData<ResolvedData<Action>>(["actions"]);
      result = find(data?.entities);
      break;
    }
    case "variantrule": {
      const data = qc.getQueryData<ResolvedData<VariantRule>>(["variantrules"]);
      result = find(data?.entities);
      break;
    }
    default:
      return null;
  }
  return result as T | null;
}
