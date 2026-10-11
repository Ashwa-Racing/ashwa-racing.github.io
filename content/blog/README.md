# Publishing a blog post

You can publish from the GitHub website; you do not need to edit JSON or run code.

1. Open the repository on GitHub and go to `content/blog/`.
2. Choose **Add file → Upload files** and upload a `.md` file. You can also choose **Create new file** and paste Markdown into the editor.
3. Give the file a short, lowercase name with hyphens, such as `our-first-test-day.md`.
4. Use the template below, then choose **Commit changes** to the `main` branch.
5. Cloudflare builds and publishes the post automatically. It appears on the blog when the build finishes.

Posts are shown as soon as their Markdown file is committed. To remove a post, delete its `.md` file in this folder and commit that change.

## Copy this template

```markdown
---
title: "A clear title for the article"
date: 2026-10-11
author: "Ashwa Racing"
category: "Team Updates"
excerpt: "A short summary shown on the blog cards and in search results."
cover: "https://assets.ashwaracing.org/images/blog/example.jpg"
cover_alt: "Describe what is visible in the image"
featured: false
---

Write your article here. Separate paragraphs with a blank line.

## Add a section heading

Use normal Markdown: headings (`##`), bullet lists (`- item`), numbered lists (`1. item`), quotes (`> quote`), links (`[text](https://example.com)`), bold (`**text**`), italic (`*text*`), and images (`![Description](https://example.com/image.jpg)`).
```

Required fields are `title`, `date`, `author`, `category`, and `excerpt`. Dates can be `YYYY`, `YYYY-MM`, or `YYYY-MM-DD`. The filename becomes the article link, so keep it unique and use only lowercase letters, numbers, and hyphens. `cover`, `cover_alt`, `featured`, and `read_time` are optional. If omitted, reading time is estimated from the article. Use a publicly accessible image URL for `cover`.

The build checks each article and stops with a clear error if the front matter, filename, date, or article body is invalid. Keep images on their own line. Raw HTML is not supported.
