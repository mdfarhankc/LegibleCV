from typing import Any

import pytest
from pydantic import ValidationError

from app.schemas.resume import EntriesSection, Resume


def test_fixture_is_valid(resume: Resume) -> None:
    assert resume.full_name == "ALEX MORGAN"
    assert [section.type for section in resume.sections] == [
        "text", "entries", "entries", "skills", "entries", "entries", "inline",
    ]  # fmt: skip


def test_defaults() -> None:
    resume = Resume(full_name="A", email="a@example.com")
    assert resume.options.template == "classic"
    assert resume.options.page_size == "A4"
    assert resume.options.ats_mode is False


def test_blank_optional_fields_become_none(resume_data: dict[str, Any]) -> None:
    resume_data["phone"] = "   "
    resume_data["sections"][1]["items"][0]["subtitle"] = ""
    resume = Resume.model_validate(resume_data)
    assert resume.phone is None
    section = resume.sections[1]
    assert isinstance(section, EntriesSection)
    assert section.items[0].subtitle is None


def test_blank_list_items_are_dropped(resume_data: dict[str, Any]) -> None:
    resume_data["sections"][1]["items"][0]["bullets"] = ["First", "", "  ", "Second"]
    section = Resume.model_validate(resume_data).sections[1]
    assert isinstance(section, EntriesSection)
    assert section.items[0].bullets == ["First", "Second"]


def test_strings_are_stripped() -> None:
    resume = Resume(full_name="  Alex  ", email="a@example.com")
    assert resume.full_name == "Alex"


@pytest.mark.parametrize(
    ("path", "value"),
    [
        (("full_name",), ""),
        (("email",), "not-an-email"),
        (("unknown_field",), "x"),
        (("options", "template"), "../../etc/passwd"),
        (("options", "page_size"), "A3"),
        (("links",), [{"label": "x", "url": "javascript:alert(1)"}]),
        (("links",), [{"label": "x", "url": "file:///etc/passwd"}]),
        (("sections",), [{"type": "unknown", "id": "a", "title": "A"}]),
    ],
)
def test_rejects_invalid_input(
    resume_data: dict[str, Any], path: tuple[str, ...], value: object
) -> None:
    target = resume_data
    for key in path[:-1]:
        target = target.setdefault(key, {})
    target[path[-1]] = value
    with pytest.raises(ValidationError):
        Resume.model_validate(resume_data)


def test_enforces_list_limits(resume_data: dict[str, Any]) -> None:
    resume_data["sections"][1]["items"][0]["bullets"] = ["bullet"] * 31
    with pytest.raises(ValidationError):
        Resume.model_validate(resume_data)


def test_enforces_length_limits(resume_data: dict[str, Any]) -> None:
    resume_data["sections"][0]["content"] = "x" * 3001
    with pytest.raises(ValidationError):
        Resume.model_validate(resume_data)
