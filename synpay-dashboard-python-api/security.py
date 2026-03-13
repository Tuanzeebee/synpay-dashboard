"""
Security utilities for token management and XSS protection.
"""

import logging

logger = logging.getLogger("security")

# ── Token Blacklist (In-Memory) ──────────────────────────────────
# In production, use Redis or database for distributed systems
_token_blacklist: set[str] = set()


def add_token_to_blacklist(token: str) -> None:
    """
    Add token to blacklist (e.g., on logout).
    
    Tokens in blacklist cannot be used for authentication.
    In production, implement TTL cleanup to prevent memory leaks.
    """
    _token_blacklist.add(token)
    logger.info(f"🔒 Token blacklisted (total blacklisted: {len(_token_blacklist)})")


def is_token_blacklisted(token: str) -> bool:
    """
    Check if token is blacklisted.
    
    Returns True if token is in blacklist (shouldn't be used).
    """
    return token in _token_blacklist


def clear_blacklist() -> None:
    """Clear all blacklisted tokens. Use for testing only."""
    _token_blacklist.clear()
    logger.warning("⚠️  Token blacklist cleared (for testing only)")


def get_blacklist_size() -> int:
    """Get current number of blacklisted tokens."""
    return len(_token_blacklist)
