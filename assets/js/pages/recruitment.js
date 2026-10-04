"use strict";

/* ============================================================
   CONFIG
   ============================================================ */

const RECRUITMENT = {
  isOpen: true,
  formURL: "https://forms.gle/hrbQxbTiwtwteNa18"
};

const SITE_READY_TIMEOUT = 12000;
const prefersReducedMotion =
  matchMedia("(prefers-reduced-motion: reduce)").matches;


/* ============================================================
   THEME
   ============================================================ */

function getLightLogoUrl(url) {
  return url
    ? url.replace(/(\.[^./?#]+)([?#].*)?$/, "-light$1$2")
    : url;
}

function updateBrandLogos() {
  const isLight = document.documentElement.dataset.theme === "light";

  document.querySelectorAll(".brand-logo-img").forEach(logo => {
    const darkLogo =
      logo.dataset.darkLogo || logo.getAttribute("src");

    if (!darkLogo) return;

    logo.dataset.darkLogo = darkLogo;

    const wanted =
      isLight && !logo.dataset.lightMissing
        ? getLightLogoUrl(darkLogo)
        : darkLogo;

    logo.onerror = isLight
      ? () => {
          logo.onerror = null;
          logo.dataset.lightMissing = "1";
          logo.setAttribute("src", darkLogo);
        }
      : null;

    if (logo.getAttribute("src") !== wanted) {
      logo.setAttribute("src", wanted);
    }
  });
}

function initThemeToggle() {
  const button = document.getElementById("theme-toggle");
  if (!button) return;

  const root = document.documentElement;

  function updateButton(theme) {
    const isLight = theme === "light";

    button.setAttribute(
      "aria-pressed",
      String(isLight)
    );

    button.setAttribute(
      "aria-label",
      isLight
        ? "Switch to dark mode"
        : "Switch to light mode"
    );

    updateBrandLogos();
  }

  updateButton(
    root.dataset.theme === "light"
      ? "light"
      : "dark"
  );

  button.addEventListener("click", () => {
    const nextTheme =
      root.dataset.theme === "light"
        ? "dark"
        : "light";

    root.classList.remove("theme-transition");

    void root.offsetWidth;

    root.classList.add("theme-transition");
    root.dataset.theme = nextTheme;

    try {
      localStorage.setItem(
        "ashwa-theme",
        nextTheme
      );
    } catch (e) {}

    updateButton(nextTheme);

    setTimeout(
      () =>
        root.classList.remove(
          "theme-transition"
        ),
      500
    );
  });
}


/*
 * Header and footer are injected dynamically.
 * Watch only those containers for their logos.
 */
function initBrandLogoObserver() {
  const observer =
    new MutationObserver(updateBrandLogos);

  ["main-header", "main-footer"].forEach(id => {
    const element =
      document.getElementById(id);

    if (!element) return;

    observer.observe(element, {
      childList: true,
      subtree: true
    });
  });

  updateBrandLogos();
}


/* ============================================================
   RECRUITMENT STATUS
   ============================================================ */

function initRecruitmentStatus() {
  const {
    isOpen,
    formURL
  } = RECRUITMENT;

  const badge =
    document.getElementById(
      "rc-status-badge"
    );

  const button =
    document.getElementById(
      "rc-apply-btn"
    );

  if (badge) {
    badge.classList.toggle(
      "rc-status--open",
      isOpen
    );

    badge.classList.toggle(
      "rc-status--closed",
      !isOpen
    );

    const text =
      badge.querySelector(
        ".rc-status-text"
      );

    if (text) {
      text.textContent = isOpen
        ? "Recruitment Open"
        : "Recruitment Closed";
    }
  }

  if (!button) return;

  button.disabled = !isOpen;

  button.textContent = isOpen
    ? "Apply Now"
    : "Applications Closed";

  if (isOpen) {
    button.addEventListener(
      "click",
      () => {
        window.open(
          formURL,
          "_blank",
          "noopener,noreferrer"
        );
      }
    );
  }
}


/* ============================================================
   SCROLL REVEALS
   ============================================================ */

function initReveal() {
  const elements =
    document.querySelectorAll(
      ".reveal"
    );

  if (
    prefersReducedMotion ||
    !("IntersectionObserver" in window)
  ) {
    elements.forEach(el =>
      el.classList.add("visible")
    );

    return;
  }

  const observer =
    new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add(
            "visible"
          );

          observer.unobserve(
            entry.target
          );
        });
      },
      {
        threshold: 0.12,
        rootMargin:
          "0px 0px -60px"
      }
    );

  elements.forEach(el =>
    observer.observe(el)
  );
}


/* ============================================================
   STAT COUNTERS
   ============================================================ */

function animateCounter(el) {
  const target =
    Number(el.dataset.target);

  /*
   * Only change the leading text node.
   * This keeps <sup>+</sup> untouched.
   */
  const node = el.firstChild;

  if (
    !Number.isFinite(target) ||
    node?.nodeType !== Node.TEXT_NODE
  ) {
    return;
  }

  const duration = 1200;
  const start = performance.now();

  function tick(now) {
    const progress =
      Math.min(
        (now - start) / duration,
        1
      );

    const eased =
      progress === 1
        ? 1
        : 1 -
          Math.pow(
            2,
            -10 * progress
          );

    node.textContent =
      Math.round(
        target * eased
      );

    if (progress < 1) {
      requestAnimationFrame(
        tick
      );
    }
  }

  node.textContent = "0";

  requestAnimationFrame(tick);
}

function initStatCounters() {
  const counters =
    document.querySelectorAll(
      "[data-target]"
    );

  if (
    prefersReducedMotion ||
    !("IntersectionObserver" in window)
  ) {
    return;
  }

  const observer =
    new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) {
            return;
          }

          animateCounter(
            entry.target
          );

          observer.unobserve(
            entry.target
          );
        });
      },
      {
        threshold: 0.5
      }
    );

  counters.forEach(el =>
    observer.observe(el)
  );
}


/* ============================================================
   INIT
   ============================================================ */

function waitForSiteReady() {
  if (window.__siteReady) {
    return Promise.resolve();
  }

  return new Promise(resolve => {
    window.addEventListener(
      "site:ready",
      resolve,
      { once: true }
    );

    /*
     * Fallback in case the shared
     * loader fails or is unavailable.
     */
    setTimeout(
      resolve,
      SITE_READY_TIMEOUT
    );
  });
}

async function initRecruitment() {
  initThemeToggle();
  initBrandLogoObserver();
  initRecruitmentStatus();

  await waitForSiteReady();

  initReveal();
  initStatCounters();
}


/* ============================================================
   DOM READY
   ============================================================ */

if (
  document.readyState === "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    initRecruitment,
    { once: true }
  );
} else {
  initRecruitment();
}