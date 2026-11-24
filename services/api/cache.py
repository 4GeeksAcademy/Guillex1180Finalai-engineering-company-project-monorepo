"""Small thread-safe in-process TTL cache for derived API read responses."""

from __future__ import annotations

from copy import deepcopy
from threading import RLock
from time import monotonic
from typing import Any


class TTLCache:
    """Cache values until a monotonic deadline; callers must scope keys safely."""

    def __init__(self) -> None:
        self._items: dict[str, tuple[float, Any]] = {}
        self._lock = RLock()

    def get(self, key: str) -> Any | None:
        with self._lock:
            item = self._items.get(key)
            if item is None:
                return None
            expires_at, value = item
            if monotonic() >= expires_at:
                del self._items[key]
                return None
            return deepcopy(value)

    def set(self, key: str, value: Any, ttl_seconds: float) -> None:
        if ttl_seconds <= 0:
            raise ValueError("ttl_seconds must be greater than zero")
        with self._lock:
            self._items[key] = (monotonic() + ttl_seconds, deepcopy(value))

    def invalidate_prefix(self, prefix: str) -> None:
        with self._lock:
            for key in tuple(self._items):
                if key.startswith(prefix):
                    del self._items[key]

    def clear(self) -> None:
        with self._lock:
            self._items.clear()


response_cache = TTLCache()


# Inventory responses include stock and movement data. Always scope cache keys
# to the authenticated identity to prevent cross-user response reuse.
def inventory_cache_prefix(user_uuid: str) -> str:
    return f"inventory:user:{user_uuid}:"
