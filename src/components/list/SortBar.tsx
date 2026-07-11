/** Sort-key toggle row. `labelFn` defaults to the key itself. */
export default function SortBar<T extends string>({
  keys,
  value,
  onChange,
  labelFn,
}: {
  keys: T[];
  value: T;
  onChange: (key: T) => void;
  labelFn?: (key: T) => string;
}) {
  return (
    <div className="mt-2 flex items-center gap-1 text-xs">
      <span className="text-fg-muted">Sort:</span>
      {keys.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onChange(k)}
          className={`rounded px-2 py-0.5 capitalize ${
            value === k
              ? "bg-accent-subtle text-accent"
              : "text-fg-muted hover:bg-bg-raised"
          }`}
        >
          {labelFn ? labelFn(k) : k}
        </button>
      ))}
    </div>
  );
}
