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

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
