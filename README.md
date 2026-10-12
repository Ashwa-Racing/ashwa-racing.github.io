# Ashwa Racing Website

The official website for Ashwa Racing, the Formula Student team of RV College of Engineering in Bengaluru. The site shares the team's cars, engineering work, members, sponsors, news, and ways to support the programme.

[![Live website](https://img.shields.io/badge/website-ashwaracing.org-e8001d?style=flat-square)](https://ashwaracing.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-e8001d?style=flat-square)](LICENSE)

**Live site:** [ashwaracing.org](https://ashwaracing.org) · **Repository:** [Ashwa-Racing/ashwa-racing.github.io](https://github.com/Ashwa-Racing/ashwa-racing.github.io) · **Contact:** [ashwa.smp@gmail.com](mailto:ashwa.smp@gmail.com)

## About the site

This is a static website built with HTML, CSS, and vanilla JavaScript. It has no frontend framework or runtime application server. Shared navigation and footer components are loaded by JavaScript, while the build script generates crawlable pages for blog posts and newsletters.

The site is published to [Cloudflare Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/). Most large photos and videos are served from the team's Cloudflare R2 asset domain.

## Run locally

You need Python 3.10 or newer. Clone the repository, build the site, and start a local server:

```bash
git clone https://github.com/Ashwa-Racing/ashwa-racing.github.io.git
cd ashwa-racing.github.io
python scripts/build_site.py
python -m http.server 8000 --directory dist
```

Then open [http://localhost:8000](http://localhost:8000). Serve the generated `dist/` directory instead of opening HTML files directly, because the site loads shared components and data with `fetch()`.

The build recreates `dist/` from the source pages, assets, and content. Do not edit generated files in `dist/`; make changes in the source files and rebuild.

## Project structure

```text
.
├── assets/
│   ├── css/                 Shared styles and page styles
│   ├── data/                Team, sponsor, project, newsletter, and blog data
│   ├── images/              Site images
│   ├── js/                  Shared scripts and page interactions
│   └── videos/              Local video assets
├── components/              Shared header and footer markup
├── content/blog/             Markdown source for blog articles
├── scripts/
│   ├── build_site.py         Builds the deployable static site
│   ├── sync.py               Syncs team data from the team's Google Sheet
│   ├── google-blog-publisher/ Google Form to blog publishing workflow
│   └── crowdfunding-tracker/ Bank/UPI contribution tracking setup
├── .github/workflows/        Scheduled team data sync
├── wrangler.jsonc            Cloudflare Workers configuration
└── *.html                    Source pages
```

## Build and deployment

`scripts/build_site.py` copies the source pages and site assets into `dist/`, builds the blog index and individual blog pages from `content/blog/*.md`, creates shareable pages for newsletter issues listed in `assets/data/newsletters.json`, and writes the generated sitemap.

Cloudflare Workers Builds deploys the `main` branch with:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Build command | `python3 scripts/build_site.py` |
| Deploy command | `npx wrangler deploy` |

To deploy locally, install Node.js and npm, build first, authenticate Wrangler with the team's Cloudflare account, then run `npx wrangler deploy`.

## Updating site content

- **Blog:** Add a Markdown article under `content/blog/`. See the [blog authoring guide](content/blog/README.md) for front matter and supported formatting. For team members who submit through Google Forms, see the [blog publisher setup](scripts/google-blog-publisher/SETUP.md).
- **Newsletters:** Add the issue PDF and cover image to the team's asset host, then add the PDF filename to `assets/data/newsletters.json`. The build generates its shareable page and sitemap entry.
- **Team roster:** The scheduled workflow syncs roster data from the team's Google Sheet. To maintain it, configure the repository's GitHub Actions secrets: `SHEET_CSV_URL`, `DRIVE_ROOT_FOLDER_ID`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_BUCKET_NAME`. The workflow can also be started manually from GitHub Actions.
- **Crowdfunding:** The bank/UPI contribution tracker is not provisioned automatically. Follow the [tracker setup guide](scripts/crowdfunding-tracker/SETUP.md) to create the private ledger and public form under the team's Google account.
- **Shared navigation and footer:** Edit `components/header.html` or `components/footer.html`. The corresponding shared scripts and styles are in `assets/js/components/` and `assets/css/components/`.
- **Page layout and behavior:** Edit the root HTML page and its matching files under `assets/css/pages/` and `assets/js/pages/`.

## Contributing

1. Create a branch for your change.
2. Make changes in the source files, not `dist/`.
3. Build locally with `python scripts/build_site.py` and review the generated page in a local server.
4. Open a pull request with a short summary and screenshots for visual changes.

For questions or to report a problem, [open a GitHub issue](https://github.com/Ashwa-Racing/ashwa-racing.github.io/issues) or email [ashwa.smp@gmail.com](mailto:ashwa.smp@gmail.com).

Please follow the project's [Code of Conduct](CODE_OF_CONDUCT.md).

## License

This project is licensed under the [MIT License](LICENSE).
