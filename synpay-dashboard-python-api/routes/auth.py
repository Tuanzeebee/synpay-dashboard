"""
Authentication API routes.

These endpoints are public (no JWT required) and forward login
requests to the Spring Boot Integration Core, which performs all
credential validation, RBAC resolution, and JWT generation.
"""

import logging

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field

from dependencies import extract_token, get_client_ip
from spring_client import get_client, forward_request

logger = logging.getLogger("routes.auth")

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


# ── Request / Response schemas ────────────────────────────────────

class LoginBody(BaseModel):
    """Login request from the frontend."""
    email: EmailStr
    password: str = Field(..., min_length=1)


# ── Helpers ───────────────────────────────────────────────────────

def _spring_response(response) -> JSONResponse:
    """Convert an httpx response into a FastAPI JSONResponse."""
    return JSONResponse(
        status_code=response.status_code,
        content=response.json(),
    )


# ── POST /api/auth/login ─────────────────────────────────────────

@router.post("/login")
async def login(body: LoginBody, request: Request):
    """
    Authenticate user credentials.

    This endpoint receives login requests from the frontend and forwards
    them to the Spring Boot Integration Core at POST /internal/auth/login.
    Spring Boot handles:
      - Credential validation (email + hashed password)
      - Account status checks (active / inactive / locked)
      - Role and permission resolution
      - JWT access token generation
      - Audit logging (success / failure)

    Returns the Spring Boot response directly, which contains:
      - access_token
      - token_type
      - expires_in
      - account_id
      - role
      - employee_id
      - permissions (list of permission keys)
    """
    client_ip = get_client_ip(request)
    user_agent = request.headers.get("User-Agent")

    logger.info("Login attempt from %s for email=%s", client_ip, body.email)

    client = await get_client()

    headers: dict[str, str] = {}
    if client_ip:
        headers["X-Forwarded-For"] = client_ip
    if user_agent:
        headers["User-Agent"] = user_agent

    response = await client.request(
        method="POST",
        url="/internal/auth/login",
        headers=headers,
        json={
            "email": body.email,
            "password": body.password,
        },
    )

    logger.info(
        "Login result for email=%s → %d",
        body.email,
        response.status_code,
    )

    return _spring_response(response)


# ── POST /api/auth/logout ────────────────────────────────────────

@router.post("/logout")
async def logout(request: Request, token: str = Depends(extract_token)):
    """
    Log out the current user.

    This endpoint requires a valid JWT in the Authorization header.
    It forwards the logout request to Spring Boot, which:
      - Updates last_logout_at on the account
      - Records an audit log entry (LOGOUT)
    """
    client_ip = get_client_ip(request)
    user_agent = request.headers.get("User-Agent")

    logger.info("Logout attempt from %s", client_ip)

    response = await forward_request(
        method="POST",
        path="/internal/auth/logout",
        token=token,
        forwarded_for=client_ip,
        user_agent=user_agent,
    )

    logger.info("Logout result → %d", response.status_code)

    return _spring_response(response)
