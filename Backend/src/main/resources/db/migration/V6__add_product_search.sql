ALTER TABLE products
    ADD COLUMN IF NOT EXISTS product_search tsvector
    GENERATED ALWAYS AS (
        to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(barcode, ''))
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_products_search ON products USING GIN (product_search);
