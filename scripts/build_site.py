"""Assemble the static assets published by the Cloudflare Worker."""

from pathlib import Path
import json
import html
import re
import shutil
from datetime import datetime


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "dist"
BLOG_SOURCE = ROOT / "content" / "blog"
BLOG_OUTPUT = OUTPUT / "assets" / "data" / "blog.json"
SITE_DIRECTORIES = ("assets", "components")
ROOT_FILES = ("robots.txt", "sitemap.xml", "_headers", "_redirects", "_routes.json")
SITE_URL = "https://ashwaracing.org"
NEWSLETTER_SOURCE = ROOT / "assets" / "data" / "newsletters.json"


def _parse_front_matter(source: str, path: Path) -> tuple[dict, str]:
    if not source.startswith("---\n"):
        raise ValueError(f"{path}: start the file with YAML front matter (---).")
    _, front_matter, body = source.split("---", 2)
    fields = {}
    for line_number, line in enumerate(front_matter.strip().splitlines(), start=2):
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if ":" not in line:
            raise ValueError(f"{path}:{line_number}: expected a key: value field.")
        key, value = line.split(":", 1)
        key = key.strip()
        value = value.strip()
        if not re.fullmatch(r"[a-z_]+", key):
            raise ValueError(f"{path}:{line_number}: invalid field name {key!r}.")
        if value.startswith(('"', "'")):
            if len(value) < 2 or value[-1] != value[0]:
                raise ValueError(f"{path}:{line_number}: unmatched quote.")
            value = value[1:-1]
        elif value.lower() in ("true", "false"):
            value = value.lower() == "true"
        fields[key] = value
    return fields, body.strip()


def _markdown_blocks(markdown: str, path: Path) -> list[dict]:
    blocks = []
    paragraph = []
    list_items = []
    list_ordered = False

    def flush_paragraph():
        if paragraph:
            blocks.append({"type": "paragraph", "text": " ".join(paragraph)})
            paragraph.clear()

    def flush_list():
        nonlocal list_ordered
        if list_items:
            blocks.append({"type": "list", "items": list(list_items), "ordered": list_ordered})
            list_items.clear()
            list_ordered = False

    for line_number, raw_line in enumerate(markdown.splitlines(), start=1):
        line = raw_line.strip()
        if not line:
            flush_paragraph()
            flush_list()
            continue
        if line.startswith("<!--") or line.startswith("<"):
            raise ValueError(f"{path}:{line_number}: raw HTML is not supported; use Markdown instead.")
        heading = re.match(r"^(#{1,4})\s+(.+?)\s*#*\s*$", line)
        image = re.match(r"^!\[([^\]]*)\]\(([^)]+)\)(?:\s+\"([^\"]*)\")?$", line)
        quote = re.match(r"^>\s?(.*)$", line)
        bullet = re.match(r"^(?:[-*+]\s+)(.+)$", line)
        numbered = re.match(r"^\d+[.)]\s+(.+)$", line)
        if heading or image or quote or bullet or numbered:
            flush_paragraph()
            if bullet or numbered:
                ordered = numbered is not None
                if list_items and list_ordered != ordered:
                    flush_list()
                list_ordered = ordered
            else:
                flush_list()
            if heading:
                blocks.append({"type": "heading", "level": len(heading.group(1)), "text": heading.group(2)})
            elif image:
                blocks.append({"type": "image", "alt": image.group(1), "src": image.group(2), "caption": image.group(3) or ""})
            elif quote:
                blocks.append({"type": "quote", "text": quote.group(1)})
            else:
                list_items.append((bullet or numbered).group(1))
            continue
        flush_list()
        paragraph.append(line)
    flush_paragraph()
    flush_list()
    return blocks


def build_blog_data() -> dict:
    if not BLOG_SOURCE.is_dir():
        raise FileNotFoundError(f"Blog Markdown folder not found: {BLOG_SOURCE}")
    posts = []
    seen_slugs = set()
    for path in sorted(
        file for file in BLOG_SOURCE.glob("*.md")
        if file.name.lower() != "readme.md"
    ):
        slug = path.stem.lower()
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug):
            raise ValueError(f"{path}: filename must be a lowercase hyphenated slug.")
        if slug in seen_slugs:
            raise ValueError(f"Duplicate blog slug: {slug}")
        seen_slugs.add(slug)
        fields, body = _parse_front_matter(path.read_text(encoding="utf-8"), path)
        required = ("title", "date", "author", "category", "excerpt")
        missing = [field for field in required if not fields.get(field)]
        if missing:
            raise ValueError(f"{path}: missing required field(s): {', '.join(missing)}")
        if not body:
            raise ValueError(f"{path}: article body is empty.")
        date_text = str(fields["date"])
        if not re.fullmatch(r"\d{4}(?:-\d{2}(?:-\d{2})?)?", date_text):
            raise ValueError(f"{path}: date must be YYYY, YYYY-MM, or YYYY-MM-DD.")
        try:
            datetime.strptime(date_text, "%Y-%m-%d" if len(date_text) == 10 else "%Y-%m" if len(date_text) == 7 else "%Y")
        except ValueError as error:
            raise ValueError(f"{path}: {error}; check the date (YYYY, YYYY-MM, or YYYY-MM-DD).") from error
        blocks = _markdown_blocks(body, path)
        for block in blocks:
            if block["type"] == "image" and not block["src"].startswith(
                ("https://", "http://", "/", "assets/")
            ):
                raise ValueError(f"{path}: image URLs must start with https://, http://, /, or assets/.")
        word_count = len(re.findall(r"\b[\w'-]+\b", body))
        try:
            read_time = int(fields.get("read_time", max(1, (word_count + 199) // 200)))
        except (TypeError, ValueError) as error:
            raise ValueError(f"{path}: read_time must be a positive whole number of minutes.") from error
        if read_time < 1:
            raise ValueError(f"{path}: read_time must be a positive whole number of minutes.")
        post = {
            "slug": slug,
            "title": str(fields["title"]),
            "date": str(fields["date"]),
            "author": str(fields["author"]),
            "category": str(fields["category"]),
            "readTime": read_time,
            "featured": fields.get("featured", False) is True,
            "cover": str(fields.get("cover", "")),
            "coverAlt": str(fields.get("cover_alt", "")),
            "excerpt": str(fields["excerpt"]),
            "content": blocks,
        }
        if fields.get("updated"):
            post["updated"] = str(fields["updated"])
        for key in ("cover",):
            value = post[key]
            if value and not value.startswith(("https://", "http://", "/", "assets/")):
                raise ValueError(f"{path}: {key} must be an https://, http://, /, or assets/ URL.")
        posts.append(post)
    posts.sort(key=lambda post: post["date"], reverse=True)
    return {"posts": posts}


def _set_meta(document: str, attribute: str, name: str, content: str) -> str:
    escaped_name = re.escape(name)
    pattern = re.compile(
        rf'<meta\b(?=[^>]*\b{attribute}=["\']{escaped_name}["\'])[^>]*>',
        re.IGNORECASE,
    )
    match = pattern.search(document)
    escaped_content = html.escape(content, quote=True)
    if match:
        tag = match.group(0)
        if re.search(r'\bcontent=["\']', tag, re.IGNORECASE):
            tag = re.sub(
                r'\bcontent=(["\']).*?\1',
                lambda value: f'content={value.group(1)}{escaped_content}{value.group(1)}',
                tag,
                count=1,
                flags=re.IGNORECASE,
            )
        else:
            tag = tag[:-1] + f' content="{escaped_content}">'
        return document[:match.start()] + tag + document[match.end():]

    tag = f'<meta {attribute}="{html.escape(name, quote=True)}" content="{escaped_content}">'
    return re.sub(r'</head>', f'  {tag}\n</head>', document, count=1, flags=re.IGNORECASE)


def _set_canonical(document: str, url: str) -> str:
    tag = f'<link rel="canonical" href="{html.escape(url, quote=True)}">'
    pattern = re.compile(r'<link\b(?=[^>]*\brel=["\']canonical["\'])[^>]*>', re.IGNORECASE)
    if pattern.search(document):
        return pattern.sub(tag, document, count=1)
    return re.sub(r'</head>', f'  {tag}\n</head>', document, count=1, flags=re.IGNORECASE)


def _add_root_base(document: str) -> str:
    if re.search(r'<base\b', document, re.IGNORECASE):
        return document
    return re.sub(r'<head\b[^>]*>', lambda match: match.group(0) + '\n  <base href="/">', document, count=1, flags=re.IGNORECASE)


def _render_inline(value: str) -> str:
    links = []

    def replace_link(match: re.Match) -> str:
        label = html.escape(match.group(1), quote=False)
        href = html.escape(match.group(2), quote=True)
        links.append(f'<a href="{href}" target="_blank" rel="noopener noreferrer">{label}</a>')
        return f"\u0000{len(links) - 1}\u0000"

    escaped = re.sub(r'\[([^\]]+)\]\((https?://[^\s)]+|/[^\s)]*|#[^\s)]*)\)', replace_link, value)
    escaped = html.escape(escaped, quote=False)
    escaped = re.sub(r'\u0000(\d+)\u0000', lambda match: links[int(match.group(1))], escaped)
    escaped = re.sub(r'`([^`]+)`', r'<code>\1</code>', escaped)
    escaped = re.sub(r'\*\*(.+?)\*\*|__(.+?)__', lambda match: f'<strong>{match.group(1) or match.group(2)}</strong>', escaped)
    escaped = re.sub(r'\*(.+?)\*|_(.+?)_', lambda match: f'<em>{match.group(1) or match.group(2)}</em>', escaped)
    return escaped


def _render_blog_blocks(blocks: list[dict]) -> str:
    rendered = []
    for block in blocks:
        kind = block.get("type")
        if kind == "paragraph":
            rendered.append(f'<p>{_render_inline(block["text"])}</p>')
        elif kind == "heading":
            level = min(max(int(block.get("level", 2)), 2), 4)
            rendered.append(f'<h{level}>{_render_inline(block["text"])}</h{level}>')
        elif kind == "image":
            src = html.escape(block["src"], quote=True)
            alt = html.escape(block.get("alt", ""), quote=True)
            caption = f'<figcaption>{_render_inline(block["caption"])}</figcaption>' if block.get("caption") else ""
            rendered.append(f'<figure><img src="{src}" alt="{alt}" loading="lazy" decoding="async">{caption}</figure>')
        elif kind == "quote":
            rendered.append(f'<blockquote>{_render_inline(block["text"])}</blockquote>')
        elif kind == "list":
            tag = "ol" if block.get("ordered") else "ul"
            items = "".join(f'<li>{_render_inline(item)}</li>' for item in block.get("items", []))
            rendered.append(f'<{tag}>{items}</{tag}>')
    return "\n".join(rendered)


def _iso_date(value: str) -> str:
    if len(value) == 4:
        return f"{value}-01-01"
    if len(value) == 7:
        return f"{value}-01"
    return value


def build_blog_pages(blog_data: dict) -> list[str]:
    template_path = ROOT / "blog-post.html"
    template = _add_root_base(template_path.read_text(encoding="utf-8"))
    output_dir = OUTPUT / "blog"
    output_dir.mkdir(parents=True, exist_ok=True)
    urls = []

    for post in blog_data["posts"]:
        canonical = f"{SITE_URL}/blog/{post['slug']}"
        title = f"{post['title']} | Ashwa Racing"
        description = post["excerpt"]
        image = post["cover"] or "https://assets.ashwaracing.org/images/favicon/header.png"
        page = re.sub(r'<title>.*?</title>', f'<title>{html.escape(title)}</title>', template, count=1, flags=re.IGNORECASE | re.DOTALL)
        page = _set_meta(page, "name", "description", description)
        page = _set_canonical(page, canonical)
        for name, value in (
            ("og:title", title), ("og:description", description), ("og:url", canonical), ("og:image", image),
            ("twitter:title", title), ("twitter:description", description), ("twitter:image", image),
        ):
            page = _set_meta(page, "property" if name.startswith("og:") else "name", name, value)

        meta_html = f'<span class="category">{html.escape(post["category"])}</span> <span aria-hidden="true">·</span> <span>{html.escape(post["date"])}</span> <span aria-hidden="true">·</span> <span>{html.escape(post["author"])}</span>'
        page = re.sub(r'(<div class="blog-post-meta" id="blog-post-meta">).*?(</div>)', lambda match: match.group(1) + meta_html + match.group(2), page, count=1, flags=re.DOTALL)
        page = page.replace('<h1 id="blog-post-title">Loading article...</h1>', f'<h1 id="blog-post-title">{html.escape(post["title"])}</h1>')
        page = page.replace('<p class="blog-post-excerpt" id="blog-post-excerpt"></p>', f'<p class="blog-post-excerpt" id="blog-post-excerpt">{html.escape(description)}</p>')
        cover_html = f'<img src="{html.escape(image, quote=True)}" alt="{html.escape(post["coverAlt"] or post["title"], quote=True)}" loading="eager" decoding="async">' if image else ""
        page = re.sub(r'(<div class="blog-post-cover" id="blog-post-cover">).*?(</div>)', lambda match: match.group(1) + cover_html + match.group(2), page, count=1, flags=re.DOTALL)
        article_html = _render_blog_blocks(post["content"])
        page = re.sub(r'(<div class="blog-post-body" id="blog-post-body">).*?(</div>)', lambda match: match.group(1) + article_html + match.group(2), page, count=1, flags=re.DOTALL)

        schema = {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": post["title"],
            "description": description,
            "url": canonical,
            "mainEntityOfPage": {"@type": "WebPage", "@id": canonical},
            "datePublished": _iso_date(post["date"]),
            "author": {"@type": "Person", "name": post["author"]},
            "publisher": {"@type": "Organization", "name": "Ashwa Racing", "url": f"{SITE_URL}/"},
        }
        if post.get("updated"):
            schema["dateModified"] = _iso_date(post["updated"])
        if image:
            schema["image"] = [image]
        schema_text = json.dumps(schema, ensure_ascii=False).replace("</", "<\\/")
        page = re.sub(r'(<script id="article-schema" type="application/ld\+json">).*?(</script>)', lambda match: match.group(1) + schema_text + match.group(2), page, count=1, flags=re.DOTALL)

        (output_dir / f"{post['slug']}.html").write_text(page, encoding="utf-8")
        urls.append(canonical)

    return urls


def build_newsletter_pages() -> list[str]:
    files = json.loads(NEWSLETTER_SOURCE.read_text(encoding="utf-8"))
    if not isinstance(files, list) or any(not isinstance(filename, str) for filename in files):
        raise ValueError(f"Newsletter data must be a JSON array of filenames: {NEWSLETTER_SOURCE}")
    if not files:
        raise ValueError(f"No newsletter PDFs found in {NEWSLETTER_SOURCE}")

    month_names = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    type_names = {"general": "General", "hybrid": "Hybrid", "combustion": "Combustion", "alumni": "Alumni"}
    template = _add_root_base((ROOT / "newsletters.html").read_text(encoding="utf-8"))
    output_dir = OUTPUT / "newsletters"
    output_dir.mkdir(parents=True, exist_ok=True)
    urls = []

    for filename in files:
        year, month, type_with_extension = filename.split("-")
        issue_type = type_with_extension.removesuffix(".pdf")
        if issue_type not in type_names or not 1 <= int(month) <= 12:
            raise ValueError(f"Invalid newsletter file name: {filename}")
        key = f"{year}-{month}-{issue_type}"
        issue_title = f"{month_names[int(month)]} {year} {type_names[issue_type]} Newsletter"
        canonical = f"{SITE_URL}/newsletters/{key}"
        description = f"Read the Ashwa Racing {month_names[int(month)]} {year} {type_names[issue_type].lower()} newsletter, with Formula Student engineering updates and team news."
        cover = f"https://assets.ashwaracing.org/images/newsletters/{year}/{year}-{month}.png"
        pdf = f"https://assets.ashwaracing.org/pdfs/newsletters/{year}/{filename}"
        page = re.sub(r'<title>.*?</title>', f'<title>{html.escape(issue_title)} | Ashwa Racing</title>', template, count=1, flags=re.IGNORECASE | re.DOTALL)
        page = _set_meta(page, "name", "description", description)
        page = _set_canonical(page, canonical)
        for name, value in (
            ("og:title", f"{issue_title} | Ashwa Racing"), ("og:description", description), ("og:url", canonical), ("og:image", cover),
            ("twitter:title", f"{issue_title} | Ashwa Racing"), ("twitter:description", description), ("twitter:image", cover),
        ):
            page = _set_meta(page, "property" if name.startswith("og:") else "name", name, value)
        landing = (
            '<section class="newsletter-issue-landing" aria-labelledby="newsletter-issue-title">'
            f'<p class="newsletter-issue-landing__eyebrow">ASHWA RACING / NEWSLETTER ARCHIVE</p>'
            f'<h1 id="newsletter-issue-title">{html.escape(issue_title)}</h1>'
            f'<p>{html.escape(description)}</p>'
            f'<a href="{html.escape(pdf, quote=True)}" target="_blank" rel="noopener noreferrer">Open or download this issue</a>'
            f'<img src="{html.escape(cover, quote=True)}" alt="Cover of {html.escape(issue_title, quote=True)}" loading="lazy" decoding="async">'
            '</section>'
        )
        page = re.sub(r'<main\b[^>]*>', lambda main: main.group(0) + landing, page, count=1, flags=re.IGNORECASE)
        schema = {
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            "name": issue_title,
            "description": description,
            "url": canonical,
            "image": cover,
            "encoding": {"@type": "MediaObject", "contentUrl": pdf, "encodingFormat": "application/pdf"},
            "publisher": {"@type": "Organization", "name": "Ashwa Racing", "url": f"{SITE_URL}/"},
        }
        schema_json = json.dumps(schema, ensure_ascii=False).replace("</", "<\\/")
        schema_tag = f'<script type="application/ld+json">{schema_json}</script>'
        page = re.sub(r'</head>', f'  {schema_tag}\n</head>', page, count=1, flags=re.IGNORECASE)
        (output_dir / f"{key}.html").write_text(page, encoding="utf-8")
        urls.append(canonical)

    return urls


def build_sitemap(dynamic_urls: list[str]) -> None:
    source = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
    urls = re.findall(r"<loc>\s*(.*?)\s*</loc>", source, flags=re.IGNORECASE)
    urls = [
        html.unescape(url)
        for url in urls
        if not re.search(r"/blog-post(?:\?|$)|/blog/|/newsletters/", html.unescape(url))
    ]
    all_urls = sorted(set(urls + dynamic_urls))
    entries = "\n".join(f"  <url><loc>{html.escape(url)}</loc></url>" for url in all_urls)
    sitemap = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"{entries}\n"
        "</urlset>\n"
    )
    (OUTPUT / "sitemap.xml").write_text(sitemap, encoding="utf-8")


def build() -> None:
    output = OUTPUT.resolve()
    if output.parent != ROOT.resolve() or output.name != "dist":
        raise RuntimeError(f"Refusing to clean unexpected build directory: {output}")

    if output.exists():
        shutil.rmtree(output)
    output.mkdir()

    for directory in SITE_DIRECTORIES:
        source = ROOT / directory
        if source.is_dir():
            shutil.copytree(source, output / directory)

    for page in ROOT.glob("*.html"):
        shutil.copy2(page, output / page.name)

    for name in ROOT_FILES:
        source = ROOT / name
        if source.is_file():
            shutil.copy2(source, output / name)

    BLOG_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    blog_data = build_blog_data()
    BLOG_OUTPUT.write_text(
        json.dumps(blog_data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    blog_urls = build_blog_pages(blog_data)
    newsletter_urls = build_newsletter_pages()
    build_sitemap(blog_urls + newsletter_urls)

    print(f"Cloudflare Worker assets created at {output} ({len(blog_data['posts'])} blog posts, {len(newsletter_urls)} newsletters indexed)")


if __name__ == "__main__":
    build()
