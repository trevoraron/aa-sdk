import { defineProject, mergeConfig } from "vitest/config";
import { sharedConfig } from "./vitest.shared";

export default mergeConfig(
  // @ts-ignore this does work
  sharedConfig,
  defineProject({
    test: {
      name: "viem-aa-testing",
      include: ["src/viem-aa/**/*.test.ts"],
      setupFiles: ["src/viem-aa/setupTests.ts"],
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
  }),
);
