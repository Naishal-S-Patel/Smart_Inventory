from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.api.debug import router as debug_router
from app.api.health import router as health_router
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
app.include_router(debug_router)


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
def startup() -> None:
    init_mlflow()
