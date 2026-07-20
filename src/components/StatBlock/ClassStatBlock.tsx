import { memo, useMemo, useState } from "react";
import type { Class, ClassTableGroup, ClassFeature, Subclass } from "@/types/entities";
import EntryRenderer from "@/render/EntryRenderer";
import InlineText from "@/render/InlineText";
import ShareLinkButton from "@/components/ShareLinkButton";

/**
 * ClassStatBlock — full class detail: header info, the 20-level progression
 * table, and a per-level feature breakdown with collapsible feature entries.
 *
 * Optional subclass selector: if subclasses are provided, picking one shows
 * that subclass's features inline at their granted levels.
 */
const ClassStatBlock = memo(function ClassStatBlock({
  cls,
  subclasses,
}: {
  cls: Class;
  subclasses: Subclass[];
}) {
  const classSubs = subclasses.filter(
    (s) => s.className === cls.name && s.classSource === cls.source,
  );
  const [selectedSub, setSelectedSub] = useState<string | null>(
    classSubs[0] ? `${classSubs[0].name}|${classSubs[0].source}` : null,
  );
  const activeSub = classSubs.find(
    (s) => `${s.name}|${s.source}` === selectedSub,
  );

  // openFeatureKeys: the set of open feature keys. "Expand all" computes every
  // key and fills the set; "Collapse all" empties it; individual toggles
  // add/remove one key. All three use the same mechanism, so they compose.
  const [openFeatureKeys, setOpenFeatureKeys] = useState<Set<string>>(new Set());

  // Build a character-level → subclass-features lookup. The subclassFeatures
  // array is indexed by feature-grant sequence (e.g. levels 3,7,10,15,18),
  // NOT by character level. We re-key by the `level` field on each feature.
  const subFeaturesByLevel = useMemo(() => {
    const map = new Map<number, ClassFeature[]>();
    if (!activeSub?.subclassFeatures) return map;
    for (const levelGroup of activeSub.subclassFeatures) {
      for (const f of levelGroup) {
        const lvl = f.level;
        const existing = map.get(lvl) ?? [];
        existing.push(f);
        map.set(lvl, existing);
      }
    }
    return map;
  }, [activeSub]);

  // Compute every feature key (used by Expand all). Must run after
  // subFeaturesByLevel is initialized.
  function allFeatureKeys(): string[] {
    const keys: string[] = [];
    cls.classFeatures.forEach((lvlFeats, i) => {
      const lvl = i + 1;
      lvlFeats.forEach((f, fi) => {
        if (f.entries?.length) keys.push(`${lvl}:${fi}`);
      });
      const subFeats = subFeaturesByLevel.get(lvl);
      subFeats?.forEach((f, si) => {
        if (f.entries?.length) keys.push(`${lvl}:s${si}`);
      });
    });
    return keys;
  }

  const allExpanded = allFeatureKeys().every((k) => openFeatureKeys.has(k));

  // Toggle a single feature open/closed by its key.
  function toggleFeature(key: string) {
    setOpenFeatureKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-6 font-serif text-fg">
      <div className="flex items-start justify-between gap-3 border-b border-border-subtle pb-1">
        <h2 className="rd-heading text-2xl font-bold">{cls.name}</h2>
        <ShareLinkButton />
      </div>

      {/* Header info table */}
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
        <Info label="Hit Die" value={`d${cls.hd.faces}`} />
        <Info label="Primary Ability" value={formatPrimaryAbility(cls)} />
        <Info label="Saving Throws" value={formatSaves(cls.proficiency)} />
        {cls.spellcastingAbility && (
          <Info
            label="Spellcasting"
            value={`${capitalize(cls.spellcastingAbility)} (${cls.casterProgression ?? ""})`}
          />
        )}
        <Info label="Subclass" value={cls.subclassTitle} />
      </dl>

      {/* Proficiencies */}
      <section className="mt-4">
        <h3 className="rd-heading text-sm font-bold uppercase tracking-wide text-fg-muted">
          Proficiencies
        </h3>
        <ProficienciesTable cls={cls} />
      </section>

      {/* Progression table — merges class columns + selected subclass columns */}
      <section className="mt-6">
        <h3 className="rd-heading text-sm font-bold uppercase tracking-wide text-fg-muted">
          The {cls.name}
          {activeSub?.spellcastingAbility && activeSub.subclassTableGroups?.length ? (
            <span className="ml-2 normal-case text-fg-faint">
              + {activeSub.name} ({activeSub.casterProgression === "1/3" ? "⅓ caster" : activeSub.casterProgression}, {activeSub.spellcastingAbility.toUpperCase()})
            </span>
          ) : null}
        </h3>
        <ProgressionTable
          groups={cls.classTableGroups}
          features={cls.classFeatures}
          subGroups={activeSub?.subclassTableGroups}
          subFeatures={activeSub?.subclassFeatures}
        />
      </section>

      {/* Subclass selector */}
      {classSubs.length > 0 && (
        <section className="mt-6">
          <h3 className="rd-heading text-sm font-bold uppercase tracking-wide text-fg-muted">
            {cls.subclassTitle}
          </h3>
          <div className="mt-2 flex flex-wrap gap-1">
            {classSubs.map((s) => {
              const key = `${s.name}|${s.source}`;
              const active = key === selectedSub;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedSub(key)}
                  className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                    active
                      ? "border-accent bg-accent-subtle text-accent"
                      : "border-border text-fg-muted hover:border-border-strong hover:text-fg"
                  }`}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Class features by level */}
      <section className="mt-6 font-sans">
        <div className="flex items-center justify-between">
          <h3 className="rd-heading text-sm font-bold uppercase tracking-wide text-fg-muted">
            Class Features
          </h3>
          <button
            type="button"
            onClick={() =>
              allExpanded
                ? setOpenFeatureKeys(new Set())
                : setOpenFeatureKeys(new Set(allFeatureKeys()))
            }
            className="text-xs text-accent hover:text-accent-hover"
          >
            {allExpanded ? "Collapse all" : "Expand all"}
          </button>
        </div>
        <div className="mt-2 space-y-3">
          {cls.classFeatures.map((levelFeatures, i) => (
            <LevelFeatures
              key={i}
              level={i + 1}
              features={levelFeatures}
              subFeatures={subFeaturesByLevel.get(i + 1)}
              subName={activeSub?.shortName ?? activeSub?.name}
              openKeys={openFeatureKeys}
              onToggle={toggleFeature}
            />
          ))}
        </div>
      </section>

      <footer className="mt-6 border-t border-border-subtle pt-2 text-xs text-fg-muted">
        Source: {cls.source}
        {cls.page ? ` p.${cls.page}` : ""}
      </footer>
    </article>
  );
});

export default ClassStatBlock;

// --- Sub-components -------------------------------------------------------

function Info({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-fg-faint">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function formatPrimaryAbility(cls: Class): string {
  if (!cls.primaryAbility || cls.primaryAbility.length === 0) return "";
  return cls.primaryAbility
    .map((ab) => Object.keys(ab).map(capitalize).join(" or "))
    .join("; ");
}

function formatSaves(prof: string[]): string {
  return prof.map(capitalize).join(", ");
}

function ProficienciesTable({ cls }: { cls: Class }) {
  const p = cls.startingProficiencies;
  const rows: [string, React.ReactNode][] = [];
  if (p.armor?.length) rows.push(["Armor", <InlineText key="a" text={p.armor.join("; ")} />]);
  if (p.weapons?.length) rows.push(["Weapons", <InlineText key="w" text={p.weapons.join("; ")} />]);
  if (p.tools?.length) rows.push(["Tools", <InlineText key="t" text={p.tools.join("; ")} />]);
  if (p.skills?.length) {
    const skillText = formatSkills(p.skills);
    if (skillText) rows.push(["Skills", skillText]);
  }
  if (rows.length === 0) return <p className="text-sm text-fg-muted">None</p>;
  return (
    <dl className="mt-1 divide-y divide-border-subtle text-sm">
      {rows.map(([label, val]) => (
        <div key={label} className="flex gap-3 py-1">
          <dt className="w-20 shrink-0 text-fg-muted">{label}</dt>
          <dd>{val}</dd>
        </div>
      ))}
    </dl>
  );
}

function formatSkills(skills: unknown[]): React.ReactNode {
  // Skills can be strings or { choose: { from: [...], count: n } }
  return skills.map((s, i) => {
    if (typeof s === "string") return <span key={i}><InlineText text={s} /> </span>;
    const obj = s as { choose?: { from?: string[]; count?: number }; [k: string]: unknown };
    if (obj.choose) {
      const from = obj.choose.from?.join(", ") ?? "";
      const count = obj.choose.count ?? 1;
      return (
        <span key={i}>
          Choose {count} from {from}.{" "}
        </span>
      );
    }
    return null;
  });
}

function ProgressionTable({
  groups,
  features,
  subGroups = [],
  subFeatures = [],
}: {
  groups: ClassTableGroup[];
  features: ClassFeature[][];
  /** Optional subclass column groups, merged after the class columns. */
  subGroups?: ClassTableGroup[];
  /** Optional subclass features, merged into the Features column. */
  subFeatures?: ClassFeature[][];
}) {
  // Merge class + subclass groups so columns appear side-by-side.
  const allGroups = [...groups, ...subGroups];

  // Build column headers: Level | feature names | each group's columns
  const headerCells: React.ReactNode[] = [
    <th key="lvl" className="border border-border-subtle bg-bg-raised px-2 py-1 text-xs font-semibold">
      Level
    </th>,
    <th key="feat" className="border border-border-subtle bg-bg-raised px-2 py-1 text-left text-xs font-semibold">
      Features
    </th>,
  ];
  for (let gi = 0; gi < allGroups.length; gi++) {
    const g = allGroups[gi];
    if (!g) continue;
    for (let ci = 0; ci < (g.colLabels?.length ?? 0); ci++) {
      const label = g.colLabels?.[ci];
      // Visually separate subclass columns with a left border.
      const isSubCol = gi >= groups.length;
      headerCells.push(
        <th
          key={`g${gi}c${ci}`}
          className={`border border-border-subtle bg-bg-raised px-2 py-1 text-center text-xs font-semibold ${
            isSubCol && ci === 0 ? "border-l-border-strong" : ""
          }`}
        >
          {label != null ? <InlineText text={typeof label === "string" ? label : String(label)} /> : ""}
        </th>,
      );
    }
  }

  return (
    <div className="mt-2 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>{headerCells}</tr>
        </thead>
        <tbody>
          {Array.from({ length: 20 }, (_, lvl) => {
            // Merge class + subclass feature names for this level.
            const levelFeatures = features[lvl] ?? [];
            const levelSubFeatures = subFeatures[lvl] ?? [];
            const featureNames = levelFeatures
              .filter((f) => !f.gainSubclassFeature)
              .map((f) => f.name);
            const subFeatureNames = levelSubFeatures
              .filter((f) => !f.gainSubclassFeature && !f.header)
              .map((f) => f.name);
            const allNames = [...featureNames, ...subFeatureNames];
            const gainSub = levelFeatures.some((f) => f.gainSubclassFeature);
            return (
              <tr key={lvl} className="odd:bg-bg-subtle/50">
                <td className="border border-border-subtle px-2 py-1 text-center font-semibold">
                  {lvl + 1}
                </td>
                <td className="border border-border-subtle px-2 py-1 text-xs">
                  {allNames.join(", ")}
                  {gainSub && allNames.length > 0 && ", "}
                  {gainSub && <span className="italic text-accent">Subclass Feature</span>}
                </td>
                {allGroups.map((g, gi) => {
                  // Each group has 20 rows (one per level); read THIS level's row
                  // and emit one cell per column value.
                  const dataRows = g.rows ?? g.rowsSpellProgression ?? [];
                  const levelRow = dataRows[lvl] ?? [];
                  const isSubCol = gi >= groups.length;
                  return levelRow.map((cellVal, ci) => (
                    <td
                      key={`${gi}-${ci}-${lvl}`}
                      className={`border border-border-subtle px-2 py-1 text-center text-xs ${
                        isSubCol && ci === 0 ? "border-l-border-strong" : ""
                      }`}
                    >
                      {formatCell(cellVal)}
                    </td>
                  ));
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function LevelFeatures({
  level,
  features,
  subFeatures,
  subName,
  openKeys,
  onToggle,
}: {
  level: number;
  features: ClassFeature[];
  subFeatures?: ClassFeature[];
  subName?: string;
  openKeys: Set<string>;
  onToggle: (key: string) => void;
}) {
  const hasSub = subFeatures && subFeatures.length > 0;
  if (features.length === 0 && !hasSub) return null;
  return (
    <div>
      <h4 className="text-sm font-bold text-accent">
        Level {level}
      </h4>
      <div className="ml-2 mt-1 space-y-1 border-l-2 border-border-subtle pl-3">
        {features.map((f, i) => (
          <FeatureEntry
            key={`c${i}`}
            feature={f}
            featureKey={`${level}:${i}`}
            openKeys={openKeys}
            onToggle={onToggle}
          />
        ))}
        {hasSub && (
          <div className="mt-2 border-l-2 border-accent pl-3">
            {subName && (
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                {subName}
              </p>
            )}
            <div className="space-y-1">
              {subFeatures!.map((f, i) => (
                <FeatureEntry
                  key={`s${i}`}
                  feature={f}
                  featureKey={`${level}:s${i}`}
                  openKeys={openKeys}
                  onToggle={onToggle}
                  isSubclass
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FeatureEntry({
  feature,
  featureKey,
  openKeys,
  onToggle,
  isSubclass = false,
}: {
  feature: ClassFeature;
  featureKey: string;
  openKeys: Set<string>;
  onToggle: (key: string) => void;
  isSubclass?: boolean;
}) {
  const hasBody = feature.entries && feature.entries.length > 0;
  const open = openKeys.has(featureKey);

  return (
    <div>
      <button
        type="button"
        onClick={() => hasBody && onToggle(featureKey)}
        className={`flex items-center gap-1 text-sm font-semibold ${hasBody ? "cursor-pointer hover:text-accent" : ""} ${isSubclass ? "text-fg" : ""}`}
      >
        {hasBody && <span className="text-fg-faint">{open ? "▾" : "▸"}</span>}
        <InlineText text={feature.name} />
        {isSubclass && (
          <span className="rounded bg-accent-subtle px-1 text-[10px] uppercase text-accent">
            {feature.subclassShortName ?? "Sub"}
          </span>
        )}
      </button>
      {open && hasBody && (
        <div className={`mt-1 space-y-1 text-sm text-fg ${isSubclass ? "pl-4" : "pl-4"}`}>
          {feature.entries.map((e, i) => (
            <EntryRenderer key={i} entry={e} />
          ))}
        </div>
      )}
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Render a progression-table cell value. The data uses several forms:
 *   number  → 3 (or "—" for 0 spell slots)
 *   string  → "2"
 *   {type:"bonus", value:2} → "+2" (signed)
 *   object (other) → best-effort via EntryRenderer
 */
function formatCell(val: unknown): React.ReactNode {
  if (val == null) return "";
  if (typeof val === "number") {
    return val === 0 ? "—" : val;
  }
  if (typeof val === "string") {
    if (val === "0") return "—";
    // Inline-tag strings like "{@dice D8}" → render via the tag parser.
    if (val.includes("{@")) return <InlineText text={val} />;
    return val;
  }
  if (typeof val === "object") {
    const o = val as { type?: string; value?: number; toRoll?: Array<{ number: number; faces: number }>; [k: string]: unknown };
    if (o.type === "bonus" && typeof o.value === "number") {
      return o.value >= 0 ? `+${o.value}` : String(o.value);
    }
    // Structured dice: {type:"dice", toRoll:[{number:1,faces:6}]} → "1d6"
    if (o.type === "dice" && Array.isArray(o.toRoll)) {
      return o.toRoll.map((d) => `${d.number}d${d.faces}`).join(" + ");
    }
    // Fallback: render the object as an entry if it has entries/text
    if ("entries" in o || "text" in o) {
      return <EntryRenderer entry={o as Parameters<typeof EntryRenderer>[0]["entry"]} />;
    }
    return JSON.stringify(val);
  }
  return String(val);
}
