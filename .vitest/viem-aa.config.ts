import { defineConfig } from "vitest/config";
import { join } from "node:path";

export default defineConfig({
  test: {
    name: "viem-aa-testing",
    include: [".vitest/src/viem-aa/**/*.test.ts"],
    testTimeout: 30000,
    setupFiles: [join(__dirname, "setupTests.ts")],
    globalSetup: join(__dirname, "globalSetup.ts"),
    poolOptions: {
      threads: {
        isolate: true,
        singleThread: true,
      },
    },
    environment: "node",
    globals: true,
  },
});
