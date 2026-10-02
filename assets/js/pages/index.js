"use strict";

/* ============================================================
   CONFIG
   ============================================================ */
const SPONSORS_URL = "/assets/data/sponsors.json";
const BLOG_URL     = "/assets/data/blog.json";

// Logos are shown ~60px tall, so they're resized/re-encoded at the edge
// (Cloudflare Images) instead of shipping the 360px originals.
const SPONSOR_LOGO_BASE =
  "https://assets.ashwaracing.org/cdn-cgi/image/height=120,format=auto,quality=85/images/sponsors/";
const SPONSOR_TIER_ORDER = ["executive", "platinum", "gold", "silver", "technical"];

const SITE_READY_TIMEOUT        = 12000;
const COUNT_UP_MS               = 3600;
const SPOTLIGHT_AUTO_ADVANCE_MS = 3000;

const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
// No autoplay video for reduced-motion or Data Saver visitors.
const allowVideo = !prefersReducedMotion && !navigator.connection?.saveData;

/* ============================================================
   HELPERS
   ============================================================ */
function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, c => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]
  ));
}

async function fetchJSON(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout?.(5000) });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.json();
}

/* Calls onEnter(el) once per element, the first time it scrolls into view. */
function observeOnce(elements, onEnter, options) {
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      obs.unobserve(entry.target);
      onEnter(entry.target);
    });
  }, options);
  elements.forEach(el => io.observe(el));
}

/* Data fetches start immediately so they're usually done by init time. */
const sponsorsReady = fetchJSON(SPONSORS_URL)
  .then(data => SPONSOR_TIER_ORDER.flatMap(tier => data[tier] || []))
  .catch(err => { console.error(err); return []; });

/* Resolves when loader.js releases the page (or after a fallback delay if
   loader.js is missing/broken) so animations don't run behind the overlay. */
const siteReady = new Promise(resolve => {
  if (window.__siteReady) return resolve();
  document.addEventListener("site:ready", resolve, { once: true });
  setTimeout(resolve, SITE_READY_TIMEOUT);
});

/* ============================================================
   THEME
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

    // Don't leave the transition class on permanently, or every later
    // hover/state change on the page inherits it.
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

    // Re-setting an identical src would re-trigger an image load.
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

/* ============================================================
   BACKGROUND VIDEO
   ============================================================ */
function initBgVideo(video) {
  if (!video || !allowVideo) return;

  const reveal = () => {
    video.classList.add("is-loaded");
    video.closest(".hero")?.classList.add("has-video"); // pauses the poster zoom
  };

  if (video.readyState >= 3) reveal();
  else video.addEventListener("canplay", reveal, { once: true });

  video.play()?.catch(() => video.removeEventListener("canplay", reveal));
}

/* ============================================================
   CAR SPOTLIGHT (EV / CV)
   Only the visible car's video decodes. Nothing starts until the
   section scrolls into view.
   ============================================================ */
function initSpotlightToggle() {
  const section = document.getElementById("car-spotlight");
  if (!section) return;

  const buttons  = section.querySelectorAll(".spotlight-toggle-btn");
  const layers   = section.querySelectorAll(".spotlight-bg-layer");
  const contents = section.querySelectorAll(".spotlight-content");

  let autoAdvanceTimer = null;
  let touched = false;

  function setActive(car) {
    section.dataset.active = car;
    section.classList.toggle("spotlight--ev", car === "ev");

    buttons.forEach(btn => {
      const on = btn.dataset.car === car;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", String(on));
    });

    layers.forEach(layer => {
      const on = layer.dataset.car === car;
      layer.classList.toggle("is-active", on);
      const video = layer.querySelector(".spotlight-bg-video");
      if (!video) return;
      if (on) initBgVideo(video);
      else video.pause();
    });

    contents.forEach(content => {
      const on = content.dataset.car === car;
      content.classList.toggle("is-active", on);
      content.inert = !on; // keep the hidden panel's links out of the tab order
    });
  }

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      touched = true;
      clearTimeout(autoAdvanceTimer);
      setActive(btn.dataset.car);
    });
  });

  // First time the section is actually seen: start the active video and
  // give a one-off nudge over to CV (never if the visitor already toggled).
  observeOnce([section], () => {
    initBgVideo(section.querySelector(".spotlight-bg-layer.is-active .spotlight-bg-video"));
    if (prefersReducedMotion || touched) return;
    autoAdvanceTimer = setTimeout(() => {
      if (section.dataset.active === "ev") setActive("cv");
    }, SPOTLIGHT_AUTO_ADVANCE_MS);
  }, { threshold: 0.4 });
}

/* ============================================================
   SPONSOR STRIP
   ============================================================ */
function sponsorLogoUrl(sponsor) {
  const logo = sponsor?.logo || "";
  return /^(https?:)?\/\//i.test(logo) ? logo : SPONSOR_LOGO_BASE + logo;
}

function sponsorCardHTML(sponsor, isDuplicate) {
  const dup = isDuplicate ? ' aria-hidden="true" data-dup' : "";

  // Eager on purpose: the marquee width depends on every logo's size, and
  // lazy-loading would make the loop jump as images arrive.
  const img = `<img src="${escapeHTML(sponsorLogoUrl(sponsor))}" alt="${escapeHTML(sponsor.name)}" loading="eager" fetchpriority="low" decoding="async" width="360" height="360">`;

  // No website (missing or "#") -> plain card instead of a dead link.
  if (!sponsor.url || sponsor.url === "#") {
    return `<div class="sp-card"${dup}>${img}</div>`;
  }

  const tab = isDuplicate ? ' tabindex="-1"' : "";
  return `<a href="${escapeHTML(sponsor.url)}" target="_blank" rel="noopener" class="sp-card"${dup}${tab}>${img}</a>`;
}

function renderSponsorStrip(sponsors) {
  const track = document.getElementById("sponsor-track");
  if (!track || !sponsors.length) return;

  // The list is rendered twice for the seamless loop; the second copy is
  // hidden from assistive tech and the tab order.
  track.innerHTML =
    sponsors.map(s => sponsorCardHTML(s, false)).join("") +
    sponsors.map(s => sponsorCardHTML(s, true)).join("");
}

/* ============================================================
   SCROLL REVEAL
   Each group staggers from 0, and reveal styles are removed once
   finished so they don't leave transition delays on hover states.
   ============================================================ */
function initReveal() {
  if (prefersReducedMotion) return;

  const groups = [
    ".stat-bar-grid .stat",
    ".spotlight-toggle, .spotlight-content > *:not(h2)",
    ".news-grid .news-card"
  ];

  const items = groups.flatMap(selector =>
    [...document.querySelectorAll(selector)].map((el, i) => {
      el.classList.add("reveal");
      el.style.transitionDelay = `${Math.min(i * 0.08, 0.4)}s`;
      return el;
    })
  );

  observeOnce(items, el => {
    const delay = parseFloat(el.style.transitionDelay) || 0;
    el.classList.add("reveal-visible");
    setTimeout(() => {
      el.classList.remove("reveal", "reveal-visible");
      el.style.transitionDelay = "";
    }, (delay + 0.7) * 1000 + 50);
  }, { threshold: 0.12, rootMargin: "0px 0px -40px" });
}

/* Heading line-mask reveal: text slides up from behind a hard edge. */
function initMaskReveal() {
  if (prefersReducedMotion) return;

  const targets = document.querySelectorAll(".spotlight-content h2, .news .container > h2");

  targets.forEach(el => {
    el.classList.add("reveal-mask");
    el.innerHTML = `<span class="reveal-mask-inner">${el.innerHTML}</span>`;
  });

  observeOnce(targets, el => el.classList.add("reveal-visible"),
    { threshold: 0.3, rootMargin: "0px 0px -60px" });
}

/* ============================================================
   STAT COUNTERS
   The HTML holds the real numbers (works without JS); they're zeroed
   while the loader is still up, then counted up when scrolled into view.
   ============================================================ */
function prepareStatCounters() {
  if (prefersReducedMotion) return;
  document.querySelectorAll(".stat-num[data-count]").forEach(el => { el.textContent = "0"; });
}

function initStatCounters() {
  if (prefersReducedMotion) return;

  observeOnce(document.querySelectorAll(".stat-num[data-count]"), el => {
    const target = parseInt(el.dataset.count, 10) || 0;
    const suffix = el.dataset.suffix || "";
    const start = performance.now();

    (function step(now) {
      const progress = Math.min((now - start) / COUNT_UP_MS, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    })(start);
  }, { threshold: 0.5 });
}

/* ============================================================
   HOMEPAGE BLOG PREVIEW
   ============================================================ */
function parseBlogDate(date) {
  // Accepts YYYY, YYYY-MM or YYYY-MM-DD.
  const m = String(date || "").trim().match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/);
  if (!m) return null;
  const [, year, month = "01", day = "01"] = m;
  const parsed = new Date(`${year}-${month}-${day}T00:00:00`);
  return isNaN(parsed) ? null : parsed;
}

function formatBlogDate(date) {
  const value = String(date || "").trim();
  const parsed = parseBlogDate(value);
  if (!parsed || /^\d{4}$/.test(value)) return value;

  const options = /^\d{4}-\d{2}$/.test(value)
    ? { month: "long", year: "numeric" }
    : { day: "numeric", month: "long", year: "numeric" };

  return new Intl.DateTimeFormat("en-IN", options).format(parsed);
}

function blogDateValue(date) {
  return parseBlogDate(date)?.getTime() ?? 0;
}

function blogCardHTML(post) {
  const meta = [post.category, post.date && formatBlogDate(post.date)]
    .filter(Boolean)
    .map(escapeHTML)
    .join(" · ");

  return `
    <a href="blog-post.html?post=${encodeURIComponent(post.slug)}" class="news-card">
      <div class="news-card-img-wrap">
        <img src="${escapeHTML(post.cover || "")}" alt="${escapeHTML(post.coverAlt || post.title)}" loading="lazy" decoding="async" width="600" height="400">
      </div>
      <div class="news-card-body">
        <p class="news-meta">${meta}</p>
        <h3>${escapeHTML(post.title)}</h3>
        <p class="news-excerpt">${escapeHTML(post.excerpt || "")}</p>
        <span class="btn-line">Read More</span>
      </div>
    </a>`;
}

async function initBlogPreview() {
  const grid = document.getElementById("home-blog-grid");
  if (!grid) return;

  try {
    const data = await fetchJSON(BLOG_URL, { cache: "no-cache" });
    if (!Array.isArray(data.posts)) throw new Error("Invalid blog data.");

    const posts = data.posts
      .filter(post => post && post.slug && post.title)
      .sort((a, b) => blogDateValue(b.date) - blogDateValue(a.date))
      .slice(0, 3);

    grid.innerHTML = posts.map(blogCardHTML).join("");
  } catch (error) {
    console.error("Ashwa Blog: failed to load homepage articles.", error);
    grid.innerHTML = "";
  }
}

/* ============================================================
   INIT
   ============================================================ */
async function initHome() {
  prepareStatCounters();

  // Fetch the blog now, but only render/reveal once the loader lifts.
  const blogReady = initBlogPreview();

  renderSponsorStrip(await sponsorsReady);

  await siteReady;

  // Hero loops have been playing behind the overlay; restart them.
  document.querySelectorAll(".hero-video").forEach(video => {
    try { video.currentTime = 0; } catch (e) {}
  });

  // Blog cards must exist before initReveal() goes looking for them.
  await blogReady;

  initReveal();
  initMaskReveal();
  initStatCounters();
  initSpotlightToggle();
}

function start() {
  initThemeToggle();
  initBrandLogoObserver();
  document.querySelectorAll(".hero-video").forEach(initBgVideo);
  initHome();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start, { once: true });
} else {
  start();
}