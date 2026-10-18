(() => {
  const dataPath = 'assets/data/admin-resources.json';
  const categories = ['All resources', 'Team & people', 'Website publishing', 'Email updates', 'Crowdfunding'];
  const filters = document.getElementById('category-filters');
  const groups = document.getElementById('resource-groups');
  const search = document.getElementById('resource-search');
  let resources = [];
  let activeCategory = 'All resources';
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const validUrl = value => { try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; } catch { return ''; } };
  const dateLabel = value => { const date = new Date(`${value}T00:00:00`); return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('en-IN', { day:'numeric', month:'short', year:'numeric' }).format(date); };

  function renderFilters() {
    filters.innerHTML = categories.map(category => `<button class="filter" type="button" aria-pressed="${category === activeCategory}" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`).join('');
    filters.querySelectorAll('button').forEach(button => button.addEventListener('click', () => { activeCategory = button.dataset.category; renderFilters(); renderResources(); }));
  }

  function card(resource) {
    const destination = validUrl(resource.url);
    const guide = validUrl(resource.guide);
    const status = resource.status === 'setup-pending' ? 'Setup in progress' : 'In use';
    return `<article class="resource-card">
      <div class="resource-card-top"><span class="resource-type">${escapeHtml(resource.type)}</span><span class="resource-status ${resource.status === 'setup-pending' ? 'setup' : ''}">${status}</span></div>
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
  fetch(dataPath, { cache:'no-cache' }).then(response => { if (!response.ok) throw new Error('The directory data is not available.'); return response.json(); }).then(data => {
    resources = Array.isArray(data.resources) ? data.resources : [];
    document.getElementById('resource-count').textContent = resources.length;
    document.getElementById('linked-count').textContent = resources.filter(resource => validUrl(resource.url)).length;
    document.getElementById('setup-count').textContent = resources.filter(resource => resource.status === 'setup-pending').length;
    document.getElementById('reviewed-date').textContent = dateLabel(data.reviewed);
    renderFilters(); renderResources();
  }).catch(error => { groups.innerHTML = `<p class="empty-state">${escapeHtml(error.message)} Please reload this page or ask the IT / SMP team.</p>`; });
})();
