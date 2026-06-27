from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class AnomalyResult(BaseModel):
    product_id: UUID
    transaction_id: UUID
    score: float  # IsolationForest decision_function score (more negative = more anomalous)
    reason: str  # Human-readable explanation
    timestamp: datetime


class AnomalyDetectionRequest(BaseModel):
    lookback_days: int = Field(default=7, ge=1, le=365)


class AnomalyDetectionResponse(BaseModel):
    success: bool
    anomalies: list[AnomalyResult]
    total_transactions_analyzed: int
    anomaly_count: int
    model_version: str
    run_id: str
