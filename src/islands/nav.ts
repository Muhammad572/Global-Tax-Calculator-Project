/**
 * Progressive enhancement for the header menu. The markup is a native
 * <details>/<summary> that works with no JS. This adds: close on outside click,
 * close on Escape, close on link click, close on resize to desktop, close on
 * browser back/forward, a mobile body-scroll lock, and aria-expanded sync.
 */

const MOBILE = window.matchMedia("(max-width: 47.999rem)");

export function initNav(): void {
  const nav = document.querySelector<HTMLElement>("[data-nav]");
  if (!nav) return;
  const details = nav.querySelector<HTMLDetailsElement>("details.site-nav__menu");
  const summary = nav.querySelector<HTMLElement>("summary.site-nav__toggle");
  const panel = nav.querySelector<HTMLElement>(".site-nav__panel");
  if (!details || !summary || !panel) return;

  const backdrop = nav.querySelector<HTMLElement>("[data-nav-backdrop]");
  const closeBtn = nav.querySelector<HTMLElement>("[data-nav-close]");

  const close = (returnFocus = false) => {
    if (!details.open) return;
    details.open = false;
    if (returnFocus) summary.focus();
  };

  const onDocClick = (e: MouseEvent) => {
    if (!details.open) return;
    const t = e.target as Node | null;
    if (t && !nav.contains(t)) close();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" && details.open) {
      e.preventDefault();
      close(true);
    }
  };

  // React to the <details> open/close (covers summary click, Enter, Space).
  details.addEventListener("toggle", () => {
    summary.setAttribute("aria-expanded", String(details.open));
    if (details.open) {
      document.addEventListener("click", onDocClick, true);
      document.addEventListener("keydown", onKey);
      if (MOBILE.matches) document.documentElement.style.overflow = "hidden";
      // move focus into the panel on mobile for keyboard/screen-reader users
      if (MOBILE.matches) {
        const first = panel.querySelector<HTMLElement>("a, button");
        first?.focus({ preventScroll: true });
      }
    } else {
      document.removeEventListener("click", onDocClick, true);
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    }
  });

  backdrop?.addEventListener("click", () => close());
  closeBtn?.addEventListener("click", () => close(true));

  // Close when a navigation link inside the panel is chosen.
  panel.addEventListener("click", (e) => {
    const link = (e.target as Element | null)?.closest("a");
    if (link) close();
  });

  // Close when crossing to the desktop layout (sheet -> inline dropdown).
  MOBILE.addEventListener("change", () => close());

  // Close only on an actual bfcache restore (back/forward), never on normal load.
  window.addEventListener("pageshow", (e) => {
    if ((e as PageTransitionEvent).persisted) close();
  });
}
