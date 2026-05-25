from __future__ import annotations

import logging
from pathlib import Path
from typing import Final

import holidays
import pandas as pd

from app.core.logging import configure_logging
from app.core.config import settings

logger = logging.getLogger(__name__)

DATE_COLUMN: Final[str] = "date"


def _season_from_month(month: int) -> str:
    if month in {12, 1, 2}:
        return "winter"
    if month in {3}:
        return "spring"
    if month in {4, 5, 6}:
        return "summer"
    if month in {7, 8, 9}:
        return "monsoon"
    return "autumn"


def _festival_flag(date_series: pd.Series) -> pd.Series:
    dates = pd.to_datetime(date_series, utc=True, errors="coerce").dt.date
    years = sorted({value.year for value in dates.dropna().unique()})
    india_holidays = holidays.country_holidays("IN", years=years)
    keywords = ("diwali", "holi", "eid", "christmas", "new year")

    flags = []
    for value in dates:
        if value is None:
            flags.append(False)
            continue
        name = str(india_holidays.get(value, "")).lower()
        is_keyword = any(key in name for key in keywords)
        is_new_year = value.month == 1 and value.day == 1
        is_christmas = value.month == 12 and value.day == 25
        flags.append(is_keyword or is_new_year or is_christmas)
    return pd.Series(flags, index=date_series.index)


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    required_columns = {
        "date",
        "product_id",
        "warehouse_id",
        "quantity_sold",
        "category",
        "unit_price",
        "stock_level",
        "reorder_point",
    }
    missing = required_columns - set(df.columns)
    if missing:
        raise ValueError(f"Missing columns: {sorted(missing)}")

    data = df.copy()
    data[DATE_COLUMN] = pd.to_datetime(data[DATE_COLUMN], utc=True, errors="coerce")
    data = data.dropna(subset=[DATE_COLUMN])

    data = data.sort_values(["product_id", "warehouse_id", DATE_COLUMN]).reset_index(drop=True)

    group_keys = ["product_id", "warehouse_id"]
    grouped = data.groupby(group_keys, sort=False)

    data["lag_7"] = grouped["quantity_sold"].shift(7)
    data["lag_14"] = grouped["quantity_sold"].shift(14)
    data["lag_30"] = grouped["quantity_sold"].shift(30)

    shifted = grouped["quantity_sold"].shift(1)
    data["rolling_mean_7"] = shifted.rolling(window=7, min_periods=1).mean().reset_index(level=0, drop=True)
    data["rolling_mean_30"] = shifted.rolling(window=30, min_periods=1).mean().reset_index(level=0, drop=True)
    data["rolling_std_7"] = (
        shifted.rolling(window=7, min_periods=2).std().reset_index(level=0, drop=True)
    )

    data["is_weekend"] = data[DATE_COLUMN].dt.dayofweek.isin([5, 6]).astype(int)
    data["month"] = data[DATE_COLUMN].dt.month
    data["quarter"] = data[DATE_COLUMN].dt.quarter
    data["season"] = data[DATE_COLUMN].dt.month.apply(_season_from_month)
    data["festival_flag"] = _festival_flag(data[DATE_COLUMN]).astype(int)

    data["rolling_std_7"] = data["rolling_std_7"].fillna(0.0)

    logger.info("features_built", extra={"rows": len(data)})
    return data


def main() -> None:
    configure_logging(settings.log_level)
    logger.info("feature_engineering_started")

    input_path = Path("daily_sales_dataset.csv")
    if not input_path.exists():
        raise FileNotFoundError("daily_sales_dataset.csv not found")

    df = pd.read_csv(input_path)
    original_rows = len(df)
    logger.info(f"Input rows: {original_rows}")

    features_df = build_features(df)

    required_features = {
        "lag_7",
        "lag_14",
        "lag_30",
        "rolling_mean_7",
        "rolling_std_7",
        "is_weekend",
        "month",
        "quarter",
        "season",
    }
    missing_features = required_features - set(features_df.columns)
    if missing_features:
        raise ValueError(f"Missing feature columns: {sorted(missing_features)}")

    output_path = Path("daily_sales_dataset.csv")
    features_df.to_csv(output_path, index=False)

    final_rows = len(features_df)
    rows_removed = original_rows - final_rows
    retained_pct = (final_rows / original_rows * 100.0) if original_rows else 0.0

    logger.info(f"Output rows: {final_rows}")
    print(f"Input rows: {original_rows}")
    print(f"Output rows: {final_rows}")
    print(f"Rows removed: {rows_removed}")
    print(f"% retained: {retained_pct:.2f}%")
    print(f"Generated feature columns: {sorted(required_features)}")
    print(features_df[[
        "product_id",
        "warehouse_id",
        "date",
        "quantity_sold",
        "lag_7",
        "lag_14",
        "lag_30",
        "rolling_mean_7",
        "rolling_mean_30",
        "rolling_std_7",
        "festival_flag",
    ]].head())


if __name__ == "__main__":
    main()
