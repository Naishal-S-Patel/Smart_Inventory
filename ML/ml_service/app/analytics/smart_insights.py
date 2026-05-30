from __future__ import annotations

from datetime import datetime

import pandas as pd


def generate_insights(
    daily_revenue_df: pd.DataFrame,
    inventory_df: pd.DataFrame,
    stock_aging_df: pd.DataFrame,
    now: datetime,
) -> list[str]:
    insights: list[str] = []

    if not daily_revenue_df.empty:
        daily = daily_revenue_df.copy()
        daily["date"] = pd.to_datetime(daily["date"])
        daily["weekday"] = daily["date"].dt.weekday
        weekend_avg = daily[daily["weekday"].isin([5, 6])]["revenue"].mean()
        weekday_avg = daily[~daily["weekday"].isin([5, 6])]["revenue"].mean()
        if weekday_avg and weekend_avg and weekend_avg > weekday_avg * 1.2:
            increase = (weekend_avg / weekday_avg - 1) * 100
            insights.append(f"Beverage sales increase {increase:.0f}% on weekends.")

    if not inventory_df.empty:
        inventory = inventory_df.copy()
        inventory["available_qty"] = inventory["quantity_on_hand"] - inventory["reserved_quantity"]
        inventory["daily_sales"] = inventory["velocity"].fillna(0)
        inventory["days_to_stockout"] = inventory.apply(
            lambda row: row["available_qty"] / row["daily_sales"] if row["daily_sales"] else None,
            axis=1,
        )
        stockouts = inventory[inventory["days_to_stockout"].notna() & (inventory["days_to_stockout"] <= 5)]
        for _, row in stockouts.head(3).iterrows():
            insights.append(
                f"Product {row['product_name']} likely to stock out within {int(row['days_to_stockout'])} days."
            )

    if not stock_aging_df.empty:
        aging = stock_aging_df.copy()
        aging_summary = aging.groupby("warehouse_name", as_index=False)["age_days"].mean()
        if not aging_summary.empty:
            top = aging_summary.sort_values("age_days", ascending=False).iloc[0]
            if top["age_days"] >= 60:
                insights.append(
                    f"Warehouse {top['warehouse_name']} has unusually high inventory aging."
                )

    if not insights:
        insights.append("Analytics are stable with no significant anomalies detected.")

    return insights
