import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Entity data is build-time-resolved and immutable; cache aggressively.
      staleTime: Infinity,
      gcTime: Infinity,
      retry: 1,
    },
  },
});

// Prefetch entity datasets so the preview popover can resolve cross-entity
// links (e.g. clicking a {@spell} link from the feats page) without the user
// having to visit each page first.
const RESOLVED_BASE = `${import.meta.env.BASE_URL}data/resolved`;
async function prefetch(url: string) {
  try {
    const res = await fetch(url);
    if (res.ok) return await res.json();
  } catch {
    // ignore — lazy-loaded when the user visits the page
  }
  return null;
}

(async () => {
  const [
    spells, monsters, itemsData, feats, variantrules,
    conditions, diseases, deities, languages, legendarygroups, tables, transformations, optionalfeatures,
  ] = await Promise.all([
    prefetch(`${RESOLVED_BASE}/spells.json`),
    prefetch(`${RESOLVED_BASE}/bestiary.json`),
    prefetch(`${RESOLVED_BASE}/items.json`),
    prefetch(`${RESOLVED_BASE}/feats.json`),
    prefetch(`${RESOLVED_BASE}/variantrules.json`),
    prefetch(`${RESOLVED_BASE}/conditions.json`),
    prefetch(`${RESOLVED_BASE}/diseases.json`),
    prefetch(`${RESOLVED_BASE}/deities.json`),
    prefetch(`${RESOLVED_BASE}/languages.json`),
    prefetch(`${RESOLVED_BASE}/legendarygroups.json`),
    prefetch(`${RESOLVED_BASE}/tables.json`),
    prefetch(`${RESOLVED_BASE}/transformations.json`),
    prefetch(`${RESOLVED_BASE}/optionalfeatures.json`),
  ]);
  if (spells) queryClient.setQueryData(["spells"], spells);
  if (monsters) queryClient.setQueryData(["monsters"], monsters);
  if (itemsData) {
    queryClient.setQueryData(["items"], {
      items: itemsData.entities ?? [],
      itemGroups: [],
    });
  }
  if (feats) queryClient.setQueryData(["feats"], feats);
  if (variantrules) queryClient.setQueryData(["variantrules"], variantrules);
  if (conditions) queryClient.setQueryData(["conditions"], conditions);
  if (diseases) queryClient.setQueryData(["diseases"], diseases);
  if (deities) queryClient.setQueryData(["deities"], deities);
  if (languages) queryClient.setQueryData(["languages"], languages);
  if (legendarygroups) queryClient.setQueryData(["legendarygroups"], legendarygroups);
  if (tables) queryClient.setQueryData(["tables"], tables);
  if (transformations) queryClient.setQueryData(["transformations"], transformations);
  if (optionalfeatures) queryClient.setQueryData(["optionalfeatures"], optionalfeatures);
})();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
