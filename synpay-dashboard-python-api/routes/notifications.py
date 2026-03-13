"""
Notification and Email Queue API routes.

These endpoints are consumed by the frontend (Next.js) and forward
all requests to the Spring Boot Integration Core for RBAC enforcement,
business logic, and audit logging.

Responsibilities:
- Forward Authorization header unchanged
- Preserve request/response format
- Propagate HTTP status codes and error messages
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from dependencies import extract_token, get_client_ip
from spring_client import forward_request

logger = logging.getLogger("routes.notifications")

# Two separate routers for clarity and correct path prefixes
notifications_router = APIRouter(prefix="/api/notifications", tags=["Notifications"])
email_queue_router = APIRouter(prefix="/api/email-queue", tags=["Email Queue"])


# ── Request schemas ───────────────────────────────────────────────

class NotificationEventBody(BaseModel):
    """Request body for triggering notification events (internal use)."""
    trigger_event: str = Field(..., alias="triggerEvent")
    context_data: dict | None = Field(None, alias="contextData")

    model_config = {"populate_by_name": True}


# ── Helpers ───────────────────────────────────────────────────────

def _spring_response(response) -> JSONResponse:
    """Convert an httpx response into a FastAPI JSONResponse."""
    return JSONResponse(
        status_code=response.status_code,
        content=response.json(),
    )


# ── GET /api/notifications ──────────────────────────────────────

@notifications_router.get("")
async def list_notifications(
    request: Request,
    token: str = Depends(extract_token),
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    is_read: Optional[bool] = Query(None),
):
    """
    Get a paginated list of notifications for the current user.
    Optional filter by read status.

    Query parameters:
    - page: Page number (default 0)
    - size: Items per page (default 20, max 100)
    - is_read: Filter by read status (true|false|null for all)

    Forwards to: GET /internal/notifications
    """
    params: dict = {"page": page, "size": size}
    if is_read is not None:
        params["is_read"] = is_read

    response = await forward_request(
        "GET",
        "/internal/notifications",
        token,
        params=params,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)


# ── PATCH /api/notifications/{id}/read ──────────────────────────

@notifications_router.patch("/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: int,
    request: Request,
    token: str = Depends(extract_token),
):
    """
    Mark a specific notification as read.
    Ownership is verified by Spring Boot.

    Forwards to: PATCH /internal/notifications/{id}/read
    """
    response = await forward_request(
        "PATCH",
        f"/internal/notifications/{notification_id}/read",
        token,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)


# ── GET /api/notifications/admin ─────────────────────────────────

@notifications_router.get("/admin")
async def get_admin_notifications_view(
    request: Request,
    token: str = Depends(extract_token),
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
):
    """
    Admin view of all user notifications (requires notification.admin permission).

    Query parameters:
    - page: Page number (default 0)
    - size: Items per page (default 20, max 100)

    Forwards to: GET /internal/notifications/admin
    """
    params: dict = {"page": page, "size": size}

    response = await forward_request(
        "GET",
        "/internal/notifications/admin",
        token,
        params=params,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)


# ── GET /api/email-queue ────────────────────────────────────────

@email_queue_router.get("")
async def get_email_queue(
    request: Request,
    token: str = Depends(extract_token),
    status: str = Query(..., description="Filter by status: PENDING, SENT, or FAILED"),
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
):
    """
    Get paginated email queue entries filtered by status.
    Requires email_queue.view permission (admin only).

    Query parameters:
    - status: Email status filter (PENDING|SENT|FAILED) - REQUIRED
    - page: Page number (default 0)
    - size: Items per page (default 20, max 100)

    Forwards to: GET /internal/email-queue
    """
    params: dict = {"status": status, "page": page, "size": size}

    response = await forward_request(
        "GET",
        "/internal/email-queue",
        token,
        params=params,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)


# ── POST /api/email-queue/{id}/retry ────────────────────────────

@email_queue_router.post("/{email_id}/retry")
async def retry_failed_email(
    email_id: int,
    request: Request,
    token: str = Depends(extract_token),
):
    """
    Retry a failed email by moving it back to PENDING status.
    Only applies to emails with FAILED status.
    Requires email_queue.view permission (admin only).

    Forwards to: POST /internal/email-queue/{id}/retry
    """
    response = await forward_request(
        "POST",
        f"/internal/email-queue/{email_id}/retry",
        token,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)


# Export both routers for main.py to include
router = notifications_router  # For backward compatibility with import in main.py
