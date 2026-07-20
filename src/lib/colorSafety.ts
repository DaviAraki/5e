/**
 * Validation for CSS color values coming from 5e data (e.g. `{@color text|#f00}`).
 *
 * React passes `style={{ color }}` strings straight to the DOM; arbitrary
 * values here can do surprising things (legacy IE `expression(...)`, CSS
 * injection via `url()` exfiltration, broken layout). Restrict to the shapes
 * we expect to see: hex, rgb()/rgba(), hsl()/hsla(), and bare CSS color
 * keywords. No `url()`, no `var()`, no expressions.
 */

const HEX_RE = /^#[0-9a-fA-F]{3,8}$/;
const RGB_RE = /^rgba?\(\s*[\d.%\s,/-]+\s*\)$/i;
const HSL_RE = /^hsla?\(\s*[\d.%\s,/-]+\s*\)$/i;
const NAMED_RE = /^[a-zA-Z]+$/;

/**
 * Return true iff `value` is a safe CSS color string. Rejects anything with
 * parentheses other than the rgb()/rgba()/hsl()/hsla() functions, anything
 * with a semicolon or brace, and anything that looks like a function call
 * other than the four color functions above.
 */
export function isSafeColor(value: string): boolean {
  const v = value.trim();
  if (v === "") return false;
  if (v.length > 64) return false;

  // Reject obvious injection vectors outright.
  if (/[;{}<>\\]/.test(v)) return false;
  if (/url\(/i.test(v)) return false;
  if (/var\(/i.test(v)) return false;
  if (/expression\(/i.test(v)) return false;

  return HEX_RE.test(v) || RGB_RE.test(v) || HSL_RE.test(v) || NAMED_RE.test(v);
}
