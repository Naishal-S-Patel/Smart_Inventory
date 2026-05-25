from __future__ import annotations

import logging
from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd

from app.core.logging import configure_logging
from app.core.config import settings


logger = logging.getLogger(__name__)


def _prepare_output_dir(output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)


def generate_charts(df: pd.DataFrame, output_dir: Path) -> None:
    _prepare_output_dir(output_dir)

    data = df.copy()
    data["date"] = pd.to_datetime(data["date"], utc=True, errors="coerce")
    data = data.dropna(subset=["date"])

    trend = data.groupby("date", as_index=False)["quantity_sold"].sum()
    plt.figure(figsize=(12, 5))
    plt.plot(trend["date"], trend["quantity_sold"], linewidth=2)
    plt.title("Daily Sales Trend")
    plt.xlabel("Date")
    plt.ylabel("Quantity Sold")
    plt.tight_layout()
    trend_path = output_dir / "sales_trend.png"
    plt.savefig(trend_path)
    plt.close()

    category = data.groupby("category", as_index=False)["quantity_sold"].sum()
    category = category.sort_values("quantity_sold", ascending=False)
    plt.figure(figsize=(10, 5))
    plt.bar(category["category"], category["quantity_sold"])
    plt.title("Category Demand")
    plt.xlabel("Category")
    plt.ylabel("Quantity Sold")
    plt.xticks(rotation=45, ha="right")
    plt.tight_layout()
    category_path = output_dir / "category_demand.png"
    plt.savefig(category_path)
    plt.close()

    data["month"] = data["date"].dt.to_period("M").dt.to_timestamp()
    seasonal = data.groupby("month", as_index=False)["quantity_sold"].sum()
    plt.figure(figsize=(12, 5))
    plt.plot(seasonal["month"], seasonal["quantity_sold"], marker="o")
    plt.title("Seasonal Spikes (Monthly)")
    plt.xlabel("Month")
    plt.ylabel("Quantity Sold")
    plt.tight_layout()
    seasonal_path = output_dir / "seasonal_spikes.png"
    plt.savefig(seasonal_path)
    plt.close()

    logger.info(
        "charts_generated",
        extra={
            "trend_chart": str(trend_path),
            "category_chart": str(category_path),
            "seasonal_chart": str(seasonal_path),
        },
    )


def main() -> None:
    configure_logging(settings.log_level)
    input_path = Path("daily_sales_dataset.csv")
    if not input_path.exists():
        raise FileNotFoundError("daily_sales_dataset.csv not found")

    df = pd.read_csv(input_path)
    generate_charts(df, Path("reports/charts"))


if __name__ == "__main__":
    main()
