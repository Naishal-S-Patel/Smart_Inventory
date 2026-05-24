from __future__ import annotations

from pydantic import BaseModel, Field


class ErrorDetail(BaseModel):
    code: str = Field(..., examples=["UNAUTHORIZED"])
    message: str = Field(..., examples=["Invalid or expired token"])


class ErrorResponse(BaseModel):
    success: bool = Field(default=False, examples=[False])
    error: ErrorDetail
