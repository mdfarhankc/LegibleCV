"""Contact icons for the two-column templates.

Shapes are from Lucide (https://lucide.dev), license in app/static/icons/LICENSE-lucide.txt.
They are drawn, not text, so they don't show up when text is extracted from the PDF.
"""

import re
from typing import Literal

ContactKind = Literal["location", "email", "phone", "link"]

_SHAPES: dict[ContactKind, str] = {
    "location": (
        '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 '
        '14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>'
    ),
    "email": (
        '<path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/>'
        '<rect x="2" y="4" width="20" height="16" rx="2"/>'
    ),
    "phone": (
        '<path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 '
        "2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 "
        '1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/>'
    ),
    "link": (
        '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>'
        '<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'
    ),
}

_HEX_COLOR = re.compile(r"[0-9a-f]{6}")


def icon(kind: ContactKind, color: str) -> str:
    """An inline SVG, to be output with the `safe` filter. Nothing in it comes from the user.

    The color is written in because WeasyPrint doesn't resolve currentColor.
    """
    if not _HEX_COLOR.fullmatch(color):
        raise ValueError(f"Not a hex color: {color}")
    return (
        f'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="#{color}" stroke-width="2" '
        f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{_SHAPES[kind]}</svg>'
    )
