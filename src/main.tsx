import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DATASETS, datasetForRoute, IDLE_PREFETCH_KEYS } from "@/data/datasets";
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
//
// Both consume the dataset catalog in @/data/datasets, so the route→fetch
// mapping cannot drift out of sync with the use* hooks in DataLoader.ts.

/** Prime the React Query cache with a dataset's loaded shape. */
async function preloadDataset(entry: { key: readonly [string]; load: () => Promise<unknown> }) {
  try {
    const data = await entry.load();
    queryClient.setQueryData(entry.key, data);
  } catch {
    // ignore — lazy-loaded when the user visits the page
  }
}

/** Preload the dataset for the deep-linked route's first path segment. */
function preloadRouteData(pathname: string) {
  const base = import.meta.env.BASE_URL;
  const rel = pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  const seg = rel.split("/")[0] ?? "";
  const entry = datasetForRoute(seg);
  if (entry) void preloadDataset(entry);
}

/** Prefetch small cross-reference datasets so the preview popover resolves links. */
function prefetchSmallDatasets() {
  for (const key of IDLE_PREFETCH_KEYS) {
    const entry = DATASETS[key];
    if (entry) void preloadDataset(entry);
  }
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
