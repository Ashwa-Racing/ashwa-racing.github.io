/* ============================================================
   ASHWA RACING — alumni.js
   ============================================================ */
"use strict";

// ─── Data sources ─────────────────────────────────────────────
const ORG_URL  = "/assets/data/org-structure.json";
const TEAM_URL = "/assets/data/team.json";

// Alumni cards + testimonials are derived from team.json:
// anyone whose year is before the current calendar year is an alumnus.
// true  → only alumni with a testimony are shown (matches the old hand-picked list)
// false → every past member is shown
const REQUIRE_TESTIMONY = true;

const ALUMNI_PHOTO_BASE = "https://assets.ashwaracing.org/images/team/members/";
const DEFAULT_PHOTO     = "https://assets.ashwaracing.org/images/team/default.webp";

const ROLE_PRIORITY = ["Team Captain", "Chief Engineer", "Project Manager", "Subsystem Lead", "Member"];
const PROTOTYPE_TO_PROGRAMME = {
  Combustion: "cv", Hybrid: "hybrid", Electric: "ev", Hyperloop: "hyperloop", Driverless: "dv"
};

// Filled once the JSON files have loaded
let ORG_STRUCTURE = null;
let ALUMNI = [];

async function loadJSON(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);
  return response.json();
}

// Team data comes from a public form, so escape it before using innerHTML.
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function splitJob(currentJob) {
  if (!currentJob) return ["", ""];
  const i = currentJob.indexOf(",");
  return i === -1
    ? [currentJob.trim(), ""]
    : [currentJob.slice(0, i).trim(), currentJob.slice(i + 1).trim()];
}

// team.json entries → the card shape the renderers below expect
function buildAlumni(team) {
  const thisYear = new Date().getFullYear();

  return team
    .filter(m => Number(m.year) < thisYear)
    .filter(m => !REQUIRE_TESTIMONY || (m.testimony && m.testimony.trim()))
    .map(m => {
      const social = m.social || {};
      const roles  = m.roles && m.roles.length ? m.roles : ["Member"];
      const [jobPosition, jobCompany] = splitJob(m.currentJob);
      const firstPrototype = Object.keys(m.prototypes || {})[0];

      return {
        name:      m.name,
        role:      ROLE_PRIORITY.find(r => roles.includes(r)) || roles[0],
        batch:     String(m.year),
        photo:     m.photo || `${ALUMNI_PHOTO_BASE}${m.year}/${m.name}.webp`,
        company:   m.company  || jobCompany,
        position:  m.position || jobPosition,
        linkedin:  social.linkedin || null,
        programme: m.programme || PROTOTYPE_TO_PROGRAMME[firstPrototype] || "",
        testimony: m.testimony || ""
      };
    })
    .sort((a, b) =>
      Number(b.batch) - Number(a.batch) ||
      ROLE_PRIORITY.indexOf(a.role) - ROLE_PRIORITY.indexOf(b.role)
    );
}

document.addEventListener("DOMContentLoaded", async () => {
  const [orgResult, teamResult] = await Promise.allSettled([
    loadJSON(ORG_URL),
    loadJSON(TEAM_URL)
  ]);

  // The two sections are independent: one failing shouldn't take down the other.
  if (orgResult.status === "fulfilled") {
    ORG_STRUCTURE = orgResult.value;
    renderOrgChart();
  } else {
    console.error(orgResult.reason);
  }

  if (teamResult.status === "fulfilled") {
    ALUMNI = buildAlumni(teamResult.value);
  } else {
    console.error(teamResult.reason);
  }

  initFilters();
  renderAlumniCards();
  renderTestimonials();
  initReveal();

  if (teamResult.status === "rejected") {
    const grid = document.getElementById("al-grid");
    if (grid) grid.innerHTML = `<p class="al-empty">Alumni couldn't be loaded right now.</p>`;
  }
});

const PROG_COLOR_MAP = {
  cv:"#0ea5e9", hyb:"#e8001d", hybrid:"#e8001d",
  ev:"#00c2a8", dv:"#3b82f6", hyperloop:"#7c3aed"
};
const PROG_LABELS = {
  cv:"Combustion", hybrid:"Hybrid", ev:"Electric",
  dv:"Driverless", hyperloop:"Hyperloop", management:"Management"
};
const PROG_COLORS = {
  cv:"#0ea5e9", hybrid:"#e8001d", ev:"#00c2a8",
  dv:"#3b82f6", hyperloop:"#7c3aed", management:"#6b7280"
};

function renderOrgChart() {
  const container = document.getElementById("org-chart");
  if (!container || !ORG_STRUCTURE) return;
  const d = ORG_STRUCTURE;

  /* ── All programmes in order: CV first, then the rest ── */
  const allProgs = [d.children[0], ...d.children.slice(2)];

  const midProgHTML = allProgs.map(prog => {
    const col = PROG_COLOR_MAP[prog.id] || "#e8001d";
    const leaderBox = prog.children?.[0]
      ? `<div class="org-vline org-vline--sm"></div>${orgBox(prog.children[0], col)}`
      : "";
    return `<div class="org-prog">${orgBox(prog, col)}${leaderBox}</div>`;
  }).join("");

  /* ── Subsystems: left group | right group ── */
  const subsLeft  = d.subsystems?.left  || [];
  const subsRight = d.subsystems?.right || [];
  const subsHTML = (subsLeft.length || subsRight.length)
    ? `<div class="org-vline org-vline--md"></div>
       <div class="org-row--sub">
         ${subsLeft.length
           ? `<div class="org-sub-col">${subsLeft.map(n  => orgBox(n, "#eab308")).join("")}</div>`
           : ""}
         ${subsRight.length
           ? `<div class="org-sub-col">${subsRight.map(n => orgBox(n, "#9333ea")).join("")}</div>`
           : ""}
       </div>`
    : "";

  container.innerHTML = `
    <div class="org-chart-inner">

      ${orgBox(d, "#e8001d", true)}
      <div class="org-vline org-vline--md"></div>

      <div class="org-row--top">
        <div class="org-col org-col--side">
          ${d.sideLeft.map(n => orgBox(n, "#e8001d")).join('<div class="org-vline org-vline--sm"></div>')}
        </div>
        <div class="org-col org-col--side">
          ${d.sideRight.map(n => orgBox(n, "#f59e0b")).join('<div class="org-vline org-vline--sm"></div>')}
        </div>
      </div>

      <div class="org-vline org-vline--md"></div>

      <div class="org-row--phases">
        <div class="org-phases-col">
          ${d.children[1].children.map(n => orgBox(n, "#7c3aed")).join("")}
        </div>
      </div>

      <div class="org-vline org-vline--md"></div>

      <div class="org-row--mid">
        ${midProgHTML}
      </div>

      ${subsHTML}

    </div>`;
}
// .org-chart-inner
//   .org-box--root          ← standalone, centered
//   .org-vline--md          ← spine down
//   .org-row--top           ← only 2 .org-col--side children (no --root in the middle)
//   .org-vline--md          ← spine continues down
//   .org-row--phases
//   .org-vline--md
//   .org-row--mid           ← flat list of .org-prog (no wrapper divs)
//   .org-vline--md
//   .org-row--sub

function orgBox(node, color, isRoot = false) {
  const members = node.members || [];
  const hasMem  = members.length > 0;
  const memberHTML = hasMem ? `
    <div class="org-members">
      ${members.map(m => {
        const ini = m.name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
        const ava = m.photo
          ? `<img src="${m.photo}" alt="${m.name}" class="org-mem-photo" loading="lazy">`
          : `<span class="org-mem-ini">${ini}</span>`;
        const desig = m.designation ? `<span class="org-mem-desig">${m.designation}</span>` : "";
        return `<div class="org-mem">${ava}<div class="org-mem-meta"><span class="org-mem-name">${m.name}</span>${desig}</div></div>`;
      }).join("")}
    </div>` : "";
  return `<div class="org-box${isRoot ? " org-box--root" : ""}" style="--nc:${color}">
      <span class="org-box-label">${node.label}</span>
      ${node.sublabel ? `<span class="org-box-sub">${node.sublabel}</span>` : ""}
      ${memberHTML}
    </div>`;
}

function renderAlumniCards(filter = "all") {
  const grid = document.getElementById("al-grid");
  if (!grid) return;
  const list = filter === "all" ? ALUMNI : ALUMNI.filter(a => a.programme === filter);
  if (!list.length) {
    grid.innerHTML = `<p class="al-empty">No alumni found for this filter.</p>`;
    return;
  }
  grid.innerHTML = list.map(a => {
    const ini = a.name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
    const avatar = a.photo
      ? `<img src="${esc(a.photo)}" alt="${esc(a.name)}" class="al-card-photo" loading="lazy" onerror="this.onerror=null;this.src='${DEFAULT_PHOTO}'">`
      : `<div class="al-card-initials">${esc(ini)}</div>`;
    const linkedin = a.linkedin
      ? `<a href="${esc(a.linkedin)}" class="al-card-linkedin" target="_blank" rel="noopener"><i class="fab fa-linkedin-in"></i></a>`
      : "";
    const badge = PROG_LABELS[a.programme]
      ? `<span class="al-card-badge" style="--bc:${PROG_COLORS[a.programme]}">${PROG_LABELS[a.programme]}</span>`
      : "";
    return `
      <article class="al-card reveal-card">
        <div class="al-card-top">${avatar}${linkedin}</div>
        <div class="al-card-body">
          ${badge}
          <h3 class="al-card-name">${esc(a.name)}</h3>
          <p class="al-card-role">${esc(a.role)}</p>
          <div class="al-card-divider"></div>
          <div class="al-card-current">
            <span class="al-card-position">${esc(a.position)}</span>
            <span class="al-card-company">${esc(a.company)}</span>
          </div>
          ${a.batch ? `<span class="al-card-batch">Batch of ${esc(a.batch)}</span>` : ""}
        </div>
      </article>`;
  }).join("");
  initReveal();
}

function initFilters() {
  const bar = document.getElementById("al-filters");
  if (!bar) return;
  const progs = [...new Set(ALUMNI.map(a => a.programme).filter(Boolean))];
  progs.forEach(prog => {
    if (!PROG_LABELS[prog]) return;
    const btn = document.createElement("button");
    btn.className = "al-filter-btn";
    btn.dataset.filter = prog;
    btn.textContent = PROG_LABELS[prog];
    bar.appendChild(btn);
  });
  bar.addEventListener("click", e => {
    const btn = e.target.closest(".al-filter-btn");
    if (!btn) return;
    bar.querySelectorAll(".al-filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderAlumniCards(btn.dataset.filter);
  });
}

let testiIndex = 0;
let testiTimer = null;

function renderTestimonials() {
  const track = document.getElementById("al-testi-track");
  const dots  = document.getElementById("al-testi-dots");
  if (!track || !dots) return;
  const list = ALUMNI.filter(a => a.testimony && a.testimony.trim());
  if (!list.length) {
    const sec = track.closest(".al-testimonials");
    if (sec) sec.style.display = "none";
    return;
  }
  track.innerHTML = list.map((a, i) => {
    const ini = a.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
    const ava = a.photo
      ? `<img src="${esc(a.photo)}" alt="${esc(a.name)}" class="testi-avatar-img" loading="lazy" onerror="this.onerror=null;this.src='${DEFAULT_PHOTO}'">`
      : `<div class="testi-avatar-initials">${esc(ini)}</div>`;
    const where = [a.position, a.company].filter(Boolean).map(esc).join(" . ");
    return `
      <div class="testi-slide ${i===0?"active":""}" data-index="${i}">
        <blockquote class="testi-quote">"${esc(a.testimony)}"</blockquote>
        <div class="testi-author">
          <div class="testi-avatar">${ava}</div>
          <div class="testi-meta">
            <span class="testi-name">${esc(a.name)}</span>
            <span class="testi-role">${esc(a.role)}</span>
            <span class="testi-company">${where}</span>
          </div>
        </div>
      </div>`;
  }).join("");
  dots.innerHTML = list.map((_,i) =>
    `<button class="testi-dot ${i===0?"active":""}" data-i="${i}" aria-label="Testimonial ${i+1}"></button>`
  ).join("");
  dots.addEventListener("click", e => {
    const dot = e.target.closest(".testi-dot");
    if (dot) goToTesti(parseInt(dot.dataset.i));
  });
  function startTimer() {
    testiTimer = setInterval(() => {
      const total = track.querySelectorAll(".testi-slide").length;
      goToTesti((testiIndex + 1) % total);
    }, 5500);
  }
  startTimer();
  track.addEventListener("mouseenter", () => clearInterval(testiTimer));
  track.addEventListener("mouseleave", startTimer);
}

function goToTesti(i) {
  testiIndex = i;
  document.querySelectorAll(".testi-slide").forEach((s,idx) => s.classList.toggle("active", idx===i));
  document.querySelectorAll(".testi-dot").forEach((d,idx)  => d.classList.toggle("active", idx===i));
}

function initReveal() {
  const els = document.querySelectorAll(".reveal-card:not([data-revealed])");
  els.forEach((el, i) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(20px)";
    el.style.transition = `opacity 0.5s ease ${i*0.07}s, transform 0.5s ease ${i*0.07}s`;
    el.dataset.revealed = "pending";
  });
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.style.opacity = "1";
      e.target.style.transform = "translateY(0)";
      e.target.dataset.revealed = "true";
      obs.unobserve(e.target);
    });
  }, { threshold: 0.08 });
  els.forEach(el => obs.observe(el));
}