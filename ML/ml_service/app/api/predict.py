from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.dependencies import get_current_user
from app.schemas.auth import AuthenticatedUser
from app.schemas.common import ErrorResponse
from app.schemas.predict import DemandForecastData, DemandForecastResponse
from app.services.forecast_service import predict_product_demand


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
    productId: str | None = Query(None, description="Optional product ID to predict demand for"),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> DemandForecastResponse:
    _ = current_user
    forecast_points = []
    if productId:
        try:
            forecast_points = predict_product_demand(productId)
        except Exception as e:
            # Fallback to empty if product not found or failed
            pass
    return DemandForecastResponse(
        success=True,
        data=DemandForecastData(forecast=forecast_points),
        message="Prediction generated",
    )
