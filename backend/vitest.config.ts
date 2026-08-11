import { defineConfig } from "vitest/config";
import path from "path";

const backendRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  root: backendRoot,
  resolve: {
    alias: {
      "@shared": path.resolve(backendRoot, "shared"),
    },
  },
  test: {
    environment: "node",
    include: ["server/**/*.test.ts", "server/**/*.spec.ts"],
  },
});
