import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Shared master-detail selection state, backed by a URL search param (`?s=...`).
 *
 * The selected item's key lives in the address bar so it is shareable:
 * copying and reopening the URL restores the same selection. Each page renders
 * on its own route, so one generic `s` param is unambiguous across pages.
 *
 * - `selectedKey` — the currently selected item's key (or null), read from `s`.
 * - `isMobileDetail` — whether the detail pane is shown full-width on mobile.
 * - `select(key)` — writes the key to the URL (replace, not push) and flips
 *   isMobileDetail to true.
 * - `setSelectedKey` — set null to clear the param; a string to replace it.
 * - Auto-resets isMobileDetail to false when selectedKey clears.
 */
const SEL_PARAM = "s";

export function useMasterDetail() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedKey = searchParams.get(SEL_PARAM);

  // Local UI state only — whether the mobile detail overlay is shown.
  // Initialized true when arriving via a deep link so the detail pane shows.
  const [isMobileDetail, setIsMobileDetail] = useState<boolean>(
    () => selectedKey != null,
  );

  const setSelectedKey = useCallback(
    (key: string | null) => {
      setSearchParams(
        (prev) => {
          if (key == null) prev.delete(SEL_PARAM);
          else prev.set(SEL_PARAM, key);
          return prev;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const select = useCallback(
    (key: string) => {
      setSelectedKey(key);
      setIsMobileDetail(true);
    },
    [setSelectedKey],
  );

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
