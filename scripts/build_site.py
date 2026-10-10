"""Assemble the files published to Cloudflare Pages."""

from pathlib import Path
import shutil


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "dist"
SITE_DIRECTORIES = ("assets", "components")
ROOT_FILES = ("robots.txt", "sitemap.xml", "_headers", "_redirects", "_routes.json")


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

    print(f"Cloudflare Pages output created at {output}")


if __name__ == "__main__":
    build()
