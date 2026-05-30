from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any

import pandas as pd


@dataclass(frozen=True)
class DashboardMetrics:
    total_sales: int
    total_revenue: float
    low_stock_count: int
    predicted_stockouts: int
    pending_purchase_orders: int
    generated_at: str


def compute_dashboard_metrics(
    sales_df: pd.DataFrame,
    inventory_df: pd.DataFrame,
    purchase_orders_df: pd.DataFrame,
    generated_at: datetime,
) -> DashboardMetrics:
    total_sales = int(sales_df["order_id"].nunique()) if not sales_df.empty else 0
    total_revenue = float(sales_df["total_price"].sum()) if not sales_df.empty else 0.0

    low_stock_count = 0
    predicted_stockouts = 0
    if not inventory_df.empty:
        inventory = inventory_df.copy()
        inventory["available_qty"] = inventory["quantity_on_hand"] - inventory["reserved_quantity"]
        low_stock_count = int((inventory["available_qty"] <= inventory["reorder_point"]).sum())

        if "velocity" not in inventory.columns:
            inventory["velocity"] = 0
        inventory["daily_sales"] = inventory["velocity"].fillna(0)
        inventory["days_to_stockout"] = inventory.apply(
            lambda row: row["available_qty"] / row["daily_sales"] if row["daily_sales"] else None,
            axis=1,
        )
        predicted_stockouts = int((inventory["days_to_stockout"].notna() & (inventory["days_to_stockout"] <= 7)).sum())

    pending_purchase_orders = 0
    if not purchase_orders_df.empty:
        pending_purchase_orders = int(
            (~purchase_orders_df["status"].isin(["RECEIVED", "CANCELLED"]))
            .sum()
        )

    return DashboardMetrics(
        total_sales=total_sales,
        total_revenue=total_revenue,
        low_stock_count=low_stock_count,
        predicted_stockouts=predicted_stockouts,
        pending_purchase_orders=pending_purchase_orders,
        generated_at=generated_at.isoformat(),
    )
