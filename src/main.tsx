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

// Preload entity datasets on the critical path. Two mechanisms:
//
// 1. Route-aware preload: if the user deep-links straight to a content page
//    (e.g. /spells?s=Aid|XPHB), kick off that page's data fetch IMMEDIATELY —
//    before React even mounts. Otherwise the fetch can't start until the lazy
//    page chunk downloads + parses, making the chunk download and the 2 MB
//    JSON fetch a serial chain that dominates content-page LCP. Prefetching
//    here runs the JSON download in parallel with the app shell + chunk.
//
// 2. Idle prefetch of small cross-referenced datasets so the preview popover
//    can resolve cross-entity links (e.g. {@condition}) without visiting each
//    page first. Deferred to idle so it never contends with first paint.
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

// Map the first URL path segment to the React Query key + fetch(es) that page
// needs, mirroring the use* hooks in DataLoader.ts. Fetching here and priming
// the cache means useSpells()/useClasses()/etc. hit the cache on mount instead
// of starting a cold fetch.
function preloadRouteData(pathname: string) {
  // Strip the configured base (e.g. "/5e/") and grab the first segment.
  const base = import.meta.env.BASE_URL;
  const rel = pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  const seg = rel.split("/")[0] ?? "";

  // Single-file datasets: prime the cache with the parsed JSON as-is.
  const single: Record<string, [string, string]> = {
    spells: ["spells", "spells.json"],
    bestiary: ["monsters", "bestiary.json"],
    backgrounds: ["backgrounds", "backgrounds.json"],
    species: ["species", "species.json"],
    feats: ["feats", "feats.json"],
    books: ["books", "books.json"],
    conditions: ["conditions", "conditions.json"],
    deities: ["deities", "deities.json"],
    diseases: ["diseases", "diseases.json"],
    languages: ["languages", "languages.json"],
    "legendary-groups": ["legendarygroups", "legendarygroups.json"],
    tables: ["tables", "tables.json"],
    transformations: ["transformations", "transformations.json"],
    "optional-features": ["optionalfeatures", "optionalfeatures.json"],
    variantrules: ["variantrules", "variantrules.json"],
  };
  const s = single[seg];
  if (s) {
    void prefetch(`${RESOLVED_BASE}/${s[1]}`).then((d) => {
      if (d) queryClient.setQueryData([s[0]], d);
    });
    return;
  }

  // Multi-file / shaped datasets:
  if (seg === "classes") {
    // useClasses does Promise.all over classes.json + subclasses.json and
    // reshapes into { classes, subclasses } from `.entities`.
    void Promise.all([
      prefetch(`${RESOLVED_BASE}/classes.json`),
      prefetch(`${RESOLVED_BASE}/subclasses.json`),
    ]).then(([c, sc]) => {
      if (c && sc) {
        queryClient.setQueryData(["classes"], {
          classes: c.entities ?? [],
          subclasses: sc.entities ?? [],
        });
      }
    });
    return;
  }
  if (seg === "items") {
    // useItems reshapes into { items, itemGroups } from `entities` + `itemGroups`.
    void prefetch(`${RESOLVED_BASE}/items.json`).then((d) => {
      if (d) {
        queryClient.setQueryData(["items"], {
          items: d.entities ?? [],
          itemGroups: d.itemGroups ?? [],
        });
      }
    });
    return;
  }
}

function prefetchSmallDatasets() {
  void (async () => {
    const [
      feats, variantrules, conditions, diseases, deities,
      languages, legendarygroups, tables, transformations, optionalfeatures,
    ] = await Promise.all([
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
}

// requestIdleCallback is unavailable on Safari < 17.4; fall back to a setTimeout
// delay so the prefetch still lands well after first paint.
const ric = window.requestIdleCallback;
if (typeof ric === "function") {
  ric.call(window, prefetchSmallDatasets, { timeout: 4000 });
} else {
  window.setTimeout(prefetchSmallDatasets, 2000);
}

// Start the deep-linked route's data fetch BEFORE React mounts so it runs in
// parallel with the app shell + lazy page chunk download. On content deep links
// (e.g. /spells?s=Aid|XPHB) this turns a serial chunk→fetch chain into a
// parallel one, which is the dominant LCP win.
preloadRouteData(window.location.pathname);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
