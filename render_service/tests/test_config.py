import pytest
from pydantic import ValidationError

from tests.conftest import make_settings


def test_auth_disabled_only_in_development() -> None:
    assert make_settings(environment="development", auth_disabled=True).auth_disabled
    for environment in ("test", "production"):
        with pytest.raises(ValidationError, match="AUTH_DISABLED"):
            make_settings(environment=environment, auth_disabled=True)


def test_supabase_url_required_when_auth_enabled() -> None:
    with pytest.raises(ValidationError, match="SUPABASE_URL"):
        make_settings(supabase_url=None)


def test_allowed_origins_from_comma_separated_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ALLOWED_ORIGINS", "http://localhost:3000, https://app.example.com")
    settings = make_settings()
    assert settings.allowed_origins == ["http://localhost:3000", "https://app.example.com"]


def test_jwks_url() -> None:
    assert make_settings().jwks_url == "https://example.supabase.co/auth/v1/.well-known/jwks.json"
