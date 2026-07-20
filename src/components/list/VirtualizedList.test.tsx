// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import VirtualizedList from "@/components/list/VirtualizedList";

/**
 * Smoke test for VirtualizedList. jsdom doesn't do layout, so the tanstack
 * virtualizer reports zero viewport and mounts no items — we only assert the
 * public contract: the scroll container renders, and the inner total-size
 * spacer is present. Item-level rendering is exercised by the page-level
 * integration of Bestiary/Spells.
 */
describe("VirtualizedList", () => {
  it("renders the scroll container with a sized inner spacer", () => {
    const items = ["a", "b", "c", "d", "e"];
    const { container } = render(
      <div style={{ height: 200 }}>
        <VirtualizedList
          items={items}
          renderItem={(item) => <div key={item}>{item}</div>}
          estimateSize={40}
        />
      </div>,
    );
    const scrollRoot = container.querySelector('[style*="contain: strict"]');
    expect(scrollRoot).not.toBeNull();
    // Inner spacer (height = total size) is always rendered, even with 0 items
    // visible, because it sizes the scrollbar track.
    const spacer = container.querySelector('[style*="position: relative"]');
    expect(spacer).not.toBeNull();
  });

  it("renders an empty list without throwing", () => {
    const { container } = render(
      <div style={{ height: 100 }}>
        <VirtualizedList items={[]} renderItem={() => null} />
      </div>,
    );
    expect(container.querySelector('[style*="contain: strict"]')).not.toBeNull();
  });
});
