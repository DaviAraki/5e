import { useCallback, useEffect, useState } from "react";

/**
 * Shared master-detail selection state.
 *
 * Encapsulates the pattern duplicated across all 8 list pages:
 * - `selectedKey` — the currently selected item's key (or null).
 * - `isMobileDetail` — whether the detail pane is shown full-width on mobile.
 * - `select(key)` — sets selectedKey and flips isMobileDetail to true.
 * - Auto-resets isMobileDetail to false when selectedKey clears.
 */
export function useMasterDetail() {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [isMobileDetail, setIsMobileDetail] = useState(false);

  const select = useCallback((key: string) => {
    setSelectedKey(key);
    setIsMobileDetail(true);
  }, []);

  useEffect(() => {
    if (!selectedKey) setIsMobileDetail(false);
  }, [selectedKey]);

  return {
    selectedKey,
    setSelectedKey,
    isMobileDetail,
    setIsMobileDetail,
    select,
  };
}
