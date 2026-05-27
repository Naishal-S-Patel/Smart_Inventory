from __future__ import annotations

import argparse
import logging
import sys
import time
from pathlib import Path

import mlflow
import numpy as np
import pandas as pd
from prophet import Prophet
from prophet.serialize import model_to_json
from sklearn.metrics import mean_absolute_error, mean_squared_error

BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.core.config import settings
from app.core.logging import configure_logging
from app.models.registry import ModelRegistry, build_registry_entry


logger = logging.getLogger(__name__)


def _prepare_history(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["date"] = pd.to_datetime(df["date"], utc=True).dt.tz_convert(None).dt.normalize()
    grouped = (
        df.groupby("date", as_index=False)["quantity_sold"]
        .sum()
        .rename(columns={"date": "ds", "quantity_sold": "y"})
        .sort_values("ds")
    )
    return grouped


def _safe_mape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    mask = y_true != 0
    if not mask.any():
        return 0.0
    return float(np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100)


def _train_product_model(
    product_id: str,
    history: pd.DataFrame,
    horizon_days: int,
    model_dir: Path,
) -> dict[str, float]:
    if len(history) < 10:
        raise ValueError(f"Not enough data to train product {product_id}")

    split_idx = max(len(history) - horizon_days, 1)
    train_df = history.iloc[:split_idx]
    test_df = history.iloc[split_idx:]

    model = Prophet(
        daily_seasonality=True,
        weekly_seasonality=True,
        yearly_seasonality=True,
        seasonality_mode="multiplicative",
    )

    start_time = time.perf_counter()
    model.fit(train_df)
    duration_seconds = time.perf_counter() - start_time

    metrics: dict[str, float] = {
        "rmse": 0.0,
        "mae": 0.0,
        "mape": 0.0,
        "training_duration_seconds": float(duration_seconds),
    }

    if not test_df.empty:
        forecast = model.predict(test_df[["ds"]])
        y_true = test_df["y"].to_numpy()
        y_pred = forecast["yhat"].to_numpy()
        metrics["rmse"] = float(np.sqrt(mean_squared_error(y_true, y_pred)))
        metrics["mae"] = float(mean_absolute_error(y_true, y_pred))
        metrics["mape"] = _safe_mape(y_true, y_pred)

    future = model.make_future_dataframe(periods=horizon_days, freq="D", include_history=False)
    forecast = model.predict(future)
    forecast_dir = Path("reports/forecasts")
    forecast_dir.mkdir(parents=True, exist_ok=True)
    forecast_output = forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]].copy()
    forecast_output.to_csv(
        forecast_dir / f"{product_id}_forecast.csv",
        index=False,
    )
    business_output = forecast_output.rename(
        columns={
            "ds": "date",
            "yhat": "predicted_demand",
            "yhat_lower": "lower_bound",
            "yhat_upper": "upper_bound",
        }
    )
    business_output.to_csv(
        forecast_dir / f"{product_id}_forecast_business.csv",
        index=False,
    )
    logger.info(f"forecast_saved product={product_id}")

    model_path = model_dir / f"{product_id}.json"
    model_path.write_text(model_to_json(model), encoding="utf-8")
    logger.info(
        "prophet_model_saved",
        extra={"product_id": product_id, "path": str(model_path)},
    )

    return metrics


def train_models(
    dataset_path: Path,
    model_dir: Path,
    horizon_days: int,
    experiment_name: str,
) -> None:
    df = pd.read_csv(dataset_path)
    required = {"date", "product_id", "quantity_sold"}
    missing = required.difference(df.columns)
    if missing:
        raise ValueError(f"Dataset missing columns: {sorted(missing)}")

    mlflow.set_tracking_uri(settings.mlflow_tracking_uri)
    mlflow.set_experiment(experiment_name)

    model_dir.mkdir(parents=True, exist_ok=True)
    registry = ModelRegistry(model_dir.parent / "registry.json")

    for product_id, product_df in df.groupby("product_id"):
        history = _prepare_history(product_df)
        logger.info(
            "prophet_training_started",
            extra={"product_id": product_id, "rows": len(history)},
        )
        with mlflow.start_run(run_name=f"prophet_{product_id}"):
            mlflow.log_param("product_id", str(product_id))
            mlflow.log_param("horizon_days", horizon_days)
            mlflow.log_param("model_type", "prophet")
            metrics = _train_product_model(
                str(product_id), history, horizon_days, model_dir
            )
            mlflow.log_metrics(
                {
                    "rmse": metrics["rmse"],
                    "mae": metrics["mae"],
                    "mape": metrics["mape"],
                    "training_duration_seconds": metrics["training_duration_seconds"],
                }
            )
            model_file = model_dir / f"{product_id}.json"
            if model_file.exists():
                mlflow.log_artifact(str(model_file), artifact_path="models/prophet")
                registry.register(
                    build_registry_entry(
                        product_id=str(product_id),
                        model_type="prophet",
                        model_path=model_file,
                        metrics=metrics,
                    )
                )

        logger.info(
            "prophet_training_completed",
            extra={"product_id": product_id, **metrics},
        )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train Prophet models per product")
    parser.add_argument(
        "--data-path",
        type=Path,
        default=Path("daily_sales_dataset.csv"),
        help="Path to daily sales dataset",
    )
    parser.add_argument(
        "--model-dir",
        type=Path,
        default=Path("models/prophet"),
        help="Output directory for Prophet models",
    )
    parser.add_argument(
        "--horizon-days",
        type=int,
        default=30,
        help="Forecast horizon in days",
    )
    parser.add_argument(
        "--experiment-name",
        type=str,
        default=settings.mlflow_experiment_name,
        help="MLflow experiment name",
    )
    return parser.parse_args()


def main() -> None:
    configure_logging(settings.log_level)
    args = parse_args()
    dataset_path = args.data_path
    if not dataset_path.exists():
        raise FileNotFoundError(f"Dataset not found: {dataset_path}")

    train_models(
        dataset_path=dataset_path,
        model_dir=args.model_dir,
        horizon_days=args.horizon_days,
        experiment_name=args.experiment_name,
    )


if __name__ == "__main__":
    main()
