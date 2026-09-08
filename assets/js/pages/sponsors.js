"use strict";

// ─── Tier config ──────────────────────────────────────────────
// Controls visual treatment, section titles, nav labels, and card class
const TIERS = {
  "EXECUTIVE SPONSOR": {
    key:      "executive",
    label:    "Executive",
    title:    "Executive Sponsors",
    cardClass: "sp-card-executive",
    gridClass: "sp-grid-executive"
  },
  "PLATINUM SPONSOR": {
    key:      "platinum",
    label:    "Platinum",
    title:    "Platinum Sponsors",
    cardClass: "sp-card-platinum",
    gridClass: "sp-grid-platinum"
  },
  "GOLD SPONSOR": {
    key:      "gold",
    label:    "Gold",
    title:    "Gold Sponsors",
    cardClass: "sp-card-gold",
    gridClass: "sp-grid-gold"
  },
  "SILVER SPONSOR": {
    key:      "silver",
    label:    "Silver",
    title:    "Silver Sponsors",
    cardClass: "sp-card-silver",
    gridClass: "sp-grid-silver"
  },
  "TECHNICAL PARTNERS": {
    key:      "technical",
    label:    "Technical",
    title:    "Technical Partners",
    cardClass: "sp-card-technical",
    gridClass: "sp-grid-technical"
  }
};

// ─── Sponsor data ─────────────────────────────────────────────
const sponsorData = {
  "EXECUTIVE SPONSOR": [
    {
      logo: "assets/images/sponsors/rvce.svg",
      name: "RV College of Engineering",
      url: "https://rvce.edu.in",
      description: "Established in 1963, RVCE now offers 13 undergraduate and 13 master's degree programmes. Rated among the top ten self-financing engineering institutions in India with an annual intake of over 2,000 students."
    },
    {
      logo: "assets/images/sponsors/infineon.svg",
      name: "Infineon Technologies",
      url: "https://www.infineon.com",
      description: "Semiconductor solutions supporting power electronics, sensor integration, and microcontroller systems — powering Ashwa's electrical and testing programme."
    },
    // {
    //   logo: "assets/images/sponsors/bosch.svg",
    //   name: "Bosch",
    //   url: "https://www.bosch.in/",
    //   description: "A leading global supplier of technology and services with 412,000 associates worldwide. Bosch's mobility division provides critical components across our powertrain and safety systems."
    // },
    {
      logo: "assets/images/sponsors/adani.svg",
      name: "Adani Group",
      url: "https://www.adani.com/",
      description: "Market leader in transport logistics and energy utility portfolio businesses. Adani Group supports Ashwa Racing's infrastructure and logistics capabilities across competition seasons."
    },
    {
      logo: "assets/images/sponsors/dynamatics.svg",
      name: "Dynamatic Technologies",
      url: "https://dynamatics.com/",
      description: "Delivers precision-engineered products for Metallurgy, Aerospace, and Hydraulics applications — pioneering Indian private sector manufacture of complex aerostructures for global OEMs."
    }
  ],

  "PLATINUM SPONSOR": [
    { logo: "assets/images/sponsors/skf.svg",                url: "https://www.skf.com/in",                       name: "SKF" },
    { logo: "assets/images/sponsors/analogdevices.svg",      url: "https://www.analog.com/en/index.html",         name: "Analog Devices" },
    { logo: "assets/images/sponsors/sansera.png",            url: "https://sansera.in/",                          name: "Sansera Engineering" },
    { logo: "assets/images/sponsors/vrl.svg",                url: "https://vrlgroup.in/vrl_group_home.aspx",      name: "VRL Logistics" },
    { logo: "assets/images/sponsors/pegasyssystemspvtltd.png", url: "https://pegasyssystems.com/",               name: "Pegasys Systems" },
    { logo: "assets/images/sponsors/motul.svg",              url: "https://www.motul.com/en-IN",                  name: "Motul" },
    { logo: "assets/images/sponsors/lapp.svg",               url: "https://www.lapp.com/en_US/us/",               name: "LAPP" },
    { logo: "assets/images/sponsors/henkel.svg",             url: "https://www.henkel.in/",                       name: "Henkel" },
  ],

  "GOLD SPONSOR": [
    { logo: "assets/images/sponsors/tia.png",  url: "https://tiatechnology.in/",  name: "TIA Technology India" },
    { logo: "assets/images/sponsors/delhivery.svg",  url: "https://www.delhivery.com",  name: "Delhivery" },
    { logo: "assets/images/sponsors/aruanigrid.png", url: "https://aruanigrid.com/",    name: "Aruani Grid" }
  ],

  "SILVER SPONSOR": [
    { logo: "assets/images/sponsors/fastolex.png",    url: "https://www.tatanexarc.com/company/fastolex-products-utn3938fas42bno/", name: "Fastolex" },
    { logo: "assets/images/sponsors/speedworks.png",  url: "https://www.speedworks.cc/",                                           name: "Speedworks" },
    { logo: "https://assets.ashwaracing.org/images/sponsors/progressive-engineers.png", url: "https://www.progressiveengineers.co.in/", name: "Progressive Engineers" }
  ],

  "TECHNICAL PARTNERS": [
    { logo: "assets/images/sponsors/uniflex.svg",         url: "https://myuniflex.com/",          name: "Uniflex" },
    { logo: "assets/images/sponsors/royalbrothers.svg",   url: "https://www.royalbrothers.com/bangalore/bike-rentals", name: "Royal Brothers" },
    { logo: "assets/images/sponsors/barrelexhaust.webp",  url: "https://www.barrelexhaust.com/",  name: "Barrel Exhaust" },
    { logo: "assets/images/sponsors/bmcairfilter.png",    url: "https://www.bmcairfilters.com/en", name: "BMC Air Filter" },
    { logo: "assets/images/sponsors/bender.svg",          url: "https://www.bender-in.com/",      name: "Bender" },
    { logo: "assets/images/sponsors/elcoats.png",         url: "https://elcoats.com/",            name: "Elcoats" },
    { logo: "assets/images/sponsors/mercedes.png",        url: "https://www.akshayamotors.mercedes-benz.co.in/passengercars/about-us.html", name: "Mercedes-Benz" },
    { logo: "assets/images/sponsors/endlesscustoms.png",  url: "https://www.instagram.com/endlesscustomsblr/?hl=en", name: "Endless Customs" },
    // { logo: "assets/images/sponsors/dmgmori.svg",         url: "https://in.dmgmori.com/",         name: "DMG Mori" },
    { logo: "assets/images/sponsors/ansys.svg",           url: "https://www.ansys.com/en-in",     name: "Ansys" },
    { logo: "assets/images/sponsors/icp.jpg",             url: "http://www.icp-india.com/",       name: "ICP India" },
    { logo: "assets/images/sponsors/impulsepower.jpg",    url: "https://impulse-power.com/",      name: "Impulse Power" },
    // { logo: "assets/images/sponsors/joesgarage.png",      url: "https://www.instagram.com/joesgarageindia/?hl=en", name: "Joe's Garage" },
    { logo: "assets/images/sponsors/motousher.png",       url: "https://www.motousher.com/",      name: "Motousher" },
    { logo: "assets/images/sponsors/lioncircuits.svg",    url: "https://www.lioncircuits.com/",   name: "Lion Circuits" },
    { logo: "assets/images/sponsors/pankaj.png",          url: "https://pankaj.com/",             name: "Pankaj" },
    { logo: "assets/images/sponsors/magodlaser.png",     url: "https://www.magodlaser.in/",      name: "Magod Laser" },
    { logo: "assets/images/sponsors/unitedrubber.png",   url: "https://unitedrubber.com/", name: "United Rubber Industries (I) Pvt. Ltd." },
    { logo: "assets/images/sponsors/pcbway.svg",          url: "https://www.pcbway.com/",         name: "PCBWay" },
    { logo: "assets/images/sponsors/powerhaus.jpg",       url: "https://www.powerhaus.in/MainPageFiles/index.htm", name: "Powerhaus" },
    // { logo: "assets/images/sponsors/pcbpower.webp",       url: "https://www.pcbpower.com",        name: "PCB Power" },
    { logo: "assets/images/sponsors/pcprocess.png",       url: "https://www.pcprocess.in/",       name: "PC Process" },
    { logo: "assets/images/sponsors/triumphlaser.png",    url: "https://www.justdial.com/Bangalore/Triumph-Laser-Peenya-2nd-Stage/080PXX80-XX80-180307235407-G2Q7_BZDET", name: "Triumph Laser" },
    { logo: "assets/images/sponsors/solidworks.svg",      url: "https://www.solidworks.com/",     name: "SolidWorks" },
    { logo: "assets/images/sponsors/sve.png",             url: "#",                               name: "SVE" },
    { logo: "assets/images/sponsors/nd.png",              url: "#",                               name: "ND" },
    { logo: "assets/images/sponsors/btpl.png",            url: "#",                               name: "BTPL" },
    { logo: "assets/images/sponsors/objectify.png",       url: "https://objectify.co.in/",   name: "Objectify Technologies" },
    { logo: "assets/images/sponsors/realissimulation.svg",      url: "https://www.realis-simulation.com/",     name: "Realis Simulation" },
    // { logo: "assets/images/sponsors/team88india.png",     url: "https://www.instagram.com/team88india/?hl=en", name: "Team 88 India" },
  ]
};



// ─── DOM refs ──────────────────────────────────────────────────
const container = document.getElementById("sponsor-sections");
const tierNav   = document.getElementById("tier-nav");

// ─── Card builders ────────────────────────────────────────────

function buildExecutiveCard(sponsor) {
  const card = document.createElement("div");
  card.className = "sp-card-executive";

  const logoWrap = document.createElement("div");
  logoWrap.className = "sp-card-exec-logo";

  const img = document.createElement("img");
  img.src     = sponsor.logo;
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
  img.src     = sponsor.logo;
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
  const order = ["EXECUTIVE SPONSOR", "PLATINUM SPONSOR", "GOLD SPONSOR", "SILVER SPONSOR", "TECHNICAL PARTNERS"];
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
        img.src = sponsor.logo;
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
buildTierNav();
Object.entries(sponsorData).forEach(([key, sponsors]) => buildSection(key, sponsors));
buildHeroWall();
initReveal();