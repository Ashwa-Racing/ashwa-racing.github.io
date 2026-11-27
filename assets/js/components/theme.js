"use strict";

/* Follow the device appearance preference and update theme-aware logos. */
const ashwaColorScheme = window.matchMedia("(prefers-color-scheme: dark)");

function applySystemTheme() {
  document.documentElement.dataset.theme = ashwaColorScheme.matches ? "dark" : "light";
  updateBrandLogos();
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

document.addEventListener("ashwa:pagechange", () => {
  applySystemTheme();
});

ashwaColorScheme.addEventListener?.("change", applySystemTheme);
applySystemTheme();
initBrandLogoObserver();
