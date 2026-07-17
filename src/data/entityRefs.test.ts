import { describe, expect, it } from "vitest";
import { dedupeByRef, indexByRef, makeRef, parseRef, refKey } from "@/data/entityRefs";

/**
 * Regression tests for the duplicate-items bug.
 *
 * Background: vendor magicvariant templates in items.json were shipped with
 * `source: undefined`, collapsing into a few colliding `name|source` composite
 * keys (e.g. "Lycan Weapon|undefined" appeared 14 times). `dedupeByRef` is the
 * runtime guard in `useItems` that prevents dirty data from producing
 * duplicated rows and broken React keys.
 */
describe("dedupeByRef", () => {
  it("returns an empty array for empty input", () => {
    expect(dedupeByRef([])).toEqual([]);
  });

  it("passes through valid, unique entities unchanged", () => {
    const input = [
      { name: "Fireball", source: "XPHB" },
      { name: "Gloves of Thievery", source: "XDMG" },
    ];
    expect(dedupeByRef(input)).toEqual(input);
  });

  it("drops entities with a non-string name", () => {
    const input = [
      { name: "Valid", source: "XPHB" },
      { name: ["A", "B"], source: "XPHB" },
      { name: null, source: "XPHB" },
      { name: undefined, source: "XPHB" },
    ];
    expect(dedupeByRef(input)).toEqual([{ name: "Valid", source: "XPHB" }]);
  });

  it("drops entities with a non-string/undefined source", () => {
    // This is the exact shape of the bug: 77 magicvariant rows with
    // `source: undefined` collapsed into colliding keys.
    const input = [
      { name: "Lycan Weapon", source: undefined },
      { name: "Lycan Weapon", source: undefined },
      { name: "Gloves of Thievery", source: "XDMG" },
      { name: "No Source", source: null },
      { name: "Numbered", source: 123 },
    ];
    expect(dedupeByRef(input)).toEqual([
      { name: "Gloves of Thievery", source: "XDMG" },
    ]);
  });

  it("keeps the first occurrence of each composite key and preserves order", () => {
    const first = { name: "Longsword", source: "XPHB", page: 1 };
    const dup = { name: "Longsword", source: "XPHB", page: 99 };
    const input = [
      first,
      dup,
      { name: "Shield", source: "XPHB" },
      { name: "Longsword", source: "XDMG" }, // different source -> distinct key
    ];
    expect(dedupeByRef(input)).toEqual([
      first,
      { name: "Shield", source: "XPHB" },
      { name: "Longsword", source: "XDMG" },
    ]);
  });

  it("treats composite keys case-insensitively", () => {
    const input = [
      { name: "FIREBALL", source: "XPHB" },
      { name: "fireball", source: "xphb" },
      { name: "Fireball", source: "XPHB" },
    ];
    expect(dedupeByRef(input)).toHaveLength(1);
    expect(dedupeByRef(input)[0]).toEqual({ name: "FIREBALL", source: "XPHB" });
  });

  it("filters out non-object entries defensively", () => {
    // Cast: intentionally malformed (null/undefined/number/string) to exercise
    // the runtime guards. The type contract promises objects, but committed
    // JSON can violate it — the whole point of dedupeByRef is to tolerate that.
    const input = [
      null,
      undefined,
      42,
      "string",
      { name: "OK", source: "XPHB" },
    ] as unknown as { name: unknown; source: unknown }[];
    expect(dedupeByRef(input)).toEqual([{ name: "OK", source: "XPHB" }]);
  });

  it("reproduces the exact bug scenario: only the glove survives", () => {
    // Minified reproduction of the original failure: a glove (valid) mixed
    // with undefined-source duplicates (the pollution the user saw). After
    // dedupe, searching "glove" must yield exactly the one valid item.
    const dirty = [
      { name: "Gloves of Thievery", source: "XDMG" },
      { name: "Lycan Weapon", source: undefined },
      { name: "Lycan Weapon", source: undefined },
      { name: "Tormach's Blessed Weapon", source: undefined },
      { name: "Lycan Weapon", source: undefined },
      { name: "Paralyzing Bolt", source: undefined },
      { name: "Lycan Weapon", source: undefined },
    ];
    const clean = dedupeByRef(dirty);
    expect(clean).toEqual([{ name: "Gloves of Thievery", source: "XDMG" }]);
    const gloves = clean.filter((e) =>
      e.name.toLowerCase().includes("glove"),
    );
    expect(gloves).toHaveLength(1);
  });
});

/**
 * Smoke tests for the rest of entityRefs — these helpers feed the composite-key
 * convention used everywhere, so a regression here would silently break lookups.
 */
describe("entityRefs composite-key helpers", () => {
  it("makeRef joins name and source with '|'", () => {
    expect(makeRef("Fireball", "XPHB")).toBe("Fireball|XPHB");
  });

  it("refKey lowercases for case-insensitive lookup", () => {
    expect(refKey("Fireball|XPHB")).toBe("fireball|xphb");
  });

  it("parseRef round-trips makeRef, defaulting source to ''", () => {
    expect(parseRef("Fireball|XPHB")).toEqual({ name: "Fireball", source: "XPHB" });
    expect(parseRef("Fireball")).toEqual({ name: "Fireball", source: "" });
  });

  it("indexByRef keys by lowercased composite and keeps last on collision", () => {
    const a = { name: "Fireball", source: "XPHB", page: 1 };
    const b = { name: "fireball", source: "xphb", page: 2 };
    const map = indexByRef([a, b]);
    expect(map.get("fireball|xphb")).toBe(b);
    expect(map.size).toBe(1);
  });
});
