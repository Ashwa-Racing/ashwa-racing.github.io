"use strict";

/* ============================================================
   ASHWA RACING — utils.js
   Helpers shared by page scripts, exposed as window.Ashwa so they
   can't collide with names in header.js / loader.js.
   Usage in a page script:
     const { escapeHTML, fetchJSON, observeOnce } = window.Ashwa;
   ============================================================ */
(() => {
  const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const ASSET_HOST = "https://assets.ashwaracing.org/";

  /* Escape anything that goes into innerHTML (team/blog data is user-editable). */
  function escapeHTML(value = "") {
    return String(value ?? "").replace(/[&<>"']/g, c => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]
    ));
  }

  async function fetchJSON(url, options = {}, timeoutMs = 5000) {
    const response = await fetch(url, { ...options, signal: AbortSignal.timeout?.(timeoutMs) });
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
    return response.json();
  }

  /* Calls onEnter(el) once per element, the first time it scrolls into view. */
  function observeOnce(elements, onEnter, options) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        obs.unobserve(entry.target);
        onEnter(entry.target);
      });
    }, options);
    elements.forEach(el => io.observe(el));
  }

  /* Fade-up reveal. Staggers from 0 (capped), and strips the reveal classes
     once finished so they don't leave transition delays on hover states. */
  function reveal(elements) {
    const items = [...elements];
    if (prefersReducedMotion || !items.length) return;

    items.forEach((el, i) => {
      el.classList.add("reveal");
      el.style.transitionDelay = `${Math.min(i * 0.08, 0.4)}s`;
    });

    observeOnce(items, el => {
      const delay = parseFloat(el.style.transitionDelay) || 0;
      el.classList.add("reveal-visible");
      setTimeout(() => {
        el.classList.remove("reveal", "reveal-visible");
        el.style.transitionDelay = "";
      }, (delay + 0.7) * 1000 + 50);
    }, { threshold: 0.12, rootMargin: "0px 0px -40px" });
  }

  /* Photos/covers on the assets domain are resized + re-encoded at the edge
     (Cloudflare Images). Anything else is returned untouched. */
  function imgUrl(src, width) {
    if (!src || !src.startsWith(ASSET_HOST) || src.includes("/cdn-cgi/")) return src;
    return `${ASSET_HOST}cdn-cgi/image/width=${width},format=auto,quality=80/${src.slice(ASSET_HOST.length)}`;
  }

  window.Ashwa = Object.freeze({
    prefersReducedMotion, ASSET_HOST, escapeHTML, fetchJSON, observeOnce, reveal, imgUrl
  });
})();