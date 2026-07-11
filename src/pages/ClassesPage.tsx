import { useEffect, useMemo, useState } from "react";
import type { Class } from "@/types/entities";
import { useClasses } from "@/data/DataLoader";
import ClassStatBlock from "@/components/StatBlock/ClassStatBlock";

/**
 * Responsive class browser. Same mobile/desktop pattern as SpellsPage:
 * - Desktop (md+): list | detail side by side.
 * - Mobile: list full-width; tapping slides detail in with a back button.
 */
export default function ClassesPage() {
  const { data, isLoading, error } = useClasses();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [isMobileDetail, setIsMobileDetail] = useState(false);

  const classes = data?.classes ?? [];
  const subclasses = data?.subclasses ?? [];

  const sorted = useMemo(
    () => [...classes].sort((a, b) => a.name.localeCompare(b.name)),
    [classes],
  );

  const selected = useMemo(
    () => classes.find((c) => classKey(c) === selectedKey) ?? null,
    [classes, selectedKey],
  );

  function selectClass(key: string) {
    setSelectedKey(key);
    setIsMobileDetail(true);
  }

  useEffect(() => {
    if (!selectedKey) setIsMobileDetail(false);
  }, [selectedKey]);

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

  return (
    <div className="flex h-full">
      {/* LIST PANE */}
      <aside
        className={`${
          isMobileDetail ? "hidden md:flex" : "flex"
        } w-full flex-col border-border bg-bg-subtle md:w-64 md:shrink-0 md:border-r`}
      >
        <div className="border-b border-border px-3 py-2">
          <span className="text-sm font-semibold text-fg">
            Classes <span className="text-fg-muted">({sorted.length})</span>
          </span>
        </div>
        {/* Column header */}
        <div className="flex items-center gap-2 border-b border-border bg-bg-raised px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-fg-faint">
          <span className="flex-1">Name</span>
          <span className="w-14 shrink-0 text-center" title="Spellcasting type">
            Magic
          </span>
          <span className="w-8 shrink-0 text-center" title="Hit die">
            HD
          </span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sorted.map((c) => {
            const key = classKey(c);
            const active = key === selectedKey;
            return (
              <button
                key={key}
                type="button"
                onClick={() => selectClass(key)}
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
      </aside>

      {/* DETAIL PANE */}
      <section
        className={`${
          isMobileDetail ? "flex" : "hidden md:flex"
        } absolute inset-0 top-0 z-10 flex-1 flex-col overflow-hidden bg-bg md:static md:z-auto`}
      >
        <div className="flex items-center border-b border-border bg-bg-subtle px-2 py-2 md:hidden">
          <button
            type="button"
            onClick={() => setIsMobileDetail(false)}
            className="flex items-center gap-1 rounded-md px-3 py-1 text-sm text-accent hover:bg-bg-raised"
          >
            <span aria-hidden>←</span> Classes
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {selected ? (
            <ClassStatBlock cls={selected} subclasses={subclasses} />
          ) : (
            <Centered>
              <p className="text-fg-muted">Select a class to view details.</p>
            </Centered>
          )}
        </div>
      </section>
    </div>
  );
}

function classKey(c: Class): string {
  return `${c.name}|${c.source}`;
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

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center text-fg-muted">{children}</div>
  );
}
