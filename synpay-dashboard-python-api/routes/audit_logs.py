"""
Audit Log API routes.

These endpoints are consumed by the frontend (Next.js) and forward
all requests to the Spring Boot Integration Core for RBAC enforcement,
pagination, filtering, and CSV export.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field

from dependencies import extract_token, get_client_ip
from spring_client import forward_request

logger = logging.getLogger("routes.audit_logs")

router = APIRouter(prefix="/api/audit-logs", tags=["Audit Logs"])


# ── Request schemas ───────────────────────────────────────────────

class AuditLogExportBody(BaseModel):
    """Optional filter body for the CSV export endpoint."""
    actor_email: Optional[str] = Field(None, alias="actorEmail")
    action: Optional[str] = None
    resource: Optional[str] = None
    date_from: Optional[str] = Field(None, alias="dateFrom")
    date_to: Optional[str] = Field(None, alias="dateTo")
    format: Optional[str] = None

    model_config = {"populate_by_name": True}


# ── Helpers ───────────────────────────────────────────────────────

def _spring_response(response) -> JSONResponse:
    """Convert an httpx response into a FastAPI JSONResponse."""
    return JSONResponse(
        status_code=response.status_code,
        content=response.json(),
    )


# ── GET /api/audit-logs ──────────────────────────────────────────

@router.get("")
async def list_audit_logs(
    request: Request,
    token: str = Depends(extract_token),
    actorEmail: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    resource: Optional[str] = Query(None),
    dateFrom: Optional[str] = Query(None),
    dateTo: Optional[str] = Query(None),
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
):
    """
    Get a paginated, filtered list of audit log entries.
    Forwards to: GET /internal/audit-logs
    """
    params: dict = {"page": page, "size": size}
    if actorEmail:
        params["actorEmail"] = actorEmail
    if action:
        params["action"] = action
    if resource:
        params["resource"] = resource
    if dateFrom:
        params["dateFrom"] = dateFrom
    if dateTo:
        params["dateTo"] = dateTo

    response = await forward_request(
        "GET",
        "/internal/audit-logs",
        token,
        params=params,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)


# ── GET /api/audit-logs/{id} ─────────────────────────────────────

@router.get("/{audit_id}")
async def get_audit_log(
    audit_id: int,
    request: Request,
    token: str = Depends(extract_token),
):
    """
    Get a single audit log entry by ID.
    Forwards to: GET /internal/audit-logs/{id}
    """
    response = await forward_request(
        "GET",
        f"/internal/audit-logs/{audit_id}",
        token,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)


# ── POST /api/audit-logs/export ───────────────────────────────────

@router.post("/export")
async def export_audit_logs(
    request: Request,
    token: str = Depends(extract_token),
    body: AuditLogExportBody | None = None,
):
    """
    Export audit logs as CSV.
    Forwards to: POST /internal/audit-logs/export

    Spring Boot returns CSV text; we pass it through as-is.
    """
    json_body = body.model_dump(by_alias=True, exclude_none=True) if body else {}

    response = await forward_request(
        "POST",
        "/internal/audit-logs/export",
        token,
        json_body=json_body,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )

    # Spring Boot returns CSV with Content-Type: text/csv
    content_type = response.headers.get("content-type", "")
    if "text/csv" in content_type:
        return Response(
            content=response.content,
            status_code=response.status_code,
            media_type="text/csv; charset=UTF-8",
            headers={
                "Content-Disposition": response.headers.get(
                    "content-disposition",
                    'attachment; filename="audit-logs-export.csv"',
                ),
            },
        )

    # If Spring returned JSON (error response), forward as JSON
    return _spring_response(response)
