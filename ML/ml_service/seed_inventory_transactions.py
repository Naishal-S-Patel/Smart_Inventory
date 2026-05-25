from __future__ import annotations

import logging
import random
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from uuid import UUID, uuid4

from sqlalchemy import create_engine, text
from sqlalchemy.dialects.postgresql import insert

from app.core.config import settings
from app.core.logging import configure_logging
from app.db.tables import create_tables, inventory, inventory_transactions


logger = logging.getLogger(__name__)


TRANSACTION_TYPES = [
    "RECEIVE",
    "SALE",
    "RETURN",
    "ADJUSTMENT",
    "TRANSFER_IN",
    "TRANSFER_OUT",
]

CATEGORY_WEIGHTS = {
    "Dairy": 5.0,
    "Bakery": 3.2,
    "Beverages": 4.4,
    "Snacks": 3.8,
    "Frozen Foods": 3.1,
    "Fruits & Vegetables": 4.0,
    "Household": 2.0,
    "Personal Care": 2.1,
    "Electronics": 0.6,
    "Clothing": 1.3,
    "Stationery": 1.2,
    "Pharmacy": 2.3,
    "Grocery": 3.6,
    "Pet Supplies": 1.1,
    "Baby Care": 2.2,
}

CATEGORY_QTY_RANGE = {
    "Dairy": (2, 12),
    "Bakery": (2, 10),
    "Beverages": (3, 18),
    "Snacks": (2, 15),
    "Frozen Foods": (1, 8),
    "Fruits & Vegetables": (2, 20),
    "Household": (1, 6),
    "Personal Care": (1, 6),
    "Electronics": (1, 2),
    "Clothing": (1, 3),
    "Stationery": (1, 8),
    "Pharmacy": (1, 4),
    "Grocery": (2, 14),
    "Pet Supplies": (1, 5),
    "Baby Care": (1, 6),
}


@dataclass(frozen=True)
class ProductMeta:
    id: UUID
    category: str
    name: str
    reorder_point: int
    max_stock_level: int


@dataclass
class InventoryState:
    quantity_on_hand: int
    reorder_point: int


@dataclass(frozen=True)
class WarehouseMeta:
    id: UUID
    capacity: int


def build_engine():
    return create_engine(settings.database_url, pool_pre_ping=True)


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _fetch_products(engine) -> list[ProductMeta]:
    sql = """
        SELECT p.id, p.name, c.name AS category, p.reorder_point, p.max_stock_level
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.is_active = true
    """
    with engine.connect() as connection:
        rows = connection.execute(text(sql)).fetchall()

    products: list[ProductMeta] = []
    for row in rows:
        products.append(
            ProductMeta(
                id=row.id,
                category=row.category,
                name=row.name,
                reorder_point=int(row.reorder_point or 0),
                max_stock_level=int(row.max_stock_level or 0),
            )
        )
    return products


def _fetch_warehouses(engine) -> list[WarehouseMeta]:
    sql = """
        SELECT id, capacity
        FROM warehouses
        WHERE is_active = true
    """
    with engine.connect() as connection:
        rows = connection.execute(text(sql)).fetchall()

    return [WarehouseMeta(id=row.id, capacity=int(row.capacity)) for row in rows]


def _fetch_inventory(engine) -> dict[tuple[UUID, UUID], InventoryState]:
    sql = """
        SELECT product_id, warehouse_id, quantity_on_hand, reorder_point
        FROM inventory
    """
    with engine.connect() as connection:
        rows = connection.execute(text(sql)).fetchall()

    inventory_state: dict[tuple[UUID, UUID], InventoryState] = {}
    for row in rows:
        key = (row.product_id, row.warehouse_id)
        inventory_state[key] = InventoryState(
            quantity_on_hand=int(row.quantity_on_hand),
            reorder_point=int(row.reorder_point),
        )
    return inventory_state


def _season_for_month(month: int) -> str:
    if month in {12, 1, 2}:
        return "winter"
    if month in {3}:
        return "spring"
    if month in {4, 5, 6}:
        return "summer"
    if month in {7, 8, 9}:
        return "monsoon"
    return "autumn"


def _festival_multiplier(day: date) -> float:
    if day.month == 10 and day.day >= 20:
        return 1.35
    if day.month == 11 and day.day <= 15:
        return 1.35
    return 1.0


def _category_day_multiplier(category: str, day: date, is_weekend: bool) -> float:
    season = _season_for_month(day.month)
    multiplier = 1.0

    if is_weekend and category in {"Beverages", "Snacks", "Frozen Foods"}:
        multiplier *= 1.3
    if is_weekend and category == "Bakery":
        multiplier *= 1.15

    if season == "summer" and category in {"Beverages", "Frozen Foods"}:
        multiplier *= 1.5
    if season == "summer" and category == "Dairy":
        multiplier *= 1.1
    if season == "winter" and category == "Clothing":
        multiplier *= 1.6
    if season == "winter" and category == "Pharmacy":
        multiplier *= 1.15

    if season == "monsoon" and category == "Grocery":
        multiplier *= 1.1

    return multiplier


def _product_name_multiplier(name: str, day: date) -> float:
    normalized = name.lower()
    if "ice cream" in normalized:
        return 1.6 if day.month in {4, 5, 6, 7} else 1.0
    if "cola" in normalized or "pepsi" in normalized or "coca" in normalized:
        return 1.2 if day.weekday() >= 5 else 1.0
    if "cold" in normalized and "drink" in normalized:
        return 1.2 if day.weekday() >= 5 else 1.0
    return 1.0


def _random_time_for_day(day: date) -> datetime:
    hour = random.choice([9, 11, 13, 15, 17, 19, 20])
    minute = random.randint(0, 59)
    second = random.randint(0, 59)
    return datetime(day.year, day.month, day.day, hour, minute, second, tzinfo=timezone.utc)


def _weighted_products(products: list[ProductMeta], day: date) -> list[float]:
    festival_multiplier = _festival_multiplier(day)
    weights: list[float] = []
    is_weekend = day.weekday() >= 5
    for product in products:
        base = CATEGORY_WEIGHTS.get(product.category, 1.0)
        day_multiplier = _category_day_multiplier(product.category, day, is_weekend)
        name_multiplier = _product_name_multiplier(product.name, day)
        weights.append(base * day_multiplier * name_multiplier * festival_multiplier)
    return weights


def _quantity_for_category(category: str) -> int:
    min_qty, max_qty = CATEGORY_QTY_RANGE.get(category, (1, 6))
    return random.randint(min_qty, max_qty)


def _warehouse_scale(capacity: int) -> float:
    return max(0.6, min(1.4, capacity / 60000.0))


def _should_return() -> bool:
    return random.random() < 0.03


def _should_adjust() -> bool:
    return random.random() < 0.015


def _should_transfer() -> bool:
    return random.random() < 0.02


def _build_receive_qty(max_stock_level: int, current: int) -> int:
    if max_stock_level > 0:
        return max(10, max_stock_level - current)
    return random.randint(40, 180)


def _load_days(months: int) -> list[date]:
    end = datetime.now(timezone.utc).date()
    start = end - timedelta(days=months * 30)
    return [start + timedelta(days=offset) for offset in range((end - start).days + 1)]


def generate_transactions(
    engine,
    months: int,
    target_transactions: int,
    chunk_size: int,
) -> int:
    products = _fetch_products(engine)
    warehouses = _fetch_warehouses(engine)
    inventory_state = _fetch_inventory(engine)

    if not products or not warehouses or not inventory_state:
        logger.warning(
            "transactions_seed_skipped",
            extra={
                "products": len(products),
                "warehouses": len(warehouses),
                "inventory": len(inventory_state),
            },
        )
        return 0

    days = _load_days(months)
    transaction_rows: list[dict[str, object]] = []
    inserted = 0
    total_generated = 0

    for day in days:
        day_weights = _weighted_products(products, day)
        is_weekend = day.weekday() >= 5
        festival_multiplier = _festival_multiplier(day)

        for warehouse in warehouses:
            base_sales = 80 if is_weekend else 65
            base_sales = int(base_sales * _warehouse_scale(warehouse.capacity) * festival_multiplier)
            sales_events = max(25, int(random.gauss(base_sales, base_sales * 0.2)))

            for _ in range(sales_events):
                if total_generated >= target_transactions:
                    break

                product = random.choices(products, weights=day_weights, k=1)[0]
                key = (product.id, warehouse.id)
                state = inventory_state.get(key)
                if state is None:
                    continue

                qty = _quantity_for_category(product.category)
                if state.quantity_on_hand <= 0:
                    receive_qty = _build_receive_qty(product.max_stock_level, state.quantity_on_hand)
                    state.quantity_on_hand += receive_qty
                    transaction_rows.append(
                        {
                            "id": uuid4(),
                            "product_id": product.id,
                            "warehouse_id": warehouse.id,
                            "transaction_type": "RECEIVE",
                            "quantity": receive_qty,
                            "created_at": _random_time_for_day(day),
                        }
                    )
                    total_generated += 1

                sale_qty = min(qty, max(1, state.quantity_on_hand))
                state.quantity_on_hand -= sale_qty
                transaction_rows.append(
                    {
                        "id": uuid4(),
                        "product_id": product.id,
                        "warehouse_id": warehouse.id,
                        "transaction_type": "SALE",
                        "quantity": sale_qty,
                        "created_at": _random_time_for_day(day),
                    }
                )
                total_generated += 1

                if _should_return():
                    return_qty = max(1, int(sale_qty * random.uniform(0.2, 0.6)))
                    state.quantity_on_hand += return_qty
                    transaction_rows.append(
                        {
                            "id": uuid4(),
                            "product_id": product.id,
                            "warehouse_id": warehouse.id,
                            "transaction_type": "RETURN",
                            "quantity": return_qty,
                            "created_at": _random_time_for_day(day),
                        }
                    )
                    total_generated += 1

                if _should_adjust():
                    adjust_qty = max(1, int(sale_qty * random.uniform(0.1, 0.4)))
                    state.quantity_on_hand = max(0, state.quantity_on_hand - adjust_qty)
                    transaction_rows.append(
                        {
                            "id": uuid4(),
                            "product_id": product.id,
                            "warehouse_id": warehouse.id,
                            "transaction_type": "ADJUSTMENT",
                            "quantity": adjust_qty,
                            "created_at": _random_time_for_day(day),
                        }
                    )
                    total_generated += 1

                if state.quantity_on_hand < state.reorder_point:
                    receive_qty = _build_receive_qty(product.max_stock_level, state.quantity_on_hand)
                    state.quantity_on_hand += receive_qty
                    transaction_rows.append(
                        {
                            "id": uuid4(),
                            "product_id": product.id,
                            "warehouse_id": warehouse.id,
                            "transaction_type": "RECEIVE",
                            "quantity": receive_qty,
                            "created_at": _random_time_for_day(day),
                        }
                    )
                    total_generated += 1

                if _should_transfer() and len(warehouses) > 1:
                    target_warehouse = random.choice([w for w in warehouses if w.id != warehouse.id])
                    transfer_qty = max(1, int(sale_qty * random.uniform(0.4, 0.9)))
                    state.quantity_on_hand = max(0, state.quantity_on_hand - transfer_qty)
                    transaction_rows.append(
                        {
                            "id": uuid4(),
                            "product_id": product.id,
                            "warehouse_id": warehouse.id,
                            "transaction_type": "TRANSFER_OUT",
                            "quantity": transfer_qty,
                            "created_at": _random_time_for_day(day),
                        }
                    )
                    total_generated += 1

                    target_state = inventory_state.get((product.id, target_warehouse.id))
                    if target_state:
                        target_state.quantity_on_hand += transfer_qty
                    transaction_rows.append(
                        {
                            "id": uuid4(),
                            "product_id": product.id,
                            "warehouse_id": target_warehouse.id,
                            "transaction_type": "TRANSFER_IN",
                            "quantity": transfer_qty,
                            "created_at": _random_time_for_day(day),
                        }
                    )
                    total_generated += 1

                if len(transaction_rows) >= chunk_size:
                    inserted += _flush_transactions(engine, transaction_rows)
                    transaction_rows.clear()

            if total_generated >= target_transactions:
                break

        if total_generated >= target_transactions:
            break

    if transaction_rows:
        inserted += _flush_transactions(engine, transaction_rows)

    _sync_inventory(engine, inventory_state)
    logger.info(
        "transactions_seeded",
        extra={
            "generated": total_generated,
            "inserted": inserted,
            "months": months,
            "target": target_transactions,
        },
    )
    return inserted


def _flush_transactions(engine, rows: list[dict[str, object]]) -> int:
    with engine.begin() as connection:
        stmt = insert(inventory_transactions).values(rows)
        result = connection.execute(stmt)
    return result.rowcount or 0


def _sync_inventory(engine, inventory_state: dict[tuple[UUID, UUID], InventoryState]) -> None:
    timestamp = now_utc()
    payload = [
        {
            "product_id": product_id,
            "warehouse_id": warehouse_id,
            "quantity_on_hand": state.quantity_on_hand,
            "reserved_quantity": 0,
            "reorder_point": state.reorder_point,
            "last_updated_at": timestamp,
        }
        for (product_id, warehouse_id), state in inventory_state.items()
    ]

    with engine.begin() as connection:
        for start in range(0, len(payload), 5000):
            chunk = payload[start : start + 5000]
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
            connection.execute(stmt)


def main() -> None:
    configure_logging(settings.log_level)
    engine = build_engine()
    create_tables(engine)

    months = 9
    target_transactions = 250000
    chunk_size = 8000

    generate_transactions(engine, months=months, target_transactions=target_transactions, chunk_size=chunk_size)


if __name__ == "__main__":
    main()
