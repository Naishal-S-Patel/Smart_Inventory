from fastapi import APIRouter

from app.core.mlflow import is_mlflow_connected
from app.schemas.health import HealthResponse


router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["health"])
async def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        mlflow="connected" if is_mlflow_connected() else "unavailable",
    )
