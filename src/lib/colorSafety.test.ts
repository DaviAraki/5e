import { describe, expect, it } from "vitest";
import { isSafeColor } from "@/lib/colorSafety";

describe("isSafeColor", () => {
  const safe = [
    "#fff",
    "#ffffff",
    "#ffffffff", // 8-digit hex (with alpha)
    "rgb(255, 0, 0)",
    "rgba(255, 0, 0, 0.5)",
    "rgb(50% 50% 50%)",
    "hsl(120, 100%, 50%)",
    "hsla(120, 100%, 50%, 0.25)",
    "red",
    "darkviolet",
    "Transparent",
  ];
  for (const v of safe) it(`accepts ${v}`, () => expect(isSafeColor(v)).toBe(true));

  const unsafe = [
    "",
    "   ",
    "red; body { background: url(javascript:1) }", // CSS injection
    "url(evil.png)",
    "var(--xss)",
    "expression(alert(1))",
    "#ff", // too short
    "##fff",
    "rgb(alert(1))",
    "rgb(255, 0, 0); color: red",
    "rgb(255);}",
    "<script>",
    "a".repeat(65), // too long
  ];
  for (const v of unsafe) it(`rejects ${JSON.stringify(v)}`, () => expect(isSafeColor(v)).toBe(false));
});
