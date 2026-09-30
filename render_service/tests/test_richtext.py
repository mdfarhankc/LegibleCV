import pytest

from app.rendering.richtext import Run, parse_paragraphs, parse_runs


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ("plain", [Run("plain")]),
        ("**bold**", [Run("bold", bold=True)]),
        (
            "Built with **FastAPI** and **Django**.",
            [
                Run("Built with "),
                Run("FastAPI", bold=True),
                Run(" and "),
                Run("Django", bold=True),
                Run("."),
            ],
        ),
        ("unbalanced **bold", [Run("unbalanced **bold")]),
        ("empty **** marker", [Run("empty **** marker")]),
        ("<b>html</b> stays text", [Run("<b>html</b> stays text")]),
    ],
)
def test_parse_runs(text: str, expected: list[Run]) -> None:
    assert parse_runs(text) == expected


def test_parse_paragraphs_splits_lines_and_skips_blanks() -> None:
    assert parse_paragraphs("First\n\n  Second  \n") == [[Run("First")], [Run("Second")]]


@pytest.mark.parametrize("text", [None, "", "\n \n"])
def test_parse_paragraphs_empty(text: str | None) -> None:
    assert parse_paragraphs(text) == []
