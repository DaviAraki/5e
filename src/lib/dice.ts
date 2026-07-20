/**
 * Dice expression evaluation — pure, no React.
 *
 * Extracted from InlineText.tsx so the math is unit-testable without rendering.
 * Supports dice terms (NdM, dM), flat modifiers (+N, -N), and multiple groups
 * in a single expression (e.g. "2d6+1d8+4"). Sign on the leading term is
 * optional; subsequent terms require an explicit + or -.
 */

/**
 * Roll a dice expression like "8d6", "1d20+5", "2d8+4".
 * Returns the integer total. Each NdM term rolls N independent dice in
 * [1, M] and sums them; flat modifiers add or subtract directly.
 *
 * Non-deterministic (Math.random). Callers that need determinism should inject
 * a seeded RNG — kept simple here because dice rolls are user-initiated.
 */
export function rollDice(expr: string): number {
  // Normalise: lowercase, remove spaces. "D8" → "d8", "8d6 + 4" → "8d6+4"
  const clean = expr.toLowerCase().replace(/\s/g, "");
  // Two alternations: dice (NdM or dM) and flat modifiers (N).
  const termRe = /([+-]?)(\d*)d(\d+)|([+-]?)(\d+)/g;
  let total = 0;
  let match: RegExpExecArray | null;
  while ((match = termRe.exec(clean)) !== null) {
    if (match[3] !== undefined) {
      // Dice term: groups 1=sign, 2=count (may be ""), 3=faces
      const sign = match[1] === "-" ? -1 : 1;
      const count = parseInt(match[2] || "1", 10);
      const faces = parseInt(match[3], 10);
      if (!faces) continue;
      let sub = 0;
      for (let i = 0; i < count; i++) {
        sub += 1 + Math.floor(Math.random() * faces);
      }
      total += sign * sub;
    } else if (match[5] !== undefined) {
      // Flat modifier: groups 4=sign, 5=value
      const sign = match[4] === "-" ? -1 : 1;
      total += sign * parseInt(match[5], 10);
    }
  }
  return total;
}
