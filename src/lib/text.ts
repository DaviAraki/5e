/**
 * Small text utilities shared across formatters, stat blocks, and filters.
 * Previously copy-pasted 12 times across the codebase.
 */

/** Capitalize the first code point of `s`; leave the rest untouched. */
export function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** 1 → "1st", 2 → "2nd", 3 → "3rd", 4 → "4th", … */
export function ordinal(n: number): string {
  const abs = Math.abs(n);
  const lastDigit = abs % 10;
  const lastTwo = abs % 100;
  // 11–13 are the "teenth" exception (all use "th").
  if (lastTwo >= 11 && lastTwo <= 13) return `${n}th`;
  if (lastDigit === 1) return `${n}st`;
  if (lastDigit === 2) return `${n}nd`;
  if (lastDigit === 3) return `${n}rd`;
  return `${n}th`;
}
