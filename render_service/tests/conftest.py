import json
from collections.abc import Iterator
from typing import Any

import pytest
from cryptography.hazmat.primitives.asymmetric import ec
from fastapi.testclient import TestClient
from jwt.algorithms import ECAlgorithm

from app.config import Settings
from app.core.security import AuthenticatedUser
from app.dependencies import get_current_user
from app.main import create_app
from app.schemas.resume import Resume
from tests.helpers import FIXTURE, KID, SUPABASE_URL


@pytest.fixture(autouse=True)
def _isolate_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    for name in (
        "ENVIRONMENT",
        "SUPABASE_URL",
        "AUTH_DISABLED",
        "ALLOWED_ORIGINS",
        "RATE_LIMIT_PER_MINUTE",
        "MAX_BODY_BYTES",
    ):
        monkeypatch.delenv(name, raising=False)


def make_settings(**overrides: Any) -> Settings:
    values = {"environment": "test", "supabase_url": SUPABASE_URL, **overrides}
    return Settings(_env_file=None, **values)


@pytest.fixture
def resume_data() -> dict[str, Any]:
    return json.loads(FIXTURE.read_text(encoding="utf-8"))


@pytest.fixture
def resume(resume_data: dict[str, Any]) -> Resume:
    return Resume.model_validate(resume_data)


def make_client(user_id: str = "user-1", **settings: Any) -> TestClient:
    """A client for an app whose requests are all signed in as `user_id`."""
    app = create_app(make_settings(**settings))
    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(id=user_id)
    return TestClient(app)


@pytest.fixture
def client() -> Iterator[TestClient]:
    with make_client(allowed_origins=["http://localhost:3000"]) as test_client:
        yield test_client


@pytest.fixture(scope="session")
def signing_key() -> ec.EllipticCurvePrivateKey:
    return ec.generate_private_key(ec.SECP256R1())


@pytest.fixture(scope="session")
def jwks(signing_key: ec.EllipticCurvePrivateKey) -> dict[str, Any]:
    jwk = ECAlgorithm.to_jwk(signing_key.public_key(), as_dict=True)
    return {"keys": [{**jwk, "kid": KID, "alg": "ES256", "use": "sig"}]}
