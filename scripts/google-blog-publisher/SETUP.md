# Combined team, blog, and newsletter submission form

The Apps Script in `Code.gs` handles one Google Form with two routes: team data or blog/newsletter. Team submissions are appended to the roster spreadsheet's `Parsed Team Data` tab in the exact schema consumed by `scripts/sync.py`. Blog posts are converted from DOCX to Markdown and committed to `content/blog/`. If a newsletter PDF is attached, it is uploaded to R2, its cover is generated from Google Drive's PDF preview, and the issue filename is added to `assets/data/newsletters.json`.

## Build the Google Form

Create a new form, for example **Ashwa Racing Website Submission**. Use sections and branching so the first question routes respondents to the appropriate section. Google Forms file upload questions must be added in the Forms editor, not Apps Script.

### First section

- Required multiple choice: `What would you like to submit?`
- Choices, spelled exactly: `Team data` and `Blog / Newsletter`.
- Route each choice to the matching section below.

### Team data section

Add these questions. Keep the titles exact because the Apps Script reads them by title:

- Required short answer: `Full Name (In normal, e.g. : Ashwa Racing )`
- Required short answer: `Ashwa Email ID (xxx.ashwa@gmail.com)`
- Required short answer or dropdown: `Select Batch (Passing Year)`
- Required checkboxes: `Select your team role(s)`; choices: `Member / Part of team`, `Team Captain`, `Chief Engineer`, `Project Manager`.
- Optional multiple-choice grid: `Select Prototype(s) you worked on per Role (leave blank if N/A)`. Rows: `Combustion`, `Hybrid`, `Electric`, `Hyperloop`, `Driverless`. Columns: `Member / Part of team`, `Team Captain`, `Chief Engineer`, `Project Manager`. Leave rows unanswered when not applicable.
- Optional multiple-choice grid: `Select your Role in each Subsystem (leave blank if N/A)`. Rows: `Chassis & Workshop Management`, `Suspension & Admin`, `Drivetrain & Human Resources`, `Brakes & Logistics`, `Engine`, `Electrical & Testing`, `Sponsorship, Marketing & Public Relations`, `Finance`, `IT`, `Aero`. Columns: `Member`, `Subsystem Lead`. Leave rows unanswered when not applicable.
- Required paragraph: `Please list your contributions in a paragraph. If None, kindly write NA.`
- Required file upload: `Kindly upload your pictures here`; restrict to one image.
- Optional short answer: `LinkedIN Account URL`
- Optional short answer: `GitHUB Account URL`

Set this section to submit the form when complete. The script makes the uploaded photo viewable to anyone with its link, then the existing roster sync copies it to the public team asset host. The Ashwa email field must end in `.ashwa@gmail.com`; the Google account used to upload may be a different account.

### Blog / Newsletter section

Use the current blog form questions and exact titles:

- Required short answer: `Article title`
- Required Google Forms **Date** question: `Publication date`. Respondents use the normal date picker; the Apps Script converts its date response to `YYYY-MM-DD` for the blog metadata.
- Required short answer: `Author`
- Required dropdown: `Subsystem`; choices: `Aero`, `Brakes & Logistics`, `Chassis & Workshop Management`, `Drivetrain & Human Resources`, `Electrical & Testing`, `Engine`, `Finance`, `IT`, `Sponsorship, Marketing & Public Relations`, `Suspension & Admin`.
- Required paragraph: `Short summary`
- Required multiple choice: `Feature this article?`; choices `Yes` and `No`.
- Required file upload: `Article file (.docx)`; one Microsoft Word file, maximum 10 MB.
- Optional file upload: `Newsletter PDF`; one PDF. Attach it when the article is the companion blog post for a newsletter; leave it blank for a regular blog article.
- Optional short answer: `Newsletter year` (four digits, for example `2026`). Required by the publisher when a newsletter PDF is attached.
- Optional short answer: `Newsletter month` (two digits, `01` through `12`). Required by the publisher when a newsletter PDF is attached.
- Optional dropdown: `Newsletter type`; choices `general`, `hybrid`, `combustion`, `alumni`. Required by the publisher when a newsletter PDF is attached.

Help text for the DOCX upload:

> In your DOCX, place the image you want as the article cover first. The first embedded image becomes the blog card and social preview cover, and also appears in the article at its original position. Add alt text to images in Word when possible. Use inline JPG, PNG, GIF, or WebP images; each image must be 10 MB or smaller.

When a PDF is attached, the Apps Script fetches its Google Drive preview thumbnail and stores it as the PNG cover at `{year}-{month}.png`. The issue filename is `{year}-{month}-{type}.pdf`. If multiple newsletter types share a month, the workflow uses the same month cover image, consistent with the archive today. No separate cover image upload is needed.

## Configure the roster spreadsheet

Link the form to a private Google spreadsheet and set `TEAM_SHEET_ID` to its ID. Run `installBlogPublisher`; it creates a `Parsed Team Data` tab with the header row expected by `scripts/sync.py`. If you already created that tab, its headers must match:

```text
Name | Year | Roles | Subsystems | Prototype Roles | Experience | LinkedIn | GitHub | Email | Testimony | Current Job | Photo File ID
```

Do not use the combined Form's raw `Form Responses` tab as `TEAM_DATA_CSV_URL`; keep the roster sync's CSV URL pointed to the normalized `Parsed Team Data` tab. After installation creates the tab, publish that tab as CSV and update the `TEAM_DATA_CSV_URL` GitHub Actions secret. The form writes raw responses to a separate tab in the same spreadsheet.

## Install the publisher

1. In the new Form, open **Extensions → Apps Script** and replace the starter code with `Code.gs` from this folder.
2. In **Project Settings → Script Properties**, add:
   - `GITHUB_CONTENTS_TOKEN`: fine-grained token with **Contents: Read and write** access to `Ashwa-Racing/ashwa-racing.github.io` only.
   - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_BUCKET_NAME`: R2 credentials for the bucket whose public domain is `assets.ashwaracing.org`.
   - `TEAM_SHEET_ID`: roster spreadsheet ID described above.
3. In **Services (+)**, add the **Drive API** advanced service (v3).
4. Run `installBlogPublisher` once and approve the requested permissions. It installs the submission trigger and enables email collection.
5. Verify the combined form's response sheet is private and the roster CSV remains published only as required for the existing sync.

Google Forms file uploads require respondents to sign in. Blog submissions are accepted only from accounts ending in `.ashwa@gmail.com`; team submissions validate the Ashwa email entered in the form. Rejected blog uploads are moved to Drive trash. Team photos become public by link because the site publishes them. Keep the responder link within the team and keep credentials in Script Properties only.

The submitted `Subsystem` value is written into the site's existing blog metadata field so current blog cards and filters continue to work.

## Check each route before sharing

- Team route: confirm a submission adds one row to `Parsed Team Data`, then run the existing team sync and verify roster/photo updates.
- Blog route: confirm the Markdown source is committed under `content/blog/`, article images and archive Markdown reach R2, and the Cloudflare build publishes the article.
- Newsletter submission: attach a newsletter PDF and confirm the blog post is published, the PDF and generated PNG cover reach their newsletter R2 folders, and the filename is added to `assets/data/newsletters.json`; rebuild and confirm the issue appears in the archive.

The blog and newsletter publishing steps are sequential but not transactional: if newsletter upload or archive update fails after the article commit, the article may publish while the submission reports an error. Correct the issue and resubmit; the article path updates by date and title, and newsletter filenames are not duplicated in the archive.
