import { useMemo } from "react";
import type { Class } from "@/types/entities";
import { useClasses } from "@/data/DataLoader";
import { makeRef } from "@/data/entityRefs";
import ClassStatBlock from "@/components/StatBlock/ClassStatBlock";
import Centered from "@/components/layout/Centered";
import MasterDetailLayout from "@/components/layout/MasterDetailLayout";
import ColumnHeader, { type ColumnDef } from "@/components/list/ColumnHeader";
import { useMasterDetail } from "@/hooks/useMasterDetail";

/**
 * Responsive class browser. Same mobile/desktop pattern as SpellsPage:
 * - Desktop (md+): list | detail side by side.
 * - Mobile: list full-width; tapping slides detail in with a back button.
 */
export default function ClassesPage() {
  const { data, isLoading, error } = useClasses();
  const { selectedKey, isMobileDetail, setIsMobileDetail, select } = useMasterDetail();

  const classes = data?.classes ?? [];
  const subclasses = data?.subclasses ?? [];

  const sorted = useMemo(
    () => [...classes].sort((a, b) => a.name.localeCompare(b.name)),
    [classes],
  );

  const selected = useMemo(
    () => classes.find((c) => makeRef(c.name, c.source) === selectedKey) ?? null,
    [classes, selectedKey],
  );

  if (isLoading) return <Centered>Loading classes…</Centered>;
  if (error)
    return (
      <Centered>
        <div className="text-red-400">
          Failed to load: {String(error.message)}
          <div className="mt-2 text-xs text-fg-muted">
            Did you run <code className="rounded bg-bg-raised px-1">npm run gen</code>?
          </div>
        </div>
      </Centered>
    );

  const columns: ColumnDef[] = [
    { label: "Name", className: "flex-1" },
    { label: "Magic", title: "Spellcasting type", className: "w-14 shrink-0 text-center" },
    { label: "HD", title: "Hit die", className: "w-8 shrink-0 text-center" },
  ];

  return (
    <MasterDetailLayout
      isMobileDetail={isMobileDetail}
      onBack={() => setIsMobileDetail(false)}
      backLabel="Classes"
      listWidth="md:w-64"
      list={
        <>
          <div className="border-b border-border px-3 py-2">
            <span className="text-sm font-semibold text-fg">
              Classes <span className="text-fg-muted">({sorted.length})</span>
            </span>
          </div>
          <ColumnHeader columns={columns} />
          <div className="flex-1 overflow-y-auto">
            {sorted.map((c) => {
              const key = makeRef(c.name, c.source);
              const active = key === selectedKey;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => select(key)}
                  className={`flex w-full items-center gap-2 border-b border-border-subtle px-3 py-2 text-left text-sm transition-colors ${
                    active ? "bg-accent-subtle" : "hover:bg-bg-raised"
                  }`}
                >
                  <span className="flex-1 truncate font-medium">{c.name}</span>
                  <span
                    className="w-14 shrink-0 text-center text-xs text-accent"
                    title={casterTooltip(c)}
                  >
                    {casterLabel(c)}
                  </span>
                  <span className="w-8 shrink-0 text-center text-xs text-fg-faint">
                    d{c.hd.faces}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      }
      detail={
        selected ? (
          <ClassStatBlock cls={selected} subclasses={subclasses} />
        ) : (
          <Centered>
            <p className="text-fg-muted">Select a class to view details.</p>
          </Centered>
        )
      }
    />
  );
}

/** Short badge label for the class list's "Magic" column. */
function casterLabel(c: Class): string {
  if (!c.spellcastingAbility) return "—";
  switch (c.casterProgression) {
    case "full":
      return "Full";
    case "artificer":
      return "½";
    case "1/3":
      return "⅓";
    case "pact":
      return "Pact";
    default:
      return c.casterProgression ?? "Yes";
  }
}

/** Tooltip text for the Magic column. */
function casterTooltip(c: Class): string {
  if (!c.spellcastingAbility) return "No spellcasting";
  const abil = c.spellcastingAbility.toUpperCase();
  switch (c.casterProgression) {
    case "full":
      return `Full caster (${abil})`;
    case "artificer":
      return `Half caster (${abil})`;
    case "1/3":
      return `Third caster (${abil})`;
    case "pact":
      return `Pact magic (${abil})`;
    default:
      return `${abil} caster`;
  }
}
