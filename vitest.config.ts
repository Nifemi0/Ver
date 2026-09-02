import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    env: { VER_CACHE_MEMORY: "true" },
  },
});
