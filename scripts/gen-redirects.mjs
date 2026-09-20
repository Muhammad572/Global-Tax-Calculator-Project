/**
 * Generate meta-refresh redirect stubs in public/ from src/data/redirects.ts.
 * Wired into the `build` npm script so it runs before `astro build`.
 */
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { REDIRECTS } from "../src/data/redirects.mjs";

const SITE = "https://tinytools.live";
const PUBLIC = new URL("../public/", import.meta.url).pathname;
const MARKER = join(PUBLIC, ".redirects-generated.json");

// A "from" key is either a legacy flat file (e.g. /calculator.html) or a
// directory-style route matching the site's trailingSlash:"always" convention
// (e.g. /calculators/hourly-to-salary-calculator/), which GitHub Pages serves
// via that directory's index.html.
const filePath = (from) => join(PUBLIC, (from.endsWith("/") ? from + "index.html" : from).replace(/^\//, ""));

// Remove previously generated stubs so a deleted mapping doesn't linger.
if (existsSync(MARKER)) {
  try {
    for (const p of JSON.parse(readFileSync(MARKER, "utf8"))) {
      rmSync(filePath(p), { force: true });
    }
  } catch {
    /* ignore */
  }
}

// An instant meta-refresh + self-consistent canonical is what Google treats as
// a (soft) permanent redirect, so old-URL ranking signal is consolidated onto
// the new page. Do NOT add `<meta name="robots" content="noindex">` here: on a
// redirecting page it is a contradictory signal that makes Search Console list
// the URL under "Excluded by 'noindex' tag" and can stop equity from passing.
const stub = (to) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Page moved — TinyTools</title>
<link rel="canonical" href="${SITE}${to}">
<meta http-equiv="refresh" content="0; url=${to}">
</head>
<body>
<p>This page has moved. If you are not redirected,
<a href="${to}">continue to its new location</a>.</p>
</body>
</html>
`;

const written = [];
for (const [from, to] of Object.entries(REDIRECTS)) {
  const dest = filePath(from);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, stub(to));
  written.push(from);
}
writeFileSync(MARKER, JSON.stringify(written, null, 2));
console.log(`Generated ${written.length} redirect stubs in public/:`);
for (const w of written) console.log(`  ${w} -> ${REDIRECTS[w]}`);
