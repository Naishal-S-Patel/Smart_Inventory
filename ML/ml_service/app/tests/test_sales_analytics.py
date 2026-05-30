from __future__ import annotations

import pandas as pd

from app.analytics.sales_analytics import compute_top_products


def test_top_products_aggregation() -> None:
    df = pd.DataFrame(
        {
            "product_id": ["p1", "p1", "p2"],
            "product_name": ["A", "A", "B"],
            "quantity": [2, 3, 1],
            "total_price": [20.0, 30.0, 10.0],
        }
    )
    result = compute_top_products(df, limit=2)
    assert result.iloc[0]["product_id"] == "p1"
    assert result.iloc[0]["quantity"] == 5
