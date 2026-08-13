import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Persisted store for user-defined monster encounters. Each encounter holds a
 * set of monsters keyed by the 5etools `name|source` composite key (see
 * src/data/entityRefs.ts), mapped to a creature count. Full Monster objects are
 * resolved at render time by joining keys against the React Query monsters
 * cache, so the persisted payload stays small (keys + counts only).
 *
 * Mirrors the SpellBook store's shape and trust boundary (see spellBook.ts):
 * zustand `persist` middleware with a `merge` validator that re-runs stored
 * state through {@link parseEncountersArray} on hydration.
 */

export interface Encounter {
  /** Stable unique id (crypto.randomUUID()). */
  id: string;
  /** User-defined label, e.g. "Cave Ambush". */
  name: string;
  /** refKey -> creature count (>= 1). Presence means the monster is in the encounter. */
  monsters: Record<string, number>;
  /** ISO timestamp of creation, for stable ordering. */
  createdAt: string;
}

interface EncounterState {
  encounters: Record<string, Encounter>;
  /** The encounter that Bestiary "add" buttons target. */
  activeEncounterId: string | null;

  // --- encounter management ---
  createEncounter: (name: string) => string;
  renameEncounter: (id: string, name: string) => void;
  deleteEncounter: (id: string) => void;
  setActiveEncounter: (id: string) => void;

  // --- monster management (operate on a specific encounter) ---
  /** Add one of the monster, or increment if already present. */
  addMonster: (encounterId: string, key: string) => void;
  /** Increment the monster count by one (no-op if absent). */
  incMonster: (encounterId: string, key: string) => void;
  /** Decrement by one; removes the entry when the count would drop to zero. */
  decMonster: (encounterId: string, key: string) => void;
  /** Remove the monster from the encounter entirely. */
  removeMonster: (encounterId: string, key: string) => void;
  /** Set an absolute count; <= 0 removes the entry. */
  setCount: (encounterId: string, key: string, count: number) => void;
}

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

function firstKey(encounters: Record<string, Encounter>): string | null {
  const ids = Object.values(encounters)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((e) => e.id);
  return ids[0] ?? null;
}

export const useEncounters = create<EncounterState>()(
  persist(
    (set) => ({
      encounters: {},
      activeEncounterId: null,

      createEncounter: (name) => {
        const trimmed = name.trim();
        const id = newId();
        const encounter: Encounter = {
          id,
          name: trimmed || "New Encounter",
          monsters: {},
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          encounters: { ...state.encounters, [id]: encounter },
          activeEncounterId: id,
        }));
        return id;
      },

      renameEncounter: (id, name) =>
        set((state) => {
          const encounter = state.encounters[id];
          if (!encounter) return state;
          return { encounters: { ...state.encounters, [id]: { ...encounter, name } } };
        }),

      deleteEncounter: (id) =>
        set((state) => {
          if (!state.encounters[id]) return state;
          const next = { ...state.encounters };
          delete next[id];
          const nextActive =
            state.activeEncounterId === id ? firstKey(next) : state.activeEncounterId;
          return { encounters: next, activeEncounterId: nextActive };
        }),

      setActiveEncounter: (id) =>
        set((state) => (state.encounters[id] ? { activeEncounterId: id } : state)),

      addMonster: (encounterId, key) =>
        set((state) => {
          const encounter = state.encounters[encounterId];
          if (!encounter) return state;
          const next = (encounter.monsters[key] ?? 0) + 1;
          return {
            encounters: {
              ...state.encounters,
              [encounterId]: { ...encounter, monsters: { ...encounter.monsters, [key]: next } },
            },
          };
        }),

      incMonster: (encounterId, key) =>
        set((state) => {
          const encounter = state.encounters[encounterId];
          if (!encounter) return state;
          const current = encounter.monsters[key];
          if (current == null) return state;
          return {
            encounters: {
              ...state.encounters,
              [encounterId]: {
                ...encounter,
                monsters: { ...encounter.monsters, [key]: current + 1 },
              },
            },
          };
        }),

      decMonster: (encounterId, key) =>
        set((state) => {
          const encounter = state.encounters[encounterId];
          if (!encounter) return state;
          const current = encounter.monsters[key];
          if (current == null) return state;
          const nextMonsters = { ...encounter.monsters };
          if (current <= 1) {
            delete nextMonsters[key];
          } else {
            nextMonsters[key] = current - 1;
          }
          return {
            encounters: {
              ...state.encounters,
              [encounterId]: { ...encounter, monsters: nextMonsters },
            },
          };
        }),

      removeMonster: (encounterId, key) =>
        set((state) => {
          const encounter = state.encounters[encounterId];
          if (!encounter || !(key in encounter.monsters)) return state;
          const nextMonsters = { ...encounter.monsters };
          delete nextMonsters[key];
          return {
            encounters: {
              ...state.encounters,
              [encounterId]: { ...encounter, monsters: nextMonsters },
            },
          };
        }),

      setCount: (encounterId, key, count) =>
        set((state) => {
          const encounter = state.encounters[encounterId];
          if (!encounter) return state;
          const n = Math.floor(count);
          const nextMonsters = { ...encounter.monsters };
          if (n <= 0) {
            delete nextMonsters[key];
          } else {
            nextMonsters[key] = n;
          }
          return {
            encounters: {
              ...state.encounters,
              [encounterId]: { ...encounter, monsters: nextMonsters },
            },
          };
        }),
    }),
    {
      name: "5etools-react/encounters",
      version: 1,
      // Validate persisted state on hydration. localStorage is editable by
      // anyone with DOM access; re-running encounters through parseEncountersArray
      // guarantees a well-typed store regardless of what's on disk. A malformed
      // payload drops every encounter rather than crashing or rendering bad shapes.
      merge: (persisted, current) => {
        const state = current as EncounterState;
        const p = (persisted ?? {}) as Partial<EncounterState>;
        if (!p.encounters || typeof p.encounters !== "object") {
          return { ...state, encounters: {}, activeEncounterId: null };
        }
        const validated = parseEncountersArray(Object.values(p.encounters));
        if (!validated) return { ...state, encounters: {}, activeEncounterId: null };
        const encounters: Record<string, Encounter> = {};
        for (const e of validated) encounters[e.id] = e;
        const activeEncounterId =
          state.activeEncounterId && encounters[state.activeEncounterId]
            ? state.activeEncounterId
            : firstKey(encounters);
        return { ...state, encounters, activeEncounterId };
      },
    },
  ),
);

/** Convenience selector: the active encounter object, or null. */
export function selectActiveEncounter(state: EncounterState): Encounter | null {
  return state.activeEncounterId ? state.encounters[state.activeEncounterId] ?? null : null;
}

/** Keys with prototype-pollution risk; never allowed as encounter ids or monster keys. */
const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/**
 * Validate and coerce an unknown array into `Encounter[]`. Returns null on any
 * structural violation (so callers reject the whole payload), and silently
 * drops non-positive-integer counts / forbidden keys rather than failing whole.
 *
 * Exported so the `persist` merge function re-runs stored localStorage state
 * through the same validator as any future import-code path.
 */
export function parseEncountersArray(arr: unknown[]): Encounter[] | null {
  const encounters: Encounter[] = [];
  for (const raw of arr) {
    if (typeof raw !== "object" || raw === null) return null;
    const e = raw as Record<string, unknown>;
    if (
      typeof e.id !== "string" ||
      typeof e.name !== "string" ||
      typeof e.createdAt !== "string" ||
      typeof e.monsters !== "object" ||
      e.monsters === null
    ) {
      return null;
    }
    if (FORBIDDEN_KEYS.has(e.id)) return null;
    // Coerce monsters to Record<string, number>, dropping any non-number values,
    // non-positive integers, and prototype-pollution keys.
    const monsters: Record<string, number> = {};
    for (const [k, v] of Object.entries(e.monsters as Record<string, unknown>)) {
      if (typeof v === "number" && Number.isFinite(v) && v >= 1 && !FORBIDDEN_KEYS.has(k)) {
        monsters[k] = Math.floor(v);
      }
    }
    encounters.push({ id: e.id, name: e.name, createdAt: e.createdAt, monsters });
  }
  return encounters;
}
