/**
 * Static SEO crawl of the built site (dist/). Checks the F3/F4 gate:
 * one H1, unique titles/descriptions, canonical correctness, internal links
 * resolve, JSON-LD parses, OG/Twitter present, sitemap matches reality,
 * robots.txt sane, noindex only where intended.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const DIST = new URL("../dist/", import.meta.url).pathname;
const SITE = "https://tinytools.live";

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.name.endsWith(".html")) out.push(p);
  }
  return out;
}

const files = walk(DIST);
const pages = files.map((f) => {
  const html = readFileSync(f, "utf8");
  const rel = "/" + relative(DIST, f).replace(/index\.html$/, "").replace(/\\/g, "/");
  const url = rel === "/404.html" ? "/404" : rel;
  const get = (re) => (html.match(re) || [])[1];
  const all = (re) => [...html.matchAll(re)].map((m) => m[1]);
  return {
    file: relative(DIST, f),
    url,
    html,
    title: get(/<title>([^<]*)<\/title>/),
    description: get(/<meta name="description" content="([^"]*)"/),
    canonical: get(/<link rel="canonical" href="([^"]*)"/),
    h1s: all(/<h1[^>]*>(.*?)<\/h1>/gs).map((s) => s.replace(/<[^>]+>/g, "").trim()),
    robots: get(/<meta name="robots" content="([^"]*)"/),
    og: {
      title: get(/<meta property="og:title" content="([^"]*)"/),
      desc: get(/<meta property="og:description" content="([^"]*)"/),
      url: get(/<meta property="og:url" content="([^"]*)"/),
      type: get(/<meta property="og:type" content="([^"]*)"/),
    },
    twitter: get(/<meta name="twitter:card" content="([^"]*)"/),
    jsonld: all(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs),
    links: all(/<a[^>]+href="(\/[^"#?]*)"/g),
  };
});

const indexable = pages.filter((p) => p.url !== "/404" && !(p.robots || "").includes("noindex"));
const problems = [];
const warn = [];

// 1. exactly one H1 (indexable pages only — redirect stubs and /404 have none)
for (const p of indexable) {
  if (p.h1s.length !== 1) problems.push(`${p.url}: ${p.h1s.length} <h1> (expected 1) — ${JSON.stringify(p.h1s)}`);
}

// 2. unique titles + descriptions (indexable only)
const byTitle = {};
const byDesc = {};
for (const p of indexable) {
  if (!p.title) problems.push(`${p.url}: missing <title>`);
  else (byTitle[p.title] ||= []).push(p.url);
  if (!p.description) problems.push(`${p.url}: missing meta description`);
  else (byDesc[p.description] ||= []).push(p.url);
}
for (const [t, urls] of Object.entries(byTitle)) if (urls.length > 1) problems.push(`Duplicate <title> "${t}": ${urls.join(", ")}`);
for (const [d, urls] of Object.entries(byDesc)) if (urls.length > 1) problems.push(`Duplicate description: ${urls.join(", ")}`);

// 3. canonical correctness — self-referential for indexable pages; for noindex
//    redirect stubs the canonical + meta-refresh must point at a real page.
const indexableUrls = new Set(indexable.map((p) => p.url));
for (const p of indexable) {
  const expected = SITE + p.url;
  if (!p.canonical) problems.push(`${p.url}: no canonical`);
  else if (p.canonical !== expected) problems.push(`${p.url}: canonical is ${p.canonical} (expected ${expected})`);
}
for (const p of pages) {
  if (p.url === "/404" || indexableUrls.has(p.url)) continue;
  // redirect stub
  const refresh = (p.html.match(/http-equiv="refresh" content="0;\s*url=([^"]+)"/) || [])[1];
  const target = (p.canonical || "").replace(SITE, "");
  if (!refresh) problems.push(`${p.url}: noindex page with no meta-refresh (unexpected stub)`);
  if (refresh && !indexableUrls.has(refresh)) problems.push(`${p.url}: redirect target ${refresh} is not a live page`);
  if (target && !indexableUrls.has(target)) problems.push(`${p.url}: stub canonical ${target} is not a live page`);
  if (refresh && p.canonical && refresh !== target) problems.push(`${p.url}: meta-refresh (${refresh}) != canonical (${target})`);
}

// 4. OG + twitter present on indexable
for (const p of indexable) {
  if (!p.og.title || !p.og.url || !p.og.type) problems.push(`${p.url}: incomplete Open Graph`);
  if (p.og.url && p.og.url !== SITE + p.url) problems.push(`${p.url}: og:url ${p.og.url} != canonical`);
  if (!p.twitter) warn.push(`${p.url}: no twitter:card`);
}

// 5. JSON-LD parses + has @type
for (const p of pages) {
  for (const raw of p.jsonld) {
    try {
      const obj = JSON.parse(raw);
      if (!obj["@type"] && !obj["@graph"]) warn.push(`${p.url}: JSON-LD without @type`);
    } catch (e) {
      problems.push(`${p.url}: invalid JSON-LD — ${e.message}`);
    }
  }
}

// 6. internal links resolve
const urlSet = new Set(pages.map((p) => p.url));
const staticFiles = new Set(["/robots.txt", "/sitemap-index.xml", "/sitemap-0.xml", "/favicon.svg", "/ads.txt", "/CNAME"]);
for (const p of pages) {
  for (const l of new Set(p.links)) {
    const norm = l.endsWith("/") || l.includes(".") ? l : l + "/";
    if (urlSet.has(norm) || urlSet.has(l) || staticFiles.has(l) || existsSync(join(DIST, l.replace(/^\//, "")))) continue;
    problems.push(`${p.url}: broken internal link -> ${l}`);
  }
}

// 7. orphan check — every indexable page linked from at least one other page
const linkedTo = new Set();
for (const p of pages) for (const l of p.links) {
  const norm = l.endsWith("/") || l.includes(".") ? l : l + "/";
  linkedTo.add(norm);
  linkedTo.add(l);
}
for (const p of indexable) {
  if (p.url === "/") continue;
  if (!linkedTo.has(p.url)) problems.push(`${p.url}: ORPHAN — not linked from any page`);
}

// 8. sitemap == indexable set
const smPath = join(DIST, "sitemap-0.xml");
if (existsSync(smPath)) {
  const sm = readFileSync(smPath, "utf8");
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const smUrls = new Set(locs.map((l) => l.replace(SITE, "")));
  const idxUrls = new Set(indexable.map((p) => p.url));
  for (const u of smUrls) if (!idxUrls.has(u)) problems.push(`sitemap has ${u} which is not an indexable page`);
  for (const u of idxUrls) if (!smUrls.has(u)) problems.push(`indexable page ${u} missing from sitemap`);
  for (const l of locs) if (!l.startsWith("https://")) problems.push(`sitemap loc not https: ${l}`);
} else problems.push("no sitemap-0.xml");

// 9. robots.txt
const robotsPath = join(DIST, "robots.txt");
if (existsSync(robotsPath)) {
  const r = readFileSync(robotsPath, "utf8");
  if (!/Sitemap:\s*https:\/\/tinytools\.live\/sitemap/i.test(r)) problems.push("robots.txt: missing/incorrect Sitemap line");
  if (/Disallow:\s*\/\s*$/m.test(r)) problems.push("robots.txt: Disallow: / would block the whole site");
} else problems.push("no robots.txt");

console.log(`Crawled ${pages.length} HTML pages, ${indexable.length} indexable.\n`);
console.log("Indexable URLs:");
for (const p of indexable.sort((a, b) => a.url.localeCompare(b.url))) console.log(`  ${p.url}`);
console.log(`\nnoindex pages: ${pages.filter((p) => (p.robots || "").includes("noindex")).map((p) => p.url).join(", ") || "(none but /404 is not emitted with meta)"}`);

if (warn.length) {
  console.log(`\n⚠  ${warn.length} warnings:`);
  warn.forEach((w) => console.log("  - " + w));
}
if (problems.length) {
  console.log(`\n✖  ${problems.length} PROBLEMS:`);
  problems.forEach((p) => console.log("  - " + p));
  process.exit(1);
}
console.log("\n✓ No critical SEO problems.");
