"""
SynPay Dashboard — Public API Gateway

This FastAPI application serves as the API gateway between the
frontend (Next.js) and the Spring Boot Integration Core.
"""

import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta

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
from routes.payroll import router as payroll_router
from routes.attendance import router as attendance_router
from routes.reports import router as reports_router
from routes.dashboard import router as dashboard_router
from routes.notifications import notifications_router, email_queue_router

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


# ── Security Headers Middleware ───────────────────────────────────
@app.middleware("http")
async def add_security_headers(request, call_next):
    """Add security headers to all responses."""
    response = await call_next(request)
    
    # CSP - Content Security Policy (XSS protection)
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "  # unsafe-inline for dev, remove in prod
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "font-src 'self' data:; "
        "connect-src 'self' http://localhost:* ws://localhost:*; "
        "frame-ancestors 'none'; "
        "base-uri 'self'; "
        "form-action 'self';"
    )
    
    # Prevent MIME type sniffing
    response.headers["X-Content-Type-Options"] = "nosniff"
    
    # Prevent clickjacking
    response.headers["X-Frame-Options"] = "DENY"
    
    # Enable XSS protection (legacy browsers)
    response.headers["X-XSS-Protection"] = "1; mode=block"
    
    # Referrer policy (privacy)
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    # Feature policy / Permissions policy
    response.headers["Permissions-Policy"] = (
        "geolocation=(), "
        "microphone=(), "
        "camera=(), "
        "payment=()"
    )
    
    return response

# ── Routes ────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(roles_router)
app.include_router(permission_matrix_router)
app.include_router(audit_logs_router)
app.include_router(employees_router)
app.include_router(departments_router)
app.include_router(positions_router)
app.include_router(payroll_router)
app.include_router(attendance_router)
app.include_router(reports_router)
app.include_router(dashboard_router)
app.include_router(notifications_router)
app.include_router(email_queue_router)


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "synpay-gateway"}
