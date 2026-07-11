import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";

/** Styled navigation link for the app header (desktop nav + mobile drawer). */
export default function NavItem({
  to,
  children,
}: {
  to: string;
  children: ReactNode;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-md px-3 py-1.5 transition-colors ${
          isActive
            ? "bg-accent-subtle text-accent"
            : "text-fg-muted hover:bg-bg-raised hover:text-fg"
        }`
      }
    >
      {children}
    </NavLink>
  );
}
