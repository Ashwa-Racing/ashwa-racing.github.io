"use strict";

/* ============================================================
   ASHWA RACING — theme.js
   Shared theme toggle + theme-aware brand logos, extracted from
   pages/index.js. The inline <head> script sets data-theme before
   first paint; this file only wires up the toggle.
   ============================================================ */

function initThemeToggle() {
  const button = document.getElementById("theme-toggle");
  if (!button) return;

  const root = document.documentElement;

  function updateButton(theme) {
    const isLight = theme === "light";
    button.setAttribute("aria-pressed", String(isLight));
    button.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
    updateBrandLogos();
  }

  updateButton(root.dataset.theme === "light" ? "light" : "dark");

  button.addEventListener("click", () => {
    const nextTheme = root.dataset.theme === "light" ? "dark" : "light";

    // Restart the colour-transition class (void read forces a reflow).
    root.classList.remove("theme-transition");
    void root.offsetWidth;
    root.classList.add("theme-transition");

    root.dataset.theme = nextTheme;
    try { localStorage.setItem("ashwa-theme", nextTheme); } catch (e) {}

    updateButton(nextTheme);
    setTimeout(() => root.classList.remove("theme-transition"), 500);
  });
}

/* ── Theme-aware logos: foo.svg -> foo-light.svg in light mode ── */
function getLightLogoUrl(url) {
  return url ? url.replace(/(\.[^./?#]+)([?#].*)?$/, "-light$1$2") : url;
}

function updateBrandLogos() {
  const isLight = document.documentElement.dataset.theme === "light";

  document.querySelectorAll(".brand-logo-img").forEach(logo => {
    const darkLogo = logo.dataset.darkLogo || logo.getAttribute("src");
    if (!darkLogo) return;
    logo.dataset.darkLogo = darkLogo;

    const useLight = isLight && !logo.dataset.lightMissing;
    const wanted = useLight ? getLightLogoUrl(darkLogo) : darkLogo;

    logo.onerror = useLight
      ? () => {
          logo.onerror = null;
          logo.dataset.lightMissing = "1"; // don't retry the 404 on every update
          logo.setAttribute("src", darkLogo);
        }
      : null;

    if (logo.getAttribute("src") !== wanted) logo.setAttribute("src", wanted);
  });
}

/* Header and footer are injected by header.js; watch just those two
   containers so their logos pick up the current theme when they appear. */
function initBrandLogoObserver() {
  const observer = new MutationObserver(updateBrandLogos);
  ["main-header", "main-footer"].forEach(id => {
    const el = document.getElementById(id);
    if (el) observer.observe(el, { childList: true, subtree: true });
  });
  updateBrandLogos();
}

initThemeToggle();
initBrandLogoObserver();
