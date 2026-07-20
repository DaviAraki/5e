import { beforeEach, describe, expect, it } from "vitest";
import {
  type SpellBook,
  parseBooks,
  parseBooksArray,
  selectActiveBook,
  useSpellBook,
} from "@/state/spellBook";

/**
 * Tests for the spell-book store + the parseBooks validator.
 *
 * parseBooks is the trust boundary for pasted/imported data (codec output or
 * user paste); the store actions operate on user-owned state. Both are pure
 * logic (no React), so testable directly in Node.
 */

const VALID_BOOK: SpellBook = {
  id: "b1",
  name: "My Book",
  createdAt: "2024-01-01T00:00:00.000Z",
  spells: { "Fireball|XPHB": true, "Shield|XPHB": false },
};

describe("parseBooks", () => {
  describe("accepts valid shapes", () => {
    it("accepts a bare SpellBook[] (compact format)", () => {
      expect(parseBooks([VALID_BOOK])).toEqual([VALID_BOOK]);
    });

    it("accepts an empty array", () => {
      expect(parseBooks([])).toEqual([]);
    });

    it("accepts the legacy {version:1, books} envelope", () => {
      const envelope = { version: 1, exportedAt: "x", books: [VALID_BOOK] };
      expect(parseBooks(envelope)).toEqual([VALID_BOOK]);
    });
  });

  describe("rejects malformed payloads (returns null)", () => {
    it("rejects non-array / non-object roots", () => {
      expect(parseBooks(null)).toBeNull();
      expect(parseBooks("hello")).toBeNull();
      expect(parseBooks(42)).toBeNull();
      expect(parseBooks(undefined)).toBeNull();
    });

    it("rejects a legacy envelope with the wrong version", () => {
      expect(parseBooks({ version: 2, books: [VALID_BOOK] })).toBeNull();
      expect(parseBooks({ version: 1, books: "not array" })).toBeNull();
    });

    it("rejects an array element that is not an object", () => {
      expect(parseBooks([VALID_BOOK, null])).toBeNull();
      expect(parseBooks([42, VALID_BOOK])).toBeNull();
      expect(parseBooks(["str"])).toBeNull();
    });

    it("rejects a book with wrong-typed required fields", () => {
      const base = { ...VALID_BOOK } as unknown as Record<string, unknown>;
      expect(parseBooks([{ ...base, id: 123 }])).toBeNull();
      expect(parseBooks([{ ...base, name: 5 }])).toBeNull();
      expect(parseBooks([{ ...base, createdAt: false }])).toBeNull();
      expect(parseBooks([{ ...base, spells: "x" }])).toBeNull();
      expect(parseBooks([{ ...base, spells: null }])).toBeNull();
    });
  });

  describe("coerces the spells map", () => {
    it("drops non-boolean values from spells but keeps booleans", () => {
      const raw = [
        {
          ...VALID_BOOK,
          spells: {
            "Fireball|XPHB": true,
            "Shield|XPHB": false,
            "BadNumber": 1, // dropped
            "BadString": "true", // dropped
            "BadNull": null, // dropped
          },
        },
      ];
      const out = parseBooks(raw);
      expect(out).not.toBeNull();
      expect(out?.[0]?.spells).toEqual({
        "Fireball|XPHB": true,
        "Shield|XPHB": false,
      });
    });

    it("accepts an empty spells object", () => {
      const out = parseBooks([{ ...VALID_BOOK, spells: {} }]);
      expect(out).toEqual([{ ...VALID_BOOK, spells: {} }]);
    });
  });

  describe("rejects prototype-pollution payloads", () => {
    it("rejects a book whose id is __proto__", () => {
      expect(
        parseBooksArray([{ ...VALID_BOOK, id: "__proto__" }]),
      ).toBeNull();
    });

    it("drops spell keys named __proto__ / constructor / prototype", () => {
      const out = parseBooksArray([
        {
          ...VALID_BOOK,
          spells: {
            "Fireball|XPHB": true,
            __proto__: true,
            constructor: false,
            prototype: true,
          },
        },
      ]);
      expect(out?.[0]?.spells).toEqual({ "Fireball|XPHB": true });
    });
  });
});

// ---------------------------------------------------------------------------
// Hydration (persist merge) — defends against poisoned localStorage.
// Lives in its own jsdom file because seeding localStorage needs a DOM.
// See spellBookHydration.test.ts.

// ---------------------------------------------------------------------------
// Store actions
// ---------------------------------------------------------------------------

/** Reset the persisted store to a clean slate between tests. */
function resetStore() {
  useSpellBook.setState({ books: {}, activeBookId: null });
}

/**
 * Fetch a book by id, asserting it exists. Reads cleanly under
 * noUncheckedIndexedAccess (Record indexing yields T | undefined otherwise).
 */
function getBook(id: string): SpellBook {
  const book = useSpellBook.getState().books[id];
  if (!book) throw new Error(`book ${id} missing in test setup`);
  return book;
}

/** Set a book's createdAt (direct mutation for test ordering). */
function setCreatedAt(id: string, iso: string): void {
  const book = useSpellBook.getState().books[id];
  if (book) book.createdAt = iso;
}

describe("useSpellBook store", () => {
  beforeEach(resetStore);

  describe("createBook", () => {
    it("creates a book with a fresh id and empty spells, and sets it active", () => {
      const id = useSpellBook.getState().createBook("Arcane");
      const state = useSpellBook.getState();
      expect(state.books[id]).toBeDefined();
      expect(getBook(id).name).toBe("Arcane");
      expect(getBook(id).spells).toEqual({});
      expect(state.activeBookId).toBe(id);
    });

    it("defaults an empty/whitespace name to 'New Spell Book'", () => {
      const id1 = useSpellBook.getState().createBook("   ");
      const id2 = useSpellBook.getState().createBook("");
      expect(getBook(id1).name).toBe("New Spell Book");
      expect(getBook(id2).name).toBe("New Spell Book");
    });
  });

  describe("renameBook", () => {
    it("updates the name", () => {
      const id = useSpellBook.getState().createBook("Old");
      useSpellBook.getState().renameBook(id, "New");
      expect(getBook(id).name).toBe("New");
    });

    it("is a no-op for an unknown id", () => {
      const before = useSpellBook.getState();
      useSpellBook.getState().renameBook("nope", "X");
      expect(useSpellBook.getState()).toBe(before);
    });
  });

  describe("deleteBook", () => {
    it("removes the book", () => {
      const id = useSpellBook.getState().createBook("A");
      useSpellBook.getState().deleteBook(id);
      expect(useSpellBook.getState().books[id]).toBeUndefined();
    });

    it("reassigns activeBookId to the earliest remaining book when active is deleted", () => {
      const a = useSpellBook.getState().createBook("A"); // createdAt earlier
      // Force a later createdAt for B so A sorts first.
      const b = useSpellBook.getState().createBook("B");
      setCreatedAt(b, "2099-01-01T00:00:00.000Z");
      setCreatedAt(a, "2000-01-01T00:00:00.000Z");
      useSpellBook.getState().setActiveBook(b);
      useSpellBook.getState().deleteBook(b);
      // firstKey sorts by createdAt asc -> A is now active.
      expect(useSpellBook.getState().activeBookId).toBe(a);
    });

    it("nulls activeBookId when no books remain", () => {
      const id = useSpellBook.getState().createBook("Only");
      useSpellBook.getState().deleteBook(id);
      expect(useSpellBook.getState().activeBookId).toBeNull();
    });
  });

  describe("setActiveBook", () => {
    it("sets active only if the book exists", () => {
      const id = useSpellBook.getState().createBook("A");
      useSpellBook.getState().setActiveBook("nope");
      expect(useSpellBook.getState().activeBookId).toBe(id); // unchanged
      useSpellBook.getState().setActiveBook(id);
      expect(useSpellBook.getState().activeBookId).toBe(id);
    });
  });

  describe("spell management", () => {
    it("addToBook adds a key defaulting to memorized=false, no-op if book missing", () => {
      const id = useSpellBook.getState().createBook("A");
      useSpellBook.getState().addToBook(id, "Fireball|XPHB");
      expect(getBook(id).spells["Fireball|XPHB"]).toBe(false);
      useSpellBook.getState().addToBook("nope", "X");
      // unchanged state
      expect(Object.keys(getBook(id).spells)).toEqual(["Fireball|XPHB"]);
    });

    it("removeFromBook removes the key, no-op if book or key missing", () => {
      const id = useSpellBook.getState().createBook("A");
      useSpellBook.getState().addToBook(id, "Fireball|XPHB");
      useSpellBook.getState().removeFromBook(id, "Shield|XPHB"); // key missing -> no-op
      expect(getBook(id).spells["Fireball|XPHB"]).toBe(false);
      useSpellBook.getState().removeFromBook(id, "Fireball|XPHB");
      expect(getBook(id).spells["Fireball|XPHB"]).toBeUndefined();
    });

    it("toggleMemorized flips the boolean, no-op if book or key missing", () => {
      const id = useSpellBook.getState().createBook("A");
      useSpellBook.getState().addToBook(id, "Fireball|XPHB");
      useSpellBook.getState().toggleMemorized(id, "Fireball|XPHB");
      expect(getBook(id).spells["Fireball|XPHB"]).toBe(true);
      useSpellBook.getState().toggleMemorized(id, "Fireball|XPHB");
      expect(getBook(id).spells["Fireball|XPHB"]).toBe(false);
      // no-ops
      useSpellBook.getState().toggleMemorized(id, "Missing|X");
      useSpellBook.getState().toggleMemorized("nope", "Fireball|XPHB");
      expect(getBook(id).spells["Fireball|XPHB"]).toBe(false);
    });
  });

  describe("export / import", () => {
    it("exportBooks returns books sorted by createdAt asc", () => {
      const a = useSpellBook.getState().createBook("A");
      const b = useSpellBook.getState().createBook("B");
      const state0 = useSpellBook.getState();
      const bookA = state0.books[a];
      const bookB = state0.books[b];
      expect(bookA).toBeDefined();
      expect(bookB).toBeDefined();
      bookA!.createdAt = "2024-01-01T00:00:00.000Z";
      bookB!.createdAt = "2023-01-01T00:00:00.000Z";
      const exported = useSpellBook.getState().exportBooks();
      expect(exported.map((x) => x.id)).toEqual([b, a]);
    });

    it("importBooks merges, assigning a fresh id on collision", () => {
      const id = useSpellBook.getState().createBook("Existing");
      const incoming: SpellBook = {
        id, // collides
        name: "Imported",
        createdAt: "2099-01-01T00:00:00.000Z",
        spells: { "X|Y": true },
      };
      const n = useSpellBook.getState().importBooks([incoming]);
      expect(n).toBe(1);
      const state = useSpellBook.getState();
      const original = state.books[id];
      expect(original?.name).toBe("Existing"); // original kept
      const importedId = Object.keys(state.books).find((k) => k !== id);
      expect(importedId).toBeDefined();
      expect(state.books[importedId!]?.name).toBe("Imported");
    });
  });

  describe("selectActiveBook", () => {
    it("returns the active book object or null", () => {
      const id = useSpellBook.getState().createBook("A");
      const state1 = useSpellBook.getState();
      expect(selectActiveBook(state1)?.id).toBe(id);
      useSpellBook.getState().deleteBook(id);
      const state2 = useSpellBook.getState();
      expect(selectActiveBook(state2)).toBeNull();
    });
  });
});
