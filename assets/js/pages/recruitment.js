"use strict";

/* ============================================================
   CONFIG
   ============================================================ */

const RECRUITMENT = {
  isOpen: true,
  formURL: "https://forms.gle/hrbQxbTiwtwteNa18"
};

const prefersReducedMotion =
  matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ============================================================
   RECRUITMENT STATUS
   ============================================================ */

function initRecruitmentStatus() {
  const {
    isOpen,
    formURL
  } = RECRUITMENT;

  const badge =
    document.getElementById(
      "rc-status-badge"
    );

  const button =
    document.getElementById(
      "rc-apply-btn"
    );

  if (badge) {
    badge.classList.toggle(
      "rc-status--open",
      isOpen
    );

    badge.classList.toggle(
      "rc-status--closed",
      !isOpen
    );

    const text =
      badge.querySelector(
        ".rc-status-text"
      );

    if (text) {
      text.textContent = isOpen
        ? "Recruitment Open"
        : "Recruitment Closed";
    }
  }

  if (!button) return;

  button.disabled = !isOpen;

  button.textContent = isOpen
    ? "Apply Now"
    : "Applications Closed";

  if (isOpen) {
    button.addEventListener(
      "click",
      () => {
        window.open(
          formURL,
          "_blank",
          "noopener,noreferrer"
        );
      }
    );
  }
}

/* ============================================================
   SCROLL REVEALS
   ============================================================ */

function initReveal() {
  const elements =
    document.querySelectorAll(
      ".reveal"
    );

  if (
    prefersReducedMotion ||
    !("IntersectionObserver" in window)
  ) {
    elements.forEach(el =>
      el.classList.add("visible")
    );

    return;
  }

  const observer =
    new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add(
            "visible"
          );

          observer.unobserve(
            entry.target
          );
        });
      },
      {
        threshold: 0.12,
        rootMargin:
          "0px 0px -60px"
      }
    );

  elements.forEach(el =>
    observer.observe(el)
  );
}

/* ============================================================
   STAT COUNTERS
   ============================================================ */

function animateCounter(el) {
  const target =
    Number(el.dataset.target);

  /*
   * Only change the leading text node.
   * This keeps <sup>+</sup> untouched.
   */
  const node = el.firstChild;

  if (
    !Number.isFinite(target) ||
    node?.nodeType !== Node.TEXT_NODE
  ) {
    return;
  }

  const duration = 1200;
  const start = performance.now();

  function tick(now) {
    const progress =
      Math.min(
        (now - start) / duration,
        1
      );

    const eased =
      progress === 1
        ? 1
        : 1 -
          Math.pow(
            2,
            -10 * progress
          );

    node.textContent =
      Math.round(
        target * eased
      );

    if (progress < 1) {
      requestAnimationFrame(
        tick
      );
    }
  }

  node.textContent = "0";

  requestAnimationFrame(tick);
}

function initStatCounters() {
  const counters =
    document.querySelectorAll(
      "[data-target]"
    );

  if (
    prefersReducedMotion ||
    !("IntersectionObserver" in window)
  ) {
    return;
  }

  const observer =
    new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) {
            return;
          }

          animateCounter(
            entry.target
          );

          observer.unobserve(
            entry.target
          );
        });
      },
      {
        threshold: 0.5
      }
    );

  counters.forEach(el =>
    observer.observe(el)
  );
}

/* ============================================================
   VIDEO FACADE
   ============================================================ */

function initVideoFacade() {
  document.querySelectorAll(".rc-video-facade[data-video-id]").forEach(button => {
    button.addEventListener("click", () => {
      const videoId = button.dataset.videoId;
      if (!videoId) return;

      const frame = document.createElement("iframe");
      frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0&playsinline=1`;
      frame.title = "A day with Ashwa Racing";
      frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      frame.allowFullscreen = true;
      frame.referrerPolicy = "strict-origin-when-cross-origin";

      button.replaceWith(frame);
    }, { once: true });
  });
}

/* ============================================================
   INIT
   ============================================================ */

function initRecruitment() {
  initRecruitmentStatus();
  initReveal();
  initStatCounters();
  initVideoFacade();
}

/* ============================================================
   DOM READY
   ============================================================ */

if (
  document.readyState === "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    initRecruitment,
    { once: true }
  );
} else {
  initRecruitment();
}
