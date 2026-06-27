from __future__ import annotations

from fastapi import APIRouter, Depends

from app.db.session import engine
from app.dependencies import get_current_user
from app.schemas.anomaly import (
    AnomalyDetectionRequest,
    AnomalyDetectionResponse,
)
from app.schemas.auth import AuthenticatedUser
from app.schemas.common import ErrorResponse
from app.services.anomaly_detection import MODEL_VERSION, detect_anomalies

router = APIRouter(prefix="/detect", tags=["anomaly"])


@router.post(
    "/anomalies",
    response_model=AnomalyDetectionResponse,
    responses={
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        422: {"description": "Validation error"},
    },
    summary="Detect anomalous inventory transactions",
    description=(
        "Runs an IsolationForest model over the last `lookback_days` of inventory transactions. "
        "Returns flagged anomalies with human-readable explanations and logs the run to MLflow."
    ),
)
async def detect_anomalies_endpoint(
    request: AnomalyDetectionRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> AnomalyDetectionResponse:
    _ = current_user  # auth enforced by dependency

    anomalies, total, run_id = detect_anomalies(engine, request.lookback_days)

    return AnomalyDetectionResponse(
        success=True,
        anomalies=anomalies,
        total_transactions_analyzed=total,
        anomaly_count=len(anomalies),
        model_version=MODEL_VERSION,
        run_id=run_id,
    )
