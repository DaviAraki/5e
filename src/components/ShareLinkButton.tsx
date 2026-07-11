import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Copies the current page URL (already reflecting the `?s=` selection param)
 * to the clipboard, so a recipient can open the same item on their device.
 *
 * Reads `window.location.href` at click time — selection is URL-backed by
 * `useMasterDetail`, so the href always points at the item currently shown.
 * Feedback is a transient "✓ Copied" label; no toast library (codebase has
 * none). Fails silently when the clipboard API is unavailable (non-secure
 * context), matching the pattern in SpellBookPage.
 */
export default function ShareLinkButton() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API can be unavailable (non-secure context); fail silently.
    }
  }, []);

  return (
    <button
      type="button"
      onClick={onCopy}
      title="Copy a link to this item"
      className="shrink-0 rounded-md border border-border px-2.5 py-1 font-sans text-xs text-fg-muted transition-colors hover:border-accent hover:text-accent"
    >
      {copied ? "✓ Copied" : "Copy Link"}
    </button>
  );
}
