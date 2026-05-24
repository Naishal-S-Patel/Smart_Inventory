from __future__ import annotations

from pydantic import BaseModel, Field


class DemandForecastData(BaseModel):
    forecast: list[dict[str, float | int | str]] = Field(default_factory=list)


class DemandForecastResponse(BaseModel):
    success: bool = Field(default=True, examples=[True])
    data: DemandForecastData
    message: str = Field(default="Prediction generated", examples=["Prediction generated"])
