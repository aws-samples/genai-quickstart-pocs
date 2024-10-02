from __future__ import annotations

import logging
import re
from typing import TYPE_CHECKING, Any, List, Optional, Pattern

import numpy as np

logger = logging.getLogger(__name__)

if TYPE_CHECKING:
    from redis.client import Redis as RedisType  # type: ignore[import-untyped]


def _array_to_buffer(array: List[float], dtype: Any = np.float32) -> bytes:
    return np.array(array).astype(dtype).tobytes()


def _buffer_to_array(buffer: bytes, dtype: Any = np.float32) -> List[float]:
    return np.frombuffer(buffer, dtype=dtype).tolist()


class TokenEscaper:
    """
    Escape punctuation within an input string.
    """

    # Characters that RediSearch requires us to escape during queries.
    # Source: https://redis.io/docs/stack/search/reference/escaping/#the-rules-of-text-field-tokenization
    DEFAULT_ESCAPED_CHARS = r"[,.<>{}\[\]\\\"\':;!@#$%^&*()\-+=~\/ ]"

    def __init__(self, escape_chars_re: Optional[Pattern] = None):
        if escape_chars_re:
            self.escaped_chars_re = escape_chars_re
        else:
            self.escaped_chars_re = re.compile(self.DEFAULT_ESCAPED_CHARS)

    def escape(self, value: str) -> str:
        if not isinstance(value, str):
            raise TypeError(
                "Value must be a string object for token escaping."
                f"Got type {type(value)}"
            )

        def escape_symbol(match: re.Match) -> str:
            value = match.group(0)
            return f"\\{value}"

        return self.escaped_chars_re.sub(escape_symbol, value)


def get_client(redis_url: str, **kwargs: Any) -> RedisType:
    """Get a redis client from the connection url given. This helper accepts
    urls for Redis server (TCP with/without TLS or UnixSocket) as well as
    Redis Sentinel connections.

    Before creating a connection the existence of the database driver is checked
    and ValueError raised otherwise.

    To use, you should have the ``redis`` python package installed.

    Example:
        .. code-block:: python

            from langchain_community.utilities.redis import get_client
            redis_client = get_client(
                redis_url="redis://username:password@localhost:6379"
                index_name="my-index",
                embedding_function=embeddings.embed_query,
            )

    """

    # Initialize with necessary components.
    try:
        import redis  # type: ignore[import-untyped]
    except ImportError:
        raise ImportError(
            "Could not import redis python package. "
            "Please install it with `pip install redis>=4.1.0`."
        )

    # Connect to redis server from url, reconnect with cluster client if needed
    redis_client = redis.from_url(redis_url, **kwargs)
    if _check_for_cluster(redis_client):
        redis_client.close()
        redis_client = _redis_cluster_client(redis_url, **kwargs)

    return redis_client


def _check_for_cluster(redis_client: RedisType) -> bool:
    import redis

    try:
        cluster_info = redis_client.info("cluster")
        return cluster_info["cluster_enabled"] == 1
    except redis.exceptions.RedisError:
        return False


def _redis_cluster_client(redis_url: str, **kwargs: Any) -> RedisType:
    from redis.cluster import RedisCluster  # type: ignore[import-untyped]

    return RedisCluster.from_url(redis_url, **kwargs)  # type: ignore[return-value]
