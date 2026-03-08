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
        secure=_SECURE_COOKIE,
        samesite="strict",
        max_age=_REFRESH_COOKIE_MAX_AGE,
        path="/api/auth",
    )


def _delete_refresh_cookie(response: Response) -> None:
    """Remove the refresh token cookie."""
    response.delete_cookie(
        key=_REFRESH_COOKIE_NAME,
        httponly=True,
        secure=_SECURE_COOKIE,
        samesite="strict",
        path="/api/auth",
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

    # On successful login, extract refresh_token → httpOnly cookie
    if spring_response.status_code == 200 and body_json.get("success"):
        data = body_json.get("data", {})
        refresh_token = data.pop("refresh_token", None)
        if refresh_token:
            _set_refresh_cookie(response, refresh_token)

    return JSONResponse(status_code=spring_response.status_code, content=body_json)


# ── POST /api/auth/refresh ───────────────────────────────────────

@router.post("/refresh")
async def refresh(request: Request, response: Response):
    """
    Refresh an expired access token.

    Reads the refresh token from the httpOnly cookie, forwards it to
    Spring Boot for validation and rotation, then updates the cookie
    with the new refresh token.
    """
    client_ip = get_client_ip(request)
    user_agent = request.headers.get("User-Agent")
    headers = _build_headers(client_ip, user_agent)

    refresh_token = request.cookies.get(_REFRESH_COOKIE_NAME)
    if not refresh_token:
        _delete_refresh_cookie(response)
        return JSONResponse(
            status_code=401,
            content={
                "success": False,
                "error": {"code": "REFRESH_TOKEN_MISSING", "message": "No refresh token provided"},
            },
        )

    logger.info("Refresh attempt from %s", client_ip)

    client = await get_client()
    spring_response = await client.request(
        method="POST",
        url="/internal/auth/refresh",
        headers=headers,
        json={"refreshToken": refresh_token},
    )

    body_json = spring_response.json()

    if spring_response.status_code == 200 and body_json.get("success"):
        data = body_json.get("data", {})
        new_refresh_token = data.pop("refresh_token", None)
        if new_refresh_token:
            _set_refresh_cookie(response, new_refresh_token)
    else:
        # Refresh failed — clear the cookie
        _delete_refresh_cookie(response)

    logger.info("Refresh result → %d", spring_response.status_code)

    return JSONResponse(status_code=spring_response.status_code, content=body_json)


# ── POST /api/auth/logout ────────────────────────────────────────

@router.post("/logout")
async def logout(request: Request, response: Response, token: str = Depends(extract_token)):
    """
    Log out the current user.

    Clears the refresh token cookie and forwards logout to Spring Boot.
    """
    client_ip = get_client_ip(request)
    user_agent = request.headers.get("User-Agent")

    logger.info("Logout attempt from %s", client_ip)

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
