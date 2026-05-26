CREATE TABLE suppliers (
    id UUID PRIMARY KEY,
    supplier_code VARCHAR(64) NOT NULL,
    company_name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(150),
    email VARCHAR(255),
    phone VARCHAR(50),
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    avg_lead_days INT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

ALTER TABLE suppliers ADD CONSTRAINT uq_suppliers_code UNIQUE (supplier_code);

CREATE INDEX idx_suppliers_active ON suppliers (is_active);
CREATE INDEX idx_suppliers_code ON suppliers (supplier_code);
CREATE INDEX idx_suppliers_company ON suppliers (company_name);

CREATE SEQUENCE purchase_order_number_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY,
    order_number VARCHAR(32) NOT NULL,
    supplier_id UUID NOT NULL,
    warehouse_id UUID NOT NULL,
    status VARCHAR(24) NOT NULL,
    total_amount NUMERIC(19,4) NOT NULL,
    expected_delivery_date TIMESTAMP NULL,
    actual_delivery_date TIMESTAMP NULL,
    created_by UUID NULL,
    approved_by UUID NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_purchase_orders_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers (id),
    CONSTRAINT fk_purchase_orders_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses (id),
    CONSTRAINT fk_purchase_orders_created_by FOREIGN KEY (created_by) REFERENCES users (id),
    CONSTRAINT fk_purchase_orders_approved_by FOREIGN KEY (approved_by) REFERENCES users (id)
);

ALTER TABLE purchase_orders ADD CONSTRAINT uq_purchase_orders_number UNIQUE (order_number);

CREATE INDEX idx_purchase_orders_status ON purchase_orders (status);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders (supplier_id);
CREATE INDEX idx_purchase_orders_warehouse ON purchase_orders (warehouse_id);
CREATE INDEX idx_purchase_orders_created_at ON purchase_orders (created_at);

CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY,
    purchase_order_id UUID NOT NULL,
    product_id UUID NOT NULL,
    quantity INTEGER NOT NULL,
    unit_cost NUMERIC(12,2) NOT NULL,
    total_cost NUMERIC(12,2) NOT NULL,
    received_quantity INTEGER DEFAULT 0,
    CONSTRAINT fk_poi_po
        FOREIGN KEY (purchase_order_id)
        REFERENCES purchase_orders(id),
    CONSTRAINT fk_poi_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
);

ALTER TABLE purchase_order_items
    ADD CONSTRAINT uq_purchase_order_items_po_product UNIQUE (purchase_order_id, product_id);

CREATE INDEX idx_purchase_order_items_po ON purchase_order_items (purchase_order_id);
CREATE INDEX idx_purchase_order_items_product ON purchase_order_items (product_id);
