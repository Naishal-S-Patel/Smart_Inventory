from __future__ import annotations

from fastapi import APIRouter, Depends

from app.dependencies import get_current_user
from app.schemas.auth import AuthenticatedUser
from app.schemas.common import ErrorResponse
from app.schemas.predict import DemandForecastData, DemandForecastResponse


router = APIRouter(prefix="/predict", tags=["predict"])


@router.get(
    "/demand",
    response_model=DemandForecastResponse,
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
async def predict_demand(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> DemandForecastResponse:
    _ = current_user
    return DemandForecastResponse(
        success=True,
        data=DemandForecastData(forecast=[]),
        message="Prediction generated",
    )
