from __future__ import annotations

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Index, Integer, MetaData, String, Table
from sqlalchemy.dialects.postgresql import UUID


metadata = MetaData()

products = Table(
    "products",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True),
)

warehouses = Table(
    "warehouses",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True),
    Column("name", String(255), nullable=False),
    Column("code", String(32), nullable=False, unique=True),
    Column("city", String(120), nullable=False),
    Column("state", String(120), nullable=False),
    Column("capacity", Integer, nullable=False),
    Column("is_active", Boolean, nullable=False, server_default="true"),
    Column("created_at", DateTime(timezone=True), nullable=False),
    Column("updated_at", DateTime(timezone=True), nullable=False),
)

inventory = Table(
    "inventory",
    metadata,
    Column("product_id", UUID(as_uuid=True), ForeignKey("products.id"), primary_key=True),
    Column("warehouse_id", UUID(as_uuid=True), ForeignKey("warehouses.id"), primary_key=True),
    Column("quantity_on_hand", Integer, nullable=False),
    Column("reserved_quantity", Integer, nullable=False),
    Column("reorder_point", Integer, nullable=False),
    Column("last_updated_at", DateTime(timezone=True), nullable=False),
)

inventory_transactions = Table(
    "inventory_transactions",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True),
    Column("product_id", UUID(as_uuid=True), ForeignKey("products.id"), nullable=False),
    Column("warehouse_id", UUID(as_uuid=True), ForeignKey("warehouses.id"), nullable=False),
    Column("transaction_type", String(32), nullable=False),
    Column("quantity", Integer, nullable=False),
    Column("created_at", DateTime(timezone=True), nullable=False),
)

Index("idx_warehouses_city", warehouses.c.city)
Index("idx_warehouses_state", warehouses.c.state)

Index("idx_inventory_product", inventory.c.product_id)
Index("idx_inventory_warehouse", inventory.c.warehouse_id)

Index("idx_transactions_product", inventory_transactions.c.product_id)
Index("idx_transactions_warehouse", inventory_transactions.c.warehouse_id)
Index("idx_transactions_type", inventory_transactions.c.transaction_type)
Index("idx_transactions_created", inventory_transactions.c.created_at)


def create_tables(engine) -> None:
    metadata.create_all(
        engine,
        checkfirst=True,
        tables=[warehouses, inventory, inventory_transactions],
    )
