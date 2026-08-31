import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/** Root config — tests the Astro app's calculator islands in a DOM. The calc
 *  engine has its own config under packages/calc. */
export default defineConfig({
  resolve: {
    alias: {
      "@tinytools/calc": fileURLToPath(new URL("./packages/calc/src/index.ts", import.meta.url)),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.ts"],
  },
});
