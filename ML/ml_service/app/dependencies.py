from __future__ import annotations

from fastapi import Request

from app.auth import extract_bearer_token, validate_token
from app.schemas.auth import AuthenticatedUser


async def get_current_user(request: Request) -> AuthenticatedUser:
    token = extract_bearer_token(request.headers.get("Authorization"))
    return await validate_token(token)
