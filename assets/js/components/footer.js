"use strict";

const highContrastSponsorLogos = new Set([
  "fastolex.png",
  "progressive-engineers.png",
  "endlesscustoms.png",
  "icp.jpg",
  "mercedes.png",
  "triumphlaser.png",
  "objectify.png"
]);

export async function initFooterSponsors() {
  const container = document.querySelector("[data-footer-sponsor-tiers]");
  if (!container) return;

  if (/\/sponsors(?:\.html)?\/?$/i.test(location.pathname)) {
    container.closest(".footer-sponsors").hidden = true;
    return;
  }

  try {
    const response = await fetch("/assets/data/sponsors.json");
    if (!response.ok) throw new Error("Sponsor data unavailable");

    const data = await response.json();
    const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);

    const sponsorHTML = (sponsor, tier) => {
      const logoName = String(sponsor.logo || "");
      const localTechnicalLogo = ["royalbrothers.svg", "bender.svg"].includes(logoName.toLowerCase());
      const logo = /^https?:\/\//i.test(logoName)
        ? logoName
        : localTechnicalLogo
          ? `/assets/images/sponsors/${encodeURIComponent(logoName)}`
          : `https://assets.ashwaracing.org/cdn-cgi/image/height=160,format=auto,quality=90/images/sponsors/${encodeURIComponent(logoName)}`;
      const fallbackLogo = localTechnicalLogo
        ? logo
        : /^https?:\/\//i.test(logoName)
          ? logoName
          : `https://assets.ashwaracing.org/images/sponsors/${encodeURIComponent(logoName)}`;
      const name = escape(sponsor.name || "Sponsor");
      const contrast = highContrastSponsorLogos.has(String(sponsor.logo).toLowerCase())
        ? " footer-sponsor-logo--contrast"
        : "";
      const progressive = String(sponsor.logo).toLowerCase() === "progressive-engineers.png"
        ? " footer-sponsor-logo--progressive"
        : "";
      const invertDark = ["rvce.svg", "dynamatics.svg"].includes(String(sponsor.logo).toLowerCase())
        ? " footer-sponsor-logo--invert-dark"
        : "";
      const normalizedLogoName = logoName.toLowerCase();
      const wideTechnicalWordmark = ["royalbrothers.svg", "bender.svg"].includes(normalizedLogoName)
        ? ` footer-sponsor-logo--${normalizedLogoName.replace(".svg", "")}`
        : "";
      const image = `<img class="footer-sponsor-logo${contrast}${progressive}${invertDark}${wideTechnicalWordmark}" data-src="${escape(logo)}" data-fallback-src="${escape(fallbackLogo)}" alt="${name}" loading="lazy" decoding="async">`;
      const fallback = `<span class="footer-sponsor-fallback" hidden>${name}</span>`;
      const content = sponsor.url && sponsor.url !== "#"
        ? `<a href="${escape(sponsor.url)}" target="_blank" rel="noopener noreferrer" aria-label="${name}">${image}${fallback}</a>`
        : `<span aria-label="${name}">${image}${fallback}</span>`;

      return `<div class="footer-sponsor-partner footer-sponsor-partner--${tier}">${content}</div>`;
    };

    const sponsorsFor = tier => Array.isArray(data[tier])
      ? data[tier].filter(item => item?.logo)
      : [];

    const tierMarkup = (tier, label) => {
      const sponsors = sponsorsFor(tier);
      if (!sponsors.length) return "";

      const items = sponsors.map(sponsor => sponsorHTML(sponsor, tier)).join("");
      return `<section class="footer-sponsor-tier footer-sponsor-tier--${tier}" aria-label="${label} sponsors"><div>${items}</div></section>`;
    };

    const technicalGroups = [[], []];
    sponsorsFor("technical").forEach((sponsor, index) => {
      technicalGroups[index % 2].push(sponsorHTML(sponsor, "technical"));
    });

    const partnerMarkup = technicalGroups.some(group => group.length)
      ? `<section class="footer-sponsor-partners" aria-label="Technical partners">${technicalGroups.map(group => {
        const gridClass = group.length === 13
          ? "footer-sponsor-partner-grid footer-sponsor-partner-grid--13"
          : "footer-sponsor-partner-grid";
        return `<div class="${gridClass}">${group.join("")}</div>`;
      }).join("")}</section>`
      : "";

    const premiumMarkup = [
      tierMarkup("executive", "Executive"),
      tierMarkup("platinum", "Platinum")
    ].join("");

    container.innerHTML = [
      `<div class="footer-sponsor-premium-tiers">${premiumMarkup}</div>`,
      tierMarkup("gold", "Gold"),
      tierMarkup("silver", "Silver"),
      partnerMarkup
    ].join("");

    container.querySelectorAll("img[data-src][data-fallback-src]").forEach(image => {
      const useFallback = () => {
        if (!image.dataset.fallbackTried && image.dataset.fallbackSrc !== image.src) {
          image.dataset.fallbackTried = "true";
          image.src = image.dataset.fallbackSrc;
          return;
        }

        image.hidden = true;
        const label = image.parentElement.querySelector(".footer-sponsor-fallback");
        if (label) label.hidden = false;
      };

      image.addEventListener("error", useFallback);
      image.addEventListener("load", () => {
        if (image.naturalWidth <= 1 || image.naturalHeight <= 1) useFallback();
      });
      image.src = image.dataset.src;
    });
  } catch (error) {
    console.warn("Ashwa sponsors: failed to load footer sponsors.", error);
  }
}
