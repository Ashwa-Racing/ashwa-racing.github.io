"use strict";

(() => {
  const tiers = [
    { key: "executive", label: "Executive", title: "Executive partners", className: "sp-grid-executive" },
    { key: "platinum", label: "Platinum", title: "Platinum partners", className: "sp-grid-platinum" },
    { key: "gold", label: "Gold", title: "Gold partners", className: "sp-grid-gold" },
    { key: "silver", label: "Silver", title: "Silver partners", className: "sp-grid-silver" },
    { key: "technical", label: "Technical", title: "Technical partners", className: "sp-grid-technical" }
  ];
  const container = document.getElementById("sponsor-sections");
  const nav = document.getElementById("tier-nav");
  const escapeHTML = window.Ashwa?.escapeHTML || (value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char])));

  function logoUrl(filename) {
    return `https://assets.ashwaracing.org/images/sponsors/${encodeURIComponent(filename || "")}`;
  }

  function makeCard(sponsor, tier) {
    const card = document.createElement("article");
    card.className = `sp-card sp-card-${tier.key}`;
    const media = document.createElement("div");
    media.className = "sp-card-logo";
    const image = document.createElement("img");
    image.src = logoUrl(sponsor.logo);
    image.alt = "";
    image.loading = "lazy";
    image.decoding = "async";
    image.width = 240;
    image.height = 120;
    image.addEventListener("error", () => card.classList.add("sp-card-logo-missing"), { once: true });
    media.appendChild(image);

    const body = document.createElement("div");
    body.className = "sp-card-body";
    const title = document.createElement("h3");
    title.className = "sp-card-name";
    title.textContent = sponsor.name || "Partner";
    body.appendChild(title);
    if (sponsor.description) {
      const description = document.createElement("p");
      description.className = "sp-card-description";
      description.textContent = sponsor.description;
      body.appendChild(description);
    }

    if (sponsor.url && sponsor.url !== "#") {
      const link = document.createElement("a");
      link.className = "sp-card-link";
      link.href = sponsor.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("aria-label", `Visit ${sponsor.name || "partner"} website`);
      link.appendChild(image);
      media.replaceChildren(link);
    }

    card.append(media, body);
    return card;
  }

  function buildCategoryNav(tier, sponsors) {
    if (!sponsors.length) return;
    const link = document.createElement("a");
    link.className = "tier-nav-btn";
    link.href = `#tier-${tier.key}`;
    link.dataset.tier = tier.key;
    link.innerHTML = `<span class="tier-nav-count">${sponsors.length}</span><span class="tier-nav-label">${escapeHTML(tier.label)}</span>`;
    nav.appendChild(link);
  }

  function buildSection(tier, sponsors) {
    if (!sponsors.length) return;
    const section = document.createElement("section");
    section.className = "sp-tier-section";
    section.id = `tier-${tier.key}`;
    section.dataset.tier = tier.key;
    const heading = document.createElement("div");
    heading.className = "sp-tier-heading";
    heading.innerHTML = `<p class="sp-eyebrow"><span></span>${escapeHTML(tier.label)} tier</p><h2>${escapeHTML(tier.title)}</h2>`;
    const grid = document.createElement("div");
    grid.className = `sp-grid ${tier.className}`;
    sponsors.forEach(sponsor => grid.appendChild(makeCard(sponsor, tier)));
    section.append(heading, grid);
    container.appendChild(section);
  }

  async function init() {
    try {
      const data = window.Ashwa?.fetchJSON
        ? await window.Ashwa.fetchJSON("/assets/data/sponsors.json")
        : await fetch("/assets/data/sponsors.json").then(response => {
            if (!response.ok) throw new Error(`Sponsors request failed (${response.status})`);
            return response.json();
          });
      const total = tiers.reduce((sum, tier) => sum + (Array.isArray(data[tier.key]) ? data[tier.key].length : 0), 0);
      const count = document.getElementById("sponsor-count");
      if (count) count.textContent = total ? ` / ${total} organizations` : "";
      tiers.forEach(tier => {
        const sponsors = Array.isArray(data[tier.key]) ? data[tier.key].filter(item => item && (item.name || item.logo)) : [];
        buildCategoryNav(tier, sponsors);
        buildSection(tier, sponsors);
      });
      buildHeroWall(data);
      if (!total) showError("Partner listings are being updated.");
      if (window.Ashwa?.reveal) window.Ashwa.reveal(container.querySelectorAll(".sp-tier-heading, .sp-card"));
    } catch (error) {
      console.error("Unable to load sponsor data.", error);
      showError("Partner listings could not be loaded. Please try again later.");
    }
  }

  function buildHeroWall(data) {
    const wall = document.getElementById("hero-wall");
    if (!wall || window.Ashwa?.prefersReducedMotion) return;
    const logos = tiers.flatMap(tier => (Array.isArray(data[tier.key]) ? data[tier.key] : []).filter(s => s?.logo));
    if (!logos.length) return;
    const grid = document.createElement("div");
    grid.className = "sp-hero-wall-grid";
    for (let columnIndex = 0; columnIndex < 5; columnIndex += 1) {
      const column = document.createElement("div");
      column.className = "sp-wall-col";
      const track = document.createElement("div");
      track.className = `sp-wall-track ${columnIndex % 2 ? "up" : "down"}`;
      track.style.setProperty("--wall-duration", `${28 + columnIndex * 5}s`);
      const items = logos.filter((_, index) => index % 5 === columnIndex);
      [0, 1].forEach(() => items.forEach(sponsor => {
        const tile = document.createElement("div");
        tile.className = "sp-wall-chip";
        const image = document.createElement("img");
        image.src = logoUrl(sponsor.logo);
        image.alt = "";
        image.loading = "lazy";
        tile.appendChild(image);
        track.appendChild(tile);
      }));
      column.appendChild(track);
      grid.appendChild(column);
    }
    wall.appendChild(grid);
  }

  function showError(message) {
    container.replaceChildren();
    const notice = document.createElement("p");
    notice.className = "sp-error";
    notice.textContent = message;
    container.appendChild(notice);
  }

  if (container && nav) init();
})();
