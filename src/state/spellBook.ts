import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Persisted store for user-defined spell books. Each book holds a set of spells
 * keyed by the 5etools `name|source` composite key (see src/data/entityRefs.ts),
 * with a per-spell "memorized" flag. Full Spell objects are resolved at render
 * time by joining keys against the React Query spells cache, so the persisted
 * payload stays small (keys + booleans only).
 *
 * This is the app's first persisted store; it uses zustand's `persist`
 * middleware with default JSON storage (the data is plain objects, so no custom
 * serializer is required).
 */

export interface SpellBook {
  /** Stable unique id (crypto.randomUUID()). */
  id: string;
  /** User-defined label, e.g. a character name. */
  name: string;
  /** spellKey -> memorized. Presence of the key means the spell is in the book. */
  spells: Record<string, boolean>;
  /** ISO timestamp of creation, for stable ordering. */
  createdAt: string;
}

interface SpellBookState {
  books: Record<string, SpellBook>;
  /** The book that "Add to Spell Book" buttons target. */
  activeBookId: string | null;

  // --- book management ---
  createBook: (name: string) => string;
  renameBook: (id: string, name: string) => void;
  deleteBook: (id: string) => void;
  setActiveBook: (id: string) => void;

  // --- spell management (operate on a specific book) ---
  addToBook: (bookId: string, key: string) => void;
  removeFromBook: (bookId: string, key: string) => void;
  toggleMemorized: (bookId: string, key: string) => void;
}

function newId(): string {
  // crypto.randomUUID is available in all evergreen browsers and modern Node.
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

function firstKey(books: Record<string, SpellBook>): string | null {
  const ids = Object.values(books)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((b) => b.id);
  return ids[0] ?? null;
}

export const useSpellBook = create<SpellBookState>()(
  persist(
    (set) => ({
      books: {},
      activeBookId: null,

      createBook: (name) => {
        const trimmed = name.trim();
        const id = newId();
        const book: SpellBook = {
          id,
          name: trimmed || "New Spell Book",
          spells: {},
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          books: { ...state.books, [id]: book },
          activeBookId: id,
        }));
        return id;
      },

      renameBook: (id, name) =>
        set((state) => {
          const book = state.books[id];
          if (!book) return state;
          return { books: { ...state.books, [id]: { ...book, name } } };
        }),

      deleteBook: (id) =>
        set((state) => {
          if (!state.books[id]) return state;
          const next = { ...state.books };
          delete next[id];
          const nextActive =
            state.activeBookId === id ? firstKey(next) : state.activeBookId;
          return { books: next, activeBookId: nextActive };
        }),

      setActiveBook: (id) =>
        set((state) => (state.books[id] ? { activeBookId: id } : state)),

      addToBook: (bookId, key) =>
        set((state) => {
          const book = state.books[bookId];
          if (!book) return state;
          // Adding defaults to NOT memorized; user flips the checkbox in the book.
          return {
            books: {
              ...state.books,
              [bookId]: { ...book, spells: { ...book.spells, [key]: false } },
            },
          };
        }),

      removeFromBook: (bookId, key) =>
        set((state) => {
          const book = state.books[bookId];
          if (!book || !(key in book.spells)) return state;
          const nextSpells = { ...book.spells };
          delete nextSpells[key];
          return {
            books: { ...state.books, [bookId]: { ...book, spells: nextSpells } },
          };
        }),

      toggleMemorized: (bookId, key) =>
        set((state) => {
          const book = state.books[bookId];
          if (!book || !(key in book.spells)) return state;
          return {
            books: {
              ...state.books,
              [bookId]: {
                ...book,
                spells: { ...book.spells, [key]: !book.spells[key] },
              },
            },
          };
        }),
    }),
    {
      name: "5etools-react/spellbook",
      version: 1,
    },
  ),
);

/** Convenience selector: the active book object, or null. */
export function selectActiveBook(state: SpellBookState): SpellBook | null {
  return state.activeBookId ? state.books[state.activeBookId] ?? null : null;
}
