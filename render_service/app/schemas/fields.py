"""Reusable field types: whitespace stripping, blank handling, and size limits.

Limits cap render cost. Blank values are normalized instead of rejected so a half-filled
editor form can still be previewed.
"""

import base64
import binascii
from typing import Annotated

from pydantic import AfterValidator, BeforeValidator, Field, StringConstraints

PHOTO_PREFIX = "data:image/jpeg;base64,"
PHOTO_MAX_BYTES = 300 * 1024
_JPEG_SIGNATURE = bytes.fromhex("ffd8ff")


def _blank_to_none(value: object) -> object:
    if isinstance(value, str) and not value.strip():
        return None
    return value


def _drop_blank_items(value: object) -> object:
    if isinstance(value, list):
        return [item for item in value if not (isinstance(item, str) and not item.strip())]
    return value


def decode_photo(value: str) -> bytes:
    """The JPEG bytes of a photo data URI. Raises ValueError for anything else."""
    if not value.startswith(PHOTO_PREFIX):
        raise ValueError("photo must be a base64 JPEG data URI")
    try:
        content = base64.b64decode(value.removeprefix(PHOTO_PREFIX), validate=True)
    except binascii.Error as error:
        raise ValueError("photo is not valid base64") from error
    if not content.startswith(_JPEG_SIGNATURE):
        raise ValueError("photo is not a JPEG image")
    if len(content) > PHOTO_MAX_BYTES:
        raise ValueError("photo is too large")
    return content


def _check_photo(value: str) -> str:
    decode_photo(value)
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

# Base64 is 4/3 the size of the bytes it encodes.
Photo = Annotated[
    str,
    Field(max_length=len(PHOTO_PREFIX) + PHOTO_MAX_BYTES * 4 // 3 + 4),
    AfterValidator(_check_photo),
]

Bullets = Annotated[list[LongText], BeforeValidator(_drop_blank_items), Field(max_length=30)]
ShortItems = Annotated[list[ShortText], BeforeValidator(_drop_blank_items), Field(max_length=50)]
