import { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import SpellsPage from "@/pages/SpellsPage";
import ClassesPage from "@/pages/ClassesPage";
import BestiaryPage from "@/pages/BestiaryPage";
import ItemsPage from "@/pages/ItemsPage";
import BackgroundsPage from "@/pages/BackgroundsPage";
import SpeciesPage from "@/pages/SpeciesPage";
import FeatsPage from "@/pages/FeatsPage";
import BooksPage from "@/pages/BooksPage";
import SpellBookPage from "@/pages/SpellBookPage";
import LootPage from "@/pages/LootPage";
import Landing from "@/pages/Landing";
import NavItem from "@/components/nav/NavItem";
import EntityPreviewModal from "@/components/EntityPreviewModal";

const NAV_ITEMS: { to: string; label: string }[] = [
  { to: "/spells", label: "Spells" },
  { to: "/classes", label: "Classes" },
  { to: "/bestiary", label: "Bestiary" },
  { to: "/items", label: "Items" },
  { to: "/backgrounds", label: "Backgrounds" },
  { to: "/species", label: "Species" },
  { to: "/feats", label: "Feats" },
  { to: "/books", label: "Books" },
  { to: "/spellbook", label: "Spell Book" },
  { to: "/loot", label: "Loot" },
];

/**
 * Top-level app shell. Three-pane tool layout is handled per-page; this is the
 * chrome: nav + outlet. The desktop nav is a horizontal row (≥md); on mobile it
 * collapses into a slide-in drawer toggled by a hamburger button.
 */
export default function App() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  // Close the mobile drawer whenever the route changes (link tap, back/forward).
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  // Close on Escape, mirroring EntityPreviewModal.
  useEffect(() => {
    if (!mobileNavOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mobileNavOpen]);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-1 border-b border-border bg-bg-subtle px-4 py-2">
        <span className="mr-4 font-serif text-lg font-bold text-fg">5etools</span>
        <nav className="hidden gap-1 text-sm md:flex">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.to} to={item.to}>
              {item.label}
            </NavItem>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open menu"
          aria-expanded={mobileNavOpen}
          aria-controls="mobile-nav"
          className="ml-auto rounded-md p-1.5 text-fg-muted transition-colors hover:bg-bg-raised hover:text-fg md:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M3 5h14M3 10h14M3 15h14" />
          </svg>
        </button>
      </header>
      <main className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/spells" element={<SpellsPage />} />
          <Route path="/classes" element={<ClassesPage />} />
          <Route path="/bestiary" element={<BestiaryPage />} />
          <Route path="/items" element={<ItemsPage />} />
          <Route path="/backgrounds" element={<BackgroundsPage />} />
          <Route path="/species" element={<SpeciesPage />} />
          <Route path="/feats" element={<FeatsPage />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/spellbook" element={<SpellBookPage />} />
          <Route path="/loot" element={<LootPage />} />
        </Routes>
      </main>

      {/* Mobile nav drawer */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-200 ${
          mobileNavOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMobileNavOpen(false)}
        aria-hidden="true"
      />
      <aside
        id="mobile-nav"
        aria-hidden={!mobileNavOpen}
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-bg-subtle shadow-pop transition-transform duration-200 ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <span className="font-serif text-lg font-bold text-fg">5etools</span>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close menu"
            className="rounded px-2 py-0.5 text-fg-muted transition-colors hover:bg-bg-raised hover:text-fg"
          >
            ✕
          </button>
        </div>
        <nav className="flex flex-col gap-1 p-4 text-sm">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.to} to={item.to}>
              {item.label}
            </NavItem>
          ))}
        </nav>
      </aside>

      <EntityPreviewModal />
    </div>
  );
}
