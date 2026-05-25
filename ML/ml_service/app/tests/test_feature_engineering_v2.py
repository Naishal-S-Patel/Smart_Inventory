import pandas as pd

from feature_engineering_v2 import build_features


def _build_df() -> pd.DataFrame:
    dates = pd.date_range("2026-01-01", periods=40, freq="D", tz="UTC")
    data = []
    for idx, day in enumerate(dates):
        data.append(
            {
                "date": day,
                "product_id": "p1",
                "warehouse_id": "w1",
                "quantity_sold": idx,
                "category": "Dairy",
                "unit_price": 50.0,
                "stock_level": 100,
                "reorder_point": 20,
            }
        )
        data.append(
            {
                "date": day,
                "product_id": "p1",
                "warehouse_id": "w2",
                "quantity_sold": idx + 10,
                "category": "Dairy",
                "unit_price": 50.0,
                "stock_level": 100,
                "reorder_point": 20,
            }
        )
    return pd.DataFrame(data)


def test_lag_correctness():
    df = _build_df()
    features = build_features(df, drop_na=False)
    row = features[(features["product_id"] == "p1") & (features["warehouse_id"] == "w1")].iloc[7]
    assert row["lag_7"] == 0


def test_rolling_mean_correctness():
    df = _build_df()
    features = build_features(df, drop_na=False)
    group = features[(features["product_id"] == "p1") & (features["warehouse_id"] == "w1")]
    row = group.iloc[7]
    assert row["rolling_mean_7"] == 3.0


def test_no_future_leakage():
    df = _build_df()
    features = build_features(df, drop_na=False)
    group = features[(features["product_id"] == "p1") & (features["warehouse_id"] == "w1")]
    row = group.iloc[10]
    assert row["rolling_mean_7"] == sum(range(3, 10)) / 7


def test_warehouse_grouping_correctness():
    df = _build_df()
    features = build_features(df, drop_na=False)
    group_w1 = features[(features["product_id"] == "p1") & (features["warehouse_id"] == "w1")]
    group_w2 = features[(features["product_id"] == "p1") & (features["warehouse_id"] == "w2")]
    assert group_w1.iloc[7]["lag_7"] == 0
    assert group_w2.iloc[7]["lag_7"] == 10
