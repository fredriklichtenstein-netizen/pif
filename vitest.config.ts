/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import path from "path";

// Dedicated Vitest config so the main vite.config.ts stays focused on
// the production build. Tests run in node — they never touch the DOM
// because every check exercises pure data/services logic.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts"],
    reporters: ["default"],
  },
});
