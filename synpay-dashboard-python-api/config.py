"""
Application configuration loaded from environment variables.
"""

import os
from dotenv import load_dotenv

load_dotenv()


def _env(key: str, default: str | None = None) -> str:
    value = os.getenv(key, default)
    if value is None:
        raise RuntimeError(f"Missing environment variable: {key}")
    return value


# ── Spring Boot Integration Core ──────────────────────────────────
SPRING_BOOT_BASE_URL: str = _env("SPRING_BOOT_BASE_URL", "http://localhost:8080")

# ── JWT ───────────────────────────────────────────────────────────
JWT_SECRET: str = _env("JWT_SECRET")
JWT_ALGORITHM: str = _env("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_MINUTES: int = int(_env("JWT_EXPIRATION_MINUTES", "60"))
