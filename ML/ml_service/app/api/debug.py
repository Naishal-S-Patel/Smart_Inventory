from __future__ import annotations

from fastapi import APIRouter, Request

from app.auth import decode_token_payload, extract_bearer_token
from app.schemas.common import ErrorResponse
from app.schemas.debug import DebugTokenResponse


router = APIRouter(prefix="/debug", tags=["debug"])


@router.get(
    "/token",
    response_model=DebugTokenResponse,
    responses={
        401: {
            "model": ErrorResponse,
            "description": "Unauthorized",
            "content": {
                "application/json": {
                    "example": {
                        "success": False,
                        "error": {
                            "code": "UNAUTHORIZED",
                            "message": "Invalid or expired token",
                        },
                    }
                }
            },
        }
    },
)
async def debug_token(request: Request) -> DebugTokenResponse:
    token = extract_bearer_token(request.headers.get("Authorization"))
    payload = await decode_token_payload(token)
    return DebugTokenResponse(success=True, claims=payload, message="Token decoded")
