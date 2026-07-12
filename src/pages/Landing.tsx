import { NavLink } from "react-router-dom";
import { NAV_GROUPS } from "@/components/nav/navItems";

/**
 * Home page. Replaces the old blank placeholder with a grouped grid of tool
 * tiles, mirroring BooksPage's sectioned layout and BookCard's tile recipe.
 */
export default function Landing() {
  return (
    <div className="h-full overflow-y-auto bg-bg">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="mb-6 font-serif text-2xl font-bold text-fg">5etools</h1>
        <div className="space-y-8">
          {NAV_GROUPS.map((group) => (
            <section key={group.id}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-fg-muted">
                {group.label}
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `group flex items-center justify-between rounded-lg border p-3 transition-colors ${
                        isActive
                          ? "border-accent bg-accent-subtle text-accent"
                          : "border-border text-fg hover:border-accent hover:bg-bg-subtle"
                      }`
                    }
                  >
                    <span className="font-medium">{item.label}</span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      className="text-fg-faint transition-transform group-hover:translate-x-0.5 group-hover:text-current"
                    >
                      <path d="M5 3l4 4l-4 4" />
                    </svg>
                  </NavLink>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
