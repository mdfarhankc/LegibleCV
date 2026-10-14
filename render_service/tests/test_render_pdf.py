from typing import Any

import pytest

from app.rendering.html import render_pdf
from app.schemas.resume import Resume
from tests.helpers import FIXTURE, ORDERED_MARKERS, assert_in_order, pdf_reader, pdf_text


@pytest.fixture(scope="module")
def sample_pdf() -> bytes:
    return render_pdf(Resume.model_validate_json(FIXTURE.read_text(encoding="utf-8")))


def test_is_valid_pdf(sample_pdf: bytes) -> None:
    assert sample_pdf.startswith(b"%PDF-")


def test_text_is_selectable_and_ordered(sample_pdf: bytes) -> None:
    assert_in_order(pdf_text(sample_pdf), ORDERED_MARKERS)


def test_embeds_bundled_font(sample_pdf: bytes) -> None:
    reader = pdf_reader(sample_pdf)
    fonts = {
        str(font.get_object()["/BaseFont"])
        for page in reader.pages
        for font in page["/Resources"]["/Font"].values()
    }
    assert any("Carlito" in font for font in fonts), fonts


def test_has_link_annotations(sample_pdf: bytes) -> None:
    first_page = pdf_reader(sample_pdf).pages[0]
    uris = {annot.get_object()["/A"]["/URI"] for annot in first_page.get("/Annots", [])}
    assert "https://github.com/alex-morgan-example" in uris


def test_metadata(sample_pdf: bytes) -> None:
    metadata = pdf_reader(sample_pdf).metadata
    assert metadata is not None
    assert metadata.title == "ALEX MORGAN - Resume"
    assert metadata.author == "ALEX MORGAN"


@pytest.mark.parametrize(("page_size", "expected"), [("A4", (595, 842)), ("Letter", (612, 792))])
def test_page_size(resume_data: dict[str, Any], page_size: str, expected: tuple[int, int]) -> None:
    resume_data["options"] = {"page_size": page_size}
    page = pdf_reader(render_pdf(Resume.model_validate(resume_data))).pages[0]
    assert (round(page.mediabox.width), round(page.mediabox.height)) == expected


def test_ats_mode_prints_full_urls(resume_data: dict[str, Any]) -> None:
    resume_data["options"] = {"ats_mode": True}
    text = pdf_text(render_pdf(Resume.model_validate(resume_data)))
    assert "linkedin.com/in/alex-morgan-example" in text
    assert "https://www.linkedin.com" not in text
