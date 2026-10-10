/* Ashwa Racing organization chart renderer. */
(() => {
  "use strict";
  const { ASSET_HOST, escapeHTML, fetchJSON, imgUrl } = window.Ashwa;
  const ORG_URL = "/assets/data/org-structure.json";
  const DEFAULT_PHOTO = `${ASSET_HOST}images/team/default.webp`;
  const PROGRAMMES = {
    cv: { label: "Combustion", color: "#0ea5e9" }, hybrid: { label: "Hybrid", color: "#e8001d" },
    ev: { label: "Electric", color: "#2E6FF2" }, dv: { label: "Driverless", color: "#00c2a8" },
    hyperloop: { label: "Hyperloop", color: "#7c3aed" }, management: { label: "Management", color: "#6b7280" }
  };
  const PROGRAMME_ALIASES = { hyb: "hybrid" };
  const ORG_COLORS = { advisor: "#e8001d", committee: "#f59e0b", subsystem: "#eab308", fallback: "#e8001d" };
  function initials(name = "") { return String(name).split(" ").map(word => word[0]).join("").slice(0, 2).toUpperCase(); }
  function programmeKey(id) { return PROGRAMME_ALIASES[id] || id; }

/* ============================================================
   ORG CHART
   ============================================================ */
function orgMemberHTML(member) {
  const name = String(member.name ?? "");
  const featured = member.featured ? " org-mem--featured" : "";
  const avatar = member.photo
    ? `<img src="${escapeHTML(imgUrl(member.photo, 96))}" alt="" class="org-mem-photo" data-photo width="36" height="36" loading="lazy" decoding="async">`
    : `<span class="org-mem-ini" aria-hidden="true">${escapeHTML(initials(name))}</span>`;
  const desig = member.designation
    ? `<span class="org-mem-desig">${escapeHTML(member.designation)}</span>`
    : "";

  return `<div class="org-mem${featured}">${avatar}<div class="org-mem-meta"><span class="org-mem-name">${escapeHTML(name)}</span>${desig}</div></div>`;
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

function orgPersonCardHTML(member) {
  const featured = Boolean(member.featured);
  const color = featured || /faculty advisor/i.test(member.designation || "")
    ? ORG_COLORS.advisor
    : ORG_COLORS.committee;
  const className = featured ? " org-card--featured" : "";
  return `<article class="org-card org-card--person${className}" style="--nc:${color}">${orgMemberHTML(member)}</article>`;
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

  if (data.governance?.groups?.length) {
    const groups = data.governance.groups.map(group => `
      <section class="org-governance-group">
        <h4 class="org-governance-group-title">${escapeHTML(group.title)}</h4>
        <div class="org-grid org-grid--gov">${(group.members || []).map(orgPersonCardHTML).join("")}</div>
      </section>`).join("");
    bands.push(orgBandHTML(data.governance, "org-governance-groups", groups));
  } else if (data.governance?.members?.length) {
    const cards = data.governance.members.map(orgPersonCardHTML).join("");
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

  document.addEventListener("error", event => {
    const img = event.target;
    if (!(img instanceof HTMLImageElement) || !img.matches("[data-photo]") || img.dataset.fallback) return;
    img.dataset.fallback = "1";
    img.src = DEFAULT_PHOTO;
  }, true);
  fetchJSON(ORG_URL, {}, 8000).then(renderOrgChart).catch(error => {
    console.error(error);
    renderOrgChart(null);
  });
})();