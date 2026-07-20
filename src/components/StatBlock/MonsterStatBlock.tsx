import { memo } from "react";
import type { Monster, MonsterEntryBlock } from "@/types/entities";
import EntryRenderer from "@/render/EntryRenderer";
import {
  sizeToFull,
  typeToFull,
  alignmentToFull,
  acToFull,
  hpToFull,
  speedToFull,
  crToFull,
  crToXp,
  abilityMod,
  savesToFull,
  skillsToFull,
  damageListToList,
  sensesToFull,
  languagesToFull,
} from "@/lib/monsterFormatters";
import { sourceToAbv } from "@/lib/spellFormatters";
import ShareLinkButton from "@/components/ShareLinkButton";
import { StatLine } from "@/components/StatBlock/StatLine";

/**
 * MonsterStatBlock — the classic 5e monster stat block.
 * Header (name + type/alignment), then a borderless stat grid:
 * AC, HP, Speed, abilities table (STR-CHA with mods), saves, skills,
 * resistances/immunities, senses, languages, CR.
 * Then: Traits, Actions, Bonus Actions, Reactions, Legendary Actions.
 */
// memo: the parent page re-renders on filter/search keystrokes; the monster
// prop identity is stable (comes from React Query cache), so shallow compare
// skips the expensive nested EntryRenderer tree on unrelated re-renders.
const MonsterStatBlock = memo(function MonsterStatBlock({ monster }: { monster: Monster }) {
  return (
    <article className="mx-auto max-w-2xl px-4 py-6 font-serif text-fg">
      {/* Name + type/alignment header */}
      <div className="flex items-start justify-between gap-3 border-b-2 border-border pb-1">
        <h2 className="rd-heading text-2xl font-bold italic">{monster.name}</h2>
        <ShareLinkButton />
      </div>
      <p className="mt-0.5 text-sm italic text-fg-muted">
        {sizeToFull(monster.size)} {typeToFull(monster.type)}, {alignmentToFull(monster.alignment)}
      </p>

      {/* Core stats */}
      <div className="mt-3 space-y-0.5 border-b-2 border-border pb-2 text-sm">
        <StatLine label="Armor Class" value={acToFull(monster.ac)} />
        <StatLine label="Hit Points" value={hpToFull(monster.hp)} />
        <StatLine label="Speed" value={speedToFull(monster.speed)} />
      </div>

      {/* Abilities table */}
      <table className="mt-2 w-full border-b-2 border-border text-center text-sm">
        <thead>
          <tr className="font-bold">
            {(["str", "dex", "con", "int", "wis", "cha"] as const).map((ab) => (
              <th key={ab} className="py-1 uppercase">{ab}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {(["str", "dex", "con", "int", "wis", "cha"] as const).map((ab) => (
              <td key={ab} className="py-0.5">
                {monster[ab]} ({abilityMod(monster[ab])})
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {/* Secondary stats */}
      <div className="mt-2 space-y-0.5 text-sm">
        {monster.save && <StatLine label="Saving Throws" value={savesToFull(monster.save)} />}
        {monster.skill && <StatLine label="Skills" value={skillsToFull(monster.skill)} />}
        {monster.resist && <StatLine label="Damage Resistances" value={damageListToList(monster.resist)} />}
        {monster.immune && <StatLine label="Damage Immunities" value={damageListToList(monster.immune)} />}
        {monster.conditionImmune && (
          <StatLine label="Condition Immunities" value={damageListToList(monster.conditionImmune)} />
        )}
        <StatLine label="Senses" value={sensesToFull(monster.senses, monster.passive)} />
        <StatLine label="Languages" value={languagesToFull(monster.languages)} />
        <StatLine
          label="Challenge"
          value={`CR ${crToFull(monster.cr)} (${crToXp(monster.cr)} XP)`}
        />
      </div>

      {/* Sections: Traits, Actions, Bonus Actions, Reactions, Legendary */}
      <div className="mt-4 space-y-4 font-sans">
        {monster.trait && monster.trait.length > 0 && (
          <Section title="Traits" blocks={monster.trait} />
        )}
        {monster.action && monster.action.length > 0 && (
          <Section title="Actions" blocks={monster.action} />
        )}
        {monster.bonus && monster.bonus.length > 0 && (
          <Section title="Bonus Actions" blocks={monster.bonus} />
        )}
        {monster.reaction && monster.reaction.length > 0 && (
          <Section title="Reactions" blocks={monster.reaction} />
        )}
        {monster.legendary && monster.legendary.length > 0 && (
          <Section title="Legendary Actions" blocks={monster.legendary} />
        )}
      </div>

      <footer className="mt-6 border-t border-border-subtle pt-2 text-xs text-fg-muted">
        Source: {sourceToAbv(monster.source)}
        {monster.page ? ` p.${monster.page}` : ""}
      </footer>
    </article>
  );
});

export default MonsterStatBlock;

function Section({ title, blocks }: { title: string; blocks: MonsterEntryBlock[] }) {
  return (
    <section>
      <h3 className="rd-heading border-b border-border-subtle pb-0.5 text-lg font-bold italic">
        {title}
      </h3>
      <div className="mt-1 space-y-1.5 text-sm">
        {blocks.map((block, i) => (
          <EntryBlock key={i} block={block} />
        ))}
      </div>
    </section>
  );
}

function EntryBlock({ block }: { block: MonsterEntryBlock }) {
  return (
    <div>
      {block.name && (
        <span className="font-bold">
          <EntryRenderer entry={block.name} />.{" "}
        </span>
      )}
      {(block.entries ?? []).map((entry, i) => (
        <span key={i}>
          <EntryRenderer entry={entry} />{" "}
        </span>
      ))}
      {block.recharge && (
        <span className="italic text-fg-muted">({formatRecharge(block.recharge)})</span>
      )}
    </div>
  );
}

function formatRecharge(recharge: string): string {
  if (recharge === "0") return "Recharge 6";
  if (recharge === "round") return "Recharge 6";
  return `Recharge ${recharge}–6`;
}
