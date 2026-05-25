from __future__ import annotations

import logging
import random
from datetime import datetime, timezone
from typing import Iterable
from uuid import UUID

import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.dialects.postgresql import insert

from app.core.config import settings
from app.core.logging import configure_logging
from app.db.tables import create_tables, inventory


logger = logging.getLogger(__name__)


FMCG_CATEGORIES = {
    "Dairy",
    "Bakery",
    "Beverages",
    "Snacks",
    "Frozen Foods",
    "Fruits & Vegetables",
    "Grocery",
}

MEDIUM_CATEGORIES = {
    "Household",
    "Personal Care",
    "Pharmacy",
    "Pet Supplies",
    "Baby Care",
    "Stationery",
}

LOW_CATEGORIES = {"Electronics", "Clothing"}


def build_engine():
    return create_engine(settings.database_url, pool_pre_ping=True)


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _fetch_products(engine) -> pd.DataFrame:
    sql = """
        SELECT p.id, p.reorder_point, p.max_stock_level, c.name AS category
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.is_active = true
    """
    with engine.connect() as connection:
        return pd.read_sql_query(text(sql), connection)


def _fetch_warehouses(engine) -> pd.DataFrame:
    sql = """
        SELECT id, capacity
        FROM warehouses
        WHERE is_active = true
    """
    with engine.connect() as connection:
        return pd.read_sql_query(text(sql), connection)


def _quantity_range(category: str) -> tuple[int, int]:
    if category in FMCG_CATEGORIES:
        return (200, 1200)
    if category in MEDIUM_CATEGORIES:
        return (80, 450)
    if category in LOW_CATEGORIES:
        return (10, 90)
    return (60, 300)


def build_inventory_rows(
    products: pd.DataFrame, warehouses_df: pd.DataFrame
) -> list[dict[str, object]]:
    timestamp = now_utc()
    payload: list[dict[str, object]] = []

    for _, product in products.iterrows():
        category = str(product["category"])
        min_qty, max_qty = _quantity_range(category)
        reorder_point = int(product["reorder_point"]) if product["reorder_point"] else 0
        max_stock_level = int(product["max_stock_level"]) if product["max_stock_level"] else 0

        for _, warehouse in warehouses_df.iterrows():
            capacity_factor = max(0.5, min(1.2, float(warehouse["capacity"]) / 60000.0))
            base_qty = random.randint(min_qty, max_qty)
            quantity_on_hand = int(base_qty * capacity_factor)
            if max_stock_level > 0:
                quantity_on_hand = min(quantity_on_hand, max_stock_level)

            reserved_quantity = max(0, int(quantity_on_hand * random.uniform(0.02, 0.12)))
            final_reorder = reorder_point if reorder_point > 0 else max(10, int(quantity_on_hand * 0.15))

            payload.append(
                {
                    "product_id": product["id"],
                    "warehouse_id": warehouse["id"],
                    "quantity_on_hand": quantity_on_hand,
                    "reserved_quantity": reserved_quantity,
                    "reorder_point": final_reorder,
                    "last_updated_at": timestamp,
                }
            )

    return payload


def upsert_inventory(engine, rows: Iterable[dict[str, object]], chunk_size: int = 5000) -> int:
    rows_list = list(rows)
    inserted = 0
    with engine.begin() as connection:
        for start in range(0, len(rows_list), chunk_size):
            chunk = rows_list[start : start + chunk_size]
            stmt = (
                insert(inventory)
                .values(chunk)
                .on_conflict_do_update(
                    index_elements=[inventory.c.product_id, inventory.c.warehouse_id],
                    set_={
                        "quantity_on_hand": insert(inventory).excluded.quantity_on_hand,
                        "reserved_quantity": insert(inventory).excluded.reserved_quantity,
                        "reorder_point": insert(inventory).excluded.reorder_point,
                        "last_updated_at": insert(inventory).excluded.last_updated_at,
                    },
                )
            )
            result = connection.execute(stmt)
            inserted += result.rowcount or 0

    logger.info(
        "inventory_seeded",
        extra={"rows": len(rows_list), "affected": inserted, "chunk_size": chunk_size},
    )
    return inserted


def main() -> None:
    configure_logging(settings.log_level)
    engine = build_engine()
    create_tables(engine)

    products = _fetch_products(engine)
    warehouses_df = _fetch_warehouses(engine)
    if products.empty or warehouses_df.empty:
        logger.warning(
            "inventory_seed_skipped",
            extra={"products": len(products), "warehouses": len(warehouses_df)},
        )
        return

    rows = build_inventory_rows(products, warehouses_df)
    upsert_inventory(engine, rows)


if __name__ == "__main__":
    main()
