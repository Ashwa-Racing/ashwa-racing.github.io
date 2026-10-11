(() => {
  'use strict';

  const assetHost = 'https://assets.ashwaracing.org';
  const pdfBase = `${assetHost}/pdfs/newsletters/`;
  const imageBase = `${assetHost}/images/newsletters/`;
  const files = [
    '2026-06-general.pdf', '2026-03-general.pdf', '2026-02-general.pdf', '2026-01-general.pdf',
    '2025-12-general.pdf', '2025-10-general.pdf', '2025-07-general.pdf', '2025-06-general.pdf',
    '2025-05-general.pdf', '2025-04-general.pdf', '2025-03-general.pdf', '2025-02-general.pdf',
    '2023-03-general.pdf', '2023-02-general.pdf', '2019-11-general.pdf', '2019-09-general.pdf',
    '2019-08-general.pdf', '2019-03-general.pdf', '2018-12-general.pdf', '2018-11-general.pdf',
    '2018-10-general.pdf', '2018-09-general.pdf', '2018-08-general.pdf', '2018-07-general.pdf',
    '2018-06-general.pdf', '2018-05-general.pdf', '2018-03-general.pdf', '2018-02-general.pdf',
    '2017-11-general.pdf', '2017-09-alumni.pdf', '2017-09-general.pdf', '2017-08-alumni.pdf',
    '2017-08-general.pdf', '2017-07-alumni.pdf', '2017-07-general.pdf', '2017-06-general.pdf',
    '2017-05-general.pdf', '2017-04-alumni.pdf', '2017-04-combustion.pdf', '2017-04-hybrid.pdf',
    '2017-02-alumni.pdf', '2017-02-combustion.pdf', '2017-02-hybrid.pdf', '2016-12-combustion.pdf',
    '2016-12-hybrid.pdf', '2016-11-alumni.pdf', '2016-11-combustion.pdf', '2016-11-hybrid.pdf',
    '2016-10-alumni.pdf', '2016-10-combustion.pdf', '2016-10-hybrid.pdf', '2016-09-alumni.pdf',
    '2016-09-combustion.pdf', '2016-09-hybrid.pdf', '2016-07-alumni.pdf', '2016-04-alumni.pdf',
    '2015-12-alumni.pdf', '2015-12-combustion.pdf', '2015-12-hybrid.pdf', '2015-11-alumni.pdf',
    '2015-11-combustion.pdf', '2015-11-hybrid.pdf', '2015-09-alumni.pdf', '2015-09-combustion.pdf',
    '2015-09-hybrid.pdf', '2015-04-hybrid.pdf', '2015-03-hybrid.pdf', '2015-02-hybrid.pdf',
    '2015-01-hybrid.pdf'
  ];
  const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const typeNames = { general: 'General', hybrid: 'Hybrid', combustion: 'Combustion', alumni: 'Alumni' };
  const newsletters = files.map(file => {
    const [year, month, typeFile] = file.split('-');
    const type = typeFile.replace('.pdf', '');
    return { year, month, type, title: `${monthNames[Number(month)]} ${year}`, pdf: `${pdfBase}${year}/${file}`, cover: `${imageBase}${year}/${year}-${month}.png` };
  }).sort((a, b) => `${b.year}${b.month}`.localeCompare(`${a.year}${a.month}`));

  const list = document.getElementById('list');
  const filterBar = document.getElementById('filter-bar');
  const count = document.getElementById('count');
  const empty = document.getElementById('empty');
  if (!list || !filterBar || !count || !empty) return;

  [...new Set(newsletters.map(item => item.year))].sort((a, b) => b.localeCompare(a)).forEach(year => {
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
      const image = document.createElement('div');
      image.className = 'blog-card-image';
      const img = document.createElement('img');
      img.src = first.cover;
      img.alt = `${first.title} newsletter cover`;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.addEventListener('error', () => { image.hidden = true; }, { once: true });
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
        link.href = item.pdf;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = typeNames[item.type] || item.type;
        link.setAttribute('aria-label', `Open ${item.title} ${typeNames[item.type] || item.type} newsletter PDF`);
        link.dataset.edition = String(index + 1).padStart(2, '0');
        links.appendChild(link);
      });
      body.append(kicker, heading, links);
      card.append(image, body);
      list.appendChild(card);
      requestAnimationFrame(() => card.classList.add('visible'));
    });
  };

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
})();
