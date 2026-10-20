"use strict";

// ─── Data ─────────────────────────────────────────────────────
// Filled from team.json before the page is built.
const TEAM_URL = "/assets/data/team.json";
let teamData = [];

async function loadTeam() {
  const response = await fetch(TEAM_URL);

  if (!response.ok) {
    throw new Error(`Failed to load team: ${response.status}`);
  }

  const data = await response.json();

  // Fill in anything a hand-edited or freshly synced entry might be missing,
  // so a single sparse entry can't break the whole page.
  return data.map(m => ({
    ...m,
    year:       String(m.year ?? ""),
    roles:      m.roles && m.roles.length ? m.roles : ["Member"],
    subsystem:  [...new Set((m.subsystem || []).map(label =>
      ["Steering", "Finance", "Steering & Finance"].includes(label) ? "Steering & Finance" : label
    ))],
    social:     m.social || {},
    experience: m.experience || ""
  }));
}

// Start fetching immediately; the load handler below waits for it.
const teamReady = loadTeam().catch(err => {
  console.error(err);
  return null;
});

// ─── State ────────────────────────────────────────────────────
// Initialised to null; set properly on first render from dynamic year list
let activeYear      = null;
let activeSubsystem = "All";
const SUBSYSTEM_ALIASES = {
  "Aero": ["Aero", "Aerodynamics"],
  "Brakes & Logistics": ["Brakes", "Brakes & Logistics"],
  "Chassis & Workshop Management": ["Chassis", "Chassis & Workshop Management"],
  "Drivetrain & Human Resources": ["Drivetrain", "Drivetrain & Human Resources"],
  "Electrical & Testing": ["Electrical", "Electrical & Testing"],
  "Steering & Finance": ["Steering & Finance", "Steering", "Finance"],
  "Suspension & Admin": ["Suspension", "Suspension & Admin"],
  "IT": ["IT"],
  "Sponsorship, Marketing & Public Relations": ["SMP", "Sponsorship", "Marketing & Public Relations", "Sponsorship, Marketing & Public Relations"],
  "Engine": ["Engine", "Engine systems"]
};
const profileParams = new URLSearchParams(window.location.search);
const profileName = profileParams.get("member");
const profileYear = profileParams.get("year");
let profileDialog = null;

// ─── DOM refs ──────────────────────────────────────────────────
const grid        = document.getElementById("member-profiles-grid");
const countEl     = document.getElementById("member-count");
const descBox     = document.getElementById("subsystem-desc");
const rosterHeading = document.getElementById("roster-heading");
const yearFilter  = document.getElementById("year-filter");
const subFilter   = document.getElementById("subsystem-filter");

const PROFILE_BASE           = "https://assets.ashwaracing.org/images/team/members/";
const DEFAULT_PROFILE_IMAGE  = "https://assets.ashwaracing.org/images/team/default.webp";

// ─── Role Classification ───────────────────────────────────────
// Returns the highest-authority role class for a member
function getRoleClass(member) {
  const roles = member.roles.map(r => r.toLowerCase());
  const isCommand =
    roles.some(r => r.includes("team captain") || r.includes("chief engineer") || r.includes("project manager"));
  const isLead =
    !isCommand && roles.some(r => r.includes("lead"));
  if (isCommand) return "is-command";
  if (isLead)    return "is-lead";
  return "";
}

// ─── Card Builder ──────────────────────────────────────────────
function createMemberCard(member) {
  const card = document.createElement("div");
  card.classList.add("member-card");

  const roleClass = getRoleClass(member);
  if (roleClass) card.classList.add(roleClass);

  // A manually set photo/image in team.json wins; otherwise use the
  // standard {year}/{name}.webp location.
  const explicitImage = member.photo || member.image;
  const imgPath = explicitImage
    ? (explicitImage.startsWith("http") ? explicitImage : `${PROFILE_BASE}${member.year}/${explicitImage.split("/").pop()}`)
    : `${PROFILE_BASE}${member.year}/${member.name}.webp`;

  // Social links
  const linkedinLink = member.social.linkedin && member.social.linkedin !== "#"
    ? `<a href="${member.social.linkedin}" target="_blank" rel="noopener" aria-label="LinkedIn"><i class="fab fa-linkedin-in"></i></a>`
    : "";
  const githubLink = member.social.github
    ? `<a href="${member.social.github}" target="_blank" rel="noopener" aria-label="GitHub"><i class="fab fa-github"></i></a>`
    : "";
  const gmailLink = member.social.gmail
    ? `<a href="mailto:${member.social.gmail}" aria-label="Email"><i class="fas fa-envelope"></i></a>`
    : "";

  // Easter egg canvas
  const easterEggCanvas = member.easterEgg
    ? `<div class="member-3d"><canvas></canvas></div>`
    : "";

  const hasExperience = Boolean(member.experience?.trim());
  const experienceHTML = hasExperience
    ? `<div class="member-experience" aria-label="Contribution">
        <p>${member.experience}</p>
        <button class="member-close" type="button" aria-label="Close contribution">Close <span aria-hidden="true">&times;</span></button>
      </div>`
    : "";
  // Subsystem display — strip duplicate entries cleanly
  const uniqueSubs = [...new Set(member.subsystem)].join(" · ");

  const profileUrl = new URL(window.location.href);
  profileUrl.searchParams.set("member", member.name);
  profileUrl.searchParams.set("year", member.year);
  card.innerHTML = `
    ${easterEggCanvas}

    <div class="member-card-image">
      <div class="profile-img-container">
        <img
          src="${imgPath}"
          alt="Photo of ${member.name}"
          loading="lazy"
          class="member-img"
        >
      </div>
      <a class="member-name member-profile-link" href="${profileUrl.pathname}?${profileUrl.searchParams.toString()}">${member.name}</a>
    </div>
    <div class="member-card-content">
      <p class="member-role">${member.roles.join(" · ")}</p>
      <p class="member-subsystem">${uniqueSubs}</p>
      <div class="member-social">${linkedinLink}${githubLink}${gmailLink}</div>
      ${hasExperience ? '<button class="member-expand" type="button" aria-expanded="false">Read contribution <span aria-hidden="true">+</span></button>' : ""}
    </div>
    ${experienceHTML}
  `;

  if (hasExperience) {
    const expandButton = card.querySelector(".member-expand");
    card.classList.add("has-more");
    expandButton.addEventListener("click", () => {
      const expanded = card.classList.toggle("is-expanded");
      expandButton.setAttribute("aria-expanded", String(expanded));
    });
    card.querySelector(".member-close").addEventListener("click", () => {
      card.classList.remove("is-expanded");
      expandButton.setAttribute("aria-expanded", "false");
    });
  }

  // Image error fallback — try space/underscore x webp/jpg combos, then default
  const img = card.querySelector(".member-img");
  img.addEventListener("error", function () {
    if (this.src.includes("default.webp")) return;

    const stages = ["underscore-webp", "lowercase-webp", "lowercase-underscore-webp", "space-jpg", "underscore-jpg", "default"];
    const current = this.dataset.stage;
    const nextStage = current ? stages[stages.indexOf(current) + 1] : stages[0];

    const base = imgPath.slice(0, imgPath.lastIndexOf("/") + 1);
    const nameWithSpaces = member.name;
    const nameWithUnderscores = member.name.replace(/ /g, "_");

    switch (nextStage) {
      case "underscore-webp":
        this.src = `${base}${nameWithUnderscores}.webp`;
        break;
      case "lowercase-webp":
        this.src = `${base}${nameWithSpaces.toLowerCase()}.webp`;
        break;
      case "lowercase-underscore-webp":
        this.src = `${base}${nameWithUnderscores.toLowerCase()}.webp`;
        break;
      case "space-jpg":
        this.src = `${base}${nameWithSpaces}.jpg`;
        break;
      case "underscore-jpg":
        this.src = `${base}${nameWithUnderscores}.jpg`;
        break;
      case "default":
      default:
        this.src = DEFAULT_PROFILE_IMAGE;
        break;
    }

    this.dataset.stage = nextStage;
  });

  return card;
}

// ─── Sort order ────────────────────────────────────────────────
// Command > Lead > Member
function roleSortWeight(member) {
  const cls = getRoleClass(member);
  if (cls === "is-command") return 0;
  if (cls === "is-lead")    return 1;
  return 2;
}

// ─── Render ────────────────────────────────────────────────────
function renderMembers(year, subsystem) {
  grid.style.opacity = "0";

  setTimeout(() => {
    grid.innerHTML = "";

    const results = teamData
      .filter(m =>
        m.year === year &&
        (subsystem === "All" || (SUBSYSTEM_ALIASES[subsystem] || [subsystem]).some(label => m.subsystem.includes(label)))
      )
      .sort((a, b) => roleSortWeight(a) - roleSortWeight(b));

    // Update count
    if (countEl) {
      countEl.textContent = results.length
        ? `${results.length} member${results.length !== 1 ? "s" : ""}`
        : "—";
    }

    // Update dynamic heading
    if (rosterHeading) {
      const sub = subsystem === "All" ? "Full Team" : subsystem;
      rosterHeading.textContent = `${sub} — ${year}`;
    }

    if (results.length === 0) {
      grid.innerHTML = `
        <div class="no-members">
          <i class="fas fa-users-slash"></i>
          <p>No members found for this filter.</p>
        </div>`;
    } else {
      results.forEach((member, i) => {
        const card = createMemberCard(member);
        card.style.animationDelay = `${i * 0.055}s`;

        if (member.easterEgg) {
          card.classList.add("easter-egg");
          initCard3D(card);
        }

        grid.appendChild(card);
      });
    }

    grid.style.opacity = "1";
  }, 160);
}

function closeMemberProfile() {
  if (profileDialog?.open) profileDialog.close();
}

function finishMemberProfile() {
  if (!profileDialog) return;

  activeSubsystem = "All";
  subFilter.querySelectorAll(".filter-btn").forEach(btn => {
    const isAll = btn.closest(".year-item")?.dataset.subsystem === "All";
    btn.classList.toggle("active", isAll);
  });

  const targetYear = profileDialog.dataset.year;
  activeYear = targetYear;
  yearFilter.querySelectorAll(".year-item").forEach(item => {
    item.querySelector(".filter-btn")?.classList.toggle("active", item.dataset.year === targetYear);
  });

  const url = new URL(window.location.href);
  url.searchParams.delete("member");
  url.searchParams.set("year", targetYear);
  window.history.replaceState({}, "", `${url.pathname}?${url.searchParams.toString()}${url.hash}`);
  renderMembers(targetYear, "All");
  document.getElementById("filters-start")?.scrollIntoView({ block: "start", behavior: "smooth" });
}

function openMemberProfile(member) {
  const dialog = document.createElement("dialog");
  dialog.className = "member-profile-dialog";
  dialog.setAttribute("aria-labelledby", "member-profile-title");
  dialog.dataset.year = member.year;
  dialog.innerHTML = `
    <button class="member-profile-dialog__close" type="button" aria-label="Close ${member.name}'s profile">
      <span aria-hidden="true">&times;</span>
    </button>
    <p class="member-profile-dialog__eyebrow">Ashwa Racing · ${member.year}</p>
    <div class="member-profile-dialog__content"></div>
  `;

  const card = createMemberCard(member);
  card.classList.add("member-profile-feature");
  const nameLink = card.querySelector(".member-profile-link");
  const title = document.createElement("h2");
  title.className = "member-name member-profile-link";
  title.id = "member-profile-title";
  title.textContent = member.name;
  nameLink.replaceWith(title);
  dialog.querySelector(".member-profile-dialog__content").appendChild(card);

  dialog.querySelector(".member-profile-dialog__close").addEventListener("click", closeMemberProfile);
  dialog.addEventListener("click", event => {
    if (event.target === dialog) closeMemberProfile();
  });
  dialog.addEventListener("close", () => {
    finishMemberProfile();
    dialog.remove();
    profileDialog = null;
  }, { once: true });

  document.body.appendChild(dialog);
  profileDialog = dialog;
  dialog.showModal();
  dialog.querySelector(".member-profile-dialog__close").focus();
}

// ─── 3D Easter Egg ────────────────────────────────────────────
function initCard3D(card) {
  const canvas = card.querySelector(".member-3d canvas");
  if (!canvas || typeof THREE === "undefined") return;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.z = 2.5;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });

  function resize() {
    const r = card.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
  }

  resize();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x222222, 1.2));

  const loader = new THREE.TextureLoader();
  const tex    = loader.load(
    "https://assets.ashwaracing.org/images/team/members/2026/easteregg.png",
    () => renderer.render(scene, camera)
  );

  if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const mat  = new THREE.MeshStandardMaterial({ map: tex });
  const cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), [mat, mat, mat, mat, mat, mat]);
  scene.add(cube);

  let running = false;

  function animate() {
    if (!running) return;
    requestAnimationFrame(animate);
    cube.rotation.y += 0.01;
    cube.rotation.x += 0.005;
    renderer.render(scene, camera);
  }

  card.addEventListener("mouseenter", () => { resize(); running = true; animate(); });
  card.addEventListener("mouseleave", () => { running = false; });
}

// ─── Filter Scroll Helper ─────────────────────────────────────
function scrollStep(direction, wrapper, items) {
  let activeIdx = -1;
  for (let i = 0; i < items.length; i++) {
    if (items[i].querySelector?.(".filter-btn.active")) { activeIdx = i; break; }
  }
  if (activeIdx === -1) activeIdx = 1;

  let target = activeIdx + direction;
  const last = items.length - 1;
  if (target <= 0)    target = 1;
  if (target >= last) target = last - 1;

  const el = items[target];
  const x  = el.offsetLeft - wrapper.clientWidth / 2 + el.clientWidth / 2;
  wrapper.scroll({ left: x, behavior: "smooth" });
  el.querySelector(".filter-btn")?.click();
}

// ─── Arrow Buttons ────────────────────────────────────────────
document.getElementById("year-left").onclick  = () => scrollStep(-1, yearFilter, yearFilter.children);
document.getElementById("year-right").onclick = () => scrollStep( 1, yearFilter, yearFilter.children);
document.getElementById("subsystem-left").onclick  = () => scrollStep(-1, subFilter, subFilter.children);
document.getElementById("subsystem-right").onclick = () => scrollStep( 1, subFilter, subFilter.children);

// ─── Wheel Scroll ─────────────────────────────────────────────
yearFilter.addEventListener("wheel", e => {
  e.preventDefault();
  scrollStep(e.deltaY > 0 ? 1 : -1, yearFilter, yearFilter.children);
});
subFilter.addEventListener("wheel", e => {
  e.preventDefault();
  scrollStep(e.deltaY > 0 ? 1 : -1, subFilter, subFilter.children);
});

// ─── Subsystem Filter Click ───────────────────────────────────
subFilter.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const item = btn.closest(".year-item");
    const val  = item.dataset.subsystem;

    // Update description block
    if (descBox) {
      const tagEl  = descBox.querySelector(".desc-tag");
      const textEl = descBox.querySelector(".desc-text");
      const desc   = item.dataset.desc || "Members of Ashwa Racing.";
      const label  = val === "All" ? "All Subsystems" : val.toUpperCase();

      descBox.style.opacity = "0";
      setTimeout(() => {
        if (tagEl)  tagEl.textContent  = label;
        if (textEl) textEl.textContent = desc;
        descBox.style.opacity = "1";
      }, 150);
    }

    subFilter.querySelectorAll(".filter-btn").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    activeSubsystem = val;

    // Nothing to render until the data has loaded and a year is selected
    if (activeYear !== null) renderMembers(activeYear, activeSubsystem);
  });
});

// ─── Back to Top ──────────────────────────────────────────────
const backToTopBtn = document.getElementById("back-to-top");

window.addEventListener("scroll", () => {
  backToTopBtn.style.display = window.scrollY > 400 ? "flex" : "none";
});

backToTopBtn.addEventListener("click", () => {
  const anchor = document.getElementById("filters-start");
  (anchor || document.documentElement).scrollIntoView({ behavior: "smooth" });
});

// ─── Init ─────────────────────────────────────────────────────
window.addEventListener("load", async () => {

  const loaded = await teamReady;

  if (!loaded) {
    grid.innerHTML = `
      <div class="no-members">
        <i class="fas fa-users-slash"></i>
        <p>Team data couldn't be loaded right now. Please try again later.</p>
      </div>`;
    if (countEl) countEl.textContent = "—";
    return;
  }

  teamData = loaded;

  // Build year filter dynamically from teamData (newest to oldest)
  const years   = [...new Set(teamData.map(m => m.year))].sort((a, b) => Number(b) - Number(a));
  const spacers = yearFilter.querySelectorAll(".spacer");

  years.forEach(year => {
    const item          = document.createElement("div");
    item.className      = "year-item";
    item.dataset.year   = year;

    const btn           = document.createElement("button");
    btn.className       = "filter-btn";
    btn.textContent     = year;

    btn.addEventListener("click", () => {
      yearFilter.querySelectorAll(".filter-btn").forEach(x => x.classList.remove("active"));
      btn.classList.add("active");
      activeYear = year;
      renderMembers(activeYear, activeSubsystem);
    });

    item.appendChild(btn);
    yearFilter.insertBefore(item, spacers[spacers.length - 1]);
  });

  // Activate the first available year
  const firstYearItem = [...yearFilter.children].find(el => el.dataset.year === profileYear)
    || [...yearFilter.children].find(el => el.dataset.year);
  if (firstYearItem) {
    activeYear = firstYearItem.dataset.year;
    firstYearItem.querySelector(".filter-btn").classList.add("active");
  }

  renderMembers(activeYear, activeSubsystem);
  if (profileName) {
    const member = teamData.find(m => m.name === profileName && (!profileYear || m.year === profileYear));
    if (member) {
      activeYear = member.year;
      const matchingYear = [...yearFilter.children].find(el => el.dataset.year === member.year);
      if (matchingYear) {
        yearFilter.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
        matchingYear.querySelector(".filter-btn")?.classList.add("active");
      }
      openMemberProfile(member);
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete("member");
      window.history.replaceState({}, "", `${url.pathname}?${url.searchParams.toString()}${url.hash}`);
    }
  }

  // Centre the active filter items on load
  setTimeout(() => {
    if (firstYearItem) {
      yearFilter.scrollLeft =
        firstYearItem.offsetLeft - yearFilter.clientWidth / 2 + firstYearItem.clientWidth / 2;
    }
    const firstSubItem = [...subFilter.children].find(el => el.dataset.subsystem);
    if (firstSubItem) {
      subFilter.scrollLeft =
        firstSubItem.offsetLeft - subFilter.clientWidth / 2 + firstSubItem.clientWidth / 2;
    }
  }, 100);
});
