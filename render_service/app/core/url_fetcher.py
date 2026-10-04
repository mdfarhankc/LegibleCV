from functools import lru_cache
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import url2pathname

from weasyprint.urls import URLFetcher, URLFetcherResponse

from app.schemas.fields import PHOTO_PREFIX, decode_photo

_FONT_TYPES = {".ttf": "font/ttf", ".otf": "font/otf", ".woff2": "font/woff2"}


@lru_cache(maxsize=32)
def _read_font(path: Path) -> bytes:
    return path.read_bytes()


class ResumeURLFetcher(URLFetcher):
    """Serves bundled font files and the resume's embedded photo, and refuses every other URL.

    Blocks network access (SSRF) and reads of arbitrary local files during rendering.
    """

    def __init__(self, fonts_dir: Path) -> None:
        super().__init__(allowed_protocols={"file"}, allow_redirects=False)
        self._fonts_dir = fonts_dir.resolve()

    def fetch(self, url: str, headers: dict | None = None) -> URLFetcherResponse:
        if url.startswith(PHOTO_PREFIX):
            return URLFetcherResponse(url, decode_photo(url), {"Content-Type": "image/jpeg"})
        path = self._resolve_font_path(url)
        return URLFetcherResponse(url, _read_font(path), {"Content-Type": _FONT_TYPES[path.suffix]})

    def _resolve_font_path(self, url: str) -> Path:
        parts = urlsplit(url)
        if parts.scheme != "file" or parts.netloc not in ("", "localhost"):
            raise ValueError(f"Blocked resource: {url}")
        path = Path(url2pathname(parts.path)).resolve()
        if not path.is_relative_to(self._fonts_dir) or path.suffix not in _FONT_TYPES:
            raise ValueError(f"Blocked resource: {url}")
        if not path.is_file():
            raise FileNotFoundError(f"Font not found: {url}")
        return path
