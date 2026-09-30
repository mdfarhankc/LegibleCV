from dataclasses import dataclass
from typing import Any

import jwt

# Supabase asymmetric signing keys use ES256 (default) or RS256.
_ALGORITHMS = ["ES256", "RS256"]
_AUDIENCE = "authenticated"


class InvalidTokenError(Exception):
    pass


class AuthUnavailableError(Exception):
    pass


@dataclass(frozen=True, slots=True)
class AuthenticatedUser:
    id: str


class TokenVerifier:
    """Verifies Supabase access tokens against the project's JWKS endpoint."""

    def __init__(self, jwks_client: jwt.PyJWKClient) -> None:
        self._jwks_client = jwks_client

    @classmethod
    def from_url(cls, jwks_url: str) -> TokenVerifier:
        return cls(jwt.PyJWKClient(jwks_url, cache_keys=True, timeout=5))

    def verify(self, token: str) -> AuthenticatedUser:
        try:
            signing_key = self._jwks_client.get_signing_key_from_jwt(token)
            claims: dict[str, Any] = jwt.decode(
                token,
                signing_key.key,
                algorithms=_ALGORITHMS,
                audience=_AUDIENCE,
                options={"require": ["exp", "sub", "aud"]},
            )
        except jwt.PyJWKClientConnectionError as exc:
            raise AuthUnavailableError("Could not reach the signing key endpoint") from exc
        except jwt.PyJWTError as exc:
            raise InvalidTokenError(str(exc)) from exc
        return AuthenticatedUser(id=claims["sub"])
