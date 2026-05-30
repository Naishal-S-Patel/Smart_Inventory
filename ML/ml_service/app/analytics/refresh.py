from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from datetime import datetime
from threading import Lock

from sqlalchemy.engine import Engine

from app.analytics.anomaly_detection import build_anomaly_report
from app.analytics.dashboard_metrics import compute_dashboard_metrics
from app.analytics.data_access import (
    date_range,
    read_inventory_snapshot,
    read_inventory_transactions,
    read_purchase_orders,
    read_sales_data,
    utc_now,
)
from app.analytics.inventory_analytics import build_inventory_analytics, compute_sales_velocity, compute_stock_aging
from app.analytics.sales_analytics import build_sales_analytics
from app.analytics.smart_insights import generate_insights
from app.core.config import settings


logger = logging.getLogger("app.analytics")


@dataclass
class AnalyticsSnapshot:
    sales: dict
    inventory: dict
    anomalies: dict
    insights: dict
    dashboard: dict
    generated_at: str


class AnalyticsCache:
    def __init__(self) -> None:
        self._lock = Lock()
        self._snapshot: AnalyticsSnapshot | None = None

    def get(self) -> AnalyticsSnapshot | None:
        with self._lock:
            return self._snapshot

    def set(self, snapshot: AnalyticsSnapshot) -> None:
        with self._lock:
            self._snapshot = snapshot


cache = AnalyticsCache()


def refresh_all(engine: Engine) -> AnalyticsSnapshot:
    start, end = date_range(settings.analytics_lookback_days)
    generated_at = utc_now()

    sales_df = read_sales_data(engine, start, end)
    inventory_df = read_inventory_snapshot(engine)
    transactions_df = read_inventory_transactions(engine, start, end)
    purchase_orders_df = read_purchase_orders(engine)

    sales_result = build_sales_analytics(sales_df, generated_at)
    sales_velocity_df = compute_sales_velocity(transactions_df, settings.analytics_lookback_days)
    inventory_result = build_inventory_analytics(
        inventory_df,
        transactions_df,
        settings.analytics_lookback_days,
        generated_at,
    )

    daily_revenue_df = sales_df.copy()
    if not daily_revenue_df.empty:
        daily_revenue_df["date"] = daily_revenue_df["created_at"].dt.date
        daily_revenue_df = daily_revenue_df.groupby("date", as_index=False).agg(revenue=("total_price", "sum"))

    anomaly_result = build_anomaly_report(daily_revenue_df, transactions_df, generated_at)

    inventory_with_velocity = inventory_df.merge(
        sales_velocity_df,
        on=["product_id", "warehouse_id"],
        how="left",
    )
    if not inventory_with_velocity.empty:
        inventory_with_velocity["velocity"] = inventory_with_velocity["velocity"].fillna(0)

    stock_aging_data = compute_stock_aging(transactions_df, inventory_df, generated_at)

    insights = generate_insights(
        daily_revenue_df,
        inventory_with_velocity,
        stock_aging_data,
        generated_at,
    )

    dashboard = compute_dashboard_metrics(
        sales_df,
        inventory_with_velocity,
        purchase_orders_df,
        generated_at,
    )

    snapshot = AnalyticsSnapshot(
        sales={
            "top_products": sales_result.top_products,
            "low_products": sales_result.low_products,
            "category_sales": sales_result.category_sales,
            "warehouse_sales": sales_result.warehouse_sales,
            "daily_revenue": sales_result.daily_revenue,
            "monthly_growth": sales_result.monthly_growth,
            "charts": sales_result.charts,
            "exports": sales_result.exports,
        },
        inventory={
            "fast_moving": inventory_result.fast_moving,
            "slow_moving": inventory_result.slow_moving,
            "dead_stock": inventory_result.dead_stock,
            "turnover": inventory_result.turnover,
            "stock_aging": inventory_result.stock_aging,
            "exports": inventory_result.exports,
        },
        anomalies={"items": anomaly_result.anomalies},
        insights={"items": insights},
        dashboard={
            "total_sales": dashboard.total_sales,
            "total_revenue": dashboard.total_revenue,
            "low_stock_count": dashboard.low_stock_count,
            "predicted_stockouts": dashboard.predicted_stockouts,
            "pending_purchase_orders": dashboard.pending_purchase_orders,
        },
        generated_at=generated_at.isoformat(),
    )

    cache.set(snapshot)
    logger.info("analytics_refreshed", extra={"generated_at": snapshot.generated_at})
    return snapshot


async def scheduler_loop(engine: Engine) -> None:
    while True:
        try:
            await asyncio.to_thread(refresh_all, engine)
        except Exception as exc:
            logger.exception("analytics_refresh_failed", extra={"error": str(exc)})
        await asyncio.sleep(settings.analytics_refresh_seconds)


def start_scheduler(engine: Engine) -> None:
    loop = asyncio.get_event_loop()
    loop.create_task(scheduler_loop(engine))
