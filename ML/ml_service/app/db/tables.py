from __future__ import annotations

from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    MetaData,
    Numeric,
    String,
    Table,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID


metadata = MetaData()

categories = Table(
    "categories",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True),
    Column("name", String(150), nullable=False),
    Column("description", Text),
    Column("created_at", DateTime(timezone=True), nullable=False),
    Column("updated_at", DateTime(timezone=True), nullable=False),
)

products = Table(
    "products",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True),
    Column("sku", String(64), nullable=False),
    Column("name", String(255), nullable=False),
    Column("description", Text),
    Column("category_id", UUID(as_uuid=True), ForeignKey("categories.id"), nullable=False),
    Column("unit_cost", Numeric(19, 4), nullable=False),
    Column("selling_price", Numeric(19, 4), nullable=False),
    Column("unit_of_measure", String(32), nullable=False),
    Column("reorder_point", Integer, nullable=False, server_default="0"),
    Column("max_stock_level", Integer, nullable=False, server_default="0"),
    Column("barcode", String(128)),
    Column("image_url", String(512)),
    Column("is_active", Boolean, nullable=False, server_default="true"),
    Column("created_at", DateTime(timezone=True), nullable=False),
    Column("updated_at", DateTime(timezone=True), nullable=False),
)

warehouses = Table(
    "warehouses",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True),
    Column("name", String(150), nullable=False),
    Column("code", String(50), nullable=False, unique=True),
    Column("city", String(100), nullable=False),
    Column("state", String(100), nullable=False),
    Column("capacity", Integer, nullable=False),
    Column("is_active", Boolean, nullable=False, server_default="true"),
    Column("created_at", DateTime(timezone=True), nullable=False),
    Column("updated_at", DateTime(timezone=True), nullable=False),
)

# Note: table is "inventory" (singular) matching actual DB schema
inventory = Table(
    "inventory",
    metadata,
    Column("product_id", UUID(as_uuid=True), ForeignKey("products.id"), primary_key=True),
    Column("warehouse_id", UUID(as_uuid=True), ForeignKey("warehouses.id"), primary_key=True),
    Column("quantity_on_hand", Integer, nullable=False, server_default="0"),
    Column("reserved_quantity", Integer, nullable=False, server_default="0"),
    Column("reorder_point", Integer, nullable=False, server_default="0"),
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
    Column("reference_id", String(128)),
    Column("reference_type", String(64)),
    Column("notes", Text),
    Column("created_by", String(255)),
    Column("created_at", DateTime(timezone=True), nullable=False),
)

# Sales orders for revenue analytics
sales_orders = Table(
    "sales_orders",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True),
    Column("order_number", String(64), nullable=False),
    Column("customer_id", UUID(as_uuid=True), nullable=False),
    Column("warehouse_id", UUID(as_uuid=True), ForeignKey("warehouses.id"), nullable=False),
    Column("status", String(32), nullable=False),
    Column("total_amount", Numeric(19, 4), nullable=False),
    Column("payment_status", String(32), nullable=False),
    Column("created_at", DateTime(timezone=True), nullable=False),
    Column("updated_at", DateTime(timezone=True), nullable=False),
)

sales_order_items = Table(
    "sales_order_items",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True),
    Column("sales_order_id", UUID(as_uuid=True), ForeignKey("sales_orders.id"), nullable=False),
    Column("product_id", UUID(as_uuid=True), ForeignKey("products.id"), nullable=False),
    Column("quantity", Integer, nullable=False),
    Column("unit_price", Numeric(19, 4), nullable=False),
    Column("total_price", Numeric(19, 4), nullable=False),
)

purchase_orders = Table(
    "purchase_orders",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True),
    Column("order_number", String(64), nullable=False),
    Column("supplier_id", UUID(as_uuid=True), nullable=False),
    Column("warehouse_id", UUID(as_uuid=True), ForeignKey("warehouses.id"), nullable=False),
    Column("status", String(32), nullable=False),
    Column("total_amount", Numeric(19, 4), nullable=False),
    Column("created_at", DateTime(timezone=True), nullable=False),
    Column("updated_at", DateTime(timezone=True), nullable=False),
)

# ─── Indexes ──────────────────────────────────────────────────
Index("idx_warehouses_city", warehouses.c.city)
Index("idx_warehouses_state", warehouses.c.state)

Index("idx_inventory_product", inventory.c.product_id)
Index("idx_inventory_warehouse", inventory.c.warehouse_id)

Index("idx_transactions_product", inventory_transactions.c.product_id)
Index("idx_transactions_warehouse", inventory_transactions.c.warehouse_id)
Index("idx_transactions_type", inventory_transactions.c.transaction_type)
Index("idx_transactions_created", inventory_transactions.c.created_at)

Index("idx_sales_orders_created", sales_orders.c.created_at)
Index("idx_sales_orders_status", sales_orders.c.status)
Index("idx_sales_order_items_product", sales_order_items.c.product_id)


def create_tables(engine) -> None:
    """Only creates tables that don't already exist. Never modifies existing schema."""
    metadata.create_all(
        engine,
        checkfirst=True,
        tables=[warehouses, inventory, inventory_transactions],
    )
