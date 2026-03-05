"""
Department management API routes.

These endpoints are consumed by the frontend (Next.js) and forward
all requests to the Spring Boot Integration Core for RBAC enforcement,
business logic, and audit logging.
"""

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from dependencies import extract_token, get_client_ip
from spring_client import forward_request

router = APIRouter(prefix="/api/departments", tags=["Department Management"])


# -- Request schemas -------------------------------------------------------

class CreateDepartmentBody(BaseModel):
    department_name: str = Field(..., min_length=1, max_length=100, alias="departmentName")

    model_config = {"populate_by_name": True}


class UpdateDepartmentBody(BaseModel):
    department_name: str | None = Field(None, max_length=100, alias="departmentName")

    model_config = {"populate_by_name": True}


# -- Helpers ----------------------------------------------------------------

def _spring_response(response) -> JSONResponse:
    """Convert an httpx response into a FastAPI JSONResponse."""
    return JSONResponse(
        status_code=response.status_code,
        content=response.json(),
    )


# -- GET /api/departments ---------------------------------------------------

@router.get("")
async def list_departments(
    request: Request,
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    token: str = Depends(extract_token),
):
    """
    Paginated department list.
    Forwards to: GET /internal/departments
    """
    params: dict = {"page": page, "size": size}

    response = await forward_request(
        "GET",
        "/internal/departments",
        token,
        params=params,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)


# -- GET /api/departments/{department_id} -----------------------------------

@router.get("/{department_id}")
async def get_department(
    department_id: int,
    request: Request,
    token: str = Depends(extract_token),
):
    """
    Get a single department by ID.
    Forwards to: GET /internal/departments/{id}
    """
    response = await forward_request(
        "GET",
        f"/internal/departments/{department_id}",
        token,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)


# -- POST /api/departments --------------------------------------------------

@router.post("", status_code=201)
async def create_department(
    body: CreateDepartmentBody,
    request: Request,
    token: str = Depends(extract_token),
):
    """
    Create a new department.
    Forwards to: POST /internal/departments
    """
    payload: dict = {
        "departmentName": body.department_name,
    }

    response = await forward_request(
        "POST",
        "/internal/departments",
        token,
        json_body=payload,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)


# -- PUT /api/departments/{department_id} -----------------------------------

@router.put("/{department_id}")
async def update_department(
    department_id: int,
    body: UpdateDepartmentBody,
    request: Request,
    token: str = Depends(extract_token),
):
    """
    Update an existing department.
    Forwards to: PUT /internal/departments/{id}
    """
    payload: dict = {}
    if body.department_name is not None:
        payload["departmentName"] = body.department_name

    response = await forward_request(
        "PUT",
        f"/internal/departments/{department_id}",
        token,
        json_body=payload,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)


# -- DELETE /api/departments/{department_id} --------------------------------

@router.delete("/{department_id}")
async def delete_department(
    department_id: int,
    request: Request,
    token: str = Depends(extract_token),
):
    """
    Delete a department by ID.
    Forwards to: DELETE /internal/departments/{id}
    """
    response = await forward_request(
        "DELETE",
        f"/internal/departments/{department_id}",
        token,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)
