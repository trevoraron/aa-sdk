import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "viem-aa-testing",
    include: [".vitest/src/viem-aa/**/*.test.ts"],
    testTimeout: 30000,
    poolOptions: {
      threads: {
        // Isolate viem AA tests to avoid port conflicts
        isolate: true,
        singleThread: true,
      },
    },
    environment: "node",
    globals: true,
  },
});
