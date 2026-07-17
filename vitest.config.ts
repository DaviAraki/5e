import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";

// Vitest config. Reuses the same `@/` -> src/ alias as vite.config.ts so tests
// can import application code identically. Node environment only (no DOM);
// add `environment: "jsdom"` if component tests are introduced later.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/types/**"],
    },
  },
});
