from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.api.analytics import router as analytics_router
from app.api.anomaly import router as anomaly_router
from app.api.health import router as health_router
from app.api.forecast import router as forecast_router
from app.api.predict import router as predict_router
from app.core.config import settings
from app.core.logging import configure_logging
from app.core.mlflow import init_mlflow
from app.middleware import RequestLoggingMiddleware
from app.schemas.common import ErrorDetail, ErrorResponse
from app.security import UnauthorizedException


configure_logging(settings.log_level)

app = FastAPI(title=settings.app_name)

app.add_middleware(RequestLoggingMiddleware)

app.include_router(health_router)
app.include_router(predict_router)
app.include_router(forecast_router)
app.include_router(analytics_router)
app.include_router(anomaly_router)


@app.exception_handler(UnauthorizedException)
async def unauthorized_exception_handler(
    request: Request, exc: UnauthorizedException
) -> JSONResponse:
    _ = request
    payload = ErrorResponse(
        success=False,
        error=ErrorDetail(code=exc.code, message=exc.message),
    )
    return JSONResponse(status_code=exc.status_code, content=payload.model_dump())


@app.on_event("startup")
async def startup() -> None:
    init_mlflow()
    from app.analytics.refresh import start_scheduler
    from app.db.session import engine

    start_scheduler(engine)
