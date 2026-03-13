"""
Authentication API routes.

These endpoints are public (no JWT required) and forward login
requests to the Spring Boot Integration Core, which performs all
credential validation, RBAC resolution, and JWT generation.

Refresh tokens are stored as httpOnly cookies and never exposed to JavaScript.
"""

import logging
import os

from fastapi import APIRouter, Depends, Request, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field

from dependencies import extract_token, get_client_ip
from spring_client import get_client, forward_request
from security import add_token_to_blacklist, is_token_blacklisted

logger = logging.getLogger("routes.auth")

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Refresh token cookie settings
_REFRESH_COOKIE_NAME = "synpay_refresh_token"
_REFRESH_COOKIE_MAX_AGE = 7 * 24 * 3600  # 7 days
_SECURE_COOKIE = os.getenv("COOKIE_SECURE", "false").lower() == "true"


# ── Request / Response schemas ────────────────────────────────────

class LoginBody(BaseModel):
    """Login request from the frontend."""
    email: EmailStr
    password: str = Field(..., min_length=1)


# ── Helpers ───────────────────────────────────────────────────────

def _build_headers(client_ip: str | None, user_agent: str | None) -> dict[str, str]:
    """Build forwarding headers for Spring Boot requests."""
    headers: dict[str, str] = {}
    if client_ip:
        headers["X-Forwarded-For"] = client_ip
    if user_agent:
        headers["User-Agent"] = user_agent
    return headers


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    """Set the refresh token as a secure httpOnly cookie."""
    response.set_cookie(
        key=_REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=_SECURE_COOKIE,  # False for localhost HTTP, True for production HTTPS
        samesite="lax",  # "lax" works with HTTP; change to "none" only when using HTTPS
        max_age=_REFRESH_COOKIE_MAX_AGE,
        path="/",  # Root path so cookie is sent to all /api/* endpoints
        domain="localhost",  # CRITICAL: Share cookie across localhost:3000 and localhost:8000
    )


def _delete_refresh_cookie(response: Response) -> None:
    """Remove the refresh token cookie."""
    response.delete_cookie(
        key=_REFRESH_COOKIE_NAME,
        httponly=True,
        secure=_SECURE_COOKIE,
        samesite="lax",
        path="/",
        domain="localhost",  # Match the domain from set_cookie
    )


# ── POST /api/auth/login ─────────────────────────────────────────

@router.post("/login")
async def login(body: LoginBody, request: Request, response: Response):
    """
    Authenticate user credentials.

    Forwards login to Spring Boot, extracts the refresh token from the
    response, sets it as an httpOnly cookie, and returns the remaining
    data (access_token etc.) to the frontend.
    """
    client_ip = get_client_ip(request)
    user_agent = request.headers.get("User-Agent")
    headers = _build_headers(client_ip, user_agent)

    logger.info("Login attempt from %s for email=%s", client_ip, body.email)

    client = await get_client()
    spring_response = await client.request(
        method="POST",
        url="/internal/auth/login",
        headers=headers,
        json={"email": body.email, "password": body.password},
    )

    logger.info("Login result for email=%s → %d", body.email, spring_response.status_code)

    body_json = spring_response.json()
    logger.info(f"   Spring response body: {body_json}")

    # On successful login, extract refresh_token → set as httpOnly cookie
    # Also keep it in response body for frontend to store locally for cross-origin requests
    if spring_response.status_code == 200 and body_json.get("success"):
        data = body_json.get("data", {})
        refresh_token = data.get("refresh_token")  # Get without pop - keep in response
        logger.info(f"   Refresh token present in response: {bool(refresh_token)}")
        if refresh_token:
            # Also set as httpOnly cookie for backward compatibility
            logger.info(f"Setting refresh token cookie")
            _set_refresh_cookie(response, refresh_token)
    else:
        logger.warning(f"Login not successful: status={spring_response.status_code}, success={body_json.get('success')}")

    # Return response WITH refresh_token (frontend will save to localStorage)
    return JSONResponse(status_code=spring_response.status_code, content=body_json)


# ── POST /api/auth/refresh ───────────────────────────────────────

class RefreshBody(BaseModel):
    """Refresh token request from frontend (sent in body)."""
    refresh_token: str = Field(..., min_length=1)


@router.post("/refresh")
async def refresh(request: Request, response: Response, body: RefreshBody = None):
    """
    Refresh an expired access token.

    Accepts refresh_token from either:
    - Request body (JSON) for frontend (cross-origin safe)
    - httpOnly cookie for backward compatibility
    
    Forwards to Spring Boot for validation and rotation.
    """
    client_ip = get_client_ip(request)
    user_agent = request.headers.get("User-Agent")
    headers = _build_headers(client_ip, user_agent)

    # Try to get refresh_token from request body first (frontend), then cookie (legacy)
    refresh_token = body.refresh_token if body else None
    if not refresh_token:
        refresh_token = request.cookies.get(_REFRESH_COOKIE_NAME)
    
    logger.info(f"Refresh attempt from {client_ip}")
    logger.info(f"   Source: {'body' if body and body.refresh_token else 'cookie'}")
    logger.info(f"   Refresh token present: {bool(refresh_token)}")
    
    if not refresh_token:
        logger.warning(f"No refresh token provided (body={body}, cookies={list(request.cookies.keys())})")
        _delete_refresh_cookie(response)
        return JSONResponse(
            status_code=401,
            content={
                "success": False,
                "error": {"code": "REFRESH_TOKEN_MISSING", "message": "No refresh token provided"},
            },
        )

    client = await get_client()
    spring_response = await client.request(
        method="POST",
        url="/internal/auth/refresh",
        headers=headers,
        json={"refreshToken": refresh_token},
    )

    body_json = spring_response.json()
    
    logger.info(f"Spring Boot response status: {spring_response.status_code}")

    if spring_response.status_code == 200 and body_json.get("success"):
        data = body_json.get("data", {})
        new_refresh_token = data.get("refresh_token")
        if new_refresh_token:
            logger.info(f"Refresh successful, new token issued")
            _set_refresh_cookie(response, new_refresh_token)
    else:
        logger.error(f"Refresh failed from Spring Boot: {body_json.get('error', 'unknown error')}")
        _delete_refresh_cookie(response)

    return JSONResponse(status_code=spring_response.status_code, content=body_json)


# ── POST /api/auth/logout ────────────────────────────────────────

@router.post("/logout")
async def logout(request: Request, response: Response, token: str = Depends(extract_token)):
    """
    Log out the current user.

    - Clears the refresh token cookie
    - Adds access token to blacklist (prevents reuse)
    - Forwards logout to Spring Boot
    """
    client_ip = get_client_ip(request)
    user_agent = request.headers.get("User-Agent")

    logger.info("Logout attempt from %s", client_ip)

    # Add access token to blacklist to prevent reuse
    add_token_to_blacklist(token)
    
    _delete_refresh_cookie(response)

    spring_response = await forward_request(
        method="POST",
        path="/internal/auth/logout",
        token=token,
        forwarded_for=client_ip,
        user_agent=user_agent,
    )

    logger.info("Logout result → %d", spring_response.status_code)

    return JSONResponse(status_code=spring_response.status_code, content=spring_response.json())
