"use strict";

const prefix = "/";

async function loadComponent(id, path, callback) {
  try {
    const html = await fetch(prefix + path).then(r => r.text());
    document.getElementById(id).innerHTML = html;
    callback?.();
  } catch (err) {
    console.warn(`${id} load failed:`, err);
  }
}

loadComponent("main-header", "components/header.html", () => {
  initNav();
  initScrollShrink();
  markActivePage();
});

loadComponent("main-footer", "components/footer.html");

function initNav() {
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  const hamburger = $("#hamburger");
  const mobileMenu = $("#mobile-menu");

  /* ── Mobile Menu Toggle */
  const toggleMenu = (open) => {
    hamburger.classList.toggle("open", open);
    mobileMenu.classList.toggle("open", open);
    hamburger.setAttribute("aria-expanded", open);
    hamburger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    mobileMenu.setAttribute("aria-hidden", !open);
    document.body.style.overflow = open ? "hidden" : "";
  };

  hamburger?.addEventListener("click", () => {
    toggleMenu(!hamburger.classList.contains("open"));
  });

  document.addEventListener("click", e => {
    if (!hamburger?.contains(e.target) && !mobileMenu?.contains(e.target)) {
      toggleMenu(false);
    }
  });

  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    const menuWasOpen = hamburger?.classList.contains("open");
    toggleMenu(false);
    $$(".nav-dropdown.open").forEach(dd => {
      dd.classList.remove("open");
      dd.querySelector(".nav-drop-btn")?.setAttribute("aria-expanded", "false");
    });
  });

  $$(".nav-dropdown").forEach(dd => {
    const btn = dd.querySelector(".nav-drop-btn");
    if (!btn) return;

    const set = (state) => {
      dd.classList.toggle("open", state);
      btn.setAttribute("aria-expanded", state);
    };

    dd.addEventListener("mouseenter", () => set(true));
    dd.addEventListener("focusin", () => set(true));
    dd.addEventListener("mouseleave", () => {
      if (!dd.contains(document.activeElement)) set(false);
    });
    dd.addEventListener("focusout", e => {
      if (!dd.contains(e.relatedTarget)) set(false);
    });

    btn.addEventListener("click", e => {
      e.stopPropagation();
      $$(".nav-dropdown.open").forEach(d => {
        if (d === dd) return;
        d.classList.remove("open");
        d.querySelector(".nav-drop-btn")?.setAttribute("aria-expanded", "false");
      });
    if (menuWasOpen) hamburger?.focus();
      set(!dd.classList.contains("open"));
    });

    document.addEventListener("click", e => {
      if (!dd.contains(e.target)) set(false);
    });
  });

  /* ── Mobile Accordion */
  $$(".mob-accordion-btn").forEach(btn => {
    const panel = document.getElementById(btn.getAttribute("aria-controls"));
    btn.addEventListener("click", () => {
      const open = btn.classList.toggle("open");
      panel?.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", open);
    });
  });
}


/* ── Active Page Highlight ─────────────────────── */
function markActivePage() {
  const normalizePage = value => value.replace(/\.html$/, "") || "index";
  const page = normalizePage(location.pathname.split("/").filter(Boolean).pop() || "index");

  document.querySelectorAll(".nav-desktop a[href], .mobile-menu a[href]").forEach(link => {
    const target = normalizePage(new URL(link.href, location.href).pathname.split("/").filter(Boolean).pop() || "index");
    const isActive = target === page || (page === "blog-post" && target === "blog");
    if (!isActive) return;

    link.classList.add("active");
    link.setAttribute("aria-current", "page");
    link.closest(".nav-dropdown")?.querySelector(".nav-drop-btn")?.classList.add("active");
    link.closest(".mob-accordion")?.previousElementSibling?.classList.add("active");
  });
}

function initScrollShrink() {
  const navbar = document.querySelector(".navbar");
  if (!navbar) return;

  let last = false;

  const onScroll = () => {
    const scrolled = scrollY > 60;
    if (scrolled !== last) {
      navbar.classList.toggle("scrolled", scrolled);
      last = scrolled;
    }
  };

  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}
