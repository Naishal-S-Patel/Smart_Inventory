from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any

import sys
from pathlib import Path

# Allow running this module as a script (``python app/analytics/inventory_analytics.py``)
# by ensuring the package root (the folder that contains `app`) is on sys.path.
if __package__ is None:
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import pandas as pd

from app.analytics.paths import EXPORTS_DIR, ensure_report_dirs


@dataclass(frozen=True)
class InventoryAnalyticsResult:
    fast_moving: list[dict[str, Any]]
    slow_moving: list[dict[str, Any]]
    dead_stock: list[dict[str, Any]]
    turnover: list[dict[str, Any]]
    stock_aging: list[dict[str, Any]]
    exports: dict[str, str]


def compute_sales_velocity(transactions_df: pd.DataFrame, days: int) -> pd.DataFrame:
    if transactions_df.empty:
        return pd.DataFrame(columns=["product_id", "warehouse_id", "sold_qty", "velocity"])
    df = transactions_df.copy()
    df = df[df["transaction_type"].isin(["SALE"])]
    if df.empty:
        return pd.DataFrame(columns=["product_id", "warehouse_id", "sold_qty", "velocity"])
    df["sold_qty"] = df["quantity"].abs()
    grouped = (
        df.groupby(["product_id", "warehouse_id"], as_index=False)
        .agg(sold_qty=("sold_qty", "sum"))
    )
    grouped["velocity"] = grouped["sold_qty"] / max(days, 1)
    return grouped


def compute_stock_aging(transactions_df: pd.DataFrame, snapshot_df: pd.DataFrame, now: datetime) -> pd.DataFrame:
    if snapshot_df.empty:
        return pd.DataFrame(columns=["product_id", "warehouse_id", "age_days", "warehouse_name"])
    if transactions_df.empty:
        snapshot = snapshot_df.copy()
        snapshot["age_days"] = 0
        return snapshot[["product_id", "warehouse_id", "age_days", "warehouse_name"]]

    sales = transactions_df[transactions_df["transaction_type"].isin(["SALE"])]
    last_sale = (
        sales.groupby(["product_id", "warehouse_id"], as_index=False)
        .agg(last_sale=("created_at", "max"))
    )
    merged = snapshot_df.merge(last_sale, on=["product_id", "warehouse_id"], how="left")
    merged["last_sale"] = pd.to_datetime(merged["last_sale"], utc=True)
    merged["age_days"] = (
        (now - merged["last_sale"]).dt.total_seconds() / 86400
    ).fillna(0)
    return merged[["product_id", "warehouse_id", "age_days", "warehouse_name"]]


def build_inventory_analytics(
    snapshot_df: pd.DataFrame,
    transactions_df: pd.DataFrame,
    lookback_days: int,
    now: datetime,
) -> InventoryAnalyticsResult:
    ensure_report_dirs()

    velocity_df = compute_sales_velocity(transactions_df, lookback_days)
    merged = snapshot_df.merge(velocity_df, on=["product_id", "warehouse_id"], how="left")
    merged["velocity"] = merged["velocity"].fillna(0)
    merged["sold_qty"] = merged["sold_qty"].fillna(0)
    merged["available_qty"] = merged["quantity_on_hand"] - merged["reserved_quantity"]

    fast_moving = merged.sort_values("velocity", ascending=False).head(10)
    slow_moving = merged.sort_values("velocity", ascending=True).head(10)

    dead_stock = merged[(merged["available_qty"] > 0) & (merged["velocity"] == 0)]

    turnover = merged.copy()
    turnover["turnover_ratio"] = turnover.apply(
        lambda row: (row["sold_qty"] / row["quantity_on_hand"]) if row["quantity_on_hand"] else 0,
        axis=1,
    )

    aging_df = compute_stock_aging(transactions_df, snapshot_df, now)

    export_path = EXPORTS_DIR / "inventory_turnover.csv"
    turnover[["product_id", "warehouse_id", "turnover_ratio"]].to_csv(export_path, index=False)

    def _records(df: pd.DataFrame, columns: list[str]) -> list[dict[str, Any]]:
        if df.empty:
            return []
        return df[columns].to_dict(orient="records")

    return InventoryAnalyticsResult(
        fast_moving=_records(
            fast_moving,
            [
                "product_id",
                "product_name",
                "warehouse_id",
                "warehouse_name",
                "velocity",
                "available_qty",
            ],
        ),
        slow_moving=_records(
            slow_moving,
            [
                "product_id",
                "product_name",
                "warehouse_id",
                "warehouse_name",
                "velocity",
                "available_qty",
            ],
        ),
        dead_stock=_records(
            dead_stock,
            [
                "product_id",
                "product_name",
                "warehouse_id",
                "warehouse_name",
                "available_qty",
            ],
        ),
        turnover=_records(
            turnover,
            [
                "product_id",
                "product_name",
                "warehouse_id",
                "warehouse_name",
                "turnover_ratio",
            ],
        ),
        stock_aging=_records(
            aging_df,
            ["product_id", "warehouse_id", "warehouse_name", "age_days"],
        ),
        exports={"inventory_turnover": str(export_path)},
    )


    if __name__ == "__main__":
        import json

        # Lightweight self-check when executed as a script
        empty_snapshot = pd.DataFrame(
            columns=[
                "product_id",
                "warehouse_id",
                "quantity_on_hand",
                "reserved_quantity",
                "product_name",
                "warehouse_name",
            ]
        )
        empty_transactions = pd.DataFrame(
            columns=["product_id", "warehouse_id", "transaction_type", "quantity", "created_at"]
        )

        result = build_inventory_analytics(
            snapshot_df=empty_snapshot,
            transactions_df=empty_transactions,
            lookback_days=30,
            now=datetime.utcnow(),
        )

        print(json.dumps(result.__dict__, indent=2, default=str))
