"""
Position management API routes.

These endpoints are consumed by the frontend (Next.js) and forward
all requests to the Spring Boot Integration Core for RBAC enforcement,
business logic, and audit logging.
"""

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from dependencies import extract_token, get_client_ip
from spring_client import forward_request

router = APIRouter(prefix="/api/positions", tags=["Position Management"])


# -- Request schemas -------------------------------------------------------

class CreatePositionBody(BaseModel):
    position_name: str = Field(..., min_length=1, max_length=100, alias="positionName")

    model_config = {"populate_by_name": True}


class UpdatePositionBody(BaseModel):
    position_name: str | None = Field(None, max_length=100, alias="positionName")

    model_config = {"populate_by_name": True}


# -- Helpers ----------------------------------------------------------------

def _spring_response(response) -> JSONResponse:
    """Convert an httpx response into a FastAPI JSONResponse."""
    return JSONResponse(
        status_code=response.status_code,
        content=response.json(),
    )


# -- GET /api/positions -----------------------------------------------------

@router.get("")
async def list_positions(
    request: Request,
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    token: str = Depends(extract_token),
):
    """
    Paginated position list.
    Forwards to: GET /internal/positions
    """
    params: dict = {"page": page, "size": size}

    response = await forward_request(
        "GET",
        "/internal/positions",
        token,
        params=params,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)


# -- GET /api/positions/{position_id} ---------------------------------------

@router.get("/{position_id}")
async def get_position(
    position_id: int,
    request: Request,
    token: str = Depends(extract_token),
):
    """
    Get a single position by ID.
    Forwards to: GET /internal/positions/{id}
    """
    response = await forward_request(
        "GET",
        f"/internal/positions/{position_id}",
        token,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)


# -- POST /api/positions ----------------------------------------------------

@router.post("", status_code=201)
async def create_position(
    body: CreatePositionBody,
    request: Request,
    token: str = Depends(extract_token),
):
    """
    Create a new position.
    Forwards to: POST /internal/positions
    """
    payload: dict = {
        "positionName": body.position_name,
    }

    response = await forward_request(
        "POST",
        "/internal/positions",
        token,
        json_body=payload,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)


# -- PUT /api/positions/{position_id} ---------------------------------------

@router.put("/{position_id}")
async def update_position(
    position_id: int,
    body: UpdatePositionBody,
    request: Request,
    token: str = Depends(extract_token),
):
    """
    Update an existing position.
    Forwards to: PUT /internal/positions/{id}
    """
    payload: dict = {}
    if body.position_name is not None:
        payload["positionName"] = body.position_name

    response = await forward_request(
        "PUT",
        f"/internal/positions/{position_id}",
        token,
        json_body=payload,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)


# -- DELETE /api/positions/{position_id} ------------------------------------

@router.delete("/{position_id}")
async def delete_position(
    position_id: int,
    request: Request,
    token: str = Depends(extract_token),
):
    """
    Delete a position by ID.
    Forwards to: DELETE /internal/positions/{id}
    """
    response = await forward_request(
        "DELETE",
        f"/internal/positions/{position_id}",
        token,
        forwarded_for=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    return _spring_response(response)
