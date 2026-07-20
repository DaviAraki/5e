import type { EntityType } from "@/state/entityPreview";
import type { Spell, Monster, Item, Feat, VariantRule, Condition, Action } from "@/types/entities";
import SpellStatBlock from "@/components/StatBlock/SpellStatBlock";
import MonsterStatBlock from "@/components/StatBlock/MonsterStatBlock";
import ItemStatBlock from "@/components/StatBlock/ItemStatBlock";
import FeatStatBlock from "@/components/StatBlock/FeatStatBlock";
import VariantRuleStatBlock from "@/components/StatBlock/VariantRuleStatBlock";
import ConditionStatBlock from "@/components/StatBlock/ConditionStatBlock";
import ActionStatBlock from "@/components/StatBlock/ActionStatBlock";

/**
 * Render an already-resolved entity with the appropriate stat block.
 *
 * `data` is `unknown` because the resolver returns a union of entity types;
 * the switch narrows by `type` and the renderer for each case accepts its
 * specific entity interface. The cast is centralized at this seam rather than
 * scattered across callers.
 *
 * Callers should resolve via the generic `resolveEntity<T>` upstream so the
 * type info is preserved until this rendering boundary.
 */
export default function EntityContent({
  type,
  data,
}: {
  type: EntityType;
  data: unknown;
}) {
  switch (type) {
    case "spell":
      return <SpellStatBlock spell={data as Spell} />;
    case "creature":
      return <MonsterStatBlock monster={data as Monster} />;
    case "item":
      return <ItemStatBlock item={data as Item} />;
    case "feat":
      return <FeatStatBlock feat={data as Feat} />;
    case "condition":
      return <ConditionStatBlock condition={data as Condition} />;
    case "action":
      return <ActionStatBlock action={data as Action} />;
    case "variantrule":
      return <VariantRuleStatBlock vr={data as VariantRule} />;
    default:
      return (
        <div className="p-4 text-sm text-fg-muted">
          Preview not available for this entity type.
        </div>
      );
  }
}
