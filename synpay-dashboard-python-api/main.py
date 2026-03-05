"""
SynPay Dashboard — Public API Gateway

This FastAPI application serves as the API gateway between the
frontend (Next.js) and the Spring Boot Integration Core.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from spring_client import close_client
from routes.auth import router as auth_router
from routes.users import router as users_router
from routes.roles import router as roles_router
from routes.permission_matrix import router as permission_matrix_router
from routes.audit_logs import router as audit_logs_router
from routes.employees import router as employees_router
from routes.departments import router as departments_router
from routes.positions import router as positions_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-5s [%(name)s] %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    logging.getLogger("gateway").info("Gateway starting …")
    yield
    await close_client()
    logging.getLogger("gateway").info("Gateway stopped.")


app = FastAPI(
    title="SynPay Dashboard API Gateway",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(roles_router)
app.include_router(permission_matrix_router)
app.include_router(audit_logs_router)
app.include_router(employees_router)
app.include_router(departments_router)
app.include_router(positions_router)


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "synpay-gateway"}
