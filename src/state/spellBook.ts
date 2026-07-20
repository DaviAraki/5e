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

  // --- portability ---
  exportBooks: () => SpellBook[];
  /** Merge validated books into the store. Returns the number imported. */
  importBooks: (books: SpellBook[]) => number;
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
    (set, get) => ({
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

      exportBooks: () =>
        Object.values(get().books).sort((a, b) =>
          a.createdAt.localeCompare(b.createdAt),
        ),

      importBooks: (books) => {
        set((state) => {
          const next = { ...state.books };
          for (const book of books) {
            // Avoid clobbering existing books: if the imported id collides,
            // assign a fresh id so both are kept.
            const id = book.id in next ? newId() : book.id;
            next[id] = { ...book, id };
          }
          return { books: next };
        });
        return books.length;
      },
    }),
    {
      name: "5etools-react/spellbook",
      version: 1,
      // Validate persisted state on hydration. localStorage is editable by
      // anyone with DOM access (other scripts, shared machines, a successful
      // XSS elsewhere); re-running books through parseBooksArray guarantees a
      // well-typed store regardless of what's on disk. A malformed payload
      // drops every book rather than crashing or rendering bad shapes.
      merge: (persisted, current) => {
        const state = current as SpellBookState;
        const p = (persisted ?? {}) as Partial<SpellBookState>;
        if (!p.books || typeof p.books !== "object") {
          return { ...state, books: {}, activeBookId: null };
        }
        const validated = parseBooksArray(Object.values(p.books));
        if (!validated) return { ...state, books: {}, activeBookId: null };
        const books: Record<string, SpellBook> = {};
        for (const book of validated) books[book.id] = book;
        const activeBookId =
          state.activeBookId && books[state.activeBookId]
            ? state.activeBookId
            : firstKey(books);
        return { ...state, books, activeBookId };
      },
    },
  ),
);

/** Convenience selector: the active book object, or null. */
export function selectActiveBook(state: SpellBookState): SpellBook | null {
  return state.activeBookId ? state.books[state.activeBookId] ?? null : null;
}

/**
 * Validate an unknown payload (e.g. decoded by the codec) as a spell-books
 * array. Returns the books on success, or null if the shape is invalid.
 * Defensive against arbitrary user-provided / pasted data.
 *
 * Accepts either a bare `SpellBook[]` (the compact-codec format) or a legacy
 * `{ version, exportedAt, books }` envelope.
 */
export function parseBooks(data: unknown): SpellBook[] | null {
  // Bare array (current compact format).
  if (Array.isArray(data)) return parseBooksArray(data);
  // Legacy envelope.
  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    if (obj.version === 1 && Array.isArray(obj.books)) return parseBooksArray(obj.books);
  }
  return null;
}

/** Keys with prototype-pollution risk; never allowed as book ids. */
const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/**
 * Validate and coerce an unknown array into `SpellBook[]`. Returns null on any
 * structural violation (so callers can reject the whole payload), and silently
 * drops non-boolean spell values / forbidden keys rather than failing whole.
 *
 * Exported so the `persist` merge function can re-run stored localStorage
 * state through the same validator as the import-code path.
 */
export function parseBooksArray(arr: unknown[]): SpellBook[] | null {
  const books: SpellBook[] = [];
  for (const raw of arr) {
    if (typeof raw !== "object" || raw === null) return null;
    const b = raw as Record<string, unknown>;
    if (
      typeof b.id !== "string" ||
      typeof b.name !== "string" ||
      typeof b.createdAt !== "string" ||
      typeof b.spells !== "object" ||
      b.spells === null
    ) {
      return null;
    }
    if (FORBIDDEN_KEYS.has(b.id)) return null;
    // Coerce spells to Record<string, boolean>, dropping any non-boolean
    // values and any prototype-pollution keys.
    const spells: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(b.spells as Record<string, unknown>)) {
      if (typeof v === "boolean" && !FORBIDDEN_KEYS.has(k)) spells[k] = v;
    }
    books.push({ id: b.id, name: b.name, createdAt: b.createdAt, spells });
  }
  return books;
}
