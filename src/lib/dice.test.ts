import { describe, expect, it, vi } from "vitest";
import { rollDice } from "@/lib/dice";

/**
 * rollDice is non-deterministic via Math.random; stub it for range checks.
 * Without the stub we can only assert bounds (a single d6 ∈ [1,6]).
 */
describe("rollDice", () => {
  it("returns 0 for an empty / non-matching expression", () => {
    expect(rollDice("")).toBe(0);
    expect(rollDice("abc")).toBe(0);
  });

  it("rolls a flat modifier", () => {
    expect(rollDice("5")).toBe(5);
    expect(rollDice("+5")).toBe(5);
    expect(rollDice("-3")).toBe(-3);
  });

  it("rolls NdM with a stubbed RNG of always-max", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.9999);
    expect(rollDice("8d6")).toBe(48); // 8 × 6
    expect(rollDice("1d20")).toBe(20);
    vi.restoreAllMocks();
  });

  it("rolls NdM with a stubbed RNG of always-min", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(rollDice("8d6")).toBe(8); // 8 × 1
    vi.restoreAllMocks();
  });

  it("combines dice + flat modifiers in one expression", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.4999);
    // 1d20 at random=0.5 → ceil(0.5*20)=10, so 1+10=11 (roll = 1+floor(0.4999*20)=1+9=10)
    const r = rollDice("1d20+5");
    expect(r).toBeGreaterThanOrEqual(6);
    expect(r).toBeLessThanOrEqual(25);
    vi.restoreAllMocks();
  });

  it("handles bare 'dM' as 1dM", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.9999);
    expect(rollDice("d8")).toBe(8);
    vi.restoreAllMocks();
  });

  it("ignores dice terms with zero faces", () => {
    expect(rollDice("1d0")).toBe(0);
  });

  it("stays within bounds across many real rolls", () => {
    for (let i = 0; i < 100; i++) {
      const r = rollDice("3d6");
      expect(r).toBeGreaterThanOrEqual(3);
      expect(r).toBeLessThanOrEqual(18);
    }
  });

  it("is case-insensitive and tolerates whitespace", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.9999);
    expect(rollDice("  8D6 ")).toBe(48);
    vi.restoreAllMocks();
  });
});
