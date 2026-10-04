import time
from collections import deque
from collections.abc import Callable
from threading import Lock


class RateLimiter:
    """Allows each key a fixed number of requests in any rolling window.

    Kept in memory, so the count is per process. That fits a single small instance; several
    instances would each allow the full limit.
    """

    def __init__(
        self,
        limit: int,
        window_seconds: float = 60,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        self._limit = limit
        self._window = window_seconds
        self._clock = clock
        self._hits: dict[str, deque[float]] = {}
        # Render handlers run in a threadpool, so requests reach this from several threads.
        self._lock = Lock()

    def retry_after(self, key: str) -> float | None:
        """Counts a request. Returns None if it's allowed, or how many seconds to wait."""
        now = self._clock()
        with self._lock:
            self._forget_idle_keys(now)
            hits = self._hits.setdefault(key, deque())
            if len(hits) >= self._limit:
                return hits[0] + self._window - now
            hits.append(now)
            return None

    def _forget_idle_keys(self, now: float) -> None:
        oldest_kept = now - self._window
        for key in list(self._hits):
            hits = self._hits[key]
            while hits and hits[0] <= oldest_kept:
                hits.popleft()
            if not hits:
                del self._hits[key]
