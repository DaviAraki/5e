import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

// Vite config for the 5etools React app.
// Dev server proxies /data and /search to the legacy static site root so the
// app can read the shared JSON without duplicating it.
export default defineConfig({
  // Serve assets under the repo subpath for GitHub Pages project sites.
  // Override locally with `--base=/` if deploying to a root domain.
  base: "/5e/",
  plugins: [
    react(),
    // Installable, offline-capable PWA. Precaches the app shell plus the ten
    // core resolved datasets (~7 MB) so every reference page works with no
    // network. Per-book JSON is runtime-cached on first visit via SWR.
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.svg",
        "fonts/*.woff2",
        "icon/icon-*.png",
      ],
      manifest: {
        name: "5etools",
        short_name: "5etools",
        description: "Modern React/TypeScript frontend for 5etools.",
        theme_color: "#0e1116",
        background_color: "#0e1116",
        display: "standalone",
        start_url: ".",
        scope: ".",
        icons: [
          { src: "icon/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        globPatterns: [
          "**/*.{js,css,html,woff2,svg,png}",
          "data/resolved/*.json",
        ],
        // bestiary.json is ~2.38 MB; Workbox's default 2 MB cap would drop it.
        maximumFileSizeToCacheInBytes: 3_000_000,
        runtimeCaching: [
          {
            urlPattern: /\/data\/resolved\/books\/.*\.json$/,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "books-cache" },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 3000,
  },
});
