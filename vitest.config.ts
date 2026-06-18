import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/rate-limit.test.ts"],
    setupFiles: ["tests/setup/load-env-local.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
