from fastapi import APIRouter

from app.core.mlflow import is_mlflow_connected


router = APIRouter()


@router.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "mlflow": "connected" if is_mlflow_connected() else "unavailable",
    }
