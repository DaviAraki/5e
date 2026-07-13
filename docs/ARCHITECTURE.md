# 5etools-react — Architecture

A modern React/TypeScript rewrite of [5etools](https://5etools.com), the community D&D 5e reference tool. This document describes the system's tech stack, data model, state management, rendering layer, build/deploy pipeline, and the rationale behind the major design choices.

---

## 1. Goals & Scope

| Goal | Decision |
| --- | --- |
| Faithful rendering of 5etools structured content | Port the legacy `Entry` DSL + `{@tag}` inline markup to typed React renderers |
| Support the full "One" (2024) edition dataset | Pre-merge all sources at build time into flat, immutable JSON |
| Fast, offline-capable, installable | PWA with precached app shell + core datasets |
| Mobile-first responsive UX | Master-detail shell, collapsible filter drawers, mobile back-bar |
| Hostable for free | Static site on GitHub Pages (project subpath `/5e/`) |

**Out of scope (v1):** the 2014 "Classic" edition fork, the runtime `_copy`/meta-merge template engine, and live homebrew/prerelease extension layers. Homebrew content (Grim Hollow) is merged at build time only.

---

## 2. Tech Stack

### Core runtime
- **React 19.2** — UI library (`StrictMode`, `react-dom/client`). Function components accept `ref` as a regular prop; no `forwardRef` is used anywhere in the codebase.
- **TypeScript 7.0** (native Go-port compiler, ~10x faster `tsc`) — `strict` + `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedIndexedAccess`. No `any` permitted by convention. `baseUrl` is removed in TS 7; path aliases use relative `paths` entries (`"@/*": ["./src/*"]`).
- **React Router 7** — client-side routing under `BrowserRouter` with `basename={BASE_URL}` for the `/5e/` subpath. `react-router-dom@7` is a thin re-export stub over `react-router/dom`; library mode (`<BrowserRouter><Routes><Route>`) is unchanged from v6.

### State & data
- **TanStack React Query 5** — server-state cache for the resolved JSON datasets. `staleTime: Infinity`, `gcTime: Infinity`, `retry: 1`. Data is build-time-generated and immutable, so it is cached permanently.
- **Zustand 5** — ephemeral/persisted client state: per-category filter stores, the global entity-preview store, and the persisted `spellBook` store. Stores use the curried `create<T>()(...)` form for middleware (e.g. `persist`); bare `create<T>(...)` for the rest.

### Build & tooling
- **Vite 8** (Rolldown-based) + `@vitejs/plugin-react` 6 — dev server (port 3000) and bundler. `resolveJsonModule` + `resolve.alias['@']` → `./src`. Node ≥ 20.19 (matches the Vite 8 / plugin-react 6 engine floor).
- **Tailwind CSS 3.4** (+ PostCSS/autoprefixer) — dark-first design-token system (see §8).
- **vite-plugin-pwa / Workbox** — installable PWA, precache + runtime SWR caching.
- **pnpm 10** (Node ≥ 20.19) — package manager; `packageManager` field pins the version.
- **Biome 2.5** — linter (own Rust TS/TSX parser, independent of the TypeScript compiler API). Replaces ESLint + `typescript-eslint`, which is incompatible with the TS 7 Go-port compiler API (`typescript-eslint` TS 7 support is tracked in [typescript-eslint#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940), ~1-2yr horizon). Configured in `biome.json` with the original rule scope (unused-vars, empty-blocks, Rules-of-Hooks via `useHookAtTopLevel`, exhaustive-deps); formatter and import-sort are disabled to keep diffs minimal. Run via `pnpm lint` (`biome check`) and `pnpm format` (`biome format --write`).

### CI/CD
- **GitHub Actions** → **GitHub Pages**. Builds on every push to `main`, copies `dist/index.html` → `dist/404.html` for SPA fallback (GitHub Pages has no SPA rewrite).

---

## 3. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Build-time pipeline                         │
│   scripts/vendor/*.json  ──┐                                    │
│   (Grim Hollow homebrew)   │  merge-grim-hollow.mjs             │
│                             ▼                                   │
│   public/data/resolved/*.json  (immutable, committed)           │
│      spells.json  bestiary.json  items.json  classes.json …     │
└──────────────────────────┬──────────────────────────────────────┘
                           │ fetch() at runtime
┌──────────────────────────▼──────────────────────────────────────┐
│                        Runtime app                               │
│                                                                  │
│   main.tsx  ── BrowserRouter ── App.tsx                          │
│      │                              │                            │
│      │ route-aware prefetch         │ React.lazy per route       │
│      ▼                              ▼                            │
│   QueryClient cache ─────────── DataLoader (use* hooks)         │
│      │                              │                            │
│      │ cache hits                   ▼                            │
│   resolveEntity() ◄────────── Pages (SpellsPage, BestiaryPage…) │
│      │                              │                            │
│      │ Zustand stores               │                            │
│      │  • *Filters (tri-state)       │                            │
│      │  • entityPreview (popover)    │                            │
│      │  • spellBook (persisted)      ▼                            │
│      │                          MasterDetailLayout               │
│      │                            ├── List + Filters             │
│      │                            └── StatBlock / EntryRenderer  │
│      │                                  └── InlineText ({@tag})  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ vite build
                           ▼
              dist/  →  GitHub Pages (/5e/)
```

### Directory layout

```
src/
  main.tsx            Bootstrap: providers, route-aware preload, idle prefetch
  App.tsx             Routes + app shell (Header, MobileNav, modals)
  data/
    DataLoader.ts     use*() React Query hooks (one per dataset)
    entityRefs.ts     name|source composite-key helpers
  types/
    entities.ts       All entity + Entry-DSL type definitions
  state/              Zustand stores (one filter store per category)
    triStateFilter.ts Shared include/exclude matching primitive
    spellBook.ts      Persisted user spell books (+ import/export codec)
    entityPreview.ts  Global preview-popover state
  hooks/              useBookContent, useMasterDetail
  lib/                Pure formatting / logic (no React): formatters, lootGenerator
  render/
    EntryRenderer.tsx Recursive Entry-union → React nodes
    InlineText.tsx    {@tag} inline-markup → React nodes
  components/
    StatBlock/        One stat-block per entity type (Spell, Monster, …)
    filters/          One filter sidebar per category
    layout/           MasterDetailLayout, Centered, search/sort bars
    list/             SortBar, ColumnHeader
    nav/              Header, MobileNav, navItems (grouped nav config)
    books/            BookCard, BookDetail
  pages/              One page per route (lazy-loaded)
public/
  data/resolved/      Committed immutable JSON datasets
  fonts/ icon/        Self-hosted assets
scripts/
  merge-grim-hollow.mjs  Idempotent homebrew merge into resolved JSON
  vendor/                Vendored upstream homebrew files
```

---

## 4. Data Layer

### 4.1 The resolved datasets

All entity content lives as **static, build-time-merged JSON** under `public/data/resolved/`. The app never parses upstream `_copy` templates, deduplicates sources, or merges editions at runtime — that work is done once, committed, and shipped.

Each file conforms to `ResolvedData<T>`:

```ts
interface ResolvedData<T> {
  entities: T[];
  generatedAt: string;   // ISO timestamp of last merge
  source: string;        // human-readable provenance
}
```

Datasets range from 2 KB (`conditions.json`) to ~4 MB (`bestiary.json`). The total precached payload is ~12 MB.

**Notable shape exceptions:**
- `items.json` carries both `entities` (items) and a sibling `itemGroups` array.
- `classes` is resolved as **two** files (`classes.json` + `subclasses.json`) fetched in parallel and reshaped into `{ classes, subclasses }`.
- Per-book JSON lives under `data/resolved/books/<id>.json` and is runtime-cached (SWR) rather than precached.

### 4.2 The Grim Hollow merge

`scripts/merge-grim-hollow.mjs` is an idempotent Node ≥ 20 script (no dependencies) that merges three upstream Grim Hollow homebrew files (`CG24`, `PG24`, `MG24`) into the resolved datasets:

- Vendored inputs live in `scripts/vendor/`; `--fetch` re-downloads from `TheGiddyLimit/homebrew`.
- It strips any entity whose `source` starts with `GrimHollow` before re-appending, so re-runs are safe.
- A `TYPE_MAP` routes each upstream top-level key (`spell`, `monster`, `item`, `charoption`, …) to the correct resolved file.

### 4.3 Runtime fetching

`src/data/DataLoader.ts` exposes one `use*()` hook per dataset (e.g. `useSpells()`, `useMonsters()`, `useItems()`). Each is a thin React Query wrapper:

```ts
export function useSpells() {
  return useQuery({
    queryKey: ["spells"],
    queryFn: () => fetchJson<ResolvedData<Spell>>(`${RESOLVED_BASE}/spells.json`),
  });
}
```

Because data is immutable, `QueryClient` is configured with `staleTime: Infinity` / `gcTime: Infinity` — a fetched dataset is never refached within a session.

### 4.4 The deep-link preload optimization

`main.tsx` starts the deep-linked route's JSON fetch **before React mounts**, in parallel with the app-shell + lazy-page-chunk download. Without this, a cold deep link to `/spells?s=Aid|XPHB` would serialize as: *download page chunk → parse → mount → fetch 2 MB JSON*, which dominates content-page LCP. The preload primes the cache so the page's `useSpells()` hits on mount.

A second `requestIdleCallback` (with a `setTimeout` fallback for Safari < 17.4) prefetches the ten small cross-referenced datasets so the preview popover can resolve `{@condition}` / `{@variantrule}` links without visiting each page.

### 4.5 Cross-entity references

Entities reference each other by composite key: the string `"<name>|<source>"` (case-insensitive on lookup). `entityRefs.ts` provides `makeRef`, `parseRef`, `refKey`, and `indexByRef` (builds a `Map` for O(1) joins). `resolveEntity.ts` resolves a `(type, name, source)` triple against the React Query cache — this powers the entity-preview popover without any dedicated API.

---

## 5. State Management

The app separates **server state** (cached entity datasets) from **client state** (filters, selections, persisted user data).

### 5.1 React Query — server state

Used purely as an immutable JSON cache (see §4.3). No mutations, no invalidation, no optimistic updates — the dataset is a build artifact.

### 5.2 Zustand — client state

One store per concern:

| Store | Persistence | Purpose |
| --- | --- | --- |
| `spellFilters`, `bestiaryFilters`, `itemFilters`, … (12) | none | Per-category filter selections |
| `entityPreview` | none | Global preview-popover state |
| `spellBook` | `localStorage` (`5etools-react/spellbook`) | User-defined spell books + memorized flags |
| `useMasterDetail` (hook) | none | Selected list item + mobile detail-slide state |

### 5.3 The tri-state filter primitive

`state/triStateFilter.ts` implements the shared filter semantics used by every category:

- A `TriState` = `{ include: Set<string>; exclude: Set<string> }`.
- Clicking a pill cycles **neutral → include → exclude → neutral**.
- Matching: an entity's candidate values pass if *no* value is excluded and (if includes are set) *any* value is included.
- Pure, immutable operations (`triCycle`, `triMatch`) keep the matching predicate side-effect-free.

Each category defines its own option lists and a `*MatchesFilters(entity, state)` predicate that AND-combines dimensions. This is the single most duplicated pattern in the codebase, but each category's matching logic differs enough that abstraction was avoided.

### 5.4 Persisted user data: Spell Books

The `spellBook` store is the only persisted state. To keep the persisted payload small, books store only **keys + a memorized boolean** (`Record<string, boolean>`); full `Spell` objects are resolved at render time by joining keys against the React Query cache. Import/export goes through `spellBookCodec.ts` + a defensive `parseBooks()` validator (handles both bare-array and legacy-envelope shapes, coerces types, drops bad values).

---

## 6. Rendering Layer

5etools content is described by two recursive DSLs, both ported to typed React renderers.

### 6.1 The `Entry` discriminated union (block-level)

`types/entities.ts` defines a discriminated union of ~20 entry object types (`entries`, `list`, `table`, `inset`, `quote`, `image`, `gallery`, `item`, `inline`, `hr`, …) plus `string` and `number` base cases.

`render/EntryRenderer.tsx` is a recursive dispatcher:

```tsx
switch (type) {
  case "entries": case "section": return renderEntries(e, depth);
  case "list":                   return renderList(e);
  case "table":                  return renderTable(e);
  case "inset": case "insetReadaloud": return renderInset(e, …);
  // …
  default:                       return renderUnknown(e, depth);
}
```

- Heading depth is derived from recursion `depth` (h4 at depth 0, h5 deeper).
- Unknown types fall back to rendering name + nested entries inside a muted box, with a `[unhandled entry type: X]` marker. **Data never fails to load** because of an unhandled type.
- A `GenericEntry` catch-all keeps the union total.

### 6.2 The `{@tag}` inline markup

Strings inside entries contain `{@tag args}` spans (e.g. `{@damage 8d6|fire}`, `{@spell fireball}`, `{@condition prone}`, `{@dc 15}`). `render/InlineText.tsx` parses these with a single non-greedy regex and dispatches per tag:

- Link tags (`{@spell}`, `{@condition}`, `{@creature}`, …) become clickable spans that call `openPreview()` on the global `entityPreview` store.
- Formatting tags (`{@b}`, `{@i}`, `{@italic}`) map to `<strong>` / `<em>`.
- Roll tags (`{@damage}`, `{@dice}`, `{@scaledice}`) render the display text; rolling is a future concern.
- Unknown tags render their plain display text.

### 6.3 Stat blocks

`components/StatBlock/` contains one component per entity type (`SpellStatBlock`, `MonsterStatBlock`, `ItemStatBlock`, …), each consuming the typed entity and composing `EntryRenderer` + bespoke layout (the classic 5etools two-column stat-block aesthetic). `lib/*Formatters.ts` hold pure formatting helpers (e.g. `crToFull`, `spSchoolToFull`, `isConcentration`) reused across stat blocks and filters.

---

## 7. UI Architecture

### 7.1 Master-detail shell

Every list page renders through `components/layout/MasterDetailLayout.tsx`:

- **Desktop (md+):** list pane (`md:w-80`, configurable) + detail pane side by side, full height, independent scroll.
- **Mobile:** list is full-width; selecting an item sets `isMobileDetail`, sliding the detail pane over the list (`absolute inset-0 z-10`) with a `MobileBackBar` to return.

The selection state lives in `hooks/useMasterDetail.ts` (selected key + mobile-slide flag), shared across all pages.

### 7.2 Grouped navigation

`components/nav/navItems.ts` is the single source of truth for nav structure — grouped categories shared by the desktop `Header`, the mobile `MobileNav` drawer, and the `Landing` page tile grid. Adding a route means adding one entry here plus one `<Route>` in `App.tsx`.

### 7.3 Global modals

Two app-level modals mount once in `App.tsx` and read global Zustand state, so any deep-linkable page can trigger them:
- `EntityPreviewModal` — quick-look popover for cross-entity `{@tag}` links.
- `ConfirmModal` — generic destructive-action confirmation.

### 7.4 Theming

Dark-first design tokens declared in `tailwind.config.ts`: a four-step surface scale (`bg`, `bg-subtle`, `bg-raised`, `bg-overlay`), matching border and foreground ramps, an `accent` violet, plus semantic palettes for `school` and `damage` colors that mirror the legacy site so stat blocks stay recognizable. Light theme is supported via `[data-theme="light"]` overrides.

---

## 8. Performance Strategy

| Concern | Strategy |
| --- | --- |
| Initial JS payload | Route-level `React.lazy` code-splitting; only the app shell + Landing ship on first paint. |
| Vendor cache stability | `manualChunks` pins `react`, `react-dom`, `react-router`, `@tanstack`, `zustand` into a stable `vendor` chunk so it caches independently of app code. |
| Deep-link LCP | Route-aware JSON preload in `main.tsx` (see §4.4) parallelizes chunk download with the data fetch. |
| Cross-reference latency | Idle prefetch of the ten small datasets so the preview popover resolves without a cold fetch. |
| Large lists | Full filtered array rendered to the DOM via `.map()` inside a CSS `overflow-y-auto` scroll container — no virtualization or pagination today (`react-window` was a dead dependency, now removed; see §11). |
| Repeated filter passes | Per-category filter state is read via Zustand selectors; `useMemo` memoizes the filtered+sorted list. |
| Offline use | PWA precaches the app shell + ten core datasets (~12 MB); per-book JSON is runtime-cached SWR. |

---

## 9. Build & Deployment

### Build

```bash
pnpm install --frozen-lockfile
pnpm build        # tsc -b && vite build
pnpm typecheck    # tsc --noEmit (TS 7 native compiler)
pnpm lint         # biome check
pnpm format       # biome format --write
```

`vite.config.ts` key settings:
- `base: "/5e/"` — GitHub Pages project subpath.
- `VitePWA` — `registerType: "autoUpdate"`, precache glob includes `data/resolved/*.json`, `maximumFileSizeToCacheInBytes: 5_000_000` (the default 2 MB cap would drop `bestiary.json`), runtime SWR for `data/resolved/books/*`.
- `resolve.alias['@']` → `./src`.

### CI/CD

`.github/workflows/deploy-pages.yml`:
1. Checkout → setup pnpm → setup Node 24.
2. `pnpm build`.
3. `cp dist/index.html dist/404.html` — GitHub Pages has no SPA fallback, so client-side routes on refresh/404 still serve the app.
4. Upload artifact → deploy to `github-pages` environment.

---

## 10. Key Design Choices & Rationale

### Why build-time pre-merge instead of runtime merge?

The legacy 5etools runtime resolves `_copy` templates, dedupes sources, and layers homebrew/prerelease at load time — a large, hot JS path. This app moves all of that to a committed build artifact. Tradeoff: **editions/homebrew can't be toggled at runtime**; benefit: the app ships a fast, cacheable, offline JSON payload with no merge logic in the client.

### Why React Query for static JSON?

Even with immutable data, React Query gives a uniform `use*()` data-fetching contract, request dedup, and `getQueryData` for synchronous cache reads (used by `resolveEntity`). `staleTime: Infinity` makes it a pure cache. The alternative — raw `fetch` + module-level promises — would reimplement dedup and cache priming by hand.

### Why Zustand stores per category (not one mega-store)?

Each category's filter dimensions differ (spells have schools; monsters have CR/size). A single shared store would force a lossy generic shape; 12 small stores keep each category's matching predicate precise and the tri-state primitive (`triStateFilter.ts`) reusable.

### Why store only composite keys in persisted spell books?

Full `Spell` objects are large and already cached by React Query. Persisting only `name|source` keys keeps the `localStorage` payload tiny and avoids stale data when the dataset updates — the book always reflects the current build.

### Why a recursive Entry renderer instead of HTML strings?

The legacy site builds HTML strings. Rendering typed `Entry` objects to React nodes keeps the data-model authoritative, enables `{@tag}` links to call into React state (the preview popover), and avoids `dangerouslySetInnerHTML` entirely — no XSS surface from user-facing content.

---

## 11. Open Items / Future Direction

- **Entry DSL coverage:** ~10 of ~46 legacy entry types are implemented; the rest fall through to the generic fallback. Roll mechanics (`{@damage}`, `{@dice}`) are display-only.
- **2014 "Classic" edition:** deferred; the data model is 2024-only.
- **Runtime homebrew/prerelease:** deferred; only build-time Grim Hollow merge exists.
- **Large-list virtualization:** no virtualization is in place; large lists (bestiary, spells) render the full filtered array to the DOM. `react-window` was listed as a dependency but never imported and has been removed. Re-introducing virtualization (e.g. `@tanstack/react-virtual`) is an open performance item for the biggest lists.
- **Lint rule surface:** the Biome config mirrors the *original* ESLint rule scope (unused-vars, empty-blocks, Rules-of-Hooks, exhaustive-deps). Biome's full recommended set surfaced ~240 pre-existing findings (import sorting, `noArrayIndexKey`, a11y) that are worth adopting in a follow-up — see [typescript-eslint#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940) for why ESLint is not an option on TS 7 today.
- **Testing:** no test framework is configured.
