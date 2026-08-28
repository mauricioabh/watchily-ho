import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/rate-limit.test.ts"],
    setupFiles: ["tests/setup/load-env-local.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
