from collections.abc import Iterator
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.api.routes.render import DOCX_MEDIA_TYPE, download_filename
from app.core.security import TokenVerifier
from app.main import create_app
from tests.conftest import make_settings
from tests.helpers import (
    StaticJWKClient,
    UnreachableJWKClient,
    docx_text,
    make_token,
    pdf_text,
)


def test_health(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_preview(client: TestClient, resume_data: dict[str, Any]) -> None:
    response = client.post("/v1/render/preview", json=resume_data)
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/html")
    assert response.headers["cache-control"] == "no-store"
    assert "<h1>ALEX MORGAN</h1>" in response.text


def test_pdf(client: TestClient, resume_data: dict[str, Any]) -> None:
    response = client.post("/v1/render/pdf", json=resume_data)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.headers["cache-control"] == "no-store"
    assert (
        response.headers["content-disposition"] == 'attachment; filename="ALEX-MORGAN-Resume.pdf"'
    )
    assert "NORTHWIND SYSTEMS LLC" in pdf_text(response.content)


def test_docx(client: TestClient, resume_data: dict[str, Any]) -> None:
    response = client.post("/v1/render/docx", json=resume_data)
    assert response.status_code == 200
    assert response.headers["content-type"] == DOCX_MEDIA_TYPE
    assert (
        response.headers["content-disposition"] == 'attachment; filename="ALEX-MORGAN-Resume.docx"'
    )
    assert "NORTHWIND SYSTEMS LLC" in docx_text(response.content)


@pytest.mark.parametrize("path", ["/v1/render/preview", "/v1/render/pdf", "/v1/render/docx"])
def test_invalid_body_is_rejected(client: TestClient, path: str) -> None:
    response = client.post(path, json={"full_name": "A", "email": "nope"})
    assert response.status_code == 422


def test_cors_allows_configured_origin(client: TestClient) -> None:
    response = client.options(
        "/v1/render/pdf",
        headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "POST"},
    )
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


def test_cors_rejects_other_origin(client: TestClient) -> None:
    response = client.options(
        "/v1/render/pdf",
        headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "POST"},
    )
    assert "access-control-allow-origin" not in response.headers


def test_docs_disabled_in_production() -> None:
    with TestClient(create_app(make_settings(environment="production"))) as client:
        assert client.get("/docs").status_code == 404
        assert client.get("/openapi.json").status_code == 404


def test_openapi_available_outside_production(client: TestClient) -> None:
    schema = client.get("/openapi.json").json()
    assert "Resume" in schema["components"]["schemas"]


@pytest.mark.parametrize(
    ("full_name", "expected"),
    [
        ("Alex Morgan", "Alex-Morgan-Resume.pdf"),
        ("  Jean-Luc  O'Neil ", "Jean-Luc-O-Neil-Resume.pdf"),
        ("محمد", "Resume.pdf"),
    ],
)
def test_download_filename(full_name: str, expected: str) -> None:
    assert download_filename(full_name, "pdf") == expected


class TestAuthentication:
    @pytest.fixture
    def auth_client(
        self, jwks: dict[str, Any], request: pytest.FixtureRequest
    ) -> Iterator[TestClient]:
        app = create_app(make_settings())
        jwk_client = getattr(request, "param", None) or StaticJWKClient(jwks)
        app.state.token_verifier = TokenVerifier(jwk_client)
        with TestClient(app) as client:
            yield client

    def test_missing_token(self, auth_client: TestClient, resume_data: dict[str, Any]) -> None:
        response = auth_client.post("/v1/render/preview", json=resume_data)
        assert response.status_code == 401
        assert response.headers["www-authenticate"] == "Bearer"

    def test_invalid_token(self, auth_client: TestClient, resume_data: dict[str, Any]) -> None:
        response = auth_client.post(
            "/v1/render/preview", json=resume_data, headers={"Authorization": "Bearer bad"}
        )
        assert response.status_code == 401

    def test_valid_token(
        self, auth_client: TestClient, resume_data: dict[str, Any], signing_key: Any
    ) -> None:
        token = make_token(signing_key)
        response = auth_client.post(
            "/v1/render/preview", json=resume_data, headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200

    @pytest.mark.parametrize("auth_client", [UnreachableJWKClient()], indirect=True)
    def test_jwks_unreachable(
        self, auth_client: TestClient, resume_data: dict[str, Any], signing_key: Any
    ) -> None:
        token = make_token(signing_key)
        response = auth_client.post(
            "/v1/render/preview", json=resume_data, headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 503

    def test_health_needs_no_token(self, auth_client: TestClient) -> None:
        assert auth_client.get("/health").status_code == 200
