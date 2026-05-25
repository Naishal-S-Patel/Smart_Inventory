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
    "Bakery",
    "Beverages",
    "Snacks",
    "Frozen Foods",
    "Fruits & Vegetables",
    "Household",
    "Personal Care",
    "Electronics",
    "Clothing",
    "Stationery",
    "Pharmacy",
    "Grocery",
    "Pet Supplies",
    "Baby Care",
]

CATEGORY_PRODUCTS: dict[str, list[str]] = {
    "Dairy": [
        "Amul Milk 500ml",
        "Amul Milk 1L",
        "Mother Dairy Curd 1kg",
        "Mother Dairy Curd 500g",
        "Cheese Slices 200g",
        "Cheddar Cheese Block 250g",
        "Paneer 200g",
        "Butter 100g",
        "Unsalted Butter 500g",
        "Greek Yogurt 400g",
        "Lassi 200ml",
        "Flavored Yogurt Mango 100g",
        "Whipping Cream 200ml",
        "Condensed Milk 400g",
        "Milk Powder 500g",
        "Mozzarella Cheese 200g",
        "Buttermilk 1L",
        "Ghee 500ml",
        "Low Fat Milk 1L",
        "Fresh Cream 250ml",
        "Dahi Cup 85g",
        "Cheese Spread 200g",
    ],
    "Bakery": [
        "Brown Bread 400g",
        "White Bread 400g",
        "Multigrain Bread 400g",
        "Burger Buns 6 Pack",
        "Hot Dog Buns 6 Pack",
        "Croissant 4 Pack",
        "Chocolate Muffin 2 Pack",
        "Vanilla Muffin 2 Pack",
        "Pav Bread 6 Pack",
        "Plain Bagel 4 Pack",
        "Garlic Bread 200g",
        "Whole Wheat Bread 400g",
        "Banana Bread 300g",
        "Cinnamon Rolls 4 Pack",
        "Dinner Rolls 12 Pack",
        "Pita Bread 6 Pack",
        "Tortilla Wraps 6 Pack",
        "Rusk Toast 200g",
        "Cake Rusk 200g",
        "Fruit Cake Slice 200g",
        "Cream Donut 2 Pack",
        "Choco Chip Cookies 200g",
    ],
    "Beverages": [
        "Coca Cola 750ml",
        "Pepsi Can 330ml",
        "Tropicana Orange Juice 1L",
        "Red Bull Energy Drink 250ml",
        "Sprite 2L",
        "Fanta Orange 1L",
        "Mountain Dew 600ml",
        "Thums Up 750ml",
        "Minute Maid Mixed Fruit 1L",
        "Real Mango Juice 1L",
        "Bottled Water 1L",
        "Sparkling Water 500ml",
        "Iced Tea Lemon 500ml",
        "Cold Coffee 200ml",
        "Coconut Water 500ml",
        "Apple Juice 1L",
        "Ginger Ale 300ml",
        "Soda Water 750ml",
        "Sports Drink Orange 500ml",
        "Mango Lassi 200ml",
        "Packaged Milkshake Chocolate 200ml",
        "Green Tea Bottle 500ml",
    ],
    "Snacks": [
        "Lay's Chips Classic 52g",
        "Lay's Chips Magic Masala 52g",
        "Kurkure Masala Munch 90g",
        "Oreo Biscuits 120g",
        "Haldiram Bhujia 200g",
        "Nacho Chips 150g",
        "Salted Peanuts 200g",
        "Cashew Nuts 200g",
        "Roasted Almonds 200g",
        "Popcorn Butter 90g",
        "Choco Wafer Biscuits 150g",
        "Digestive Biscuits 200g",
        "Makhana Roasted 100g",
        "Mixture Namkeen 200g",
        "Salted Pretzels 150g",
        "Granola Bar 6 Pack",
        "Protein Bar Chocolate 50g",
        "Trail Mix 200g",
        "Ragi Chips 80g",
        "Poha Chivda 200g",
        "Peanut Chikki 200g",
        "Rusk Stick 200g",
    ],
    "Frozen Foods": [
        "Frozen Peas 500g",
        "Frozen Sweet Corn 500g",
        "Frozen Mixed Veg 500g",
        "Frozen French Fries 1kg",
        "Frozen Paratha 5 Pack",
        "Frozen Momos Veg 20 Pack",
        "Frozen Chicken Nuggets 500g",
        "Frozen Fish Fingers 400g",
        "Frozen Pizza Margherita 300g",
        "Ice Cream Vanilla 1L",
        "Ice Cream Chocolate 1L",
        "Frozen Berries 500g",
        "Frozen Strawberry 500g",
        "Frozen Paneer Cubes 500g",
        "Frozen Idli 10 Pack",
        "Frozen Dosa 6 Pack",
        "Frozen Aloo Tikki 10 Pack",
        "Frozen Spring Rolls 10 Pack",
        "Frozen Garlic Bread 300g",
        "Frozen Samosa 12 Pack",
        "Frozen Hash Browns 500g",
        "Frozen Kulfi 6 Pack",
    ],
    "Fruits & Vegetables": [
        "Banana 1kg",
        "Apple Red 1kg",
        "Orange 1kg",
        "Grapes Green 500g",
        "Pomegranate 1kg",
        "Mango 1kg",
        "Onion 1kg",
        "Potato 1kg",
        "Tomato 1kg",
        "Cucumber 500g",
        "Carrot 500g",
        "Capsicum Green 500g",
        "Spinach 1 Bunch",
        "Coriander 1 Bunch",
        "Cabbage 1pc",
        "Cauliflower 1pc",
        "Lady Finger 500g",
        "Brinjal 500g",
        "Ginger 200g",
        "Garlic 200g",
        "Lemon 500g",
        "Watermelon 1pc",
    ],
    "Household": [
        "Dishwash Liquid 500ml",
        "Dishwash Bar 3 Pack",
        "Floor Cleaner 1L",
        "Toilet Cleaner 500ml",
        "Glass Cleaner 500ml",
        "Multi Purpose Cleaner 1L",
        "Laundry Detergent Powder 2kg",
        "Laundry Detergent Liquid 1L",
        "Fabric Softener 1L",
        "Disinfectant Spray 300ml",
        "Air Freshener 300ml",
        "Room Freshener 100ml",
        "Garbage Bags Large 30 Pack",
        "Aluminum Foil 30m",
        "Cling Wrap 30m",
        "Tissue Paper 6 Pack",
        "Kitchen Towels 2 Roll",
        "Scrub Pad 6 Pack",
        "Mop Refill 1pc",
        "Broom 1pc",
        "Plastic Gloves 10 Pack",
        "Sponge Wipe 3 Pack",
    ],
    "Personal Care": [
        "Shampoo 650ml",
        "Conditioner 650ml",
        "Hair Oil 200ml",
        "Body Wash 500ml",
        "Bath Soap 4 Pack",
        "Face Wash 100ml",
        "Moisturizing Lotion 400ml",
        "Sunscreen SPF 50 50ml",
        "Deodorant Spray 150ml",
        "Perfume 100ml",
        "Toothpaste 200g",
        "Toothbrush 3 Pack",
        "Mouthwash 500ml",
        "Shaving Cream 200g",
        "Razor 4 Pack",
        "Cotton Buds 200 Pack",
        "Cotton Pads 100 Pack",
        "Hand Sanitizer 200ml",
        "Hair Gel 100g",
        "Hair Conditioner Sachet 10 Pack",
        "Lip Balm 5g",
        "Hand Cream 75ml",
    ],
    "Electronics": [
        "Logitech Mouse",
        "HP Keyboard",
        "Boat Earphones",
        "Samsung Charger",
        "USB Cable Type C 1m",
        "Power Bank 10000mAh",
        "Bluetooth Speaker Mini",
        "Wireless Earbuds",
        "Smartwatch Basic",
        "LED Bulb 9W 2 Pack",
        "Extension Board 4 Socket",
        "HDMI Cable 1.5m",
        "Laptop Stand",
        "Wireless Mouse",
        "USB Flash Drive 32GB",
        "MicroSD Card 64GB",
        "Phone Case Silicone",
        "Screen Protector 2 Pack",
        "Charging Adapter 20W",
        "Bluetooth Keyboard",
        "Gaming Mouse Pad",
        "Router Dual Band",
    ],
    "Clothing": [
        "Men's Cotton T-Shirt",
        "Women's Hoodie",
        "Denim Jeans",
        "Sports Jacket",
        "Men's Formal Shirt",
        "Women's Kurti",
        "Unisex Sweatshirt",
        "Men's Track Pants",
        "Women's Leggings",
        "Kids Graphic T-Shirt",
        "Men's Polo T-Shirt",
        "Women's Top",
        "Men's Shorts",
        "Women's Jeans",
        "Socks 5 Pack",
        "Men's Belt",
        "Women's Scarf",
        "Cap Baseball",
        "Winter Beanie",
        "Rain Jacket",
        "Sports Socks 3 Pack",
        "Cotton Pyjama",
    ],
    "Stationery": [
        "Ball Pen Blue 10 Pack",
        "Ball Pen Black 10 Pack",
        "Gel Pen 5 Pack",
        "Pencil HB 10 Pack",
        "Eraser 5 Pack",
        "Sharpener 5 Pack",
        "A4 Notebook 200 Pages",
        "Spiral Notebook 300 Pages",
        "Sticky Notes 3 Pack",
        "Highlighter 6 Pack",
        "Marker Pen 2 Pack",
        "Sketch Pens 12 Pack",
        "Stapler Mini",
        "Staples 1000 Count",
        "Paper Clips 100 Pack",
        "Correction Tape 2 Pack",
        "Glue Stick 3 Pack",
        "File Folder 5 Pack",
        "Document Envelope 5 Pack",
        "Desk Organizer",
        "Scissors 1pc",
        "Calculator Basic",
    ],
    "Pharmacy": [
        "Paracetamol 500mg 10 Tablets",
        "Ibuprofen 200mg 10 Tablets",
        "Cough Syrup 100ml",
        "Antacid Tablets 20 Pack",
        "Vitamin C Tablets 20 Pack",
        "Multivitamin Capsules 30 Pack",
        "Digital Thermometer",
        "Bandage Roll 5m",
        "Antiseptic Liquid 100ml",
        "First Aid Kit Small",
        "Hand Sanitizer 50ml",
        "Oral Rehydration Salts 5 Pack",
        "Allergy Tablets 10 Pack",
        "Pain Relief Spray 60ml",
        "Muscle Gel 30g",
        "Cotton Roll 100g",
        "Medical Gloves 10 Pack",
        "N95 Mask 5 Pack",
        "Eye Drops 10ml",
        "Nasal Spray 10ml",
        "Blood Pressure Monitor",
        "Glucometer Kit",
    ],
    "Grocery": [
        "Basmati Rice 5kg",
        "Wheat Flour 5kg",
        "Sugar 1kg",
        "Iodized Salt 1kg",
        "Sunflower Oil 1L",
        "Mustard Oil 1L",
        "Toor Dal 1kg",
        "Masoor Dal 1kg",
        "Chana Dal 1kg",
        "Moong Dal 1kg",
        "Poha 1kg",
        "Vermicelli 500g",
        "Tea Powder 500g",
        "Coffee Powder 200g",
        "Turmeric Powder 200g",
        "Red Chili Powder 200g",
        "Garam Masala 100g",
        "Cumin Seeds 200g",
        "Coriander Powder 200g",
        "Pasta 500g",
        "Noodles 280g",
        "Breakfast Oats 1kg",
    ],
    "Pet Supplies": [
        "Dog Food Adult 3kg",
        "Dog Food Puppy 1.2kg",
        "Cat Food Adult 1.2kg",
        "Cat Food Kitten 400g",
        "Dog Treats 200g",
        "Cat Treats 80g",
        "Pet Shampoo 200ml",
        "Cat Litter 5kg",
        "Dog Leash 1pc",
        "Pet Collar Small",
        "Pet Feeding Bowl 2 Pack",
        "Pet Toys Ball 2 Pack",
        "Pet Grooming Brush",
        "Pet Training Pads 30 Pack",
        "Pet Waste Bags 3 Roll",
        "Pet Dental Chews 200g",
        "Pet Water Bottle 500ml",
        "Dog Harness Medium",
        "Cat Scratching Pad",
        "Pet Bed Small",
        "Fish Food 100g",
        "Bird Seed 500g",
    ],
    "Baby Care": [
        "Baby Diapers Small 40 Pack",
        "Baby Diapers Medium 34 Pack",
        "Baby Diapers Large 30 Pack",
        "Baby Wipes 72 Pack",
        "Baby Shampoo 200ml",
        "Baby Soap 75g",
        "Baby Lotion 200ml",
        "Baby Powder 200g",
        "Baby Oil 200ml",
        "Baby Feeding Bottle 250ml",
        "Baby Bib 2 Pack",
        "Baby Teether",
        "Baby Washcloth 6 Pack",
        "Baby Toothbrush",
        "Baby Rash Cream 50g",
        "Infant Formula 400g",
        "Baby Cereal 300g",
        "Baby Blanket",
        "Baby Socks 3 Pack",
        "Baby Cap",
        "Baby Nail Clipper",
        "Baby Laundry Detergent 1L",
    ],
}

CATEGORY_DESCRIPTIONS: dict[str, str] = {
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

PRODUCT_DESCRIPTIONS: dict[str, str] = {
    "Amul Milk 500ml": "Fresh toned milk 500ml packet",
    "Amul Milk 1L": "Pasteurized toned milk 1L pack",
    "Mother Dairy Curd 1kg": "Creamy curd 1kg family pack",
    "Mother Dairy Curd 500g": "Smooth curd 500g pack",
    "Cheese Slices 200g": "Creamy processed cheese slices",
    "Cheddar Cheese Block 250g": "Mild cheddar cheese block",
    "Paneer 200g": "Fresh paneer 200g pack",
    "Butter 100g": "Rich salted butter 100g",
    "Unsalted Butter 500g": "Unsalted butter 500g block",
    "Greek Yogurt 400g": "Thick greek yogurt 400g",
    "Lassi 200ml": "Sweetened lassi 200ml bottle",
    "Flavored Yogurt Mango 100g": "Mango flavored yogurt cup",
    "Whipping Cream 200ml": "Dairy whipping cream 200ml",
    "Condensed Milk 400g": "Sweetened condensed milk 400g",
    "Milk Powder 500g": "Instant milk powder 500g",
    "Mozzarella Cheese 200g": "Stretchy mozzarella cheese 200g",
    "Buttermilk 1L": "Refreshing buttermilk 1L",
    "Ghee 500ml": "Pure ghee 500ml jar",
    "Low Fat Milk 1L": "Low fat milk 1L pack",
    "Fresh Cream 250ml": "Fresh cream 250ml pack",
    "Dahi Cup 85g": "Single serve dahi cup",
    "Cheese Spread 200g": "Creamy cheese spread 200g",
    "Coca Cola 750ml": "Carbonated cola drink 750ml",
    "Pepsi Can 330ml": "Carbonated cola can 330ml",
    "Tropicana Orange Juice 1L": "Orange juice 1L tetra pack",
    "Red Bull Energy Drink 250ml": "Energy drink 250ml can",
    "Lay's Chips Classic 52g": "Crunchy salted potato chips",
    "Lay's Chips Magic Masala 52g": "Spicy masala potato chips",
    "Kurkure Masala Munch 90g": "Spicy corn puff snack",
    "Oreo Biscuits 120g": "Chocolate cream sandwich biscuits",
    "Haldiram Bhujia 200g": "Crispy bhujia namkeen",
    "Logitech Mouse": "Wireless optical USB mouse",
    "HP Keyboard": "Full size USB keyboard",
    "Boat Earphones": "Bluetooth in-ear earphones",
    "Samsung Charger": "Fast charging Type-C adapter",
    "Men's Cotton T-Shirt": "Regular fit cotton t-shirt",
    "Women's Hoodie": "Winter fleece hoodie",
    "Denim Jeans": "Slim fit denim jeans",
    "Sports Jacket": "Lightweight sports jacket",
}

CATEGORY_PRICE_RANGES: dict[str, tuple[float, float]] = {
    "Dairy": (25.0, 180.0),
    "Bakery": (20.0, 160.0),
    "Beverages": (20.0, 180.0),
    "Snacks": (10.0, 120.0),
    "Frozen Foods": (80.0, 400.0),
    "Fruits & Vegetables": (20.0, 200.0),
    "Household": (40.0, 450.0),
    "Personal Care": (40.0, 500.0),
    "Electronics": (300.0, 5000.0),
    "Clothing": (400.0, 3000.0),
    "Stationery": (10.0, 300.0),
    "Pharmacy": (30.0, 1200.0),
    "Grocery": (30.0, 600.0),
    "Pet Supplies": (60.0, 1500.0),
    "Baby Care": (60.0, 1200.0),
}

CATEGORY_UNITS: dict[str, list[str]] = {
    "Dairy": ["L", "KG", "PACK", "PCS"],
    "Bakery": ["PACK", "PCS"],
    "Beverages": ["L", "PCS"],
    "Snacks": ["PACK", "PCS"],
    "Frozen Foods": ["PACK", "KG"],
    "Fruits & Vegetables": ["KG", "PCS"],
    "Household": ["PCS", "PACK"],
    "Personal Care": ["PCS", "PACK"],
    "Electronics": ["PCS"],
    "Clothing": ["PCS"],
    "Stationery": ["PCS", "PACK"],
    "Pharmacy": ["PCS", "PACK"],
    "Grocery": ["KG", "PACK"],
    "Pet Supplies": ["KG", "PACK", "PCS"],
    "Baby Care": ["PACK", "PCS"],
}

CATEGORY_DESCRIPTION_TEMPLATES: dict[str, list[str]] = {
    "Dairy": [
        "Fresh dairy {name} for everyday use",
        "Pasteurized {name} packed for freshness",
        "Creamy dairy {name} with rich taste",
    ],
    "Bakery": [
        "Freshly baked {name}",
        "Soft and ready-to-eat {name}",
        "Bakery fresh {name} pack",
    ],
    "Beverages": [
        "Refreshing {name} drink",
        "Chilled {name} for instant refreshment",
        "Ready-to-serve {name}",
    ],
    "Snacks": [
        "Crispy and tasty {name}",
        "Crunchy snack {name}",
        "Ready-to-eat {name} pack",
    ],
    "Frozen Foods": [
        "Frozen {name} for quick cooking",
        "Ready-to-cook {name} from freezer",
        "Frozen {name} sealed for freshness",
    ],
    "Fruits & Vegetables": [
        "Fresh {name} for daily cooking",
        "Handpicked {name} for freshness",
        "Farm fresh {name}",
    ],
    "Household": [
        "Everyday household {name}",
        "Reliable home care {name}",
        "Multi-use household {name}",
    ],
    "Personal Care": [
        "Daily use {name} for personal care",
        "Gentle and effective {name}",
        "Everyday hygiene {name}",
    ],
    "Electronics": [
        "Durable {name} for daily use",
        "Compact and reliable {name}",
        "Everyday tech {name}",
    ],
    "Clothing": [
        "Comfort fit {name}",
        "Everyday wear {name}",
        "Casual style {name}",
    ],
    "Stationery": [
        "Office essentials {name}",
        "Daily use stationery {name}",
        "School and office {name}",
    ],
    "Pharmacy": [
        "Trusted health care {name}",
        "Everyday medical {name}",
        "Essential pharmacy {name}",
    ],
    "Grocery": [
        "Staple grocery {name}",
        "Everyday pantry {name}",
        "Fresh and clean {name}",
    ],
    "Pet Supplies": [
        "Pet care {name} for daily use",
        "Trusted pet product {name}",
        "Essential pet supply {name}",
    ],
    "Baby Care": [
        "Gentle baby care {name}",
        "Baby safe {name} for daily use",
        "Soft and safe {name}",
    ],
}


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
    unit_of_measure: str
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
                description=CATEGORY_DESCRIPTIONS[name],
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

    name_to_id = dict(zip(CATEGORY_NAMES, category_ids))
    all_items: list[tuple[str, str]] = []
    for category_name in CATEGORY_NAMES:
        for product_name in CATEGORY_PRODUCTS[category_name]:
            all_items.append((category_name, product_name))

    if count < len(all_items):
        all_items = random.sample(all_items, count)

    for index, (category_name, name) in enumerate(all_items, start=1):
        category_id = name_to_id[category_name]
        sku = generate_sku(category_name, index)
        while sku in used_skus:
            sku = generate_sku(category_name, index + random.randint(1, 999))
        used_skus.add(sku)

        barcode = generate_barcode()
        while barcode in used_barcodes:
            barcode = generate_barcode()
        used_barcodes.add(barcode)

        price_min, price_max = CATEGORY_PRICE_RANGES[category_name]
        selling_price = round(random.uniform(price_min, price_max), 2)
        unit_cost = round(selling_price / random.uniform(1.15, 1.6), 2)
        unit_of_measure = random.choice(CATEGORY_UNITS[category_name])
        description = PRODUCT_DESCRIPTIONS.get(name)
        if not description:
            description = random.choice(CATEGORY_DESCRIPTION_TEMPLATES[category_name]).format(name=name)

        seeds.append(
            ProductSeed(
                id=uuid4(),
                sku=sku,
                name=name,
                description=description,
                category_id=category_id,
                unit_cost=unit_cost,
                selling_price=selling_price,
                unit_of_measure=unit_of_measure,
                reorder_point=random.randint(5, 30),
                max_stock_level=random.randint(100, 400),
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
            "unit_of_measure": p.unit_of_measure,
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
