from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import pandas as pd
from sqlalchemy import text
from sqlalchemy.engine import Engine


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def date_range(days: int) -> tuple[datetime, datetime]:
    end = utc_now()
    start = end - timedelta(days=days)
    return start, end


def read_sales_data(engine: Engine, start: datetime, end: datetime) -> pd.DataFrame:
    query = text(
        """
        SELECT
            so.id AS order_id,
            so.order_number,
            so.status,
            so.created_at,
            so.customer_id,
            so.warehouse_id,
            w.name AS warehouse_name,
            soi.product_id,
            p.name AS product_name,
            c.name AS category_name,
            soi.quantity,
            soi.unit_price,
            soi.total_price
        FROM sales_orders so
        JOIN sales_order_items soi ON soi.sales_order_id = so.id
        JOIN products p ON p.id = soi.product_id
        LEFT JOIN categories c ON c.id = p.category_id
        JOIN warehouses w ON w.id = so.warehouse_id
        WHERE so.created_at >= :start
          AND so.created_at < :end
          AND so.status IN ('CONFIRMED', 'COMPLETED')
        """
    )
    df = pd.read_sql(query, engine, params={"start": start, "end": end})
    if df.empty:
        return _ensure_sales_columns(df)
    df["created_at"] = pd.to_datetime(df["created_at"], utc=True)
    return df


def read_inventory_snapshot(engine: Engine) -> pd.DataFrame:
    query = text(
        """
        SELECT
            i.product_id,
            i.warehouse_id,
            i.quantity_on_hand,
            i.reserved_quantity,
            p.reorder_point,
            p.name AS product_name,
            c.name AS category_name,
            w.name AS warehouse_name,
            w.city AS warehouse_city,
            w.state AS warehouse_state
        FROM inventory i
        JOIN products p ON p.id = i.product_id
        LEFT JOIN categories c ON c.id = p.category_id
        JOIN warehouses w ON w.id = i.warehouse_id
        """
    )
    df = pd.read_sql(query, engine)
    if df.empty:
        return _ensure_inventory_columns(df)
    return df


def read_inventory_transactions(engine: Engine, start: datetime, end: datetime) -> pd.DataFrame:
    query = text(
        """
        SELECT
            it.id,
            it.product_id,
            it.warehouse_id,
            it.transaction_type,
            it.quantity,
            it.created_at,
            p.name AS product_name,
            w.name AS warehouse_name
        FROM inventory_transactions it
        JOIN products p ON p.id = it.product_id
        JOIN warehouses w ON w.id = it.warehouse_id
        WHERE it.created_at >= :start
          AND it.created_at < :end
        """
    )
    df = pd.read_sql(query, engine, params={"start": start, "end": end})
    if df.empty:
        return _ensure_transactions_columns(df)
    df["created_at"] = pd.to_datetime(df["created_at"], utc=True)
    return df


def read_purchase_orders(engine: Engine) -> pd.DataFrame:
    query = text("SELECT id, status FROM purchase_orders")
    df = pd.read_sql(query, engine)
    if df.empty:
        return pd.DataFrame(columns=["id", "status"])
    return df


def _ensure_sales_columns(df: pd.DataFrame) -> pd.DataFrame:
    columns = [
        "order_id",
        "order_number",
        "status",
        "created_at",
        "customer_id",
        "warehouse_id",
        "warehouse_name",
        "product_id",
        "product_name",
        "category_name",
        "quantity",
        "unit_price",
        "total_price",
    ]
    return df.reindex(columns=columns)


def _ensure_inventory_columns(df: pd.DataFrame) -> pd.DataFrame:
    columns = [
        "product_id",
        "warehouse_id",
        "quantity_on_hand",
        "reserved_quantity",
        "reorder_point",
        "product_name",
        "category_name",
        "warehouse_name",
        "warehouse_city",
        "warehouse_state",
    ]
    return df.reindex(columns=columns)


def _ensure_transactions_columns(df: pd.DataFrame) -> pd.DataFrame:
    columns = [
        "id",
        "product_id",
        "warehouse_id",
        "transaction_type",
        "quantity",
        "created_at",
        "product_name",
        "warehouse_name",
    ]
    return df.reindex(columns=columns)


def read_daily_sales_series(engine: Engine, product_id: str | None = None) -> pd.DataFrame:
    """Build a daily sales DataFrame matching the CSV schema used by the forecast service.

    Returns columns: date, product_id, warehouse_id, quantity_sold, category,
    unit_price, stock_level, reorder_point, product_name
    """
    product_filter = ""
    params: dict = {}
    if product_id:
        product_filter = "AND soi.product_id = :product_id"
        params["product_id"] = product_id

    query = text(
        f"""
        SELECT
            DATE(so.created_at) AS date,
            soi.product_id,
            so.warehouse_id,
            SUM(soi.quantity) AS quantity_sold,
            COALESCE(c.name, 'Unknown') AS category,
            AVG(soi.unit_price) AS unit_price,
            p.name AS product_name
        FROM sales_orders so
        JOIN sales_order_items soi ON soi.sales_order_id = so.id
        JOIN products p ON p.id = soi.product_id
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE so.status IN ('CONFIRMED', 'COMPLETED')
        {product_filter}
        GROUP BY DATE(so.created_at), soi.product_id, so.warehouse_id,
                 c.name, p.name
        ORDER BY date
        """
    )
    df = pd.read_sql(query, engine, params=params)
    if df.empty:
        return pd.DataFrame(columns=[
            "date", "product_id", "warehouse_id", "quantity_sold",
            "category", "unit_price", "product_name",
            "stock_level", "reorder_point",
        ])

    df["date"] = pd.to_datetime(df["date"], utc=True)

    # Attach inventory metadata (stock_level, reorder_point)
    inv_query = text(
        """
        SELECT
            i.product_id,
            i.warehouse_id,
            i.quantity_on_hand AS stock_level,
            p.reorder_point
        FROM inventory i
        JOIN products p ON p.id = i.product_id
        """
    )
    inv_df = pd.read_sql(inv_query, engine)
    if not inv_df.empty:
        df = df.merge(inv_df, on=["product_id", "warehouse_id"], how="left")
        df["stock_level"] = df["stock_level"].fillna(0).astype(int)
        df["reorder_point"] = df["reorder_point"].fillna(0).astype(int)
    else:
        df["stock_level"] = 0
        df["reorder_point"] = 0

    return df


def read_all_product_ids_with_sales(engine: Engine) -> list[str]:
    """Return distinct product IDs that have at least one completed sale."""
    query = text(
        """
        SELECT DISTINCT soi.product_id::text AS product_id
        FROM sales_order_items soi
        JOIN sales_orders so ON so.id = soi.sales_order_id
        WHERE so.status IN ('CONFIRMED', 'COMPLETED')
        """
    )
    df = pd.read_sql(query, engine)
    if df.empty:
        return []
    return df["product_id"].tolist()

