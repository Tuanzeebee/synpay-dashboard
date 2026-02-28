"""
HTTP client for forwarding requests to the Spring Boot Integration Core.

Every outgoing request carries the original JWT so that Spring Boot
can perform its own authentication and RBAC checks.
"""

import httpx
import logging
from config import SPRING_BOOT_BASE_URL

logger = logging.getLogger("spring_client")

# Shared async client — reuses connections across requests
_client: httpx.AsyncClient | None = None


async def get_client() -> httpx.AsyncClient:
    """Return (and lazily create) the shared async HTTP client."""
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(
            base_url=SPRING_BOOT_BASE_URL,
            timeout=httpx.Timeout(30.0),
        )
    return _client


async def close_client() -> None:
    """Gracefully close the HTTP client (called on app shutdown)."""
    global _client
    if _client and not _client.is_closed:
        await _client.aclose()
        _client = None


async def forward_request(
    method: str,
    path: str,
    token: str,
    *,
    json_body: dict | None = None,
    params: dict | None = None,
    forwarded_for: str | None = None,
    user_agent: str | None = None,
) -> httpx.Response:
    """
    Forward a request to Spring Boot with the caller's JWT.

    Args:
        method:        HTTP method (GET, POST, PUT, …)
        path:          Spring Boot path, e.g. "/internal/users"
        token:         Bearer JWT from the frontend
        json_body:     Optional JSON request body
        params:        Optional query parameters
        forwarded_for: Client IP to pass via X-Forwarded-For
        user_agent:    Client User-Agent to forward
    """
    client = await get_client()

    headers: dict[str, str] = {"Authorization": f"Bearer {token}"}
    if forwarded_for:
        headers["X-Forwarded-For"] = forwarded_for
    if user_agent:
        headers["User-Agent"] = user_agent

    logger.info("→ %s %s", method.upper(), path)

    response = await client.request(
        method=method.upper(),
        url=path,
        headers=headers,
        json=json_body,
        params=params,
    )

    logger.info("← %s %s → %d", method.upper(), path, response.status_code)
    return response
