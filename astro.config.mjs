// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { fileURLToPath } from "node:url";

const SITE = "https://tinytools.live";

export default defineConfig({
  site: SITE,
  output: "static",
  trailingSlash: "always",
  // Old-URL redirects are generated as literal files in public/ by
  // scripts/gen-redirects.mjs (Astro's `redirects` clashes with
  // trailingSlash:'always' for `.html` keys). See src/data/redirects.ts.
  build: {
    format: "directory",
    // "auto": inline tiny critical CSS, externalise the shared bundle so it is
    // cached across the site's many pages.
    inlineStylesheets: "auto",
  },
  compressHTML: true,
  prefetch: false,
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes("/404") &&
        !page.includes("/go/"), // redirect stubs are noindex, keep them out of the sitemap
      changefreq: "monthly",
      lastmod: new Date(),
    }),
  ],
  devToolbar: { enabled: false },
  vite: {
    resolve: {
      alias: {
        "@tinytools/calc": fileURLToPath(new URL("./packages/calc/src/index.ts", import.meta.url)),
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  },
});
