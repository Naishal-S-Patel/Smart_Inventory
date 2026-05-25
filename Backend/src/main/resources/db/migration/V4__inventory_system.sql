CREATE TABLE warehouses (
    id UUID PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    capacity INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

ALTER TABLE warehouses ADD CONSTRAINT uq_warehouses_code UNIQUE (code);

CREATE INDEX idx_warehouses_active ON warehouses (is_active);
CREATE INDEX idx_warehouses_city_state ON warehouses (city, state);

CREATE TABLE inventories (
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL,
    warehouse_id UUID NOT NULL,
    quantity_on_hand INT NOT NULL DEFAULT 0,
    reserved_quantity INT NOT NULL DEFAULT 0,
    last_updated_at TIMESTAMP NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_inventories_product FOREIGN KEY (product_id) REFERENCES products (id),
    CONSTRAINT fk_inventories_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses (id),
    CONSTRAINT chk_inventories_quantity_non_negative CHECK (quantity_on_hand >= 0),
    CONSTRAINT chk_inventories_reserved_non_negative CHECK (reserved_quantity >= 0)
);

ALTER TABLE inventories ADD CONSTRAINT uq_inventory_product_warehouse UNIQUE (product_id, warehouse_id);

CREATE INDEX idx_inventory_product_warehouse ON inventories (product_id, warehouse_id);
CREATE INDEX idx_inventory_warehouse ON inventories (warehouse_id);
CREATE INDEX idx_inventory_low_stock ON inventories (warehouse_id, quantity_on_hand, reserved_quantity);

CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL,
    warehouse_id UUID NOT NULL,
    transaction_type VARCHAR(32) NOT NULL,
    quantity INT NOT NULL,
    reference_id VARCHAR(128),
    reference_type VARCHAR(64),
    notes TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_inventory_transactions_product FOREIGN KEY (product_id) REFERENCES products (id),
    CONSTRAINT fk_inventory_transactions_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses (id)
);

CREATE INDEX idx_inventory_transactions_created_at ON inventory_transactions (created_at);
CREATE INDEX idx_inventory_transactions_product ON inventory_transactions (product_id);
CREATE INDEX idx_inventory_transactions_warehouse ON inventory_transactions (warehouse_id);
