/**
 * Old TinyTools / Global Tax Calculator URLs -> the closest current page.
 * Consumed by scripts/gen-redirects.mjs (writes a meta-refresh stub for each
 * into public/) and by scripts/seo-crawl.mjs (validates the targets resolve).
 * GitHub Pages has no server 301s; Google treats a meta-refresh + canonical
 * stub as a soft redirect and passes most signal. No blanket redirect to `/`.
 */
export const REDIRECTS = {
  "/calculator.html": "/calculators/take-home-pay-calculator/",
  "/docs/us-tax-guide.html": "/guides/gross-pay-vs-take-home-pay/",
  "/docs/uk-tax-guide.html": "/guides/",
  "/docs/canada-tax-guide.html": "/guides/",
  "/docs/global-tax-guide.html": "/calculators/",
  // The pre-redesign sitemap.xml listed the four tax guides at the site root
  // (they 404'd there even then). Old external links / crawl history may still
  // reference these, so redirect them to the closest current content.
  "/us-tax-guide.html": "/guides/gross-pay-vs-take-home-pay/",
  "/uk-tax-guide.html": "/guides/",
  "/canada-tax-guide.html": "/guides/",
  "/global-tax-guide.html": "/calculators/",
  "/about.html": "/about/",
  "/contact.html": "/contact/",
  "/privacy-policy.html": "/privacy/",
};
