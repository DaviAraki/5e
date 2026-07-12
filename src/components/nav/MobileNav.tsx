import { NavLink } from "react-router-dom";
import { NAV_GROUPS } from "@/components/nav/navItems";

/**
 * Mobile slide-in drawer. Renders {@link NAV_GROUPS} as labelled sections so
 * the 18 tools are scannable instead of a long undifferentiated list. Visibility
 * is driven entirely by {@link MobileNavProps.open}; route changes close it via
 * the effect owned by the parent (App).
 */
interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileNav({ open, onClose }: MobileNavProps) {
  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-200 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        aria-hidden={!open}
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-bg-subtle shadow-pop transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <NavLink
            to="/"
            className="font-serif text-lg font-bold text-fg transition-colors hover:text-accent"
          >
            5etools
          </NavLink>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded px-2 py-0.5 text-fg-muted transition-colors hover:bg-bg-raised hover:text-fg"
          >
            ✕
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 py-3 text-sm" aria-label="Tools">
          {NAV_GROUPS.map((group, index) => (
            <div key={group.id} className={index > 0 ? "mt-4" : ""}>
              <h2 className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-fg-faint">
                {group.label}
              </h2>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `block rounded-md px-3 py-1.5 transition-colors ${
                        isActive
                          ? "bg-accent-subtle text-accent"
                          : "text-fg-muted hover:bg-bg-raised hover:text-fg"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
