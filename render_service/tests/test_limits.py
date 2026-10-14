import json
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.core.rate_limit import RateLimiter
from app.main import create_app
from tests.conftest import make_client, make_settings

SMALL = {"full_name": "A", "email": "a@example.com"}


class FakeClock:
    def __init__(self) -> None:
        self.now = 0.0

    def __call__(self) -> float:
        return self.now


def test_allows_up_to_the_limit_then_says_how_long_to_wait() -> None:
    clock = FakeClock()
    limiter = RateLimiter(limit=2, window_seconds=60, clock=clock)
    assert limiter.retry_after("a") is None
    clock.now = 10
    assert limiter.retry_after("a") is None
    clock.now = 20
    assert limiter.retry_after("a") == 40


def test_the_window_rolls() -> None:
    clock = FakeClock()
    limiter = RateLimiter(limit=1, window_seconds=60, clock=clock)
    assert limiter.retry_after("a") is None
    clock.now = 59
    assert limiter.retry_after("a") is not None
    clock.now = 60
    assert limiter.retry_after("a") is None


def test_keys_are_counted_separately() -> None:
    limiter = RateLimiter(limit=1, clock=FakeClock())
    assert limiter.retry_after("a") is None
    assert limiter.retry_after("b") is None
    assert limiter.retry_after("a") is not None


def test_refused_requests_do_not_extend_the_wait() -> None:
    clock = FakeClock()
    limiter = RateLimiter(limit=1, window_seconds=60, clock=clock)
    limiter.retry_after("a")
    clock.now = 30
    assert limiter.retry_after("a") == 30
    clock.now = 60
    assert limiter.retry_after("a") is None


def test_idle_keys_are_forgotten() -> None:
    clock = FakeClock()
    limiter = RateLimiter(limit=1, window_seconds=60, clock=clock)
    limiter.retry_after("a")
    clock.now = 61
    limiter.retry_after("b")
    assert list(limiter._hits) == ["b"]


def test_render_requests_are_rate_limited() -> None:
    with make_client(rate_limit_per_minute=2) as client:
        assert client.post("/v1/render/preview", json=SMALL).status_code == 200
        assert client.post("/v1/render/docx", json=SMALL).status_code == 200
        refused = client.post("/v1/render/preview", json=SMALL)
    assert refused.status_code == 429
    assert 1 <= int(refused.headers["retry-after"]) <= 60


def test_health_is_not_rate_limited() -> None:
    with make_client(rate_limit_per_minute=1) as client:
        assert [client.get("/health").status_code for _ in range(3)] == [200, 200, 200]


def test_an_unauthenticated_request_does_not_use_up_the_limit() -> None:
    app = create_app(make_settings(rate_limit_per_minute=1))
    with TestClient(app) as client:
        assert client.post("/v1/render/preview", json=SMALL).status_code == 401
        assert client.post("/v1/render/preview", json=SMALL).status_code == 401


def test_rejects_a_body_over_the_limit() -> None:
    with make_client(max_body_bytes=200) as client:
        assert client.post("/v1/render/preview", json=SMALL).status_code == 200
        big = {**SMALL, "location": "x" * 200}
        response = client.post("/v1/render/preview", json=big)
    assert response.status_code == 413


def test_rejects_a_body_without_a_declared_length() -> None:
    def chunks() -> Iterator[bytes]:
        yield json.dumps(SMALL).encode()

    with make_client() as client:
        response = client.post(
            "/v1/render/preview", content=chunks(), headers={"Content-Type": "application/json"}
        )
    assert response.status_code == 411


@pytest.mark.parametrize("setting", ["rate_limit_per_minute", "max_body_bytes"])
def test_limits_must_be_positive(setting: str) -> None:
    with pytest.raises(ValueError):
        make_settings(**{setting: 0})
