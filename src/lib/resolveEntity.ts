import type { useQueryClient } from "@tanstack/react-query";
import type { EntityType } from "@/state/entityPreview";
import type { ResolvedData, Spell, Monster, Item, Feat, VariantRule } from "@/types/entities";

/** Resolve an entity from the React Query cache by type + name|source. */
export function resolveEntity(
  qc: ReturnType<typeof useQueryClient>,
  type: EntityType,
  name: string,
  source: string,
): unknown | null {
  const nameLower = name.toLowerCase();
  const sourceLower = source.toLowerCase();

  const find = <T extends { name: string; source: string }>(data: T[] | undefined): T | null => {
    if (!data) return null;
    return (
      data.find(
        (e) => e.name.toLowerCase() === nameLower && e.source.toLowerCase() === sourceLower,
      ) ?? null
    );
  };

  switch (type) {
    case "spell": {
      const data = qc.getQueryData<ResolvedData<Spell>>(["spells"]);
      return find(data?.entities);
    }
    case "creature": {
      const data = qc.getQueryData<ResolvedData<Monster>>(["monsters"]);
      return find(data?.entities);
    }
    case "item": {
      const data = qc.getQueryData<{ items: Item[] }>(["items"]);
      return find(data?.items);
    }
    case "feat": {
      const data = qc.getQueryData<ResolvedData<Feat>>(["feats"]);
      return find(data?.entities);
    }
    case "variantrule": {
      const data = qc.getQueryData<ResolvedData<VariantRule>>(["variantrules"]);
      return find(data?.entities);
    }
    default:
      return null;
  }
}
