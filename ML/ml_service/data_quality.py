from __future__ import annotations

import logging
from dataclasses import dataclass

import pandas as pd


logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class DataQualityReport:
    missing_dates: int
    negative_stock: int
    duplicate_rows: int
    unrealistic_spikes: int


def check_missing_dates(df: pd.DataFrame) -> int:
    data = df.copy()
    data["date"] = pd.to_datetime(data["date"], utc=True, errors="coerce")
    data = data.dropna(subset=["date"])

    missing_total = 0
    for (_, _), group in data.groupby(["product_id", "warehouse_id"], sort=False):
        dates = pd.Series(group["date"].dt.date.unique()).sort_values()
        if dates.empty:
            continue
        full_range = pd.date_range(start=dates.min(), end=dates.max(), freq="D")
        missing_total += len(full_range) - len(dates)

    return missing_total


def check_negative_stock(df: pd.DataFrame) -> int:
    if "stock_level" not in df.columns:
        return 0
    return int((df["stock_level"] < 0).sum())


def check_duplicate_rows(df: pd.DataFrame) -> int:
    return int(df.duplicated(subset=["date", "product_id", "warehouse_id"]).sum())


def check_unrealistic_spikes(df: pd.DataFrame, threshold: float = 5.0) -> int:
    data = df.copy()
    data["date"] = pd.to_datetime(data["date"], utc=True, errors="coerce")
    data = data.dropna(subset=["date"])
    data = data.sort_values(["product_id", "warehouse_id", "date"])

    grouped = data.groupby(["product_id", "warehouse_id"], sort=False)
    shifted = grouped["quantity_sold"].shift(1)
    rolling_mean = shifted.rolling(window=7, min_periods=7).mean().reset_index(level=0, drop=True)
    spikes = data["quantity_sold"] > (rolling_mean * threshold)
    return int(spikes.sum())


def run_quality_checks(df: pd.DataFrame) -> DataQualityReport:
    missing_dates = check_missing_dates(df)
    negative_stock = check_negative_stock(df)
    duplicate_rows = check_duplicate_rows(df)
    unrealistic_spikes = check_unrealistic_spikes(df)

    report = DataQualityReport(
        missing_dates=missing_dates,
        negative_stock=negative_stock,
        duplicate_rows=duplicate_rows,
        unrealistic_spikes=unrealistic_spikes,
    )
    logger.info(
        "data_quality_report",
        extra={
            "missing_dates": report.missing_dates,
            "negative_stock": report.negative_stock,
            "duplicate_rows": report.duplicate_rows,
            "unrealistic_spikes": report.unrealistic_spikes,
        },
    )
    return report
