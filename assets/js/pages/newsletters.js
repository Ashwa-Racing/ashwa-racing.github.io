(() => {
  'use strict';

  async function init() {
  const response = await fetch('assets/data/newsletters.json');
  if (!response.ok) throw new Error(`Could not load newsletter data (${response.status}).`);
  const files = await response.json();
  if (!Array.isArray(files)) throw new Error('Newsletter data must be a JSON array.');

  const assetHost = 'https://assets.ashwaracing.org';
  const pdfBase = `${assetHost}/pdfs/newsletters/`;
  const imageBase = `${assetHost}/images/newsletters/`;
  const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const typeNames = { general: 'General', hybrid: 'Hybrid', combustion: 'Combustion', alumni: 'Alumni' };
  const newsletters = files.map(file => {
    const [year, month, typeFile] = file.split('-');
    const type = typeFile.replace('.pdf', '');
    return { year, month, type, title: `${monthNames[Number(month)]} ${year}`, pdf: `${pdfBase}${year}/${file}`, cover: `${imageBase}${year}/${year}-${month}` };
  }).sort((a, b) => `${b.year}${b.month}`.localeCompare(`${a.year}${a.month}`));
  const archiveGroups = new Map();
  newsletters.forEach(item => {
    const key = `${item.year}-${item.month}`;
    if (!archiveGroups.has(key)) archiveGroups.set(key, []);
    archiveGroups.get(key).push(item);
  });

  const list = document.getElementById('list');
  const filterBar = document.getElementById('filter-bar');
  const count = document.getElementById('count');
  const empty = document.getElementById('empty');
  if (!list || !filterBar || !count || !empty) return;

  [...new Set(newsletters.map(item => item.year))].sort((a, b) => b.localeCompare(a)).forEach(year => {
    if ([...filterBar.querySelectorAll('button[data-year]')].some(button => button.dataset.year === year)) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.year = year;
    button.textContent = year;
    filterBar.appendChild(button);
  });

  const render = items => {
    list.replaceChildren();
    count.textContent = `${items.length} ${items.length === 1 ? 'newsletter' : 'newsletters'}`;
    empty.hidden = items.length !== 0;

    const groups = new Map();
    items.forEach(item => {
      const key = `${item.year}-${item.month}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    });

    groups.forEach(group => {
      const first = group[0];
      const card = document.createElement('article');
      card.className = 'blog-card newsletter-card';
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `Read ${first.title} newsletter`);
      const image = document.createElement('div');
      image.className = 'blog-card-image';
      const img = document.createElement('img');
      img.src = `${first.cover}.jpg`;
      img.alt = `${first.title} newsletter cover`;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.addEventListener('error', () => {
        if (!img.dataset.triedPng) {
          img.dataset.triedPng = 'true';
          img.src = `${first.cover}.png`;
        } else image.hidden = true;
      });
      image.appendChild(img);

      const body = document.createElement('div');
      body.className = 'blog-card-body';
      const kicker = document.createElement('p');
      kicker.className = 'newsletter-card-kicker';
      kicker.textContent = `Ashwa Racing · ${group.length > 1 ? `${group.length} editions` : 'Monthly edition'}`;
      const heading = document.createElement('h2');
      heading.className = 'blog-card-title';
      heading.textContent = first.title;
      const links = document.createElement('div');
      links.className = 'newsletter-types';
      group.forEach((item, index) => {
        const link = document.createElement('a');
        link.className = 'newsletter-link';
        link.href = issueUrl(item);
        link.textContent = typeNames[item.type] || item.type;
        link.setAttribute('aria-label', `Read ${item.title} ${typeNames[item.type] || item.type} newsletter`);
        link.dataset.edition = String(index + 1).padStart(2, '0');
        link.addEventListener('click', event => {
          if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          openReader(item);
        });
        links.appendChild(link);
      });
      body.append(kicker, heading, links);
      card.append(image, body);
      card.addEventListener('click', event => {
        if (event.target.closest('a')) return;
        openReader(first);
      });
      card.addEventListener('keydown', event => {
        if (event.target !== card || !['Enter', ' '].includes(event.key)) return;
        event.preventDefault();
        openReader(first);
      });
      list.appendChild(card);
      requestAnimationFrame(() => card.classList.add('visible'));
    });
  };

  const reader = document.getElementById('newsletter-reader');
  const dialog = reader.querySelector('.reader-dialog');
  const readerTitle = document.getElementById('reader-title');
  const readerEdition = document.getElementById('reader-edition');
  const downloadLink = document.getElementById('reader-download');
  const shareButton = document.getElementById('reader-share');
  const fallbackLink = document.getElementById('reader-fallback');
  const errorPanel = document.getElementById('reader-error');
  const loadingPanel = document.getElementById('reader-loading');
  const canvas = document.getElementById('reader-canvas');
  const nextCanvas = document.getElementById('reader-canvas-next');
  const sheet = document.getElementById('reader-sheet');
  const nextSheet = document.getElementById('reader-sheet-next');
  const stage = document.getElementById('reader-stage');
  const pageCount = document.getElementById('reader-page-count');
  const zoomLabel = document.getElementById('reader-zoom-label');
  const recList = document.getElementById('reader-recommendations');
  const viewToggle = document.getElementById('reader-view-toggle');
  let singlePageMode = false;
  let pdfDocument = null;
  let pageNumber = 1;
  let zoom = 1;
  let lastFocus = null;
  let renderTasks = [];
  let turnTimer = null;
  let openRequest = 0;

  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  function createRecommendations(current) {
    const candidates = [...archiveGroups.entries()]
      .filter(([key]) => key !== `${current.year}-${current.month}`)
      .map(value => ({ value, order: Math.random() }))
      .sort((a, b) => a.order - b.order)
      .map(entry => entry.value)
      .slice(0, 3);
    recList.replaceChildren();
    candidates.forEach(([, editions]) => {
      const item = editions[Math.floor(Math.random() * editions.length)];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'reader-rec-card';
      const image = document.createElement('img');
      image.src = `${item.cover}.jpg`;
      image.alt = '';
      image.loading = 'lazy';
      image.addEventListener('error', () => {
        if (!image.dataset.triedPng) {
          image.dataset.triedPng = 'true';
          image.src = `${item.cover}.png`;
        } else image.hidden = true;
      });
      const text = document.createElement('span');
      text.innerHTML = `<small>${typeNames[item.type] || item.type}</small><strong>${item.title}</strong>`;
      button.append(image, text);
      button.addEventListener('click', () => openReader(item));
      recList.appendChild(button);
    });
  }

  async function renderPage(page = pageNumber, animate = false) {
    if (!pdfDocument || !stage.clientWidth || !stage.clientHeight) return;
    pageNumber = Math.max(1, Math.min(pdfDocument.numPages, page));
    const isMobile = window.matchMedia('(max-width: 760px)').matches;
    const isSinglePage = isMobile || singlePageMode;
    const pageStep = isSinglePage ? 1 : 2;
    const secondPageNumber = pageNumber + 1;
    pageCount.textContent = isSinglePage || secondPageNumber > pdfDocument.numPages
      ? `${pageNumber} / ${pdfDocument.numPages}`
      : `${pageNumber}–${secondPageNumber} / ${pdfDocument.numPages}`;
    nextSheet.hidden = isSinglePage || secondPageNumber > pdfDocument.numPages;
    stage.classList.toggle('has-single-page', secondPageNumber > pdfDocument.numPages);
    stage.classList.toggle('is-single-page', isSinglePage);
    viewToggle.hidden = false;
    viewToggle.textContent = singlePageMode ? 'Two-page spread' : 'Expand page';
    viewToggle.setAttribute('aria-pressed', String(singlePageMode));
    document.getElementById('reader-prev').setAttribute('aria-label', isSinglePage ? 'Previous page' : 'Previous spread');
    document.getElementById('reader-next').setAttribute('aria-label', isSinglePage ? 'Next page' : 'Next spread');
    document.getElementById('reader-prev').disabled = pageNumber <= 1;
    document.getElementById('reader-next').disabled = pageNumber + pageStep > pdfDocument.numPages;
    document.getElementById('reader-page-prev').disabled = pageNumber <= 1;
    document.getElementById('reader-page-next').disabled = pageNumber + pageStep > pdfDocument.numPages;

    if (animate) {
      sheet.classList.add('is-turning');
      nextSheet.classList.add('is-turning');
      clearTimeout(turnTimer);
      await new Promise(resolve => setTimeout(resolve, 140));
    }
    renderTasks.forEach(task => task.cancel());
    renderTasks = [];
    try {
      const slots = [{ number: pageNumber, canvas }];
      if (!isSinglePage && secondPageNumber <= pdfDocument.numPages) slots.push({ number: secondPageNumber, canvas: nextCanvas });
      await Promise.all(slots.map(async slot => {
        const pageData = await pdfDocument.getPage(slot.number);
        const baseViewport = pageData.getViewport({ scale: 1 });
        const expanded = dialog.classList.contains('is-expanded');
        const expandedWidthGutter = 0;
        const expandedHeightGutter = 0;
        const slotWidth = isSinglePage ? stage.clientWidth - (expanded ? expandedWidthGutter : 32) : stage.clientWidth / 2 - 24;
        const slotHeight = stage.clientHeight - (expanded ? expandedHeightGutter : 26);
        const fit = Math.min(slotWidth / baseViewport.width, slotHeight / baseViewport.height);
        const outputScale = Math.min(window.devicePixelRatio || 1, 1.5);
        const viewport = pageData.getViewport({ scale: fit * zoom });
        slot.canvas.width = Math.floor(viewport.width * outputScale);
        slot.canvas.height = Math.floor(viewport.height * outputScale);
        slot.canvas.style.width = `${Math.floor(viewport.width)}px`;
        slot.canvas.style.height = `${Math.floor(viewport.height)}px`;
        const task = pageData.render({ canvasContext: slot.canvas.getContext('2d'), viewport, transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null });
        renderTasks.push(task);
        await task.promise;
      }));
      if (animate) turnTimer = setTimeout(() => { sheet.classList.remove('is-turning'); nextSheet.classList.remove('is-turning'); }, 20);
    } catch (error) {
      if (error?.name !== 'RenderingCancelledException') console.warn('Newsletter page render failed:', error);
    }
  }

  function issueUrl(item) {
    return `/newsletters/${item.year}-${item.month}-${item.type}`;
  }

  function setIssueMetadata(item) {
    const canonical = item
      ? `${window.location.origin}/newsletters/${item.year}-${item.month}-${item.type}`
      : `${window.location.origin}/newsletters`;
    const issueTitle = item
      ? `${item.title} ${typeNames[item.type] || item.type} Newsletter | Ashwa Racing`
      : 'Newsletters | Ashwa Racing';
    const description = item
      ? `Read the Ashwa Racing ${item.title} ${typeNames[item.type] || item.type} newsletter, with Formula Student engineering updates and team news.`
      : 'Read newsletters from Ashwa Racing, with Formula Student engineering updates and team news.';
    document.title = issueTitle;
    const canonicalEl = document.querySelector('link[rel="canonical"]');
    if (canonicalEl) canonicalEl.href = canonical;
    const setMeta = (selector, value) => {
      const element = document.head.querySelector(selector);
      if (element) element.content = value;
    };
    setMeta('meta[name="description"]', description);
    setMeta('meta[property="og:title"]', issueTitle);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[property="og:url"]', canonical);
    setMeta('meta[property="og:image"]', item?.cover || `${assetHost}/images/favicon/header.png`);
    setMeta('meta[name="twitter:title"]', issueTitle);
    setMeta('meta[name="twitter:description"]', description);
    setMeta('meta[name="twitter:image"]', item?.cover || `${assetHost}/images/favicon/header.png`);
  }

  async function openReader(item, { updateUrl = true } = {}) {
    const requestId = ++openRequest;
    lastFocus = document.activeElement;
    reader.hidden = false;
    document.body.classList.add('reader-open');
    setIssueMetadata(item);
    dialog.focus();
    readerTitle.textContent = item.title;
    if (updateUrl) history.pushState({ newsletterReader: true }, '', issueUrl(item));
    shareButton.textContent = 'Share issue';
    readerEdition.textContent = `Ashwa Racing · ${typeNames[item.type] || item.type} edition`;
    downloadLink.href = item.pdf;
    fallbackLink.href = item.pdf;
    errorPanel.hidden = true;
    loadingPanel.hidden = false;
    canvas.hidden = false;
    nextCanvas.hidden = false;
    recList.innerHTML = '<p class="reader-rec-loading">Finding another issue to read…</p>';
    createRecommendations(item);
    if (pdfDocument) { pdfDocument.destroy(); pdfDocument = null; }
    pageNumber = 1;
    zoom = 1;
    zoomLabel.textContent = 'FIT';
    singlePageMode = false;
    dialog.classList.remove('is-expanded');
    reader.classList.remove('is-expanded');
    pageCount.textContent = '— / —';

    if (!window.pdfjsLib) {
      loadingPanel.hidden = true;
      errorPanel.hidden = false;
      canvas.hidden = true;
      nextCanvas.hidden = true;
      pageCount.textContent = 'PDF';
      return;
    }
    try {
      const loadedDocument = await window.pdfjsLib.getDocument({ url: item.pdf, withCredentials: false }).promise;
      if (requestId !== openRequest || reader.hidden) { loadedDocument.destroy(); return; }
      pdfDocument = loadedDocument;
      await renderPage(1);
      if (requestId === openRequest && !reader.hidden) loadingPanel.hidden = true;
    } catch (error) {
      if (requestId !== openRequest || reader.hidden) return;
      console.warn('Newsletter PDF could not be loaded in the reader:', error);
      loadingPanel.hidden = true;
      errorPanel.hidden = false;
      canvas.hidden = true;
      nextCanvas.hidden = true;
      pageCount.textContent = 'PDF';
    }
  }

  function closeReader() {
    openRequest++;
    singlePageMode = false;
    dialog.classList.remove('is-expanded');
    reader.classList.remove('is-expanded');
    reader.hidden = true;
    const url = new URL(window.location.href);
    if (url.pathname.match(/^\/newsletters\/\d{4}-\d{2}-[a-z]+\/?$/)) {
      url.pathname = '/newsletters';
      url.searchParams.delete('issue');
      history.replaceState({}, '', url);
      document.querySelector('.newsletter-issue-landing')?.remove();
    } else if (url.searchParams.has('issue')) {
      url.searchParams.delete('issue');
      history.replaceState({}, '', url);
    }
    setIssueMetadata(null);
    document.body.classList.remove('reader-open');
    if (pdfDocument) { pdfDocument.destroy(); pdfDocument = null; }
    renderTasks.forEach(task => task.cancel());
    renderTasks = [];
    lastFocus?.focus?.();
  }

  shareButton.addEventListener('click', async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      shareButton.textContent = 'Link copied';
    } catch (error) {
      window.prompt('Copy this newsletter link:', url);
    }
  });
  window.addEventListener('popstate', () => {
    const url = new URL(window.location.href);
    const routeKey = url.pathname.match(/^\/newsletters\/(\d{4}-\d{2}-[a-z]+)\/?$/)?.[1];
    const key = url.searchParams.get('issue') || routeKey;
    const item = newsletters.find(entry => `${entry.year}-${entry.month}-${entry.type}` === key);
    if (item) openReader(item, { updateUrl: false });
    else if (!reader.hidden) closeReader();
  });

  function turnPage(direction) {
    if (!pdfDocument) return;
    const nextPage = pageNumber + direction * (window.matchMedia('(max-width: 760px)').matches || singlePageMode ? 1 : 2);
    if (nextPage < 1 || nextPage > pdfDocument.numPages) return;
    renderPage(nextPage, true);
  }

  document.querySelectorAll('[data-reader-close]').forEach(button => button.addEventListener('click', closeReader));
  document.getElementById('reader-prev').addEventListener('click', () => turnPage(-1));
  document.getElementById('reader-next').addEventListener('click', () => turnPage(1));
  document.getElementById('reader-page-prev').addEventListener('click', () => turnPage(-1));
  document.getElementById('reader-page-next').addEventListener('click', () => turnPage(1));
  viewToggle.addEventListener('click', () => {
    singlePageMode = !singlePageMode;
    dialog.classList.toggle('is-expanded', singlePageMode);
    reader.classList.toggle('is-expanded', singlePageMode);
    if (singlePageMode) dialog.querySelector('.reader-close').focus();
    renderPage(pageNumber, true);
  });
  document.getElementById('reader-zoom-out').addEventListener('click', () => { zoom = Math.max(.7, zoom - .15); zoomLabel.textContent = `${Math.round(zoom * 100)}%`; renderPage(); });
  document.getElementById('reader-zoom-in').addEventListener('click', () => { zoom = Math.min(1.8, zoom + .15); zoomLabel.textContent = `${Math.round(zoom * 100)}%`; renderPage(); });
  document.addEventListener('keydown', event => {
    if (reader.hidden) return;
    if (event.key === 'Escape') closeReader();
    else if (event.key === 'ArrowRight') turnPage(1);
    else if (event.key === 'ArrowLeft') turnPage(-1);
    else if (event.key === 'Tab') {
      const focusable = [...dialog.querySelectorAll('a[href],button:not(:disabled),[tabindex]:not([tabindex="-1"])')]
        .filter(element => !element.hidden && element.getClientRects().length);
      if (!focusable.length) { event.preventDefault(); dialog.focus(); return; }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  window.addEventListener('resize', () => { if (!reader.hidden) renderPage(); });

  let touchStart = null;
  stage.addEventListener('touchstart', event => {
    if (event.touches.length !== 1) { touchStart = null; return; }
    touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }, { passive: true });
  stage.addEventListener('touchend', event => {
    if (!touchStart || !event.changedTouches.length) return;
    const deltaX = event.changedTouches[0].clientX - touchStart.x;
    const deltaY = event.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return;
    turnPage(deltaX < 0 ? 1 : -1);
  }, { passive: true });

  filterBar.addEventListener('click', event => {
    const button = event.target.closest('button[data-year]');
    if (!button || !filterBar.contains(button)) return;
    filterBar.querySelectorAll('button').forEach(item => {
      const active = item === button;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    render(button.dataset.year === 'all' ? newsletters : newsletters.filter(item => item.year === button.dataset.year));
  });

  render(newsletters);
  const initialUrl = new URL(window.location.href);
  const routeIssue = initialUrl.pathname.match(/^\/newsletters\/(\d{4}-\d{2}-[a-z]+)\/?$/)?.[1];
  const initialIssue = initialUrl.searchParams.get('issue') || routeIssue;
  const initialItem = newsletters.find(item => `${item.year}-${item.month}-${item.type}` === initialIssue);
  if (initialItem) openReader(initialItem, { updateUrl: false });
  }

  init().catch(error => console.error('Newsletter archive could not be initialized:', error));
})();
