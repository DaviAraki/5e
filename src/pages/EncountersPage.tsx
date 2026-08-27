import { useMemo, useState } from "react";
import type { Monster } from "@/types/entities";
import { useMonsters } from "@/data/DataLoader";
import { indexByRef } from "@/data/entityRefs";
import MonsterStatBlock from "@/components/StatBlock/MonsterStatBlock";
import { isEncountersStorageHealthy, useEncounters } from "@/state/encounters";
import { crXpValue, crToFull } from "@/lib/monsterFormatters";
import Centered from "@/components/layout/Centered";
import { requestConfirm } from "@/components/ConfirmModal";

interface RosterEntry {
  key: string;
  count: number;
  monster: Monster;
}

/**
 * Encounters page: collect monsters for a session into named encounters and
 * view every stat block on one page (responsive grid), so a GM never swaps
 * pages mid-session. Each monster tracks a count; total XP is summed below.
 *
 * Mirrors the SpellBook's persisted-store + management-bar pattern, but renders
 * a grid of stat blocks instead of a master-detail list — the whole point is
 * seeing every creature at once.
 */
export default function EncountersPage() {
  const { data, isLoading, error } = useMonsters();
  const [search, setSearch] = useState("");

  const encounters = useEncounters((s) => s.encounters);
  const activeEncounterId = useEncounters((s) => s.activeEncounterId);
  const setActiveEncounter = useEncounters((s) => s.setActiveEncounter);
  const createEncounter = useEncounters((s) => s.createEncounter);
  const renameEncounter = useEncounters((s) => s.renameEncounter);
  const deleteEncounter = useEncounters((s) => s.deleteEncounter);
  const incMonster = useEncounters((s) => s.incMonster);
  const decMonster = useEncounters((s) => s.decMonster);
  const removeMonster = useEncounters((s) => s.removeMonster);

  const allMonsters = data?.entities ?? [];
  const byRef = useMemo(() => indexByRef(allMonsters), [allMonsters]);

  const encounterList = useMemo(
    () => Object.values(encounters).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [encounters],
  );
  const activeEncounter = activeEncounterId ? encounters[activeEncounterId] ?? null : null;

  // Resolve the active encounter's stored keys into full Monster objects.
  const roster = useMemo<RosterEntry[]>(() => {
    if (!activeEncounter) return [];
    return Object.entries(activeEncounter.monsters)
      .map(([key, count]) => {
        const monster = byRef.get(key);
        return monster ? { key, count, monster } : null;
      })
      .filter((e): e is RosterEntry => e != null);
  }, [activeEncounter, byRef]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return roster;
    return roster.filter((e) => e.monster.name.toLowerCase().includes(q));
  }, [roster, search]);

  const totals = useMemo(() => {
    let monsters = 0;
    let xp = 0;
    for (const e of roster) {
      monsters += e.count;
      xp += e.count * crXpValue(e.monster.cr);
    }
    return { monsters, xp };
  }, [roster]);

  if (isLoading) return <Centered>Loading monsters…</Centered>;
  if (error)
    return (
      <Centered>
        <div className="text-red-400">Failed to load: {String(error.message)}</div>
      </Centered>
    );

  // --- empty state: no encounters yet ---
  if (encounterList.length === 0) {
    return (
      <Centered>
        <div className="max-w-sm text-center">
          {!isEncountersStorageHealthy() && (
            <p className="mb-3 text-xs text-yellow-300" role="alert">
              Storage is unavailable in this context — encounters will be lost on reload.
            </p>
          )}
          <p className="text-fg-muted">You have no encounters yet.</p>
          <button
            type="button"
            onClick={() => {
              const name = window.prompt("Encounter name");
              if (name != null) createEncounter(name);
            }}
            className="mt-4 rounded-md border border-accent bg-accent-subtle px-3 py-1.5 text-sm text-accent hover:bg-accent"
          >
            + Create Encounter
          </button>
        </div>
      </Centered>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-7xl">
        {!isEncountersStorageHealthy() && (
          <div
            role="alert"
            className="border-b border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-300"
          >
            Storage is unavailable in this context — encounters will be lost on
            reload. Adding monsters still works for the current session.
          </div>
        )}
        {/* Management bar (sticky within the scrolling container) */}
        <div className="sticky top-0 z-10 border-b border-border bg-bg/95 px-3 py-2 backdrop-blur">
          <div className="flex items-center gap-2">
            <select
              value={activeEncounterId ?? ""}
              onChange={(e) => setActiveEncounter(e.target.value)}
              className="min-w-0 flex-1 rounded-md border border-border bg-bg-raised px-2 py-1.5 text-sm outline-hidden focus:border-accent"
            >
              {encounterList.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({Object.keys(e.monsters).length})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                const name = window.prompt("New encounter name");
                if (name != null) createEncounter(name);
              }}
              className="shrink-0 rounded-md border border-border px-2 py-1.5 text-sm text-fg-muted hover:text-fg"
              title="New encounter"
            >
              + New
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (!activeEncounter) return;
                const name = window.prompt("Rename encounter", activeEncounter.name);
                if (name != null) renameEncounter(activeEncounter.id, name);
              }}
              className="rounded-md border border-border px-2 py-1 text-xs text-fg-muted hover:text-fg"
            >
              Rename
            </button>
            <button
              type="button"
              onClick={() => {
                if (!activeEncounter) return;
                requestConfirm({
                  message: `Delete “${activeEncounter.name}”? This cannot be undone.`,
                  confirmLabel: "Delete",
                  destructive: true,
                  onConfirm: () => deleteEncounter(activeEncounter.id),
                });
              }}
              className="rounded-md border border-border px-2 py-1 text-xs text-red-400 hover:bg-red-950/30"
            >
              Delete
            </button>
            <input
              type="search"
              placeholder={`Search ${roster.length} monsters…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-w-0 flex-1 rounded-md border border-border bg-bg-raised px-3 py-1 text-sm outline-hidden placeholder:text-fg-faint focus:border-accent"
            />
          </div>
        </div>

        {/* Roster table */}
        {roster.length > 0 ? (
          <div className="border-b border-border">
            {visible.map((entry) => (
              <div
                key={entry.key}
                className="flex items-center gap-3 border-b border-border-subtle px-3 py-1.5 text-sm"
              >
                <span className="min-w-0 flex-1 truncate font-medium">{entry.monster.name}</span>
                <span className="w-12 shrink-0 text-right text-xs text-fg-muted">
                  CR {crToFull(entry.monster.cr)}
                </span>
                <span className="w-20 shrink-0 text-right text-xs text-fg-muted">
                  {(entry.count * crXpValue(entry.monster.cr)).toLocaleString()} XP
                </span>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => activeEncounterId && decMonster(activeEncounterId, entry.key)}
                    aria-label="Decrease count"
                    className="h-6 w-6 rounded border border-border text-fg-muted hover:text-fg"
                  >
                    −
                  </button>
                  <span className="w-6 text-center tabular-nums">{entry.count}</span>
                  <button
                    type="button"
                    onClick={() => activeEncounterId && incMonster(activeEncounterId, entry.key)}
                    aria-label="Increase count"
                    className="h-6 w-6 rounded border border-border text-fg-muted hover:text-fg"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    activeEncounterId &&
                    requestConfirm({
                      message: `Remove all "${entry.monster.name}" from "${activeEncounter?.name ?? "this encounter"}"?`,
                      confirmLabel: "Remove",
                      destructive: true,
                      onConfirm: () => removeMonster(activeEncounterId, entry.key),
                    })
                  }
                  title="Remove from encounter"
                  aria-label="Remove from encounter"
                  className="w-6 shrink-0 text-center text-fg-faint hover:text-red-400"
                >
                  ×
                </button>
              </div>
            ))}
            <div className="px-3 py-1 text-xs text-fg-muted">
              {totals.monsters} monster{totals.monsters === 1 ? "" : "s"} ·{" "}
              {totals.xp.toLocaleString()} XP total
            </div>
          </div>
        ) : null}

        {/* Stat-block grid */}
        {visible.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 p-3 lg:grid-cols-2">
            {visible.map((entry) => (
              <div
                key={entry.key}
                className="overflow-hidden rounded-lg border border-border bg-bg-raised/30"
              >
                <div className="flex items-center justify-between border-b border-border-subtle px-3 py-1.5 text-sm">
                  <span className="font-semibold">
                    ×{entry.count}{" "}
                    <span className="font-normal text-fg-muted">
                      ({(entry.count * crXpValue(entry.monster.cr)).toLocaleString()} XP)
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => activeEncounterId && removeMonster(activeEncounterId, entry.key)}
                    title="Remove from encounter"
                    aria-label="Remove from encounter"
                    className="text-fg-faint hover:text-red-400"
                  >
                    ×
                  </button>
                </div>
                <MonsterStatBlock monster={entry.monster} />
              </div>
            ))}
          </div>
        ) : (
          <Centered>
            <div className="text-center">
              <p className="text-fg-muted">
                {roster.length === 0
                  ? "This encounter is empty."
                  : "No monsters match."}
              </p>
              <p className="mt-1 text-xs text-fg-faint">
                {roster.length === 0
                  ? "Add monsters from the Bestiary."
                  : `${roster.length} monsters in this encounter`}
              </p>
            </div>
          </Centered>
        )}
      </div>
    </div>
  );
}
