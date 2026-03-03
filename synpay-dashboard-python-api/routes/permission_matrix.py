"""
Permission Matrix API routes.

These endpoints are consumed by the frontend (Next.js) and forward
all requests to the Spring Boot Integration Core for RBAC enforcement,
business logic, and audit logging.
"""

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from dependencies import extract_token, get_client_ip
from spring_client import forward_request

router = APIRouter(prefix="/api", tags=["Permission Matrix"])


# ── Request schemas (mirror Spring Boot DTOs) ────────────────────

class UpdatePermissionMatrixBody(BaseModel):
    role_id: int = Field(..., alias="roleId")
    domain: str = Field(..., min_length=1, max_length=80)
    action: str = Field(..., min_length=1, max_length=80)
    enabled: bool

    model_config = {"populate_by_name": True}


# ── Helpers ───────────────────────────────────────────────────────

def _spring_response(response) -> JSONResponse:
    """Convert an httpx response into a FastAPI JSONResponse."""
    return JSONResponse(
        status_code=response.status_code,
        content=response.json(),
    )


# ── GET /api/permission-matrix ───────────────────────────────────

@router.get("/permission-matrix")
async def get_permission_matrix(
    request: Request,
    token: str = Depends(extract_token),
):
    """
    Get the full permission matrix for all roles.
    Forwards to: GET /internal/permission-matrix
    """
    response = await forward_request(
        "GET",
        "/internal/permission-matrix",
        token,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)


# ── PUT /api/permission-matrix ───────────────────────────────────

@router.put("/permission-matrix")
async def update_permission_matrix(
    body: UpdatePermissionMatrixBody,
    request: Request,
    token: str = Depends(extract_token),
):
    """
    Toggle a single permission cell in the matrix.
    Forwards to: PUT /internal/permission-matrix
    """
    response = await forward_request(
        "PUT",
        "/internal/permission-matrix",
        token,
        json_body={
            "roleId": body.role_id,
            "domain": body.domain,
            "action": body.action,
            "enabled": body.enabled,
        },
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)


# ── GET /api/roles/{role_id}/permissions/summary ─────────────────

@router.get("/roles/{role_id}/permissions/summary")
async def get_permission_summary(
    role_id: int,
    request: Request,
    token: str = Depends(extract_token),
):
    """
    Get permission summary for a role, grouped by domain.
    Forwards to: GET /internal/roles/{id}/permissions/summary
    """
    response = await forward_request(
        "GET",
        f"/internal/roles/{role_id}/permissions/summary",
        token,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)
