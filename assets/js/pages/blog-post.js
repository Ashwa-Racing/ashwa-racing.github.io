/* ============================================================
   ASHWA RACING — BLOG POST
   ============================================================ */

(() => {
  'use strict';

  const DATA_URL = 'assets/data/blog.json';

  const metaEl = document.getElementById('blog-post-meta');
  const titleEl = document.getElementById('blog-post-title');
  const excerptEl = document.getElementById('blog-post-excerpt');
  const coverEl = document.getElementById('blog-post-cover');
  const bodyEl = document.getElementById('blog-post-body');
  const navigationEl = document.getElementById('blog-post-navigation');
  const relatedEl = document.getElementById('blog-related');

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

  function setMeta(attribute, name, content) {
    let element = document.head.querySelector(
      `meta[${attribute}="${name}"]`
    );

    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attribute, name);
      document.head.appendChild(element);
    }

    element.setAttribute('content', content);
  }

  const getAbsoluteURL = value => {
    if (!value) {
      return '';
    }

    return new URL(value, window.location.href).href;
  };

  const setArticleMetadata = post => {
    const title = `${post.title} | Ashwa Racing`;

    const description =
      post.excerpt || 'Ashwa Racing article';

    const url =
      `${window.location.origin}/blog-post.html?post=${
        encodeURIComponent(post.slug)
      }`;

    const image =
      getAbsoluteURL(
        post.cover ||
        'https://assets.ashwaracing.org/images/favicon/header.png'
      );

    document.title = title;

    const descriptionMeta =
      document.querySelector('meta[name="description"]');

    if (descriptionMeta) {
      descriptionMeta.content = description;
    }

    const canonical =
      document.querySelector('link[rel="canonical"]');

    if (canonical) {
      canonical.href = url;
    }

    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', image);
    setMeta('property', 'og:type', 'article');

    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', image);
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

    return new Intl.DateTimeFormat(
      'en-IN',
      options
    ).format(parsed);
  };

  const getSlug = () =>
    new URLSearchParams(window.location.search).get('post');

  const postURL = slug =>
    `blog-post.html?post=${encodeURIComponent(slug)}`;

  const renderBlock = block => {
    if (!block || !block.type) {
      return '';
    }

    switch (block.type) {

      case 'paragraph':
        return `
          <p>
            ${escapeHTML(block.text)}
          </p>
        `;

      case 'heading': {
        const level = Math.min(
          Math.max(Number(block.level) || 2, 2),
          4
        );

        return `
          <h${level}>
            ${escapeHTML(block.text)}
          </h${level}>
        `;
      }

      case 'image':
        if (!block.src) {
          return '';
        }

        return `
          <figure>
            <img
              src="${escapeHTML(block.src)}"
              alt="${escapeHTML(block.alt || '')}"
              loading="lazy"
              decoding="async">
            ${
              block.caption
                ? `
                  <figcaption>
                    ${escapeHTML(block.caption)}
                  </figcaption>
                `
                : ''
            }
          </figure>
        `;

      case 'quote':
        return `
          <blockquote>
            ${escapeHTML(block.text)}
          </blockquote>
        `;

      case 'list':
        if (
          !Array.isArray(block.items) ||
          !block.items.length
        ) {
          return '';
        }

        return `
          <ul>
            ${block.items
              .map(
                item => `
                  <li>
                    ${escapeHTML(item)}
                  </li>
                `
              )
              .join('')}
          </ul>
        `;

      default:
        console.warn(
          `Ashwa Blog: unknown block type "${block.type}".`
        );

        return '';
    }
  };

  const setArticleSchema = post => {
    const schemaElement =
      document.getElementById('article-schema');

    if (!schemaElement) {
      return;
    }

    const articleURL =
      `${window.location.origin}/blog-post.html?post=${
        encodeURIComponent(post.slug)
      }`;

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt || '',
      url: articleURL,

      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': articleURL
      },

      publisher: {
        '@type': 'Organization',
        name: 'Ashwa Racing',
        url: 'https://ashwaracing.org/'
      }
    };

    const image = getAbsoluteURL(post.cover);

    if (image) {
      schema.image = [image];
    }

    if (
      /^\d{4}-\d{2}-\d{2}$/.test(
        String(post.date || '')
      )
    ) {
      schema.datePublished = post.date;
    }

    if (
      /^\d{4}-\d{2}-\d{2}$/.test(
        String(post.updated || '')
      )
    ) {
      schema.dateModified = post.updated;
    } else if (schema.datePublished) {
      schema.dateModified = schema.datePublished;
    }

    schema.author = {
      '@type': 'Organization',
      name: post.author || 'Ashwa Racing'
    };

    schemaElement.textContent =
      JSON.stringify(schema);
  };

  const renderNavigation = (post, allPosts) => {
    const index = allPosts.findIndex(
      item => item.slug === post.slug
    );

    const newer =
      index > 0
        ? allPosts[index - 1]
        : null;

    const older =
      index < allPosts.length - 1
        ? allPosts[index + 1]
        : null;

    navigationEl.innerHTML = `
      ${
        older
          ? `
            <a
              class="blog-post-nav-link previous"
              href="${postURL(older.slug)}">

              <span class="blog-post-nav-direction">
                ← Older Article
              </span>

              <span class="blog-post-nav-title">
                ${escapeHTML(older.title)}
              </span>

            </a>
          `
          : '<span></span>'
      }

      ${
        newer
          ? `
            <a
              class="blog-post-nav-link next"
              href="${postURL(newer.slug)}">

              <span class="blog-post-nav-direction">
                Newer Article →
              </span>

              <span class="blog-post-nav-title">
                ${escapeHTML(newer.title)}
              </span>

            </a>
          `
          : '<span></span>'
      }
    `;
  };

  const renderRelated = (post, allPosts) => {
    const related = allPosts
      .filter(
        item =>
          item.slug !== post.slug &&
          item.category &&
          item.category === post.category
      )
      .slice(0, 3);

    if (!related.length) {
      relatedEl.innerHTML = '';
      return;
    }

    relatedEl.innerHTML = `
      <h2 class="blog-related-heading">
        Related <em>Articles</em>
      </h2>

      <div class="blog-related-grid">
        ${related
          .map(
            item => `
              <a
                class="blog-related-card"
                href="${postURL(item.slug)}">

                <img
                  src="${escapeHTML(item.cover)}"
                  alt="${escapeHTML(
                    item.coverAlt || item.title
                  )}"
                  loading="lazy"
                  decoding="async">

                <div class="blog-related-card-body">
                  <h3>
                    ${escapeHTML(item.title)}
                  </h3>
                </div>

              </a>
            `
          )
          .join('')}
      </div>
    `;
  };

  const renderPost = (post, allPosts) => {
    setArticleMetadata(post);
    setArticleSchema(post);

    metaEl.innerHTML = `
      ${
        post.category
          ? `
            <span class="category">
              ${escapeHTML(post.category)}
            </span>

            <span aria-hidden="true">·</span>
          `
          : ''
      }

      <span>
        ${escapeHTML(formatDate(post.date))}
      </span>

      ${
        post.author
          ? `
            <span aria-hidden="true">·</span>

            <span>
              ${escapeHTML(post.author)}
            </span>
          `
          : ''
      }

      ${
        post.readTime
          ? `
            <span aria-hidden="true">·</span>

            <span>
              ${escapeHTML(post.readTime)} min read
            </span>
          `
          : ''
      }
    `;

    titleEl.textContent = post.title;

    excerptEl.textContent =
      post.excerpt || '';

    if (post.cover) {
      coverEl.innerHTML = `
        <img
          src="${escapeHTML(post.cover)}"
          alt="${escapeHTML(
            post.coverAlt || post.title
          )}"
          fetchpriority="high"
          decoding="async">
      `;
    } else {
      coverEl.innerHTML = '';
    }

    bodyEl.innerHTML =
      Array.isArray(post.content) &&
      post.content.length
        ? post.content
            .map(renderBlock)
            .join('')
        : `
          <p>
            This article has no content yet.
          </p>
        `;

    renderNavigation(post, allPosts);
    renderRelated(post, allPosts);
  };

  const showError = message => {
    document.title =
      `${message} | Ashwa Racing`;

    metaEl.innerHTML = '';
    titleEl.textContent = message;
    excerptEl.textContent = '';
    coverEl.innerHTML = '';

    bodyEl.innerHTML = `
      <p>
        <a href="blog.html">
          Return to the blog.
        </a>
      </p>
    `;

    navigationEl.innerHTML = '';
    relatedEl.innerHTML = '';
  };

  const loadPost = async () => {
    const slug = getSlug();

    if (!slug) {
      showError('Article not found');
      return;
    }

    try {
      const response = await fetch(DATA_URL, {
        cache: 'no-cache'
      });

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`
        );
      }

      const data = await response.json();

      if (!Array.isArray(data.posts)) {
        throw new Error(
          'Invalid blog data.'
        );
      }

      const posts = data.posts
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

      const post = posts.find(
        item => item.slug === slug
      );

      if (!post) {
        showError('Article not found');
        return;
      }

      renderPost(post, posts);

    } catch (error) {
      console.error(
        'Ashwa Blog: failed to load article.',
        error
      );

      showError(
        'Unable to load article'
      );
    }
  };

  loadPost();

})();