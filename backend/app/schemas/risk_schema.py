from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, field_validator
from pydantic_core import PydanticCustomError


class RiskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: str | None = None
    category_id: int
    responsible_user_id: int | None = None
    created_by: int
    status: str
    probability: int | None = None
    impact: int | None = None
    risk_score: int | None = None
    risk_level: str | None = None
    created_at: datetime
    updated_at: datetime


class RiskCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str = Field(min_length=3, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    category_id: int
    responsible_user_id: int | None = None
    probability: int | None = Field(default=None, ge=1, le=5)
    impact: int | None = Field(default=None, ge=1, le=5)


class RiskUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    category_id: int | None = None
    responsible_user_id: int | None = None
    status: str | None = None
    # Null axes mean no assessment change; they do not erase an existing evaluation.
    probability: int | None = Field(default=None, ge=1, le=5)
    impact: int | None = Field(default=None, ge=1, le=5)

    @field_validator("title", "category_id", "status", mode="before")
    @classmethod
    def reject_explicit_null(cls, value):
        if value is None:
            raise PydanticCustomError("null_not_allowed", "Este campo no admite valores nulos.")
        return value


class RiskFilterParams(BaseModel):
    category_id: int | None = None
    status: str | None = None
    risk_level: str | None = None
    responsible_user_id: int | None = None
    search: str | None = None
    probability: int | None = Field(default=None, ge=1, le=5)
    impact: int | None = Field(default=None, ge=1, le=5)
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    sort_by: Literal[
        "id", "title", "description", "category_id", "responsible_user_id", "created_by",
        "status", "probability", "impact", "risk_score", "risk_level", "created_at", "updated_at",
    ] = "created_at"
    sort_dir: Literal["asc", "desc"] = "desc"
