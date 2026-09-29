"use strict";

/*
 * ============================================================
 * ASHWA RACING — GLOBAL LOADER
 * ============================================================
 *
 * Responsibilities:
 *   1. Load sponsors.json.
 *   2. Preload every sponsor logo.
 *   3. Track every page image.
 *   4. Track stylesheets.
 *   5. Wait for fonts.
 *   6. Fully buffer page videos/audio where possible.
 *   7. Display sponsor tiers based on actual loading progress.
 *   8. Reveal the page only after the asset gate is complete.
 *
 * sponsors.json is the single source of truth.
 * ============================================================
 */

(() => {
  const loader = document.getElementById("site-loader");

  if (!loader) {
    window.__siteReady = true;
    return;
  }

  const progressBar = loader.querySelector(".loader-progress-bar");
  const percent = document.getElementById("loader-percent");
  const status = document.getElementById("loader-status");
  const sponsorTier = document.getElementById("loader-sponsor-tier");
  const sponsorGrid = document.getElementById("loader-sponsor-grid");

  const SPONSORS_URL = "/assets/data/sponsors.json";
  const SPONSOR_LOGO_BASE =
    "https://assets.ashwaracing.org/images/sponsors/";

  const TIER_ORDER = [
    "executive",
    "platinum",
    "gold",
    "silver",
    "technical"
  ];

  const TIER_LABELS = {
    executive: "EXECUTIVE PARTNERS",
    platinum: "PLATINUM PARTNERS",
    gold: "GOLD PARTNERS",
    silver: "SILVER PARTNERS",
    technical: "TECHNICAL PARTNERS"
  };

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let finished = false;

  // Failsafes: no single stalled request may keep the site hidden.
  const FETCH_TIMEOUT_MS = 5000;
  const MAX_WAIT_MS = 8000;

  /*
   * ----------------------------------------------------------
   * Progress state
   * ----------------------------------------------------------
   */

  const state = {
    tasks: [],
    completed: 0,
    total: 0,

    sponsors: [],
    sponsorLoaded: 0,
    sponsorTotal: 0,

    currentTier: null,
    currentSponsorPage: 0
  };

  function setProgress(value) {
    const clamped = Math.max(0, Math.min(100, value));

    if (progressBar) {
      progressBar.style.width = `${clamped}%`;
    }

    if (percent) {
      percent.textContent =
        `${String(Math.round(clamped)).padStart(2, "0")}%`;
    }
  }

  function updateProgress() {
    if (!state.total) {
      setProgress(0);
      return;
    }

    const progress =
      (state.completed / state.total) * 100;

    setProgress(progress);
  }

  function completeTask() {
    state.completed++;
    updateProgress();
  }

  /*
   * ----------------------------------------------------------
   * URL helpers
   * ----------------------------------------------------------
   */

  function sponsorLogoUrl(sponsor) {
    const logo = sponsor?.logo || "";

    if (/^(https?:)?\/\//i.test(logo)) {
      return logo;
    }

    return `${SPONSOR_LOGO_BASE}${logo}`;
  }

  /*
   * ----------------------------------------------------------
   * Safe attribute escaping
   * ----------------------------------------------------------
   */

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /*
   * ----------------------------------------------------------
   * Sponsor loading
   * ----------------------------------------------------------
   */

  async function loadSponsors() {
    try {
      const response = await fetch(
        SPONSORS_URL,
        {
          cache: "default",
          signal: AbortSignal.timeout
            ? AbortSignal.timeout(FETCH_TIMEOUT_MS)
            : undefined
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load sponsors.json: ${response.status}`
        );
      }

      const data = await response.json();

      state.sponsors = TIER_ORDER.flatMap(tier =>
        (data[tier] || []).map(sponsor => ({
          ...sponsor,
          tier
        }))
      );

      state.sponsorTotal = state.sponsors.length;

      return data;
    } catch (error) {
      console.error(
        "[Ashwa Loader] sponsors.json failed:",
        error
      );

      state.sponsors = [];
      state.sponsorTotal = 0;

      return {};
    }
  }

  /*
   * ----------------------------------------------------------
   * Sponsor logo preload
   *
   * Every sponsor logo is requested before the page is released.
   *
   * Image() downloads the entire image resource; decode() is
   * additionally used where supported so the logo is ready for
   * rendering rather than merely fetched.
   * ----------------------------------------------------------
   */

  function preloadSponsorLogo(sponsor) {
    return new Promise(resolve => {
      const img = new Image();

      const done = async success => {
        if (success && typeof img.decode === "function") {
          try {
            await img.decode();
          } catch {
            // Image was fetched but decode() may already have
            // happened. The resource is still usable.
          }
        }

        state.sponsorLoaded++;

        updateSponsorDisplay();

        completeTask();

        resolve();
      };

      img.onload = () => done(true);
      img.onerror = () => done(false);

      img.src = sponsorLogoUrl(sponsor);
    });
  }

  async function preloadAllSponsors() {
    if (!state.sponsors.length) return;

    await Promise.all(
      state.sponsors.map(sponsor =>
        preloadSponsorLogo(sponsor)
      )
    );
  }

  /*
   * ----------------------------------------------------------
   * Sponsor showcase
   *
   * We show up to 8 logos at a time on desktop.
   * Technical sponsors therefore appear in several groups
   * instead of cramming 25 logos into one panel.
   * ----------------------------------------------------------
   */

  function getTierSponsors(tier) {
    return state.sponsors.filter(
      sponsor => sponsor.tier === tier
    );
  }

  function getCurrentTier() {
    if (!state.sponsorTotal) return null;

    const progress =
      state.sponsorLoaded / state.sponsorTotal;

    if (progress < 0.20) return "executive";
    if (progress < 0.50) return "platinum";
    if (progress < 0.70) return "gold";
    if (progress < 0.80) return "silver";

    return "technical";
  }

  function renderSponsorTier(tier) {
    if (!sponsorGrid || !sponsorTier || !tier) return;

    const sponsors = getTierSponsors(tier);

    if (!sponsors.length) return;

    sponsorTier.textContent =
      TIER_LABELS[tier] || tier.toUpperCase();

    /*
     * Technical has many sponsors.
     * Show eight at a time.
     *
     * Other tiers normally fit into one group.
     */
    const pageSize = tier === "technical" ? 8 : 8;

    const pageCount = Math.ceil(
      sponsors.length / pageSize
    );

    if (state.currentTier !== tier) {
      state.currentTier = tier;
      state.currentSponsorPage = 0;
    }

    if (state.currentSponsorPage >= pageCount) {
      state.currentSponsorPage = 0;
    }

    const start =
      state.currentSponsorPage * pageSize;

    const visibleSponsors =
      sponsors.slice(start, start + pageSize);

    sponsorGrid.classList.remove("is-visible");

    /*
     * Allow the exit transition to happen before replacing
     * the logos.
     */
    setTimeout(() => {
      sponsorGrid.innerHTML =
        visibleSponsors
          .map(sponsor => `
            <div class="loader-sponsor-item">
              <img
                src="${escapeHtml(sponsorLogoUrl(sponsor))}"
                alt="${escapeHtml(sponsor.name)}"
                width="240"
                height="120"
                decoding="async">
            </div>
          `)
          .join("");

      /*
       * Force the browser to recognise the new state before
       * starting the entrance transition.
       */
      requestAnimationFrame(() => {
        sponsorGrid.classList.add("is-visible");
      });
    }, reducedMotion ? 0 : 120);
  }

  function updateSponsorDisplay() {
    const tier = getCurrentTier();

    if (!tier) return;

    if (tier !== state.currentTier) {
      renderSponsorTier(tier);
      return;
    }

    /*
     * Once a tier has completely loaded, move through its
     * available logo groups while the rest of the page loads.
     */
    const tierSponsors = getTierSponsors(tier);

    if (
      tierSponsors.length > 8 &&
      state.sponsorLoaded > 0 &&
      state.sponsorLoaded % 8 === 0
    ) {
      state.currentSponsorPage++;

      renderSponsorTier(tier);
    }
  }

  /*
   * ----------------------------------------------------------
   * Generic image loading
   * ----------------------------------------------------------
   */

  function waitForImage(img) {
    return new Promise(resolve => {
      /*
       * Already completely loaded.
       */
      if (img.complete) {
        /*
         * naturalWidth === 0 generally means the image is
         * broken rather than successfully available.
         */
        if (img.naturalWidth > 0) {
          completeTask();
          resolve();
          return;
        }

        /*
         * Broken image — do not block the entire site forever.
         */
        completeTask();
        resolve();
        return;
      }

      img.addEventListener(
        "load",
        () => {
          completeTask();
          resolve();
        },
        { once: true }
      );

      img.addEventListener(
        "error",
        () => {
          completeTask();
          resolve();
        },
        { once: true }
      );
    });
  }

  /*
   * ----------------------------------------------------------
   * Stylesheet loading
   * ----------------------------------------------------------
   */

  function waitForStylesheet(link) {
    return new Promise(resolve => {
      if (link.sheet) {
        completeTask();
        resolve();
        return;
      }

      link.addEventListener(
        "load",
        () => {
          completeTask();
          resolve();
        },
        { once: true }
      );

      link.addEventListener(
        "error",
        () => {
          completeTask();
          resolve();
        },
        { once: true }
      );
    });
  }

  /*
   * ----------------------------------------------------------
   * Fonts
   * ----------------------------------------------------------
   */

  async function waitForFonts() {
    if (!document.fonts?.ready) {
      completeTask();
      return;
    }

    try {
      await document.fonts.ready;
    } catch {
      // Do not deadlock the loader on a font failure.
    }

    completeTask();
  }

  /*
   * ----------------------------------------------------------
   * Build the page asset queue
   * ----------------------------------------------------------
   */

  function collectPageAssets() {
    // Lazy images that haven't loaded (e.g. the sponsor strip far down
    // the page) won't fire "load" until scrolled into view, so gating
    // on them would keep the loader up forever.
    const images = [
      ...document.images
    ].filter(img => !(img.loading === "lazy" && !img.complete));

    // Videos are intentionally not gated: they stream progressively and
    // index.js fades them in on canplay, so waiting only delays the page.

    const stylesheets = [
      ...document.querySelectorAll(
        'link[rel="stylesheet"]'
      )
    ];

    /*
     * Sponsors are counted separately because they are
     * dynamically fetched from sponsors.json.
     */
    state.tasks = [
      ...images.map(img => ({
        type: "image",
        element: img
      })),

      ...stylesheets.map(link => ({
        type: "stylesheet",
        element: link
      }))
    ];

    /*
     * One task for fonts.
     */
    state.tasks.push({
      type: "fonts"
    });

    /*
     * Sponsor logos.
     */
    state.total =
      state.tasks.length +
      state.sponsorTotal;
  }

  /*
   * ----------------------------------------------------------
   * Start loading everything
   * ----------------------------------------------------------
   */

  async function start() {
    setProgress(0);

    /*
     * Fetch sponsor metadata first.
     */
    await loadSponsors();

    /*
     * Now that sponsorTotal is known, construct the complete
     * asset count.
     */
    collectPageAssets();

    /*
     * Initial sponsor display.
     */
    if (state.sponsors.length) {
      renderSponsorTier("executive");
    }

    /*
     * Start all asset groups concurrently.
     */
    const pageTasks = state.tasks.map(task => {
      switch (task.type) {
        case "image":
          return waitForImage(task.element);

        case "stylesheet":
          return waitForStylesheet(task.element);

        case "fonts":
          return waitForFonts();

        default:
          completeTask();
          return Promise.resolve();
      }
    });

    /*
     * Sponsor logos are part of the same blocking gate.
     */
    const sponsorTask =
      preloadAllSponsors();

    let timeoutId;
    const timeout = new Promise(resolve => {
      timeoutId = setTimeout(() => {
        console.warn(
          "[Ashwa Loader] asset gate timed out; releasing page."
        );
        resolve();
      }, MAX_WAIT_MS);
    });

    await Promise.race([
      Promise.all([
        ...pageTasks,
        sponsorTask
      ]),
      timeout
    ]);

    clearTimeout(timeoutId);

    /*
     * One final fonts check after all resources have settled.
     */
    if (document.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch {}
    }

    setProgress(100);

    finish();
  }

  /*
   * ----------------------------------------------------------
   * Finish
   * ----------------------------------------------------------
   */

  function finish() {
    if (finished) return;

    finished = true;

    setProgress(100);

    if (status) {
      status.textContent = "READY";
    }

    const delay = reducedMotion ? 0 : 180;

    setTimeout(() => {
      loader.classList.add("is-done");

      // Let index.js start reveals/counters/auto-advance now that the
      // page is actually visible.
      window.__siteReady = true;
      document.dispatchEvent(new CustomEvent("site:ready"));

      setTimeout(() => {
        loader.remove();
      }, reducedMotion ? 0 : 750);
    }, delay);
  }

  /*
   * ----------------------------------------------------------
   * Begin once the DOM exists.
   * ----------------------------------------------------------
   */

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      start,
      { once: true }
    );
  } else {
    start();
  }
})();