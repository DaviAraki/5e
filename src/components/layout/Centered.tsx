import type { ReactNode } from "react";

/** Centered full-height placeholder wrapper for loading / error / empty states. */
export default function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center text-fg-muted">
      {children}
    </div>
  );
}
