from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[2]
ENV_FILE = BASE_DIR / ".env"


class Settings(BaseSettings):
    app_name: str = "smartinventory-ml"
    environment: str = "development"
    log_level: str = "INFO"
    database_url: str = (
        "postgresql+psycopg2://postgres:naishal%407@localhost:5432/smart_inventory"
    )
    mlflow_tracking_uri: str = "sqlite:///mlruns.db"
    mlflow_experiment_name: str = "smartinventory-ml"
    jwt_secret: str = "Ahueygiur127AHbcuyrlzmcorju13940dhzbhmrejhy324u1384fnrm"
    jwt_algorithm: str = "HS256"
    jwt_issuer: str | None = None
    jwt_audience: str | None = None
    jwt_leeway_seconds: int = 0
    jwt_validation_mode: str = "local"
    jwt_validation_url: str | None = None
    jwt_validation_timeout_seconds: int = 5

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
