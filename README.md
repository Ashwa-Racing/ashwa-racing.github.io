<div align="center">

<img src="assets/images/favicon/header.png" alt="Ashwa Racing" width="90" />

# ASHWA RACING — WEBSITE

### वेगः इतः आरभ्यते
*Speed begins here.*

**The official site of RV College of Engineering's Formula Student team.**

[![Live Site](https://img.shields.io/badge/ashwaracing.org-live-e8001d?style=for-the-badge&logo=googlechrome&logoColor=white)](https://ashwaracing.org)
[![Deploy](https://img.shields.io/github/actions/workflow/status/Ashwa-Racing/ashwa-racing.github.io/static.yml?label=pages%20deploy&style=for-the-badge&color=0a0a0a&labelColor=1e1e1e)](https://github.com/Ashwa-Racing/ashwa-racing.github.io/actions)
[![License: MIT](https://img.shields.io/badge/license-MIT-e8001d?style=for-the-badge&labelColor=1e1e1e)](LICENSE)
[![Formula Student](https://img.shields.io/badge/formula%20student-RVCE-e8001d?style=for-the-badge&labelColor=1e1e1e)](https://ashwaracing.org)

</div>

<img src="assets/images/heroimg/hero-desktop.jpg" alt="Ashwa Racing hero" width="100%" />

<br>

Built and broken and rebuilt by whoever on the team has a free evening between builds, exams, and competition prep. No framework, no build step, no `node_modules` — clone it, open `index.html`, and you're looking at the live site. That's the whole point.

<div align="center">

`HTML` · `CSS` · `Vanilla JS` · `GitHub Actions` · `Cloudflare R2`

</div>

---

## Why so plain?

Subsystem leads and recruits rotate through this repo every single year, most having never touched a JS framework in their life. A `.html` file with a matching `.css` and `.js` file is a shape anyone can read in five minutes, edit without breaking the build, and hand off to next year's batch without a training session. We'd rather have a codebase that survives team turnover than one that looks impressive for a semester.

## Getting it running

```bash
git clone https://github.com/Ashwa-Racing/ashwa-racing.github.io.git
cd ashwa-racing.github.io
python -m http.server 8000     # or: npx serve .
```

Opening files straight off disk (`file://`) mostly works, but the header/footer and a couple of other bits load via `fetch()`, which browsers block on `file://`. Any static server fixes it.

---

## What's in here

<details>
<summary><b>Click to expand the full layout</b></summary>

```
ashwa-racing.github.io/
├── index.html, about.html, team.html, alumni.html,
│   subsystem.html, projects.html, sponsors.html, smp.html,
│   recruitment.html, contact.html, gallery.html, newsletters.html
│
├── aero.html, brakes-logistics.html, chassis-workshop.html,
│   drivetrain-hr.html, electrical-testing.html, engine.html,
│   finance.html, it.html, suspension-admin.html
│                                   # one page per subsystem/division
│
├── components/
│   ├── header.html                # shared nav, injected via fetch()
│   └── footer.html
│
├── assets/
│   ├── css/
│   │   ├── components/            # header.css, footer.css
│   │   └── pages/                 # one stylesheet per page
│   ├── js/
│   │   ├── components/            # header.js — injects header.html, nav state
│   │   └── pages/                 # one script per page
│   ├── images/, videos/, icons/, pdfs/
│
├── scripts/
│   ├── sync.py                    # nightly team-roster sync
│   ├── upload_to_r2.py            # bulk-uploads media to Cloudflare R2
│   └── audit.py                   # link/SEO/alt-text auditor → audit_report.md
│
├── .github/workflows/
│   ├── static.yml                 # deploy to GitHub Pages on push to main
│   └── sync.yml                   # runs sync.py nightly
│
├── CNAME, robots.txt, sitemap.xml
└── CODE_OF_CONDUCT.md, LICENSE
```

</details>

Subsystem pages all share one template — hero, technical overview, roster filtered to that division, related content. Copy the nearest existing one when adding a new division; don't start from a blank file.

<div align="center">
<img src="assets/images/gallery/XX6C.webp" width="32%" alt="Ashwa Racing car" />
<img src="assets/images/gallery/Costwin.webp" width="32%" alt="Ashwa Racing at competition" />
<img src="assets/images/gallery/XX5C.webp" width="32%" alt="Ashwa Racing car" />
</div>

---

## How the pieces fit together

**Shared header and footer.** `header.html` / `footer.html` live once, in `components/`, and every page pulls them in at runtime:

```js
fetch('/components/header.html')
  .then(r => r.text())
  .then(html => document.getElementById('main-header').innerHTML = html);
```

Change the nav once, it updates on every page. The tradeoff is that `fetch()` needs a server, not `file://`.

**Design tokens.** Colors, fonts, spacing, and easing live as CSS custom properties (`--red`, `--font-display`, `--pad`, …), currently declared in `assets/css/components/header.css` and re-declared in most per-page stylesheets. That's copy-paste, not a single source of truth — pulling it into one shared stylesheet is on the list, not done yet. Match `header.css` if you're touching brand color or spacing.

**Team roster & alumni — automated, not hand-edited.** `team.js` and `alumni-data.js` are regenerated every night by `scripts/sync.py`:

- pulls responses from a Google Form via its Sheet's CSV export,
- merges into the existing arrays by name — new fields win, manual-only fields survive,
- pulls profile photos from a linked Drive folder,
- routes people into `team.js` vs `alumni-data.js` by year (current + next two = active; the rest, alumni),
- commits the result back to `main` automatically (`.github/workflows/sync.yml`).

<div align="center">
<img src="assets/images/team/fullteam/2026-C.png" width="70%" alt="Full team photo" />
</div>

A few flags (easter eggs, manual overrides) are preserved across every sync — see `MANUAL_FLAGS` at the top of the script. Adding someone outside the form flow? Edit the arrays directly; the next sync merges cleanly around it.

**Media hosting.** Car photography, team photos, and spotlight videos add up fast, and we've bloated `git` history with large media before. Everything now serves from Cloudflare R2 at `assets.ashwaracing.org`, with `scripts/upload_to_r2.py` as the bulk-upload tool. The repo's own `assets/images/` and `assets/videos/` still carry a good chunk of source material while migration finishes — expect that folder to shrink, not grow, over time.

A couple of the spotlight videos, straight from the site:

<div align="center">

[![Watch: EV Spotlight](https://img.shields.io/badge/▶-EV%20Spotlight-e8001d?style=for-the-badge&labelColor=0a0a0a)](assets/videos/ev_spotlight.mp4)
[![Watch: CV Spotlight](https://img.shields.io/badge/▶-CV%20Spotlight-e8001d?style=for-the-badge&labelColor=0a0a0a)](assets/videos/cv_spotlight.mp4)
[![Watch: Hero Reel](https://img.shields.io/badge/▶-Hero%20Reel-e8001d?style=for-the-badge&labelColor=0a0a0a)](assets/videos/hero_vid.mp4)

</div>

**Newsletters.** `newsletters.html` renders our archive going back to 2016 — literally a filename list in `assets/js/pages/newsletters.js` pointing at PDFs in `assets/pdfs/newsletters/`, with a matching cover image per issue in `assets/images/newsletters/<year>/`. To add one: drop the PDF, drop the cover, add the filename to the array, push.

<div align="center">
<img src="assets/images/newsletters/2026/2026-06.png" width="18%" alt="Newsletter cover" />
<img src="assets/images/newsletters/2026/2026-03.png" width="18%" alt="Newsletter cover" />
<img src="assets/images/newsletters/2026/2026-02.png" width="18%" alt="Newsletter cover" />
<img src="assets/images/newsletters/2025/2025-12.png" width="18%" alt="Newsletter cover" />
<img src="assets/images/newsletters/2025/2025-10.png" width="18%" alt="Newsletter cover" />
</div>

**Site audit.** `scripts/audit.py` crawls every page checking for broken internal/external links, missing `<title>`/meta description/viewport, and missing `alt` text, then writes `audit_report.md`. Run `python scripts/audit.py .` before a big push if pages or assets have moved around.

---

## Deployment

Every push to `main` deploys to GitHub Pages automatically via `.github/workflows/static.yml` — no build step, the repo root is served as-is. Custom domain is set in `CNAME`.

## Contributing

Most of us are picking this up between classes and car builds, so:

- Match the existing pattern for the page you're editing before inventing a new one.
- New pages get a matching `assets/css/pages/*.css` and, if there's interactivity, `assets/js/pages/*.js` — same base filename as the HTML.
- Run `scripts/audit.py` before opening a PR if you've touched links, images, or added a page.
- New team member? Use the sync form — don't hand-edit `team.js` unless there's a good reason to.

Questions, broken things, ideas — open an issue, or ping IT/Web in the team group.

<div align="center">

---

**MIT Licensed** · Built by the students of **Ashwa Racing**, RVCE

</div>
