/**
 * URL safety validation for data-derived URLs.
 *
 * The 5e data DSL ({@link display|url}, image hrefs, etc.) can carry arbitrary
 * strings into `href`/`src` attributes. Without validation, a poisoned data
 * entry could inject a `javascript:` or `data:text/html` URL that executes on
 * click. This module is the single chokepoint that gates which schemes reach
 * the DOM.
 *
 * Allowed: http, https, mailto, tel, hash fragments, and any relative URL
 * (protocol-relative `//host`, root-absolute `/path`, `./`, `../`, `path`).
 * Rejected: everything else, including `javascript:`, `data:`, `vbscript:`,
 * `file:`, and unknown schemes.
 */

/** Schemes that may safely appear in `href`/`src` attributes. */
const SAFE_SCHEMES = new Set(["http:", "https:", "mailto:", "tel:"]);

/**
 * Return true iff `raw` is safe to put into an `href`/`src` attribute.
 *
 * Rejects anything that throws under the URL parser, anything with an
 * explicit scheme outside the allowlist, and edge cases like `java\nscript:`
 * (control characters used to smuggle a scheme past naive regex checks).
 */
export function isSafeUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (trimmed === "") return false;

  // Reject embedded control characters / whitespace used to disguise a scheme.
  // e.g. "java\nscript:alert(1)" or "java\tscript:...".
  if (/[\u0000-\u0020]/.test(trimmed)) return false;

  // Hash fragment or relative URL (no scheme) — always safe.
  if (
    trimmed.startsWith("#") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("./") ||
    trimmed.startsWith("../") ||
    !/:\/?/.test(trimmed.split("?")[0] ?? "")
  ) {
    // Still must not start with a scheme we don't recognize that collides with
    // the "no colon before slash/query" heuristic. Detect an explicit scheme
    // via the spec's `scheme:` production and reject if it's not allowlisted.
    const schemeMatch = /^([a-z][a-z0-9+.\-]*):/i.exec(trimmed);
    if (schemeMatch) {
      const scheme = `${schemeMatch[1]}:`.toLowerCase();
      return SAFE_SCHEMES.has(scheme);
    }
    return true;
  }

  // Has a `:` and looks schemey — parse with a base so relative URLs resolve.
  try {
    const url = new URL(trimmed, "https://example.invalid/");
    // If the parser assigned our placeholder origin, the input was relative.
    if (url.origin === "https://example.invalid") return true;
    return SAFE_SCHEMES.has(url.protocol.toLowerCase());
  } catch {
    return false;
  }
}
