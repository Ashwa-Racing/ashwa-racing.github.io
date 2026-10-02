"use strict";

/* ────────────────────────────────────────────────────────────
   PROGRAMME IDENTITY
──────────────────────────────────────────────────────────── */
const PROGRAMMES = {
  cv:  { code: "CV",  tag: "Combustion Vehicle", accent: "#e8001d", cssVar: "--cv-accent" },
  ev:  { code: "EV",  tag: "Electric Vehicle",   accent: "#3b82f6", cssVar: "--ev-accent" },
  hyb: { code: "HYB", tag: "Hybrid Vehicle",     accent: "#f59e0b", cssVar: "--hyb-accent" },
  hyp: { code: "HYL", tag: "Hyperloop",          accent: "#7c3aed", cssVar: "--hyp-accent" },
  dv:  { code: "DRV", tag: "Driverless Vehicle", accent: "#3b82f6", cssVar: "--dv-accent" }
};


/* ────────────────────────────────────────────────────────────
   DATA
──────────────────────────────────────────────────────────── */
const PROJECTS_URL = "/assets/data/projects.json";

const siteReady = new Promise(resolve => {
  if (window.__siteReady) return resolve();

  document.addEventListener("site:ready", resolve, { once: true });

  setTimeout(resolve, 12000);
});

/*
  If projects.json contains relative image paths that point to the CDN,
  set IMAGE_BASE to:

  https://assets.ashwaracing.org/

  Absolute URLs are never modified.
*/
const IMAGE_BASE = "";

let projectData = {};


/* ────────────────────────────────────────────────────────────
   DATA LOADING
──────────────────────────────────────────────────────────── */
async function loadProjects() {
  const response = await fetch(PROJECTS_URL);

  if (!response.ok) {
    throw new Error(`Failed to load projects: ${response.status}`);
  }

  return response.json();
}


function resolveImage(path) {
  if (!path || !IMAGE_BASE || /^(https?:)?\/\//.test(path)) {
    return path;
  }

  return IMAGE_BASE + path.replace(/^\/+/, "");
}


/* ────────────────────────────────────────────────────────────
   RUNTIME STATE
──────────────────────────────────────────────────────────── */
let activeProgKey = "cv";
let activeYear = null;
let slideshowTimer = null;
let renderToken = 0;
let slideIndex = 0;
let validImages = [];


/* ────────────────────────────────────────────────────────────
   DOM REFERENCES
──────────────────────────────────────────────────────────── */
const viewer = document.getElementById("prog-viewer");
const progCodeEl = document.getElementById("prog-code");
const progCodeBgEl = document.getElementById("prog-code-bg");
const progTagEl = document.getElementById("prog-tag");
const progTitleEl = document.getElementById("prog-title");
const progYears = document.getElementById("prog-years");
const progImage = document.getElementById("prog-image");
const progContent = document.getElementById("prog-content");
const progImageAccent = document.getElementById("prog-image-accent");
const progYearBadge = document.getElementById("prog-year-badge");
const slideCurrentEl = document.getElementById("slide-current");
const slideTotalEl = document.getElementById("slide-total");
const heroStripe = document.getElementById("proj-hero-stripe");
const heroRule = document.querySelector(".proj-hero-rule");

if (progImage) {
  progImage.style.transition =
    "opacity 0.28s ease, transform 0.7s cubic-bezier(0.16,1,0.3,1), filter 0.4s ease";
}


/* ────────────────────────────────────────────────────────────
   HELPERS
──────────────────────────────────────────────────────────── */
function pad2(number) {
  return number < 10 ? `0${number}` : String(number);
}


function preloadImages(paths) {
  return Promise.all(
    paths.map(path => new Promise(resolve => {
      const img = new Image();

      img.onload = () => resolve(path);
      img.onerror = () => resolve(null);

      img.src = path;
    }))
  ).then(results => results.filter(Boolean));
}


function updateSlideCounter(index, total) {
  if (slideCurrentEl) {
    slideCurrentEl.textContent = pad2(index + 1);
  }

  if (slideTotalEl) {
    slideTotalEl.textContent = pad2(total);
  }
}


function swapImage(src, alt, token, index, total) {
  if (token !== renderToken || !progImage) return;

  progImage.style.opacity = "0";

  setTimeout(() => {
    if (token !== renderToken) return;

    progImage.src = src;
    progImage.alt = alt;
    progImage.style.opacity = "1";

    updateSlideCounter(index, total);
  }, 280);
}


/* ────────────────────────────────────────────────────────────
   PROGRAMME ACCENT
──────────────────────────────────────────────────────────── */
function applyAccent(accent) {
  document.documentElement.style.setProperty("--prog-accent", accent);

  if (heroStripe) {
    heroStripe.style.background = accent;
  }

  if (progImageAccent) {
    progImageAccent.style.background = accent;
  }

  if (heroRule) {
    heroRule.style.background = `
      linear-gradient(
        to right,
        transparent 0%,
        rgba(255,255,255,0.06) 20%,
        ${accent} 50%,
        rgba(255,255,255,0.06) 80%,
        transparent 100%
      )
    `;
  }
}


/* ────────────────────────────────────────────────────────────
   RENDER YEAR
──────────────────────────────────────────────────────────── */
function renderYear(progKey, year) {
  const data = projectData[progKey].years[year];
  const identity = PROGRAMMES[progKey];

  renderToken += 1;

  const currentToken = renderToken;

  slideIndex = 0;
  validImages = [];

  if (slideshowTimer) {
    clearInterval(slideshowTimer);
    slideshowTimer = null;
  }


  /* Year badge */
  if (progYearBadge) {
    progYearBadge.textContent = year;
  }


  /* Specifications */
  const specs = data.specs || {};

  const hasRealSpecs = Object.values(specs).some(
    value =>
      value &&
      value !== "—" &&
      value !== "-" &&
      value !== ""
  );

  const specHTML = hasRealSpecs
    ? `
      <div class="prog-specs">
        <div class="prog-spec">
          <span>Weight</span>
          <strong>${specs.weight || "—"}</strong>
        </div>

        <div class="prog-spec">
          <span>Power</span>
          <strong>${specs.power || "—"}</strong>
        </div>

        <div class="prog-spec">
          <span>0–100</span>
          <strong>${specs.acceleration || "—"}</strong>
        </div>

        <div class="prog-spec">
          <span>Top Speed</span>
          <strong>${specs.topSpeed || "—"}</strong>
        </div>
      </div>
    `
    : "";


  /* Badge */
  const badgeHTML = data.badge
    ? `<div class="prog-badge">${data.badge}</div>`
    : "";


  /* Lists */
  const changeItems = (data.changes || [])
    .map(change => `<li>${change}</li>`)
    .join("");

  const achievementItems = (data.achievements || [])
    .map(achievement => `<li>${achievement}</li>`)
    .join("");


  /* Content */
  if (progContent) {
    progContent.innerHTML = `
      <div>
        <div class="prog-section-label">
          Updates · ${year}
        </div>

        <ul class="prog-changes">
          ${changeItems}
        </ul>
      </div>

      <p class="prog-desc">
        ${data.desc || ""}
      </p>

      ${specHTML}

      ${badgeHTML}

      <div>
        <div class="prog-section-label">
          Achievements
        </div>

        <ul class="prog-achievements">
          ${achievementItems}
        </ul>
      </div>
    `;
  }


  /* Activate year */
  progYears?.querySelectorAll(".year-btn").forEach(button => {
    const active = button.dataset.year === String(year);

    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
  });

  window._scrollYearToActive?.();

  activeYear = year;


  /* Images */
  const rawImages = (
    data.images ||
    (data.image ? [data.image] : [])
  ).map(resolveImage);

  if (progImage) {
    progImage.style.opacity = "0";
  }

  preloadImages(rawImages).then(valid => {
    if (currentToken !== renderToken) return;

    validImages = valid;

    if (!valid.length) {
      if (progImage) {
        progImage.src = "";
        progImage.style.opacity = "1";
      }

      updateSlideCounter(0, 0);
      return;
    }

    slideIndex = 0;

    swapImage(
      valid[0],
      `${identity.tag} — ${year}`,
      currentToken,
      0,
      valid.length
    );


    /* Start slideshow only when multiple images exist */
    if (valid.length > 1) {
      slideshowTimer = setInterval(() => {
        if (currentToken !== renderToken) {
          clearInterval(slideshowTimer);
          slideshowTimer = null;
          return;
        }

        slideIndex = (slideIndex + 1) % valid.length;

        swapImage(
          valid[slideIndex],
          `${identity.tag} — ${year}`,
          currentToken,
          slideIndex,
          valid.length
        );
      }, 3500);
    }
  });
}


/* ────────────────────────────────────────────────────────────
   SWITCH PROGRAMME
──────────────────────────────────────────────────────────── */
function switchProgramme(progKey) {
  const identity = PROGRAMMES[progKey];
  const programme = projectData[progKey];

  if (!identity || !programme || !viewer) return;

  const years = Object.keys(programme.years)
    .map(Number)
    .sort((a, b) => b - a);

  if (!years.length) return;

  activeProgKey = progKey;

  viewer.style.transition = "opacity 0.18s ease";
  viewer.style.opacity = "0";


  setTimeout(() => {
    applyAccent(identity.accent);

    if (progCodeEl) {
      progCodeEl.textContent = identity.code;
    }

    if (progCodeBgEl) {
      progCodeBgEl.textContent = identity.code;
    }

    if (progTagEl) {
      progTagEl.textContent = identity.tag;
    }

    if (progTitleEl) {
      progTitleEl.textContent = programme.title;
    }


    /* Rebuild year selector */
    if (progYears) {
      progYears.innerHTML = "";

      years.forEach(year => {
        const button = document.createElement("button");

        button.className = "year-btn";
        button.textContent = year;
        button.dataset.year = year;

        button.setAttribute("role", "tab");
        button.setAttribute("aria-selected", "false");

        button.addEventListener("click", () => {
          renderYear(progKey, year);
        });

        progYears.appendChild(button);
      });
    }


    /* Programme index active state */
    document
      .querySelectorAll(".prog-index-item")
      .forEach(item => {
        item.classList.toggle(
          "active",
          item.dataset.prog === progKey
        );
      });


    /* Programme count */
    const countEl = document.getElementById("prog-index-count");
    const keys = Object.keys(projectData);
    const index = keys.indexOf(progKey);

    if (countEl) {
      countEl.textContent = `${index + 1} / ${keys.length}`;
    }


    /* Render newest year */
    renderYear(progKey, years[0]);

    viewer.style.opacity = "1";
  }, 180);
}


/* ────────────────────────────────────────────────────────────
   BUILD PROGRAMME INDEX
──────────────────────────────────────────────────────────── */
function buildProgIndex() {
  const list = document.getElementById("prog-index-list");

  if (!list) return;

  list.innerHTML = "";

  const keys = Object.keys(projectData);

  const countEl = document.getElementById("prog-index-count");

  if (countEl) {
    countEl.textContent = `1 / ${keys.length}`;
  }


  keys.forEach(key => {
    const identity = PROGRAMMES[key];
    const programme = projectData[key];

    const years = Object.keys(programme.years)
      .map(Number)
      .sort((a, b) => b - a);

    if (!years.length) return;

    const yearRange =
      years.length > 1
        ? `${years[years.length - 1]} – ${years[0]}`
        : String(years[0]);


    const item = document.createElement("div");

    item.className = "prog-index-item";
    item.dataset.prog = key;

    item.setAttribute("role", "button");
    item.setAttribute("tabindex", "0");
    item.setAttribute(
      "aria-label",
      `${identity.tag} programme`
    );

    item.style.setProperty(
      "--item-accent",
      identity.accent
    );


    item.innerHTML = `
      <div
        class="prog-index-item-bg-code"
        aria-hidden="true">
        ${identity.code}
      </div>

      <div
        class="prog-index-item-dot"
        aria-hidden="true">
      </div>

      <div class="prog-index-item-code">
        ${identity.code}
      </div>

      <div class="prog-index-item-name">
        ${programme.title}
      </div>

      <div class="prog-index-item-meta">
        ${yearRange} · ${years.length}
        season${years.length !== 1 ? "s" : ""}
      </div>
    `;


    function activate() {
      switchProgramme(key);

      viewer?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }


    item.addEventListener("click", activate);

    item.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activate();
      }
    });


    list.appendChild(item);
  });
}


/* ────────────────────────────────────────────────────────────
   YEAR SELECTOR
   Scroll / drag / keyboard controls
──────────────────────────────────────────────────────────── */
function initYearScroll() {
  const wrapper = document.getElementById("prog-years-wrapper");
  const track = document.getElementById("prog-years");

  if (!wrapper || !track) return;


  /* Controls */
  const arrowLeft = document.createElement("button");
  const arrowRight = document.createElement("button");

  const fadeLeft = document.createElement("div");
  const fadeRight = document.createElement("div");


  arrowLeft.className = "years-arrow hidden";
  arrowLeft.innerHTML = "&#8249;";
  arrowLeft.setAttribute(
    "aria-label",
    "Scroll years left"
  );

  arrowRight.className = "years-arrow hidden";
  arrowRight.innerHTML = "&#8250;";
  arrowRight.setAttribute(
    "aria-label",
    "Scroll years right"
  );


  fadeLeft.className = "years-fade-edge left hidden";
  fadeRight.className = "years-fade-edge right hidden";


  wrapper.prepend(arrowLeft);
  wrapper.appendChild(arrowRight);
  wrapper.appendChild(fadeRight);
  wrapper.prepend(fadeLeft);


  /* Update arrows/fade edges */
  function syncUI() {
    const atStart = track.scrollLeft <= 2;

    const atEnd =
      track.scrollLeft >=
      track.scrollWidth -
      track.clientWidth -
      2;

    arrowLeft.classList.toggle("hidden", atStart);
    arrowRight.classList.toggle("hidden", atEnd);

    fadeLeft.classList.toggle("hidden", atStart);
    fadeRight.classList.toggle("hidden", atEnd);
  }


  let animationFrame = null;


  /* Smooth scrolling */
  function momentumScroll(delta, duration) {
    cancelAnimationFrame(animationFrame);

    const start = track.scrollLeft;

    const target = Math.max(
      0,
      Math.min(
        start + delta,
        track.scrollWidth - track.clientWidth
      )
    );

    const startTime = performance.now();


    const ease = progress =>
      progress < 0.5
        ? 4 * progress * progress * progress
        : 1 -
          Math.pow(-2 * progress + 2, 3) / 2;


    function step(now) {
      const progress = Math.min(
        (now - startTime) / duration,
        1
      );

      track.scrollLeft =
        start +
        (target - start) *
        ease(progress);


      if (progress < 1) {
        animationFrame =
          requestAnimationFrame(step);
      } else {
        track.scrollLeft = target;
        syncUI();
      }
    }


    animationFrame =
      requestAnimationFrame(step);
  }


  /* Keep active year centred */
  window._scrollYearToActive = function () {
    const active =
      track.querySelector(".year-btn.active");

    if (!active) return;

    const trackRect =
      track.getBoundingClientRect();

    const activeRect =
      active.getBoundingClientRect();

    const delta =
      activeRect.left -
      trackRect.left -
      trackRect.width / 2 +
      activeRect.width / 2;

    momentumScroll(delta, 280);
  };


  arrowLeft.addEventListener("click", () => {
    momentumScroll(
      -Math.max(track.clientWidth * 0.55, 140),
      300
    );
  });


  arrowRight.addEventListener("click", () => {
    momentumScroll(
      Math.max(track.clientWidth * 0.55, 140),
      300
    );
  });


  track.addEventListener(
    "scroll",
    syncUI,
    { passive: true }
  );

  window.addEventListener(
    "resize",
    syncUI
  );


  /* ───────────────────────────────────────────────
     Mouse drag
  ─────────────────────────────────────────────── */
  let dragging = false;
  let startX = 0;
  let scrollX = 0;
  let velocity = 0;
  let lastX = 0;
  let lastTime = 0;


  track.addEventListener("mousedown", event => {
    dragging = true;

    startX = event.clientX;
    scrollX = track.scrollLeft;

    lastX = event.clientX;
    lastTime = performance.now();

    velocity = 0;

    track.classList.add("grabbing");

    cancelAnimationFrame(animationFrame);

    event.preventDefault();
  });


  window.addEventListener("mousemove", event => {
    if (!dragging) return;

    const now = performance.now();
    const deltaTime = now - lastTime;

    if (deltaTime > 0) {
      velocity =
        (event.clientX - lastX) /
        deltaTime;
    }

    lastX = event.clientX;
    lastTime = now;

    track.scrollLeft =
      scrollX -
      (event.clientX - startX);

    syncUI();
  });


  window.addEventListener("mouseup", () => {
    if (!dragging) return;

    dragging = false;

    track.classList.remove("grabbing");

    if (Math.abs(velocity) > 0.05) {
      launchCoast(velocity);
    }
  });


  /* ───────────────────────────────────────────────
     Touch drag
  ─────────────────────────────────────────────── */
  track.addEventListener(
    "touchstart",
    event => {
      dragging = true;

      startX = event.touches[0].clientX;
      scrollX = track.scrollLeft;

      lastX = startX;
      lastTime = performance.now();

      velocity = 0;

      cancelAnimationFrame(animationFrame);
    },
    { passive: true }
  );


  track.addEventListener(
    "touchmove",
    event => {
      if (!dragging) return;

      const x = event.touches[0].clientX;
      const now = performance.now();
      const deltaTime = now - lastTime;

      if (deltaTime > 0) {
        velocity =
          (x - lastX) /
          deltaTime;
      }

      lastX = x;
      lastTime = now;

      track.scrollLeft =
        scrollX -
        (x - startX);

      syncUI();
    },
    { passive: true }
  );


  track.addEventListener("touchend", () => {
    dragging = false;

    if (Math.abs(velocity) > 0.05) {
      launchCoast(velocity);
    }
  });


  /* Momentum after drag */
  function launchCoast(initialVelocity) {
    let momentum = initialVelocity * 14;

    function step() {
      if (Math.abs(momentum) < 0.5) {
        return;
      }

      track.scrollLeft -= momentum;

      momentum *= 0.88;

      syncUI();

      animationFrame =
        requestAnimationFrame(step);
    }

    animationFrame =
      requestAnimationFrame(step);
  }


  /* ───────────────────────────────────────────────
     Keyboard navigation
  ─────────────────────────────────────────────── */
  track.setAttribute("tabindex", "0");

  track.addEventListener("keydown", event => {
    const buttons = [
      ...track.querySelectorAll(".year-btn")
    ];

    const activeIndex =
      buttons.findIndex(
        button =>
          button.classList.contains("active")
      );


    if (
      event.key === "ArrowLeft" &&
      activeIndex > 0
    ) {
      buttons[activeIndex - 1].click();
      event.preventDefault();
    }


    if (
      event.key === "ArrowRight" &&
      activeIndex < buttons.length - 1
    ) {
      buttons[activeIndex + 1].click();
      event.preventDefault();
    }


    if (event.key === "Home") {
      buttons[0]?.click();
      event.preventDefault();
    }


    if (event.key === "End") {
      buttons[buttons.length - 1]?.click();
      event.preventDefault();
    }
  });


  setTimeout(syncUI, 100);
}


/* ────────────────────────────────────────────────────────────
   SCROLL REVEAL
──────────────────────────────────────────────────────────── */
function initReveal() {
  if (
    matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
  ) {
    return;
  }


  const elements = document.querySelectorAll(
    ".prog-index-item"
  );


  elements.forEach((element, index) => {
    element.classList.add("reveal");

    element.style.transitionDelay =
      `${Math.min(index * 0.08, 0.4)}s`;
  });


  const observer =
    new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add(
            "reveal-visible"
          );

          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.06
      }
    );


  elements.forEach(element =>
    observer.observe(element)
  );
}


/* ────────────────────────────────────────────────────────────
   STAT COUNTERS
──────────────────────────────────────────────────────────── */
function initStatCounters() {
  const statValues =
    document.querySelectorAll(
      ".proj-stat-value[data-target]"
    );

  if (!statValues.length) return;


  const observer =
    new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;

          const element = entry.target;
          const target =
            parseInt(
              element.dataset.target,
              10
            );


          /* Years should not count up */
          if (target > 1000) {
            element.textContent = target;

            observer.unobserve(element);
            return;
          }


          const duration = 900;
          const start = performance.now();


          function step(now) {
            const progress =
              Math.min(
                (now - start) /
                duration,
                1
              );


            const ease =
              1 -
              Math.pow(
                1 - progress,
                3
              );


            element.textContent =
              Math.round(
                ease * target
              );


            if (progress < 1) {
              requestAnimationFrame(step);
            } else {
              element.textContent =
                target;
            }
          }


          requestAnimationFrame(step);

          observer.unobserve(element);
        });
      },
      {
        threshold: 0.5
      }
    );


  statValues.forEach(element =>
    observer.observe(element)
  );
}


/* ────────────────────────────────────────────────────────────
   INITIALIZATION
──────────────────────────────────────────────────────────── */
async function init() {
  try {
    const raw = await loadProjects();

    /*
      Keep only programmes with a recognised identity
      and valid year data.
    */
    projectData = {};

    Object.keys(raw).forEach(key => {
      if (
        PROGRAMMES[key] &&
        raw[key] &&
        raw[key].years
      ) {
        projectData[key] = raw[key];
      }
    });
  } catch (error) {
    console.error(error);
    return;
  }


  const keys = Object.keys(projectData);


  if (!keys.length) {
    console.error(
      "projects.json loaded but contained no recognised programmes. " +
      "Expected keys: " +
      Object.keys(PROGRAMMES).join(", ")
    );

    return;
  }


  buildProgIndex();

  switchProgramme(
    keys.includes("cv")
      ? "cv"
      : keys[0]
  );

  initYearScroll();


  /*
    Wait for the global loader before starting
    page animations.
  */
  await siteReady;

  initStatCounters();
  initReveal();
}


init();