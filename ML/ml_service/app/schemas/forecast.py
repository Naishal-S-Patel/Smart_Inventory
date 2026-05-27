from __future__ import annotations

from pydantic import BaseModel, Field


class ForecastPoint(BaseModel):
    date: str
    yhat: float
    yhat_lower: float = Field(..., alias="yhat_lower")
    yhat_upper: float = Field(..., alias="yhat_upper")


class ForecastResponse(BaseModel):
    product_id: str = Field(..., alias="productId")
    forecast: list[ForecastPoint]
    recommended_order_qty: int | None = Field(default=None, alias="recommendedOrderQty")
    predicted_stockout_date: str | None = Field(
        default=None, alias="predictedStockoutDate"
    )

    model_config = {"populate_by_name": True}


class ReorderRecommendationResponse(BaseModel):
    product_id: str = Field(..., alias="productId")
    forecast: list[ForecastPoint]
    recommended_order_qty: int = Field(..., alias="recommendedOrderQty")
    predicted_stockout_date: str | None = Field(
        default=None, alias="predictedStockoutDate"
    )

    model_config = {"populate_by_name": True}


class LowStockAlert(BaseModel):
    product_id: str = Field(..., alias="productId")
    alert_type: str = Field(..., alias="alertType")
    message: str
    current_stock: int = Field(..., alias="currentStock")
    predicted_stockout_date: str | None = Field(
        default=None, alias="predictedStockoutDate"
    )

    model_config = {"populate_by_name": True}


class LowStockAlertsResponse(BaseModel):
    alerts: list[LowStockAlert]
