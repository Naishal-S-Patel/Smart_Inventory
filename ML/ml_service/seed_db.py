from __future__ import annotations

import logging
import random
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from typing import Final
import uuid
from uuid import UUID, uuid4

import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.dialects.postgresql import insert

from app.core.config import settings
from app.core.logging import configure_logging

configure_logging(settings.log_level)
logger = logging.getLogger("seed_db")

# Connection
engine = create_engine(settings.database_url, pool_pre_ping=True)

# Preset details
CATEGORY_NAMES = [
    "Dairy", "Bakery", "Beverages", "Snacks", "Frozen Foods",
    "Fruits & Vegetables", "Household", "Personal Care", "Electronics",
    "Clothing", "Stationery", "Pharmacy", "Grocery", "Pet Supplies", "Baby Care"
]

CATEGORY_DESCRIPTIONS = {
    "Dairy": "Milk, curd, cheese, and daily dairy essentials.",
    "Bakery": "Fresh breads, buns, and baked snacks.",
    "Beverages": "Soft drinks, juices, water, and energy drinks.",
    "Snacks": "Chips, biscuits, and ready-to-eat snacks.",
    "Frozen Foods": "Frozen vegetables, snacks, and ready meals.",
    "Fruits & Vegetables": "Fresh produce for everyday cooking.",
    "Household": "Cleaning, tissue, and home care supplies.",
    "Personal Care": "Hygiene, grooming, and personal care items.",
    "Electronics": "Everyday gadgets and accessories.",
    "Clothing": "Apparel for men, women, and kids.",
    "Stationery": "Office and school stationery essentials.",
    "Pharmacy": "OTC health and medical essentials.",
    "Grocery": "Staples, pulses, spices, and pantry items.",
    "Pet Supplies": "Food, grooming, and pet care products.",
    "Baby Care": "Diapers, wipes, and baby essentials.",
}

CATEGORY_PRODUCTS = {
    "Dairy": [
        "Amul Milk 500ml", "Amul Milk 1L", "Mother Dairy Curd 1kg", "Mother Dairy Curd 500g",
        "Cheese Slices 200g", "Cheddar Cheese Block 250g", "Paneer 200g", "Butter 100g",
        "Unsalted Butter 500g", "Greek Yogurt 400g", "Lassi 200ml", "Flavored Yogurt Mango 100g",
        "Whipping Cream 200ml", "Condensed Milk 400g", "Milk Powder 500g", "Mozzarella Cheese 200g",
        "Buttermilk 1L", "Ghee 500ml", "Low Fat Milk 1L", "Fresh Cream 250ml", "Dahi Cup 85g", "Cheese Spread 200g"
    ],
    "Bakery": [
        "Brown Bread 400g", "White Bread 400g", "Multigrain Bread 400g", "Burger Buns 6 Pack",
        "Hot Dog Buns 6 Pack", "Croissant 4 Pack", "Chocolate Muffin 2 Pack", "Vanilla Muffin 2 Pack",
        "Pav Bread 6 Pack", "Plain Bagel 4 Pack", "Garlic Bread 200g", "Whole Wheat Bread 400g",
        "Banana Bread 300g", "Cinnamon Rolls 4 Pack", "Dinner Rolls 12 Pack", "Pita Bread 6 Pack",
        "Tortilla Wraps 6 Pack", "Rusk Toast 200g", "Cake Rusk 200g", "Fruit Cake Slice 200g",
        "Cream Donut 2 Pack", "Choco Chip Cookies 200g"
    ],
    "Beverages": [
        "Coca Cola 750ml", "Pepsi Can 330ml", "Tropicana Orange Juice 1L", "Red Bull Energy Drink 250ml",
        "Sprite 2L", "Fanta Orange 1L", "Mountain Dew 600ml", "Thums Up 750ml", "Minute Maid Mixed Fruit 1L",
        "Real Mango Juice 1L", "Bottled Water 1L", "Sparkling Water 500ml", "Iced Tea Lemon 500ml",
        "Cold Coffee 200ml", "Coconut Water 500ml", "Apple Juice 1L", "Ginger Ale 300ml", "Soda Water 750ml",
        "Sports Drink Orange 500ml", "Mango Lassi 200ml", "Packaged Milkshake Chocolate 200ml", "Green Tea Bottle 500ml"
    ],
    "Snacks": [
        "Lay's Chips Classic 52g", "Lay's Chips Magic Masala 52g", "Kurkure Masala Munch 90g", "Oreo Biscuits 120g",
        "Haldiram Bhujia 200g", "Nacho Chips 150g", "Salted Peanuts 200g", "Cashew Nuts 200g", "Roasted Almonds 200g",
        "Popcorn Butter 90g", "Choco Wafer Biscuits 150g", "Digestive Biscuits 200g", "Makhana Roasted 100g",
        "Mixture Namkeen 200g", "Salted Pretzels 150g", "Granola Bar 6 Pack", "Protein Bar Chocolate 50g",
        "Trail Mix 200g", "Ragi Chips 80g", "Poha Chivda 200g", "Peanut Chikki 200g", "Rusk Stick 200g"
    ],
    "Frozen Foods": [
        "Frozen Peas 500g", "Frozen Sweet Corn 500g", "Frozen Mixed Veg 500g", "Frozen French Fries 1kg",
        "Frozen Paratha 5 Pack", "Frozen Momos Veg 20 Pack", "Frozen Chicken Nuggets 500g", "Frozen Fish Fingers 400g",
        "Frozen Pizza Margherita 300g", "Ice Cream Vanilla 1L", "Ice Cream Chocolate 1L", "Frozen Berries 500g",
        "Frozen Strawberry 500g", "Frozen Paneer Cubes 500g", "Frozen Idli 10 Pack", "Frozen Dosa 6 Pack",
        "Frozen Aloo Tikki 10 Pack", "Frozen Spring Rolls 10 Pack", "Frozen Garlic Bread 300g", "Frozen Samosa 12 Pack",
        "Frozen Hash Browns 500g", "Frozen Kulfi 6 Pack"
    ],
    "Fruits & Vegetables": [
        "Banana 1kg", "Apple Red 1kg", "Orange 1kg", "Grapes Green 500g", "Pomegranate 1kg", "Mango 1kg",
        "Onion 1kg", "Potato 1kg", "Tomato 1kg", "Cucumber 500g", "Carrot 500g", "Capsicum Green 500g",
        "Spinach 1 Bunch", "Coriander 1 Bunch", "Cabbage 1pc", "Cauliflower 1pc", "Lady Finger 500g",
        "Brinjal 500g", "Ginger 200g", "Garlic 200g", "Lemon 500g", "Watermelon 1pc"
    ],
    "Household": [
        "Dishwash Liquid 500ml", "Dishwash Bar 3 Pack", "Floor Cleaner 1L", "Toilet Cleaner 500ml",
        "Glass Cleaner 500ml", "Multi Purpose Cleaner 1L", "Laundry Detergent Powder 2kg", "Laundry Detergent Liquid 1L",
        "Fabric Softener 1L", "Disinfectant Spray 300ml", "Air Freshener 300ml", "Room Freshener 100ml",
        "Garbage Bags Large 30 Pack", "Aluminum Foil 30m", "Cling Wrap 30m", "Tissue Paper 6 Pack",
        "Kitchen Towels 2 Roll", "Scrub Pad 6 Pack", "Mop Refill 1pc", "Broom 1pc", "Plastic Gloves 10 Pack", "Sponge Wipe 3 Pack"
    ],
    "Personal Care": [
        "Shampoo 650ml", "Conditioner 650ml", "Hair Oil 200ml", "Body Wash 500ml", "Bath Soap 4 Pack",
        "Face Wash 100ml", "Moisturizing Lotion 400ml", "Sunscreen SPF 50 50ml", "Deodorant Spray 150ml",
        "Perfume 100ml", "Toothpaste 200g", "Toothbrush 3 Pack", "Mouthwash 500ml", "Shaving Cream 200g",
        "Razor 4 Pack", "Cotton Buds 200 Pack", "Cotton Pads 100 Pack", "Hand Sanitizer 200ml",
        "Hair Gel 100g", "Hair Conditioner Sachet 10 Pack", "Lip Balm 5g", "Hand Cream 75ml"
    ],
    "Electronics": [
        "Logitech Mouse", "HP Keyboard", "Boat Earphones", "Samsung Charger", "USB Cable Type C 1m",
        "Power Bank 10000mAh", "Bluetooth Speaker Mini", "Wireless Earbuds", "Smartwatch Basic",
        "LED Bulb 9W 2 Pack", "Extension Board 4 Socket", "HDMI Cable 1.5m", "Laptop Stand",
        "Wireless Mouse", "USB Flash Drive 32GB", "MicroSD Card 64GB", "Phone Case Silicone",
        "Screen Protector 2 Pack", "Charging Adapter 20W", "Bluetooth Keyboard", "Gaming Mouse Pad", "Router Dual Band"
    ],
    "Clothing": [
        "Men's Cotton T-Shirt", "Women's Hoodie", "Denim Jeans", "Sports Jacket", "Men's Formal Shirt",
        "Women's Kurti", "Unisex Sweatshirt", "Men's Track Pants", "Women's Leggings", "Kids Graphic T-Shirt",
        "Men's Polo T-Shirt", "Women's Top", "Men's Shorts", "Women's Jeans", "Socks 5 Pack", "Men's Belt",
        "Women's Scarf", "Cap Baseball", "Winter Beanie", "Rain Jacket", "Sports Socks 3 Pack", "Cotton Pyjama"
    ],
    "Stationery": [
        "Ball Pen Blue 10 Pack", "Ball Pen Black 10 Pack", "Gel Pen 5 Pack", "Pencil HB 10 Pack",
        "Eraser 5 Pack", "Sharpener 5 Pack", "A4 Notebook 200 Pages", "Spiral Notebook 300 Pages",
        "Sticky Notes 3 Pack", "Highlighter 6 Pack", "Marker Pen 2 Pack", "Sketch Pens 12 Pack",
        "Stapler Mini", "Staples 1000 Count", "Paper Clips 100 Pack", "Correction Tape 2 Pack",
        "Glue Stick 3 Pack", "File Folder 5 Pack", "Document Envelope 5 Pack", "Desk Organizer", "Scissors 1pc", "Calculator Basic"
    ],
    "Pharmacy": [
        "Paracetamol 500mg 10 Tablets", "Ibuprofen 200mg 10 Tablets", "Cough Syrup 100ml", "Antacid Tablets 20 Pack",
        "Vitamin C Tablets 20 Pack", "Multivitamin Capsules 30 Pack", "Digital Thermometer", "Bandage Roll 5m",
        "Antiseptic Liquid 100ml", "First Aid Kit Small", "Hand Sanitizer 50ml", "Oral Rehydration Salts 5 Pack",
        "Allergy Tablets 10 Pack", "Pain Relief Spray 60ml", "Muscle Gel 30g", "Cotton Roll 100g",
        "Medical Gloves 10 Pack", "N95 Mask 5 Pack", "Eye Drops 10ml", "Nasal Spray 10ml", "Blood Pressure Monitor", "Glucometer Kit"
    ],
    "Grocery": [
        "Basmati Rice 5kg", "Wheat Flour 5kg", "Sugar 1kg", "Iodized Salt 1kg", "Sunflower Oil 1L",
        "Mustard Oil 1L", "Toor Dal 1kg", "Masoor Dal 1kg", "Chana Dal 1kg", "Moong Dal 1kg",
        "Poha 1kg", "Vermicelli 500g", "Tea Powder 500g", "Coffee Powder 200g", "Turmeric Powder 200g",
        "Red Chili Powder 200g", "Garam Masala 100g", "Cumin Seeds 200g", "Coriander Powder 200g",
        "Pasta 500g", "Noodles 280g", "Breakfast Oats 1kg"
    ],
    "Pet Supplies": [
        "Dog Food Adult 3kg", "Dog Food Puppy 1.2kg", "Cat Food Adult 1.2kg", "Cat Food Kitten 400g",
        "Dog Treats 200g", "Cat Treats 80g", "Pet Shampoo 200ml", "Cat Litter 5kg", "Dog Leash 1pc",
        "Pet Collar Small", "Pet Feeding Bowl 2 Pack", "Pet Toys Ball 2 Pack", "Pet Grooming Brush",
        "Pet Training Pads 30 Pack", "Pet Waste Bags 3 Roll", "Pet Dental Chews 200g", "Pet Water Bottle 500ml",
        "Dog Harness Medium", "Cat Scratching Pad", "Pet Bed Small", "Fish Food 100g", "Bird Seed 500g"
    ],
    "Baby Care": [
        "Baby Diapers Small 40 Pack", "Baby Diapers Medium 34 Pack", "Baby Diapers Large 30 Pack", "Baby Wipes 72 Pack",
        "Baby Shampoo 200ml", "Baby Soap 75g", "Baby Lotion 200ml", "Baby Powder 200g", "Baby Oil 200ml",
        "Baby Feeding Bottle 250ml", "Baby Bib 2 Pack", "Baby Teether", "Baby Washcloth 6 Pack", "Baby Toothbrush",
        "Baby Rash Cream 50g", "Infant Formula 400g", "Baby Cereal 300g", "Baby Blanket", "Baby Socks 3 Pack",
        "Baby Cap", "Baby Nail Clipper", "Baby Laundry Detergent 1L"
    ]
}

CATEGORY_PRICE_RANGES = {
    "Dairy": (25.0, 180.0), "Bakery": (20.0, 160.0), "Beverages": (20.0, 180.0), "Snacks": (10.0, 120.0),
    "Frozen Foods": (80.0, 400.0), "Fruits & Vegetables": (20.0, 200.0), "Household": (40.0, 450.0),
    "Personal Care": (40.0, 500.0), "Electronics": (300.0, 5000.0), "Clothing": (400.0, 3000.0),
    "Stationery": (10.0, 300.0), "Pharmacy": (30.0, 1200.0), "Grocery": (30.0, 600.0),
    "Pet Supplies": (60.0, 1500.0), "Baby Care": (60.0, 1200.0),
}

CATEGORY_UNITS = {
    "Dairy": ["L", "KG", "PACK", "PCS"], "Bakery": ["PACK", "PCS"], "Beverages": ["L", "PCS"],
    "Snacks": ["PACK", "PCS"], "Frozen Foods": ["PACK", "KG"], "Fruits & Vegetables": ["KG", "PCS"],
    "Household": ["PCS", "PACK"], "Personal Care": ["PCS", "PACK"], "Electronics": ["PCS"],
    "Clothing": ["PCS"], "Stationery": ["PCS", "PACK"], "Pharmacy": ["PCS", "PACK"],
    "Grocery": ["KG", "PACK"], "Pet Supplies": ["KG", "PACK", "PCS"], "Baby Care": ["PACK", "PCS"],
}

WAREHOUSE_PRESETS = [
    {"name": "Mumbai Central Warehouse", "code": "MUM-CEN", "city": "Mumbai", "state": "Maharashtra"},
    {"name": "Surat Distribution Center", "code": "SUR-DC", "city": "Surat", "state": "Gujarat"},
    {"name": "Delhi Storage Hub", "code": "DEL-HUB", "city": "New Delhi", "state": "Delhi"},
    {"name": "Bangalore Fulfillment Center", "code": "BLR-FUL", "city": "Bengaluru", "state": "Karnataka"},
    {"name": "Ahmedabad Retail Warehouse", "code": "AMD-RET", "city": "Ahmedabad", "state": "Gujarat"},
    {"name": "Pune Crossdock", "code": "PUN-XD", "city": "Pune", "state": "Maharashtra"},
    {"name": "Hyderabad Supply Depot", "code": "HYD-SUP", "city": "Hyderabad", "state": "Telangana"},
    {"name": "Chennai Inventory Park", "code": "CHE-INV", "city": "Chennai", "state": "Tamil Nadu"},
]

def main():
    # Load dataset to get exact UUIDs
    logger.info("Reading daily sales dataset...")
    df = pd.read_csv("daily_sales_dataset.csv")
    
    unique_products_per_cat = {}
    for cat in CATEGORY_NAMES:
        p_ids = df[df["category"] == cat]["product_id"].unique()
        p_ids.sort()
        unique_products_per_cat[cat] = p_ids.tolist()
        
    unique_warehouses = df["warehouse_id"].unique()
    unique_warehouses.sort()
    
    timestamp = datetime.now(timezone.utc)
    
    with engine.begin() as connection:
        # Clear existing data in correct order
        logger.info("Cleaning up old tables...")
        connection.execute(text("TRUNCATE TABLE sales_order_items, sales_orders CASCADE;"))
        connection.execute(text("TRUNCATE TABLE purchase_orders CASCADE;"))
        connection.execute(text("TRUNCATE TABLE inventory_transactions CASCADE;"))
        connection.execute(text("TRUNCATE TABLE inventory CASCADE;"))
        connection.execute(text("TRUNCATE TABLE products CASCADE;"))
        connection.execute(text("TRUNCATE TABLE categories CASCADE;"))
        connection.execute(text("TRUNCATE TABLE warehouses CASCADE;"))
        connection.execute(text("TRUNCATE TABLE customers CASCADE;"))
        connection.execute(text("TRUNCATE TABLE suppliers CASCADE;"))
        
        # 1. Seed Categories
        logger.info("Seeding Categories...")
        cat_name_to_uuid = {}
        for cat_name in CATEGORY_NAMES:
            cat_id = uuid4()
            cat_name_to_uuid[cat_name] = cat_id
            connection.execute(text(
                "INSERT INTO categories (id, name, description, created_at, updated_at) VALUES (:id, :name, :description, :created_at, :updated_at);"
            ), {"id": cat_id, "name": cat_name, "description": CATEGORY_DESCRIPTIONS[cat_name], "created_at": timestamp, "updated_at": timestamp})
            
        # 2. Seed Products matching exact UUIDs
        logger.info("Seeding Products...")
        product_uuid_to_price = {}
        for cat_name in CATEGORY_NAMES:
            ids = unique_products_per_cat[cat_name]
            preset_products = CATEGORY_PRODUCTS[cat_name]
            for i, p_uuid in enumerate(ids):
                p_name = preset_products[i % len(preset_products)]
                p_id = UUID(p_uuid)
                sku = f"{cat_name[:3].upper()}-{i:03d}-{p_uuid[:4].upper()}"
                
                price_min, price_max = CATEGORY_PRICE_RANGES[cat_name]
                selling_price = round(random.uniform(price_min, price_max), 2)
                unit_cost = round(selling_price / random.uniform(1.15, 1.6), 2)
                unit_of_measure = random.choice(CATEGORY_UNITS[cat_name])
                
                product_uuid_to_price[p_id] = (selling_price, unit_cost)
                
                connection.execute(text(
                    """INSERT INTO products (
                        id, sku, name, description, category_id, unit_cost, selling_price,
                        unit_of_measure, reorder_point, max_stock_level, barcode, image_url,
                        is_active, created_at, updated_at
                    ) VALUES (
                        :id, :sku, :name, :description, :category_id, :unit_cost, :selling_price,
                        :unit_of_measure, :reorder_point, :max_stock_level, :barcode, :image_url,
                        :is_active, :created_at, :updated_at
                    );"""
                ), {
                    "id": p_id, "sku": sku, "name": p_name, "description": f"Seeded {p_name}",
                    "category_id": cat_name_to_uuid[cat_name], "unit_cost": unit_cost, "selling_price": selling_price,
                    "unit_of_measure": unit_of_measure, "reorder_point": random.randint(5, 30),
                    "max_stock_level": random.randint(100, 400), "barcode": f"BC-{p_uuid[:8].upper()}",
                    "image_url": None, "is_active": True, "created_at": timestamp, "updated_at": timestamp
                })
                
        # 3. Seed Warehouses matching exact UUIDs
        logger.info("Seeding Warehouses...")
        for i, w_uuid in enumerate(unique_warehouses):
            w_id = UUID(w_uuid)
            preset = WAREHOUSE_PRESETS[i % len(WAREHOUSE_PRESETS)]
            connection.execute(text(
                """INSERT INTO warehouses (
                    id, name, code, city, state, capacity, is_active, created_at, updated_at
                ) VALUES (
                    :id, :name, :code, :city, :state, :capacity, :is_active, :created_at, :updated_at
                );"""
            ), {
                "id": w_id, "name": preset["name"], "code": preset["code"],
                "city": preset["city"], "state": preset["state"], "capacity": random.randint(30000, 90000),
                "is_active": True, "created_at": timestamp, "updated_at": timestamp
            })

        # 4. Seed Suppliers and Customers (for order links)
        logger.info("Seeding Customer and Supplier...")
        cust_id = uuid4()
        connection.execute(text(
            """INSERT INTO customers (
                id, customer_code, full_name, email, phone, address, city, state, country, loyalty_points, is_active, created_at, updated_at
            ) VALUES (
                :id, 'CUST-DEFAULT', 'John Doe', 'john.doe@example.com', '555-0100', '123 Main St', 'Mumbai', 'MH', 'India', 0, true, :created_at, :updated_at
            );"""
        ), {"id": cust_id, "created_at": timestamp, "updated_at": timestamp})
        
        supp_id = uuid4()
        connection.execute(text(
            """INSERT INTO suppliers (
                id, supplier_code, company_name, contact_person, email, phone, address, city, state, country, avg_lead_days, is_active, created_at, updated_at
            ) VALUES (
                :id, 'SUPP-DEFAULT', 'Global Supplies Inc', 'Jane Smith', 'supplier@example.com', '555-0110', '456 Supplier Rd', 'Delhi', 'DL', 'India', 5, true, :created_at, :updated_at
            );"""
        ), {"id": supp_id, "created_at": timestamp, "updated_at": timestamp})

        # 5. Seed Inventory
        logger.info("Seeding Inventory...")
        # Get seeded products
        rows = connection.execute(text("SELECT id, category_id, reorder_point, max_stock_level FROM products;")).fetchall()
        # Get seeded warehouses
        wh_rows = connection.execute(text("SELECT id, capacity FROM warehouses;")).fetchall()
        
        for p in rows:
            for w in wh_rows:
                qty_on_hand = random.randint(50, 300)
                reserved = random.randint(0, 15)
                connection.execute(text(
                    """INSERT INTO inventory (
                        product_id, warehouse_id, quantity_on_hand, reserved_quantity, reorder_point, last_updated_at
                    ) VALUES (
                        :p_id, :w_id, :qty, :res, :reorder, :updated
                    );"""
                ), {
                    "p_id": p.id, "w_id": w.id, "qty": qty_on_hand, "res": reserved,
                    "reorder": random.randint(10, 40), "updated": timestamp
                })

        # 6. Seed Historical Transactions & Orders from CSV to populate dashboard beautifully!
        logger.info("Seeding historical orders and transactions from daily_sales_dataset.csv...")
        # To avoid overloading DB, let's take a sample or limit the transactions
        # We will parse daily_sales_dataset.csv, and for each row:
        # Create a Transaction + Sales Order / Purchase Order
        df_sample = df.sample(n=min(5000, len(df)), random_state=42)
        
        so_counter = 1
        po_counter = 1
        
        for idx, row in df_sample.iterrows():
            p_id = UUID(row["product_id"])
            w_id = UUID(row["warehouse_id"])
            qty = int(row["quantity_sold"])
            date_str = str(row["date"])
            
            # Parse date
            dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
            
            price_info = product_uuid_to_price.get(p_id)
            if not price_info:
                continue
            selling_price, unit_cost = price_info
            
            tx_id = uuid4()
            
            if qty > 0:
                # Sale Transaction
                # Create Sales Order
                so_id = uuid4()
                so_num = f"SO-{so_counter:06d}"
                so_counter += 1
                
                connection.execute(text(
                    """INSERT INTO sales_orders (
                        id, order_number, customer_id, warehouse_id, status, total_amount, payment_status, created_at, updated_at
                    ) VALUES (:id, :num, :cust_id, :w_id, 'COMPLETED', :total, 'PAID', :created, :updated);"""
                ), {"id": so_id, "num": so_num, "cust_id": cust_id, "w_id": w_id, "total": selling_price * qty, "created": dt, "updated": dt})
                
                connection.execute(text(
                    """INSERT INTO sales_order_items (
                        id, sales_order_id, product_id, quantity, unit_price, total_price
                    ) VALUES (:id, :so_id, :p_id, :qty, :price, :total);"""
                ), {"id": uuid4(), "so_id": so_id, "p_id": p_id, "qty": qty, "price": selling_price, "total": selling_price * qty})
                
                # Transaction
                connection.execute(text(
                    """INSERT INTO inventory_transactions (
                        id, product_id, warehouse_id, transaction_type, quantity, reference_id, reference_type, notes, created_by, created_at
                    ) VALUES (:id, :p_id, :w_id, 'SALE', :qty, :ref, 'SALES_ORDER', 'Customer sale', 'SYSTEM', :created);"""
                ), {"id": tx_id, "p_id": p_id, "w_id": w_id, "qty": -qty, "ref": so_num, "created": dt})
                
            elif qty < 0:
                # Return/Receive Transaction (reversing sign)
                qty_abs = abs(qty)
                po_id = uuid4()
                po_num = f"PO-{po_counter:06d}"
                po_counter += 1
                
                connection.execute(text(
                    """INSERT INTO purchase_orders (
                        id, order_number, supplier_id, warehouse_id, status, total_amount, created_at, updated_at
                    ) VALUES (:id, :num, :supp_id, :w_id, 'RECEIVED', :total, :created, :updated);"""
                ), {"id": po_id, "num": po_num, "supp_id": supp_id, "w_id": w_id, "total": unit_cost * qty_abs, "created": dt, "updated": dt})
                
                connection.execute(text(
                    """INSERT INTO inventory_transactions (
                        id, product_id, warehouse_id, transaction_type, quantity, reference_id, reference_type, notes, created_by, created_at
                    ) VALUES (:id, :p_id, :w_id, 'RECEIVE', :qty, :ref, 'PURCHASE_ORDER', 'Supplier restock', 'SYSTEM', :created);"""
                ), {"id": tx_id, "p_id": p_id, "w_id": w_id, "qty": qty_abs, "ref": po_num, "created": dt})
                
    logger.info("Database seeding successfully completed!")

if __name__ == "__main__":
    main()
