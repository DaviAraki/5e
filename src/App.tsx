import { useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Landing from "@/pages/Landing";
import Header from "@/components/nav/Header";
import MobileNav from "@/components/nav/MobileNav";
import EntityPreviewModal from "@/components/EntityPreviewModal";
import ConfirmModal from "@/components/ConfirmModal";

// Non-default routes are code-split so the initial bundle ships only the app
// shell + the Landing page. Each chunk loads on first navigation.
const SpellsPage = lazy(() => import("@/pages/SpellsPage"));
const ClassesPage = lazy(() => import("@/pages/ClassesPage"));
const BestiaryPage = lazy(() => import("@/pages/BestiaryPage"));
const ItemsPage = lazy(() => import("@/pages/ItemsPage"));
const BackgroundsPage = lazy(() => import("@/pages/BackgroundsPage"));
const SpeciesPage = lazy(() => import("@/pages/SpeciesPage"));
const FeatsPage = lazy(() => import("@/pages/FeatsPage"));
const ConditionsPage = lazy(() => import("@/pages/ConditionsPage"));
const DiseasesPage = lazy(() => import("@/pages/DiseasesPage"));
const DeitiesPage = lazy(() => import("@/pages/DeitiesPage"));
const LanguagesPage = lazy(() => import("@/pages/LanguagesPage"));
const LegendaryGroupsPage = lazy(() => import("@/pages/LegendaryGroupsPage"));
const TablesPage = lazy(() => import("@/pages/TablesPage"));
const TransformationsPage = lazy(() => import("@/pages/TransformationsPage"));
const OptionalFeaturesPage = lazy(() => import("@/pages/OptionalFeaturesPage"));
const BooksPage = lazy(() => import("@/pages/BooksPage"));
const SpellBookPage = lazy(() => import("@/pages/SpellBookPage"));
const LootPage = lazy(() => import("@/pages/LootPage"));

/**
 * Top-level app shell: header + outlet + mobile drawer. The grouped nav config
 * lives in {@link "@/components/nav/navItems"} and is shared by Header, MobileNav,
 * and the Landing page.
 */
export default function App() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  // Close the mobile drawer whenever the route changes (link tap, back/forward).
  // location.pathname is intentionally a trigger, not a value the body reads.
  // biome-ignore lint/correctness/useExhaustiveDependencies: route-change side effect
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
        <Suspense fallback={<div className="flex h-full items-center justify-center text-fg/60">Loading…</div>}>
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
        </Suspense>
      </main>

      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <EntityPreviewModal />
      <ConfirmModal />
    </div>
  );
}
