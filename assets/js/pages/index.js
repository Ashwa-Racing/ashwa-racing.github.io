"use strict";

/* ── Sponsor data ──────────────────────────────────────────────
   sponsors.json is grouped by tier; the home-page strip wants one
   flat list, so tiers are concatenated in this order.
   Fetch starts as soon as the script runs so it's usually done by
   the time DOMContentLoaded fires.
   ────────────────────────────────────────────────────────────── */
const SPONSORS_URL      = "/assets/data/sponsors.json";
const SPONSOR_LOGO_BASE = "https://assets.ashwaracing.org/images/sponsors/";
const SPONSOR_TIER_ORDER = ["executive", "platinum", "gold", "silver", "technical"];

async function loadSponsorList() {
  const response = await fetch(SPONSORS_URL, {
    signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined
  });

  if (!response.ok) {
    throw new Error(`Failed to load sponsors: ${response.status}`);
  }

  const data = await response.json();
  return SPONSOR_TIER_ORDER.flatMap(tier => data[tier] || []);
}

const sponsorsReady = loadSponsorList().catch(err => {
  console.error(err);
  return [];
});

// Resolves when loader.js releases the page (or after a fallback delay
// in case loader.js is missing/broken), so animations don't run hidden
// behind the loader overlay.
const siteReady = new Promise(resolve => {
  if (window.__siteReady) return resolve();
  document.addEventListener("site:ready", resolve, { once: true });
  setTimeout(resolve, 12000);
});

function sponsorLogoUrl(sponsor) {
  const logo = sponsor.logo || "";
  return /^(https?:)?\/\//.test(logo) ? logo : SPONSOR_LOGO_BASE + logo;
}

function escapeAttr(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

/* ── Background video init ─────────────────────────────────────
   Top-level now (not IIFE-scoped) so initSpotlightToggle can also
   call it on-demand when a spotlight layer becomes active.
   ────────────────────────────────────────────────────────────── */
function initBgVideo(video) {
  if (!video) return;

  const reveal = () => video.classList.add('is-loaded');

  if (video.readyState >= 3) {
    reveal();
  } else {
    video.addEventListener('canplay', reveal, { once: true });
  }

  const playPromise = video.play();
  if (playPromise !== undefined) {
    playPromise.catch(() => {
      video.removeEventListener('canplay', reveal);
    });
  }
}

(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // .spotlight-bg-video intentionally excluded here — initSpotlightToggle()
  // starts the active EV layer's video on load, and lazily starts CV's
  // only when the visitor toggles to it, so we're not decoding two loops
  // in the background at once.
  document
    .querySelectorAll('.hero-video')
    .forEach(initBgVideo);
})();

/* ── Car spotlight toggle (EV / CV) ────────────────────────────
   Crossfades bg layers + content, lazily starts/stops the video
   so only the visible car's video is ever decoding with 3s switch
   ────────────────────────────────────────────────────────────── */
function initSpotlightToggle() {
  const section = document.getElementById('car-spotlight');
  if (!section) return;

  const toggleBtns = section.querySelectorAll('.spotlight-toggle-btn');
  const bgLayers   = section.querySelectorAll('.spotlight-bg-layer');
  const contents   = section.querySelectorAll('.spotlight-content');

  function setActive(car) {
    section.dataset.active = car;
    section.classList.toggle('spotlight--ev', car === 'ev');

    toggleBtns.forEach(btn => {
      const active = btn.dataset.car === car;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    bgLayers.forEach(layer => {
      const isActive = layer.dataset.car === car;
      layer.classList.toggle('is-active', isActive);

      const video = layer.querySelector('.spotlight-bg-video');
      if (!video) return;
      if (isActive) {
        initBgVideo(video);
      } else {
        video.pause();
      }
    });

    contents.forEach(content => {
      content.classList.toggle('is-active', content.dataset.car === car);
    });
  }

  // ── One-time auto-advance to CV after 3s ──────────────────────
  // Cancelled if the visitor touches the toggle themselves first,
  // and never fires again after — this is a first-glance nudge,
  // not a recurring carousel.
  let autoAdvanceTimer = null;
  let autoAdvanceFired = false;

  function cancelAutoAdvance() {
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      autoAdvanceTimer = null;
    }
  }

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    autoAdvanceTimer = setTimeout(() => {
      autoAdvanceTimer = null;
      if (autoAdvanceFired) return;
      autoAdvanceFired = true;
      // only advance if the visitor hasn't already moved off EV themselves
      if (section.dataset.active === 'ev') setActive('cv');
    }, 3000);
  }

  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      cancelAutoAdvance();
      autoAdvanceFired = true; // manual interaction retires the nudge for good
      setActive(btn.dataset.car);
    });
  });

  const cvVideo = section.querySelector('[data-car="cv"] .spotlight-bg-video');
  if (cvVideo) cvVideo.pause();

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const evVideo = section.querySelector('[data-car="ev"] .spotlight-bg-video');
    if (evVideo) initBgVideo(evVideo);
  }
}

function renderSponsorStrip(sponsors) {
    const track = document.getElementById('sponsor-track');
    if (!track || !sponsors.length) return;

    const cardsHtml = sponsors.map(s => {
        const logo = `
            <img
                src="${escapeAttr(sponsorLogoUrl(s))}"
                alt="${escapeAttr(s.name)}"
                loading="lazy"
                decoding="async"
                width="360"
                height="360">
        `;

        // Sponsors without a website (url "#" or missing) get a plain card
        // instead of a link that would open a blank tab.
        if (!s.url || s.url === "#") {
            return `<div class="sp-card">${logo}</div>`;
        }

        return `<a href="${escapeAttr(s.url)}"
                    target="_blank"
                    rel="noopener"
                    class="sp-card">${logo}</a>`;
    }).join('');

    track.innerHTML = cardsHtml + cardsHtml;
}

function preloadSponsorImages(sponsors) {
    return Promise.all(
        sponsors.map(s => new Promise(resolve => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = resolve;
            img.src = sponsorLogoUrl(s);
        }))
    );
}

async function initHome() {
    // Sponsors first: initReveal() looks for the strip's elements,
    // so they need to be in the DOM before it runs.
    const sponsors = await sponsorsReady;
    renderSponsorStrip(sponsors);

    // Non-blocking sponsor preloading.
    preloadSponsorImages(sponsors);

    // Hold reveals, counters and the 3s spotlight auto-advance until
    // the loader has actually lifted, otherwise they play out (and the
    // timer burns down) behind the overlay.
    await siteReady;

    // Restart hero loops from 0 so they start fresh as the loader lifts
    // (they've been playing behind the overlay since script load).
    document.querySelectorAll('.hero-video').forEach(v => {
        try { v.currentTime = 0; } catch (e) {}
    });

    initReveal();
    initMaskReveal();
    initNewsletterPreview();
    initStatCounters();
    initSpotlightToggle();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHome, { once: true });
} else {
    initHome();
}

/* ── Scroll reveal ────────────────────────────────────────────
   Runs per-section groups (not one flat list) so each group's
   stagger restarts from 0 — cards cascade in together as their
   own section enters view, instead of inheriting a running delay
   from earlier sections on the page.
   ────────────────────────────────────────────────────────────── */
function initReveal() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const groups = [
    document.querySelectorAll(".stat-bar-grid .stat"),
    document.querySelectorAll(".sponsors-grid img"),
    document.querySelectorAll(".spotlight-toggle, .spotlight-content > *:not(h2)"),
    document.querySelectorAll(".news-grid .news-card"),
    document.querySelectorAll(".launch-teaser-content > *:not(.launch-teaser-heading)"),
  ];

  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("reveal-visible");
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px" });

  groups.forEach(list => {
    list.forEach((el, i) => {
      el.classList.add("reveal");
      el.style.transitionDelay = `${Math.min(i * 0.08, 0.4)}s`;
      io.observe(el);
    });
  });
}

/* ── Heading line-mask reveal ─────────────────────────────────
   Wraps each target heading's existing markup in a clipped span
   so the text slides up from behind a hard edge on scroll-in,
   rather than a flat fade — the "premium studio" heading move.
   Runs once per element (innerHTML rewrite), safe with the <em>/
   <br> already inside these headings since it just wraps around
   them.
   ────────────────────────────────────────────────────────────── */
function initMaskReveal() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const targets = document.querySelectorAll(
    ".spotlight-content h2, .launch-teaser-heading, .news .container > h2"
  );
  if (!targets.length) return;

  targets.forEach(el => {
    el.classList.add("reveal-mask");
    el.innerHTML = `<span class="reveal-mask-inner">${el.innerHTML}</span>`;
  });

  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("reveal-visible");
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.3, rootMargin: "0px 0px -60px" });

  targets.forEach(el => io.observe(el));
}

/* ── Newsletter preview (unchanged) ── */
function initNewsletterPreview() {
  const card  = document.getElementById("blog-card");
  const thumb = document.getElementById("blog-thumb");
  if (!card || !thumb) return;

  const latest = {
    title:   "June 2026 — General Newsletter",
    cover:   "https://assets.ashwaracing.org/cdn-cgi/image/width=600,format=avif,quality=80/images/newsletters/2026/2026-06.png",
    pdf:     "https://assets.ashwaracing.org/pdfs/newsletters/2026/2026-06-general.pdf",
    date:    "June 2026",
    excerpt: "RZ-XX7C electrical redesign consolidation; RZ-XX8E simulation work sets FDR and energy targets for the EV prototype; plus May expenses, sponsor roster, and team directory."
  };

  thumb.src = latest.cover;
  document.getElementById("blog-title").textContent   = latest.title;
  document.getElementById("blog-excerpt").textContent = latest.excerpt;
  document.getElementById("blog-date").textContent    = latest.date;
  card.href = latest.pdf;
}

/* ── Stat bar count-up (unchanged) ── */
function initStatCounters() {
  const nums = document.querySelectorAll(".stat-num[data-count]");
  if (!nums.length) return;

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const animate = (el) => {
    const target = parseInt(el.dataset.count, 10) || 0;
    const suffix = el.dataset.suffix || "";

    if (reduceMotion) {
      el.textContent = target + suffix;
      return;
    }

    const duration = 3600;
    const start = performance.now();

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  };

  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      animate(entry.target);
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.5 });

  nums.forEach(el => io.observe(el));
}