import { useRef, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

/**
 * Virtualized vertical list for the large bestiary/spell datasets.
 *
 * Why: BestiaryPage and SpellsPage render every matching row as DOM, so "show
 * all" with thousands of monsters dominates INP and mount cost. Only the rows
 * visible in the viewport (plus a small overscan) are rendered; the rest are
 * replaced by a spacer div sized to keep the scrollbar correct.
 *
 * Caller supplies the scroll container (it must be the `overflow-y-auto`
 * parent) and a render-prop that maps an item to its row. The row's own key is
 * preserved by the caller's `renderItem` — pass a stable key via the returned
 * element so React reconciliation stays correct.
 *
 * The row height is fixed (default 38px). Both Bestiary and Spells use the
 * same row padding, so this is the right default; pass `estimateSize` if a
 * page deviates.
 */
export interface VirtualizedListProps<T> {
  items: T[];
  /** Render a single row. Receives the item only — keys/height handled here. */
  renderItem: (item: T, index: number) => ReactNode;
  /** Approximate row height in px. Default 38 matches the list pages' padding. */
  estimateSize?: number;
  /** Visible items above/below the viewport to prerender. Default 8. */
  overscan?: number;
  /** Optional className for the inner spacer; rarely needed. */
  className?: string;
}

export default function VirtualizedList<T>({
  items,
  renderItem,
  estimateSize = 38,
  overscan = 8,
  className,
}: VirtualizedListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  return (
    <div
      ref={parentRef}
      // `flex-1 min-h-0` makes this the scroll parent inside the MasterDetailLayout
      // aside (which is `flex flex-col`). Override via className if embedded elsewhere.
      className={`flex-1 min-h-0 overflow-y-auto ${className ?? ""}`}
      // contain: layout/paint keeps the virtualized region off the main layout
      // pass, which matters when this list mounts during a deep-link navigation.
      style={{ contain: "strict" }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {renderItem(items[virtualRow.index]!, virtualRow.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
