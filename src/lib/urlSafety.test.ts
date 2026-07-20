import { describe, expect, it } from "vitest";
import { isSafeUrl } from "@/lib/urlSafety";

/**
 * isSafeUrl is the chokepoint that prevents data-derived `javascript:` /
 * `data:` URLs from reaching `href`/`src` attributes. The truthy/falsy matrix
 * here is the contract every render sink ({@link}, image href, etc.) relies on.
 */
describe("isSafeUrl", () => {
  describe("accepts safe URLs", () => {
    const safe = [
      "https://example.com",
      "http://example.com/path?q=1",
      "https://example.com/a#frag",
      "mailto:user@example.com",
      "mailto:user@example.com?subject=Hi",
      "tel:+15551234567",
      "/relative/path",
      "/5e/data/resolved/spells.json",
      "./local",
      "../parent",
      "path/to/file",
      "#fragment-only",
      "//cdn.example.com/lib.js", // protocol-relative
      "HTTPS://UPPER.CASE/X", // case-insensitive scheme
    ];
    for (const url of safe) {
      it(`accepts ${url}`, () => {
        expect(isSafeUrl(url)).toBe(true);
      });
    }
  });

  describe("rejects unsafe URLs", () => {
    const unsafe = [
      "javascript:alert(1)",
      "JavaScript:alert(1)", // case-insensitive
      "java\tscript:alert(1)", // tab smuggling
      "java\nscript:alert(1)", // newline smuggling
      "java\u0000script:alert(1)", // NUL smuggling
      "data:text/html,<script>alert(1)</script>",
      "data:image/svg+xml,<svg/onload=alert(1)>",
      "vbscript:msgbox(1)",
      "file:///etc/passwd",
      "blob:http://example.com/abc",
      "ftp://example.com/file",
      "  javascript:alert(1)  ", // leading/trailing whitespace
      // Note: "javascript%3Aalert(1)" is NOT exploitable — browsers do not
      // URL-decode the scheme, so the literal `%3A` is treated as a relative
      // path, not a javascript: URL.
      "",
      "   ",
    ];
    for (const url of unsafe) {
      it(`rejects ${JSON.stringify(url)}`, () => {
        expect(isSafeUrl(url)).toBe(false);
      });
    }
  });

  it("does not throw on inputs that crash naive URL parsing", () => {
    // These would throw inside `new URL()` if not guarded.
    expect(() => isSafeUrl("://no-scheme")).not.toThrow();
    expect(() => isSafeUrl("http://")).not.toThrow();
  });
});
