/**
 * Old TinyTools / Global Tax Calculator URLs -> the closest current page.
 * Consumed by scripts/gen-redirects.mjs (writes a meta-refresh stub for each
 * into public/) and by scripts/seo-crawl.mjs (validates the targets resolve).
 * GitHub Pages has no server 301s; Google treats a meta-refresh + canonical
 * stub as a soft redirect and passes most signal. No blanket redirect to `/`.
 * A value is either the target path, or `{ to, strict }` / `{ to, soft }` (see below).
 */
export const REDIRECTS = {
  "/calculator.html": "/calculators/paycheck-calculator/",
  // The old site's four country tax guides. There is no equivalent on the
  // refocused Work & Pay site (tax coverage is US-only; Canada/UK/AU are
  // "not yet supported"), so each points at the closest live content: the
  // US guide -> the gross-vs-take-home guide, the rest -> the guides hub.
  "/docs/us-tax-guide.html": "/guides/gross-pay-vs-take-home-pay/",
  "/docs/uk-tax-guide.html": "/guides/",
  "/docs/canada-tax-guide.html": "/guides/",
  "/docs/global-tax-guide.html": "/guides/",
  // Search Console has this crawled (Aug 2026) though it was never a file in
  // the old repo — an external or mistyped link to the /docs/*-tax-*.html set.
  // Send it to the guides hub like its siblings rather than leaving a 404.
  "/docs/global-tax-comparison.html": "/guides/",
  // The pre-redesign sitemap.xml listed the four tax guides at the site root
  // (they 404'd there even then). Old external links / crawl history may still
  // reference these, so redirect them to the closest current content.
  "/us-tax-guide.html": "/guides/gross-pay-vs-take-home-pay/",
  "/uk-tax-guide.html": "/guides/",
  "/canada-tax-guide.html": "/guides/",
  "/global-tax-guide.html": "/guides/",
  "/global-tax-comparison.html": "/guides/",
  "/about.html": "/about/",
  "/contact.html": "/contact/",
  "/privacy-policy.html": "/privacy/",
  // Search Console shows meaningful impressions ("salary to hourly" 113,
  // "salary to hourly calculator" 53) landing on this 404. No separate
  // "hourly to salary" calculator exists or should exist — the Salary to
  // Hourly Calculator is bidirectional (it has a Hourly -> annual salary
  // mode). Redirect instead of building a duplicate tool.
  //
  // `strict: true` emits the meta refresh exactly as Google documents it —
  // absolute target URL, no whitespace after the semicolon. This URL was
  // crawled by Googlebot (Sep 20) while serving the relative/spaced form and
  // Search Console reported "Redirect error", so it gets the strictest form.
  // Other stubs are left untouched.
  //
  // Update (Oct 2026): even the strict form kept failing Search Console
  // validation ("Redirect error", crawled Oct 1, validation failed Oct 5), so
  // this one URL is now `soft`: an ordinary 200 page with a canonical to the
  // target, a visible link and a script redirect — no meta refresh for Google
  // to mis-classify.
  "/calculators/hourly-to-salary-calculator/": {
    to: "/calculators/salary-to-hourly-calculator/",
    soft: true,
  },
  // Oct 2026 consolidation (AdSense "low value content" remediation): two
  // calculators overlapped a sibling closely enough to be near-duplicate
  // pages, so each was folded into that sibling. Strict form, as above.
  //  - Working Hours (schedule -> week/month/year, PTO, FTE) now lives on the
  //    Hours Worked page as its second calculator.
  //  - Take-Home Pay (annual salary -> take-home) is now the Paycheck
  //    Calculator's "An annual salary" mode.
  "/calculators/working-hours-calculator/": {
    to: "/calculators/hours-worked-calculator/",
    strict: true,
  },
  "/calculators/take-home-pay-calculator/": {
    to: "/calculators/paycheck-calculator/",
    strict: true,
  },
};
