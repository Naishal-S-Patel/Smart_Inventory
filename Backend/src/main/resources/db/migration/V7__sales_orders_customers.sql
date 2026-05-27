CREATE TABLE customers (
    id UUID PRIMARY KEY,
    customer_code VARCHAR(64) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    loyalty_points INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

ALTER TABLE customers ADD CONSTRAINT uq_customers_code UNIQUE (customer_code);
ALTER TABLE customers ADD CONSTRAINT uq_customers_email UNIQUE (email);

CREATE INDEX idx_customers_active ON customers (is_active);
CREATE INDEX idx_customers_city ON customers (city);
CREATE INDEX idx_customers_state ON customers (state);
CREATE INDEX idx_customers_country ON customers (country);

CREATE SEQUENCE sales_order_number_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE sales_orders (
    id UUID PRIMARY KEY,
    order_number VARCHAR(32) NOT NULL,
    customer_id UUID NOT NULL,
    warehouse_id UUID NOT NULL,
    status VARCHAR(24) NOT NULL,
    total_amount NUMERIC(19,4) NOT NULL,
    payment_method VARCHAR(24),
    payment_status VARCHAR(24) NOT NULL,
    notes TEXT,
    created_by UUID NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_sales_orders_customer FOREIGN KEY (customer_id) REFERENCES customers (id),
    CONSTRAINT fk_sales_orders_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses (id),
    CONSTRAINT fk_sales_orders_created_by FOREIGN KEY (created_by) REFERENCES users (id)
);

ALTER TABLE sales_orders ADD CONSTRAINT uq_sales_orders_number UNIQUE (order_number);

CREATE INDEX idx_sales_orders_status ON sales_orders (status);
CREATE INDEX idx_sales_orders_customer ON sales_orders (customer_id);
CREATE INDEX idx_sales_orders_warehouse ON sales_orders (warehouse_id);
CREATE INDEX idx_sales_orders_payment_status ON sales_orders (payment_status);
CREATE INDEX idx_sales_orders_created_at ON sales_orders (created_at);

CREATE TABLE sales_order_items (
    id UUID PRIMARY KEY,
    sales_order_id UUID NOT NULL,
    product_id UUID NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(19,4) NOT NULL,
    total_price NUMERIC(19,4) NOT NULL,
    CONSTRAINT fk_sales_order_items_order
        FOREIGN KEY (sales_order_id)
        REFERENCES sales_orders (id),
    CONSTRAINT fk_sales_order_items_product
        FOREIGN KEY (product_id)
        REFERENCES products (id)
);

ALTER TABLE sales_order_items
    ADD CONSTRAINT uq_sales_order_items_order_product UNIQUE (sales_order_id, product_id);

CREATE INDEX idx_sales_order_items_order ON sales_order_items (sales_order_id);
CREATE INDEX idx_sales_order_items_product ON sales_order_items (product_id);
