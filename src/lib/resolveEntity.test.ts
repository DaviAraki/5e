// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { resolveEntity } from "@/lib/resolveEntity";
import type { ResolvedData, Spell, Monster, Feat } from "@/types/entities";

/**
 * resolveEntity is the seam between the React Query cache and the preview
 * modal / EntityContent renderer. Generic over the return type so callers get
 * a typed value; previously returned `unknown | null` which forced every
 * caller to cast. These tests cover the typed-return contract, the
 * case-insensitive name|source lookup, and the not-found / unknown-type paths.
 *
 * Fixtures are cast loosely (`as`) because the goal is to exercise the
 * resolver's lookup logic, not to validate the Spell / Monster type shapes
 * (those are tested via the data-integration suite against the real JSON).
 */
function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity, staleTime: Infinity } },
  });
}

const spells = {
  generatedAt: 0,
  source: "XPHB",
  entities: [
    { name: "Fireball", source: "XPHB", level: 3 },
    { name: "Shield", source: "XPHB", level: 1 },
  ],
} as unknown as ResolvedData<Spell>;

const monsters = {
  generatedAt: 0,
  source: "XMM",
  entities: [{ name: "Aboleth", source: "XMM", cr: "10" }],
} as unknown as ResolvedData<Monster>;

describe("resolveEntity", () => {
  it("resolves a spell by exact name|source (case-insensitive)", () => {
    const qc = makeClient();
    qc.setQueryData(["spells"], spells);
    const spell = resolveEntity<Spell>(qc, "spell", "fireball", "xphb");
    expect(spell?.name).toBe("Fireball");
    expect(spell?.level).toBe(3);
  });

  it("resolves a creature via the monsters cache", () => {
    const qc = makeClient();
    qc.setQueryData(["monsters"], monsters);
    const mon = resolveEntity<Monster>(qc, "creature", "Aboleth", "XMM");
    expect(mon?.name).toBe("Aboleth");
    expect(mon?.cr).toBe("10");
  });

  it("returns null when the entity is not in the cache", () => {
    const qc = makeClient();
    qc.setQueryData(["spells"], spells);
    expect(resolveEntity<Spell>(qc, "spell", "Wish", "XPHB")).toBeNull();
  });

  it("returns null when the cache is empty", () => {
    const qc = makeClient();
    expect(resolveEntity<Spell>(qc, "spell", "Fireball", "XPHB")).toBeNull();
  });

  it("returns null for an entity type the resolver does not handle", () => {
    const qc = makeClient();
    // Feat is in EntityType but not in the resolver's switch.
    expect(resolveEntity<Feat>(qc, "feat", "Grappler", "XPHB")).toBeNull();
  });

  it("disambiguates same-name entities from different sources", () => {
    const qc = makeClient();
    const dupe = {
      generatedAt: 0,
      source: "XPHB",
      entities: [
        { name: "Bless", source: "XPHB", level: 1 },
        { name: "Bless", source: "GH:CG'24", level: 2 },
      ],
    } as unknown as ResolvedData<Spell>;
    qc.setQueryData(["spells"], dupe);
    expect(resolveEntity<Spell>(qc, "spell", "Bless", "XPHB")?.level).toBe(1);
    expect(resolveEntity<Spell>(qc, "spell", "Bless", "GH:CG'24")?.level).toBe(2);
  });
});
