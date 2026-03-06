"""
Payroll management API routes.

These endpoints are consumed by the frontend (Next.js) and forward
all requests to the Spring Boot Integration Core.  This gateway
NEVER accesses the payroll database directly — all data flows
through Spring Boot for RBAC enforcement, business logic, and
audit logging.
"""

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field

from dependencies import extract_token, get_client_ip
from spring_client import forward_request

router = APIRouter(prefix="/api/payroll", tags=["Payroll Management"])


# -- Request schemas -------------------------------------------------------

class AdjustSalaryBody(BaseModel):
    base_salary: float | None = Field(None, ge=0, alias="baseSalary", description="New base salary")
    bonus: float | None = Field(None, ge=0, description="New bonus amount")
    deductions: float | None = Field(None, ge=0, description="New deductions amount")
    net_salary: float | None = Field(None, ge=0, alias="netSalary", description="New net salary")

    model_config = {"populate_by_name": True}


class CreateSalaryBody(BaseModel):
    employee_id: int = Field(..., alias="employeeId", description="Employee ID")
    salary_month: str = Field(..., alias="salaryMonth", description="Salary month (yyyy-MM-dd)")
    base_salary: float = Field(..., ge=0, alias="baseSalary", description="Base salary")
    bonus: float | None = Field(None, ge=0, description="Bonus amount")
    deductions: float | None = Field(None, ge=0, description="Deductions amount")
    net_salary: float | None = Field(None, ge=0, alias="netSalary", description="Net salary")

    model_config = {"populate_by_name": True}


# -- Helpers ----------------------------------------------------------------

def _spring_response(response) -> JSONResponse:
    """Convert an httpx response into a FastAPI JSONResponse."""
    return JSONResponse(
        status_code=response.status_code,
        content=response.json(),
    )


# -- GET /api/payroll -------------------------------------------------------

@router.get("")
async def list_salaries(
    request: Request,
    employee_id: int | None = Query(None, alias="employee_id"),
    department_id: int | None = Query(None, alias="department_id"),
    salary_month: str | None = Query(None, alias="salary_month"),
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=200),
    token: str = Depends(extract_token),
):
    """
    Paginated salary list with optional filters.
    Forwards to: GET /internal/payroll
    """
    params: dict = {"page": page, "size": size}
    if employee_id is not None:
        params["employeeId"] = employee_id
    if department_id is not None:
        params["departmentId"] = department_id
    if salary_month is not None:
        params["salaryMonth"] = salary_month

    response = await forward_request(
        "GET",
        "/internal/payroll",
        token,
        params=params,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)


# -- GET /api/payroll/months ------------------------------------------------
# NOTE: Defined BEFORE the {salary_id} route so "/months" is not
#       captured as a path parameter.

@router.get("/months")
async def salary_months(
    request: Request,
    token: str = Depends(extract_token),
):
    """
    Distinct salary months (descending).
    Forwards to: GET /internal/payroll/months
    """
    response = await forward_request(
        "GET",
        "/internal/payroll/months",
        token,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)


# -- GET /api/payroll/export ------------------------------------------------
# NOTE: Defined BEFORE the {salary_id} route so "/export" is not
#       captured as a path parameter.

@router.get("/export")
async def export_salaries(
    request: Request,
    employee_id: int | None = Query(None, alias="employee_id"),
    department_id: int | None = Query(None, alias="department_id"),
    salary_month: str | None = Query(None, alias="salary_month"),
    token: str = Depends(extract_token),
):
    """
    Export salary report as Excel (.xlsx).
    Forwards to: GET /internal/payroll/export
    """
    params: dict = {}
    if employee_id is not None:
        params["employeeId"] = employee_id
    if department_id is not None:
        params["departmentId"] = department_id
    if salary_month is not None:
        params["salaryMonth"] = salary_month

    response = await forward_request(
        "GET",
        "/internal/payroll/export",
        token,
        params=params,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )

    if response.status_code != 200:
        return JSONResponse(
            status_code=response.status_code,
            content=response.json(),
        )

    # Stream the Excel file back to the frontend
    headers = {}
    if "content-disposition" in response.headers:
        headers["Content-Disposition"] = response.headers["content-disposition"]
    else:
        headers["Content-Disposition"] = "attachment; filename=salary_report.xlsx"

    return StreamingResponse(
        iter([response.content]),
        status_code=200,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers,
    )


# -- POST /api/payroll (create new salary) ----------------------------------
# NOTE: Defined BEFORE the {salary_id} route so it is not
#       captured as a path parameter.

@router.post("")
async def create_salary(
    body: CreateSalaryBody,
    request: Request,
    token: str = Depends(extract_token),
):
    """
    Create a new salary record.
    Forwards to: POST /internal/payroll
    """
    payload: dict = {
        "employeeId": body.employee_id,
        "salaryMonth": body.salary_month,
        "baseSalary": body.base_salary,
    }
    if body.bonus is not None:
        payload["bonus"] = body.bonus
    if body.deductions is not None:
        payload["deductions"] = body.deductions
    if body.net_salary is not None:
        payload["netSalary"] = body.net_salary

    response = await forward_request(
        "POST",
        "/internal/payroll",
        token,
        json_body=payload,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)


# -- GET /api/payroll/{salary_id} ------------------------------------------

@router.get("/{salary_id}")
async def get_salary(
    salary_id: int,
    request: Request,
    token: str = Depends(extract_token),
):
    """
    Detailed salary view.
    Forwards to: GET /internal/payroll/{salary_id}
    """
    response = await forward_request(
        "GET",
        f"/internal/payroll/{salary_id}",
        token,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)


# -- PATCH /api/payroll/{salary_id}/adjust ----------------------------------

@router.patch("/{salary_id}/adjust")
async def adjust_salary(
    salary_id: int,
    body: AdjustSalaryBody,
    request: Request,
    token: str = Depends(extract_token),
):
    """
    Adjust salary fields for a salary record.
    Forwards to: PATCH /internal/payroll/{salary_id}/adjust
    """
    payload: dict = {}
    if body.base_salary is not None:
        payload["baseSalary"] = body.base_salary
    if body.bonus is not None:
        payload["bonus"] = body.bonus
    if body.deductions is not None:
        payload["deductions"] = body.deductions
    if body.net_salary is not None:
        payload["netSalary"] = body.net_salary

    response = await forward_request(
        "PATCH",
        f"/internal/payroll/{salary_id}/adjust",
        token,
        json_body=payload,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)


# -- POST /api/payroll/{salary_id}/approve ----------------------------------

@router.post("/{salary_id}/approve")
async def approve_salary(
    salary_id: int,
    request: Request,
    token: str = Depends(extract_token),
):
    """
    Approve a salary record.
    Forwards to: POST /internal/payroll/{salary_id}/approve
    """
    response = await forward_request(
        "POST",
        f"/internal/payroll/{salary_id}/approve",
        token,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)
