import { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import SpellsPage from "@/pages/SpellsPage";
import ClassesPage from "@/pages/ClassesPage";
import BestiaryPage from "@/pages/BestiaryPage";
import ItemsPage from "@/pages/ItemsPage";
import BackgroundsPage from "@/pages/BackgroundsPage";
import SpeciesPage from "@/pages/SpeciesPage";
import FeatsPage from "@/pages/FeatsPage";
import ConditionsPage from "@/pages/ConditionsPage";
import DiseasesPage from "@/pages/DiseasesPage";
import DeitiesPage from "@/pages/DeitiesPage";
import LanguagesPage from "@/pages/LanguagesPage";
import LegendaryGroupsPage from "@/pages/LegendaryGroupsPage";
import TablesPage from "@/pages/TablesPage";
import TransformationsPage from "@/pages/TransformationsPage";
import OptionalFeaturesPage from "@/pages/OptionalFeaturesPage";
import BooksPage from "@/pages/BooksPage";
import SpellBookPage from "@/pages/SpellBookPage";
import LootPage from "@/pages/LootPage";
import Landing from "@/pages/Landing";
import Header from "@/components/nav/Header";
import MobileNav from "@/components/nav/MobileNav";
import EntityPreviewModal from "@/components/EntityPreviewModal";
import ConfirmModal from "@/components/ConfirmModal";

/**
 * Top-level app shell: header + outlet + mobile drawer. The grouped nav config
 * lives in {@link "@/components/nav/navItems"} and is shared by Header, MobileNav,
 * and the Landing page.
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
      <Header onOpenNav={() => setMobileNavOpen(true)} />
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
          <Route path="/transformations" element={<TransformationsPage />} />
          <Route path="/optional-features" element={<OptionalFeaturesPage />} />
          <Route path="/conditions" element={<ConditionsPage />} />
          <Route path="/diseases" element={<DiseasesPage />} />
          <Route path="/deities" element={<DeitiesPage />} />
          <Route path="/languages" element={<LanguagesPage />} />
          <Route path="/tables" element={<TablesPage />} />
          <Route path="/legendary-groups" element={<LegendaryGroupsPage />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/spellbook" element={<SpellBookPage />} />
          <Route path="/loot" element={<LootPage />} />
        </Routes>
      </main>

      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <EntityPreviewModal />
      <ConfirmModal />
    </div>
  );
}
