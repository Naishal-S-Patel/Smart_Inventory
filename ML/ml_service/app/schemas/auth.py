from __future__ import annotations

from pydantic import BaseModel, Field


class AuthenticatedUser(BaseModel):
    user_id: str = Field(..., description="User identifier")
    email: str = Field(..., description="User email address")
    roles: list[str] = Field(default_factory=list, description="User roles")
