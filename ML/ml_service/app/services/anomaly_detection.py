from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta, timezone

import mlflow
import mlflow.sklearn
import numpy as np
import pandas as pd
from scipy import stats
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import LabelEncoder
from sqlalchemy import Engine, text

from app.schemas.anomaly import AnomalyResult

logger = logging.getLogger("app.services.anomaly_detection")

# ── constants ────────────────────────────────────────────────────────────────
CONTAMINATION = 0.02
N_ESTIMATORS = 100
RANDOM_STATE = 42
MODEL_VERSION = "1.0.0"

TRANSACTION_TYPE_MAP = {
    "RECEIVE": 0,
    "SALE": 1,
    "TRANSFER_OUT": 2,
    "TRANSFER_IN": 3,
    "RETURN": 4,
    "ADJUSTMENT": 5,
}


# ── data loading ─────────────────────────────────────────────────────────────

def _load_transactions(engine: Engine, lookback_days: int) -> pd.DataFrame:
    """Reads inventory_transactions from the shared PostgreSQL database."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=lookback_days)
    query = text("""
        SELECT
            id,
            product_id,
            warehouse_id,
            transaction_type,
            quantity,
            created_at
        FROM inventory_transactions
        WHERE created_at >= :cutoff
        ORDER BY created_at ASC
    """)
    with engine.connect() as conn:
        result = conn.execute(query, {"cutoff": cutoff})
        rows = result.fetchall()

    if not rows:
        return pd.DataFrame(columns=[
            "id", "product_id", "warehouse_id",
            "transaction_type", "quantity", "created_at",
        ])

    df = pd.DataFrame(rows, columns=result.keys())
    df["created_at"] = pd.to_datetime(df["created_at"], utc=True)
    return df


# ── feature engineering ───────────────────────────────────────────────────────

def _build_features(df: pd.DataFrame) -> pd.DataFrame:
    """Creates ML features from raw transaction data."""
    if df.empty:
        return df

    # Encode transaction type
    le = LabelEncoder()
    df = df.copy()
    df["transaction_type_enc"] = le.fit_transform(
        df["transaction_type"].map(
            lambda t: t if t in TRANSACTION_TYPE_MAP else "ADJUSTMENT"
        )
    )

    # Temporal features
    df["hour"] = df["created_at"].dt.hour
    df["day_of_week"] = df["created_at"].dt.dayofweek
    df["month"] = df["created_at"].dt.month

    # Per-product z-score of quantity (anomaly signal: unexpectedly large/small quantities)
    product_stats = df.groupby("product_id")["quantity"].transform(
        lambda x: stats.zscore(x, ddof=1) if len(x) > 1 else pd.Series([0.0] * len(x), index=x.index)
    )
    df["z_score"] = product_stats.fillna(0.0)

    return df


# ── explanation generator ─────────────────────────────────────────────────────

def _explain(row: pd.Series) -> str:
    qty = row["quantity"]
    z = row["z_score"]
    tx_type = str(row["transaction_type"])

    if z > 3:
        return f"Quantity {qty}x higher than normal for this product (z-score: {z:.2f})"
    if tx_type == "RECEIVE" and qty > 0 and abs(z) > 2:
        return f"Large inventory spike detected: +{qty} units received (z-score: {z:.2f})"
    if qty < 0 and z < -3:
        return f"Sudden stock drop: {qty} units (z-score: {z:.2f})"
    if z < -2:
        return f"Unusually low quantity for this product: {qty} units (z-score: {z:.2f})"
    return f"Abnormal warehouse activity pattern detected (score: {row.get('anomaly_score', 0):.4f})"


# ── main detection function ────────────────────────────────────────────────────

def detect_anomalies(engine: Engine, lookback_days: int = 7) -> tuple[list[AnomalyResult], int, str]:
    """
    Run IsolationForest anomaly detection on recent inventory transactions.

    Returns:
        (anomalies, total_transactions_analyzed, mlflow_run_id)
    """
    df = _load_transactions(engine, lookback_days)
    total = len(df)

    if total == 0:
        logger.warning("No transactions found for the last %d days", lookback_days)
        return [], 0, "no-data"

    df = _build_features(df)

    feature_cols = ["quantity", "transaction_type_enc", "hour", "day_of_week", "month", "z_score"]
    X = df[feature_cols].values.astype(float)

    # ── MLflow tracking ───────────────────────────────────────────────────────
    mlflow.set_experiment("isolation-forest-anomaly")

    with mlflow.start_run(run_name=f"detect-{lookback_days}d") as run:
        run_id = run.info.run_id

        # Log parameters
        mlflow.log_params({
            "contamination": CONTAMINATION,
            "n_estimators": N_ESTIMATORS,
            "random_state": RANDOM_STATE,
            "lookback_days": lookback_days,
            "model_version": MODEL_VERSION,
        })

        # Train model
        model = IsolationForest(
            contamination=CONTAMINATION,
            n_estimators=N_ESTIMATORS,
            random_state=RANDOM_STATE,
        )
        model.fit(X)

        # Predict: -1 = anomaly, 1 = normal
        predictions = model.predict(X)
        scores = model.decision_function(X)  # More negative = more anomalous

        df = df.copy()
        df["is_anomaly"] = predictions == -1
        df["anomaly_score"] = scores

        anomaly_count = int(df["is_anomaly"].sum())
        anomaly_rate = anomaly_count / total if total > 0 else 0.0

        # Log metrics
        mlflow.log_metrics({
            "anomaly_count": anomaly_count,
            "total_transactions": total,
            "anomaly_rate": anomaly_rate,
        })

        # Log model and register in Model Registry
        mlflow.sklearn.log_model(
            model,
            artifact_path="isolation_forest",
            registered_model_name="IsolationForest",
        )

        logger.info(
            "Anomaly detection complete: %d/%d transactions flagged (rate=%.3f), run_id=%s",
            anomaly_count, total, anomaly_rate, run_id,
        )

    # ── Build result list ─────────────────────────────────────────────────────
    anomaly_rows = df[df["is_anomaly"]]
    results: list[AnomalyResult] = []

    for _, row in anomaly_rows.iterrows():
        results.append(
            AnomalyResult(
                product_id=row["product_id"],
                transaction_id=row["id"],
                score=float(row["anomaly_score"]),
                reason=_explain(row),
                timestamp=row["created_at"].to_pydatetime(),
            )
        )

    return results, total, run_id
