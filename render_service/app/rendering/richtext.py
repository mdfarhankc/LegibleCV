"""Minimal rich text: `**bold**` is the only supported markup."""

import re
from dataclasses import dataclass

_BOLD = re.compile(r"\*\*(.+?)\*\*")


@dataclass(frozen=True, slots=True)
class Run:
    text: str
    bold: bool = False


type Paragraph = list[Run]


def parse_runs(text: str) -> Paragraph:
    runs: Paragraph = []
    position = 0
    for match in _BOLD.finditer(text):
        if match.start() > position:
            runs.append(Run(text[position : match.start()]))
        runs.append(Run(match.group(1), bold=True))
        position = match.end()
    if position < len(text):
        runs.append(Run(text[position:]))
    return runs


def parse_paragraphs(text: str | None) -> list[Paragraph]:
    if not text:
        return []
    return [parse_runs(line.strip()) for line in text.splitlines() if line.strip()]
