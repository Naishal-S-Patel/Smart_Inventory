from __future__ import annotations

import logging
from typing import Any

import pandas as pd
from sqlalchemy import create_engine, text

from app.core.config import settings
from app.core.logging import configure_logging


logger = logging.getLogger(__name__)


def _engine():
    return create_engine(settings.database_url, pool_pre_ping=True)


def fetch_products_dataframe(limit: int | None = None) -> pd.DataFrame:
    configure_logging(settings.log_level)
    sql = """
        SELECT
            id,
            sku,
            name,
            description,
            category_id,
            unit_cost,
            selling_price,
            unit_of_measure,
            reorder_point,
            max_stock_level,
            barcode,
            is_active,
            created_at,
            updated_at
        FROM products
        WHERE is_active = true
        ORDER BY created_at DESC
    """
    if limit is not None:
        sql += " LIMIT :limit"

    with _engine().connect() as connection:
        df = pd.read_sql_query(text(sql), connection, params={"limit": limit} if limit else None)

    logger.info("products_dataframe_loaded", extra={"rows": len(df)})
    return df


def fetch_categories_dataframe() -> pd.DataFrame:
    configure_logging(settings.log_level)
    sql = """
        SELECT id, name, description, created_at, updated_at
        FROM categories
        ORDER BY name
    """

    with _engine().connect() as connection:
        df = pd.read_sql_query(text(sql), connection)

    logger.info("categories_dataframe_loaded", extra={"rows": len(df)})
    return df
