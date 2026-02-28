"""
Dependency helpers shared across routes.
"""

from fastapi import Header, HTTPException, Request


def extract_token(authorization: str = Header(..., alias="Authorization")) -> str:
    """
    Extract the Bearer token from the Authorization header.
    Raises 401 if the header is missing or malformed.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization header")
    return authorization.removeprefix("Bearer ").strip()


def get_client_ip(request: Request) -> str:
    """Resolve the real client IP from X-Forwarded-For or the socket."""
    xff = request.headers.get("X-Forwarded-For")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
