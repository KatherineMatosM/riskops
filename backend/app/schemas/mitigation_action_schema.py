from datetime import datetime, date
from pydantic import BaseModel, ConfigDict, Field


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
    title: str = Field(min_length=3, max_length=200)
    description: str | None = None
    responsible_user_id: int
    due_date: date


class MitigationActionUpdateRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    responsible_user_id: int | None = None
    due_date: date | None = None
    status: str | None = None