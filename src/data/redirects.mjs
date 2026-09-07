/**
 * Old TinyTools / Global Tax Calculator URLs -> the closest current page.
 * Consumed by scripts/gen-redirects.mjs (writes a meta-refresh stub for each
 * into public/) and by scripts/seo-crawl.mjs (validates the targets resolve).
 * GitHub Pages has no server 301s; Google treats a meta-refresh + canonical
 * stub as a soft redirect and passes most signal. No blanket redirect to `/`.
 */
export const REDIRECTS = {
  "/calculator.html": "/calculators/take-home-pay-calculator/",
  // The old site's four country tax guides. There is no equivalent on the
  // refocused Work & Pay site (tax coverage is US-only; Canada/UK/AU are
  // "not yet supported"), so each points at the closest live content: the
  // US guide -> the gross-vs-take-home guide, the rest -> the guides hub.
  "/docs/us-tax-guide.html": "/guides/gross-pay-vs-take-home-pay/",
  "/docs/uk-tax-guide.html": "/guides/",
  "/docs/canada-tax-guide.html": "/guides/",
  "/docs/global-tax-guide.html": "/guides/",
  // The pre-redesign sitemap.xml listed the four tax guides at the site root
  // (they 404'd there even then). Old external links / crawl history may still
  // reference these, so redirect them to the closest current content.
  "/us-tax-guide.html": "/guides/gross-pay-vs-take-home-pay/",
  "/uk-tax-guide.html": "/guides/",
  "/canada-tax-guide.html": "/guides/",
  "/global-tax-guide.html": "/guides/",
  "/about.html": "/about/",
  "/contact.html": "/contact/",
  "/privacy-policy.html": "/privacy/",
};
