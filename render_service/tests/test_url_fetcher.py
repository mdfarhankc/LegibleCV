import pytest

from app.core.url_fetcher import FontOnlyURLFetcher
from app.rendering.html import FONTS_DIR


@pytest.fixture
def fetcher() -> FontOnlyURLFetcher:
    return FontOnlyURLFetcher(FONTS_DIR)


def test_serves_bundled_font(fetcher: FontOnlyURLFetcher) -> None:
    response = fetcher.fetch((FONTS_DIR / "Carlito-Regular.ttf").as_uri())
    assert response.read(4) == b"\x00\x01\x00\x00"
    assert response.content_type == "font/ttf"


@pytest.mark.parametrize(
    "url",
    [
        "http://169.254.169.254/latest/meta-data/",
        "https://example.com/font.ttf",
        "file:///etc/passwd",
        "file://attacker-host/share/font.ttf",
        "data:font/ttf;base64,AAAA",
    ],
)
def test_blocks_other_urls(fetcher: FontOnlyURLFetcher, url: str) -> None:
    with pytest.raises(ValueError, match="Blocked resource"):
        fetcher.fetch(url)


def test_blocks_path_traversal(fetcher: FontOnlyURLFetcher) -> None:
    with pytest.raises(ValueError, match="Blocked resource"):
        fetcher.fetch(f"{FONTS_DIR.as_uri()}/../../config.py")


def test_blocks_non_font_files_in_fonts_dir(fetcher: FontOnlyURLFetcher) -> None:
    with pytest.raises(ValueError, match="Blocked resource"):
        fetcher.fetch((FONTS_DIR / "OFL.txt").as_uri())
