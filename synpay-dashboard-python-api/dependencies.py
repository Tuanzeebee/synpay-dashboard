"""
Dependency helpers shared across routes.
"""

from fastapi import Header, HTTPException, Request


def extract_token(authorization: str | None = Header(None, alias="Authorization")) -> str:
    """
    Extract the Bearer token from the Authorization header.
    Raises 401 if the header is missing or malformed.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Empty token")
    return token


def get_client_ip(request: Request) -> str:
    """Resolve the real client IP from X-Forwarded-For or the socket."""
    xff = request.headers.get("X-Forwarded-For")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
