from typing import Any

import pytest
from pydantic import HttpUrl

from app.rendering.view import (
    EntriesBlock,
    InlineBlock,
    build_view,
    date_range,
    short_url,
    url_text,
)
from app.schemas.resume import Entry, Resume


@pytest.mark.parametrize(
    ("fields", "expected"),
    [
        ({"start": "MAR 2023", "end": "JAN 2024"}, "MAR 2023 - JAN 2024"),
        ({"start": "MAR 2023", "is_current": True}, "MAR 2023 - Present"),
        ({"start": "MAR 2023", "end": "JAN 2024", "is_current": True}, "MAR 2023 - Present"),
        ({"start": "2025"}, "2025"),
        ({"end": "2022"}, "2022"),
        ({}, None),
    ],
)
def test_date_range(fields: dict[str, Any], expected: str | None) -> None:
    assert date_range(Entry(title="T", **fields)) == expected


@pytest.mark.parametrize(
    ("url", "expected"),
    [
        ("https://example.com", "https://example.com"),
        ("https://github.com/alex/repo", "https://github.com/alex/repo"),
        ("https://example.com/path/", "https://example.com/path/"),
    ],
)
def test_url_text(url: str, expected: str) -> None:
    assert url_text(HttpUrl(url)) == expected


@pytest.mark.parametrize(
    ("url", "expected"),
    [
        ("https://www.linkedin.com/in/alex", "linkedin.com/in/alex"),
        ("https://github.com/alex/repo", "github.com/alex/repo"),
        ("http://example.com", "example.com"),
        ("https://wwwexample.com/", "wwwexample.com"),
    ],
)
def test_short_url(url: str, expected: str) -> None:
    assert short_url(HttpUrl(url)) == expected


def test_entry_with_location_puts_dates_on_subtitle_line(resume: Resume) -> None:
    block = build_view(resume).sections[1].block
    assert isinstance(block, EntriesBlock)
    job = block.entries[0]
    assert job.title_right == "Springfield, IL | Remote"
    assert job.subtitle_right == "MAR 2023 - Present"


def test_entry_without_location_puts_dates_on_title_line(resume: Resume) -> None:
    block = build_view(resume).sections[4].block
    assert isinstance(block, EntriesBlock)
    degree = block.entries[0]
    assert degree.title_right == "2019 - 2022"
    assert degree.subtitle_right is None


def test_section_titles_are_uppercased(resume: Resume) -> None:
    titles = [section.title for section in build_view(resume).sections]
    assert titles[:2] == ["PROFESSIONAL SUMMARY", "WORK EXPERIENCE"]


def test_empty_sections_are_omitted() -> None:
    resume = Resume.model_validate(
        {
            "full_name": "A",
            "email": "a@example.com",
            "sections": [
                {"type": "text", "id": "s", "title": "Summary", "content": "  "},
                {"type": "entries", "id": "e", "title": "Experience", "items": []},
                {"type": "skills", "id": "k", "title": "Skills", "groups": [{"label": "X"}]},
                {"type": "bullets", "id": "b", "title": "Extra", "items": [""]},
                {"type": "inline", "id": "l", "title": "Languages", "items": ["English"]},
            ],
        }
    )
    sections = build_view(resume).sections
    assert [section.title for section in sections] == ["LANGUAGES"]
    assert isinstance(sections[0].block, InlineBlock)


def test_contact_uses_labels_normally_and_urls_in_ats_mode(resume_data: dict[str, Any]) -> None:
    normal = build_view(Resume.model_validate(resume_data)).contact
    assert [item.text for item in normal] == [
        "Springfield, IL, US", "alex.morgan@example.com", "+1-555-0100", "LinkedIn", "GitHub",
    ]  # fmt: skip
    assert normal[1].url == "mailto:alex.morgan@example.com"

    resume_data["options"] = {"ats_mode": True}
    ats = build_view(Resume.model_validate(resume_data)).contact
    assert ats[3].text == "linkedin.com/in/alex-morgan-example"
    assert ats[3].url == "https://www.linkedin.com/in/alex-morgan-example"


def test_contact_skips_missing_optional_fields() -> None:
    contact = build_view(Resume(full_name="A", email="a@example.com")).contact
    assert [item.text for item in contact] == ["a@example.com"]
