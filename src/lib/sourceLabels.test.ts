import { describe, expect, it } from "vitest";
import {
  SOURCE_LABELS,
  sourceLabel,
  deriveSourceOptions,
  type FilterOption,
} from "@/lib/sourceLabels";

describe("sourceLabel", () => {
  it("returns the long-form label for a known code", () => {
    expect(sourceLabel("XPHB")).toBe("Player's Handbook");
    expect(sourceLabel("GrimHollowCG24")).toBe("Grim Hollow: Campaign Guide (2024)");
  });
  it("falls back to the raw code when unknown", () => {
    expect(sourceLabel("UNKNOWN")).toBe("UNKNOWN");
  });
});

describe("SOURCE_LABELS", () => {
  it("is the union of all per-store maps (no store has a code missing here)", () => {
    // Codes previously known to each store; all should resolve to a non-raw
    // label (i.e. they're in SOURCE_LABELS, not falling back).
    const known = ["XPHB", "XDMG", "XMM", "EFA", "RHW", "FRAiF", "FRHoF", "WttHC", "HotB", "LFL", "NF", "ABH", "GrimHollowCG24", "GrimHollowPG24", "GrimHollowMG24"];
    for (const code of known) {
      expect(SOURCE_LABELS[code], `expected ${code} in SOURCE_LABELS`).toBeDefined();
    }
  });
});

describe("deriveSourceOptions", () => {
  it("returns options sorted by frequency descending", () => {
    const entities = [
      { name: "a", source: "XPHB" },
      { name: "b", source: "XPHB" },
      { name: "c", source: "XMM" },
    ];
    const opts = deriveSourceOptions(entities);
    expect(opts[0]).toEqual({ value: "XPHB", label: "Player's Handbook" });
    expect(opts[1]).toEqual({ value: "XMM", label: "Monster Manual" });
  });

  it("returns one option per distinct source", () => {
    const entities = [
      { name: "a", source: "XPHB" },
      { name: "b", source: "XPHB" },
      { name: "c", source: "XMM" },
    ];
    const opts: FilterOption[] = deriveSourceOptions(entities);
    expect(opts).toHaveLength(2);
  });

  it("returns an empty array for empty input", () => {
    expect(deriveSourceOptions([])).toEqual([]);
  });

  it("uses the raw code as the label for unknown sources", () => {
    const opts = deriveSourceOptions([{ name: "x", source: "NEW_SOURCE" }]);
    expect(opts[0]?.label).toBe("NEW_SOURCE");
  });
});
