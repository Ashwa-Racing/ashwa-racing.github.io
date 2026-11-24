const sharedScriptPaths = [
  "/assets/js/components/header.js",
  "/assets/js/components/theme.js",
  "/assets/js/components/utils.js",
  "/assets/js/components/loader.js"
];

let activePageScope = null;
let navigationSequence = 0;
let navigationPending = false;
let renderedUrl = new URL(location.href);
const loadedSharedScripts = new Set([...document.scripts].map(script => new URL(script.src, location.href).pathname));
const loadedExternalScripts = new Set([...document.scripts].map(script => script.src).filter(Boolean));

export function initPersistentNavigation() {
  if (document.documentElement.dataset.persistentNavigation === "ready") return;
  document.documentElement.dataset.persistentNavigation = "ready";
  if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";

  document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
    if (!isSharedStylesheet(link.href)) link.dataset.spaPageStyle = "";
  });
  document.querySelectorAll("style").forEach(style => {
    if (!style.closest("#main-header, #main-footer")) style.dataset.spaPageStyle = "";
  });

  document.addEventListener("click", event => {
    const link = event.target.closest("a[href]");
    if (!link || !shouldIntercept(event, link)) return;

    const url = new URL(link.href, location.href);
    event.preventDefault();
    navigate(url, { history: "push" });
  });

  window.addEventListener("popstate", event => {
    const url = new URL(location.href);
    const scrollY = event.state?.scrollY ?? 0;
    if (url.pathname === renderedUrl.pathname && url.search === renderedUrl.search) {
      renderedUrl = url;
      if (url.hash) requestAnimationFrame(() => document.getElementById(decodeURIComponent(url.hash.slice(1)))?.scrollIntoView());
      else window.scrollTo(0, scrollY);
      return;
    }
    navigate(url, { history: "none", scrollY });
  });

  let scrollFrame = 0;
  window.addEventListener("scroll", () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      window.history.replaceState({ ...window.history.state, scrollY: window.scrollY }, "");
    });
  }, { passive: true });
}

function shouldIntercept(event, link) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  if (link.hasAttribute("download") || (link.target && link.target !== "_self")) return false;

  const url = new URL(link.href, location.href);
  if (url.origin !== location.origin || url.protocol !== "http:" && url.protocol !== "https:") return false;
  if (/\.(?:pdf|zip|png|jpe?g|gif|svg|webp|mp4|mp3|docx?|xlsx?)$/i.test(url.pathname)) return false;
  if (url.pathname === location.pathname && url.search === location.search) return false;
  return true;
}

async function navigate(url, { history, scrollY = 0 }) {
  if (navigationPending) return;
  navigationPending = true;
  const sequence = ++navigationSequence;

  try {
    const response = await fetch(url.href, {
      headers: { Accept: "text/html" },
      credentials: "same-origin"
    });
    if (!response.ok || !/text\/html/i.test(response.headers.get("content-type") || "")) {
      throw new Error(`Navigation request failed (${response.status})`);
    }

    const html = await response.text();
    const nextDocument = new DOMParser().parseFromString(html, "text/html");
    const currentHeader = document.getElementById("main-header");
    const currentFooter = document.getElementById("main-footer");
    const nextHeader = nextDocument.getElementById("main-header");
    const nextFooter = nextDocument.getElementById("main-footer");
    if (!currentHeader || !currentFooter || !nextHeader || !nextFooter || currentHeader.parentElement !== document.body || currentFooter.parentElement !== document.body) {
      location.assign(url.href);
      return;
    }

    const finalUrl = new URL(response.url || url.href);
    if (url.hash) finalUrl.hash = url.hash;
    if (history === "push") {
      window.history.replaceState({ ...window.history.state, scrollY: window.scrollY }, "");
      window.history.pushState({ scrollY: 0 }, "", finalUrl.href);
    }

    const { added: addedStyles, previous: previousStyles } = await addPageStyles(nextDocument);
    if (sequence !== navigationSequence) return;

    const update = async () => {
      replacePageContent(nextDocument, currentHeader, currentFooter);
      updateDocumentMetadata(nextDocument);
      previousStyles.forEach(style => {
        if (!addedStyles.includes(style)) style.remove();
      });
      await runPageScripts(nextDocument);
      document.dispatchEvent(new CustomEvent("ashwa:pagechange", { detail: { url: finalUrl.href } }));
      window.updateBrandLogos?.();
    };

    if (document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      await document.startViewTransition(update).finished;
    } else {
      await update();
    }

    renderedUrl = finalUrl;

    if (history === "none") {
      window.scrollTo(0, scrollY);
    } else if (url.hash) {
      requestAnimationFrame(() => document.getElementById(decodeURIComponent(url.hash.slice(1)))?.scrollIntoView());
    } else {
      window.scrollTo(0, 0);
    }
  } catch (error) {
    console.warn("Ashwa page navigation failed; loading the page normally.", error);
    location.assign(url.href);
  } finally {
    navigationPending = false;
  }
}

function isSharedStylesheet(href) {
  const pathname = new URL(href, location.href).pathname;
  return pathname.includes("/assets/css/components/");
}

async function addPageStyles(nextDocument) {
  const previous = [...document.querySelectorAll('link[data-spa-page-style], style[data-spa-page-style]')];
  const currentHrefs = new Set([...document.querySelectorAll('link[rel="stylesheet"]')].map(link => link.href));
  const added = [];
  const pending = [];

  nextDocument.querySelectorAll('link[rel="stylesheet"][href]').forEach(source => {
    const href = new URL(source.href, location.href).href;
    if (isSharedStylesheet(href)) return;
    if (currentHrefs.has(href)) {
      const existing = [...document.querySelectorAll('link[rel="stylesheet"]')].find(link => link.href === href);
      if (existing?.hasAttribute("data-spa-page-style")) added.push(existing);
      return;
    }

    const link = source.cloneNode(true);
    link.dataset.spaPageStyle = "";
    link.onload = () => link.dataset.spaLoaded = "true";
    link.onerror = () => link.dataset.spaLoaded = "true";
    document.head.appendChild(link);
    added.push(link);
    pending.push(new Promise(resolve => {
      if (link.sheet) return resolve();
      const timeout = setTimeout(resolve, 3000);
      link.addEventListener("load", () => { clearTimeout(timeout); resolve(); }, { once: true });
      link.addEventListener("error", () => { clearTimeout(timeout); resolve(); }, { once: true });
    }));
  });

  nextDocument.querySelectorAll("style").forEach(source => {
    const style = source.cloneNode(true);
    style.dataset.spaPageStyle = "";
    document.head.appendChild(style);
    added.push(style);
  });

  await Promise.all(pending);
  return { added, previous };
}

function replacePageContent(nextDocument, header, footer) {
  activePageScope?.abort();
  activePageScope = new AbortController();

  const fragment = document.createDocumentFragment();
  [...nextDocument.body.childNodes].forEach(node => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.id === "main-header" || node.id === "main-footer" || node.id === "site-loader" || node.tagName === "SCRIPT") return;
    }
    fragment.appendChild(document.importNode(node, true));
  });

  [...document.body.childNodes].forEach(node => {
    if (node === header || node === footer || node.nodeType === Node.ELEMENT_NODE && node.matches(".site-update-toast")) return;
    node.remove();
  });
  footer.parentNode.insertBefore(fragment, footer);
  document.body.className = nextDocument.body.className;
  document.documentElement.lang = nextDocument.documentElement.lang || document.documentElement.lang;
}

function updateDocumentMetadata(nextDocument) {
  document.title = nextDocument.title || document.title;
  document.head.querySelectorAll("[data-spa-head]").forEach(node => node.remove());

  const selectors = [
    'meta[name="description"]',
    'meta[name="keywords"]',
    'meta[name="robots"]',
    'meta[property^="og:"]',
    'meta[name^="twitter:"]',
    'link[rel="canonical"]'
  ];
  nextDocument.head.querySelectorAll(selectors.join(",")).forEach(source => {
    const clone = source.cloneNode(true);
    clone.dataset.spaHead = "";
    document.head.appendChild(clone);
  });

  nextDocument.querySelectorAll('script[type="application/ld+json"]').forEach(source => {
    const clone = source.cloneNode(true);
    clone.dataset.spaHead = "";
    document.head.appendChild(clone);
  });
}

async function runPageScripts(nextDocument) {
  await ensureSharedScripts(nextDocument);
  const inlineHandlers = collectInlineHandlerNames(nextDocument);
  const scripts = [...nextDocument.querySelectorAll("script")].filter(script => {
    if (["application/ld+json", "application/json"].includes(script.type)) return false;
    if (!script.src) return Boolean(script.textContent.trim());
    const pathname = new URL(script.src, location.href).pathname;
    return !sharedScriptPaths.some(path => pathname.endsWith(path));
  });

  for (const source of scripts) {
    try {
      if (source.type === "module") {
        const moduleUrl = source.src ? new URL(source.src, location.href) : null;
        if (!moduleUrl) {
          const blobUrl = URL.createObjectURL(new Blob([source.textContent], { type: "text/javascript" }));
          await runWithPageScope(() => import(blobUrl));
          URL.revokeObjectURL(blobUrl);
        } else {
          moduleUrl.searchParams.set("_spa", String(++navigationSequence));
          await runWithPageScope(() => import(moduleUrl.href));
        }
      } else if (source.src) {
        const scriptUrl = new URL(source.src, location.href);
        if (scriptUrl.origin === location.origin) {
          const response = await fetch(scriptUrl.href, { cache: "force-cache" });
          if (!response.ok) throw new Error(`Script request failed (${response.status})`);
          const code = await response.text();
          await runWithPageScope(() => executeClassicScript(code, inlineHandlers));
        } else {
          await runExternalScript(source);
        }
      } else {
        await runWithPageScope(() => executeClassicScript(source.textContent, inlineHandlers));
      }
    } catch (error) {
      console.warn("A page interaction could not be initialized after navigation.", source.src || error);
    }
  }
}

function collectInlineHandlerNames(nextDocument) {
  const names = new Set();
  nextDocument.querySelectorAll("*").forEach(element => {
    [...element.attributes].forEach(attribute => {
      if (!/^on/i.test(attribute.name)) return;
      const match = attribute.value.trim().match(/^(?:return\s+)?([A-Za-z_$][\w$]*)\s*\(/);
      if (match && !["document", "window", "history", "location", "console"].includes(match[1])) names.add(match[1]);
    });
  });
  return [...names];
}

function executeClassicScript(code, inlineHandlers) {
  const exposeHandlers = inlineHandlers
    .map(name => `if (typeof ${name} !== "undefined") window[${JSON.stringify(name)}] = ${name};`)
    .join("\n");
  return new Function(`${code}\n${exposeHandlers}`).call(window);
}

async function ensureSharedScripts(nextDocument) {
  const required = [...nextDocument.querySelectorAll("script[src]")].filter(script => {
    const pathname = new URL(script.src, location.href).pathname;
    return sharedScriptPaths.some(path => pathname.endsWith(path)) && !pathname.endsWith("/loader.js") && !loadedSharedScripts.has(pathname);
  });

  for (const script of required) {
    const pathname = new URL(script.src, location.href).pathname;
    const response = await fetch(script.src, { cache: "force-cache" });
    if (!response.ok) continue;
    const code = await response.text();
    new Function(code).call(window);
    loadedSharedScripts.add(pathname);
  }
}

async function runExternalScript(source) {
  if (loadedExternalScripts.has(source.src)) return;
  await runWithPageScope(() => new Promise((resolve, reject) => {
    const script = source.cloneNode(false);
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  }));
  loadedExternalScripts.add(source.src);
}

async function runWithPageScope(run) {
  const scope = activePageScope;
  const prototype = EventTarget.prototype;
  const originalAdd = prototype.addEventListener;

  prototype.addEventListener = function (type, listener, options) {
    if ((this === document || this === window) && ["DOMContentLoaded", "load"].includes(type)) {
      queueMicrotask(() => {
        if (scope.signal.aborted) return;
        const event = new Event(type);
        if (typeof listener === "function") listener.call(this, event);
        else listener?.handleEvent?.(event);
      });
      return;
    }

    if (scope.signal.aborted || !listener || (typeof options === "object" && options?.signal)) {
      return originalAdd.call(this, type, listener, options);
    }

    const scopedOptions = typeof options === "boolean"
      ? { capture: options, signal: scope.signal }
      : { ...options, signal: scope.signal };
    return originalAdd.call(this, type, listener, scopedOptions);
  };

  try {
    return await run();
  } finally {
    prototype.addEventListener = originalAdd;
  }
}
