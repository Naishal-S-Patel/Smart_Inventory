from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any

import numpy as np
import pandas as pd

import sys
from pathlib import Path

# Allow running this module as a script (``python app/analytics/anomaly_detection.py``)
# by ensuring the package root (the folder that contains `app`) is on sys.path.
if __package__ is None:
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

try:
    from sklearn.ensemble import IsolationForest
except ImportError:  # pragma: no cover
    IsolationForest = None


@dataclass(frozen=True)
class AnomalyResult:
    anomalies: list[dict[str, Any]]


def _z_scores(values: np.ndarray) -> np.ndarray:
    if values.size == 0:
        return np.array([])
    mean = values.mean()
    std = values.std(ddof=0)
    if std == 0:
        return np.zeros_like(values)
    return (values - mean) / std


def _isolation_forest_flags(values: np.ndarray, contamination: float) -> np.ndarray:
    if IsolationForest is None:
        return np.zeros(values.shape[0], dtype=bool)
    model = IsolationForest(random_state=42, contamination=contamination)
    labels = model.fit_predict(values.reshape(-1, 1))
    return labels == -1


def detect_sales_spikes(daily_sales_df: pd.DataFrame) -> list[dict[str, Any]]:
    if daily_sales_df.empty:
        return []
    working_df = daily_sales_df.reset_index(drop=True)
    values = working_df["revenue"].astype(float).to_numpy()
    z_scores = _z_scores(values)
    flags = _isolation_forest_flags(values, contamination=0.05)

    anomalies = []
    for idx, row in working_df.iterrows():
        if abs(z_scores[idx]) >= 3 or flags[idx]:
            score_val = float(z_scores[idx])
            revenue_val = float(row.get("revenue", 0))
            anomalies.append(
                {
                    "anomaly_type": "sales_spike",
                    "entity_id": str(row.get("date")),
                    "metric": "daily_revenue",
                    "value": revenue_val,
                    "score": score_val,
                    "timestamp": str(row.get("date")),
                    "severity": "HIGH" if abs(score_val) >= 4 else "MEDIUM",
                    "reason": f"Daily sales revenue of ${revenue_val:,.2f} is exceptionally high (z-score: {score_val:.2f}).",
                    "quantity": 0.0,
                    "anomaly_score": score_val,
                }
            )
    return anomalies


def detect_inventory_drops(transactions_df: pd.DataFrame) -> list[dict[str, Any]]:
    if transactions_df.empty:
        return []
    drops = transactions_df[transactions_df["quantity"] < 0].copy().reset_index(drop=True)
    if drops.empty:
        return []
    values = drops["quantity"].abs().astype(float).to_numpy()
    z_scores = _z_scores(values)
    flags = _isolation_forest_flags(values, contamination=0.05)

    anomalies = []
    for idx, row in drops.iterrows():
        if abs(z_scores[idx]) >= 3 or flags[idx]:
            score_val = float(z_scores[idx])
            qty_val = float(abs(row.get("quantity", 0)))
            p_name = str(row.get("product_name")) if row.get("product_name") else "Unknown"
            w_name = str(row.get("warehouse_name")) if row.get("warehouse_name") else "Warehouse"
            anomalies.append(
                {
                    "anomaly_type": "inventory_drop",
                    "entity_id": str(row.get("product_id")),
                    "product_id": str(row.get("product_id")),
                    "product_name": str(row.get("product_name")) if row.get("product_name") else None,
                    "warehouse_id": str(row.get("warehouse_id")),
                    "warehouse_name": str(row.get("warehouse_name")) if row.get("warehouse_name") else None,
                    "metric": "transaction_quantity",
                    "value": qty_val,
                    "score": score_val,
                    "timestamp": row.get("created_at").isoformat(),
                    "severity": "CRITICAL" if abs(score_val) >= 4 else "HIGH",
                    "reason": f"Sudden stock drop of {int(qty_val)} units in {w_name} for product '{p_name}' (z-score: {score_val:.2f}).",
                    "quantity": qty_val,
                    "anomaly_score": score_val,
                }
            )
    return anomalies


def detect_abnormal_transactions(transactions_df: pd.DataFrame) -> list[dict[str, Any]]:
    if transactions_df.empty:
        return []
    working_df = transactions_df.reset_index(drop=True)
    values = working_df["quantity"].abs().astype(float).to_numpy()
    z_scores = _z_scores(values)
    flags = _isolation_forest_flags(values, contamination=0.03)

    anomalies = []
    for idx, row in working_df.iterrows():
        if abs(z_scores[idx]) >= 3.5 or flags[idx]:
            score_val = float(z_scores[idx])
            qty_val = float(abs(row.get("quantity", 0)))
            p_name = str(row.get("product_name")) if row.get("product_name") else "Unknown"
            w_name = str(row.get("warehouse_name")) if row.get("warehouse_name") else "Warehouse"
            tx_type = str(row.get("transaction_type", "unknown"))
            anomalies.append(
                {
                    "anomaly_type": "transaction_outlier",
                    "entity_id": str(row.get("id")),
                    "product_id": str(row.get("product_id")),
                    "product_name": str(row.get("product_name")) if row.get("product_name") else None,
                    "warehouse_id": str(row.get("warehouse_id")),
                    "warehouse_name": str(row.get("warehouse_name")) if row.get("warehouse_name") else None,
                    "metric": "transaction_quantity",
                    "value": qty_val,
                    "score": score_val,
                    "timestamp": row.get("created_at").isoformat(),
                    "severity": "CRITICAL" if abs(score_val) >= 4.5 else "HIGH",
                    "reason": f"Unusual transaction of {int(qty_val)} units of '{p_name}' in {w_name} (type: {tx_type}, z-score: {score_val:.2f}).",
                    "quantity": qty_val,
                    "anomaly_score": score_val,
                }
            )
    return anomalies


def build_anomaly_report(
    daily_sales_df: pd.DataFrame,
    transactions_df: pd.DataFrame,
    generated_at: datetime,
) -> AnomalyResult:
    anomalies = []
    anomalies.extend(detect_sales_spikes(daily_sales_df))
    anomalies.extend(detect_inventory_drops(transactions_df))
    anomalies.extend(detect_abnormal_transactions(transactions_df))

    for record in anomalies:
        record["generated_at"] = generated_at.isoformat()

    return AnomalyResult(anomalies=anomalies)


if __name__ == "__main__":
    import json

    # Lightweight self-check when executed as a script
    empty_daily_sales = pd.DataFrame(columns=["date", "revenue"])
    empty_transactions = pd.DataFrame(columns=["id", "product_id", "warehouse_id", "quantity", "created_at"])

    result = build_anomaly_report(
        daily_sales_df=empty_daily_sales,
        transactions_df=empty_transactions,
        generated_at=datetime.utcnow(),
    )

    print(json.dumps(result.__dict__, indent=2, default=str))
