from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path
from typing import Iterable, TypedDict

import matplotlib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from prophet import Prophet
from prophet.serialize import model_from_json


matplotlib.use("Agg")

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parents[2]
DATASET_PATH = BASE_DIR / "daily_sales_dataset.csv"
MODEL_DIR = BASE_DIR / "models" / "prophet"
FORECAST_DIR = BASE_DIR / "reports" / "forecasts"
CHART_DIR = BASE_DIR / "reports" / "charts"


class ForecastRecord(TypedDict):
    date: str
    yhat: float
    yhat_lower: float
    yhat_upper: float


@dataclass(frozen=True)
class ProductMeta:
    category: str
    stock_level: int
    reorder_point: int
    lead_time_days: int | None


@dataclass(frozen=True)
class SeasonalRules:
    weekend_multiplier: float = 1.05
    festival_multiplier: float = 1.25
    summer_beverage_multiplier: float = 1.15
    winter_clothing_multiplier: float = 1.2
    summer_categories: frozenset[str] = frozenset(
        {
            "beverages",
            "soft drinks",
            "juice",
            "water",
            "dairy",
            "grocery",
        }
    )
    winter_categories: frozenset[str] = frozenset(
        {
            "apparel",
            "clothing",
            "winter clothing",
            "outerwear",
            "footwear",
        }
    )


def _ensure_directories() -> None:
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    FORECAST_DIR.mkdir(parents=True, exist_ok=True)
    CHART_DIR.mkdir(parents=True, exist_ok=True)


def _load_dataset(dataset_path: Path) -> pd.DataFrame:
    df = pd.read_csv(dataset_path)
    df["date"] = pd.to_datetime(df["date"], utc=True).dt.tz_convert(None).dt.normalize()
    return df


def _load_history(product_id: str, dataset_path: Path) -> pd.DataFrame:
    df = _load_dataset(dataset_path)
    product_df = df[df["product_id"].astype(str) == str(product_id)].copy()
    if product_df.empty:
        raise ValueError(f"No data found for product {product_id}")
    return product_df


def _build_daily_series(history_df: pd.DataFrame) -> pd.DataFrame:
    daily = (
        history_df.groupby("date", as_index=False)["quantity_sold"]
        .sum()
        .rename(columns={"date": "ds", "quantity_sold": "y"})
        .sort_values("ds")
    )
    return daily


def _extract_product_meta(history_df: pd.DataFrame) -> ProductMeta:
    latest = history_df.sort_values("date").iloc[-1]
    lead_time_value = None
    for column in ("supplier_lead_time_days", "lead_time_days"):
        if column in history_df.columns:
            value = latest.get(column)
            if pd.notna(value):
                lead_time_value = int(value)
                break
    return ProductMeta(
        category=str(latest.get("category", "unknown")),
        stock_level=int(latest.get("stock_level", 0)),
        reorder_point=int(latest.get("reorder_point", 0)),
        lead_time_days=lead_time_value,
    )


def _load_prophet_model(product_id: str) -> Prophet:
    model_path = MODEL_DIR / f"{product_id}.json"
    if not model_path.exists():
        raise FileNotFoundError(f"Model not found for product {product_id}")
    model_json = model_path.read_text(encoding="utf-8")
    return model_from_json(model_json)


def _build_future_dates(last_date: datetime, horizon_days: int) -> pd.DataFrame:
    future_dates = pd.date_range(
        start=last_date + timedelta(days=1),
        periods=horizon_days,
        freq="D",
    )
    return pd.DataFrame({"ds": future_dates})


def _season_from_month(month: int) -> str:
    if month in {12, 1, 2}:
        return "winter"
    if month in {3, 4, 5}:
        return "spring"
    if month in {6, 7, 8}:
        return "summer"
    return "autumn"


def _is_festival_day(date_value: datetime) -> bool:
    if date_value.month == 12 and date_value.day in {24, 25, 26, 31}:
        return True
    if date_value.month == 11 and 15 <= date_value.day <= 20:
        return True
    if date_value.month == 1 and date_value.day in {1, 14, 26}:
        return True
    return False


def _seasonal_multiplier(
    category: str,
    season: str,
    is_weekend: bool,
    is_festival: bool,
    rules: SeasonalRules,
) -> float:
    multiplier = 1.0
    if is_weekend:
        multiplier *= rules.weekend_multiplier
    if is_festival:
        multiplier *= rules.festival_multiplier

    category_key = category.strip().lower()
    if season == "summer" and category_key in rules.summer_categories:
        multiplier *= rules.summer_beverage_multiplier
    if season == "winter" and category_key in rules.winter_categories:
        multiplier *= rules.winter_clothing_multiplier
    return multiplier


def _apply_seasonal_adjustments(
    forecast_df: pd.DataFrame,
    category: str,
    rules: SeasonalRules | None = None,
) -> pd.DataFrame:
    rules = rules or SeasonalRules()
    adjusted = forecast_df.copy()

    multipliers: list[float] = []
    for ds in adjusted["ds"]:
        season = _season_from_month(ds.month)
        is_weekend = ds.weekday() >= 5
        is_festival = _is_festival_day(ds)
        multipliers.append(
            _seasonal_multiplier(category, season, is_weekend, is_festival, rules)
        )

    multiplier_series = np.array(multipliers)
    for column in ["yhat", "yhat_lower", "yhat_upper"]:
        if column in adjusted:
            adjusted[column] = adjusted[column] * multiplier_series

    return adjusted


def _sanitize_forecast(forecast_df: pd.DataFrame) -> pd.DataFrame:
    sanitized = forecast_df.copy()
    for column in ["yhat", "yhat_lower", "yhat_upper"]:
        if column in sanitized:
            sanitized[column] = sanitized[column].clip(lower=0)
    return sanitized


def _save_forecast_outputs(product_id: str, forecast_df: pd.DataFrame) -> Path:
    _ensure_directories()
    output_path = FORECAST_DIR / f"{product_id}_forecast.csv"
    export_df = forecast_df[["ds", "yhat", "yhat_lower", "yhat_upper"]].copy()
    export_df.rename(columns={"ds": "date"}, inplace=True)
    export_df["date"] = export_df["date"].dt.strftime("%Y-%m-%d")
    export_df.to_csv(output_path, index=False)
    logger.info(
        "forecast_saved",
        extra={"product_id": product_id, "path": str(output_path)},
    )
    return output_path


def _generate_forecast_charts(
    product_id: str,
    history_df: pd.DataFrame,
    forecast_df: pd.DataFrame,
) -> None:
    _ensure_directories()

    actual_path = CHART_DIR / f"{product_id}_actual_vs_predicted.png"
    plt.figure(figsize=(10, 5))
    plt.plot(history_df["ds"], history_df["y"], label="actual")
    plt.plot(forecast_df["ds"], forecast_df["yhat"], label="forecast")
    plt.title("Actual vs Predicted")
    plt.xlabel("Date")
    plt.ylabel("Demand")
    plt.legend()
    plt.tight_layout()
    plt.savefig(actual_path)
    plt.close()

    trend_path = CHART_DIR / f"{product_id}_trend.png"
    plt.figure(figsize=(10, 4))
    trend_series = forecast_df.get("trend", forecast_df["yhat"])
    plt.plot(forecast_df["ds"], trend_series, label="trend")
    plt.title("Trend")
    plt.xlabel("Date")
    plt.ylabel("Trend")
    plt.tight_layout()
    plt.savefig(trend_path)
    plt.close()

    seasonality_path = CHART_DIR / f"{product_id}_seasonality.png"
    plt.figure(figsize=(10, 4))
    seasonal_components = []
    for column in ["weekly", "yearly"]:
        if column in forecast_df:
            seasonal_components.append(forecast_df[column])
    if seasonal_components:
        seasonal = sum(seasonal_components)
    else:
        seasonal = forecast_df["yhat"] - forecast_df.get("trend", 0)
    plt.plot(forecast_df["ds"], seasonal, label="seasonality")
    plt.title("Seasonality")
    plt.xlabel("Date")
    plt.ylabel("Seasonality")
    plt.tight_layout()
    plt.savefig(seasonality_path)
    plt.close()

    logger.info(
        "forecast_charts_generated",
        extra={"product_id": product_id, "charts": [str(actual_path), str(trend_path)]},
    )


def forecast_next_30_days(
    product_id: str,
    *,
    model: Prophet | None = None,
    history_df: pd.DataFrame | None = None,
    dataset_path: Path = DATASET_PATH,
) -> list[ForecastRecord]:
    history_df = history_df if history_df is not None else _load_history(product_id, dataset_path)
    daily_series = _build_daily_series(history_df)
    product_meta = _extract_product_meta(history_df)

    if model is None:
        model = _load_prophet_model(product_id)

    future_df = _build_future_dates(daily_series["ds"].max(), 30)
    forecast = model.predict(future_df)
    forecast = _apply_seasonal_adjustments(forecast, product_meta.category)
    forecast = _sanitize_forecast(forecast)

    _save_forecast_outputs(product_id, forecast)
    _generate_forecast_charts(product_id, daily_series, forecast)

    records: list[ForecastRecord] = []
    for row in forecast.itertuples(index=False):
        records.append(
            {
                "date": row.ds.strftime("%Y-%m-%d"),
                "yhat": float(row.yhat),
                "yhat_lower": float(row.yhat_lower),
                "yhat_upper": float(row.yhat_upper),
            }
        )

    logger.info(
        "forecast_generated",
        extra={"product_id": product_id, "points": len(records)},
    )
    return records


def predict_product_demand(product_id: str) -> list[ForecastRecord]:
    return forecast_next_30_days(product_id)


def _compute_stockout_date(
    forecast: Iterable[ForecastRecord],
    current_stock: int,
) -> str | None:
    remaining = current_stock
    for record in forecast:
        remaining -= int(round(record["yhat"]))
        if remaining <= 0:
            return record["date"]
    return None


def generate_reorder_recommendation(
    product_id: str,
    *,
    lead_time_days: int | None = None,
    safety_stock: int | None = None,
    current_stock: int | None = None,
    history_df: pd.DataFrame | None = None,
    forecast_override: list[ForecastRecord] | None = None,
) -> dict[str, object]:
    history_df = history_df if history_df is not None else _load_history(product_id, DATASET_PATH)
    product_meta = _extract_product_meta(history_df)

    forecast = forecast_override or forecast_next_30_days(
        product_id, history_df=history_df
    )

    if lead_time_days is None:
        lead_time_days = product_meta.lead_time_days or 7
    lead_time_days = max(1, lead_time_days)
    demand_window = forecast[:lead_time_days]
    forecasted_demand = int(round(sum(item["yhat"] for item in demand_window)))

    safety_stock_value = product_meta.reorder_point if safety_stock is None else safety_stock
    stock_on_hand = product_meta.stock_level if current_stock is None else current_stock

    recommended_stock = forecasted_demand + max(0, safety_stock_value)
    recommended_order_qty = max(0, recommended_stock - stock_on_hand)

    predicted_stockout_date = _compute_stockout_date(forecast, stock_on_hand)

    logger.info(
        "reorder_recommendation_generated",
        extra={
            "product_id": product_id,
            "lead_time_days": lead_time_days,
            "forecasted_demand": forecasted_demand,
            "recommended_order_qty": recommended_order_qty,
        },
    )

    return {
        "productId": str(product_id),
        "forecast": forecast,
        "recommendedOrderQty": int(recommended_order_qty),
        "predictedStockoutDate": predicted_stockout_date,
    }


def _has_demand_spike(history_df: pd.DataFrame, forecast: list[ForecastRecord]) -> bool:
    daily_series = _build_daily_series(history_df)
    mean = daily_series["y"].mean()
    std = daily_series["y"].std(ddof=0)
    threshold = mean + 2 * std
    return any(record["yhat"] > threshold for record in forecast)


def generate_low_stock_alerts(limit: int = 50) -> list[dict[str, object]]:
    df = _load_dataset(DATASET_PATH)
    alerts: list[dict[str, object]] = []
    for product_id in df["product_id"].astype(str).unique():
        history_df = df[df["product_id"].astype(str) == str(product_id)].copy()
        product_meta = _extract_product_meta(history_df)
        forecast = forecast_next_30_days(product_id, history_df=history_df)
        predicted_stockout_date = _compute_stockout_date(
            forecast, product_meta.stock_level
        )
        demand_spike = _has_demand_spike(history_df, forecast)

        if product_meta.stock_level <= product_meta.reorder_point:
            alerts.append(
                {
                    "productId": str(product_id),
                    "alertType": "low_stock",
                    "currentStock": product_meta.stock_level,
                    "message": "Stock is below reorder point.",
                    "predictedStockoutDate": predicted_stockout_date,
                }
            )

        if predicted_stockout_date is not None:
            alerts.append(
                {
                    "productId": str(product_id),
                    "alertType": "predicted_stockout",
                    "currentStock": product_meta.stock_level,
                    "message": "Stockout predicted within forecast horizon.",
                    "predictedStockoutDate": predicted_stockout_date,
                }
            )

        if demand_spike:
            alerts.append(
                {
                    "productId": str(product_id),
                    "alertType": "demand_spike",
                    "currentStock": product_meta.stock_level,
                    "message": "Forecast shows unusually high demand spike.",
                    "predictedStockoutDate": predicted_stockout_date,
                }
            )

        if len(alerts) >= limit:
            break

    logger.info("low_stock_alerts_generated", extra={"count": len(alerts)})
    return alerts
