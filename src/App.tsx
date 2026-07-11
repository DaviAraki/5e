import { Routes, Route, NavLink } from "react-router-dom";
import SpellsPage from "@/pages/SpellsPage";
import ClassesPage from "@/pages/ClassesPage";
import BestiaryPage from "@/pages/BestiaryPage";
import ItemsPage from "@/pages/ItemsPage";
import BackgroundsPage from "@/pages/BackgroundsPage";
import SpeciesPage from "@/pages/SpeciesPage";
import FeatsPage from "@/pages/FeatsPage";
import BooksPage from "@/pages/BooksPage";
import SpellBookPage from "@/pages/SpellBookPage";
import EntityPreviewModal from "@/components/EntityPreviewModal";

/**
 * Top-level app shell. Three-pane tool layout is handled per-page; this is the
 * chrome: nav + outlet. Pages are stubs for now and fleshed out in later phases.
 */
export default function App() {
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-1 border-b border-border bg-bg-subtle px-4 py-2">
        <span className="mr-4 font-serif text-lg font-bold text-fg">5etools</span>
        <nav className="flex gap-1 text-sm">
          <NavItem to="/spells">Spells</NavItem>
          <NavItem to="/classes">Classes</NavItem>
          <NavItem to="/bestiary">Bestiary</NavItem>
          <NavItem to="/items">Items</NavItem>
          <NavItem to="/backgrounds">Backgrounds</NavItem>
          <NavItem to="/species">Species</NavItem>
          <NavItem to="/feats">Feats</NavItem>
          <NavItem to="/books">Books</NavItem>
          <NavItem to="/spellbook">Spell Book</NavItem>
        </nav>
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
        </Routes>
      </main>
      <EntityPreviewModal />
    </div>
  );
}

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
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

function Landing() {
  return (
    <div className="flex h-full items-center justify-center text-fg-muted">
      Select a tool from the nav.
    </div>
  );
}
