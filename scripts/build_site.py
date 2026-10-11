"""Assemble the static assets published by the Cloudflare Worker."""

from pathlib import Path
import json
import re
import shutil
from datetime import datetime


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "dist"
BLOG_SOURCE = ROOT / "content" / "blog"
BLOG_OUTPUT = OUTPUT / "assets" / "data" / "blog.json"
SITE_DIRECTORIES = ("assets", "components")
ROOT_FILES = ("robots.txt", "sitemap.xml", "_headers", "_redirects", "_routes.json")


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

    print(f"Cloudflare Worker assets created at {output} ({len(blog_data['posts'])} blog posts)")


if __name__ == "__main__":
    build()
