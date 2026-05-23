import logging

import mlflow
from mlflow.tracking import MlflowClient

from app.core.config import settings


_logger = logging.getLogger(__name__)
_mlflow_connected = False


def init_mlflow() -> None:
    global _mlflow_connected
    try:
        mlflow.set_tracking_uri(settings.mlflow_tracking_uri)
        client = MlflowClient()
        experiment = client.get_experiment_by_name(settings.mlflow_experiment_name)
        if experiment is None:
            client.create_experiment(settings.mlflow_experiment_name)
        _mlflow_connected = True
        _logger.info(
            "mlflow_initialized",
            extra={"tracking_uri": settings.mlflow_tracking_uri},
        )
    except Exception as exc:  # pragma: no cover - defensive fallback
        _mlflow_connected = False
        _logger.exception("mlflow_init_failed", extra={"error": str(exc)})


def is_mlflow_connected() -> bool:
    return _mlflow_connected
