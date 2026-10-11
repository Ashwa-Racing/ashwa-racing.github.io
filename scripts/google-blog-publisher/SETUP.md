# Google Form blog publisher

The form accepts a Word `.docx` file, converts it to Markdown, uploads its images and a Markdown archive directly to Cloudflare R2, and commits a copy of the Markdown source to `content/blog/`. The GitHub commit triggers the Cloudflare Workers build; `scripts/build_site.py` reads that folder and regenerates `assets/data/blog.json` in the deployed site.

## One-time setup

1. Create a Google Form named **Ashwa Racing Blog Submission**.
2. Add these questions with these exact titles:
   - Short answer, required: `Article title`
   - Date, required: `Publication date`
   - Short answer, required: `Author`
   - Short answer, required: `Category`
   - Paragraph, required: `Short summary`
   - Multiple choice, required, choices **Yes** and **No**: `Feature this article?`
   - File upload, required: `Article file (.docx)`; restrict the accepted type to Microsoft Word and the number of files to one.
   - If the form already has `Cover image URL (optional)` or `Cover image description (optional)`, delete both questions. The publisher now gets the cover from the DOCX.
3. Add a form description or help text for the file upload question:

   > In your DOCX, place the image you want as the article cover first. The first embedded image becomes the blog card and social preview cover, and also appears in the article at its original position. Add alt text to images in Word when possible. Use inline JPG, PNG, GIF, or WebP images; each image must be 10 MB or smaller.

4. In the form settings, collect verified email addresses. File upload requires respondents to sign in to a Google account. Share the responder link with the team; authors do not need GitHub access.
5. Open the form's **Extensions → Apps Script** editor. Replace the starter code with `Code.gs` from this folder.
6. In Apps Script **Project Settings → Script Properties**, add:
   - `GITHUB_TOKEN`: a fine-grained GitHub token with **Contents: Read and write** access to `Ashwa-Racing/ashwa-racing.github.io` only.
   - `R2_ACCOUNT_ID`: the Cloudflare account ID for the account containing the bucket.
   - `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`: S3 credentials from an R2 API token with **Object Read & Write** permission scoped to the blog media bucket.
   - `R2_BUCKET_NAME`: the bucket name whose public custom domain is `assets.ashwaracing.org`.

   Keep these values in Script Properties only. Do not paste credentials into the form, repository, or chat. The GitHub Actions secrets used by `scripts/sync.py` are separate; Apps Script cannot read them automatically.
7. In Apps Script **Services (+)**, add the **Drive API** advanced service (v3).
8. Run `installBlogPublisher` once from the editor and approve the Google permissions. It validates the required Script Properties, enables email collection, and installs the form submission trigger.
9. Submit a test article using an approved account. Confirm its Markdown source appears in `content/blog/`, its images and Markdown archive appear in R2, the Cloudflare build completes, and the deployed blog listing contains the article.

## What authors submit

Authors enter the title, publication date (`YYYY-MM-DD`), author, category, short summary, and whether the article should be featured, then attach one `.docx`. They do not provide a cover URL or cover description: the first embedded image is used as the cover automatically. Image alt text is read from Word's picture description/title when available. The publisher preserves headings, paragraphs, lists, bold, italic, links, and embedded images; table rows become simple bullet rows.

The date and title form the article filename. Submitting the same date and title updates that article. A successful submission sends a confirmation email; conversion, validation, R2, GitHub, or publishing errors send an error email and are recorded in the Apps Script execution log.

## Access and token care

Google Forms file uploads require the submitter to sign in. Only responding accounts whose address ends in `.ashwa@gmail.com` are accepted. Google Forms stores the uploaded file before its submit trigger runs, so the script immediately moves rejected uploads to Drive trash and does not publish them. Keep the responder link within the team. Rotate credentials if the Apps Script project is transferred or the publishing account changes.
