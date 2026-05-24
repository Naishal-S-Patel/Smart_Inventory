import pandas as pd

from feature_engineering import build_features


def _build_df() -> pd.DataFrame:
    timestamps = pd.date_range("2026-01-01", periods=10, freq="D", tz="UTC")
    return pd.DataFrame(
        {
            "created_at": timestamps,
            "selling_price": list(range(10)),
        }
    )


def test_day_of_week_correctness():
    df = _build_df()
    features = build_features(df)
    assert features.loc[0, "day_of_week"] == 2


def test_lag_7_correctness():
    df = _build_df()
    features = build_features(df)
    assert features.loc[0, "lag_7"] == 0


def test_rolling_mean_7_correctness():
    df = _build_df()
    features = build_features(df)
    assert features.loc[0, "rolling_mean_7"] == 3.0
