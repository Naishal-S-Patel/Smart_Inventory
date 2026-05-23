from fastapi import FastAPI

from app.api.health import router as health_router
from app.core.config import settings
from app.core.logging import configure_logging
from app.core.mlflow import init_mlflow


configure_logging(settings.log_level)

app = FastAPI(title=settings.app_name)

app.include_router(health_router)


@app.on_event("startup")
def startup() -> None:
    init_mlflow()
