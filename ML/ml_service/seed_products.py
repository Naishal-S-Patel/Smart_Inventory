from __future__ import annotations

import logging
import random
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Iterable
from uuid import UUID, uuid4

from faker import Faker
from sqlalchemy import MetaData, Table, create_engine, select
from sqlalchemy.dialects.postgresql import insert

from app.core.config import settings
from app.core.logging import configure_logging


fake = Faker()
logger = logging.getLogger(__name__)


CATEGORY_NAMES = [
    "Dairy",
    "Snacks",
    "Beverages",
    "Electronics",
    "Personal Care",
    "Bakery",
    "Frozen Foods",
    "Household",
    "Produce",
    "Pharmacy",
]


@dataclass(frozen=True)
class CategorySeed:
    id: UUID
    name: str
    description: str
    created_at: datetime
    updated_at: datetime


@dataclass(frozen=True)
class ProductSeed:
    id: UUID
    sku: str
    name: str
    description: str
    category_id: UUID
    unit_cost: float
    selling_price: float
    reorder_point: int
    max_stock_level: int
    barcode: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


def build_engine():
    return create_engine(settings.database_url, pool_pre_ping=True)


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def generate_sku(category_name: str, index: int) -> str:
    prefix = "".join(word[0] for word in category_name.split()).upper()
    random_part = fake.bothify(text="??##").upper()
    return f"{prefix}-{index:04d}-{random_part}"


def generate_barcode() -> str:
    return "".join(fake.random_choices(elements=list("0123456789"), length=13))


def build_categories() -> list[CategorySeed]:
    timestamp = now_utc()
    seeds: list[CategorySeed] = []
    for name in CATEGORY_NAMES:
        seeds.append(
            CategorySeed(
                id=uuid4(),
                name=name,
                description=fake.sentence(nb_words=8),
                created_at=timestamp,
                updated_at=timestamp,
            )
        )
    return seeds


def build_products(category_ids: list[UUID], count: int) -> list[ProductSeed]:
    timestamp = now_utc()
    seeds: list[ProductSeed] = []
    used_skus: set[str] = set()
    used_barcodes: set[str] = set()

    for index in range(1, count + 1):
        category_id = random.choice(category_ids)
        name = fake.unique.catch_phrase()
        sku = generate_sku(name.split()[0], index)
        while sku in used_skus:
            sku = generate_sku(name.split()[0], index + random.randint(1, 999))
        used_skus.add(sku)

        barcode = generate_barcode()
        while barcode in used_barcodes:
            barcode = generate_barcode()
        used_barcodes.add(barcode)

        unit_cost = round(random.uniform(1.0, 120.0), 2)
        margin = random.uniform(1.1, 1.8)
        selling_price = round(unit_cost * margin, 2)

        seeds.append(
            ProductSeed(
                id=uuid4(),
                sku=sku,
                name=name,
                description=fake.sentence(nb_words=12),
                category_id=category_id,
                unit_cost=unit_cost,
                selling_price=selling_price,
                reorder_point=random.randint(5, 50),
                max_stock_level=random.randint(100, 500),
                barcode=barcode,
                is_active=True,
                created_at=timestamp,
                updated_at=timestamp,
            )
        )
    return seeds


def upsert_categories(engine, categories: Iterable[CategorySeed]) -> dict[str, UUID]:
    metadata = MetaData()
    categories_table = Table("categories", metadata, autoload_with=engine)

    name_to_id: dict[str, UUID] = {}
    with engine.begin() as connection:
        existing = connection.execute(select(categories_table.c.id, categories_table.c.name))
        for row in existing:
            name_to_id[row.name] = row.id

        missing = [c for c in categories if c.name not in name_to_id]
        if missing:
            payload = [
                {
                    "id": c.id,
                    "name": c.name,
                    "description": c.description,
                    "created_at": c.created_at,
                    "updated_at": c.updated_at,
                }
                for c in missing
            ]
            connection.execute(insert(categories_table), payload)
            for c in missing:
                name_to_id[c.name] = c.id

    logger.info("categories_seeded", extra={"count": len(name_to_id)})
    return name_to_id


def insert_products(engine, products: Iterable[ProductSeed]) -> int:
    metadata = MetaData()
    products_table = Table("products", metadata, autoload_with=engine)

    payload = [
        {
            "id": p.id,
            "sku": p.sku,
            "name": p.name,
            "description": p.description,
            "category_id": p.category_id,
            "unit_cost": p.unit_cost,
            "selling_price": p.selling_price,
            "unit_of_measure": "EA",
            "reorder_point": p.reorder_point,
            "max_stock_level": p.max_stock_level,
            "barcode": p.barcode,
            "image_url": None,
            "is_active": p.is_active,
            "created_at": p.created_at,
            "updated_at": p.updated_at,
        }
        for p in products
    ]

    with engine.begin() as connection:
        stmt = insert(products_table).values(payload).on_conflict_do_nothing()
        result = connection.execute(stmt)

    inserted = result.rowcount or 0
    logger.info("products_seeded", extra={"requested": len(payload), "inserted": inserted})
    return inserted


def main() -> None:
    configure_logging(settings.log_level)
    engine = build_engine()

    categories = build_categories()
    category_map = upsert_categories(engine, categories)
    products = build_products(list(category_map.values()), 500)

    insert_products(engine, products)


if __name__ == "__main__":
    main()
