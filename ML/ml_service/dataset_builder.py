from __future__ import annotations

import logging
from datetime import date
from typing import Final

import pandas as pd
from sqlalchemy import create_engine, text

from app.core.config import settings
from app.core.logging import configure_logging


logger = logging.getLogger(__name__)

DATE_COLUMN: Final[str] = "date"


def _engine():
    return create_engine(settings.database_url, pool_pre_ping=True)


def aggregate_daily_product_sales(transactions_df: pd.DataFrame) -> pd.DataFrame:
    data = transactions_df.copy()
    data["created_at"] = pd.to_datetime(data["created_at"], utc=True, errors="coerce")
    data = data.dropna(subset=["created_at"]).reset_index(drop=True)
    data[DATE_COLUMN] = data["created_at"].dt.date

    data = data[data["transaction_type"].isin(["SALE", "RETURN"])]
    data["signed_qty"] = data.apply(
        lambda row: row["quantity"] if row["transaction_type"] == "SALE" else -row["quantity"],
        axis=1,
    )

    grouped = (
        data.groupby([DATE_COLUMN, "product_id", "warehouse_id"], as_index=False)["signed_qty"]
        .sum()
        .rename(columns={"signed_qty": "quantity_sold"})
    )
    return grouped


def build_daily_sales_dataset(
    start_date: date | None = None, end_date: date | None = None
) -> pd.DataFrame:
    configure_logging(settings.log_level)
    filters = []
    params: dict[str, object] = {}

    if start_date:
        filters.append("t.created_at::date >= :start_date")
        params["start_date"] = start_date
    if end_date:
        filters.append("t.created_at::date <= :end_date")
        params["end_date"] = end_date

    where_clause = ""
    if filters:
        where_clause = " AND " + " AND ".join(filters)

    sql = f"""
        SELECT
            t.created_at::date AS date,
            t.product_id,
            t.warehouse_id,
            SUM(CASE WHEN t.transaction_type = 'SALE' THEN t.quantity
                     WHEN t.transaction_type = 'RETURN' THEN -t.quantity
                     ELSE 0 END) AS quantity_sold,
            c.name AS category,
            p.selling_price AS unit_price,
            COALESCE(i.quantity_on_hand, 0) AS stock_level,
            COALESCE(i.reorder_point, p.reorder_point) AS reorder_point
        FROM inventory_transactions t
        JOIN products p ON t.product_id = p.id
        JOIN categories c ON p.category_id = c.id
        LEFT JOIN inventory i
            ON t.product_id = i.product_id AND t.warehouse_id = i.warehouse_id
        WHERE t.transaction_type IN ('SALE', 'RETURN')
        {where_clause}
        GROUP BY 1, 2, 3, 5, 6, 7, 8
        ORDER BY 1
    """

    with _engine().connect() as connection:
        df = pd.read_sql_query(text(sql), connection, params=params or None)

    logger.info("daily_sales_dataset_built", extra={"rows": len(df)})
    return df


def build_product_warehouse_dataset() -> pd.DataFrame:
    configure_logging(settings.log_level)
    sql = """
        SELECT
            i.product_id,
            i.warehouse_id,
            i.quantity_on_hand AS stock_level,
            i.reorder_point,
            c.name AS category,
            p.selling_price AS unit_price,
            i.last_updated_at
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        JOIN categories c ON p.category_id = c.id
    """

    with _engine().connect() as connection:
        df = pd.read_sql_query(text(sql), connection)

    logger.info("product_warehouse_dataset_built", extra={"rows": len(df)})
    return df


def main() -> None:
    dataset = build_daily_sales_dataset()
    dataset.to_csv("daily_sales_dataset.csv", index=False)
    logger.info("daily_sales_dataset_saved", extra={"path": "daily_sales_dataset.csv"})


if __name__ == "__main__":
    main()
