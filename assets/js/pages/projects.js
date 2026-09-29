"use strict";

/* ────────────────────────────────────────────────────────────
   PROGRAMME IDENTITY
──────────────────────────────────────────────────────────── */
const PROGRAMMES = {
  cv:  { code: "CV",  tag: "Combustion Vehicle",   accent: "#e8001d", cssVar: "--cv-accent"  },
  ev:  { code: "EV",  tag: "Electric Vehicle",     accent: "#3b82f6", cssVar: "--ev-accent"  },
  hyb: { code: "HYB", tag: "Hybrid Vehicle",       accent: "#f59e0b", cssVar: "--hyb-accent" },
  hyp: { code: "HYL", tag: "Hyperloop",            accent: "#7c3aed", cssVar: "--hyp-accent" },
  dv:  { code: "DRV", tag: "Driverless Vehicle",   accent: "#3b82f6", cssVar: "--dv-accent"  }
};

/* ────────────────────────────────────────────────────────────
   DATA
   projectData is filled by init() after projects.json loads.
──────────────────────────────────────────────────────────── */
const PROJECTS_URL = "/assets/data/projects.json";

/* If image paths in projects.json are relative to the CDN, set this
   to e.g. "https://assets.ashwaracing.org/". Leave "" to use paths as-is.
   Absolute URLs (http/https) are never modified. */
const IMAGE_BASE = "";

let projectData = {};

async function loadProjects() {
  const response = await fetch(PROJECTS_URL);

  if (!response.ok) {
    throw new Error(`Failed to load projects: ${response.status}`);
  }

  return response.json();
}

function resolveImage(path) {
  if (!path || !IMAGE_BASE || /^(https?:)?\/\//.test(path)) return path;
  return IMAGE_BASE + path.replace(/^\/+/, "");
}

/* ════════════════════════════════════════════════════════════
   RUNTIME STATE
════════════════════════════════════════════════════════════ */
let activeProgKey = "cv";
let activeYear    = null;
let slideshowTimer = null;
let renderToken   = 0;
let slideIndex    = 0;
let validImages   = [];

/* ── DOM refs ─────────────────────────────────────────────── */
const viewer         = document.getElementById("prog-viewer");
const progCodeEl     = document.getElementById("prog-code");
const progCodeBgEl   = document.getElementById("prog-code-bg");
const progTagEl      = document.getElementById("prog-tag");
const progTitleEl    = document.getElementById("prog-title");
const progYears      = document.getElementById("prog-years");
const progImage      = document.getElementById("prog-image");
const progContent    = document.getElementById("prog-content");
const progImageAccent = document.getElementById("prog-image-accent");
const progYearBadge  = document.getElementById("prog-year-badge");
const slideCurrentEl = document.getElementById("slide-current");
const slideTotalEl   = document.getElementById("slide-total");
const heroStripe     = document.getElementById("proj-hero-stripe");
const heroRule       = document.querySelector(".proj-hero-rule");

progImage.style.transition = "opacity 0.28s ease, transform 0.7s cubic-bezier(0.16,1,0.3,1), filter 0.4s ease";


/* ════════════════════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════════════════════ */
function pad2(n) { return n < 10 ? "0" + n : String(n); }

function preloadImages(paths) {
  return Promise.all(
    paths.map(p => new Promise(resolve => {
      const img = new Image();
      img.onload  = () => resolve(p);
      img.onerror = () => resolve(null);
      img.src = p;
    }))
  ).then(r => r.filter(Boolean));
}

function updateSlideCounter(idx, total) {
  if (slideCurrentEl) slideCurrentEl.textContent = pad2(idx + 1);
  if (slideTotalEl)   slideTotalEl.textContent   = pad2(total);
}

function swapImage(src, alt, token, idx, total) {
  if (token !== renderToken) return;
  progImage.style.opacity = "0";
  setTimeout(() => {
    if (token !== renderToken) return;
    progImage.src = src;
    progImage.alt = alt;
    progImage.style.opacity = "1";
    updateSlideCounter(idx, total);
  }, 280);
}

/* Update all accent-driven elements when programme changes */
function applyAccent(accent) {
  document.documentElement.style.setProperty("--prog-accent", accent);
  if (heroStripe) heroStripe.style.background = accent;
  if (progImageAccent) progImageAccent.style.background = accent;
  if (heroRule) {
    heroRule.style.background = `linear-gradient(to right,
      transparent 0%, rgba(255,255,255,0.06) 20%,
      ${accent} 50%, rgba(255,255,255,0.06) 80%, transparent 100%)`;
  }
}


/* ════════════════════════════════════════════════════════════
   RENDER YEAR
════════════════════════════════════════════════════════════ */
function renderYear(progKey, year) {
  const data     = projectData[progKey].years[year];
  const identity = PROGRAMMES[progKey];

  renderToken += 1;
  const myToken = renderToken;
  slideIndex = 0;
  validImages = [];

  if (slideshowTimer) { clearInterval(slideshowTimer); slideshowTimer = null; }

  /* ── Update year badge ── */
  if (progYearBadge) progYearBadge.textContent = year;

  /* ── Text content (synchronous) ── */
  const spec = data.specs || {};
  const hasRealSpecs = Object.values(spec).some(
    v => v && v !== "—" && v !== "-" && v !== ""
  );

  const specHTML = hasRealSpecs ? `
    <div class="prog-specs">
      <div class="prog-spec"><span>Weight</span><strong>${spec.weight || "—"}</strong></div>
      <div class="prog-spec"><span>Power</span><strong>${spec.power || "—"}</strong></div>
      <div class="prog-spec"><span>0–100</span><strong>${spec.acceleration || "—"}</strong></div>
      <div class="prog-spec"><span>Top Speed</span><strong>${spec.topSpeed || "—"}</strong></div>
    </div>` : "";

  const badgeHTML = data.badge
    ? `<div class="prog-badge">${data.badge}</div>` : "";

  const changeItems = (data.changes || []).map(c => `<li>${c}</li>`).join("");
  const achItems    = (data.achievements || []).map(a => `<li>${a}</li>`).join("");

  progContent.innerHTML = `
    <div>
      <div class="prog-section-label">Updates · ${year}</div>
      <ul class="prog-changes">${changeItems}</ul>
    </div>
    <p class="prog-desc">${data.desc}</p>
    ${specHTML}
    ${badgeHTML}
    <div>
      <div class="prog-section-label">Achievements</div>
      <ul class="prog-achievements">${achItems}</ul>
    </div>`;

  /* ── Activate year button ── */
  progYears.querySelectorAll(".year-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.year === String(year));
    btn.setAttribute("aria-selected", btn.dataset.year === String(year));
  });
  window._scrollYearToActive?.();

  activeYear = year;

  /* ── Images (async, token-guarded) ── */
  const rawImages = (data.images || (data.image ? [data.image] : [])).map(resolveImage);
  progImage.style.opacity = "0";

  preloadImages(rawImages).then(valid => {
    if (myToken !== renderToken) return;

    validImages = valid;

    if (!valid.length) {
      progImage.src = "";
      progImage.style.opacity = "1";
      updateSlideCounter(0, 0);
      return;
    }

    slideIndex = 0;
    swapImage(valid[0], `${identity.tag} — ${year}`, myToken, 0, valid.length);

    if (valid.length > 1) {
      slideshowTimer = setInterval(() => {
        if (myToken !== renderToken) {
          clearInterval(slideshowTimer); slideshowTimer = null; return;
        }
        slideIndex = (slideIndex + 1) % valid.length;
        swapImage(valid[slideIndex], `${identity.tag} — ${year}`, myToken, slideIndex, valid.length);
      }, 3500);
    }
  });
}


/* ════════════════════════════════════════════════════════════
   SWITCH PROGRAMME
════════════════════════════════════════════════════════════ */
function switchProgramme(progKey) {
  const identity = PROGRAMMES[progKey];
  const proto    = projectData[progKey];
  const years    = Object.keys(proto.years).map(Number).sort((a, b) => b - a);

  activeProgKey = progKey;

  viewer.style.transition = "opacity 0.18s ease";
  viewer.style.opacity    = "0";

  setTimeout(() => {
    applyAccent(identity.accent);

    progCodeEl.textContent  = identity.code;
    if (progCodeBgEl) progCodeBgEl.textContent = identity.code;
    progTagEl.textContent   = identity.tag;
    progTitleEl.textContent = proto.title;

    /* Rebuild year buttons */
    progYears.innerHTML = "";
    years.forEach(year => {
      const btn = document.createElement("button");
      btn.className  = "year-btn";
      btn.textContent = year;
      btn.dataset.year = year;
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", "false");
      btn.addEventListener("click", () => renderYear(progKey, year));
      progYears.appendChild(btn);
    });

    /* Update programme index active state */
    document.querySelectorAll(".prog-index-item").forEach(item => {
      item.classList.toggle("active", item.dataset.prog === progKey);
    });

    /* Update index count */
    const countEl = document.getElementById("prog-index-count");
    const keys = Object.keys(projectData);
    const idx  = keys.indexOf(progKey);
    if (countEl) countEl.textContent = `${idx + 1} / ${keys.length}`;

    renderYear(progKey, years[0]);

    viewer.style.opacity = "1";
  }, 180);
}


/* ════════════════════════════════════════════════════════════
   BUILD PROGRAMME INDEX  (horizontal strips replacing nav)
════════════════════════════════════════════════════════════ */
function buildProgIndex() {
  const list = document.getElementById("prog-index-list");
  if (!list) return;

  const keys = Object.keys(projectData);

  const countEl = document.getElementById("prog-index-count");
  if (countEl) countEl.textContent = `1 / ${keys.length}`;

  keys.forEach(key => {
    const identity = PROGRAMMES[key];
    const proto    = projectData[key];
    const years    = Object.keys(proto.years).map(Number).sort((a, b) => b - a);
    const yearRange = years.length > 1
      ? `${years[years.length - 1]} – ${years[0]}`
      : String(years[0]);

    const item = document.createElement("div");
    item.className = "prog-index-item";
    item.dataset.prog = key;
    item.setAttribute("role", "button");
    item.setAttribute("tabindex", "0");
    item.setAttribute("aria-label", `${identity.tag} programme`);
    item.style.setProperty("--item-accent", identity.accent);

    item.innerHTML = `
      <div class="prog-index-item-bg-code" aria-hidden="true">${identity.code}</div>
      <div class="prog-index-item-dot" aria-hidden="true"></div>
      <div class="prog-index-item-code">${identity.code}</div>
      <div class="prog-index-item-name">${proto.title}</div>
      <div class="prog-index-item-meta">${yearRange} · ${years.length} season${years.length !== 1 ? "s" : ""}</div>`;

    function activate() {
      switchProgramme(key);
      viewer.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    item.addEventListener("click", activate);
    item.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(); }
    });

    list.appendChild(item);
  });
}


/* ════════════════════════════════════════════════════════════
   BUILD OVERVIEW CARDS  (bottom portfolio section)
════════════════════════════════════════════════════════════ */
function buildOverviewCards() {
  const grid = document.getElementById("all-progs-grid");
  if (!grid) return;

  Object.entries(projectData).forEach(([key, proto]) => {
    const identity = PROGRAMMES[key];
    const years    = Object.keys(proto.years).sort((a, b) => b - a);

    const card = document.createElement("div");
    card.className = "prog-card";
    card.style.setProperty("--card-accent", identity.accent);
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", `View ${identity.tag} programme`);

    card.innerHTML = `
      <div class="prog-card-code">${identity.code}</div>
      <div class="prog-card-title">${proto.title}</div>
      <div class="prog-card-years">
        ${years.length > 1 ? `${years[years.length - 1]} – ${years[0]}` : years[0]}
        · ${years.length} season${years.length !== 1 ? "s" : ""}
      </div>
      <i class="fas fa-arrow-up-right prog-card-arrow" aria-hidden="true"></i>`;

    function activate() {
      switchProgramme(key);
      viewer.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    card.addEventListener("click", activate);
    card.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(); }
    });
    grid.appendChild(card);
  });
}


/* ════════════════════════════════════════════════════════════
   YEAR SELECTOR — scroll / drag / keyboard
════════════════════════════════════════════════════════════ */
function initYearScroll() {
  const wrapper = document.getElementById("prog-years-wrapper");
  const track   = document.getElementById("prog-years");
  if (!wrapper || !track) return;

  const arrowL = document.createElement("button");
  const arrowR = document.createElement("button");
  const fadeL  = document.createElement("div");
  const fadeR  = document.createElement("div");

  arrowL.className = "years-arrow hidden";
  arrowL.innerHTML = "&#8249;";
  arrowL.setAttribute("aria-label", "Scroll years left");

  arrowR.className = "years-arrow hidden";
  arrowR.innerHTML = "&#8250;";
  arrowR.setAttribute("aria-label", "Scroll years right");

  fadeL.className  = "years-fade-edge left hidden";
  fadeR.className  = "years-fade-edge right hidden";

  wrapper.prepend(arrowL);
  wrapper.appendChild(arrowR);
  wrapper.appendChild(fadeR);
  wrapper.prepend(fadeL);

  function syncUI() {
    const atStart = track.scrollLeft <= 2;
    const atEnd   = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
    arrowL.classList.toggle("hidden", atStart);
    arrowR.classList.toggle("hidden", atEnd);
    fadeL.classList.toggle("hidden", atStart);
    fadeR.classList.toggle("hidden", atEnd);
  }

  let rafId = null;
  function momentumScroll(delta, duration) {
    cancelAnimationFrame(rafId);
    const start  = track.scrollLeft;
    const target = Math.max(0, Math.min(start + delta, track.scrollWidth - track.clientWidth));
    const t0     = performance.now();
    const ease   = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
    function step(now) {
      const p = Math.min((now - t0) / duration, 1);
      track.scrollLeft = start + (target - start) * ease(p);
      if (p < 1) rafId = requestAnimationFrame(step);
      else { track.scrollLeft = target; syncUI(); }
    }
    rafId = requestAnimationFrame(step);
  }

  window._scrollYearToActive = function () {
    const active = track.querySelector(".year-btn.active");
    if (!active) return;
    const tr    = track.getBoundingClientRect();
    const br    = active.getBoundingClientRect();
    const delta = br.left - tr.left - tr.width / 2 + br.width / 2;
    momentumScroll(delta, 280);
  };

  arrowL.addEventListener("click", () => momentumScroll(-Math.max(track.clientWidth * 0.55, 140), 300));
  arrowR.addEventListener("click", () => momentumScroll(+Math.max(track.clientWidth * 0.55, 140), 300));
  track.addEventListener("scroll", syncUI, { passive: true });
  window.addEventListener("resize", syncUI);

  /* Drag to scroll */
  let dragging = false, startX = 0, scrollX = 0, vel = 0, lastX = 0, lastT = 0;

  track.addEventListener("mousedown", e => {
    dragging = true; startX = e.clientX; scrollX = track.scrollLeft;
    lastX = e.clientX; lastT = performance.now(); vel = 0;
    track.classList.add("grabbing");
    cancelAnimationFrame(rafId);
    e.preventDefault();
  });
  window.addEventListener("mousemove", e => {
    if (!dragging) return;
    const now = performance.now(), dt = now - lastT;
    if (dt > 0) vel = (e.clientX - lastX) / dt;
    lastX = e.clientX; lastT = now;
    track.scrollLeft = scrollX - (e.clientX - startX);
    syncUI();
  });
  window.addEventListener("mouseup", () => {
    if (!dragging) return;
    dragging = false;
    track.classList.remove("grabbing");
    if (Math.abs(vel) > 0.05) launchCoast(vel);
  });

  track.addEventListener("touchstart", e => {
    dragging = true; startX = e.touches[0].clientX; scrollX = track.scrollLeft;
    lastX = startX; lastT = performance.now(); vel = 0;
    cancelAnimationFrame(rafId);
  }, { passive: true });
  track.addEventListener("touchmove", e => {
    if (!dragging) return;
    const x = e.touches[0].clientX, now = performance.now(), dt = now - lastT;
    if (dt > 0) vel = (x - lastX) / dt;
    lastX = x; lastT = now;
    track.scrollLeft = scrollX - (x - startX);
    syncUI();
  }, { passive: true });
  track.addEventListener("touchend", () => {
    dragging = false;
    if (Math.abs(vel) > 0.05) launchCoast(vel);
  });

  function launchCoast(v) {
    let m = v * 14;
    function step() {
      if (Math.abs(m) < 0.5) return;
      track.scrollLeft -= m;
      m *= 0.88;
      syncUI();
      rafId = requestAnimationFrame(step);
    }
    rafId = requestAnimationFrame(step);
  }

  /* Keyboard nav */
  track.setAttribute("tabindex", "0");
  track.addEventListener("keydown", e => {
    const btns = [...track.querySelectorAll(".year-btn")];
    const idx  = btns.findIndex(b => b.classList.contains("active"));
    if (e.key === "ArrowLeft"  && idx > 0)              { btns[idx - 1].click(); e.preventDefault(); }
    if (e.key === "ArrowRight" && idx < btns.length - 1){ btns[idx + 1].click(); e.preventDefault(); }
    if (e.key === "Home") { btns[0].click(); e.preventDefault(); }
    if (e.key === "End")  { btns[btns.length - 1].click(); e.preventDefault(); }
  });

  setTimeout(syncUI, 100);
}


/* ════════════════════════════════════════════════════════════
   SCROLL REVEAL — cards only
════════════════════════════════════════════════════════════ */
function initReveal() {
  const cards = document.querySelectorAll(".prog-card, .prog-index-item");
  cards.forEach((el, i) => {
    el.style.opacity   = "0";
    el.style.transform = "translateY(16px)";
    el.style.transition =
      `opacity 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 0.055}s,
       transform 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 0.055}s`;
  });

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.style.opacity   = "1";
      e.target.style.transform = "translateY(0)";
      obs.unobserve(e.target);
    });
  }, { threshold: 0.06 });

  cards.forEach(el => obs.observe(el));
}


/* ════════════════════════════════════════════════════════════
   STAT COUNTER ANIMATION
════════════════════════════════════════════════════════════ */
function initStatCounters() {
  const statValues = document.querySelectorAll(".proj-stat-value[data-target]");
  if (!statValues.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = parseInt(el.dataset.target, 10);
      /* Don't animate "2005" — it's a year, not a count */
      if (target > 1000) { el.textContent = target; obs.unobserve(el); return; }

      const duration = 900;
      const start    = performance.now();
      function step(now) {
        const p = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(ease * target);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target;
      }
      requestAnimationFrame(step);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });

  statValues.forEach(el => obs.observe(el));
}


/* ════════════════════════════════════════════════════════════
   INIT
════════════════════════════════════════════════════════════ */
async function init() {
  /* Stats don't depend on the project data, so start them right away */
  initStatCounters();

  try {
    const raw = await loadProjects();

    /* Keep only programmes we have an identity for, so a stray key
       in the JSON can't crash the page. */
    projectData = {};
    Object.keys(raw).forEach(key => {
      if (PROGRAMMES[key] && raw[key] && raw[key].years) projectData[key] = raw[key];
    });
  } catch (err) {
    console.error(err);
    return;
  }

  const keys = Object.keys(projectData);
  if (!keys.length) {
    console.error("projects.json loaded but contained no recognised programmes (expected keys: " +
      Object.keys(PROGRAMMES).join(", ") + ")");
    return;
  }

  buildProgIndex();
  switchProgramme(keys.includes("cv") ? "cv" : keys[0]);
  buildOverviewCards();
  initReveal();
  initYearScroll();
}

init();