import logging
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import Settings
from app.core.security import (
    AuthenticatedUser,
    AuthUnavailableError,
    InvalidTokenError,
    TokenVerifier,
)

logger = logging.getLogger(__name__)

_bearer = HTTPBearer(auto_error=False)
_DEV_USER = AuthenticatedUser(id="dev-user")


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status.HTTP_401_UNAUTHORIZED, detail, headers={"WWW-Authenticate": "Bearer"}
    )


def get_current_user(
    request: Request,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> AuthenticatedUser:
    settings: Settings = request.app.state.settings
    if settings.auth_disabled:
        return _DEV_USER
    if credentials is None:
        raise _unauthorized("Missing bearer token")

    verifier: TokenVerifier = request.app.state.token_verifier
    try:
        return verifier.verify(credentials.credentials)
    except InvalidTokenError as exc:
        raise _unauthorized("Invalid or expired token") from exc
    except AuthUnavailableError as exc:
        logger.exception("JWKS endpoint unavailable")
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, "Authentication is temporarily unavailable"
        ) from exc
