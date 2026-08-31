/**
 * Consent banner DOM wiring. The Consent Mode bootstrap and the
 * `window.__ttConsent` API are set up inline in ConsentAndAnalytics.astro before
 * this runs; this module only shows/hides the banner and records the choice.
 */

interface ConsentApi {
  hasChoice(): boolean;
  choose(choice: "granted" | "denied"): void;
}

export function initConsent(): void {
  const banner = document.getElementById("tt-consent");
  if (!banner) return;

  const api = (window as unknown as { __ttConsent?: ConsentApi }).__ttConsent;

  const show = () => {
    banner.hidden = false;
  };
  const hide = () => {
    banner.hidden = true;
  };

  // Show on first visit (or if the inline API failed to load, still show it so
  // the visitor can dismiss it).
  if (!api || !api.hasChoice()) show();

  banner.addEventListener("click", (e) => {
    const btn = (e.target as Element | null)?.closest<HTMLButtonElement>("[data-consent-choice]");
    if (!btn) return;
    const choice = btn.dataset.consentChoice === "granted" ? "granted" : "denied";
    try {
      api?.choose(choice);
    } catch {
      /* even if analytics wiring throws, still dismiss the banner */
    }
    hide();
  });

  // Footer "Cookie settings" link re-opens the banner.
  document.addEventListener("click", (e) => {
    const trigger = (e.target as Element | null)?.closest("[data-open-consent]");
    if (!trigger) return;
    e.preventDefault();
    show();
  });
}
