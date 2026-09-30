"""Reusable field types: whitespace stripping, blank handling, and size limits.

Limits cap render cost. Blank values are normalized instead of rejected so a half-filled
editor form can still be previewed.
"""

from typing import Annotated

from pydantic import BeforeValidator, Field, StringConstraints


def _blank_to_none(value: object) -> object:
    if isinstance(value, str) and not value.strip():
        return None
    return value


def _drop_blank_items(value: object) -> object:
    if isinstance(value, list):
        return [item for item in value if not (isinstance(item, str) and not item.strip())]
    return value


def _text(max_length: int) -> StringConstraints:
    return StringConstraints(strip_whitespace=True, min_length=1, max_length=max_length)


Id = Annotated[str, _text(64)]
Label = Annotated[str, _text(80)]
ShortText = Annotated[str, _text(200)]
LongText = Annotated[str, _text(3000)]
Phone = Annotated[str, _text(40)]

OptionalShortText = Annotated[ShortText | None, BeforeValidator(_blank_to_none)]
OptionalLongText = Annotated[LongText | None, BeforeValidator(_blank_to_none)]
OptionalPhone = Annotated[Phone | None, BeforeValidator(_blank_to_none)]

Bullets = Annotated[list[LongText], BeforeValidator(_drop_blank_items), Field(max_length=30)]
ShortItems = Annotated[list[ShortText], BeforeValidator(_drop_blank_items), Field(max_length=50)]
