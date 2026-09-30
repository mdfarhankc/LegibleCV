import time
from typing import Any

import pytest
from cryptography.hazmat.primitives.asymmetric import ec

from app.core.security import AuthUnavailableError, InvalidTokenError, TokenVerifier
from tests.helpers import StaticJWKClient, UnreachableJWKClient, make_token


@pytest.fixture
def verifier(jwks: dict[str, Any]) -> TokenVerifier:
    return TokenVerifier(StaticJWKClient(jwks))


def test_accepts_valid_token(verifier: TokenVerifier, signing_key: Any) -> None:
    assert verifier.verify(make_token(signing_key)).id == "user-123"


@pytest.mark.parametrize(
    "overrides",
    [
        {"exp": int(time.time()) - 60},
        {"aud": "anon"},
        {"sub": None},
        {"exp": None},
    ],
)
def test_rejects_bad_claims(
    verifier: TokenVerifier, signing_key: Any, overrides: dict[str, Any]
) -> None:
    with pytest.raises(InvalidTokenError):
        verifier.verify(make_token(signing_key, **overrides))


def test_rejects_token_signed_by_another_key(verifier: TokenVerifier) -> None:
    other_key = ec.generate_private_key(ec.SECP256R1())
    with pytest.raises(InvalidTokenError):
        verifier.verify(make_token(other_key))


def test_rejects_unknown_kid(verifier: TokenVerifier, signing_key: Any) -> None:
    with pytest.raises(InvalidTokenError):
        verifier.verify(make_token(signing_key, kid="other"))


def test_rejects_symmetric_token(verifier: TokenVerifier) -> None:
    with pytest.raises(InvalidTokenError):
        verifier.verify(make_token("x" * 32, algorithm="HS256"))


def test_rejects_garbage(verifier: TokenVerifier) -> None:
    with pytest.raises(InvalidTokenError):
        verifier.verify("not-a-jwt")


def test_unreachable_jwks_is_reported_separately(signing_key: Any) -> None:
    with pytest.raises(AuthUnavailableError):
        TokenVerifier(UnreachableJWKClient()).verify(make_token(signing_key))
