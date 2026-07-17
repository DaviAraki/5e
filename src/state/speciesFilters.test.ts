import { describe, expect, it } from "vitest";
import type { Species } from "@/types/entities";
import {
  deriveSourceOptions,
  speciesMatchesFilters,
  useSpeciesFilters,
} from "@/state/speciesFilters";

/**
 * Spot tests for speciesMatchesFilters, focused on the nullish-coercion
 * branches: size/speed/darkvision/resist all default when absent.
 *   - size    : `s.size ?? []`
 *   - speed   : `String(s.speed ?? "30")`
 *   - darkvision: `s.darkvision != null ? String(...) : "0"`
 *   - resist  : `s.resist ?? []`
 */

type SpeciesFilterState = ReturnType<typeof useSpeciesFilters.getState>;

const SPECIES = (overrides: Partial<Species> = {}): Species =>
  ({ name: "X", source: "XPHB", entries: [], ...overrides }) as Species;

function withTri(dim: "size" | "speed" | "darkvision" | "resist" | "source", value: string): SpeciesFilterState {
  const f = useSpeciesFilters.getState();
  f.clearAll();
  return { ...f, [dim]: { include: new Set([value]), exclude: new Set<string>() } };
}

describe("speciesMatchesFilters — passthrough & source", () => {
  it("returns true with no filters active", () => {
    const f = useSpeciesFilters.getState();
    f.clearAll();
    expect(speciesMatchesFilters(SPECIES(), f)).toBe(true);
  });

  it("filters by source", () => {
    expect(speciesMatchesFilters(SPECIES({ source: "XPHB" }), withTri("source", "XPHB"))).toBe(true);
    expect(speciesMatchesFilters(SPECIES({ source: "XDMG" }), withTri("source", "XPHB"))).toBe(false);
  });
});

describe("speciesMatchesFilters — nullish coercion branches", () => {
  it("size defaults to [] (no match for a concrete include when undefined)", () => {
    const noSize = SPECIES();
    delete (noSize as Partial<Species>).size;
    expect(speciesMatchesFilters(noSize, withTri("size", "M"))).toBe(false);
    expect(speciesMatchesFilters(SPECIES({ size: ["M"] }), withTri("size", "M"))).toBe(true);
  });

  it("speed defaults to '30' when undefined", () => {
    const noSpeed = SPECIES();
    delete (noSpeed as Partial<Species>).speed;
    expect(speciesMatchesFilters(noSpeed, withTri("speed", "30"))).toBe(true);
    expect(speciesMatchesFilters(SPECIES({ speed: 25 }), withTri("speed", "25"))).toBe(true);
    expect(speciesMatchesFilters(SPECIES({ speed: 25 }), withTri("speed", "30"))).toBe(false);
  });

  it("darkvision defaults to '0' when null/undefined; stringified when present", () => {
    const noDv = SPECIES();
    delete (noDv as Partial<Species>).darkvision;
    expect(speciesMatchesFilters(noDv, withTri("darkvision", "0"))).toBe(true);
    expect(speciesMatchesFilters(noDv, withTri("darkvision", "60"))).toBe(false);
    expect(speciesMatchesFilters(SPECIES({ darkvision: 60 }), withTri("darkvision", "60"))).toBe(true);
  });

  it("resist defaults to [] (no match when undefined)", () => {
    const noResist = SPECIES();
    delete (noResist as Partial<Species>).resist;
    expect(speciesMatchesFilters(noResist, withTri("resist", "fire"))).toBe(false);
    expect(speciesMatchesFilters(SPECIES({ resist: ["fire"] }), withTri("resist", "fire"))).toBe(true);
  });
});

describe("deriveSourceOptions", () => {
  it("counts sources desc", () => {
    const out = deriveSourceOptions([SPECIES({ source: "XPHB" }), SPECIES({ source: "XPHB" }), SPECIES({ source: "XDMG" })]);
    expect(out[0]!.value).toBe("XPHB");
    expect(out[1]!.value).toBe("XDMG");
  });
});
