import type { EntityType } from "@/state/entityPreview";
import type { Spell, Monster, Item, Feat, VariantRule } from "@/types/entities";
import SpellStatBlock from "@/components/StatBlock/SpellStatBlock";
import MonsterStatBlock from "@/components/StatBlock/MonsterStatBlock";
import ItemStatBlock from "@/components/StatBlock/ItemStatBlock";
import FeatStatBlock from "@/components/StatBlock/FeatStatBlock";
import VariantRuleStatBlock from "@/components/StatBlock/VariantRuleStatBlock";

/** Render the resolved entity with the appropriate stat block. */
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
