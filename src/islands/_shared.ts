/**
 * Small shared helpers for calculator islands. No framework — plain DOM.
 * Every calculator page server-renders a working <form>; these helpers wire the
 * live calculation, result rendering, URL-state sharing, and copy/print/share.
 */

import { formatMoney, type Cents } from "@tinytools/calc";

export const money = (c: Cents): string => formatMoney(c);

/** Query a required element, throwing a clear error if the markup is wrong. */
export function must<T extends Element = HTMLElement>(root: ParentNode, selector: string): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`island: missing element "${selector}"`);
  return el;
}

export function maybe<T extends Element = HTMLElement>(root: ParentNode, selector: string): T | null {
  return root.querySelector<T>(selector);
}

/** Read all named form controls as a string map (checkboxes -> "on"/""). */
export function formValues(form: HTMLFormElement): Record<string, string> {
  const out: Record<string, string> = {};
  for (const el of Array.from(form.elements)) {
    const input = el as HTMLInputElement | HTMLSelectElement;
    if (!input.name) continue;
    if (input instanceof HTMLInputElement && (input.type === "checkbox" || input.type === "radio")) {
      if (input.checked) out[input.name] = input.value || "on";
      else if (!(input.name in out)) out[input.name] = "";
    } else {
      out[input.name] = input.value;
    }
  }
  return out;
}

export function num(v: string | undefined | null, fallback = 0): number {
  if (v == null || v.trim() === "") return fallback;
  const n = Number(v.replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? n : fallback;
}

/* ------------------------------------------------------------------ URL state */

/**
 * Two-way bind selected fields to the query string so a result is shareable.
 * On load, hydrate the form from the URL. Call `writeUrl` after each calc.
 */
export function hydrateFromUrl(form: HTMLFormElement, keys: string[]): void {
  const params = new URLSearchParams(location.search);
  let touched = false;
  for (const key of keys) {
    if (!params.has(key)) continue;
    const field = form.elements.namedItem(key);
    const value = params.get(key) ?? "";
    if (field instanceof HTMLInputElement) {
      if (field.type === "checkbox") field.checked = value === "1" || value === "true";
      else field.value = value;
      touched = true;
    } else if (field instanceof HTMLSelectElement) {
      field.value = value;
      touched = true;
    }
  }
  if (touched) form.dataset.hydrated = "1";
}

export function writeUrl(form: HTMLFormElement, keys: string[]): void {
  const params = new URLSearchParams();
  for (const key of keys) {
    const field = form.elements.namedItem(key);
    if (field instanceof HTMLInputElement) {
      if (field.type === "checkbox") {
        if (field.checked) params.set(key, "1");
      } else if (field.value.trim() !== "") {
        params.set(key, field.value.trim());
      }
    } else if (field instanceof HTMLSelectElement && field.value) {
      params.set(key, field.value);
    }
  }
  const qs = params.toString();
  const url = qs ? `${location.pathname}?${qs}` : location.pathname;
  history.replaceState(null, "", url);
}

/* -------------------------------------------------------------- result render */

export interface ResultRow {
  label: string;
  value: string;
  /** visual weight */
  emphasis?: "total" | "positive" | "muted" | "warn";
  note?: string;
}

export function renderResult(
  container: HTMLElement,
  opts: { headline?: { label: string; value: string }; rows: ResultRow[]; notes?: string[] },
): void {
  const parts: string[] = [];
  if (opts.headline) {
    parts.push(
      `<p class="result__headline"><span>${esc(opts.headline.label)}</span><strong class="tabular">${esc(
        opts.headline.value,
      )}</strong></p>`,
    );
  }
  if (opts.rows.length) {
    parts.push('<dl class="result__rows">');
    for (const r of opts.rows) {
      const cls = r.emphasis ? ` result__row--${r.emphasis}` : "";
      parts.push(
        `<div class="result__row${cls}"><dt>${esc(r.label)}</dt><dd class="tabular">${esc(r.value)}</dd>${
          r.note ? `<p class="result__row-note">${esc(r.note)}</p>` : ""
        }</div>`,
      );
    }
    parts.push("</dl>");
  }
  if (opts.notes?.length) {
    parts.push(
      `<ul class="result__notes">${opts.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>`,
    );
  }
  container.innerHTML = parts.join("");
  container.hidden = false;
}

export function renderErrors(container: HTMLElement, messages: string[]): void {
  if (!messages.length) {
    container.hidden = true;
    container.innerHTML = "";
    return;
  }
  container.innerHTML = `<p class="result__error-title">Please check these:</p><ul>${messages
    .map((m) => `<li>${esc(m)}</li>`)
    .join("")}</ul>`;
  container.hidden = false;
}

export function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

/* ------------------------------------------------------------- action buttons */

export function wireActions(
  root: HTMLElement,
  getShareText: () => string,
): void {
  const copyBtn = maybe<HTMLButtonElement>(root, "[data-action='copy']");
  const shareBtn = maybe<HTMLButtonElement>(root, "[data-action='share']");
  const printBtn = maybe<HTMLButtonElement>(root, "[data-action='print']");

  copyBtn?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(getShareText());
      flash(copyBtn, "Copied");
    } catch {
      flash(copyBtn, "Press Ctrl+C");
    }
  });

  shareBtn?.addEventListener("click", async () => {
    const url = location.href;
    const text = getShareText();
    if (navigator.share) {
      try {
        await navigator.share({ title: document.title, text, url });
        return;
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      flash(shareBtn, "Link copied");
    } catch {
      flash(shareBtn, url);
    }
  });

  printBtn?.addEventListener("click", () => window.print());
}

function flash(btn: HTMLButtonElement, text: string): void {
  const original = btn.dataset.label ?? btn.textContent ?? "";
  if (!btn.dataset.label) btn.dataset.label = original;
  btn.textContent = text;
  window.setTimeout(() => {
    btn.textContent = btn.dataset.label ?? original;
  }, 1600);
}

/** Debounce live recalculation on input. */
export function onLiveInput(form: HTMLFormElement, handler: () => void, delay = 120): void {
  let t: number | undefined;
  const run = () => {
    window.clearTimeout(t);
    t = window.setTimeout(handler, delay);
  };
  form.addEventListener("input", run);
  form.addEventListener("change", run);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    window.clearTimeout(t);
    handler();
  });
}

/** GA4 event, safe if gtag is absent (consent denied / blocked). */
export function track(event: string, params: Record<string, unknown> = {}): void {
  const g = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
  if (typeof g === "function") g("event", event, params);
}
