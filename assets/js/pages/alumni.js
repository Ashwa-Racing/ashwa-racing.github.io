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
const ORG_URL  = "/assets/data/org-structure.json";
const TEAM_URL = "/assets/data/team.json";

// Testimonials are derived from team.json: anyone whose year is before the
// current calendar year is an alumnus, and only alumni with a testimony are shown.
const MEMBER_PHOTO_BASE = `${ASSET_HOST}images/team/members/`;
const DEFAULT_PHOTO     = `${ASSET_HOST}images/team/default.webp`;

const ROLE_PRIORITY = ["Team Captain", "Chief Engineer", "Project Manager", "Subsystem Lead", "Member"];

// Programme colours (used for the project cards in the org structure).
const PROGRAMMES = {
  cv:         { label: "Combustion", color: "#0ea5e9" },
  hybrid:     { label: "Hybrid",     color: "#e8001d" },
  ev:         { label: "Electric",   color: "#2E6FF2" },
  dv:         { label: "Driverless", color: "#00c2a8" },
  hyperloop:  { label: "Hyperloop",  color: "#7c3aed" },
  management: { label: "Management", color: "#6b7280" }
};
const PROGRAMME_ALIASES = { hyb: "hybrid" };

const ORG_COLORS = {
  advisor: "#e8001d", committee: "#f59e0b", subsystem: "#eab308", fallback: "#e8001d"
};

const TESTIMONIAL_INTERVAL_MS = 7000;
const COUNT_UP_MS             = 1600;

/* ============================================================
   HELPERS
   ============================================================ */
function initials(name = "") {
  return String(name).split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function programmeKey(id) {
  return PROGRAMME_ALIASES[id] || id;
}

/* Fetches start immediately (and are preloaded in the HTML), so they're
   usually done by the time the page needs them. Each fails independently. */
const orgReady  = fetchJSON(ORG_URL, {}, 8000).catch(err => { console.error(err); return null; });
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
   ORG CHART
   ============================================================ */
function orgMemberHTML(member) {
  const name = String(member.name ?? "");
  const avatar = member.photo
    ? `<img src="${escapeHTML(imgUrl(member.photo, 96))}" alt="" class="org-mem-photo" width="36" height="36" loading="lazy" decoding="async">`
    : `<span class="org-mem-ini" aria-hidden="true">${escapeHTML(initials(name))}</span>`;
  const desig = member.designation
    ? `<span class="org-mem-desig">${escapeHTML(member.designation)}</span>`
    : "";

  return `<div class="org-mem">${avatar}<div class="org-mem-meta"><span class="org-mem-name">${escapeHTML(name)}</span>${desig}</div></div>`;
}

const orgPeople = (members = []) =>
  `<div class="org-people">${members.map(orgMemberHTML).join("")}</div>`;

function orgCardHTML(node, color, people) {
  return `<article class="org-card" style="--nc:${color}">
      <header class="org-card-head">
        <h4 class="org-card-title">${escapeHTML(node.label)}</h4>
        ${node.sublabel ? `<span class="org-card-sub">${escapeHTML(node.sublabel)}</span>` : ""}
      </header>
      ${people}
    </article>`;
}

/* A subsystem shows its lead; with members under it, it becomes a native
   <details> toggle (keyboard + screen-reader support for free). */
function orgSubsystemHTML(sub) {
  const lead    = sub.lead ? orgMemberHTML(sub.lead) : "";
  const members = sub.members || [];
  const title   = `<h4 class="org-card-title">${escapeHTML(sub.label)}</h4>`;
  const style   = `style="--nc:${ORG_COLORS.subsystem}"`;

  if (!members.length) {
    return `<article class="org-card" ${style}>
        <header class="org-card-head">${title}</header>
        <div class="org-people">${lead}</div>
      </article>`;
  }

  return `<details class="org-card org-card--toggle" ${style}>
      <summary>
        <span class="org-card-head">${title}</span>
        <span class="org-people">${lead}</span>
        <span class="org-toggle">${members.length} member${members.length === 1 ? "" : "s"}</span>
      </summary>
      ${orgPeople(members)}
    </details>`;
}

function orgBandHTML(section, className, bodyHTML) {
  return `<section class="org-band">
      <div class="org-band-head">
        <h3 class="org-band-title">${escapeHTML(section.title)}</h3>
        ${section.description ? `<p class="org-band-desc">${escapeHTML(section.description)}</p>` : ""}
      </div>
      <div class="${className}">${bodyHTML}</div>
    </section>`;
}

function renderOrgChart(data) {
  const container = document.getElementById("org-chart");
  if (!container) return;

  if (!data) {
    container.innerHTML = `<p class="al-empty">The team structure couldn't be loaded right now.</p>`;
    return;
  }

  const bands = [];

  if (data.governance?.members?.length) {
    const cards = data.governance.members.map(m => {
      const color = m.designation === "Faculty Advisor" ? ORG_COLORS.advisor : ORG_COLORS.committee;
      return `<article class="org-card org-card--person" style="--nc:${color}">${orgMemberHTML(m)}</article>`;
    }).join("");
    bands.push(orgBandHTML(data.governance, "org-grid org-grid--gov", cards));
  }

  if (data.projects?.items?.length) {
    const cards = data.projects.items.map(p => {
      const color = PROGRAMMES[programmeKey(p.id)]?.color || ORG_COLORS.fallback;
      return orgCardHTML(p, color, orgPeople(p.members));
    }).join("");
    bands.push(orgBandHTML(data.projects, "org-grid org-grid--projects", cards));
  }

  if (data.subsystems?.items?.length) {
    bands.push(orgBandHTML(data.subsystems, "org-grid org-grid--subsystems",
      data.subsystems.items.map(orgSubsystemHTML).join("")));
  }

  container.innerHTML = bands.join("");
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
    .filter(m => Number(m.year) < thisYear)
    .filter(m => m.testimony && m.testimony.trim())
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
   free) with prev/next buttons and a progress line. Long quotes are
   clamped with a Read more toggle. Autoplay steps one card at a time
   and only runs while the section is on screen, the tab is visible,
   nothing is hovered/focused, and no quote is expanded.
   ============================================================ */
function testimonialCardHTML(a, i) {
  const where = [a.position, a.company].filter(Boolean).map(escapeHTML).join(" · ");
  const meta  = [a.role, a.batch && `Batch of ${a.batch}`].filter(Boolean).map(escapeHTML).join(" · ");

  return `
    <article class="testi-card">
      <p class="testi-text" id="testi-text-${i}">${escapeHTML(a.testimony)}</p>
      <button class="testi-more" type="button" aria-expanded="false" aria-controls="testi-text-${i}" hidden>Read more</button>
      <footer class="testi-author">
        <div class="testi-avatar">
          <img src="${escapeHTML(imgUrl(a.photo, 120))}" alt="" data-photo width="48" height="48" loading="lazy" decoding="async">
        </div>
        <div class="testi-meta">
          <span class="testi-name">${escapeHTML(a.name)}</span>
          ${where ? `<span class="testi-where">${where}</span>` : ""}
          ${meta  ? `<span class="testi-batch">${meta}</span>`   : ""}
        </div>
      </footer>
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

  const list = ALUMNI.filter(a => a.testimony);
  if (!list.length) {
    section.hidden = true;
    return;
  }

  track.innerHTML = list.map(testimonialCardHTML).join("");
  const cards = [...track.querySelectorAll(".testi-card")];

  let timer = null;
  let inView = false;
  let paused = false;

  const atEnd = () => track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
  const hasOverflow = () => track.scrollWidth > track.clientWidth + 2;
  const cardStep = () => cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : track.clientWidth;
  const behavior = () => (prefersReducedMotion ? "auto" : "smooth");

  /* ── Read more: only offered when the quote is actually clamped ── */
  function measureClamps() {
    cards.forEach(card => {
      const text = card.querySelector(".testi-text");
      const more = card.querySelector(".testi-more");
      if (card.classList.contains("is-expanded")) return;
      more.hidden = text.scrollHeight <= text.clientHeight + 1;
    });
  }

  track.addEventListener("click", e => {
    const more = e.target.closest(".testi-more");
    if (!more) return;
    const card = more.closest(".testi-card");
    const expanded = card.classList.toggle("is-expanded");
    more.setAttribute("aria-expanded", String(expanded));
    more.textContent = expanded ? "Show less" : "Read more";
    sync();
  });

  /* ── Prev / next / progress ── */
  function updateControls() {
    const overflow = hasOverflow();
    controls.hidden = !overflow;
    prevBtn.disabled = track.scrollLeft <= 2;
    nextBtn.disabled = atEnd();
    const max = track.scrollWidth - track.clientWidth;
    const visible = track.clientWidth / track.scrollWidth;
    const progress = max > 0 ? track.scrollLeft / max : 0;
    // The bar's width is the visible share of the track; it slides along the line.
    bar.style.width = `${Math.max(visible, 0.08) * 100}%`;
    bar.style.transform = `translateX(${progress * (1 / Math.max(visible, 0.08) - 1) * 100}%)`;
  }

  let ticking = false;
  track.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; updateControls(); });
  }, { passive: true });

  prevBtn.addEventListener("click", () => track.scrollBy({ left: -cardStep(), behavior: behavior() }));
  nextBtn.addEventListener("click", () => track.scrollBy({ left:  cardStep(), behavior: behavior() }));

  /* ── Autoplay ── */
  function sync() {
    const anyExpanded = cards.some(c => c.classList.contains("is-expanded"));
    const shouldRun = inView && !paused && !anyExpanded && !document.hidden
      && !prefersReducedMotion && hasOverflow();

    if (shouldRun && !timer) {
      timer = setInterval(() => {
        if (atEnd()) track.scrollTo({ left: 0, behavior: behavior() });
        else track.scrollBy({ left: cardStep(), behavior: behavior() });
      }, TESTIMONIAL_INTERVAL_MS);
    } else if (!shouldRun && timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  [track, controls].forEach(el => {
    el.addEventListener("mouseenter", () => { paused = true;  sync(); });
    el.addEventListener("mouseleave", () => { paused = false; sync(); });
    el.addEventListener("focusin",    () => { paused = true;  sync(); });
    el.addEventListener("focusout",   () => { paused = false; sync(); });
  });
  track.addEventListener("touchstart", () => { paused = true; sync(); }, { passive: true });
  track.addEventListener("touchend",   () => { paused = false; sync(); }, { passive: true });
  document.addEventListener("visibilitychange", sync);

  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    sync();
  }, { threshold: 0.3 }).observe(section);

  /* Layout changes (resize, web fonts arriving) change what's clamped. */
  const relayout = () => { measureClamps(); updateControls(); sync(); };
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

  orgReady.then(renderOrgChart);

  teamReady.then(team => {
    ALUMNI = team ? buildAlumni(team) : [];
    renderTestimonials(); // hides the section if there is nothing to show
  });
}

init(); // script is deferred, so the DOM is already parsed

})();