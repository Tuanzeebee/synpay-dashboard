"""
Dependency helpers shared across routes.
"""

from fastapi import Header, HTTPException, Request
from security import is_token_blacklisted


def extract_token(authorization: str | None = Header(None, alias="Authorization")) -> str:
    """
    Extract the Bearer token from the Authorization header.
    
    Raises 401 if:
    - Header is missing or malformed
    - Token is empty
    - Token is blacklisted (logged out)
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    
    token = authorization.removeprefix("Bearer ").strip()
    
    if not token:
        raise HTTPException(status_code=401, detail="Empty token")
    
    # Check if token was blacklisted (e.g., user logged out)
    if is_token_blacklisted(token):
        raise HTTPException(status_code=401, detail="Token has been invalidated (logged out)")
    
    return token


def get_client_ip(request: Request) -> str:
    """Resolve the real client IP from X-Forwarded-For or the socket."""
    xff = request.headers.get("X-Forwarded-For")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
