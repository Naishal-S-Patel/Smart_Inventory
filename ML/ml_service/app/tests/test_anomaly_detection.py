from __future__ import annotations

import pandas as pd

from app.analytics.anomaly_detection import detect_sales_spikes


def test_detects_sales_spike() -> None:
    df = pd.DataFrame(
        {
            "date": ["2026-01-01", "2026-01-02", "2026-01-03", "2026-01-04"],
            "revenue": [100.0, 120.0, 110.0, 900.0],
        }
    )
    anomalies = detect_sales_spikes(df)
    assert any(item["anomaly_type"] == "sales_spike" for item in anomalies)
