(() => {
  const dataPath = '/assets/data/admin-resources.json';
  const privateLinksPath = '/_admin/resources';
  const categories = ['All resources', 'Team & people', 'Email updates', 'Crowdfunding'];
  const filters = document.getElementById('category-filters');
  const groups = document.getElementById('resource-groups');
  const search = document.getElementById('resource-search');
  const themeToggle = document.getElementById('ops-theme-toggle');
  const loaderStartedAt = performance.now();
  let resources = [];
  let privateLinks = {};
  let activeCategory = 'All resources';
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const validUrl = value => { try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; } catch { return ''; } };
  const dateLabel = value => { const date = new Date(`${value}T00:00:00`); return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('en-IN', { day:'numeric', month:'short', year:'numeric' }).format(date); };

  async function loadPublishedCounts() {
    const paths = ['/assets/data/team.json', '/assets/data/blog.json', '/assets/data/newsletters.json'];
    const countIds = ['team-profile-count', 'blog-article-count', 'newsletter-issue-count'];
    const results = await Promise.allSettled(paths.map(path => fetch(path, { cache:'no-cache' }).then(response => {
      if (!response.ok) throw new Error(`Could not load ${path}`);
      return response.json();
    })));
    const data = results.map(result => result.status === 'fulfilled' ? result.value : null);
    results.forEach((result, index) => {
      if (result.status !== 'fulfilled') return;
      const value = result.value;
      const count = index === 0 ? (Array.isArray(value) ? value.filter(person => person && person.name).length : null)
        : index === 1 ? (Array.isArray(value.posts) ? value.posts.length : null)
        : (Array.isArray(value) ? value.length : null);
      if (count !== null) document.getElementById(countIds[index]).textContent = count.toLocaleString('en-IN');
    });
    renderRosterChart(data[0]);
    renderPublishingChart(data[1], data[2]);
  }

  function renderLineChart(elementId, labels, series, description) {
    const target = document.getElementById(elementId);
    if (!labels.length || !series.some(item => item.values.length)) { target.innerHTML = '<p class="chart-empty">No published records found.</p>'; return; }
    const width = 640, height = 240, left = 38, right = 18, top = 18, bottom = 38;
    const plotWidth = width - left - right, plotHeight = height - top - bottom;
    const maximum = Math.max(...series.flatMap(item => item.values), 1);
    const x = index => labels.length < 2 ? left + plotWidth / 2 : left + index * plotWidth / (labels.length - 1);
    const y = value => top + plotHeight - value / maximum * plotHeight;
    const grid = Array.from({ length:4 }, (_, index) => {
      const value = Math.round(maximum * (3 - index) / 3);
      const lineY = top + index * plotHeight / 3;
      return `<g class="line-grid"><line x1="${left}" y1="${lineY}" x2="${width-right}" y2="${lineY}"/><text x="${left-9}" y="${lineY+3}" text-anchor="end">${value}</text></g>`;
    }).join('');
    const labelsSvg = labels.map((label, index) => `<text class="line-label" x="${x(index)}" y="${height-12}" text-anchor="middle">${escapeHtml(label)}</text>`).join('');
    const lines = series.map((item, seriesIndex) => {
      const points = item.values.map((value, index) => `${x(index)},${y(value)}`).join(' ');
      const nodes = item.values.map((value, index) => `<circle class="line-point${index === item.values.length - 1 ? ' latest' : ''}" cx="${x(index)}" cy="${y(value)}" r="${index === item.values.length - 1 ? 4 : 2.5}"/>`).join('');
      return `<g class="line-series series-${seriesIndex + 1}"><polyline pathLength="1" points="${points}"/>${nodes}</g>`;
    }).join('');
    target.innerHTML = `<svg class="line-plot" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(description)}" focusable="false">${grid}${lines}${labelsSvg}</svg>`;
  }

  function renderRosterChart(team) {
    if (!Array.isArray(team)) { document.getElementById('cohort-chart').innerHTML = '<p class="chart-empty">Roster data is unavailable.</p>'; return; }
    const counts = new Map();
    team.filter(person => person && person.name).forEach(person => {
      const year = String(person.year || 'Unspecified');
      counts.set(year, (counts.get(year) || 0) + 1);
    });
    const years = [...counts.entries()].sort((a, b) => (Number(b[0]) || 0) - (Number(a[0]) || 0));
    const shown = years.slice(0, 8).reverse();
    const earlierCount = years.slice(8).reduce((sum, [, value]) => sum + value, 0);
    if (earlierCount) shown.unshift(['Earlier', earlierCount]);
    renderLineChart('cohort-chart', shown.map(([label]) => label), [{ values:shown.map(([, value]) => value) }], 'Team member profiles by batch, oldest to newest');
  }

  function renderPublishingChart(blogData, newsletterData) {
    const years = new Map();
    const add = (year, type) => {
      if (!/^\d{4}$/.test(year)) return;
      if (!years.has(year)) years.set(year, { blog:0, newsletter:0 });
      years.get(year)[type] += 1;
    };
    if (blogData && Array.isArray(blogData.posts)) blogData.posts.forEach(post => add(String(post.date || '').slice(0, 4), 'blog'));
    if (Array.isArray(newsletterData)) newsletterData.forEach(file => {
      const match = String(file).match(/^(\d{4})-/);
      if (match) add(match[1], 'newsletter');
    });
    if (!blogData && !newsletterData) { document.getElementById('publishing-chart').innerHTML = '<p class="chart-empty">Publishing data is unavailable.</p>'; return; }
    const rows = [...years.entries()].sort((a, b) => Number(a[0]) - Number(b[0])).slice(-8);
    const target = document.getElementById('publishing-chart');
    if (!rows.length) { target.innerHTML = '<p class="chart-empty">No published records found.</p>'; return; }
    renderLineChart('publishing-chart', rows.map(([year]) => year), [
      { values:rows.map(([, value]) => value.blog) },
      { values:rows.map(([, value]) => value.newsletter) }
    ], 'Blog articles and newsletter issues published by year');
  }

  function syncThemeToggle() {
    const light = document.documentElement.dataset.theme === 'light';
    themeToggle.setAttribute('aria-pressed', String(light));
    themeToggle.setAttribute('aria-label', `Switch to ${light ? 'dark' : 'light'} mode`);
  }

  function renderFilters() {
    filters.innerHTML = categories.map(category => `<button class="filter" type="button" aria-pressed="${category === activeCategory}" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`).join('');
    filters.querySelectorAll('button').forEach(button => button.addEventListener('click', () => { activeCategory = button.dataset.category; renderFilters(); renderResources(); }));
  }

  function card(resource) {
    const destination = validUrl(resource.url || privateLinks[resource.id]);
    const guide = validUrl(resource.guide);
    const isSetup = resource.status === 'setup-pending';
    const isLegacy = resource.status === 'legacy';
    const status = isSetup ? 'Setup in progress' : isLegacy ? 'Archive' : 'In use';
    return `<article class="resource-card">
      <div class="resource-card-top"><span class="resource-type">${escapeHtml(resource.type)}</span><span class="resource-status ${isSetup ? 'setup' : ''} ${isLegacy ? 'legacy' : ''}">${status}</span></div>
      <h4>${escapeHtml(resource.name)}</h4><p>${escapeHtml(resource.summary)}</p><p class="resource-access">${escapeHtml(resource.access)}</p>
      <div class="resource-actions">${destination ? `<a class="open-link" href="${escapeHtml(destination)}" target="_blank" rel="noopener noreferrer">Open resource</a>` : '<span class="open-link is-disabled" aria-label="Resource link has not been added">Link not added yet</span>'}${guide ? `<a class="guide-link" href="${escapeHtml(guide)}" target="_blank" rel="noopener noreferrer">How it works</a>` : ''}</div>
    </article>`;
  }

  function renderResources() {
    const query = search.value.trim().toLowerCase();
    const matches = resources.filter(resource => (activeCategory === 'All resources' || resource.category === activeCategory) && `${resource.name} ${resource.type} ${resource.category} ${resource.summary} ${resource.access}`.toLowerCase().includes(query));
    if (!matches.length) { groups.innerHTML = '<p class="empty-state">No resources match that search.</p>'; return; }
    const shownCategories = activeCategory === 'All resources' ? categories.slice(1) : [activeCategory];
    groups.innerHTML = shownCategories.map(category => {
      const entries = matches.filter(resource => resource.category === category);
      return entries.length ? `<section class="resource-group"><h3>${escapeHtml(category)}</h3><div class="resource-grid">${entries.map(card).join('')}</div></section>` : '';
    }).join('');
  }

  search.addEventListener('input', renderResources);
  themeToggle.addEventListener('click', () => {
    const nextTheme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = nextTheme;
    try { localStorage.setItem('ashwa-theme', nextTheme); } catch (error) {}
    syncThemeToggle();
  });
  syncThemeToggle();
  loadPublishedCounts();
  Promise.all([
    fetch(dataPath, { cache:'no-cache' }).then(response => { if (!response.ok) throw new Error('The directory data is not available.'); return response.json(); }),
    fetch(privateLinksPath, { cache:'no-store', credentials:'same-origin' }).then(response => response.ok ? response.json() : {})
  ]).then(([data, links]) => {
    resources = Array.isArray(data.resources) ? data.resources : [];
    privateLinks = links && typeof links === 'object' ? links : {};
    document.getElementById('resource-count').textContent = resources.length;
    document.getElementById('linked-count').textContent = resources.filter(resource => validUrl(resource.url || privateLinks[resource.id])).length;
    document.getElementById('setup-count').textContent = resources.filter(resource => resource.status === 'setup-pending').length;
    document.getElementById('reviewed-date').textContent = dateLabel(data.reviewed);
    renderFilters(); renderResources();
  }).catch(error => { groups.innerHTML = `<p class="empty-state">${escapeHtml(error.message)} Please reload this page or ask the IT / SMP team.</p>`; })
    .finally(() => {
      const delay = Math.max(0, 2700 - (performance.now() - loaderStartedAt));
      window.setTimeout(() => {
        const loader = document.getElementById('ops-preloader');
        if (!loader) return;
        loader.setAttribute('aria-hidden', 'true');
        loader.classList.add('is-done');
      }, delay);
    });
})();
