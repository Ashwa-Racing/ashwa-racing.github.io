# Google Form blog publisher

This lets the team submit a Word `.docx` through a Google Form without GitHub access. The form script converts the Word file to Markdown, adds the form metadata, and commits a Markdown article to `content/blog/`. Cloudflare then builds and publishes the site.

## One-time setup

1. Create a Google Form named **Ashwa Racing Blog Submission**.
2. Add these questions with these exact titles:
   - Short answer, required: `Article title`
   - Date, required: `Publication date`
   - Short answer, required: `Author`
   - Short answer, required: `Category`
   - Paragraph, required: `Short summary`
   - Short answer, optional: `Cover image URL (optional)`
   - Short answer, optional: `Cover image description (optional)`
   - Multiple choice, required, choices **Yes** and **No**: `Feature this article?`
   - File upload, required: `Article file (.docx)`; restrict the accepted type to Microsoft Word and the number of files to one.
3. In the form settings, collect verified email addresses. File upload requires respondents to sign in to a Google account. Share the responder link with the team; authors do not need GitHub access.
4. Open the form’s **Extensions → Apps Script** editor. Replace the starter code with `Code.gs` from this folder.
5. In Apps Script **Project Settings → Script Properties**, add:
   - `GITHUB_TOKEN`: a fine-grained GitHub token with **Contents: Read and write** access to `Ashwa-Racing/ashwa-racing.github.io` only. Do not put this token in the repository or form.
6. In Apps Script **Services (+)**, add the **Drive API** advanced service (v3).
7. Run `installBlogPublisher` once from the editor and approve the Google permissions. It enables email collection and installs the form submission trigger.
8. Submit a test article using an approved account. Confirm that a date-prefixed Markdown file appears in `content/blog/`, and that the Cloudflare build completes.

## What authors submit

Authors enter the title, publication date (`YYYY-MM-DD`), author, category, short summary, and optional cover image URL, then attach the `.docx`. The publisher converts it to a temporary Google Doc and reads its paragraphs directly. It preserves headings, paragraphs, lists, bold, italic, and links; table rows become simple bullet rows. Keep the cover image separate and provide a public URL in the cover field; embedded Word images are not included in the article.

The date and title form the article filename. Submitting the same date and title updates that article. A successful submission sends a confirmation email; conversion, validation, or GitHub errors send an error email and are recorded in the Apps Script execution log.

## Access and token care

Google Forms file uploads require the submitter to sign in. Only responding accounts whose address ends in `.ashwa@gmail.com` are accepted. Google Forms stores the uploaded file before its submit trigger runs, so the script immediately moves rejected uploads to Drive trash and does not publish them. Keep the responder link within the team. The GitHub token is stored in Apps Script properties, never in the form or source code. Rotate it if the Apps Script project is transferred or the publishing account changes.
