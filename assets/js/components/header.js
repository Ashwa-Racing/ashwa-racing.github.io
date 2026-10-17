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

loadLatestSiteUpdate();

async function loadLatestSiteUpdate() {
  try {
    const [blogResponse, newsletterResponse] = await Promise.all([
      fetch("/assets/data/blog.json", { cache: "no-store", headers: { Accept: "application/json" } }),
      fetch("/assets/data/newsletters.json", { cache: "no-store", headers: { Accept: "application/json" } })
    ]);
    const blogData = blogResponse.ok ? await blogResponse.json() : {};
    const newsletterFiles = newsletterResponse.ok ? await newsletterResponse.json() : [];
    const post = Array.isArray(blogData.posts)
      ? [...blogData.posts].filter(item => item?.slug && item?.title)
        .sort((left, right) => String(right.date || "").localeCompare(String(left.date || "")))[0]
      : null;
    const monthNames = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const typeOrder = { general: 0, hybrid: 1, combustion: 2, alumni: 3 };
    const latestNewsletter = Array.isArray(newsletterFiles)
      ? newsletterFiles.map(file => {
        const match = String(file).match(/^(20\d{2})-(0[1-9]|1[0-2])-(general|hybrid|combustion|alumni)\.pdf$/i);
        return match ? { file, year: match[1], month: match[2], type: match[3].toLowerCase() } : null;
      }).filter(Boolean).sort((left, right) =>
        `${right.year}${right.month}`.localeCompare(`${left.year}${left.month}`) ||
        typeOrder[left.type] - typeOrder[right.type]
      )[0]
      : null;
    if (!post && !latestNewsletter) return;
    const newsletterTitle = latestNewsletter
      ? `${monthNames[Number(latestNewsletter.month)]} ${latestNewsletter.year} ${latestNewsletter.type} newsletter`
      : "";
    const update = {
      id: `blog:${post?.slug || ""}:${post?.updated || post?.date || ""}:newsletter:${latestNewsletter?.file || ""}`,
      platform: post ? "the blog" : "newsletters",
      title: post?.title || newsletterTitle,
      message: post?.excerpt || "A new newsletter has been published by Ashwa Racing.",
      url: post ? `/blog/${encodeURIComponent(post.slug)}` : `/newsletters/${latestNewsletter.year}-${latestNewsletter.month}-${latestNewsletter.type}`,
      linkLabel: post ? "Read the article" : "Read the newsletter"
    };
    let minimizedId = "";
    try { minimizedId = localStorage.getItem("ashwa-minimized-blog-update-v2") || ""; } catch (error) {}
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
      toast.setAttribute("role", "region");
      toast.setAttribute("aria-live", "polite");
      toast.innerHTML = `
        <span class="site-update-toast__mark" aria-hidden="true"></span>
        <div class="site-update-toast__content">
          <p class="site-update-toast__eyebrow"></p>
          <h2 class="site-update-toast__title"></h2>
          <p class="site-update-toast__message"></p>
          <a class="site-update-toast__link" target="_blank" rel="noopener noreferrer"></a>
          <a class="site-update-toast__campaign site-update-toast__newsletter" target="_blank" rel="noopener noreferrer">
            <span class="site-update-toast__campaign-label">Latest newsletter</span>
            <span class="site-update-toast__campaign-title"></span>
          </a>
          <a class="site-update-toast__campaign" href="/crowdfunding.html" target="_blank" rel="noopener noreferrer">
            <span class="site-update-toast__campaign-label">Support the next build</span>
            <span class="site-update-toast__campaign-title">Help Ashwa Racing get to the grid <span aria-hidden="true">&rarr;</span></span>
          </a>
        </div>
        <button class="site-update-toast__close" type="button" aria-label="Minimize update">×</button>`;
      toast.querySelector(".site-update-toast__eyebrow").textContent = `New on ${platform}`;
      toast.querySelector(".site-update-toast__title").textContent = title;
      toast.querySelector(".site-update-toast__message").textContent = message;
      const link = toast.querySelector(".site-update-toast__link");
      link.href = destination.href;
      link.textContent = linkLabel;

      const newsletterLink = toast.querySelector(".site-update-toast__newsletter");
      if (latestNewsletter) {
        newsletterLink.href = `/newsletters/${latestNewsletter.year}-${latestNewsletter.month}-${latestNewsletter.type}`;
        newsletterLink.querySelector(".site-update-toast__campaign-title").textContent =
          `Read ${newsletterTitle} →`;
      } else {
        newsletterLink.remove();
      }

      const minimizeButton = toast.querySelector(".site-update-toast__close");
      const setMinimized = minimized => {
        toast.classList.toggle("is-minimized", minimized);
        minimizeButton.textContent = minimized ? "AR" : "×";
        minimizeButton.setAttribute("aria-label", minimized ? "Show latest Ashwa Racing update" : "Minimize update");
        try {
          if (minimized) localStorage.setItem("ashwa-minimized-blog-update-v2", id);
          else localStorage.removeItem("ashwa-minimized-blog-update-v2");
        } catch (error) {}
      };
      minimizeButton.textContent = minimizedId === id ? "AR" : "×";
      minimizeButton.setAttribute("aria-label", minimizedId === id ? "Show latest Ashwa Racing update" : "Minimize update");
      minimizeButton.addEventListener("click", () => setMinimized(!toast.classList.contains("is-minimized")));
      document.body.appendChild(toast);
      requestAnimationFrame(() => toast.classList.add("is-visible"));
    }, 900);
  } catch (error) {
    console.warn("Latest site update could not be loaded:", error);
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
