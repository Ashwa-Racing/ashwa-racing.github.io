"use strict";

// ─── Tier config ──────────────────────────────────────────────
// Keys match the top-level keys in sponsors.json.
// Controls visual treatment, section titles, nav labels, and card class
const TIERS = {
  "executive": {
    key:      "executive",
    label:    "Executive",
    title:    "Executive Sponsors",
    cardClass: "sp-card-executive",
    gridClass: "sp-grid-executive"
  },
  "platinum": {
    key:      "platinum",
    label:    "Platinum",
    title:    "Platinum Sponsors",
    cardClass: "sp-card-platinum",
    gridClass: "sp-grid-platinum"
  },
  "gold": {
    key:      "gold",
    label:    "Gold",
    title:    "Gold Sponsors",
    cardClass: "sp-card-gold",
    gridClass: "sp-grid-gold"
  },
  "silver": {
    key:      "silver",
    label:    "Silver",
    title:    "Silver Sponsors",
    cardClass: "sp-card-silver",
    gridClass: "sp-grid-silver"
  },
  "technical": {
    key:      "technical",
    label:    "Technical",
    title:    "Technical Partners",
    cardClass: "sp-card-technical",
    gridClass: "sp-grid-technical"
  }
};

// ─── DOM refs ──────────────────────────────────────────────────
const container = document.getElementById("sponsor-sections");
const tierNav   = document.getElementById("tier-nav");

// ─── Data ─────────────────────────────────────────────────────
// Populated by init() after sponsors.json has been fetched.
let sponsorData = {};

async function loadSponsors() {
  const response = await fetch("/assets/data/sponsors.json");

  if (!response.ok) {
    throw new Error(`Failed to load sponsors: ${response.status}`);
  }

  return response.json();
}

function getSponsorLogo(sponsor) {
  return `https://assets.ashwaracing.org/images/sponsors/${sponsor.logo}`;
}

// ─── Card builders ────────────────────────────────────────────

function buildExecutiveCard(sponsor) {
  const card = document.createElement("div");
  card.className = "sp-card-executive";

  const logoWrap = document.createElement("div");
  logoWrap.className = "sp-card-exec-logo";

  const img = document.createElement("img");
  img.src     = getSponsorLogo(sponsor);
  img.alt     = sponsor.name || "Executive sponsor";
  img.loading = "lazy";

  if (sponsor.url && sponsor.url !== "#") {
    const link = document.createElement("a");
    link.href   = sponsor.url;
    link.target = "_blank";
    link.rel    = "noopener noreferrer";
    link.setAttribute("aria-label", `Visit ${sponsor.name}`);
    link.appendChild(img);
    logoWrap.appendChild(link);
  } else {
    logoWrap.appendChild(img);
  }

  const body = document.createElement("div");
  body.className = "sp-card-exec-body";

  // if (sponsor.name) {
  //   const name = document.createElement("div");
  //   name.className   = "sp-card-exec-name";
  //   name.textContent = sponsor.name;
  //   body.appendChild(name);
  // }

  // if (sponsor.description) {
  //   const desc = document.createElement("p");
  //   desc.className   = "sp-card-exec-desc";
  //   desc.textContent = sponsor.description;
  //   body.appendChild(desc);
  // }

  if (sponsor.url && sponsor.url !== "#") {
    const visitLink = document.createElement("a");
    visitLink.href      = sponsor.url;
    visitLink.target    = "_blank";
    visitLink.rel       = "noopener noreferrer";
    visitLink.className = "sp-card-exec-link";
    visitLink.innerHTML = `Visit <i class="fas fa-arrow-right"></i>`;
    body.appendChild(visitLink);
  }

  card.appendChild(logoWrap);
  card.appendChild(body);
  return card;
}

function buildLogoCard(sponsor, cardClass) {
  const card = document.createElement("div");
  card.className = cardClass;

  const img = document.createElement("img");
  img.src     = getSponsorLogo(sponsor);
  img.alt     = sponsor.name || "Sponsor";
  img.loading = "lazy";
  img.title   = sponsor.name || "";

  if (sponsor.url && sponsor.url !== "#") {
    const link = document.createElement("a");
    link.href   = sponsor.url;
    link.target = "_blank";
    link.rel    = "noopener noreferrer";
    link.setAttribute("aria-label", `Visit ${sponsor.name}`);
    link.appendChild(img);
    card.appendChild(link);
  } else {
    card.appendChild(img);
  }

  return card;
}

// ─── Section builder ─────────────────────────────────────────
function buildSection(categoryKey, sponsors) {
  const tier = TIERS[categoryKey];
  if (!tier) return;

  const section = document.createElement("section");
  section.className          = `sp-tier-section`;
  section.dataset.tier       = tier.key;
  section.id                 = `tier-${tier.key}`;

  // Header
  const header = document.createElement("div");
  header.className = "sp-tier-header";

  const labelGroup = document.createElement("div");
  labelGroup.className = "sp-tier-label-group";

  // const badge = document.createElement("div");
  // badge.className   = "sp-tier-badge";
  // badge.textContent = tier.label;

  const title = document.createElement("h2");
  title.className   = "sp-tier-title";
  title.textContent = tier.title;

  // labelGroup.appendChild(badge);
  labelGroup.appendChild(title);

  header.appendChild(labelGroup);

  // Grid
  const grid = document.createElement("div");
  grid.className = tier.gridClass;

  sponsors.forEach(sponsor => {
    let card;
    if (tier.key === "executive") {
      card = buildExecutiveCard(sponsor);
    } else {
      card = buildLogoCard(sponsor, tier.cardClass);
    }
    grid.appendChild(card);
  });

  section.appendChild(header);
  section.appendChild(grid);
  container.appendChild(section);

  return section;
}

// ─── Hero wall: flatten + interleave across all tiers ─────────
// Round-robins through Exec/Platinum/Gold/Silver/Technical simultaneously
// so no column is ever a run of same-tier logos, even though Technical
// alone outnumbers the other four tiers combined.
function interleaveAllTiers() {
  const order = ["executive", "platinum", "gold", "silver", "technical"];
  const queues = order.map(key =>
    (sponsorData[key] || []).map(s => ({ ...s, tierKey: TIERS[key].key }))
  );

  const result = [];
  let pulled = true;
  while (pulled) {
    pulled = false;
    for (const q of queues) {
      if (q.length) {
        result.push(q.shift());
        pulled = true;
      }
    }
  }
  return result;
}

function buildHeroWall(columnCount = 6) {
  const wall = document.getElementById("hero-wall");
  if (!wall) return;

  const mixed = interleaveAllTiers();
  if (!mixed.length) return;

  const grid = document.createElement("div");
  grid.className = "sp-hero-wall-grid";

  const cols = Array.from({ length: columnCount }, () => []);
  mixed.forEach((sponsor, i) => cols[i % columnCount].push(sponsor));

  // stagger duration + alternate direction per column for the parallax feel
  const durations = [42, 27, 50, 22, 36, 30];
  const directions = ["down", "up", "down", "up", "down", "up"];

  cols.forEach((list, i) => {
    if (!list.length) return;

    const col = document.createElement("div");
    col.className = "sp-wall-col";

    const track = document.createElement("div");
    track.className = `sp-wall-track ${directions[i % directions.length]}`;
    track.style.animationDuration = `${durations[i % durations.length]}s`;

    const buildSet = () => {
      const frag = document.createDocumentFragment();
      list.forEach(sponsor => {
        const chip = document.createElement("div");
        chip.className = `sp-wall-chip sp-wall-chip--${sponsor.tierKey}`;

        const img = document.createElement("img");
        img.src = getSponsorLogo(sponsor);
        img.alt = sponsor.name || "Sponsor";
        img.loading = "lazy";

        chip.appendChild(img);
        frag.appendChild(chip);
      });
      return frag;
    };

    // duplicate once for the seamless 0 → -50% loop
    track.appendChild(buildSet());
    track.appendChild(buildSet());
    col.appendChild(track);
    grid.appendChild(col);
  });

  wall.appendChild(grid);
}

// ─── Tier nav builder ─────────────────────────────────────────
function buildTierNav() {
  Object.entries(sponsorData).forEach(([categoryKey, sponsors]) => {
    const tier = TIERS[categoryKey];
    if (!tier) return;

    const btn = document.createElement("a");
    btn.className        = "tier-nav-btn";
    btn.href             = `#tier-${tier.key}`;
    btn.dataset.tier     = tier.key;
    btn.setAttribute("aria-label", `Jump to ${tier.title}`);

    btn.innerHTML = `
      <span class="tier-nav-count">${sponsors.length}</span>
      <span class="tier-nav-label">${tier.label}</span>
    `;

    tierNav?.appendChild(btn);
  });
}

// ─── Intersection observer — scroll reveal ────────────────────
function initReveal() {
  const sectionObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");

      // Stagger cards inside
      entry.target.querySelectorAll(
        ".sp-card-executive, .sp-card-platinum, .sp-card-gold, .sp-card-silver, .sp-card-technical"
      ).forEach((card, i) => {
        setTimeout(() => card.classList.add("visible"), i * 60);
      });

      sectionObs.unobserve(entry.target);
    });
  }, { threshold: 0.07, rootMargin: "0px 0px -40px 0px" });

  document.querySelectorAll(".sp-tier-section").forEach(s => sectionObs.observe(s));
}

// ─── Init ─────────────────────────────────────────────────────
async function init() {
  try {
    sponsorData = await loadSponsors();
  } catch (err) {
    console.error(err);
    if (container) {
      container.innerHTML = `<p class="sp-error">Sponsors couldn't be loaded right now.</p>`;
    }
    return;
  }

  buildTierNav();
  Object.entries(sponsorData).forEach(([key, sponsors]) => buildSection(key, sponsors));
  buildHeroWall();
  initReveal();
}

init();