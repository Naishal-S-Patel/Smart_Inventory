from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class DebugTokenResponse(BaseModel):
    success: bool = Field(default=True, examples=[True])
    claims: dict[str, Any]
    message: str = Field(default="Token decoded", examples=["Token decoded"])
