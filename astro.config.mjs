// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

const SITE = "https://tinytools.live";

export default defineConfig({
  site: SITE,
  output: "static",
  trailingSlash: "always",
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
});
