/* ============================================================
   ASHWA RACING — BLOG LISTING
   ============================================================ */

(() => {
  'use strict';

  const DATA_URL = 'assets/data/blog.json';

  const featuredEl = document.getElementById('blog-featured');
  const filterEl = document.getElementById('blog-filter');
  const gridEl = document.getElementById('blog-grid');
  const emptyEl = document.getElementById('blog-empty');

  let posts = [];
  let activeCategory = 'All';

  const escapeHTML = (value = '') =>
    String(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[char]));

  const parseDate = date => {
    if (!date) {
      return null;
    }

    const value = String(date).trim();

    if (/^\d{4}$/.test(value)) {
      return new Date(`${value}-01-01T00:00:00`);
    }

    if (/^\d{4}-\d{2}$/.test(value)) {
      return new Date(`${value}-01T00:00:00`);
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(`${value}T00:00:00`);
    }

    return null;
  };

  const dateValue = date => {
    const parsed = parseDate(date);
    return parsed ? parsed.getTime() : 0;
  };

  const formatDate = date => {
    const value = String(date || '').trim();

    if (/^\d{4}$/.test(value)) {
      return value;
    }

    const parsed = parseDate(value);

    if (!parsed) {
      return value;
    }

    const options = /^\d{4}-\d{2}$/.test(value)
      ? {
          month: 'long',
          year: 'numeric'
        }
      : {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        };

    return new Intl.DateTimeFormat('en-IN', options).format(parsed);
  };

  const postURL = slug =>
    `blog-post.html?post=${encodeURIComponent(slug)}`;

  const renderFeatured = post => {
    if (!post) {
      featuredEl.innerHTML = '';
      return;
    }

    featuredEl.innerHTML = `
      <a class="blog-featured-card" href="${postURL(post.slug)}">

        <div class="blog-featured-image">
          <img
            src="${escapeHTML(post.cover)}"
            alt="${escapeHTML(post.coverAlt || post.title)}"
            loading="eager"
            decoding="async">
        </div>

        <div class="blog-featured-body">

          <span class="blog-meta">
            ${escapeHTML(post.category)} ·
            ${escapeHTML(formatDate(post.date))}
          </span>

          <h2>
            ${escapeHTML(post.title)}
          </h2>

          <p class="blog-featured-excerpt">
            ${escapeHTML(post.excerpt)}
          </p>

          <span class="blog-read-more">
            Read Article <span aria-hidden="true">→</span>
          </span>

        </div>

      </a>
    `;
  };

  const renderFilters = () => {
    const categories = [
      'All',
      ...new Set(
        posts
          .map(post => post.category)
          .filter(Boolean)
      )
    ];

    filterEl.innerHTML = categories.map(category => `
      <button
        type="button"
        class="${category === activeCategory ? 'is-active' : ''}"
        data-category="${escapeHTML(category)}"
        aria-pressed="${category === activeCategory}">
        ${escapeHTML(category)}
      </button>
    `).join('');
  };

  const renderGrid = () => {
    const filtered =
      activeCategory === 'All'
        ? posts
        : posts.filter(
            post => post.category === activeCategory
          );

    gridEl.innerHTML = filtered.map(post => `
      <a class="blog-card" href="${postURL(post.slug)}">

        <div class="blog-card-image">
          <img
            src="${escapeHTML(post.cover)}"
            alt="${escapeHTML(post.coverAlt || post.title)}"
            loading="lazy"
            decoding="async">
        </div>

        <div class="blog-card-body">

          <span class="blog-meta">
            ${escapeHTML(post.category)} ·
            ${escapeHTML(formatDate(post.date))}
          </span>

          <h2>
            ${escapeHTML(post.title)}
          </h2>

          <p class="blog-card-excerpt">
            ${escapeHTML(post.excerpt)}
          </p>

          <span class="blog-card-link">
            Read Article →
          </span>

        </div>

      </a>
    `).join('');

    emptyEl.hidden = filtered.length > 0;
  };

  const render = () => {
    const featured =
      posts.find(post => post.featured) ||
      posts[0] ||
      null;

    renderFeatured(featured);
    renderFilters();
    renderGrid();
  };

  const showError = () => {
    featuredEl.innerHTML = '';
    filterEl.innerHTML = '';
    gridEl.innerHTML = '';

    emptyEl.hidden = false;

    const message =
      emptyEl.querySelector('p');

    if (message) {
      message.textContent =
        'Unable to load articles.';
    }
  };

  const loadPosts = async () => {
    try {
      const response = await fetch(DATA_URL, {
        cache: 'no-cache'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data.posts)) {
        throw new Error('Invalid blog data.');
      }

      posts = data.posts
        .filter(
          post =>
            post &&
            post.slug &&
            post.title
        )
        .sort(
          (a, b) =>
            dateValue(b.date) -
            dateValue(a.date)
        );

      if (!posts.length) {
        showError();
        return;
      }

      render();

    } catch (error) {
      console.error(
        'Ashwa Blog: failed to load blog data.',
        error
      );

      showError();
    }
  };

  filterEl.addEventListener('click', event => {
    const button =
      event.target.closest('[data-category]');

    if (!button) {
      return;
    }

    activeCategory =
      button.dataset.category;

    filterEl
      .querySelectorAll('[data-category]')
      .forEach(item => {
        const active =
          item === button;

        item.classList.toggle(
          'is-active',
          active
        );

        item.setAttribute(
          'aria-pressed',
          String(active)
        );
      });

    renderGrid();
  });

  loadPosts();

})();