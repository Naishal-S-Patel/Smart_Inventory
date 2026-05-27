from __future__ import annotations

from datetime import datetime

import pandas as pd

from app.services.forecast_service import (
    _apply_seasonal_adjustments,
    forecast_next_30_days,
    generate_reorder_recommendation,
)


class DummyModel:
    def __init__(self, value: float) -> None:
        self.value = value

    def predict(self, df: pd.DataFrame) -> pd.DataFrame:
        return pd.DataFrame(
            {
                "ds": df["ds"],
                "yhat": [self.value] * len(df),
                "yhat_lower": [self.value - 2] * len(df),
                "yhat_upper": [self.value + 2] * len(df),
            }
        )


def _history_frame() -> pd.DataFrame:
    return pd.DataFrame(
        {
            "date": [datetime(2026, 6, 15), datetime(2026, 6, 16)],
            "product_id": ["p1", "p1"],
            "quantity_sold": [10, 12],
            "category": ["Beverages", "Beverages"],
            "stock_level": [50, 50],
            "reorder_point": [10, 10],
            "supplier_lead_time_days": [5, 5],
            "season": ["summer", "summer"],
            "festival_flag": [0, 0],
        }
    )


def test_forecast_generation_length() -> None:
    history = _history_frame()
    forecast = forecast_next_30_days("p1", model=DummyModel(10), history_df=history)
    assert len(forecast) == 30


def test_no_negative_predictions() -> None:
    history = _history_frame()
    forecast = forecast_next_30_days("p1", model=DummyModel(-5), history_df=history)
    assert all(point["yhat"] >= 0 for point in forecast)


def test_reorder_logic() -> None:
    history = _history_frame()
    forecast_override = [
        {
            "date": "2026-06-17",
            "yhat": 10.0,
            "yhat_lower": 8.0,
            "yhat_upper": 12.0,
        }
        for _ in range(7)
    ]
    result = generate_reorder_recommendation(
        "p1",
        lead_time_days=7,
        history_df=history,
        forecast_override=forecast_override,
    )
    assert result["recommendedOrderQty"] == 30


def test_supplier_lead_time_default() -> None:
    history = _history_frame()
    forecast_override = [
        {
            "date": "2026-06-17",
            "yhat": 10.0,
            "yhat_lower": 8.0,
            "yhat_upper": 12.0,
        }
        for _ in range(5)
    ]
    result = generate_reorder_recommendation(
        "p1",
        lead_time_days=None,
        history_df=history,
        forecast_override=forecast_override,
    )
    assert result["recommendedOrderQty"] == 10


def test_seasonal_spike_handling() -> None:
    forecast_df = pd.DataFrame(
        {
            "ds": [datetime(2026, 7, 5)],
            "yhat": [10.0],
            "yhat_lower": [8.0],
            "yhat_upper": [12.0],
        }
    )
    adjusted = _apply_seasonal_adjustments(forecast_df, category="Beverages")
    assert adjusted.loc[0, "yhat"] > 10.0
