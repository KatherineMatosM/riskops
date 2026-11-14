from datetime import datetime, date
from pydantic import BaseModel, ConfigDict, Field, ValidationInfo, field_validator
from pydantic_core import PydanticCustomError


class MitigationPlanOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    risk_id: int
    title: str
    description: str | None = None
    responsible_user_id: int
    start_date: date
    due_date: date
    status: str
    progress: int
    created_at: datetime
    updated_at: datetime


class MitigationPlanCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str = Field(min_length=3, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    responsible_user_id: int
    start_date: date
    due_date: date

    @field_validator("due_date")
    @classmethod
    def validate_dates(cls, value: date, info: ValidationInfo) -> date:
        start_date = info.data.get("start_date")
        if start_date is not None and value < start_date:
            raise PydanticCustomError("date_order", "La fecha límite debe ser igual o posterior a la fecha de inicio.")
        return value


class MitigationPlanUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    responsible_user_id: int | None = None
    start_date: date | None = None
    due_date: date | None = None
    status: str | None = None
    progress: int | None = Field(default=None, ge=0, le=100)

    @field_validator("title", "responsible_user_id", "start_date", "due_date", "status", "progress", mode="before")
    @classmethod
    def reject_explicit_null(cls, value):
        if value is None:
            raise PydanticCustomError("null_not_allowed", "Este campo no admite valores nulos.")
        return value
