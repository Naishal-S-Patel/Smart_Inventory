from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "smartinventory-ml"
    environment: str = "development"
    log_level: str = "INFO"
    database_url: str = (
        "postgresql+psycopg2://postgres:postgres@localhost:5432/smartinventory"
    )
    mlflow_tracking_uri: str = "sqlite:///mlruns.db"
    mlflow_experiment_name: str = "smartinventory-ml"
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_issuer: str | None = None
    jwt_audience: str | None = None
    jwt_leeway_seconds: int = 0
    jwt_validation_mode: str = "local"
    jwt_validation_url: str | None = None
    jwt_validation_timeout_seconds: int = 5

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
