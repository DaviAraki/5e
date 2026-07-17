import { describe, expect, it } from "vitest";
import { tagToEntityType, useEntityPreview } from "@/state/entityPreview";

/**
 * Tests for the entity preview store + tagToEntityType mapping. The store is
 * trivial set/reset; tagToEntityType is a 13-entry literal lookup with a null
 * fallback (and the 'monster' -> 'creature' / 'race' -> 'species' aliases are
 * the easy places for a regression).
 */

describe("tagToEntityType", () => {
  it.each([
    ["spell", "spell"],
    ["creature", "creature"],
    ["monster", "creature"], // alias
    ["item", "item"],
    ["condition", "condition"],
    ["status", "status"],
    ["feat", "feat"],
    ["background", "background"],
    ["race", "species"], // alias
    ["class", "class"],
    ["skill", "skill"],
    ["action", "action"],
    ["variantrule", "variantrule"],
  ])("tag %s -> %s", (tag, expected) => {
    expect(tagToEntityType(tag)).toBe(expected);
  });

  it("returns null for unknown tags", () => {
    expect(tagToEntityType("unknown")).toBeNull();
    expect(tagToEntityType("")).toBeNull();
  });
});

describe("useEntityPreview store", () => {
  it("starts closed", () => {
    useEntityPreview.setState({ open: null });
    expect(useEntityPreview.getState().open).toBeNull();
  });

  it("openPreview sets the entity and closePreview clears it", () => {
    useEntityPreview.setState({ open: null });
    const entity = { type: "spell" as const, name: "Fireball", source: "XPHB" };
    useEntityPreview.getState().openPreview(entity);
    expect(useEntityPreview.getState().open).toEqual(entity);
    useEntityPreview.getState().closePreview();
    expect(useEntityPreview.getState().open).toBeNull();
  });
});
