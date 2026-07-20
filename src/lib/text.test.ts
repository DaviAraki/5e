import { describe, expect, it } from "vitest";
import { capitalize, ordinal } from "@/lib/text";

describe("capitalize", () => {
  it("capitalizes the first character", () => {
    expect(capitalize("hello")).toBe("Hello");
    expect(capitalize("a")).toBe("A");
  });
  it("leaves the rest of the string untouched", () => {
    expect(capitalize("helloWorld")).toBe("HelloWorld");
    expect(capitalize("hELLO")).toBe("HELLO");
  });
  it("returns empty string unchanged", () => {
    expect(capitalize("")).toBe("");
  });
  it("capitalizes a non-ASCII first code point", () => {
    expect(capitalize("étage")).toBe("Étage");
  });
});

describe("ordinal", () => {
  it("uses st/nd/rd for 1/2/3", () => {
    expect(ordinal(1)).toBe("1st");
    expect(ordinal(2)).toBe("2nd");
    expect(ordinal(3)).toBe("3rd");
  });
  it("uses th for 4–20", () => {
    for (let n = 4; n <= 20; n++) {
      expect(ordinal(n)).toBe(`${n}th`);
    }
  });
  it("restarts st/nd/rd at 21/22/23", () => {
    expect(ordinal(21)).toBe("21st");
    expect(ordinal(22)).toBe("22nd");
    expect(ordinal(23)).toBe("23rd");
  });
  it("uses th for the 11–13 exception", () => {
    expect(ordinal(11)).toBe("11th");
    expect(ordinal(12)).toBe("12th");
    expect(ordinal(13)).toBe("13th");
    expect(ordinal(111)).toBe("111th");
    expect(ordinal(112)).toBe("112th");
  });
  it("preserves the sign of negative input", () => {
    expect(ordinal(-1)).toBe("-1st");
    expect(ordinal(-3)).toBe("-3rd");
  });
});
