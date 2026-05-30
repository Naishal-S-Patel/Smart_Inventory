from __future__ import annotations

from pydantic import BaseModel, Field


class ChartSeries(BaseModel):
    labels: list[str] = Field(default_factory=list)
    values: list[float] = Field(default_factory=list)


class TopProduct(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    revenue: float


class CategorySales(BaseModel):
    category_name: str | None
    revenue: float
    quantity: int


class WarehouseSales(BaseModel):
    warehouse_id: str
    warehouse_name: str
    revenue: float
    orders: int


class TimeSeriesPoint(BaseModel):
    date: str
    value: float


class SalesAnalyticsResponse(BaseModel):
    items: list[dict]
    chart: ChartSeries
    generated_at: str
    exports: dict[str, str] | None = None
    charts: dict[str, str] | None = None


class InventoryItem(BaseModel):
    product_id: str
    product_name: str
    warehouse_id: str
    warehouse_name: str
    metric: float


class InventoryAnalyticsResponse(BaseModel):
    items: list[dict]
    generated_at: str
    exports: dict[str, str] | None = None


class AnomalyRecord(BaseModel):
    anomaly_type: str
    entity_id: str
    metric: str
    value: float
    score: float
    timestamp: str


class AnomalyResponse(BaseModel):
    items: list[AnomalyRecord]
    generated_at: str


class InsightResponse(BaseModel):
    items: list[str]
    generated_at: str


class DashboardSummaryResponse(BaseModel):
    total_sales: int
    total_revenue: float
    low_stock_count: int
    predicted_stockouts: int
    pending_purchase_orders: int
    generated_at: str
