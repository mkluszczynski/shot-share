import { defineConfig, mergeConfig } from "vite";
import { defineConfig as defineVitestConfig } from "vitest/config";
import path from "path";

export default mergeConfig(
  defineConfig({
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }),
  defineVitestConfig({
    test: {
      environment: "jsdom",
    },
  }),
);
