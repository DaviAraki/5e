import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Data-shape smoke tests for the committed resolved dataset.
 *
 * These guard the invariant that caused the original "duplicate items" bug:
 * `public/data/resolved/items.json` must contain no rows with a non-string
 * `source` and no duplicate `name|source` composite keys. If a merge script
 * regression ever reintroduces undefined-source rows or key collisions, this
 * file fails before the bad data ships.
 *
 * Reads the committed JSON directly (no fetch); runs in the Node environment.
 */

interface ItemRow {
  name: unknown;
  source: unknown;
  type?: unknown;
  __prop?: unknown;
}

const itemsPath = fileURLToPath(
  new URL("../public/data/resolved/items.json", import.meta.url),
);
const raw = JSON.parse(readFileSync(itemsPath, "utf8")) as {
  entities: ItemRow[];
};
const items: ItemRow[] = raw.entities ?? [];

function compositeKey(it: ItemRow): string {
  return `${String(it.name).toLowerCase()}|${String(it.source).toLowerCase()}`;
}

describe("items.json: structural invariants", () => {
  it("loads with a non-empty entities array", () => {
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
  });

  it("every entity has a string name and a string source", () => {
    // Item.source is typed as SourceId (string) in entities.ts; the original
    // bug was 77 magicvariant rows shipping with `source: undefined`.
    const bad = items
      .map((it, i) => ({ i, it }))
      .filter(
        ({ it }) =>
          typeof it.name !== "string" || typeof it.source !== "string",
      );
    expect(bad, `first bad rows: ${JSON.stringify(bad.slice(0, 3))}`).toEqual([]);
  });

  it("has zero duplicate name|source composite keys", () => {
    // THE regression assertion: this must stay at zero. If it grows, the
    // ItemsPage list will render duplicated rows with colliding React keys.
    const seen = new Map<string, number>();
    for (const it of items) {
      if (typeof it.name !== "string" || typeof it.source !== "string") continue;
      const k = compositeKey(it);
      seen.set(k, (seen.get(k) ?? 0) + 1);
    }
    const dupes = [...seen.entries()].filter(([, c]) => c > 1);
    expect(
      dupes,
      `duplicate keys: ${JSON.stringify(dupes.slice(0, 5))}`,
    ).toEqual([]);
  });

  it("historically-duplicated names appear at most once", () => {
    // These 9 names previously collapsed onto `|undefined` keys (14x, 14x, 7x,
    // ...). Pinning them so a future regression on the same names is obvious.
    const watched = [
      "Lycan Weapon",
      "Tormach's Blessed Weapon",
      "Paralyzing Bolt",
      "Shadowsteel Blades",
      "Hunter's Armor",
      "Blight Armor",
      "Chapped Brute Armor",
      "Gnoll Ammunition",
      "Hraptnon Weapon",
    ];
    for (const name of watched) {
      const matches = items.filter(
        (it) => typeof it.name === "string" && it.name === name,
      );
      // Either dropped entirely (0) or present exactly once with a real source.
      expect(
        matches.length,
        `"${name}" appeared ${matches.length} times`,
      ).toBeLessThanOrEqual(1);
    }
  });
});

describe("items.json: search repro invariants", () => {
  // Mirrors ItemsPage.tsx's predicate `it.name.toLowerCase().includes(q)`.
  // Guards against a data-level change that would make "glove" stop matching.
  it("searching 'glove' yields the expected glove items", () => {
    const q = "glove";
    const matches = items.filter(
      (it) => typeof it.name === "string" && it.name.toLowerCase().includes(q),
    );
    const names = matches.map((m) => m.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "Gloves of Missile Snaring",
        "Gloves of Swimming and Climbing",
        "Gloves of Thievery",
        "Embroidered glove set with jewel chips",
      ]),
    );
    // No duplicates in the match set.
    expect(new Set(names).size).toBe(names.length);
  });
});
