(() => {
  'use strict';

  const IMAGE_ROOT = 'https://assets.ashwaracing.org/images/';
  const BATCH_SIZE = 8;
  const imageFiles = [
    'prototypes/RZ-05-C/1.jpg', 'prototypes/RZ-07-C/12.jpg', 'prototypes/RZ-X8-C/PRE-EVENT/1.jpg',
    'gallery/XX5C.webp', 'gallery/XX6C.webp', 'prototypes/Prototypesbanner.webp',
    'gallery/IMG_3970_Original.webp', 'gallery/Costwin.webp', 'prototypes/RZ-09-C/EVENT/1.jpg',
    'prototypes/RZ-06-C/event/20.jpg', 'prototypes/RZ-06-C/event/21.jpg', 'prototypes/RZ-09-C/POST-EVENT/1.jpg',
    'gallery/DSC_0698.webp', 'prototypes/RZ-05-C/4.jpg', 'prototypes/RZ-07-C/18.jpg',
    'prototypes/RZ-X8-C/PRE-EVENT/6.jpg', 'prototypes/RZ-06-C/postevent/2.jpg', 'prototypes/RZ-XX6-C/postevent/3.png',
    'gallery/Hyperloop.webp', 'team/fullteam/2026-C.png', 'team/fullteam/2025-C.png', 'team/fullteam/2021-H.png'
  ];

  const titleFromPath = path => {
    const name = decodeURIComponent(path.split('/').pop() || 'Ashwa Racing').replace(/\.[^.]+$/, '');
    return name.replace(/[_-]+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
  };
  const fallbackPhotos = imageFiles.map(path => ({ src: `${IMAGE_ROOT}${path}`, title: titleFromPath(path) }));
  const section = document.querySelector('.gallery-section');
  const lightbox = document.getElementById('lightbox');
  const lbImg = document.getElementById('lbImg');
  const lbTitle = document.getElementById('lbTitle');
  const lbDesc = document.getElementById('lbDesc');
  const lbCounter = document.getElementById('lbCounter');
  if (!section) return;

  let catalog = [...fallbackPhotos];
  let shuffled = [];
  let cursor = 0;
  let streamPhotos = [];
  let activePhotoIndex = 0;
  const failedSources = new Set();
  let loadMore;
  let sentinelObserver = null;
  let loadingBatch = false;
  let manifestDiscoveryStarted = false;

  const shuffle = values => {
    const result = [...values];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };

  const discoverFromSiteManifests = async () => {
    const manifestPaths = ['assets/data/projects.json', 'assets/data/team.json', 'assets/data/sponsors.json'];
    const discovered = [];
    const addValue = value => {
      if (typeof value === 'string') {
        let url;
        const transformed = value.match(/^https:\/\/assets\.ashwaracing\.org\/cdn-cgi\/image\/[^/]+\/(images\/.*)$/i);
        if (transformed) url = new URL(`${IMAGE_ROOT}${transformed[1].slice('images/'.length)}`);
        else if (/^assets\/images\//i.test(value)) url = new URL(value.slice('assets/images/'.length), IMAGE_ROOT);
        else if (/^\/?images\//i.test(value)) url = new URL(value.replace(/^\/?images\//i, ''), IMAGE_ROOT);
        else {
          try { url = new URL(value); } catch (error) { return; }
          if (url.origin !== 'https://assets.ashwaracing.org') return;
          if (url.pathname.startsWith('/cdn-cgi/image/')) {
            const match = url.pathname.match(/^\/cdn-cgi\/image\/[^/]+\/(images\/.*)$/i);
            if (match) url = new URL(`${IMAGE_ROOT}${match[1].slice('images/'.length)}`);
          }
        }
        if (url && url.origin === 'https://assets.ashwaracing.org' && url.pathname.startsWith('/images/') && /\.(?:avif|gif|jpe?g|png|webp)$/i.test(url.pathname)) {
          url.search = '';
          discovered.push({ src: url.href, title: titleFromPath(url.pathname) });
        }
      } else if (Array.isArray(value)) {
        value.forEach(addValue);
      } else if (value && typeof value === 'object') {
        Object.values(value).forEach(addValue);
      }
    };
    await Promise.all(manifestPaths.map(async path => {
      try {
        const response = await fetch(path, { cache: 'force-cache' });
        if (response.ok) addValue(await response.json());
      } catch (error) { /* The hand-maintained image list remains a fallback. */ }
    }));
    return discovered;
  };

  const thumbnailSource = photo => {
    const width = window.matchMedia('(max-width: 620px)').matches ? 640 : 1000;
    const quality = width === 640 ? 78 : 80;
    return photo.src.replace(
      'https://assets.ashwaracing.org/images/',
      `https://assets.ashwaracing.org/cdn-cgi/image/width=${width},format=auto,quality=${quality}/images/`
    );
  };

  const getPhotoDimensions = photo => new Promise(resolve => {
    const probe = new Image();
    probe.decoding = 'async';
    let settled = false;
    const finish = image => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ width: image ? image.naturalWidth || 4 : 4, height: image ? image.naturalHeight || 3 : 3, image, valid: Boolean(image && image.naturalWidth && image.naturalHeight) });
    };
    const timer = setTimeout(() => {
      probe.removeAttribute('src');
      finish(null);
    }, 8000);
    probe.onload = () => finish(probe);
    probe.onerror = () => {
      if (probe.src !== photo.src) {
        probe.onload = () => finish(probe);
        probe.onerror = () => finish(null);
        probe.src = photo.src;
      } else {
        finish(null);
      }
    };
    probe.src = thumbnailSource(photo);
  });

  const createPlacard = (photo, index, dimensions) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'gallery-item is-placard';
    card.setAttribute('aria-label', `View photo: ${photo.title}`);
    card.dataset.photoIndex = String(index);

    const image = dimensions.image || document.createElement('img');
    image.width = dimensions.width;
    image.height = dimensions.height;
    if (!dimensions.image) image.src = thumbnailSource(photo);
    image.alt = photo.title;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.addEventListener('error', () => {
      card.remove();
      layoutMasonry();
    }, { once: true });

    card.append(image);
    card.addEventListener('click', () => openLightbox(index));
    return card;
  };

  const startNewCycle = () => {
    shuffled = shuffle(catalog);
    cursor = 0;
  };

  const layoutMasonry = () => {
    const grid = section.querySelector('.gallery-stream');
    if (!grid) return;
    const width = grid.clientWidth;
    const columns = width <= 380 ? 1 : width <= 620 ? 2 : width <= 980 ? 3 : 4;
    const gap = Number.parseFloat(getComputedStyle(grid).columnGap) || 14;
    const rowHeight = Number.parseFloat(getComputedStyle(grid).gridAutoRows) || 8;
    const columnWidth = (width - gap * (columns - 1)) / columns;
    grid.querySelectorAll('.gallery-item.is-placard').forEach(card => {
      const image = card.querySelector('img');
      const imageWidth = Number(image && image.getAttribute('width')) || 4;
      const imageHeight = Number(image && image.getAttribute('height')) || 3;
      const ratio = imageWidth / imageHeight;
      const columnSpan = columns > 1 && (ratio < 0.62 || ratio > 2.15) ? 2 : 1;
      const cardWidth = columnWidth * columnSpan + gap * (columnSpan - 1);
      const cardHeight = cardWidth / ratio + 2;
      const rowSpan = Math.max(1, Math.ceil((cardHeight + gap) / (rowHeight + gap)));
      card.style.gridColumnEnd = `span ${columnSpan}`;
      card.style.gridRowEnd = `span ${rowSpan}`;
    });
  };

  loadMore = async () => {
    if (loadingBatch) return;
    loadingBatch = true;
    const grid = section.querySelector('.gallery-stream');
    const sentinel = section.querySelector('.gallery-load-sentinel');
    grid?.setAttribute('aria-busy', 'true');
    sentinel?.classList.add('is-loading');
    const next = [];
    const selected = new Set();
    let attempts = 0;
    const maxAttempts = Math.max(BATCH_SIZE, catalog.length * 2);
    while (next.length < BATCH_SIZE && attempts < maxAttempts) {
      if (!shuffled.length || cursor >= shuffled.length) startNewCycle();
      const photo = shuffled[cursor++];
      attempts++;
      if (!photo || failedSources.has(photo.src) || selected.has(photo.src)) continue;
      selected.add(photo.src);
      next.push(photo);
    }
    if (!next.length) {
      loadingBatch = false;
      grid?.setAttribute('aria-busy', 'false');
      sentinel?.classList.remove('is-loading');
      return;
    }
    const dimensions = await Promise.all(next.map(getPhotoDimensions));
    const fragment = document.createDocumentFragment();
    next.forEach((photo, index) => {
      if (!dimensions[index].valid) {
        failedSources.add(photo.src);
        return;
      }
      const streamIndex = streamPhotos.push(photo) - 1;
      fragment.appendChild(createPlacard(photo, streamIndex, dimensions[index]));
    });
    section.querySelector('.gallery-stream').appendChild(fragment);
    layoutMasonry();
    loadingBatch = false;
    grid?.setAttribute('aria-busy', 'false');
    sentinel?.classList.remove('is-loading');
    if (sentinelObserver && sentinel) {
      sentinelObserver.unobserve(sentinel);
      requestAnimationFrame(() => sentinelObserver.observe(sentinel));
    }
  };

  const renderLightbox = () => {
    if (!streamPhotos.length || !lightbox) return;
    const photo = streamPhotos[(activePhotoIndex + streamPhotos.length) % streamPhotos.length];
    lbImg.src = photo.src;
    lbImg.alt = photo.title;
    lbTitle.textContent = photo.title;
    lbDesc.textContent = 'Ashwa Racing · Visual archive';
    lbCounter.textContent = `${String(activePhotoIndex + 1).padStart(3, '0')} / ${String(streamPhotos.length).padStart(3, '0')}`;
  };

  const openLightbox = index => {
    if (!lightbox) return;
    activePhotoIndex = index;
    renderLightbox();
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    document.getElementById('lbClose').focus();
  };

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  const stepLightbox = direction => {
    activePhotoIndex = (activePhotoIndex + direction + streamPhotos.length) % streamPhotos.length;
    renderLightbox();
  };

  section.innerHTML = '<div class="gallery-stream" aria-label="Ashwa Racing photo archive" aria-busy="false"></div><div class="gallery-load-sentinel" role="status" aria-label="Loading more photos" aria-live="polite"><span class="gallery-load-spinner" aria-hidden="true"></span><span class="gallery-load-label">Loading more photos</span></div>';
  document.getElementById('lbClose')?.addEventListener('click', closeLightbox);
  document.getElementById('lbBackdrop')?.addEventListener('click', closeLightbox);
  document.getElementById('lbPrev')?.addEventListener('click', () => stepLightbox(-1));
  document.getElementById('lbNext')?.addEventListener('click', () => stepLightbox(1));
  document.addEventListener('keydown', event => {
    if (!lightbox || !lightbox.classList.contains('open')) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft') stepLightbox(-1);
    if (event.key === 'ArrowRight') stepLightbox(1);
  });

  loadMore();

  const discoverWhenNeeded = () => {
    if (manifestDiscoveryStarted) return;
    manifestDiscoveryStarted = true;
    discoverFromSiteManifests().then(manifestImages => {
      const discovered = Array.isArray(manifestImages) ? manifestImages : [];
      if (discovered.length) {
        const known = new Set(catalog.map(photo => photo.src));
        discovered.forEach(photo => {
          if (!known.has(photo.src)) {
            known.add(photo.src);
            catalog.push(photo);
          }
        });
        shuffled = [];
      }
    }).catch(error => console.warn('Gallery image manifest unavailable; using the built-in archive.', error));
  };

  if ('IntersectionObserver' in window) {
    sentinelObserver = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        discoverWhenNeeded();
        loadMore();
      }
    }, { rootMargin: '350px 0px' });
    sentinelObserver.observe(section.querySelector('.gallery-load-sentinel'));
  } else {
    window.addEventListener('scroll', () => {
      const sentinel = section.querySelector('.gallery-load-sentinel');
      if (sentinel && sentinel.getBoundingClientRect().top < window.innerHeight + 350) {
        discoverWhenNeeded();
        loadMore();
      }
    }, { passive: true });
  }

  window.addEventListener('resize', () => requestAnimationFrame(layoutMasonry), { passive: true });
})();
