from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.dependencies import get_current_user
from app.schemas.auth import AuthenticatedUser
from app.schemas.common import ErrorResponse
from app.schemas.forecast import (
    ForecastResponse,
    LowStockAlertsResponse,
    ReorderRecommendationResponse,
)
from app.services.forecast_service import (
    generate_low_stock_alerts,
    generate_reorder_recommendation,
)


router = APIRouter(prefix="/forecast", tags=["forecast"])


@router.get(
    "/low-stock-alerts",
    response_model=LowStockAlertsResponse,
    responses={401: {"model": ErrorResponse, "description": "Unauthorized"}},
)
async def get_low_stock_alerts(
    limit: int = Query(50, ge=1, le=200),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> LowStockAlertsResponse:
    _ = current_user
    alerts = generate_low_stock_alerts(limit=limit)
    return LowStockAlertsResponse(alerts=alerts)


@router.get(
    "/{product_id}",
    response_model=ForecastResponse,
    responses={401: {"model": ErrorResponse, "description": "Unauthorized"}},
)
async def get_forecast(
    product_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ForecastResponse:
    _ = current_user
    recommendation = generate_reorder_recommendation(product_id)
    return ForecastResponse(**recommendation)


@router.get(
    "/{product_id}/reorder",
    response_model=ReorderRecommendationResponse,
    responses={401: {"model": ErrorResponse, "description": "Unauthorized"}},
)
async def get_reorder_recommendation(
    product_id: str,
    lead_time_days: int | None = Query(None, ge=1, le=60),
    safety_stock: int | None = Query(None, ge=0),
    current_stock: int | None = Query(None, ge=0),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ReorderRecommendationResponse:
    _ = current_user
    recommendation = generate_reorder_recommendation(
        product_id,
        lead_time_days=lead_time_days,
        safety_stock=safety_stock,
        current_stock=current_stock,
    )
    return ReorderRecommendationResponse(**recommendation)
