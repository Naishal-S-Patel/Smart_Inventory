CREATE TABLE categories (
    id UUID PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE products (
    id UUID PRIMARY KEY,
    sku VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID NOT NULL,
    unit_cost NUMERIC(19,4) NOT NULL,
    selling_price NUMERIC(19,4) NOT NULL,
    unit_of_measure VARCHAR(32) NOT NULL,
    reorder_point INT NOT NULL DEFAULT 0,
    max_stock_level INT NOT NULL DEFAULT 0,
    barcode VARCHAR(128),
    image_url VARCHAR(512),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    product_search tsvector GENERATED ALWAYS AS (
        to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(barcode, ''))
    ) STORED,
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories (id)
);

ALTER TABLE products ADD CONSTRAINT uq_products_sku UNIQUE (sku);
ALTER TABLE products ADD CONSTRAINT uq_products_barcode UNIQUE (barcode);

CREATE INDEX idx_categories_name ON categories (name);
CREATE INDEX idx_products_category ON products (category_id);
CREATE INDEX idx_products_active ON products (is_active);
CREATE INDEX idx_products_name ON products (name);
CREATE INDEX idx_products_barcode ON products (barcode);
CREATE INDEX idx_products_search ON products USING GIN (product_search);
