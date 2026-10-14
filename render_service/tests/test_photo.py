import base64
from io import BytesIO
from typing import Any

import pytest
from PIL import Image

from app.core.url_fetcher import ResumeURLFetcher
from app.rendering.html import FONTS_DIR, render_html, render_pdf
from app.rendering.word import render_docx
from app.schemas.fields import PHOTO_MAX_BYTES, PHOTO_PREFIX
from app.schemas.resume import Resume
from tests.helpers import ORDERED_MARKERS, TWO_COLUMN, assert_in_order, docx_text, pdf_reader


def jpeg_bytes(size: int = 16) -> bytes:
    buffer = BytesIO()
    Image.new("RGB", (size, size), (200, 60, 60)).save(buffer, format="JPEG")
    return buffer.getvalue()


def data_uri(content: bytes) -> str:
    return PHOTO_PREFIX + base64.b64encode(content).decode()


@pytest.fixture
def photo() -> str:
    return data_uri(jpeg_bytes())


def with_photo(data: dict[str, Any], photo: str | None, template: str) -> Resume:
    return Resume.model_validate({**data, "photo": photo, "options": {"template": template}})


def has_image(pdf: bytes) -> bool:
    # Every page lists the document's shared images, so this is a yes or no, not a count.
    return any(len(page.images) > 0 for page in pdf_reader(pdf).pages)


def test_photo_is_optional(resume: Resume) -> None:
    assert resume.photo is None


def test_accepts_a_jpeg_data_uri(resume_data: dict[str, Any], photo: str) -> None:
    assert with_photo(resume_data, photo, "banner").photo == photo


@pytest.mark.parametrize(
    "value",
    [
        "https://example.com/me.jpg",
        "file:///etc/passwd",
        "data:image/png;base64,iVBORw0KGgo=",
        "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=",
        PHOTO_PREFIX + "not base64!",
        PHOTO_PREFIX + base64.b64encode(b"GIF89a not a jpeg").decode(),
        PHOTO_PREFIX,
    ],
)
def test_rejects_anything_else(resume_data: dict[str, Any], value: str) -> None:
    with pytest.raises(ValueError):
        with_photo(resume_data, value, "banner")


def test_rejects_an_oversized_photo(resume_data: dict[str, Any]) -> None:
    too_big = jpeg_bytes()[:3] + b"\0" * PHOTO_MAX_BYTES
    with pytest.raises(ValueError):
        with_photo(resume_data, data_uri(too_big), "banner")


def test_fetcher_serves_the_photo(photo: str) -> None:
    response = ResumeURLFetcher(FONTS_DIR).fetch(photo)
    assert response.content_type == "image/jpeg"
    assert response.read() == jpeg_bytes()


@pytest.mark.parametrize("template", TWO_COLUMN)
def test_two_column_templates_print_the_photo(
    resume_data: dict[str, Any], photo: str, template: str
) -> None:
    resume = with_photo(resume_data, photo, template)
    assert f'<img class="photo" src="{photo}"' in render_html(resume)
    assert has_image(render_pdf(resume))


@pytest.mark.parametrize("template", TWO_COLUMN)
def test_no_image_without_a_photo(resume_data: dict[str, Any], template: str) -> None:
    resume = with_photo(resume_data, None, template)
    assert "<img" not in render_html(resume)
    assert not has_image(render_pdf(resume))


def test_classic_ignores_the_photo(resume_data: dict[str, Any], photo: str) -> None:
    with_it = with_photo(resume_data, photo, "classic")
    without = with_photo(resume_data, None, "classic")
    assert render_html(with_it) == render_html(without)


@pytest.mark.parametrize("template", ["classic", *TWO_COLUMN])
def test_docx_ignores_the_photo(resume_data: dict[str, Any], photo: str, template: str) -> None:
    content = render_docx(with_photo(resume_data, photo, template))
    assert_in_order(docx_text(content), ORDERED_MARKERS)
