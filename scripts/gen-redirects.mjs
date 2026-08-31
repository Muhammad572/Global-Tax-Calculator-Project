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

// Remove previously generated stubs so a deleted mapping doesn't linger.
if (existsSync(MARKER)) {
  try {
    for (const p of JSON.parse(readFileSync(MARKER, "utf8"))) {
      rmSync(join(PUBLIC, p.replace(/^\//, "")), { force: true });
    }
  } catch {
    /* ignore */
  }
}

const stub = (to) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Page moved — TinyTools</title>
<link rel="canonical" href="${SITE}${to}">
<meta name="robots" content="noindex, follow">
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
  const dest = join(PUBLIC, from.replace(/^\//, ""));
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, stub(to));
  written.push(from);
}
writeFileSync(MARKER, JSON.stringify(written, null, 2));
console.log(`Generated ${written.length} redirect stubs in public/:`);
for (const w of written) console.log(`  ${w} -> ${REDIRECTS[w]}`);
