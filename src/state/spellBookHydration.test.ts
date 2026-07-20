// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { type SpellBook, useSpellBook } from "@/state/spellBook";

/**
 * The persist `merge` function is the trust boundary for localStorage. Anyone
 * with DOM access can write arbitrary bytes into the spell-book key; these
 * tests guarantee the store stays well-typed regardless of what's on disk.
 */
const VALID_BOOK: SpellBook = {
  id: "b1",
  name: "My Book",
  createdAt: "2024-01-01T00:00:00.000Z",
  spells: { "Fireball|XPHB": true },
};

/** zustand persist stores `{ state, version }` under the configured key. */
function seedLocalStorage(raw: unknown): void {
  localStorage.setItem(
    "5etools-react/spellbook",
    JSON.stringify({ state: { books: raw }, version: 1 }),
  );
}

describe("persist hydration", () => {
  beforeEach(() => {
    localStorage.clear();
    useSpellBook.setState({ books: {}, activeBookId: null });
  });

  it("accepts a valid persisted books payload", async () => {
    seedLocalStorage({ b1: VALID_BOOK });
    await useSpellBook.persist.rehydrate();
    expect(useSpellBook.getState().books.b1).toEqual(VALID_BOOK);
  });

  it("drops books when localStorage holds malformed-shape entries", async () => {
    seedLocalStorage({ b1: { id: 123, name: "bad" } }); // wrong types
    await useSpellBook.persist.rehydrate();
    expect(useSpellBook.getState().books).toEqual({});
    expect(useSpellBook.getState().activeBookId).toBeNull();
  });

  it("drops books when localStorage is a non-object value", async () => {
    seedLocalStorage("not-an-object");
    await useSpellBook.persist.rehydrate();
    expect(useSpellBook.getState().books).toEqual({});
  });

  it("drops a book whose id collides with a prototype key", async () => {
    seedLocalStorage({ __proto__: { ...VALID_BOOK, id: "__proto__" } });
    await useSpellBook.persist.rehydrate();
    expect(useSpellBook.getState().books).toEqual({});
  });

  it("preserves multiple valid books across rehydration", async () => {
    seedLocalStorage({
      b1: { ...VALID_BOOK, id: "b1" },
      b2: { ...VALID_BOOK, id: "b2", name: "Other" },
    });
    await useSpellBook.persist.rehydrate();
    expect(Object.keys(useSpellBook.getState().books).sort()).toEqual(["b1", "b2"]);
  });

  it("handles an empty books payload without crashing", async () => {
    seedLocalStorage({});
    await useSpellBook.persist.rehydrate();
    expect(useSpellBook.getState().books).toEqual({});
  });
});
