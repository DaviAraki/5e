import { memo } from "react";
import type { Item } from "@/types/entities";
import EntryRenderer from "@/render/EntryRenderer";
import InlineText from "@/render/InlineText";
import {
  itemSubtitle,
  valueToFull,
  weightToFull,
  damageToFull,
  propertiesToFull,
} from "@/lib/itemFormatters";
import { sourceToAbv } from "@/lib/spellFormatters";
import ShareLinkButton from "@/components/ShareLinkButton";
import { StatLine } from "@/components/StatBlock/StatLine";

/**
 * ItemStatBlock — displays a single item (mundane or magic).
 * Header: name + subtitle (type, rarity, attunement).
 * Stat grid: damage, AC, weight, value, properties, etc. (only if present).
 * Body: the item's entries text (description / mechanics).
 */
const ItemStatBlock = memo(function ItemStatBlock({ item }: { item: Item }) {
  const subtitle = itemSubtitle(item);
  const hasWeaponStats = Boolean(item.dmg1 || item.weaponCategory);
  const hasArmorStats = "ac" in item && item.ac != null;
  const hasMiscStats =
    item.weight != null ||
    item.value != null ||
    item.charges != null ||
    item.recharge ||
    item.bonusWeapon ||
    item.bonusAc ||
    item.bonusSpellAttack ||
    item.bonusSpellSaveDc ||
    item.resist?.length ||
    item.focus?.length;

  return (
    <article className="mx-auto max-w-2xl px-4 py-6 font-serif text-fg">
      <div className="flex items-start justify-between gap-3 border-b-2 border-border pb-1">
        <h2 className="rd-heading text-2xl font-bold italic">{item.name}</h2>
        <ShareLinkButton />
      </div>
      {subtitle && <p className="mt-0.5 text-sm italic text-fg-muted">{subtitle}</p>}

      {/* Stat grid */}
      {(hasWeaponStats || hasArmorStats || hasMiscStats) && (
        <div className="mt-3 border-b-2 border-border pb-2 text-sm">
          {hasWeaponStats && (
            <StatLine
              label="Damage"
              value={`${damageToFull(item.dmg1, item.dmg2, item.dmgType)}${
                item.weaponCategory ? ` • ${capitalize(item.weaponCategory)}` : ""
              }`}
            />
          )}
          {hasWeaponStats && item.property && (
            <StatLine label="Properties" value={propertiesToFull(item.property)} />
          )}
          {hasArmorStats && <StatLine label="Armor Class" value={String(item.ac)} />}
          {item.bonusAc && <StatLine label="AC Bonus" value={item.bonusAc} />}
          {item.bonusWeapon && <StatLine label="Attack/Damage Bonus" value={item.bonusWeapon} />}
          {item.bonusSpellAttack && <StatLine label="Spell Attack Bonus" value={item.bonusSpellAttack} />}
          {item.bonusSpellSaveDc && <StatLine label="Spell Save DC Bonus" value={item.bonusSpellSaveDc} />}
          {item.resist?.length && <StatLine label="Damage Resistance" value={item.resist.map(capitalize).join(", ")} />}
          {item.charges != null && <StatLine label="Charges" value={String(item.charges)} />}
          {item.recharge && <StatLine label="Recharge" value={`at ${item.recharge}`} />}
          {item.focus?.length && <StatLine label="Spellcasting Focus" value={item.focus.join(", ")} />}
          {item.weight != null && <StatLine label="Weight" value={weightToFull(item.weight)} />}
          {item.value != null && <StatLine label="Cost" value={valueToFull(item.value)} />}
        </div>
      )}

      {/* Body */}
      <div className="mt-4 space-y-2 font-sans">
        {item.entries && item.entries.length > 0 ? (
          item.entries.map((entry, i) => {
            if (typeof entry === "string" && entry.startsWith("{#itemEntry")) {
              return <ItemEntryRef key={i} entry={entry} />;
            }
            return <EntryRenderer key={i} entry={entry} />;
          })
        ) : (
          <p className="text-sm text-fg-muted">No description available.</p>
        )}
      </div>

      <footer className="mt-6 border-t border-border-subtle pt-2 text-xs text-fg-muted">
        Source: {sourceToAbv(item.source)}
        {item.page ? ` p.${item.page}` : ""}
        {item.baseItem && (
          <> · Base: <InlineText text={item.baseItem.split("|")[0] ?? item.baseItem} /></>
        )}
      </footer>
    </article>
  );
});

export default ItemStatBlock;

/** Handle {#itemEntry Name|Source} template references. */
function ItemEntryRef({ entry }: { entry: string }) {
  // Parse the reference: {#itemEntry Dragon Scale Mail|XDMG}
  const match = entry.match(/\{#itemEntry\s+(.+?)\}/);
  const refName = match?.[1]?.split("|")[0] ?? "source item";
  return (
    <p className="text-sm italic text-fg-muted">
      [{refName} — shared description; see source entry]
    </p>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
