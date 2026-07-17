import { beforeEach, describe, expect, it } from "vitest";
import type { Language } from "@/types/entities";
import {
  deriveSourceOptions,
  languageMatchesFilters,
  useLanguageFilters,
} from "@/state/languageFilters";

/**
 * Representative template test for the simple *Filters.ts stores (deity,
 * optionalFeature, transformation share this exact skeleton). Covers the
 * zustand store actions (cycle/clear/activeCount), deriveSourceOptions, and
 * the 2-dimension predicate with its null-guard.
 */

const LANG = (overrides: Partial<Language> = {}): Language =>
  ({ name: "Common", source: "XPHB", type: "standard", entries: [], ...overrides }) as Language;

function reset() {
  useLanguageFilters.setState({ type: { include: new Set(), exclude: new Set() }, source: { include: new Set(), exclude: new Set() } });
}

describe("languageMatchesFilters predicate", () => {
  beforeEach(reset);

  it("returns true with no filters active", () => {
    expect(languageMatchesFilters(LANG(), useLanguageFilters.getState())).toBe(true);
  });

  it("filters by source (include / exclude)", () => {
    const f = useLanguageFilters.getState();
    f.cycle("source", "XPHB");
    expect(languageMatchesFilters(LANG({ source: "XPHB" }), useLanguageFilters.getState())).toBe(true);
    expect(languageMatchesFilters(LANG({ source: "XDMG" }), useLanguageFilters.getState())).toBe(false);
    f.cycle("source", "XPHB"); // -> exclude
    expect(languageMatchesFilters(LANG({ source: "XPHB" }), useLanguageFilters.getState())).toBe(false);
  });

  it("filters by type", () => {
    const f = useLanguageFilters.getState();
    f.cycle("type", "exotic");
    expect(languageMatchesFilters(LANG({ type: "exotic" }), useLanguageFilters.getState())).toBe(true);
    expect(languageMatchesFilters(LANG({ type: "standard" }), useLanguageFilters.getState())).toBe(false);
  });

  it("treats an undefined type as no-match for any concrete include", () => {
    const f = useLanguageFilters.getState();
    f.cycle("type", "exotic");
    const noType = LANG();
    delete (noType as Partial<Language>).type;
    expect(languageMatchesFilters(noType, useLanguageFilters.getState())).toBe(false);
  });
});

describe("store actions", () => {
  beforeEach(reset);

  it("activeCount grows with each cycled value", () => {
    const f = useLanguageFilters.getState();
    expect(f.activeCount()).toBe(0);
    f.cycle("source", "XPHB");
    expect(useLanguageFilters.getState().activeCount()).toBe(1);
    useLanguageFilters.getState().cycle("type", "exotic");
    expect(useLanguageFilters.getState().activeCount()).toBe(2);
  });

  it("clearDimension empties one dimension only", () => {
    const f = useLanguageFilters.getState();
    f.cycle("source", "XPHB");
    f.cycle("type", "exotic");
    useLanguageFilters.getState().clearDimension("source");
    const s = useLanguageFilters.getState();
    expect(s.source.include.size + s.source.exclude.size).toBe(0);
    expect(s.type.include.size + s.type.exclude.size).toBe(1);
  });

  it("clearAll empties every dimension", () => {
    const f = useLanguageFilters.getState();
    f.cycle("source", "XPHB");
    f.cycle("type", "exotic");
    useLanguageFilters.getState().clearAll();
    expect(useLanguageFilters.getState().activeCount()).toBe(0);
  });
});

describe("deriveSourceOptions", () => {
  it("counts sources desc and falls back to the raw code for unknown", () => {
    const langs = [
      LANG({ source: "XPHB" }),
      LANG({ source: "XPHB" }),
      LANG({ source: "ZZZ" }),
    ];
    const out = deriveSourceOptions(langs);
    expect(out[0]!.value).toBe("XPHB");
    expect(out[0]!.label).toBe("Player's Handbook");
    expect(out[1]!.value).toBe("ZZZ");
    expect(out[1]!.label).toBe("ZZZ"); // unknown -> raw
  });
});
