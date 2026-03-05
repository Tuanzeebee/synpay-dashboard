"""
Employee management API routes.

These endpoints are consumed by the frontend (Next.js) and forward
all requests to the Spring Boot Integration Core for RBAC enforcement,
business logic, and audit logging.
"""

from datetime import date

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field

from dependencies import extract_token, get_client_ip
from spring_client import forward_request

router = APIRouter(prefix="/api/employees", tags=["Employee Management"])


# ── Request schemas (mirror Spring Boot DTOs) ────────────────────

class CreateEmployeeBody(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=100, alias="fullName")
    date_of_birth: date = Field(..., alias="dateOfBirth")
    gender: str | None = Field(None, max_length=10)
    phone_number: str | None = Field(None, max_length=15, alias="phoneNumber")
    email: EmailStr | None = None
    hire_date: date = Field(..., alias="hireDate")
    department_id: int = Field(..., alias="departmentId")
    position_id: int = Field(..., alias="positionId")
    status: str | None = Field(None, max_length=50)

    model_config = {"populate_by_name": True}


class UpdateEmployeeBody(BaseModel):
    full_name: str | None = Field(None, max_length=100, alias="fullName")
    date_of_birth: date | None = Field(None, alias="dateOfBirth")
    gender: str | None = Field(None, max_length=10)
    phone_number: str | None = Field(None, max_length=15, alias="phoneNumber")
    email: EmailStr | None = None
    hire_date: date | None = Field(None, alias="hireDate")
    department_id: int | None = Field(None, alias="departmentId")
    position_id: int | None = Field(None, alias="positionId")

    model_config = {"populate_by_name": True}


class ChangeStatusBody(BaseModel):
    status: str = Field(..., min_length=1, max_length=50)


class AssignAccountBody(BaseModel):
    account_id: int = Field(..., alias="accountId")

    model_config = {"populate_by_name": True}


# ── Helpers ───────────────────────────────────────────────────────

def _spring_response(response) -> JSONResponse:
    """Convert an httpx response into a FastAPI JSONResponse."""
    return JSONResponse(
        status_code=response.status_code,
        content=response.json(),
    )


def _serialize_date(d: date | None) -> str | None:
    """ISO-format a date for JSON serialization."""
    return d.isoformat() if d else None


# ── GET /api/employees ────────────────────────────────────────────

@router.get("")
async def list_employees(
    request: Request,
    department_id: int | None = Query(None, alias="departmentId"),
    position_id: int | None = Query(None, alias="positionId"),
    status: str | None = Query(None),
    keyword: str | None = Query(None),
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    token: str = Depends(extract_token),
):
    """
    Paginated employee list with optional filters.
    Forwards to: GET /internal/employees
    """
    params: dict = {"page": page, "size": size}
    if department_id is not None:
        params["departmentId"] = department_id
    if position_id is not None:
        params["positionId"] = position_id
    if status is not None:
        params["status"] = status
    if keyword is not None:
        params["keyword"] = keyword

    response = await forward_request(
        "GET",
        "/internal/employees",
        token,
        params=params,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)


# ── GET /api/employees/{employee_id} ─────────────────────────────

@router.get("/{employee_id}")
async def get_employee(
    employee_id: int,
    request: Request,
    token: str = Depends(extract_token),
):
    """
    Get detailed information for a specific employee.
    Includes linked account info if available.
    Forwards to: GET /internal/employees/{id}
    """
    response = await forward_request(
        "GET",
        f"/internal/employees/{employee_id}",
        token,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)


# ── POST /api/employees ──────────────────────────────────────────

@router.post("", status_code=201)
async def create_employee(
    body: CreateEmployeeBody,
    request: Request,
    token: str = Depends(extract_token),
):
    """
    Create a new employee record.
    Forwards to: POST /internal/employees
    """
    payload: dict = {
        "fullName": body.full_name,
        "dateOfBirth": _serialize_date(body.date_of_birth),
        "hireDate": _serialize_date(body.hire_date),
        "departmentId": body.department_id,
        "positionId": body.position_id,
    }
    if body.gender is not None:
        payload["gender"] = body.gender
    if body.phone_number is not None:
        payload["phoneNumber"] = body.phone_number
    if body.email is not None:
        payload["email"] = body.email
    if body.status is not None:
        payload["status"] = body.status

    response = await forward_request(
        "POST",
        "/internal/employees",
        token,
        json_body=payload,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)


# ── PUT /api/employees/{employee_id} ─────────────────────────────

@router.put("/{employee_id}")
async def update_employee(
    employee_id: int,
    body: UpdateEmployeeBody,
    request: Request,
    token: str = Depends(extract_token),
):
    """
    Update an existing employee's profile.
    Forwards to: PUT /internal/employees/{id}
    """
    payload: dict = {}
    if body.full_name is not None:
        payload["fullName"] = body.full_name
    if body.date_of_birth is not None:
        payload["dateOfBirth"] = _serialize_date(body.date_of_birth)
    if body.gender is not None:
        payload["gender"] = body.gender
    if body.phone_number is not None:
        payload["phoneNumber"] = body.phone_number
    if body.email is not None:
        payload["email"] = body.email
    if body.hire_date is not None:
        payload["hireDate"] = _serialize_date(body.hire_date)
    if body.department_id is not None:
        payload["departmentId"] = body.department_id
    if body.position_id is not None:
        payload["positionId"] = body.position_id

    response = await forward_request(
        "PUT",
        f"/internal/employees/{employee_id}",
        token,
        json_body=payload,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)


# ── PATCH /api/employees/{employee_id}/status ─────────────────────

@router.patch("/{employee_id}/status")
async def change_employee_status(
    employee_id: int,
    body: ChangeStatusBody,
    request: Request,
    token: str = Depends(extract_token),
):
    """
    Change an employee's employment status.
    Forwards to: PATCH /internal/employees/{id}/status
    """
    response = await forward_request(
        "PATCH",
        f"/internal/employees/{employee_id}/status",
        token,
        json_body={"status": body.status},
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)


# ── POST /api/employees/{employee_id}/assign-account ──────────────

@router.post("/{employee_id}/assign-account")
async def assign_account(
    employee_id: int,
    body: AssignAccountBody,
    request: Request,
    token: str = Depends(extract_token),
):
    """
    Link an account to an employee. Privileged action.
    Forwards to: POST /internal/employees/{id}/assign-account
    """
    response = await forward_request(
        "POST",
        f"/internal/employees/{employee_id}/assign-account",
        token,
        json_body={"accountId": body.account_id},
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)


# -- DELETE /api/employees/{employee_id} -----------------------------------

@router.delete("/{employee_id}")
async def delete_employee(
    employee_id: int,
    request: Request,
    token: str = Depends(extract_token),
):
    """
    Delete an employee by ID.
    Forwards to: DELETE /internal/employees/{id}
    """
    response = await forward_request(
        "DELETE",
        f"/internal/employees/{employee_id}",
        token,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)
