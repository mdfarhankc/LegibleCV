from typing import Any

import pytest

from app.rendering.html import render_html, render_pdf
from app.rendering.view import build_view
from app.rendering.word import render_docx
from app.schemas.resume import Resume
from tests.helpers import (
    ORDERED_MARKERS,
    TWO_COLUMN,
    assert_in_order,
    docx_text,
    pdf_reader,
    pdf_text,
    with_options,
)

# Kerning can put a space before punctuation in extracted PDF text, so these avoid it.
PDF_MARKERS = ["ALEX MORGAN", "NORTHWIND SYSTEMS LLC", "Contoso Learning Labs", "Databases"]


def side_headings(resume: Resume) -> list[str]:
    return [section.heading for section in build_view(resume).side_sections]


def main_headings(resume: Resume) -> list[str]:
    return [section.heading for section in build_view(resume).main_sections]


def test_automatic_placement_follows_section_type(resume: Resume) -> None:
    assert side_headings(resume) == ["Skills", "Languages"]
    assert main_headings(resume) == [
        "Professional Summary",
        "Work Experience",
        "Projects",
        "Education",
        "Awards & Achievements",
    ]


def test_placement_can_be_overridden(resume_data: dict[str, Any]) -> None:
    resume_data["sections"][0]["placement"] = "side"  # the summary, main by default
    resume_data["sections"][3]["placement"] = "main"  # skills, side by default
    resume = Resume.model_validate(resume_data)
    assert side_headings(resume) == ["Professional Summary", "Languages"]
    assert "Skills" in main_headings(resume)


def test_placement_rejects_unknown_values(resume_data: dict[str, Any]) -> None:
    resume_data["sections"][0]["placement"] = "left"
    with pytest.raises(ValueError):
        Resume.model_validate(resume_data)


@pytest.mark.parametrize("template", TWO_COLUMN)
def test_html_puts_sections_in_their_columns(resume_data: dict[str, Any], template: str) -> None:
    html = render_html(with_options(resume_data, template=template))
    aside = html.split("<aside", 1)[1].split("</aside>", 1)[0]
    main = html.split("<main", 1)[1].split("</main>", 1)[0]

    assert "<h2>Skills</h2>" in aside
    assert "<h2>Languages</h2>" in aside
    assert "<h2>Work Experience</h2>" not in aside
    assert_in_order(main, ["Professional Summary", "Work Experience", "Projects", "Education"])
    assert "<h2>Skills</h2>" not in main


@pytest.mark.parametrize("template", TWO_COLUMN)
def test_html_escapes_user_input(resume_data: dict[str, Any], template: str) -> None:
    resume_data["full_name"] = "<script>alert(1)</script>"
    resume_data["sections"][3]["groups"][0]["label"] = "<img src=x>"
    html = render_html(with_options(resume_data, template=template))
    assert "<script>alert" not in html
    assert "<img" not in html


@pytest.mark.parametrize("template", TWO_COLUMN)
def test_pdf_contains_all_content(resume_data: dict[str, Any], template: str) -> None:
    pdf = render_pdf(with_options(resume_data, template=template))
    assert pdf.startswith(b"%PDF-")
    text = pdf_text(pdf)
    for marker in PDF_MARKERS:
        assert marker in text, marker


@pytest.mark.parametrize(("template", "font"), [("sidepanel", "Carlito"), ("banner", "Poppins")])
def test_pdf_embeds_the_template_font(
    resume_data: dict[str, Any], template: str, font: str
) -> None:
    reader = pdf_reader(render_pdf(with_options(resume_data, template=template)))
    fonts = {
        str(item.get_object()["/BaseFont"])
        for page in reader.pages
        for item in page["/Resources"]["/Font"].values()
    }
    assert any(font in name for name in fonts), fonts


@pytest.mark.parametrize("template", TWO_COLUMN)
def test_ats_mode_does_not_change_two_column_templates(
    resume_data: dict[str, Any], template: str
) -> None:
    normal = render_html(with_options(resume_data, template=template))
    ats = render_html(with_options(resume_data, template=template, ats_mode=True))
    assert ats == normal


@pytest.mark.parametrize("template", TWO_COLUMN)
def test_contact_prints_link_addresses(resume_data: dict[str, Any], template: str) -> None:
    contact = [
        item.text for item in build_view(with_options(resume_data, template=template)).contact
    ]
    assert "github.com/alex-morgan-example" in contact
    assert "GitHub" not in contact


@pytest.mark.parametrize("template", TWO_COLUMN)
def test_docx_stays_single_column_and_complete(resume_data: dict[str, Any], template: str) -> None:
    text = docx_text(render_docx(with_options(resume_data, template=template)))
    assert_in_order(text, ORDERED_MARKERS)


@pytest.mark.parametrize("template", TWO_COLUMN)
def test_renders_without_any_sections(template: str) -> None:
    resume = Resume.model_validate(
        {"full_name": "A", "email": "a@example.com", "options": {"template": template}}
    )
    assert "<h1>A</h1>" in render_html(resume)
    assert render_pdf(resume).startswith(b"%PDF-")
