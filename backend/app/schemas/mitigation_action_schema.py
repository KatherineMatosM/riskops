from datetime import datetime, date
from pydantic import BaseModel, ConfigDict, Field, field_validator
from pydantic_core import PydanticCustomError


class MitigationActionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    mitigation_plan_id: int
    title: str
    description: str | None = None
    responsible_user_id: int
    due_date: date
    status: str
    completed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class MitigationActionCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str = Field(min_length=3, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    responsible_user_id: int
    due_date: date


class MitigationActionUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    responsible_user_id: int | None = None
    due_date: date | None = None
    status: str | None = None

    @field_validator("title", "responsible_user_id", "due_date", "status", mode="before")
    @classmethod
    def reject_explicit_null(cls, value):
        if value is None:
            raise PydanticCustomError("null_not_allowed", "Este campo no admite valores nulos.")
        return value
