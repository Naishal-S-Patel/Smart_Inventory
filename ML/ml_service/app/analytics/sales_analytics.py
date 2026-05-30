from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any

import sys
from pathlib import Path

import pandas as pd

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from app.analytics.charting import save_bar_chart, save_line_chart
from app.analytics.data_access import date_range, read_sales_data, utc_now
from app.analytics.paths import CHARTS_DIR, EXPORTS_DIR, ensure_report_dirs
from app.core.config import settings
from app.db.session import engine


@dataclass(frozen=True)
class SalesAnalyticsResult:
    top_products: list[dict[str, Any]]
    low_products: list[dict[str, Any]]
    category_sales: list[dict[str, Any]]
    warehouse_sales: list[dict[str, Any]]
    daily_revenue: list[dict[str, Any]]
    monthly_growth: list[dict[str, Any]]
    charts: dict[str, str]
    exports: dict[str, str]


def compute_top_products(sales_df: pd.DataFrame, limit: int = 10) -> pd.DataFrame:
    if sales_df.empty:
        return pd.DataFrame(columns=["product_id", "product_name", "quantity", "revenue"])
    grouped = (
        sales_df.groupby(["product_id", "product_name"], as_index=False)
        .agg(quantity=("quantity", "sum"), revenue=("total_price", "sum"))
        .sort_values("quantity", ascending=False)
        .head(limit)
    )
    return grouped


def compute_low_performing_products(sales_df: pd.DataFrame, limit: int = 10) -> pd.DataFrame:
    if sales_df.empty:
        return pd.DataFrame(columns=["product_id", "product_name", "quantity", "revenue"])
    grouped = (
        sales_df.groupby(["product_id", "product_name"], as_index=False)
        .agg(quantity=("quantity", "sum"), revenue=("total_price", "sum"))
        .sort_values("quantity", ascending=True)
        .head(limit)
    )
    return grouped


def compute_category_sales(sales_df: pd.DataFrame) -> pd.DataFrame:
    if sales_df.empty:
        return pd.DataFrame(columns=["category_name", "revenue", "quantity"])
    grouped = (
        sales_df.groupby(["category_name"], as_index=False)
        .agg(revenue=("total_price", "sum"), quantity=("quantity", "sum"))
        .sort_values("revenue", ascending=False)
    )
    return grouped


def compute_warehouse_sales(sales_df: pd.DataFrame) -> pd.DataFrame:
    if sales_df.empty:
        return pd.DataFrame(columns=["warehouse_id", "warehouse_name", "revenue", "orders"])
    grouped = (
        sales_df.groupby(["warehouse_id", "warehouse_name"], as_index=False)
        .agg(revenue=("total_price", "sum"), orders=("order_id", "nunique"))
        .sort_values("revenue", ascending=False)
    )
    return grouped


def compute_daily_revenue(sales_df: pd.DataFrame) -> pd.DataFrame:
    if sales_df.empty:
        return pd.DataFrame(columns=["date", "revenue"])
    daily = sales_df.copy()
    daily["date"] = pd.to_datetime(daily["created_at"], utc=True).dt.date
    grouped = (
        daily.groupby("date", as_index=False)
        .agg(revenue=("total_price", "sum"))
        .sort_values("date")
    )
    return grouped


def compute_monthly_growth(sales_df: pd.DataFrame) -> pd.DataFrame:
    if sales_df.empty:
        return pd.DataFrame(columns=["month", "revenue", "growth_rate"])
    monthly = sales_df.copy()
    monthly["month"] = pd.to_datetime(monthly["created_at"], utc=True).dt.to_period("M").astype(str)
    grouped = (
        monthly.groupby("month", as_index=False)
        .agg(revenue=("total_price", "sum"))
        .sort_values("month")
    )
    grouped["growth_rate"] = grouped["revenue"].pct_change().fillna(0) * 100
    return grouped


def build_sales_analytics(sales_df: pd.DataFrame, generated_at: datetime) -> SalesAnalyticsResult:
    ensure_report_dirs()

    top_df = compute_top_products(sales_df)
    low_df = compute_low_performing_products(sales_df)
    category_df = compute_category_sales(sales_df)
    warehouse_df = compute_warehouse_sales(sales_df)
    daily_df = compute_daily_revenue(sales_df)
    monthly_df = compute_monthly_growth(sales_df)

    charts: dict[str, str] = {}
    exports: dict[str, str] = {}

    if not top_df.empty:
        chart_path = CHARTS_DIR / "top_products.png"
        save_bar_chart(top_df["product_name"], top_df["revenue"], "Top Products by Revenue", chart_path)
        charts["top_products"] = str(chart_path)
        export_path = EXPORTS_DIR / "top_products.csv"
        top_df.to_csv(export_path, index=False)
        exports["top_products"] = str(export_path)

    if not warehouse_df.empty:
        chart_path = CHARTS_DIR / "warehouse_sales.png"
        save_bar_chart(warehouse_df["warehouse_name"], warehouse_df["revenue"], "Warehouse Revenue", chart_path)
        charts["warehouse_sales"] = str(chart_path)

    if not daily_df.empty:
        chart_path = CHARTS_DIR / "daily_revenue.png"
        save_line_chart(daily_df["date"].astype(str), daily_df["revenue"], "Daily Revenue", chart_path)
        charts["daily_revenue"] = str(chart_path)

    if not monthly_df.empty:
        export_path = EXPORTS_DIR / "monthly_growth.csv"
        monthly_df.to_csv(export_path, index=False)
        exports["monthly_growth"] = str(export_path)

    def _records(df: pd.DataFrame) -> list[dict[str, Any]]:
        if df.empty:
            return []
        return df.to_dict(orient="records")

    return SalesAnalyticsResult(
        top_products=_records(top_df),
        low_products=_records(low_df),
        category_sales=_records(category_df),
        warehouse_sales=_records(warehouse_df),
        daily_revenue=_records(daily_df),
        monthly_growth=_records(monthly_df),
        charts=charts,
        exports=exports,
    )


def run_sales_analytics_report() -> SalesAnalyticsResult:
    print("Starting sales analytics generation...")
    reports_dir = Path(__file__).resolve().parents[2] / settings.analytics_report_dir
    reports_dir.mkdir(parents=True, exist_ok=True)
    (reports_dir / "charts").mkdir(parents=True, exist_ok=True)
    (reports_dir / "exports").mkdir(parents=True, exist_ok=True)

    print("Loading dataset...")
    start, end = date_range(settings.analytics_lookback_days)
    sales_df = read_sales_data(engine, start, end)
    print(f"Loaded {len(sales_df)} sales rows")

    print("Running aggregation...")
    generated_at = utc_now()
    result = build_sales_analytics(sales_df, generated_at)
    print("Aggregation completed")

    print("Generating report artifacts...")
    print(f"Reports directory: {reports_dir}")
    print(f"CSV exports: {result.exports}")
    print(f"PNG charts: {result.charts}")

    print("Report generation complete")
    return result


def main() -> None:
    try:
        result = run_sales_analytics_report()
        print(f"Generated top products: {len(result.top_products)}")
        print(f"Generated category rows: {len(result.category_sales)}")
        print(f"Generated warehouse rows: {len(result.warehouse_sales)}")
        print(f"Generated daily revenue points: {len(result.daily_revenue)}")
        print(f"Generated monthly growth rows: {len(result.monthly_growth)}")
        print("Sales analytics completed successfully")
    except Exception as e:
        print(e)


if __name__ == "__main__":
    main()
