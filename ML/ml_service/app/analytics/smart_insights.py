from __future__ import annotations

from datetime import datetime
from typing import Any

import numpy as np
import pandas as pd


def generate_insights(
    daily_revenue_df: pd.DataFrame,
    inventory_df: pd.DataFrame,
    stock_aging_df: pd.DataFrame,
    now: datetime,
) -> list[str]:
    insights: list[str] = []

    # ── Revenue trend analysis ────────────────────────────────────────────
    if not daily_revenue_df.empty and len(daily_revenue_df) >= 7:
        daily = daily_revenue_df.copy()
        daily["date"] = pd.to_datetime(daily["date"])
        daily = daily.sort_values("date")

        # Week-over-week growth
        recent_7 = daily.tail(7)["revenue"].sum()
        prev_7 = daily.iloc[-14:-7]["revenue"].sum() if len(daily) >= 14 else 0
        if prev_7 > 0:
            wow_growth = ((recent_7 - prev_7) / prev_7) * 100
            if wow_growth > 5:
                insights.append(f"📈 Revenue is up {wow_growth:.1f}% week-over-week — strong upward momentum.")
            elif wow_growth < -5:
                insights.append(f"📉 Revenue declined {abs(wow_growth):.1f}% week-over-week — consider reviewing pricing or promotions.")

        # Peak revenue day
        peak_row = daily.loc[daily["revenue"].idxmax()]
        peak_date = pd.to_datetime(peak_row["date"]).strftime("%b %d")
        peak_rev = float(peak_row["revenue"])
        avg_rev = float(daily["revenue"].mean())
        if peak_rev > avg_rev * 1.5:
            insights.append(f"🏆 Peak revenue of ₹{peak_rev:,.0f} was recorded on {peak_date}, {((peak_rev / avg_rev - 1) * 100):.0f}% above daily average.")

        # Weekend vs weekday pattern
        daily["weekday"] = daily["date"].dt.weekday
        weekend_avg = daily[daily["weekday"].isin([5, 6])]["revenue"].mean()
        weekday_avg = daily[~daily["weekday"].isin([5, 6])]["revenue"].mean()
        if weekday_avg and weekend_avg:
            if weekend_avg > weekday_avg * 1.15:
                increase = (weekend_avg / weekday_avg - 1) * 100
                insights.append(f"📅 Weekend sales are {increase:.0f}% higher than weekdays — optimize staffing and inventory for Sat-Sun.")
            elif weekday_avg > weekend_avg * 1.15:
                increase = (weekday_avg / weekend_avg - 1) * 100
                insights.append(f"📅 Weekday sales outperform weekends by {increase:.0f}% — focus B2B campaigns on weekdays.")

        # Monthly trend (if enough data)
        if len(daily) >= 30:
            daily["month"] = daily["date"].dt.to_period("M")
            monthly = daily.groupby("month")["revenue"].sum()
            if len(monthly) >= 2:
                last_month = float(monthly.iloc[-1])
                prev_month = float(monthly.iloc[-2])
                if prev_month > 0:
                    mom_growth = ((last_month - prev_month) / prev_month) * 100
                    if abs(mom_growth) > 3:
                        direction = "up" if mom_growth > 0 else "down"
                        insights.append(f"📊 Monthly revenue is {direction} {abs(mom_growth):.1f}% compared to the previous month.")

        # Revenue volatility
        if len(daily) >= 14:
            cv = daily["revenue"].std() / daily["revenue"].mean() if daily["revenue"].mean() > 0 else 0
            if cv > 0.5:
                insights.append(f"⚡ Revenue shows high volatility (CV: {cv:.2f}) — consider demand smoothing strategies.")

    # ── Inventory health insights ─────────────────────────────────────────
    if not inventory_df.empty:
        inventory = inventory_df.copy()
        inventory["available_qty"] = inventory["quantity_on_hand"] - inventory["reserved_quantity"]

        # Overall stock health
        total_items = len(inventory)
        low_stock = inventory[inventory["available_qty"] <= inventory["reorder_point"]]
        low_pct = (len(low_stock) / total_items * 100) if total_items else 0
        if low_pct > 20:
            insights.append(f"🚨 {low_pct:.0f}% of inventory lines ({len(low_stock)} items) are at or below reorder point — urgent restocking needed.")
        elif low_pct > 10:
            insights.append(f"⚠️ {low_pct:.0f}% of items are running low on stock — review reorder pipeline.")

        # Overstock detection
        if "velocity" in inventory.columns:
            inventory["daily_sales"] = inventory["velocity"].fillna(0)
            movers = inventory[inventory["daily_sales"] > 0]
            if not movers.empty:
                movers = movers.copy()
                movers["days_of_supply"] = movers["available_qty"] / movers["daily_sales"]
                overstocked = movers[movers["days_of_supply"] > 90]
                if len(overstocked) > 0:
                    overstock_value = len(overstocked)
                    insights.append(f"📦 {overstock_value} products have 90+ days of supply — consider markdown or redistribution.")

                # Fast mover highlight
                top_mover = movers.sort_values("velocity", ascending=False).iloc[0]
                if "product_name" in top_mover.index:
                    insights.append(
                        f"🚀 Fastest moving product: {top_mover['product_name']} "
                        f"with {top_mover['velocity']:.1f} units/day velocity."
                    )

            # Predicted stockouts
            inventory["daily_sales"] = inventory["velocity"].fillna(0)
            at_risk = inventory[inventory["daily_sales"] > 0].copy()
            at_risk["days_to_stockout"] = at_risk["available_qty"] / at_risk["daily_sales"]
            critical = at_risk[at_risk["days_to_stockout"] <= 5]
            if len(critical) > 0:
                for _, row in critical.head(3).iterrows():
                    name = row.get("product_name", "Unknown")
                    days = int(row["days_to_stockout"])
                    insights.append(f"🔴 {name} is projected to stock out within {days} day{'s' if days != 1 else ''}.")

        # Category distribution
        if "category_name" in inventory.columns:
            cat_stock = inventory.groupby("category_name")["available_qty"].sum()
            if not cat_stock.empty:
                top_cat = cat_stock.idxmax()
                top_pct = (cat_stock.max() / cat_stock.sum() * 100)
                if top_pct > 40:
                    insights.append(f"📊 {top_cat} accounts for {top_pct:.0f}% of total inventory — portfolio may be unbalanced.")

    # ── Stock aging insights ──────────────────────────────────────────────
    if not stock_aging_df.empty:
        aging = stock_aging_df.copy()

        # Warehouse-level aging
        aging_summary = aging.groupby("warehouse_name", as_index=False)["age_days"].mean()
        if not aging_summary.empty:
            top = aging_summary.sort_values("age_days", ascending=False).iloc[0]
            if top["age_days"] >= 60:
                insights.append(
                    f"🏚️ Warehouse '{top['warehouse_name']}' has average inventory age of {top['age_days']:.0f} days — consider clearance sales."
                )

            # Warehouse comparison
            if len(aging_summary) >= 2:
                best = aging_summary.sort_values("age_days").iloc[0]
                worst = aging_summary.sort_values("age_days", ascending=False).iloc[0]
                if worst["age_days"] > best["age_days"] * 2 and best["age_days"] > 0:
                    insights.append(
                        f"🔄 Inventory aging varies significantly: '{best['warehouse_name']}' ({best['age_days']:.0f} days) "
                        f"vs '{worst['warehouse_name']}' ({worst['age_days']:.0f} days) — consider inter-warehouse transfers."
                    )

        # Dead stock count
        stale_items = aging[aging["age_days"] >= 90]
        if len(stale_items) > 0:
            insights.append(f"💀 {len(stale_items)} product-warehouse combinations have had no sales in 90+ days.")

    # ── Fallback ──────────────────────────────────────────────────────────
    if not insights:
        insights.append("✅ Analytics are stable with no significant anomalies detected.")

    return insights


def generate_report_insights(
    sales_result: dict,
    inventory_result: dict,
    anomaly_count: int,
    dashboard: dict,
) -> dict[str, Any]:
    """Generate per-report insight summaries for the Reports page."""
    report_insights: dict[str, Any] = {}

    # Top products insight
    top_products = sales_result.get("top_products", [])
    if top_products:
        total_rev = sum(float(p.get("revenue", 0)) for p in top_products)
        top_name = top_products[0].get("product_name", "Unknown") if top_products else "N/A"
        report_insights["top-products"] = {
            "headline": f"Top performer: {top_name}",
            "metric": f"₹{total_rev:,.0f} total revenue from top {len(top_products)} products",
            "trend": "positive",
        }

    # Category sales insight
    category_sales = sales_result.get("category_sales", [])
    if category_sales:
        top_cat = category_sales[0]
        cat_total = sum(float(c.get("revenue", 0)) for c in category_sales)
        pct = (float(top_cat.get("revenue", 0)) / cat_total * 100) if cat_total else 0
        report_insights["category-sales"] = {
            "headline": f"{top_cat.get('category_name', 'Unknown')} leads at {pct:.0f}%",
            "metric": f"{len(category_sales)} active categories",
            "trend": "neutral",
        }

    # Warehouse performance insight
    warehouse_sales = sales_result.get("warehouse_sales", [])
    if warehouse_sales:
        top_wh = warehouse_sales[0]
        report_insights["warehouse-perf"] = {
            "headline": f"Top warehouse: {top_wh.get('warehouse_name', 'Unknown')}",
            "metric": f"₹{float(top_wh.get('revenue', 0)):,.0f} revenue, {int(top_wh.get('orders', 0))} orders",
            "trend": "positive",
        }

    # Fast moving insight
    fast_moving = inventory_result.get("fast_moving", [])
    if fast_moving:
        top_fast = fast_moving[0]
        report_insights["fast-moving"] = {
            "headline": f"Fastest: {top_fast.get('product_name', 'Unknown')}",
            "metric": f"{float(top_fast.get('velocity', 0)):.1f} units/day",
            "trend": "positive",
        }

    # Dead stock insight
    dead_stock = inventory_result.get("dead_stock", [])
    report_insights["dead-stock"] = {
        "headline": f"{len(dead_stock)} items with zero velocity",
        "metric": "No sales movement detected",
        "trend": "negative" if dead_stock else "positive",
    }

    # Anomalies insight
    report_insights["anomalies"] = {
        "headline": f"{anomaly_count} anomalies detected",
        "metric": "Stock drops & transaction outliers",
        "trend": "negative" if anomaly_count > 5 else "neutral",
    }

    # Overall summary
    report_insights["summary"] = {
        "total_sales": dashboard.get("total_sales", 0),
        "total_revenue": dashboard.get("total_revenue", 0),
        "low_stock_count": dashboard.get("low_stock_count", 0),
        "predicted_stockouts": dashboard.get("predicted_stockouts", 0),
        "anomaly_count": anomaly_count,
        "dead_stock_count": len(dead_stock),
    }

    return report_insights
