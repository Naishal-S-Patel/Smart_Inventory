from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response

from app.analytics.csv_utils import dataframe_to_csv_response, records_to_dataframe
from app.analytics.refresh import cache, refresh_all
from app.db.session import engine
from app.dependencies import get_current_user
from app.schemas.analytics import (
    AnomalyResponse,
    DashboardSummaryResponse,
    InsightResponse,
    InventoryAnalyticsResponse,
    SalesAnalyticsResponse,
)
from app.schemas.auth import AuthenticatedUser


router = APIRouter(prefix="/analytics", tags=["analytics"])


def _get_snapshot() -> dict:
    snapshot = cache.get()
    if snapshot is None:
        snapshot = refresh_all(engine)
    return {
        "sales": snapshot.sales,
        "inventory": snapshot.inventory,
        "anomalies": snapshot.anomalies,
        "insights": snapshot.insights,
        "dashboard": snapshot.dashboard,
        "generated_at": snapshot.generated_at,
    }


@router.get("/top-products", response_model=SalesAnalyticsResponse)
async def top_products(
    format: str | None = Query(None, description="csv for export"),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> SalesAnalyticsResponse | Response:
    _ = current_user
    snapshot = _get_snapshot()
    items = snapshot["sales"]["top_products"]
    if format == "csv":
        return dataframe_to_csv_response(records_to_dataframe(items), "top_products.csv")
    chart = {
        "labels": [item["product_name"] for item in items],
        "values": [float(item["revenue"]) for item in items],
    }
    return SalesAnalyticsResponse(
        items=items,
        chart=chart,
        generated_at=snapshot["generated_at"],
        exports=snapshot["sales"].get("exports"),
        charts=snapshot["sales"].get("charts"),
    )


@router.get("/category-sales", response_model=SalesAnalyticsResponse)
async def category_sales(
    format: str | None = Query(None, description="csv for export"),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> SalesAnalyticsResponse | Response:
    _ = current_user
    snapshot = _get_snapshot()
    items = snapshot["sales"]["category_sales"]
    if format == "csv":
        return dataframe_to_csv_response(records_to_dataframe(items), "category_sales.csv")
    chart = {
        "labels": [str(item.get("category_name") or "Unknown") for item in items],
        "values": [float(item["revenue"]) for item in items],
    }
    return SalesAnalyticsResponse(
        items=items,
        chart=chart,
        generated_at=snapshot["generated_at"],
        exports=snapshot["sales"].get("exports"),
        charts=snapshot["sales"].get("charts"),
    )


@router.get("/warehouse-performance", response_model=SalesAnalyticsResponse)
async def warehouse_sales(
    format: str | None = Query(None, description="csv for export"),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> SalesAnalyticsResponse | Response:
    _ = current_user
    snapshot = _get_snapshot()
    items = snapshot["sales"]["warehouse_sales"]
    if format == "csv":
        return dataframe_to_csv_response(records_to_dataframe(items), "warehouse_sales.csv")
    chart = {
        "labels": [item["warehouse_name"] for item in items],
        "values": [float(item["revenue"]) for item in items],
    }
    return SalesAnalyticsResponse(
        items=items,
        chart=chart,
        generated_at=snapshot["generated_at"],
        exports=snapshot["sales"].get("exports"),
        charts=snapshot["sales"].get("charts"),
    )


@router.get("/fast-moving", response_model=InventoryAnalyticsResponse)
async def fast_moving(
    format: str | None = Query(None, description="csv for export"),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> InventoryAnalyticsResponse | Response:
    _ = current_user
    snapshot = _get_snapshot()
    items = snapshot["inventory"]["fast_moving"]
    if format == "csv":
        return dataframe_to_csv_response(records_to_dataframe(items), "fast_moving.csv")
    return InventoryAnalyticsResponse(
        items=items,
        generated_at=snapshot["generated_at"],
        exports=snapshot["inventory"].get("exports"),
    )


@router.get("/dead-stock", response_model=InventoryAnalyticsResponse)
async def dead_stock(
    format: str | None = Query(None, description="csv for export"),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> InventoryAnalyticsResponse | Response:
    _ = current_user
    snapshot = _get_snapshot()
    items = snapshot["inventory"]["dead_stock"]
    if format == "csv":
        return dataframe_to_csv_response(records_to_dataframe(items), "dead_stock.csv")
    return InventoryAnalyticsResponse(
        items=items,
        generated_at=snapshot["generated_at"],
        exports=snapshot["inventory"].get("exports"),
    )


@router.get("/anomalies", response_model=AnomalyResponse)
async def anomalies(
    format: str | None = Query(None, description="csv for export"),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> AnomalyResponse | Response:
    _ = current_user
    snapshot = _get_snapshot()
    items = snapshot["anomalies"]["items"]
    if format == "csv":
        return dataframe_to_csv_response(records_to_dataframe(items), "anomalies.csv")
    return AnomalyResponse(items=items, generated_at=snapshot["generated_at"])


@router.get("/insights", response_model=InsightResponse)
async def insights(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> InsightResponse:
    _ = current_user
    snapshot = _get_snapshot()
    return InsightResponse(items=snapshot["insights"]["items"], generated_at=snapshot["generated_at"])


@router.get("/dashboard-summary", response_model=DashboardSummaryResponse)
async def dashboard_summary(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> DashboardSummaryResponse:
    _ = current_user
    snapshot = _get_snapshot()
    dashboard = snapshot["dashboard"]
    return DashboardSummaryResponse(
        total_sales=dashboard["total_sales"],
        total_revenue=dashboard["total_revenue"],
        low_stock_count=dashboard["low_stock_count"],
        predicted_stockouts=dashboard["predicted_stockouts"],
        pending_purchase_orders=dashboard["pending_purchase_orders"],
        generated_at=snapshot["generated_at"],
    )
