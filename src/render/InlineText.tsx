import { Fragment, useState, type ReactNode } from "react";
import { useEntityPreview, tagToEntityType, type EntityType } from "@/state/entityPreview";

/**
 * InlineText — renders a 5etools inline-string containing `{@tag ...}` markup.
 *
 * The DSL: substrings wrapped in `{@tag args}` are special. The tag is the first
 * token after `@`; args are pipe-separated. Examples:
 *   {@damage 8d6}              → rollable "8d6"
 *   {@damage 8d6|fire}         → rollable "8d6 fire damage"
 *   {@scaledamage 8d6|3-9|1d6} → "8d6" with scaling hint
 *   {@spell fireball}          → link to the spell
 *   {@condition prone}         → link to the condition
 *   {@variantrule Flanking}    → link
 *   {@b bold text}             → <strong>
 *   {@i italic}                → <em>
 *   {@dc 15}                   → "DC 15"
 *
 * v1 implements the common tags. Unknown tags render their display text plainly.
 */

interface InlineTextProps {
  text: string;
}

/** Match `{@...}` blocks (non-greedy, no nesting in v1). */
const TAG_RE = /\{@(.*?)\}/g;

export default function InlineText({ text }: InlineTextProps): ReactNode {
  if (typeof text !== "string") return text == null ? null : String(text);
  if (!text.includes("{@")) return text;

  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = TAG_RE.exec(text)) !== null) {
    // Push preceding plain text
    if (match.index > lastIndex) {
      nodes.push(<Fragment key={key++}>{text.slice(lastIndex, match.index)}</Fragment>);
    }
    const tagContent = match[1] ?? "";
    nodes.push(renderTag(tagContent, key++));
    lastIndex = TAG_RE.lastIndex;
  }
  // Push trailing plain text
  if (lastIndex < text.length) {
    nodes.push(<Fragment key={key++}>{text.slice(lastIndex)}</Fragment>);
  }
  return <>{nodes}</>;
}

/** Parse the inner content of a `{@...}` and dispatch. */
function renderTag(inner: string, key: number): ReactNode {
  const firstSpace = inner.indexOf(" ");
  const tag = firstSpace === -1 ? inner : inner.slice(0, firstSpace);
  const body = firstSpace === -1 ? "" : inner.slice(firstSpace + 1);
  const parts = body.split("|").map((p) => p.trim());

  switch (tag) {
    // Formatting
    case "b":
    case "bold":
      return <strong key={key}>{parts[0]}</strong>;
    case "i":
    case "italic":
      return <em key={key}>{parts[0]}</em>;
    case "u":
    case "underline":
      return <u key={key}>{parts[0]}</u>;
    case "s":
    case "strike":
      return <s key={key}>{parts[0]}</s>;
    case "note":
      return <em key={key} className="text-fg-muted">{parts[0]}</em>;
    case "color":
      // parts[0] = display text, parts[1] = color
      return (
        <span key={key} style={parts[1] ? { color: parts[1] } : undefined}>
          {parts[0]}
        </span>
      );
    case "tip":
      // parts[0] = display, parts[1] = tooltip
      return (
        <span key={key} title={parts[1] ?? ""} className="cursor-help underline decoration-dotted">
          {parts[0]}
        </span>
      );
    case "sup":
      return <sup key={key}>{parts[0]}</sup>;
    case "sub":
      return <sub key={key}>{parts[0]}</sub>;

    // Dice
    case "damage":
    case "dice": {
      // {@damage 8d6} or {@damage 8d6|fire} or {@damage 8d6|Fire damage|name}
      // parts[0] = roll, [1] = display text or damage type, [2] = name
      return <DiceInline key={key} roll={parts[0] ?? ""} note={parts[1]} />;
    }
    case "scaledamage":
    case "scaledice": {
      // {@scaledamage <base>|<range>|<increment>[|mode][|displayText]}
      // e.g. {@scaledamage 8d6|3-9|1d6} = 8d6 base, +1d6 per level above 3rd
      return renderScaleDice(parts, key);
    }
    case "hit":
      // {@hit +5} → "+5"
      return <span key={key} className="font-semibold">{parts[0] ?? "+0"}</span>;
    case "atk":
      // attack type tag like {@atk mw} → expanded by parser; render as-is for now
      return <span key={key} className="italic">{attackTagToText(parts[0] ?? "")}</span>;

    // DC
    case "dc":
      return <span key={key} className="font-semibold">DC {parts[0]}</span>;

    // Recharge
    case "recharge": {
      const n = parts[0] ?? "6";
      const suffix = parts[1] === "m" ? "" : `–6`;
      return <span key={key} className="italic">(Recharge {n}{suffix})</span>;
    }

    // Headings/labels used mid-entry
    case "h":
      return <em key={key}>Hit: </em>;

    // Entity links — all render as a styled link to their page
    case "spell":
    case "creature":
    case "monster":
    case "item":
    case "condition":
    case "status":
    case "skill":
    case "sense":
    case "variantrule":
    case "feat":
    case "action":
    case "race":
    case "background":
    case "class":
    case "deity":
    case "object":
    case "hazard":
    case "disease":
    case "table":
    case "language":
    case "optfeature":
    case "psionic":
    case "reward":
    case "trap":
    case "quickref":
    case "book":
    case "adventure":
    case "card":
    case "deck":
    case "cult":
    case "boon":
    case "facility":
    case "vehicle":
    case "vehicleupgrade":
    case "vehupgrade":
    case "recipe":
    case "optionalfeature":
      return entityLink(tag, parts, key);

    // External link
    case "link":
      // {@link display|https://...} or {@link https://...}
      if (parts.length >= 2) {
        return (
          <a key={key} href={parts[1]} target="_blank" rel="noreferrer" className="rd-link">
            {parts[0]}
          </a>
        );
      }
      return (
        <a key={key} href={parts[0]} target="_blank" rel="noreferrer" className="rd-link">
          {parts[0]}
        </a>
      );

    // Internal filter link — just render display text in v1
    case "filter":
      return <span key={key} className="rd-link">{parts[0] ?? ""}</span>;

    // Chance / coinflip
    case "chance":
    case "coinflip":
      return <span key={key}>{parts[0]}%</span>;

    default:
      // Unknown tag — render best display text (usually parts[0] or body)
      return <Fragment key={key}>{parts[0] ?? body}</Fragment>;
  }
}

/** Map an entity tag to a relative URL path. */
function tagToPath(tag: string): string {
  const map: Record<string, string> = {
    spell: "spells",
    creature: "bestiary",
    monster: "bestiary",
    item: "items",
    condition: "conditionsdiseases",
    status: "conditionsdiseases",
    skill: "skills",
    variantrule: "variantrules",
    feat: "feats",
    action: "actions",
    race: "races",
    background: "backgrounds",
    class: "classes",
    deity: "deities",
    object: "objects",
    hazard: "trapshazards",
    disease: "conditionsdiseases",
    table: "tables",
    language: "languages",
    optfeature: "optionalfeatures",
    optionalfeature: "optionalfeatures",
  };
  return map[tag] ?? tag;
}

/** Build an internal entity link. Most entity tags: name|source|displayText.
 * For entity types the preview supports, clicks open a popover instead of
 * navigating away. Unsupported types fall back to a page link. */
function entityLink(tag: string, parts: string[], key: number): ReactNode {
  const name = parts[0] ?? "";
  const source = parts[1] ?? "";
  const display = parts[2] ?? name;
  const entityType = tagToEntityType(tag);

  if (entityType) {
    return (
      <EntityPreviewLink
        key={key}
        type={entityType}
        name={name}
        source={source}
        display={display}
      />
    );
  }

  // Fallback: page navigation for entity types without preview support.
  const path = tagToPath(tag);
  const hash = `${name.toLowerCase()}${source ? `=${source.toLowerCase()}` : ""}`;
  return (
    <a key={key} href={`/${path}#${hash}`} className="rd-link" title={`${name} (${source})`}>
      {display}
    </a>
  );
}

/** A clickable inline link that opens the entity preview popover. */
function EntityPreviewLink({
  type,
  name,
  source,
  display,
}: {
  type: EntityType;
  name: string;
  source: string;
  display: string;
}) {
  const openPreview = useEntityPreview((s) => s.openPreview);
  return (
    <a
      href="#"
      className="rd-link cursor-pointer"
      title={`${name} (${source})`}
      onClick={(e) => {
        e.preventDefault();
        openPreview({ type, name, source });
      }}
    >
      {display}
    </a>
  );
}

/** {@atk mw} → "Melee Weapon Attack:" */
function attackTagToText(code: string): string {
  const parts: string[] = [];
  if (code.includes("mw")) parts.push("Melee Weapon Attack:");
  else if (code.includes("ms")) parts.push("Melee Spell Attack:");
  else if (code.includes("rw")) parts.push("Ranged Weapon Attack:");
  else if (code.includes("rs")) parts.push("Ranged Spell Attack:");
  return parts.join(" ");
}

/**
 * Render a scaledamage/scaledice tag.
 *
 * Format: {@scaledamage <base>|<range>|<increment>[|mode][|displayText]}
 *   base       — the base roll, e.g. "8d6"
 *   range      — the level range it scales over, e.g. "3-9" or "1-9"
 *   increment  — added per level above the base, e.g. "1d6"
 *   mode       — optional (e.g. "psi"); skipped in v1
 *   displayText— optional override; defaults to the increment
 *
 * The dice button rolls the BASE. The displayed text is the INCREMENT
 * (what you add per level), matching the legacy renderer (parseScaleDice:
 *   displayText: displayText || addPerProgress; toRoll: baseRoll).
 */
function renderScaleDice(parts: string[], key: number): ReactNode {
  const [base = "", range = "", increment = "", displayText] = parts;
  void range; // level-range affects per-level prompts; not shown in v1 inline form
  const shown = displayText || increment;
  // For scale tags the surrounding prose already reads "...increases by X...",
  // so the visible label is the increment. The (clickable) roll value is the base.
  return <DiceInline key={key} roll={base} note={shown} displayOverride={shown} />;
}

/** A clickable inline dice element. v1: displays roll, click rolls it in-place. */
function DiceInline({
  roll,
  note,
  displayOverride,
}: {
  roll: string;
  note?: string;
  /** If set, the button shows this text instead of the raw roll expression. */
  displayOverride?: string;
}) {
  const [result, setResult] = useState<number | null>(null);

  function doRoll() {
    setResult(rollDice(roll));
  }

  return (
    <button
      type="button"
      onClick={doRoll}
      className="inline-flex items-center rounded px-1 font-semibold text-accent hover:bg-accent-subtle"
      title={`Click to roll ${roll}`}
    >
      {displayOverride ?? roll}
      {note && !displayOverride ? ` ${note}` : ""}
      {result !== null && (
        <span className="ml-1 rounded bg-accent-subtle px-1 text-fg">→ {result}</span>
      )}
    </button>
  );
}

/**
 * Roll a dice expression like "8d6", "1d20+5", "2d8+4".
 * Supports +/- modifiers and multiple dice groups.
 */
export function rollDice(expr: string): number {
  // Normalise: lowercase, remove spaces. "D8" → "d8", "8d6 + 4" → "8d6+4"
  const clean = expr.toLowerCase().replace(/\s/g, "");
  // Two alternations: dice (NdM or dM) and flat modifiers (N).
  const termRe = /([+-]?)(\d*)d(\d+)|([+-]?)(\d+)/g;
  let total = 0;
  let match: RegExpExecArray | null;
  while ((match = termRe.exec(clean)) !== null) {
    if (match[3] !== undefined) {
      // Dice term: groups 1=sign, 2=count (may be ""), 3=faces
      const sign = match[1] === "-" ? -1 : 1;
      const count = parseInt(match[2] || "1", 10);
      const faces = parseInt(match[3], 10);
      if (!faces) continue;
      let sub = 0;
      for (let i = 0; i < count; i++) {
        sub += 1 + Math.floor(Math.random() * faces);
      }
      total += sign * sub;
    } else if (match[5] !== undefined) {
      // Flat modifier: groups 4=sign, 5=value
      const sign = match[4] === "-" ? -1 : 1;
      total += sign * parseInt(match[5], 10);
    }
  }
  return total;
}
