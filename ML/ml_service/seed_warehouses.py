from __future__ import annotations

import logging
import random
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Iterable
from uuid import UUID, uuid4

from sqlalchemy import create_engine
from sqlalchemy.dialects.postgresql import insert

from app.core.config import settings
from app.core.logging import configure_logging
from app.db.tables import create_tables, warehouses


logger = logging.getLogger(__name__)


WAREHOUSE_PRESETS: list[dict[str, str]] = [
    {"name": "Mumbai Central Warehouse", "code": "MUM-CEN", "city": "Mumbai", "state": "Maharashtra"},
    {"name": "Surat Distribution Center", "code": "SUR-DC", "city": "Surat", "state": "Gujarat"},
    {"name": "Delhi Storage Hub", "code": "DEL-HUB", "city": "New Delhi", "state": "Delhi"},
    {"name": "Bangalore Fulfillment Center", "code": "BLR-FUL", "city": "Bengaluru", "state": "Karnataka"},
    {"name": "Ahmedabad Retail Warehouse", "code": "AMD-RET", "city": "Ahmedabad", "state": "Gujarat"},
    {"name": "Pune Crossdock", "code": "PUN-XD", "city": "Pune", "state": "Maharashtra"},
    {"name": "Hyderabad Supply Depot", "code": "HYD-SUP", "city": "Hyderabad", "state": "Telangana"},
    {"name": "Chennai Inventory Park", "code": "CHE-INV", "city": "Chennai", "state": "Tamil Nadu"},
]


@dataclass(frozen=True)
class WarehouseSeed:
    id: UUID
    name: str
    code: str
    city: str
    state: str
    capacity: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


def build_engine():
    return create_engine(settings.database_url, pool_pre_ping=True)


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def build_warehouses(count: int) -> list[WarehouseSeed]:
    timestamp = now_utc()
    selected = random.sample(WAREHOUSE_PRESETS, k=count)
    seeds: list[WarehouseSeed] = []
    for item in selected:
        seeds.append(
            WarehouseSeed(
                id=uuid4(),
                name=item["name"],
                code=item["code"],
                city=item["city"],
                state=item["state"],
                capacity=random.randint(12000, 90000),
                is_active=True,
                created_at=timestamp,
                updated_at=timestamp,
            )
        )
    return seeds


def upsert_warehouses(engine, items: Iterable[WarehouseSeed]) -> int:
    payload = [
        {
            "id": item.id,
            "name": item.name,
            "code": item.code,
            "city": item.city,
            "state": item.state,
            "capacity": item.capacity,
            "is_active": item.is_active,
            "created_at": item.created_at,
            "updated_at": item.updated_at,
        }
        for item in items
    ]

    with engine.begin() as connection:
        stmt = (
            insert(warehouses)
            .values(payload)
            .on_conflict_do_update(
                index_elements=[warehouses.c.code],
                set_={
                    "name": insert(warehouses).excluded.name,
                    "city": insert(warehouses).excluded.city,
                    "state": insert(warehouses).excluded.state,
                    "capacity": insert(warehouses).excluded.capacity,
                    "is_active": insert(warehouses).excluded.is_active,
                    "updated_at": insert(warehouses).excluded.updated_at,
                },
            )
        )
        result = connection.execute(stmt)

    affected = result.rowcount or 0
    logger.info("warehouses_seeded", extra={"count": len(payload), "affected": affected})
    return affected


def main() -> None:
    configure_logging(settings.log_level)
    engine = build_engine()
    create_tables(engine)

    count = random.randint(5, 8)
    seeds = build_warehouses(count)
    upsert_warehouses(engine, seeds)


if __name__ == "__main__":
    main()
