from __future__ import annotations

from typing import Final

import pandas as pd


DATE_COLUMN: Final[str] = "created_at"
TARGET_COLUMN: Final[str] = "selling_price"


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    if DATE_COLUMN not in df.columns:
        raise ValueError("created_at column is required")
    if TARGET_COLUMN not in df.columns:
        raise ValueError("selling_price column is required")

    data = df.copy()
    data[DATE_COLUMN] = pd.to_datetime(data[DATE_COLUMN], utc=True, errors="coerce")
    data = data.dropna(subset=[DATE_COLUMN])

    data = data.sort_values(DATE_COLUMN).reset_index(drop=True)

    data["day_of_week"] = data[DATE_COLUMN].dt.dayofweek
    data["month"] = data[DATE_COLUMN].dt.month
    data["quarter"] = data[DATE_COLUMN].dt.quarter
    data["is_weekend"] = data["day_of_week"].isin([5, 6]).astype(int)

    target = data[TARGET_COLUMN]
    data["lag_7"] = target.shift(7)

    shifted = target.shift(1)
    data["rolling_mean_7"] = shifted.rolling(window=7, min_periods=7).mean()
    data["rolling_std_7"] = shifted.rolling(window=7, min_periods=7).std()

    data = data.dropna(subset=["lag_7", "rolling_mean_7", "rolling_std_7"]).reset_index(drop=True)

    return data
