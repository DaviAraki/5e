import { useState, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { NAV_GROUPS } from "@/components/nav/navItems";

/**
 * App header. Desktop (≥md) shows the wordmark plus a row of category buttons,
 * each opening a click-toggled dropdown of its tools. On mobile a hamburger
 * button replaces the row and calls {@link onOpenNavProps.onOpenNav}.
 *
 * Dropdown dismissal: outside-click, Escape, and route change.
 */
export default function Header({ onOpenNav }: { onOpenNav: () => void }) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const location = useLocation();
  const containerRef = useRef<HTMLElement>(null);

  // Close any open dropdown when navigating.
  useEffect(() => {
    setOpenGroup(null);
  }, [location.pathname]);

  // Close on outside click.
  useEffect(() => {
    if (openGroup === null) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenGroup(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openGroup]);

  // Close on Escape.
  useEffect(() => {
    if (openGroup === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenGroup(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [openGroup]);

  return (
    <header
      ref={containerRef}
      className="relative flex items-center gap-1 border-b border-border bg-bg-subtle px-4 py-2"
    >
      <NavLink
        to="/"
        className="mr-4 font-serif text-lg font-bold text-fg transition-colors hover:text-accent"
      >
        5etools
      </NavLink>

      <nav className="hidden gap-1 text-sm md:flex" aria-label="Categories">
        {NAV_GROUPS.map((group) => {
          const isOpen = openGroup === group.id;
          return (
            <div key={group.id} className="relative">
              <button
                type="button"
                onClick={() => setOpenGroup(isOpen ? null : group.id)}
                aria-expanded={isOpen}
                aria-haspopup="menu"
                aria-label={group.label}
                className={`flex items-center gap-1 rounded-md px-3 py-1.5 transition-colors ${
                  isOpen
                    ? "bg-accent-subtle text-accent"
                    : "text-fg-muted hover:bg-bg-raised hover:text-fg"
                }`}
              >
                {group.label}
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                >
                  <path d="M2 3.5L5 6.5L8 3.5" />
                </svg>
              </button>
              {isOpen && (
                <div
                  role="menu"
                  aria-label={group.label}
                  className="absolute left-0 top-full z-50 mt-1 min-w-44 rounded-md border border-border bg-bg-raised p-1 shadow-pop"
                >
                  {group.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `block rounded-md px-3 py-1.5 transition-colors ${
                          isActive
                            ? "bg-accent-subtle text-accent"
                            : "text-fg-muted hover:bg-bg-subtle hover:text-fg"
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={onOpenNav}
        aria-label="Open menu"
        className="ml-auto rounded-md p-1.5 text-fg-muted transition-colors hover:bg-bg-raised hover:text-fg md:hidden"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M3 5h14M3 10h14M3 15h14" />
        </svg>
      </button>
    </header>
  );
}
