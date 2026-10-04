from typing import Any, get_args

import pytest

from app.rendering.html import render_html, render_pdf
from app.rendering.icons import icon
from app.rendering.styles import BANNER, CLASSIC, PALETTES, SIDE_PANEL, style_for
from app.rendering.view import build_view
from app.rendering.word import render_docx
from app.schemas.resume import Color, Resume
from tests.helpers import pdf_text

TWO_COLUMN = ["sidepanel", "banner"]
COLORS = list(get_args(Color))


def with_options(data: dict[str, Any], **options: Any) -> Resume:
    return Resume.model_validate({**data, "options": options})


def luminance(hex_color: str) -> float:
    channels = [int(hex_color[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    linear = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in channels]
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]


def contrast(first: str, second: str) -> float:
    lighter, darker = sorted((luminance(first), luminance(second)), reverse=True)
    return (lighter + 0.05) / (darker + 0.05)


def test_every_color_name_has_a_palette() -> None:
    assert set(COLORS) == {"default", *PALETTES}


@pytest.mark.parametrize("name", list(PALETTES))
def test_palettes_are_readable(name: str) -> None:
    palette = PALETTES[name]
    # WCAG AA for normal text is 4.5. White sits on `strong`; `accent` and body text sit on white
    # and on the tint.
    assert contrast("ffffff", palette.strong) >= 7
    assert contrast(palette.accent, "ffffff") >= 4.5
    assert contrast(SIDE_PANEL.text_color, palette.tint) >= 7


def test_default_color_keeps_each_template_as_it_was() -> None:
    assert style_for("sidepanel", "default") is SIDE_PANEL
    assert style_for("banner", "default") is BANNER
    assert style_for("classic", "default") is CLASSIC


def test_classic_has_no_color() -> None:
    assert style_for("classic", "maroon") is CLASSIC


def test_color_changes_the_two_column_styles() -> None:
    maroon = PALETTES["maroon"]
    side = style_for("sidepanel", "maroon")
    assert (side.cap_color, side.accent_color, side.panel_color) == (
        maroon.strong,
        maroon.accent,
        maroon.tint,
    )
    assert style_for("banner", "maroon").band_color == maroon.strong


def test_rejects_an_unknown_color(resume_data: dict[str, Any]) -> None:
    with pytest.raises(ValueError):
        with_options(resume_data, template="banner", color="ff0000")


@pytest.mark.parametrize("template", TWO_COLUMN)
@pytest.mark.parametrize("color", COLORS)
def test_every_color_renders(resume_data: dict[str, Any], template: str, color: str) -> None:
    resume = with_options(resume_data, template=template, color=color)
    html = render_html(resume)
    if color != "default":
        assert f"#{PALETTES[color].strong}" in html
    assert render_pdf(resume).startswith(b"%PDF-")


def test_classic_ignores_the_color(resume_data: dict[str, Any]) -> None:
    plain = render_html(with_options(resume_data, template="classic"))
    colored = render_html(with_options(resume_data, template="classic", color="teal"))
    assert colored == plain


def test_docx_ignores_the_color(resume_data: dict[str, Any]) -> None:
    render_docx(with_options(resume_data, template="banner", color="teal"))


def test_contact_items_know_their_kind(resume: Resume) -> None:
    kinds = [item.kind for item in build_view(resume).contact]
    assert kinds == ["location", "email", "phone", "link", "link"]


def test_icon_rejects_anything_but_a_hex_color() -> None:
    with pytest.raises(ValueError):
        icon("email", 'fff" onload="x')


@pytest.mark.parametrize("template", TWO_COLUMN)
def test_two_column_templates_print_one_icon_per_contact_line(
    resume_data: dict[str, Any], template: str
) -> None:
    resume = with_options(resume_data, template=template)
    assert render_html(resume).count('<svg class="icon"') == len(build_view(resume).contact)


def test_classic_has_no_icons(resume_data: dict[str, Any]) -> None:
    assert "<svg" not in render_html(with_options(resume_data, template="classic"))


@pytest.mark.parametrize("template", TWO_COLUMN)
def test_icons_add_no_text_to_the_pdf(resume_data: dict[str, Any], template: str) -> None:
    text = pdf_text(render_pdf(with_options(resume_data, template=template)))
    assert "alex.morgan@example.com" in text
    assert "+1-555-0100" in text
