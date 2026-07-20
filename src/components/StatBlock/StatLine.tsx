/**
 * Shared stat-block line primitives.
 *
 * The 17 StatBlock components each redefined a local `StatLine` with identical
 * markup. Centralizing removes ~7 copies and guarantees the visual treatment
 * stays consistent across entity types.
 *
 * `StatLine`: the standard "label value" line (Armor Class, Hit Points, …).
 * `StatRow`:  the dl/dt/dd variant used by SpellStatBlock.
 */

export function StatLine({ label, value }: { label: string; value: string }) {
  // Skip empty rows — most callers pass conditionally-derived strings (e.g.
  // `sensesToFull(...)` may return "" when the field is absent). The single
  // caller that didn't previously guard (MonsterStatBlock) was relying on its
  // callers always passing non-empty values; this is a safe no-op for it.
  if (!value) return null;
  return (
    <p>
      <span className="font-bold">{label}</span> <span className="text-fg">{value}</span>
    </p>
  );
}

export function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="font-bold">{label}</dt>
      <dd className="text-fg">{value}</dd>
    </div>
  );
}
