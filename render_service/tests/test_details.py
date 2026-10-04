from typing import Any

import pytest

from app.rendering.html import render_html, render_pdf
from app.rendering.view import build_view
from app.rendering.word import render_docx
from app.schemas.resume import Resume
from tests.helpers import docx_text, pdf_text

DETAILS = {
    "type": "details",
    "id": "personal",
    "title": "Personal Details",
    "items": [
        {"label": "Nationality", "value": "Indian"},
        # A comma in a value must stay as typed.
        {"label": "Visa status", "value": "Visit visa, valid until March 2027"},
    ],
}


def with_details(data: dict[str, Any], template: str = "classic", **section: Any) -> Resume:
    sections = [*data["sections"], {**DETAILS, **section}]
    return Resume.model_validate({**data, "sections": sections, "options": {"template": template}})


def test_details_print_in_every_format(resume_data: dict[str, Any]) -> None:
    resume = with_details(resume_data)
    html = render_html(resume)
    assert "PERSONAL DETAILS" in html
    assert "<strong>Visa status:</strong> Visit visa, valid until March 2027" in html
    assert "Nationality" in pdf_text(render_pdf(resume))
    assert "Visa status: Visit visa, valid until March 2027" in docx_text(render_docx(resume))


@pytest.mark.parametrize("template", ["sidepanel", "banner"])
def test_details_go_to_the_side_column_by_default(
    resume_data: dict[str, Any], template: str
) -> None:
    resume = with_details(resume_data, template)
    assert "Personal Details" in [section.heading for section in build_view(resume).side_sections]
    aside = render_html(resume).split("<aside", 1)[1].split("</aside>", 1)[0]
    assert '<p class="pair-label">Nationality</p><p class="pair-value">Indian</p>' in aside


def test_details_can_be_moved_to_the_main_column(resume_data: dict[str, Any]) -> None:
    resume = with_details(resume_data, "banner", placement="main")
    assert "Personal Details" in [section.heading for section in build_view(resume).main_sections]


def test_an_empty_details_section_is_left_out(resume_data: dict[str, Any]) -> None:
    assert "PERSONAL DETAILS" not in render_html(with_details(resume_data, items=[]))


def test_details_are_escaped(resume_data: dict[str, Any]) -> None:
    items = [{"label": "<b>x</b>", "value": "<script>alert(1)</script>"}]
    html = render_html(with_details(resume_data, items=items))
    assert "<script>alert" not in html
    assert "<b>x</b>" not in html


@pytest.mark.parametrize(
    "items",
    [
        [{"label": "", "value": "Indian"}],
        [{"label": "Nationality", "value": ""}],
        [{"label": "Nationality"}],
        [{"label": "x", "value": "y"}] * 21,
    ],
)
def test_rejects_incomplete_or_too_many_details(
    resume_data: dict[str, Any], items: list[dict[str, str]]
) -> None:
    with pytest.raises(ValueError):
        with_details(resume_data, items=items)
