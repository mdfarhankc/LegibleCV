import re
from typing import Any

from app.rendering.html import render_html
from app.schemas.resume import Resume
from tests.helpers import ORDERED_MARKERS, assert_in_order


def _visible_text(html: str) -> str:
    body = html.split("<body>", 1)[1]
    return re.sub(r"<[^>]+>", "", body).replace("&amp;", "&")


def test_renders_sections_in_order(resume: Resume) -> None:
    assert_in_order(_visible_text(render_html(resume)), ORDERED_MARKERS)


def test_rich_text_bold_is_rendered(resume: Resume) -> None:
    assert "using <strong>FastAPI</strong> and <strong>Django</strong>," in render_html(resume)


def test_user_input_is_escaped(resume_data: dict[str, Any]) -> None:
    payload = '<img src="http://169.254.169.254/latest"><script>alert(1)</script>'
    resume_data["full_name"] = payload
    resume_data["sections"][1]["items"][0]["bullets"] = [f"**{payload}**"]
    html = render_html(Resume.model_validate(resume_data))
    assert "<script>" not in html
    assert "<img" not in html
    assert "&lt;script&gt;" in html


def test_links_are_hyperlinked(resume: Resume) -> None:
    html = render_html(resume)
    assert '<a href="https://github.com/alex-morgan-example">GitHub</a>' in html
    assert '<a href="mailto:alex.morgan@example.com">' in html


def test_ats_mode_prints_urls_and_uses_black_links(resume_data: dict[str, Any]) -> None:
    resume_data["options"] = {"ats_mode": True}
    html = render_html(Resume.model_validate(resume_data))
    assert ">https://github.com/alex-morgan-example</a>" in html
    assert "--link: #000000;" in html
    assert "--muted: #000000;" in html


def test_page_size(resume_data: dict[str, Any]) -> None:
    assert "size: A4;" in render_html(Resume.model_validate(resume_data))
    resume_data["options"] = {"page_size": "Letter"}
    assert "size: letter;" in render_html(Resume.model_validate(resume_data))


def test_minimal_resume_renders() -> None:
    html = render_html(Resume(full_name="A", email="a@example.com"))
    assert "<h1>A</h1>" in html
    assert "<h2>" not in html
