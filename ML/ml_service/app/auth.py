from __future__ import annotations

from typing import Any

import logging

import httpx
import jwt

from app.core.config import settings
from app.schemas.auth import AuthenticatedUser
from app.security import InvalidTokenException, TokenExpiredException, UnauthorizedException


logger = logging.getLogger("app.auth")


def extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise UnauthorizedException("Invalid or expired token")
    if not authorization.startswith("Bearer "):
        raise UnauthorizedException("Invalid or expired token")
    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise UnauthorizedException("Invalid or expired token")
    return token


def _decode_local_token(token: str) -> dict[str, Any]:
    logger.debug("jwt_token_received", extra={"token": token})
    logger.debug("jwt_algorithm", extra={"algorithm": settings.jwt_algorithm})
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=["HS256"],
            leeway=settings.jwt_leeway_seconds,
        )
        return payload
    except jwt.ExpiredSignatureError as exc:
        logger.debug("jwt_decode_error", extra={"error": str(exc)})
        raise TokenExpiredException("Invalid or expired token") from exc
    except jwt.InvalidSignatureError as exc:
        logger.debug("jwt_decode_error", extra={"error": str(exc)})
        raise InvalidTokenException("Invalid or expired token") from exc
    except jwt.DecodeError as exc:
        logger.debug("jwt_decode_error", extra={"error": str(exc)})
        raise InvalidTokenException("Invalid or expired token") from exc
    except jwt.InvalidTokenError as exc:
        logger.debug("jwt_decode_error", extra={"error": str(exc)})
        raise InvalidTokenException("Invalid or expired token") from exc


async def _decode_remote_token(token: str) -> dict[str, Any]:
    if not settings.jwt_validation_url:
        raise UnauthorizedException("Invalid or expired token")
    async with httpx.AsyncClient(
        timeout=settings.jwt_validation_timeout_seconds
    ) as client:
        response = await client.post(
            settings.jwt_validation_url, json={"token": token}
        )
    if response.status_code != 200:
        raise InvalidTokenException("Invalid or expired token")
    payload = response.json()
    if not payload.get("valid", False):
        raise InvalidTokenException("Invalid or expired token")
    claims = payload.get("claims")
    if not isinstance(claims, dict):
        raise InvalidTokenException("Invalid or expired token")
    return claims


def _extract_user_claims(payload: dict[str, Any]) -> AuthenticatedUser:
    email = payload.get("sub") or payload.get("email")
    user_id = (
        payload.get("userId")
        or payload.get("user_id")
        or payload.get("id")
        or email
    )
    roles = payload.get("roles") or payload.get("authorities") or []
    if isinstance(roles, str):
        roles = [roles]
    if not user_id or not email:
        raise InvalidTokenException("Invalid or expired token")
    return AuthenticatedUser(
        user_id=str(user_id),
        email=str(email),
        roles=[str(role) for role in roles],
    )


async def validate_token(token: str) -> AuthenticatedUser:
    payload = await decode_token_payload(token)
    return _extract_user_claims(payload)


async def decode_token_payload(token: str) -> dict[str, Any]:
    if settings.jwt_validation_mode == "remote":
        return await _decode_remote_token(token)
    return _decode_local_token(token)
