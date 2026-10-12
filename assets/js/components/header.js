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

loadLatestBlogUpdate();

async function loadLatestBlogUpdate() {
  try {
    const response = await fetch("/assets/data/blog.json", { cache: "no-store", headers: { Accept: "application/json" } });
    if (!response.ok) return;
    const result = await response.json();
    const post = Array.isArray(result.posts) ? result.posts[0] : null;
    if (!post?.slug || !post?.title) return;
    const update = {
      id: `blog:${post.slug}:${post.updated || post.date || ""}`,
      platform: "the blog",
      title: post.title,
      message: post.excerpt || "A new article has been published on the Ashwa Racing blog.",
      url: `/blog-post?post=${encodeURIComponent(post.slug)}`,
      linkLabel: "Read the article"
    };
    const storageKey = "ashwa-seen-blog-updates-v1";
    let seenIds = [];
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      seenIds = Array.isArray(saved) ? saved : typeof saved === "string" ? [saved] : [];
    } catch (error) {}
    if (seenIds.includes(update.id)) return;
    let minimizedId = "";
    try { minimizedId = localStorage.getItem("ashwa-minimized-blog-update") || ""; } catch (error) {}
    const { id, platform, title, message, url, linkLabel } = update;
    if (![id, platform, title, message, url, linkLabel].every(value => typeof value === "string" && value.trim())) return;

    const destination = new URL(url, window.location.origin);
    if (!['http:', 'https:'].includes(destination.protocol)) return;

    window.setTimeout(() => {
      if (document.querySelector(".site-update-toast")) return;
      const toast = document.createElement("aside");
      toast.className = "site-update-toast";
      if (minimizedId === id) toast.classList.add("is-minimized");
      toast.setAttribute("aria-label", "Latest from Ashwa Racing");
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      toast.innerHTML = `
        <span class="site-update-toast__mark" aria-hidden="true"></span>
        <div class="site-update-toast__content">
          <p class="site-update-toast__eyebrow"></p>
          <h2 class="site-update-toast__title"></h2>
          <p class="site-update-toast__message"></p>
          <a class="site-update-toast__link" target="_blank" rel="noopener noreferrer"></a>
        </div>
        <button class="site-update-toast__close" type="button" aria-label="Minimize update">×</button>`;
      toast.querySelector(".site-update-toast__eyebrow").textContent = `New on ${platform}`;
      toast.querySelector(".site-update-toast__title").textContent = title;
      toast.querySelector(".site-update-toast__message").textContent = message;
      const link = toast.querySelector(".site-update-toast__link");
      link.href = destination.href;
      link.textContent = linkLabel;

      const minimizeButton = toast.querySelector(".site-update-toast__close");
      const setMinimized = minimized => {
        toast.classList.toggle("is-minimized", minimized);
        minimizeButton.textContent = minimized ? "AR" : "×";
        minimizeButton.setAttribute("aria-label", minimized ? "Show latest blog update" : "Minimize update");
        try {
          if (minimized) localStorage.setItem("ashwa-minimized-blog-update", id);
          else localStorage.removeItem("ashwa-minimized-blog-update");
        } catch (error) {}
      };
      minimizeButton.textContent = minimizedId === id ? "AR" : "×";
      minimizeButton.setAttribute("aria-label", minimizedId === id ? "Show latest blog update" : "Minimize update");
      minimizeButton.addEventListener("click", () => setMinimized(!toast.classList.contains("is-minimized")));
      link.addEventListener("click", () => {
        try {
          localStorage.setItem(storageKey, JSON.stringify([...new Set([...seenIds, id])].slice(-50)));
          localStorage.removeItem("ashwa-minimized-blog-update");
        } catch (error) {}
      });
      document.body.appendChild(toast);
      requestAnimationFrame(() => toast.classList.add("is-visible"));
    }, 900);
  } catch (error) {
    console.warn("Latest blog update could not be loaded:", error);
  }
}

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
