"""
Attendance / Timesheet management API routes.

These endpoints are consumed by the frontend (Next.js) and forward
all requests to the Spring Boot Integration Core.  This gateway
NEVER accesses the attendance database directly — all data flows
through Spring Boot for RBAC enforcement, business logic, and
audit logging.
"""

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field

from dependencies import extract_token, get_client_ip
from spring_client import forward_request

router = APIRouter(prefix="/api/attendance", tags=["Attendance Management"])


# -- Request schemas -------------------------------------------------------

class AdjustAttendanceBody(BaseModel):
    work_days: int | None = Field(None, ge=0, alias="workDays", description="New work days count")
    absent_days: int | None = Field(None, ge=0, alias="absentDays", description="New absent days count")
    leave_days: int | None = Field(None, ge=0, alias="leaveDays", description="New leave days count")
    reason: str | None = Field(None, description="Reason for adjustment")

    model_config = {"populate_by_name": True}


# -- Helpers ----------------------------------------------------------------

def _spring_response(response) -> JSONResponse:
    """Convert an httpx response into a FastAPI JSONResponse."""
    return JSONResponse(
        status_code=response.status_code,
        content=response.json(),
    )


# -- GET /api/attendance ----------------------------------------------------

@router.get("")
async def list_attendance(
    request: Request,
    employee_id: int | None = Query(None, alias="employee_id"),
    department_id: int | None = Query(None, alias="department_id"),
    attendance_month: str | None = Query(None, alias="attendance_month"),
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=200),
    token: str = Depends(extract_token),
):
    """
    Paginated attendance list with optional filters.
    Forwards to: GET /internal/attendance
    """
    params: dict = {"page": page, "size": size}
    if employee_id is not None:
        params["employeeId"] = employee_id
    if department_id is not None:
        params["departmentId"] = department_id
    if attendance_month is not None:
        params["attendanceMonth"] = attendance_month

    response = await forward_request(
        "GET",
        "/internal/attendance",
        token,
        params=params,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)


# -- GET /api/attendance/export ---------------------------------------------
# NOTE: Defined BEFORE the {id} route so "/export" is not
#       captured as a path parameter.

@router.get("/export")
async def export_attendance(
    request: Request,
    employee_id: int | None = Query(None, alias="employee_id"),
    department_id: int | None = Query(None, alias="department_id"),
    attendance_month: str | None = Query(None, alias="attendance_month"),
    token: str = Depends(extract_token),
):
    """
    Export attendance report as Excel (.xlsx).
    Forwards to: GET /internal/attendance/export
    """
    params: dict = {}
    if employee_id is not None:
        params["employeeId"] = employee_id
    if department_id is not None:
        params["departmentId"] = department_id
    if attendance_month is not None:
        params["attendanceMonth"] = attendance_month

    response = await forward_request(
        "GET",
        "/internal/attendance/export",
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

    headers = {}
    if "content-disposition" in response.headers:
        headers["Content-Disposition"] = response.headers["content-disposition"]
    else:
        headers["Content-Disposition"] = "attachment; filename=attendance_report.xlsx"

    return StreamingResponse(
        iter([response.content]),
        status_code=200,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers,
    )


# -- GET /api/attendance/{id} -----------------------------------------------

@router.get("/{attendance_id}")
async def get_attendance(
    attendance_id: int,
    request: Request,
    token: str = Depends(extract_token),
):
    """
    Detailed attendance view.
    Forwards to: GET /internal/attendance/{id}
    """
    response = await forward_request(
        "GET",
        f"/internal/attendance/{attendance_id}",
        token,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)


# -- PATCH /api/attendance/{id}/adjust --------------------------------------

@router.patch("/{attendance_id}/adjust")
async def adjust_attendance(
    attendance_id: int,
    body: AdjustAttendanceBody,
    request: Request,
    token: str = Depends(extract_token),
):
    """
    Adjust attendance fields (work_days, absent_days, leave_days).
    Forwards to: PATCH /internal/attendance/{id}/adjust
    """
    payload: dict = {}
    if body.work_days is not None:
        payload["workDays"] = body.work_days
    if body.absent_days is not None:
        payload["absentDays"] = body.absent_days
    if body.leave_days is not None:
        payload["leaveDays"] = body.leave_days
    if body.reason is not None:
        payload["reason"] = body.reason

    response = await forward_request(
        "PATCH",
        f"/internal/attendance/{attendance_id}/adjust",
        token,
        json_body=payload,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)


# -- POST /api/attendance/{id}/approve --------------------------------------

@router.post("/{attendance_id}/approve")
async def approve_attendance(
    attendance_id: int,
    request: Request,
    token: str = Depends(extract_token),
):
    """
    Approve an attendance record.
    Forwards to: POST /internal/attendance/{id}/approve
    """
    response = await forward_request(
        "POST",
        f"/internal/attendance/{attendance_id}/approve",
        token,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)
