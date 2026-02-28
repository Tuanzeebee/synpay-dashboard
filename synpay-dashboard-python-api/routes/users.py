"""
User management API routes.

These endpoints are consumed by the frontend (Next.js) and forward
all requests to the Spring Boot Integration Core for RBAC enforcement,
business logic, and audit logging.
"""

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field

from dependencies import extract_token, get_client_ip
from spring_client import forward_request

router = APIRouter(prefix="/api/users", tags=["User Management"])


# ── Request schemas (mirror Spring Boot DTOs) ────────────────────

class CreateUserBody(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    employee_id: int = Field(..., alias="employeeId")
    role_ids: list[int] = Field(..., min_length=1, alias="roleIds")

    model_config = {"populate_by_name": True}


class UpdateUserBody(BaseModel):
    email: EmailStr | None = None
    password: str | None = Field(None, min_length=8, max_length=128)
    status: str | None = None
    role_ids: list[int] | None = Field(None, min_length=1, alias="roleIds")

    model_config = {"populate_by_name": True}


# ── Helpers ───────────────────────────────────────────────────────

def _spring_response(response) -> JSONResponse:
    """Convert an httpx response into a FastAPI JSONResponse."""
    return JSONResponse(
        status_code=response.status_code,
        content=response.json(),
    )


# ── GET /api/users ───────────────────────────────────────────────

@router.get("")
async def list_users(
    request: Request,
    token: str = Depends(extract_token),
):
    """
    List all user accounts with their assigned roles.
    Forwards to: GET /internal/users
    """
    response = await forward_request(
        "GET",
        "/internal/users",
        token,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)


# ── GET /api/users/{user_id} ─────────────────────────────────────

@router.get("/{user_id}")
async def get_user(
    user_id: int,
    request: Request,
    token: str = Depends(extract_token),
):
    """
    Get detailed information for a specific user account.
    Forwards to: GET /internal/users/{id}
    """
    response = await forward_request(
        "GET",
        f"/internal/users/{user_id}",
        token,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)


# ── POST /api/users ──────────────────────────────────────────────

@router.post("", status_code=201)
async def create_user(
    body: CreateUserBody,
    request: Request,
    token: str = Depends(extract_token),
):
    """
    Create a new user account.
    Forwards to: POST /internal/users
    """
    response = await forward_request(
        "POST",
        "/internal/users",
        token,
        json_body={
            "email": body.email,
            "password": body.password,
            "employeeId": body.employee_id,
            "roleIds": body.role_ids,
        },
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)


# ── PUT /api/users/{user_id} ─────────────────────────────────────

@router.put("/{user_id}")
async def update_user(
    user_id: int,
    body: UpdateUserBody,
    request: Request,
    token: str = Depends(extract_token),
):
    """
    Update an existing user account.
    Forwards to: PUT /internal/users/{id}
    """
    # Only send fields that were actually provided
    payload: dict = {}
    if body.email is not None:
        payload["email"] = body.email
    if body.password is not None:
        payload["password"] = body.password
    if body.status is not None:
        payload["status"] = body.status
    if body.role_ids is not None:
        payload["roleIds"] = body.role_ids

    response = await forward_request(
        "PUT",
        f"/internal/users/{user_id}",
        token,
        json_body=payload,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)
