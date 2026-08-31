import puppeteer from "puppeteer-core";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve("axe-core"), "utf8");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:4400";

const CASES = [
  {
    name: "time-card",
    url: "/calculators/time-card-calculator/",
    invalid: async (p) => { await p.type("#Mons", "9:00 AM"); await p.click("[data-action='calculate']"); },
    valid: async (p) => { await p.type("#Mone", "5:00 PM"); await p.click("[data-action='calculate']"); },
  },
  {
    name: "overtime",
    url: "/calculators/overtime-calculator/",
    invalid: async (p) => { await p.type("#total", "45"); await p.click("[data-action='calculate']"); },
    valid: async (p) => { await p.type("#rate", "20"); await p.click("[data-action='calculate']"); },
  },
  {
    name: "paycheck",
    url: "/calculators/paycheck-calculator/",
    invalid: async (p) => { await p.select("#state", "CA"); await p.click("[data-action='calculate']"); },
    valid: async (p) => { await p.type("#gross", "2500"); await p.click("[data-action='calculate']"); },
  },
];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
let totalViolations = 0;

for (const c of CASES) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true });
  await page.goto(BASE + c.url, { waitUntil: "networkidle0" });
  await page.evaluate(axeSource);

  const runAxe = () =>
    page.evaluate(async () => {
      const r = await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] });
      return r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help }));
    });

  const initial = await runAxe();

  await c.invalid(page);
  await page.waitForSelector("[data-errors]:not([hidden])", { timeout: 3000 }).catch(() => {});
  const errState = await runAxe();
  const errRole = await page.$eval("[data-errors]", (el) => el.getAttribute("role"));
  const errHidden = await page.$eval("[data-errors]", (el) => el.hidden);

  await c.valid(page);
  await page.waitForSelector("[data-result]:not([hidden])", { timeout: 3000 }).catch(() => {});
  const okState = await runAxe();
  const resRole = await page.$eval("[data-result]", (el) => el.getAttribute("role"));
  const resLive = await page.$eval("[data-result]", (el) => el.getAttribute("aria-live"));

  // keyboard: can we Tab from the first field to the calculate button and activate?
  const kb = await page.evaluate(() => {
    const form = document.querySelector("[data-calc] form");
    const focusables = [...form.querySelectorAll("input,select,textarea,button")].filter((e) => !e.disabled && e.offsetParent !== null);
    return { count: focusables.length, hasSubmit: !!form.querySelector("[data-action='calculate']") };
  });

  const all = [...initial, ...errState, ...okState];
  totalViolations += all.length;
  console.log(`\n=== ${c.name} (${c.url}) ===`);
  console.log(`  errors region: role=${errRole} hidden-after-invalid=${errHidden}`);
  console.log(`  result region: role=${resRole} aria-live=${resLive}`);
  console.log(`  keyboard: ${kb.count} focusable controls, submit button present=${kb.hasSubmit}`);
  if (all.length === 0) console.log("  axe: 0 violations (initial + error state + result state)");
  else all.forEach((v) => console.log(`  axe [${v.impact}] ${v.id} x${v.nodes} — ${v.help}`));
  await page.close();
}

await browser.close();
console.log(`\nTOTAL axe violations across all pages/states: ${totalViolations}`);
process.exit(totalViolations > 0 ? 1 : 0);
