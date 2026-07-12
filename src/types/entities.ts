/**
 * Entity types for the 5etools React app.
 *
 * These describe the SHAPE of the build-time-pre-merged JSON written by
 * scripts/pre-merge.ts (the One/2024 edition core content). They do NOT model:
 *   - `_copy` / meta-merge templates (resolved at build time)
 *   - homebrew / prerelease extension layers (deferred)
 *   - Classic (2014) edition fork (dropped for v1)
 *
 * Composite-key convention: cross-references are the string `"<name>|<source>"`
 * (case-insensitive on lookup). See data/entityRefs.ts.
 */

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

/** A reference to another entity, e.g. "Fireball|XPHB". */
export type EntityRef = string;

/** A top-level source identifier, e.g. "XPHB", "XMM", "XDMG". */
export type SourceId = string;

// ---------------------------------------------------------------------------
// The recursive Entry union — the core rendering DSL
// ---------------------------------------------------------------------------
//
// Entry is a discriminated union keyed on `type`. When `type` is absent the
// object behaves as an `EntriesEntry` (a named section). Plain strings and
// numbers are also valid entries (the base cases).
//
// v1 implements the ~10 fundamental types + the common block/inline types.
// Rare types are accepted via `GenericEntry` so data never fails to load; the
// renderer renders them as a muted fallback and logs the unhandled type once.

export type Entry = string | number | EntryObject;

export interface EntriesEntry {
  type?: "entries" | "section";
  name?: string;
  page?: number;
  entries: Entry[];
  id?: string;
  style?: string;
  [k: string]: unknown;
}

export interface ListEntry {
  type: "list";
  style?: string;
  columns?: number;
  start?: number;
  items: Entry[];
  [k: string]: unknown;
}

export interface TableEntry {
  type: "table";
  caption?: Entry;
  colLabels?: Entry[];
  colStyles?: string[];
  rows: Entry[][];
  rowLabels?: Entry[];
  footnotes?: Entry[];
  style?: string;
  [k: string]: unknown;
}

export interface InsetEntry {
  type: "inset" | "insetReadaloud";
  name?: Entry;
  entries: Entry[];
  style?: string;
  [k: string]: unknown;
}

export interface QuoteEntry {
  type: "quote";
  by?: Entry;
  from?: Entry;
  entries: Entry[];
  [k: string]: unknown;
}

export interface ImageEntry {
  type: "image";
  href?: { type: "internal" | "external"; path: string };
  title?: Entry;
  credit?: Entry;
  variant?: string;
  [k: string]: unknown;
}

export interface GalleryEntry {
  type: "gallery";
  title?: Entry;
  images: ImageEntry[];
  [k: string]: unknown;
}

export interface VariantEntry {
  type: "variant" | "variantInner" | "variantSub";
  name?: Entry;
  entries: Entry[];
  [k: string]: unknown;
}

export interface ItemEntry {
  type: "item" | "itemSub" | "itemSpell";
  name?: Entry;
  entry?: Entry;
  entries?: Entry[];
  style?: string;
  [k: string]: unknown;
}

export interface InlineEntry {
  type: "inline" | "inlineBlock";
  entries: Entry[];
  prefix?: Entry;
  suffix?: Entry;
  [k: string]: unknown;
}

export interface AbilityDcEntry {
  type: "abilityDc";
  name: Entry;
  "dc": { att?: Entry[]; other?: Entry[] };
  [k: string]: unknown;
}

export interface AbilityAttackModEntry {
  type: "abilityAttackMod";
  name: Entry;
  "attackMod": { att?: Entry[]; other?: Entry[] };
  [k: string]: unknown;
}

export interface ActionsEntry {
  type: "actions";
  name?: Entry;
  entries: Entry[];
  [k: string]: unknown;
}

export interface SpellcastingEntry {
  type: "spellcasting";
  name?: string;
  "spellcasting": unknown; // parsed separately via the monster spellcasting block
  [k: string]: unknown;
}

export interface HomebrewEntry {
  type: "homebrew";
  name?: Entry;
  entries: Entry[];
  [k: string]: unknown;
}

export interface CodeEntry {
  type: "code";
  name?: Entry;
  code: Entry;
  [k: string]: unknown;
}

export interface HrEntry {
  type: "hr";
  [k: string]: unknown;
}

export interface LinkEntry {
  type: "link";
  "link": { type: string; text: Entry; href: string; metadata?: unknown };
  [k: string]: unknown;
}

export interface WrappedHtmlEntry {
  type: "wrappedHtml";
  html: string;
  [k: string]: unknown;
}

/** Catch-all for unhandled/undocumented entry types. */
export interface GenericEntry {
  type: string;
  name?: Entry;
  entries?: Entry[];
  items?: Entry[];
  [k: string]: unknown;
}

export type EntryObject =
  | EntriesEntry
  | ListEntry
  | TableEntry
  | InsetEntry
  | QuoteEntry
  | ImageEntry
  | GalleryEntry
  | VariantEntry
  | ItemEntry
  | InlineEntry
  | AbilityDcEntry
  | AbilityAttackModEntry
  | ActionsEntry
  | SpellcastingEntry
  | HomebrewEntry
  | CodeEntry
  | HrEntry
  | LinkEntry
  | WrappedHtmlEntry
  | GenericEntry;

/** Type-guard helpers used by the renderer dispatcher. */
export function isString(e: Entry): e is string {
  return typeof e === "string";
}
export function isNumber(e: Entry): e is number {
  return typeof e === "number";
}
export function isObject(e: Entry): e is EntryObject {
  return typeof e === "object" && e !== null;
}

// ---------------------------------------------------------------------------
// Spell
// ---------------------------------------------------------------------------

export interface SpellTime {
  number: number;
  unit:
    | "action"
    | "bonus"
    | "bonus action"
    | "reaction"
    | "minute"
    | "hour"
    | "round";
  condition?: string;
}

export type SpellRange =
  | {
      type: "point";
      distance: {
        type: "feet" | "mile" | "touch" | "self" | "special";
        amount?: number;
      };
    }
  | {
      type:
        | "cone"
        | "cube"
        | "line"
        | "sphere"
        | "cylinder"
        | "radius"
        | "emanation";
      distance: { type: "feet" | "mile"; amount: number };
    }
  | { type: "special" };

export interface SpellComponents {
  v?: boolean;
  s?: boolean;
  m?: string;
}

export type SpellDuration =
  | { type: "instant" }
  | {
      type: "timed";
      duration: {
        type: "round" | "minute" | "hour" | "day";
        amount: number;
        upTo?: boolean;
      };
      concentration?: boolean;
    }
  | { type: "permanent"; ends?: { type: "condition" | "dispel"; duration?: SpellDuration }[] }
  | { type: "special" };

/** The 8 schools (psionics is a 9th code present in some sources). */
export type SpellSchool = "A" | "V" | "N" | "T" | "C" | "D" | "I" | "E" | "P";

export interface SpellClassRef {
  name: string;
  source: SourceId;
  definedInSource?: SourceId;
}

export interface SpellSubclassRef {
  class: SpellClassRef;
  subclass: {
    name: string;
    shortName?: string;
    source: SourceId;
    subSubclass?: string;
  };
}

export interface SpellClasses {
  fromClassList?: SpellClassRef[];
  fromClassListVariant?: Array<SpellClassRef & { definedInSource?: SourceId }>;
  fromSubclass?: SpellSubclassRef[];
}

export interface Spell {
  name: string;
  source: SourceId;
  page: number;
  level: number; // 0 = cantrip
  school: SpellSchool;
  time: SpellTime[];
  range: SpellRange;
  components: SpellComponents;
  duration: SpellDuration[];
  entries: Entry[];
  // Optional but common
  srd52?: boolean;
  basicRules2024?: boolean;
  entriesHigherLevel?: Entry[];
  miscTags?: string[];
  areaTags?: string[];
  savingThrow?: string[];
  damageInflict?: string[];
  conditionInflict?: string[];
  spellAttack?: ("M" | "R" | "O")[];
  abilityCheck?: string[];
  affectsCreatureType?: string[];
  meta?: { ritual?: boolean };
  scalingLevelDice?: {
    label?: string;
    scaling: Record<string, string>;
  };
  classes?: SpellClasses;
  subclasses?: { class: string; classSource: SourceId; name: string; source: SourceId }[];
  referenceSources?: SourceId[];
  hasFluffImages?: boolean;
  alias?: string[];
  damageResist?: string[];
  conditionImmune?: string[];
  damageImmune?: string[];
  damageVulnerable?: string[];
}

// ---------------------------------------------------------------------------
// Monster (Bestiary)
// ---------------------------------------------------------------------------

export type MonsterSize = "T" | "S" | "M" | "L" | "H" | "G" | "V";

export type MonsterType =
  | string
  | { type: string; tags?: string[]; swarm?: { isSwarm: boolean; size: MonsterSize }; [k: string]: unknown };

export type MonsterAc = number | { ac: number; from?: string[]; condition?: string; magic?: number } | { special: string };

export type MonsterHp =
  | { average: number; formula: string }
  | { special: string };

export interface MonsterSpeed {
  walk?: number | { number: number; condition?: string };
  fly?: number | { number: number; condition?: string };
  swim?: number | { number: number; condition?: string };
  burrow?: number | { number: number; condition?: string };
  climb?: number | { number: number; condition?: string };
  canHover?: boolean;
}

export interface MonsterSpellcastingSpellGroup {
  slots?: number;
  spells: string[]; // "{@spell light}" inline tags
}

export interface MonsterSpellcasting {
  name: string;
  type: "spellcasting" | "innate";
  headerEntries?: Entry[];
  footerEntries?: Entry[];
  ability?: string;
  daily?: Record<string, string[]>;
  will?: string[];
  spells?: Record<string, MonsterSpellcastingSpellGroup>;
  [k: string]: unknown;
}

export interface MonsterEntryBlock {
  name?: string;
  entries: Entry[];
  resource?: string;
  recharge?: string;
  [k: string]: unknown;
}

export interface Monster {
  name: string;
  source: SourceId;
  page?: number;
  size: MonsterSize[];
  type: MonsterType;
  alignment: string[];
  ac: MonsterAc[];
  hp: MonsterHp;
  speed: MonsterSpeed;
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  passive: number;
  cr: string | { cr: string; xp?: number; xpLair?: number };
  hasToken: boolean;
  // Optional
  save?: Record<string, string>;
  skill?: Record<string, string>;
  languages?: string[];
  senses?: string[];
  resist?: string[];
  immune?: string[];
  conditionImmune?: string[];
  vulnerable?: string[];
  spellcasting?: MonsterSpellcasting[];
  trait?: MonsterEntryBlock[] | null;
  action?: MonsterEntryBlock[];
  bonus?: MonsterEntryBlock[];
  reaction?: MonsterEntryBlock[];
  legendary?: MonsterEntryBlock[];
  mythic?: MonsterEntryBlock[];
  variant?: unknown[];
  legendaryGroup?: { name?: string; source?: SourceId };
  group?: string[];
  environment?: string[];
  attachedItems?: EntityRef[];
  summonedBySpell?: EntityRef;
  summonedBySpellLevel?: number;
  familiar?: boolean;
  hasFluff?: boolean;
  hasFluffImages?: boolean;
  referenceSources?: SourceId[];
  alias?: string[];
}

// ---------------------------------------------------------------------------
// Item
// ---------------------------------------------------------------------------

export type ItemRarity =
  | "none"
  | "common"
  | "uncommon"
  | "rare"
  | "very rare"
  | "legendary"
  | "artifact";

export type ItemReqAttune = boolean | string;

export type ItemAttachedSpells =
  | string[]
  | { daily?: Record<string, string[]> };

export interface Item {
  name: string;
  source: SourceId;
  type?: string;
  rarity?: ItemRarity;
  page?: number;
  entries?: Entry[];
  wondrous?: boolean;
  weight?: number;
  value?: number;
  reqAttune?: ItemReqAttune;
  tier?: "minor" | "major";
  charges?: number;
  recharge?: string;
  rechargeAmount?: string;
  baseItem?: EntityRef;
  attachedSpells?: ItemAttachedSpells;
  bonusWeapon?: string;
  bonusAc?: string;
  bonusSpellAttack?: string;
  bonusSpellSaveDc?: string;
  bonusSavingThrow?: string;
  bonusAbilityCheck?: string;
  dmg1?: string;
  dmg2?: string;
  dmgType?: string;
  property?: string[];
  weaponCategory?: string;
  ac?: number;
  stealth?: boolean;
  staff?: boolean;
  poison?: boolean;
  sentient?: boolean;
  curse?: boolean;
  tattoo?: boolean;
  focus?: string[];
  mastery?: string;
  resist?: string[];
  immune?: string[];
  conditionImmune?: string[];
  miscTags?: string[];
  srd?: boolean;
  srd52?: boolean;
  basicRules?: boolean;
  basicRules2024?: boolean;
  referenceSources?: SourceId[];
  reprintedAs?: EntityRef[];
  optionalfeatures?: EntityRef[];
  alias?: string[];
  // Category flags (weapon sub-types etc.) — loosely typed
  [k: string]: unknown;
}

export interface ItemGroup {
  name: string;
  source: SourceId;
  page?: number;
  items: EntityRef[];
  itemsHidden?: boolean;
  // Shares most display fields with Item
  rarity?: ItemRarity;
  reqAttune?: ItemReqAttune;
  wondrous?: boolean;
  entries?: Entry[];
  type?: string;
  tattoo?: boolean;
  tier?: "minor" | "major";
  staff?: boolean;
  focus?: string[];
  recharge?: string;
  charges?: number;
  attachedSpells?: ItemAttachedSpells;
  [k: string]: unknown;
}

// ---------------------------------------------------------------------------
// Class
// ---------------------------------------------------------------------------

/** A class or subclass feature (resolved from UID by the merge layer). */
export interface ClassFeature {
  name: string;
  source: SourceId;
  page?: number;
  className: string;
  classSource: SourceId;
  level: number;
  entries: Entry[];
  // Subclass-feature-only fields
  subclassShortName?: string;
  subclassSource?: SourceId;
  header?: number;
  gainSubclassFeature?: boolean;
  [k: string]: unknown;
}

export interface ClassTableGroup {
  title?: string;
  colLabels: Entry[];
  colStyles?: string[];
  rows?: number[][]; // generic columns, one row per level (20)
  rowsSpellProgression?: number[][]; // spell-slot columns, mutually exclusive with rows
  subclasses?: { name: string; source: SourceId }[];
}

export interface StartingProficiencies {
  weapons?: string[];
  armor?: string[];
  tools?: string[];
  skills?: unknown[];
  [k: string]: unknown;
}

export interface StartingEquipment {
  additionalFromBackground?: boolean;
  defaultData?: unknown[];
  default?: string[];
  goldAlternative?: string;
  entries?: string[];
  [k: string]: unknown;
}

export interface Multiclassing {
  requirements?: Record<string, number>;
  gains?: unknown;
  [k: string]: unknown;
}

export interface Class {
  name: string;
  source: SourceId;
  page: number;
  hd: { number: number; faces: number };
  proficiency: string[];
  startingProficiencies: StartingProficiencies;
  startingEquipment: StartingEquipment;
  multiclassing: Multiclassing;
  classTableGroups: ClassTableGroup[];
  /** Nested: classFeatures[level-1] = features gained at that level. */
  classFeatures: ClassFeature[][];
  subclassTitle: string;
  // Optional caster info
  spellcastingAbility?: string;
  casterProgression?: "full" | "half" | "1/3" | "artificer" | string;
  preparedSpellsProgression?: number[];
  cantripProgression?: number[];
  spellsKnownProgressionFixed?: number[];
  primaryAbility?: Record<string, boolean>[];
  featProgression?: unknown[];
  // Fluff
  hasFluff?: boolean;
  hasFluffImages?: boolean;
  srd52?: boolean;
  basicRules2024?: boolean;
  [k: string]: unknown;
}

export interface Subclass {
  name: string;
  shortName?: string;
  source: SourceId;
  className: string;
  classSource: SourceId;
  page?: number;
  /** Nested: subclassFeatures[level-1] = features gained at that level. */
  subclassFeatures?: ClassFeature[][];
  /** Progression tables for caster subclasses (Eldritch Knight, Arcane Trickster). */
  subclassTableGroups?: ClassTableGroup[];
  /** Present when the subclass grants its own spellcasting. */
  spellcastingAbility?: string;
  casterProgression?: string;
  cantripProgression?: number[];
  preparedSpellsProgression?: number[];
  additionalSpells?: unknown[];
  hasFluffImages?: boolean;
  srd52?: boolean;
  basicRules2024?: boolean;
  [k: string]: unknown;
}

// ---------------------------------------------------------------------------
// Background
// ---------------------------------------------------------------------------

export interface Background {
  name: string;
  source: SourceId;
  page?: number;
  /** Skill proficiencies: [{ insight: true, religion: true }] or [{ choose: { from, count } }] */
  skillProficiencies?: Record<string, unknown>[];
  toolProficiencies?: Record<string, unknown>[];
  languageProficiencies?: Record<string, unknown>[];
  startingEquipment?: Record<string, unknown>[];
  /** Heterogeneous entries: feature block (data.isFeature), equipment list, suggested characteristics tables */
  entries: Entry[];
  ability?: string[];
  feats?: Record<string, unknown>[];
  hasFluff?: boolean;
  hasFluffImages?: boolean;
  srd52?: boolean;
  basicRules2024?: boolean;
  srd?: boolean;
  basicRules?: boolean;
  reprintedAs?: EntityRef[];
  referenceSources?: SourceId[];
  [k: string]: unknown;
}

// ---------------------------------------------------------------------------
// Species (Race)
// ---------------------------------------------------------------------------

/**
 * A playable species/race. 2024 "One" edition uses "Species" as the display
 * term; the data key is still "race". Lineage variants (e.g. "Elf; Drow
 * Lineage") are flattened into separate entries by the merge layer.
 */
export interface Species {
  name: string;
  source: SourceId;
  page?: number;
  /** Size codes: S, M (most species are Small or Medium). */
  size?: string[];
  speed?: number;
  darkvision?: number;
  resist?: string[];
  immune?: string[];
  conditionImmune?: string[];
  creatureTypes?: string[];
  /** Traits as structured entries: {type:"entries", name:"Darkvision", entries:[...]}. */
  entries: Entry[];
  sizeEntry?: Entry;
  feats?: Record<string, unknown>[];
  skillProficiencies?: Record<string, unknown>[];
  languageProficiencies?: Record<string, unknown>[];
  toolProficiencies?: Record<string, unknown>[];
  additionalSpells?: unknown[];
  traitTags?: string[];
  lineage?: string;
  /** For subrace entries: parent race reference. */
  raceName?: string;
  raceSource?: SourceId;
  hasFluff?: boolean;
  hasFluffImages?: boolean;
  srd52?: boolean;
  basicRules2024?: boolean;
  srd?: boolean;
  basicRules?: boolean;
  reprintedAs?: EntityRef[];
  referenceSources?: SourceId[];
  [k: string]: unknown;
}

// ---------------------------------------------------------------------------
// Feat
// ---------------------------------------------------------------------------

export type FeatCategory = "G" | "O" | "D" | "DG" | "FS" | "FS:P" | "FS:R" | "EB" | string;

export interface Feat {
  name: string;
  source: SourceId;
  page?: number;
  category?: FeatCategory;
  /** Ability score increases: [{ str: 1 }] or [{ choose: { from: ["str","dex"] } }]. */
  ability?: Record<string, unknown>[];
  entries: Entry[];
  prerequisite?: Record<string, unknown>[];
  additionalSpells?: unknown[];
  skillProficiencies?: Record<string, unknown>[];
  toolProficiencies?: Record<string, unknown>[];
  languageProficiencies?: Record<string, unknown>[];
  expertise?: unknown[];
  resist?: string[];
  immune?: string[];
  conditionImmune?: string[];
  senses?: Record<string, unknown>[];
  armorProficiencies?: Record<string, unknown>[];
  weaponProficiencies?: Record<string, unknown>[];
  savingThrowProficiencies?: Record<string, unknown>[];
  traitTags?: string[];
  repeatable?: boolean;
  repeatableHidden?: boolean;
  hasFluffImages?: boolean;
  srd52?: boolean;
  basicRules2024?: boolean;
  srd?: boolean;
  basicRules?: boolean;
  reprintedAs?: EntityRef[];
  referenceSources?: SourceId[];
  [k: string]: unknown;
}

// ---------------------------------------------------------------------------
// Variant Rule
// ---------------------------------------------------------------------------

export interface VariantRule {
  name: string;
  source: SourceId;
  page?: number;
  ruleType?: string;
  entries: Entry[];
  srd52?: boolean;
  basicRules2024?: boolean;
  srd?: boolean;
  basicRules?: boolean;
  reprintedAs?: EntityRef[];
  referenceSources?: SourceId[];
  [k: string]: unknown;
}

// ---------------------------------------------------------------------------
// Condition
// ---------------------------------------------------------------------------

export interface Condition {
  name: string;
  source: SourceId;
  page?: number;
  entries: Entry[];
  reprintedAs?: EntityRef[];
  referenceSources?: SourceId[];
  [k: string]: unknown;
}

// ---------------------------------------------------------------------------
// Deity
// ---------------------------------------------------------------------------

export interface Deity {
  name: string;
  source: SourceId;
  page?: number;
  pantheon?: string;
  /** Cleric domains / categories, e.g. ["War","Valor"]. */
  domains?: string[];
  category?: string;
  symbolImg?: { type: string; path: string };
  title?: string;
  alignment?: string[];
  entries: Entry[];
  reprintedAs?: EntityRef[];
  referenceSources?: SourceId[];
  [k: string]: unknown;
}

// ---------------------------------------------------------------------------
// Disease
// ---------------------------------------------------------------------------

export interface Disease {
  name: string;
  source: SourceId;
  page?: number;
  /** DC and saving-throw stat, e.g. { dc: 14, save: "con" }. */
  dc?: number;
  save?: string;
  onset?: string;
  duration?: string;
  symptoms?: string[];
  entries: Entry[];
  hasFluffImages?: boolean;
  reprintedAs?: EntityRef[];
  referenceSources?: SourceId[];
  [k: string]: unknown;
}

// ---------------------------------------------------------------------------
// Language
// ---------------------------------------------------------------------------

export interface Language {
  name: string;
  source: SourceId;
  page?: number;
  /** "standard" | "exotic" | "secret" | string. */
  type?: string;
  typicalSpeakers?: unknown[];
  script?: string;
  entries: Entry[];
  reprintedAs?: EntityRef[];
  referenceSources?: SourceId[];
  [k: string]: unknown;
}

// ---------------------------------------------------------------------------
// Legendary Group (lair actions + regional effects for a monster/group)
// ---------------------------------------------------------------------------

export interface LegendaryGroup {
  name: string;
  source: SourceId;
  page?: number;
  lairActions?: Entry[] | unknown[];
  regionalEffects?: Entry[] | unknown[];
  reprintedAs?: EntityRef[];
  referenceSources?: SourceId[];
  [k: string]: unknown;
}

// ---------------------------------------------------------------------------
// Table (generic dN lookup table; named GameTable to avoid JS reserved clash)
// ---------------------------------------------------------------------------

export interface GameTable {
  name: string;
  source: SourceId;
  page?: number;
  colLabels?: string[];
  colStyles?: string[];
  rows?: unknown[][];
  tables?: unknown[];
  caption?: Entry;
  intro?: Entry[];
  outro?: Entry[];
  entries: Entry[];
  reprintedAs?: EntityRef[];
  referenceSources?: SourceId[];
  [k: string]: unknown;
}

// ---------------------------------------------------------------------------
// Transformation (Grim Hollow charoption: multi-stage transformation)
// ---------------------------------------------------------------------------

export interface Transformation {
  name: string;
  source: SourceId;
  page?: number;
  /** Category tags, e.g. ["Transformation"]. */
  optionType?: string[];
  entries: Entry[];
  fluff?: unknown;
  hasFluffImages?: boolean;
  reprintedAs?: EntityRef[];
  referenceSources?: SourceId[];
  [k: string]: unknown;
}

// ---------------------------------------------------------------------------
// Optional Feature (transformations boons/flaws, class features, etc.)
// ---------------------------------------------------------------------------

export interface OptionalFeature {
  name: string;
  source: SourceId;
  page?: number;
  /** Feature-type codes, e.g. ["AH:TB"], ["MGS"], ["FS"]. */
  featureType?: string[];
  prerequisite?: Record<string, unknown>[];
  entries: Entry[];
  reprintedAs?: EntityRef[];
  referenceSources?: SourceId[];
  [k: string]: unknown;
}

// ---------------------------------------------------------------------------
// Book (source reference)
// ---------------------------------------------------------------------------

export interface BookContent {
  name: string;
  headers?: string[];
  [k: string]: unknown;
}

export interface Book {
  name: string;
  id: string;
  source: SourceId;
  group?: string;
  cover?: { type: string; path: string };
  published?: string;
  revised?: string;
  author?: string;
  contents?: BookContent[];
  parentSource?: SourceId;
  alias?: string[];
  storyline?: string;
  level?: { start: number; end: number };
  isOneEdition?: boolean;
  [k: string]: unknown;
}

// ---------------------------------------------------------------------------
// Collection file shapes (raw data/ files before pre-merge)
// ---------------------------------------------------------------------------

export interface DataFile<T> {
  [entityKey: string]: T[] | unknown;
  _meta?: unknown;
}

export interface SpellFile extends DataFile<Spell> {
  spell?: Spell[];
}

export interface MonsterFile extends DataFile<Monster> {
  monster?: Monster[];
}

export interface ItemFile extends DataFile<Item | ItemGroup> {
  item?: Item[];
  itemGroup?: ItemGroup[];
}

/** The resolved datasets written by pre-merge.ts. */
export interface ResolvedData<T> {
  entities: T[];
  generatedAt: string;
  source: string;
}
