import pandas as pd

from dataset_builder import aggregate_daily_product_sales


def test_aggregate_daily_product_sales_groups_by_warehouse():
    df = pd.DataFrame(
        [
            {
                "created_at": "2026-01-01T10:00:00Z",
                "product_id": "p1",
                "warehouse_id": "w1",
                "transaction_type": "SALE",
                "quantity": 5,
            },
            {
                "created_at": "2026-01-01T12:00:00Z",
                "product_id": "p1",
                "warehouse_id": "w2",
                "transaction_type": "SALE",
                "quantity": 8,
            },
            {
                "created_at": "2026-01-01T13:00:00Z",
                "product_id": "p1",
                "warehouse_id": "w1",
                "transaction_type": "RETURN",
                "quantity": 2,
            },
        ]
    )

    result = aggregate_daily_product_sales(df)
    w1 = result[(result["warehouse_id"] == "w1")].iloc[0]
    w2 = result[(result["warehouse_id"] == "w2")].iloc[0]

    assert w1["quantity_sold"] == 3
    assert w2["quantity_sold"] == 8
