// const PROGRAMMES = {
//   cv:         { label: "Combustion", color: "#e8001d" },
//   hybrid:     { label: "Hybrid",     color:  "#f59e0b"},
//   ev:         { label: "Electric",   color: "#3b82f6" },
//   dv:         { label: "Driverless", color: "#00c2a8" },
//   hyperloop:  { label: "Hyperloop",  color: "#7c3aed" },
//   management: { label: "Management", color: "#6b7280" }
// };

/* ============================================================
   ASHWA RACING — pages/alumni.js
   Shared helpers come from components/utils.js. The whole file is
   wrapped so none of its names leak into header.js / loader.js.
   ============================================================ */
(() => {
"use strict";

const { prefersReducedMotion, ASSET_HOST, escapeHTML, fetchJSON, observeOnce, reveal, imgUrl } = window.Ashwa;

/* ============================================================
   CONFIG
   ============================================================ */
const TEAM_URL = "/assets/data/team.json";

// Testimonials are derived from team.json: anyone whose year is the current
// calendar year or earlier is an alumnus, and only alumni with a testimony are shown.
const MEMBER_PHOTO_BASE = `${ASSET_HOST}images/team/members/`;
const DEFAULT_PHOTO     = `${ASSET_HOST}images/team/default.webp`;

const ROLE_PRIORITY = ["Team Captain", "Chief Engineer", "Project Manager", "Subsystem Lead", "Member"];

const TESTIMONIAL_INTERVAL_MS = 1500;
const COUNT_UP_MS             = 1600;

/* ============================================================
   HELPERS
   ============================================================ */
/* Fetches start immediately (and are preloaded in the HTML), so they're
   usually done by the time the page needs them. Each fails independently. */
const teamReady = fetchJSON(TEAM_URL, {}, 8000).catch(err => { console.error(err); return null; });

/* ============================================================
   STAT COUNTERS
   The HTML holds the real numbers (works without JS); they're
   zeroed on load and counted up when scrolled into view.
   ============================================================ */
function initStatCounters() {
  if (prefersReducedMotion) return;

  const counters = document.querySelectorAll(".stat-num[data-count]");
  counters.forEach(el => { el.textContent = "0" + (el.dataset.suffix || ""); });

  observeOnce(counters, el => {
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
   ALUMNI DATA
   ============================================================ */
let ALUMNI = [];

function splitJob(currentJob) {
  if (!currentJob) return ["", ""];
  const i = currentJob.indexOf(",");
  return i === -1
    ? [currentJob.trim(), ""]
    : [currentJob.slice(0, i).trim(), currentJob.slice(i + 1).trim()];
}

// team.json entries → the shape the testimonial renderer expects
function buildAlumni(team) {
  if (!Array.isArray(team)) return [];
  const thisYear = new Date().getFullYear();

  return team
    .filter(m => Number(m.year) <= thisYear)
    .filter(m => m.testimony?.trim() || m.currentJob?.trim())
    .map(m => {
      const roles = m.roles && m.roles.length ? m.roles : ["Member"];
      const [jobPosition, jobCompany] = splitJob(m.currentJob);

      return {
        name:      m.name,
        role:      ROLE_PRIORITY.find(r => roles.includes(r)) || roles[0],
        batch:     String(m.year),
        photo:     m.photo || `${MEMBER_PHOTO_BASE}${m.year}/${encodeURIComponent(m.name)}.webp`,
        company:   m.company  || jobCompany,
        position:  m.position || jobPosition,
        testimony: (m.testimony || "").trim()
      };
    })
    .sort((a, b) =>
      Number(b.batch) - Number(a.batch) ||
      ROLE_PRIORITY.indexOf(a.role) - ROLE_PRIORITY.indexOf(b.role)
    );
}

/* One delegated handler instead of an inline onerror on every <img>. */
document.addEventListener("error", e => {
  const img = e.target;
  if (!(img instanceof HTMLImageElement) || !img.matches("[data-photo]") || img.dataset.fallback) return;
  img.dataset.fallback = "1";
  img.src = DEFAULT_PHOTO;
}, true);

/* ============================================================
   TESTIMONIALS
   A native scroll-snap track (swipe, trackpad and keyboard work for
   free) with prev/next buttons and a progress line. Cards show a portrait
   and alumni details; hovering or focusing a card reveals its testimonial.
   Autoplay steps one card at a time while the section is visible. Pointer
   hover reveals quotes without stopping rotation; focus and touch pause it.
   ============================================================ */
function testimonialCardHTML(a) {
  const where = [a.position, a.company].filter(Boolean).map(escapeHTML).join(" @ ");
  const batch = a.batch ? `Batch of ${a.batch}` : "";

  const ariaLabel = [a.name, batch, where, a.testimony && "Hover or focus to read testimonial."].filter(Boolean).map(escapeHTML).join(". ");

  return `
    <article class="testi-card${a.testimony ? " testi-card--has-quote" : ""}"${a.testimony ? ' tabindex="0"' : ""} aria-label="${ariaLabel}">
      <img class="testi-photo" src="${escapeHTML(imgUrl(a.photo, 640))}" alt="${escapeHTML(a.name)}" data-photo loading="lazy" decoding="async">
      <div class="testi-summary">
        <h3 class="testi-name">${escapeHTML(a.name)}</h3>
        ${batch ? `<span class="testi-batch">${escapeHTML(batch)}</span>` : ""}
        ${where ? `<span class="testi-where">${where}</span>` : ""}
      </div>
      ${a.testimony ? `<div class="testi-quote"><p>${escapeHTML(a.testimony)}</p></div>` : ""}
    </article>`;
}

function renderTestimonials() {
  const section  = document.getElementById("voices");
  const track    = document.getElementById("al-testi-track");
  const controls = document.getElementById("al-testi-controls");
  const bar      = document.getElementById("al-testi-bar");
  const prevBtn  = document.getElementById("al-testi-prev");
  const nextBtn  = document.getElementById("al-testi-next");
  if (!section || !track || !controls || !bar || !prevBtn || !nextBtn) return;

  const list = ALUMNI;
  if (!list.length) {
    section.hidden = true;
    return;
  }

  track.innerHTML = list.map(testimonialCardHTML).join("");
  const cards = [...track.querySelectorAll(".testi-card")];
  const makeClones = () => cards.map(card => {
    const clone = card.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    clone.removeAttribute("tabindex");
    return clone;
  });
  const leadingClones = makeClones();
  const trailingClones = makeClones();
  track.prepend(...leadingClones);
  track.append(...trailingClones);

  let timer = null;
  let loopStart = 0;
  let loopWidth = 0;

  function measureLoop() {
    const trackLeft = track.getBoundingClientRect().left;
    const relativeLeft = el => el.getBoundingClientRect().left - trackLeft + track.scrollLeft;
    loopStart = relativeLeft(cards[0]);
    loopWidth = relativeLeft(trailingClones[0]) - loopStart;
    track.scrollLeft = loopStart;
  }

  const hasOverflow = () => loopWidth > track.clientWidth + 2;
  const cardStep = () => cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : track.clientWidth;
  const behavior = () => (prefersReducedMotion ? "auto" : "smooth");
  measureLoop();

  /* ── Prev / next / progress ── */
  function updateControls() {
    const overflow = hasOverflow();
    controls.hidden = !overflow;
    prevBtn.disabled = !overflow;
    nextBtn.disabled = !overflow;
    const visible = loopWidth ? Math.min(track.clientWidth / loopWidth, 1) : 1;
    const offset = loopWidth ? ((track.scrollLeft - loopStart) % loopWidth + loopWidth) % loopWidth : 0;
    const progress = loopWidth ? offset / loopWidth : 0;
    // The bar's width is the visible share of the track; it slides along the line.
    bar.style.width = `${Math.max(visible, 0.08) * 100}%`;
    bar.style.transform = `translateX(${progress * (1 / Math.max(visible, 0.08) - 1) * 100}%)`;
  }

  let ticking = false;
  let normalizeTimer = null;
  function normalizeLoopPosition() {
    if (!loopWidth) return;
    const offset = track.scrollLeft - loopStart;
    if (offset < 0 || offset >= loopWidth) {
      const wrappedOffset = ((offset % loopWidth) + loopWidth) % loopWidth;
      track.scrollLeft = loopStart + wrappedOffset;
    }
  }

  track.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => { ticking = false; updateControls(); });
    }
    clearTimeout(normalizeTimer);
    normalizeTimer = setTimeout(normalizeLoopPosition, 140);
  }, { passive: true });
  track.addEventListener("scrollend", normalizeLoopPosition);

  prevBtn.addEventListener("click", () => track.scrollBy({ left: -cardStep(), behavior: behavior() }));
  nextBtn.addEventListener("click", () => track.scrollBy({ left:  cardStep(), behavior: behavior() }));

  /* ── Autoplay ── */
  function sync() {
    const shouldRun = !document.hidden && hasOverflow();

    if (shouldRun && !timer) {
      timer = setInterval(() => {
        track.scrollBy({ left: cardStep(), behavior: behavior() });
      }, TESTIMONIAL_INTERVAL_MS);
    } else if (!shouldRun && timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  document.addEventListener("visibilitychange", sync);

  /* Re-measure the clone ranges if layout dimensions change. */
  const relayout = () => { measureLoop(); updateControls(); sync(); };
  if (typeof ResizeObserver !== "undefined") new ResizeObserver(relayout).observe(track);
  document.fonts?.ready.then(relayout);
  relayout();
}

/* ============================================================
   INIT
   ============================================================ */
function init() {
  initStatCounters();
  reveal(document.querySelectorAll(".stat, .al-section-header, .al-cta .container > *"));

  teamReady.then(team => {
    ALUMNI = team ? buildAlumni(team) : [];
    renderTestimonials(); // hides the section if there is nothing to show
  });
}

init(); // script is deferred, so the DOM is already parsed

})();
