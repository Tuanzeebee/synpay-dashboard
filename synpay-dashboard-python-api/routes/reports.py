"""
Reports & Analytics API routes.

These endpoints are consumed by the frontend (Next.js) and forward
all requests to the Spring Boot Integration Core.  This gateway
NEVER accesses databases directly — all data flows through Spring Boot
for RBAC enforcement and data aggregation.
"""

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import JSONResponse

from dependencies import extract_token, get_client_ip
from spring_client import forward_request

router = APIRouter(prefix="/api/reports", tags=["Reports & Analytics"])


# -- Helpers ----------------------------------------------------------------

def _spring_response(response) -> JSONResponse:
    """Convert an httpx response into a FastAPI JSONResponse."""
    return JSONResponse(
        status_code=response.status_code,
        content=response.json(),
    )


# -- GET /api/reports -------------------------------------------------------

@router.get("")
async def get_reports_data(
    request: Request,
    department: str | None = Query("all", description="Department filter key"),
    start_date: str | None = Query(None, alias="startDate", description="Start date (yyyy-MM-dd)"),
    end_date: str | None = Query(None, alias="endDate", description="End date (yyyy-MM-dd)"),
    token: str = Depends(extract_token),
    client_ip: str = Depends(get_client_ip),
):
    """
    Fetch aggregated reports & analytics data.

    Returns KPIs, department stats, salary trends, attendance rates,
    dividend trends, and performance scores.
    """
    params = {}
    if department:
        params["department"] = department
    if start_date:
        params["startDate"] = start_date
    if end_date:
        params["endDate"] = end_date

    resp = await forward_request(
        "GET",
        "/internal/reports",
        token,
        params=params,
        forwarded_for=client_ip,
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(resp)


# -- GET /api/reports/dashboard ---------------------------------------------

@router.get("/dashboard")
async def get_dashboard_report(
    request: Request,
    start_date: str | None = Query(None, alias="startDate"),
    end_date: str | None = Query(None, alias="endDate"),
    token: str = Depends(extract_token),
    client_ip: str = Depends(get_client_ip),
):
    """High-level dashboard KPIs overview."""
    params = _date_params(start_date, end_date)
    resp = await forward_request(
        "GET", "/internal/reports/dashboard", token,
        params=params, forwarded_for=client_ip,
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(resp)


# -- GET /api/reports/hr ----------------------------------------------------

@router.get("/hr")
async def get_hr_report(
    request: Request,
    department: str | None = Query("all"),
    start_date: str | None = Query(None, alias="startDate"),
    end_date: str | None = Query(None, alias="endDate"),
    token: str = Depends(extract_token),
    client_ip: str = Depends(get_client_ip),
):
    """Employee and department metrics."""
    params = _dept_date_params(department, start_date, end_date)
    resp = await forward_request(
        "GET", "/internal/reports/hr", token,
        params=params, forwarded_for=client_ip,
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(resp)


# -- GET /api/reports/payroll -----------------------------------------------

@router.get("/payroll")
async def get_payroll_report(
    request: Request,
    department: str | None = Query("all"),
    start_date: str | None = Query(None, alias="startDate"),
    end_date: str | None = Query(None, alias="endDate"),
    token: str = Depends(extract_token),
    client_ip: str = Depends(get_client_ip),
):
    """Salary totals, trends, and dividend data."""
    params = _dept_date_params(department, start_date, end_date)
    resp = await forward_request(
        "GET", "/internal/reports/payroll", token,
        params=params, forwarded_for=client_ip,
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(resp)


# -- GET /api/reports/attendance --------------------------------------------

@router.get("/attendance")
async def get_attendance_report(
    request: Request,
    department: str | None = Query("all"),
    start_date: str | None = Query(None, alias="startDate"),
    end_date: str | None = Query(None, alias="endDate"),
    token: str = Depends(extract_token),
    client_ip: str = Depends(get_client_ip),
):
    """Attendance rates, leave breakdowns."""
    params = _dept_date_params(department, start_date, end_date)
    resp = await forward_request(
        "GET", "/internal/reports/attendance", token,
        params=params, forwarded_for=client_ip,
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(resp)


# -- GET /api/reports/export ------------------------------------------------

@router.get("/export")
async def export_report(
    request: Request,
    department: str | None = Query("all"),
    start_date: str | None = Query(None, alias="startDate"),
    end_date: str | None = Query(None, alias="endDate"),
    token: str = Depends(extract_token),
    client_ip: str = Depends(get_client_ip),
):
    """Full data export (requires export permission)."""
    params = _dept_date_params(department, start_date, end_date)
    resp = await forward_request(
        "GET", "/internal/reports/export", token,
        params=params, forwarded_for=client_ip,
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(resp)


# -- GET /api/reports/dividends ---------------------------------------------

@router.get("/dividends")
async def get_dividends_report(
    request: Request,
    start_date: str | None = Query(None, alias="startDate"),
    end_date: str | None = Query(None, alias="endDate"),
    token: str = Depends(extract_token),
    client_ip: str = Depends(get_client_ip),
):
    """Dividend trend by quarter."""
    params = _date_params(start_date, end_date)
    resp = await forward_request(
        "GET", "/internal/reports/dividends", token,
        params=params, forwarded_for=client_ip,
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(resp)


# -- Internal helpers -------------------------------------------------------

def _date_params(start_date: str | None, end_date: str | None) -> dict:
    params = {}
    if start_date:
        params["startDate"] = start_date
    if end_date:
        params["endDate"] = end_date
    return params


def _dept_date_params(department: str | None, start_date: str | None, end_date: str | None) -> dict:
    params = _date_params(start_date, end_date)
    if department:
        params["department"] = department
    return params
