"use strict";

const prefix = "/";

// Sign-up boxes (components/signup.html) stay hidden until a mailing service (e.g. Brevo) is connected.
// Set to true to preview them locally; submitting one sends and stores nothing yet.
const SIGNUP_ENABLED = false;
let signupTemplate = null;   // components/signup.html, fetched once per page.
let signupCount = 0;         // Gives each box on a page its own ids.

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

loadComponent("main-footer", "components/footer.html", loadSignupBoxes);

loadSignupBoxes();   // Slots written in the page itself (blog article end, newsletter reader).

loadLatestBlogUpdate();

// Fills every empty .signup-slot on the page with the shared sign-up box.
async function loadSignupBoxes() {
  if (!SIGNUP_ENABLED) return;
  const slots = [...document.querySelectorAll(".signup-slot:not([data-signup-ready])")];
  if (!slots.length) return;
  slots.forEach(slot => { slot.dataset.signupReady = "true"; });

  try {
    signupTemplate ??= fetch(prefix + "components/signup.html").then(r => r.text());
    const html = await signupTemplate;
    slots.forEach(slot => {
      slot.innerHTML = html;
      initSignupBox(slot);
    });
  } catch (err) {
    console.warn("signup load failed:", err);
  }
}

function initSignupBox(slot) {
  const box = slot.querySelector(".signup");
  const form = slot.querySelector(".signup-form");
  if (!box || !form) return;

  // Per-spot wording and look, from the slot's data attributes.
  const { signupTitle, signupAccent, signupText, signupVariant, signupHeadingLevel } = slot.dataset;
  if (signupTitle) box.querySelector(".signup-title-text").textContent = signupTitle;
  if (signupAccent) box.querySelector(".signup-title-accent").textContent = signupAccent;
  if (signupText) box.querySelector(".signup-text").textContent = signupText;
  if (signupVariant === "compact") box.classList.add("signup--compact");
  if (signupHeadingLevel === "3") {
    const heading = box.querySelector(".signup-title");
    const h3 = document.createElement("h3");
    h3.className = heading.className;
    h3.append(...heading.childNodes);
    heading.replaceWith(h3);
  }

  // Unique ids so labels and error messages stay linked when a page has two boxes.
  const id = `signup-${++signupCount}`;
  const title = box.querySelector(".signup-title");
  title.id = `${id}-title`;
  box.setAttribute("aria-labelledby", title.id);
  box.querySelectorAll("[data-signup-id]").forEach(el => { el.id = `${id}-${el.dataset.signupId}`; });
  box.querySelectorAll("[data-signup-for]").forEach(el => { el.htmlFor = `${id}-${el.dataset.signupFor}`; });
  box.querySelectorAll("[data-signup-describedby]").forEach(el => { el.setAttribute("aria-describedby", `${id}-${el.dataset.signupDescribedby}`); });

  const email = form.elements.email;
  const field = email.closest(".signup-field");
  const error = form.querySelector(".signup-error");
  const status = form.querySelector(".signup-status");
  const EMAIL_MESSAGE = "Please enter a valid email address.";
  const TOPIC_MESSAGE = "Please choose at least one: newsletters or blog posts.";

  const isValidEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  const showError = message => {
    field.classList.toggle("has-error", Boolean(message));
    error.textContent = message;
  };

  // Same behaviour as the contact form: check on leaving the field, clear while typing.
  email.addEventListener("blur", () => showError(isValidEmail(email.value) ? "" : EMAIL_MESSAGE));
  email.addEventListener("input", () => showError(""));
  form.addEventListener("change", event => {
    if (event.target.name === "topics") showError("");
  });

  form.addEventListener("submit", event => {
    event.preventDefault();
    if (form.elements._honey.value) return;

    if (!isValidEmail(email.value)) {
      showError(EMAIL_MESSAGE);
      email.focus();
      return;
    }
    const topics = [...form.querySelectorAll('input[name="topics"]:checked')].map(input => input.value);
    if (!topics.length) {
      showError(TOPIC_MESSAGE);
      return;
    }
    showError("");

    // Not connected to a mailing service yet: nothing is sent or stored.
    status.textContent = "Sign-ups open soon. Thanks for your interest!";
    status.hidden = false;
  });
}

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
      url: `/blog/${encodeURIComponent(post.slug)}`,
      linkLabel: "Read the article"
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

      const minimizeButton = toast.querySelector(".site-update-toast__close");
      const setMinimized = minimized => {
        toast.classList.toggle("is-minimized", minimized);
        minimizeButton.textContent = minimized ? "AR" : "×";
        minimizeButton.setAttribute("aria-label", minimized ? "Show latest blog update" : "Minimize update");
        try {
          if (minimized) localStorage.setItem("ashwa-minimized-blog-update-v2", id);
          else localStorage.removeItem("ashwa-minimized-blog-update-v2");
        } catch (error) {}
      };
      minimizeButton.textContent = minimizedId === id ? "AR" : "×";
      minimizeButton.setAttribute("aria-label", minimizedId === id ? "Show latest blog update" : "Minimize update");
      minimizeButton.addEventListener("click", () => setMinimized(!toast.classList.contains("is-minimized")));
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
