"""
Role management API routes.

These endpoints are consumed by the frontend (Next.js) and forward
all requests to the Spring Boot Integration Core for RBAC enforcement,
business logic, and audit logging.
"""

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from dependencies import extract_token, get_client_ip
from spring_client import forward_request

router = APIRouter(prefix="/api/roles", tags=["Role Management"])


# ── Request schemas (mirror Spring Boot DTOs) ────────────────────

class CreateRoleBody(BaseModel):
    code: str = Field(..., min_length=1, max_length=80)
    name: str = Field(..., min_length=1, max_length=150)
    description: str | None = None
    responsibility: str | None = None


class UpdateRoleBody(BaseModel):
    name: str | None = Field(None, max_length=150)
    description: str | None = None
    responsibility: str | None = None


class PermissionEntry(BaseModel):
    permission_id: int = Field(..., alias="permissionId")
    enabled: bool

    model_config = {"populate_by_name": True}


class AssignPermissionsBody(BaseModel):
    permissions: list[PermissionEntry] = Field(..., min_length=1)


# ── Helpers ───────────────────────────────────────────────────────

def _spring_response(response) -> JSONResponse:
    """Convert an httpx response into a FastAPI JSONResponse."""
    return JSONResponse(
        status_code=response.status_code,
        content=response.json(),
    )


# ── GET /api/roles ───────────────────────────────────────────────

@router.get("")
async def list_roles(
    request: Request,
    token: str = Depends(extract_token),
):
    """
    List all roles with user counts.
    Forwards to: GET /internal/roles
    """
    response = await forward_request(
        "GET",
        "/internal/roles",
        token,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)


# ── GET /api/roles/{role_id} ─────────────────────────────────────

@router.get("/{role_id}")
async def get_role(
    role_id: int,
    request: Request,
    token: str = Depends(extract_token),
):
    """
    Get detailed information for a specific role including permissions.
    Forwards to: GET /internal/roles/{id}
    """
    response = await forward_request(
        "GET",
        f"/internal/roles/{role_id}",
        token,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)


# ── POST /api/roles ──────────────────────────────────────────────

@router.post("", status_code=201)
async def create_role(
    body: CreateRoleBody,
    request: Request,
    token: str = Depends(extract_token),
):
    """
    Create a new role.
    Forwards to: POST /internal/roles
    """
    payload: dict = {
        "code": body.code,
        "name": body.name,
    }
    if body.description is not None:
        payload["description"] = body.description
    if body.responsibility is not None:
        payload["responsibility"] = body.responsibility

    response = await forward_request(
        "POST",
        "/internal/roles",
        token,
        json_body=payload,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)


# ── PUT /api/roles/{role_id} ─────────────────────────────────────

@router.put("/{role_id}")
async def update_role(
    role_id: int,
    body: UpdateRoleBody,
    request: Request,
    token: str = Depends(extract_token),
):
    """
    Update an existing role.
    Forwards to: PUT /internal/roles/{id}
    """
    payload: dict = {}
    if body.name is not None:
        payload["name"] = body.name
    if body.description is not None:
        payload["description"] = body.description
    if body.responsibility is not None:
        payload["responsibility"] = body.responsibility

    response = await forward_request(
        "PUT",
        f"/internal/roles/{role_id}",
        token,
        json_body=payload,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)


# ── PUT /api/roles/{role_id}/permissions ─────────────────────────

@router.put("/{role_id}/permissions")
async def assign_permissions(
    role_id: int,
    body: AssignPermissionsBody,
    request: Request,
    token: str = Depends(extract_token),
):
    """
    Assign or update permissions for a role.
    Forwards to: PUT /internal/roles/{id}/permissions
    """
    response = await forward_request(
        "PUT",
        f"/internal/roles/{role_id}/permissions",
        token,
        json_body={
            "permissions": [
                {"permissionId": p.permission_id, "enabled": p.enabled}
                for p in body.permissions
            ],
        },
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)
