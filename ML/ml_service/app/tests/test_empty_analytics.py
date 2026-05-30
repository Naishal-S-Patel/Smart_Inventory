from __future__ import annotations

import pandas as pd

from app.analytics.inventory_analytics import build_inventory_analytics
from app.analytics.sales_analytics import compute_category_sales


def test_empty_sales_category() -> None:
    df = pd.DataFrame(columns=["category_name", "total_price", "quantity"])
    result = compute_category_sales(df)
    assert result.empty


def test_empty_inventory_analytics() -> None:
    snapshot = pd.DataFrame(
        columns=[
            "product_id",
            "warehouse_id",
            "quantity_on_hand",
            "reserved_quantity",
            "reorder_point",
            "product_name",
            "warehouse_name",
        ]
    )
    transactions = pd.DataFrame(
        columns=["product_id", "warehouse_id", "transaction_type", "quantity", "created_at"]
    )
    result = build_inventory_analytics(snapshot, transactions, 30, pd.Timestamp.utcnow())
    assert result.fast_moving == []
    assert result.dead_stock == []
