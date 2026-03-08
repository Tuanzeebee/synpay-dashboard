"""
Dashboard API routes.

These endpoints are consumed by the frontend (Next.js) and forward
all requests to the Spring Boot Integration Core.  This gateway
NEVER accesses databases directly — all data flows through Spring Boot
for RBAC enforcement and data aggregation.
"""

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse

from dependencies import extract_token, get_client_ip
from spring_client import forward_request

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


# -- Helpers ----------------------------------------------------------------

def _spring_response(response) -> JSONResponse:
    """Convert an httpx response into a FastAPI JSONResponse."""
    return JSONResponse(
        status_code=response.status_code,
        content=response.json(),
    )


# -- GET /api/dashboard/overview --------------------------------------------

@router.get("/overview")
async def get_dashboard_overview(
    request: Request,
    token: str = Depends(extract_token),
    client_ip: str = Depends(get_client_ip),
):
    """
    Complete dashboard overview: KPI cards, chart datasets, and alerts.
    Requires: report.view_dashboard
    """
    resp = await forward_request(
        "GET",
        "/internal/dashboard/overview",
        token,
        forwarded_for=client_ip,
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(resp)


# -- GET /api/dashboard/hr --------------------------------------------------

@router.get("/hr")
async def get_dashboard_hr(
    request: Request,
    token: str = Depends(extract_token),
    client_ip: str = Depends(get_client_ip),
):
    """
    HR dashboard: employee counts, department distribution, headcount trend.
    Requires: report.view_hr
    """
    resp = await forward_request(
        "GET",
        "/internal/dashboard/hr",
        token,
        forwarded_for=client_ip,
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(resp)


# -- GET /api/dashboard/payroll ---------------------------------------------

@router.get("/payroll")
async def get_dashboard_payroll(
    request: Request,
    token: str = Depends(extract_token),
    client_ip: str = Depends(get_client_ip),
):
    """
    Payroll dashboard: monthly trend, department donut chart.
    Requires: report.view_payroll
    """
    resp = await forward_request(
        "GET",
        "/internal/dashboard/payroll",
        token,
        forwarded_for=client_ip,
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(resp)


# -- GET /api/dashboard/attendance ------------------------------------------

@router.get("/attendance")
async def get_dashboard_attendance(
    request: Request,
    token: str = Depends(extract_token),
    client_ip: str = Depends(get_client_ip),
):
    """
    Attendance dashboard: rates, leave days, absent days.
    Requires: report.view_dashboard
    """
    resp = await forward_request(
        "GET",
        "/internal/dashboard/attendance",
        token,
        forwarded_for=client_ip,
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(resp)


# -- GET /api/dashboard/activity --------------------------------------------

@router.get("/activity")
async def get_dashboard_activity(
    request: Request,
    token: str = Depends(extract_token),
    client_ip: str = Depends(get_client_ip),
):
    """
    Security activity dashboard: recent audit log entries.
    Requires: report.view_dashboard
    """
    resp = await forward_request(
        "GET",
        "/internal/dashboard/activity",
        token,
        forwarded_for=client_ip,
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(resp)
