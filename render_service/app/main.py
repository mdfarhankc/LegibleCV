from collections.abc import Awaitable, Callable

from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import health, render
from app.config import Settings, get_settings
from app.core.rate_limit import RateLimiter
from app.core.security import TokenVerifier


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    app = FastAPI(
        title="MakeMyResume Render Service",
        version="0.1.0",
        docs_url="/docs" if settings.docs_enabled else None,
        redoc_url=None,
        openapi_url="/openapi.json" if settings.docs_enabled else None,
    )
    app.state.settings = settings
    app.state.token_verifier = (
        None if settings.auth_disabled else TokenVerifier.from_url(settings.jwks_url)
    )
    app.state.rate_limiter = RateLimiter(settings.rate_limit_per_minute)

    @app.middleware("http")
    async def limit_body_size(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        # Turned away on the declared size, before any of the body is read. The server
        # doesn't accept more bytes than a request declares.
        if request.method == "POST":
            declared = request.headers.get("content-length", "")
            if not declared.isdecimal():
                return JSONResponse(
                    {"detail": "Content-Length is required"}, status.HTTP_411_LENGTH_REQUIRED
                )
            if int(declared) > settings.max_body_bytes:
                return JSONResponse(
                    {"detail": "Request body too large"},
                    status.HTTP_413_CONTENT_TOO_LARGE,
                )
        return await call_next(request)

    if settings.allowed_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.allowed_origins,
            allow_methods=["GET", "POST"],
            allow_headers=["Authorization", "Content-Type"],
            expose_headers=["Content-Disposition"],
        )

    app.include_router(health.router)
    app.include_router(render.router)
    return app
