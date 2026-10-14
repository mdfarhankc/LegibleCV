import time
from io import BytesIO
from pathlib import Path
from typing import Any

import docx
import jwt
from pypdf import PdfReader

from app.schemas.resume import Resume

FIXTURE = Path(__file__).parent / "fixtures" / "sample_resume.json"
KID = "test-key"
SUPABASE_URL = "https://example.supabase.co"
JWKS_URL = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
TWO_COLUMN = ["sidepanel", "banner"]

# Strings that must appear, in this order, in every output format for the sample fixture.
ORDERED_MARKERS = [
    "ALEX MORGAN",
    "PROFESSIONAL SUMMARY",
    "WORK EXPERIENCE",
    "NORTHWIND SYSTEMS LLC",
    "Python Developer",
    "Contoso Learning Labs",
    "PROJECTS",
    "AuthKit",
    "Ledger",
    "SKILLS",
    "Databases:",
    "EDUCATION",
    "STATE UNIVERSITY",
    "AWARDS & ACHIEVEMENTS",
    "LANGUAGES",
    "English - Native",
]


def with_options(data: dict[str, Any], **options: Any) -> Resume:
    return Resume.model_validate({**data, "options": options})


def pdf_reader(content: bytes) -> PdfReader:
    return PdfReader(BytesIO(content))


def pdf_text(content: bytes) -> str:
    return "\n".join(page.extract_text() or "" for page in pdf_reader(content).pages)


def docx_text(content: bytes) -> str:
    return "\n".join(paragraph.text for paragraph in docx.Document(BytesIO(content)).paragraphs)


def assert_in_order(text: str, markers: list[str]) -> None:
    position = -1
    for marker in markers:
        found = text.find(marker, position + 1)
        assert found > position, f"{marker!r} missing or out of order"
        position = found


class StaticJWKClient(jwt.PyJWKClient):
    def __init__(self, jwks: dict[str, Any]) -> None:
        super().__init__(JWKS_URL, cache_jwk_set=False)
        self._jwks = jwks

    def fetch_data(self) -> Any:
        return self._jwks


class UnreachableJWKClient(jwt.PyJWKClient):
    def __init__(self) -> None:
        super().__init__(JWKS_URL, cache_jwk_set=False)

    def fetch_data(self) -> Any:
        raise jwt.PyJWKClientConnectionError("connection refused")


def make_token(key: Any, *, kid: str = KID, algorithm: str = "ES256", **overrides: Any) -> str:
    claims = {
        "sub": "user-123",
        "aud": "authenticated",
        "exp": int(time.time()) + 300,
        **overrides,
    }
    claims = {name: value for name, value in claims.items() if value is not None}
    return jwt.encode(claims, key, algorithm=algorithm, headers={"kid": kid})
