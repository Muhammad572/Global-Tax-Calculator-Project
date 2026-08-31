/** Site-wide configuration. Public IDs only — nothing secret. */

export const SITE = {
  name: "TinyTools",
  descriptor: "Work Hours & Pay Calculators",
  tagline: "Fast, clear calculators for hours, overtime, and pay.",
  url: "https://tinytools.live",
  locale: "en",
  /** Reused from the previous site — see planning/phase-a-report.md. */
  ga4Id: "G-4GTPKLDCL7",
  /**
   * AdSense publisher ID. Present so slots are ready; **approval is NOT
   * confirmed** and no ad units render until (a) a slot id is configured below
   * and (b) the visitor has consented. See planning/phase-a-report.md B3.
   */
  adsensePublisherId: "ca-pub-8653293678103388",
  /**
   * When true, loads adsbygoogle.js site-wide (no ad units) so the AdSense
   * crawler sees the live ad code during review.
   *
   * Kept FALSE by default: loading it makes Google probe for ad-serving
   * capability (a `test_cookie` on googleads.g.doubleclick.net), which drops
   * Lighthouse Best Practices 100 -> ~77 and Performance ~99 -> ~96 on every
   * page. Site ownership is already declared to AdSense two other ways — the
   * `<meta name="google-adsense-account">` tag (added in BaseLayout) and the
   * matching publisher id in /ads.txt — which is enough to add the site in the
   * AdSense dashboard. Flip this to true and redeploy only if a specific review
   * step asks for the live ad script; it is a one-line change.
   */
  adsenseVerification: false as boolean,
  adsenseEnabled: false as boolean,
  /** Per-placement AdSense slot ids. Empty => that placement renders nothing. */
  adSlots: {
    "top-leaderboard": "",
    "in-content": "",
    "below-result": "",
    sidebar: "",
    footer: "",
  } as Record<string, string>,
  org: {
    email: "hello@tinytools.live",
    description:
      "TinyTools builds free, accurate calculators that help people work out hours worked, overtime, and take-home pay — for the US, Canada, the UK, and Australia.",
  },
  markets: ["United States", "Canada", "United Kingdom", "Australia"],
} as const;

export type NavItem = { label: string; href: string };

export const PRIMARY_NAV: NavItem[] = [
  { label: "Calculators", href: "/calculators/" },
  { label: "Guides", href: "/guides/" },
  { label: "About", href: "/about/" },
];

export const FOOTER_LEGAL: NavItem[] = [
  { label: "Privacy Policy", href: "/privacy/" },
  { label: "Terms of Use", href: "/terms/" },
  { label: "Disclaimer", href: "/disclaimer/" },
  { label: "Contact", href: "/contact/" },
];
