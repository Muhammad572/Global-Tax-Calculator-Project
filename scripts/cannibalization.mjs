/** F4: near-duplicate / heading-overlap check for the pages most at risk. */
import { readFileSync } from "node:fs";

const DIST = new URL("../dist/", import.meta.url).pathname;
const read = (u) => readFileSync(DIST + "calculators/" + u + "/index.html", "utf8");

const GROUPS = [
  { name: "work-hours 5-way", slugs: ["time-card-calculator", "time-clock-calculator", "hours-worked-calculator", "working-hours-calculator", "time-calculator"] },
  { name: "salary/hourly pair", slugs: ["salary-to-hourly-calculator", "hourly-pay-calculator"] },
  { name: "paycheck pair", slugs: ["paycheck-calculator", "take-home-pay-calculator"] },
];

function features(html) {
  const h1 = (html.match(/<h1[^>]*>(.*?)<\/h1>/s) || [])[1]?.replace(/<[^>]+>/g, "").trim();
  const h2s = [...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/gs)].map((m) => m[1].replace(/<[^>]+>/g, "").trim());
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1];
  // primary form control labels (the "workflow fingerprint")
  const labels = [...html.matchAll(/<label[^>]*>([^<]{2,40})<\/label>/g)].map((m) => m[1].trim()).filter((l) => !/visually-hidden/.test(l));
  const bodyText = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").toLowerCase();
  return { h1, h2s, desc, labels, tokens: new Set(bodyText.split(" ").filter((w) => w.length > 4)) };
}

function jaccard(a, b) {
  const inter = [...a].filter((x) => b.has(x)).length;
  return inter / (a.size + b.size - inter);
}

for (const g of GROUPS) {
  console.log(`\n=== ${g.name} ===`);
  const f = Object.fromEntries(g.slugs.map((s) => [s, features(read(s))]));
  for (const s of g.slugs) {
    console.log(`  ${s}`);
    console.log(`    H1: ${f[s].h1}`);
    console.log(`    H2s: ${f[s].h2s.join(" | ")}`);
  }
  console.log("  pairwise body-text similarity (Jaccard on 5+ char tokens; >0.6 = concern):");
  for (let i = 0; i < g.slugs.length; i++)
    for (let j = i + 1; j < g.slugs.length; j++) {
      const sim = jaccard(f[g.slugs[i]].tokens, f[g.slugs[j]].tokens);
      const flag = sim > 0.6 ? "  <-- REVIEW" : "";
      console.log(`    ${g.slugs[i]}  vs  ${g.slugs[j]}:  ${sim.toFixed(2)}${flag}`);
    }
  // H2 overlap
  for (let i = 0; i < g.slugs.length; i++)
    for (let j = i + 1; j < g.slugs.length; j++) {
      const shared = f[g.slugs[i]].h2s.filter((h) => f[g.slugs[j]].h2s.includes(h));
      if (shared.length) console.log(`    shared H2 (${g.slugs[i]} / ${g.slugs[j]}): ${shared.join(", ")}`);
    }
}
