import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// Vite config for the 5etools React app.
// Dev server proxies /data and /search to the legacy static site root so the
// app can read the shared JSON without duplicating it.
export default defineConfig({
  // Serve assets under the repo subpath for GitHub Pages project sites.
  // Override locally with `--base=/` if deploying to a root domain.
  base: "/5etools-react/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 3000,
  },
});
