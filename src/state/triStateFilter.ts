/**
 * Tri-state filter primitives shared across every category's filter store.
 *
 * Each filter dimension is a `TriState`: a value is neutral (default), in the
 * include set (must match), or in the exclude set (must NOT match). Clicking a
 * pill cycles neutral → include → exclude → neutral.
 *
 * Matching semantics:
 * - include: OR — the entity passes if ANY of its candidate values is included.
 * - exclude: OR-reject — the entity fails if ANY of its candidate values is
 *   excluded.
 * - both active: must pass include AND must not trip exclude.
 */

export interface TriState {
  include: Set<string>;
  exclude: Set<string>;
}

export function emptyTri(): TriState {
  return { include: new Set(), exclude: new Set() };
}

/** True when neither set has members. */
export function triIsEmpty(t: TriState): boolean {
  return t.include.size === 0 && t.exclude.size === 0;
}

/** Total number of active (non-neutral) values in the dimension. */
export function triSize(t: TriState): number {
  return t.include.size + t.exclude.size;
}

/**
 * Cycle a single value through neutral → include → exclude → neutral.
 * Returns a NEW TriState (immutably), leaving the original untouched.
 */
export function triCycle(t: TriState, value: string): TriState {
  const include = new Set(t.include);
  const exclude = new Set(t.exclude);
  if (include.has(value)) {
    include.delete(value);
    exclude.add(value);
  } else if (exclude.has(value)) {
    exclude.delete(value);
  } else {
    include.add(value);
  }
  return { include, exclude };
}

/**
 * Test whether an entity's candidate values pass a tri-state dimension.
 *
 * @param t        the dimension's include/exclude state
 * @param values   the entity's candidate values for this dimension
 * @returns true if the entity passes (or the dimension is inactive)
 */
export function triMatch(t: TriState, values: Iterable<string>): boolean {
  if (triIsEmpty(t)) return true;
  for (const v of values) {
    if (t.exclude.has(v)) return false;
  }
  if (t.include.size > 0) {
    for (const v of values) {
      if (t.include.has(v)) return true;
    }
    return false;
  }
  return true;
}
