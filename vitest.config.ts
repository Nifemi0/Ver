import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    env: { VER_CACHE_MEMORY: "true", VER_REGISTRY_LOOKUP: "false" },
  },
});
