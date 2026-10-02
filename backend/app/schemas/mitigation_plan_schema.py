from datetime import datetime, date
from pydantic import BaseModel, ConfigDict, Field, model_validator


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
    title: str = Field(min_length=3, max_length=200)
    description: str | None = None
    responsible_user_id: int
    start_date: date
    due_date: date

    @model_validator(mode="after")
    def validate_dates(self):
        if self.due_date < self.start_date:
            raise ValueError("due_date debe ser mayor o igual a start_date")
        return self


class MitigationPlanUpdateRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    responsible_user_id: int | None = None
    start_date: date | None = None
    due_date: date | None = None
    status: str | None = None
    progress: int | None = Field(default=None, ge=0, le=100)