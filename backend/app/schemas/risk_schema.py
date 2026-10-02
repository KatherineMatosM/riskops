from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


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
    title: str = Field(min_length=3, max_length=200)
    description: str | None = None
    category_id: int
    responsible_user_id: int | None = None
    probability: int | None = Field(default=None, ge=1, le=5)
    impact: int | None = Field(default=None, ge=1, le=5)


class RiskUpdateRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    category_id: int | None = None
    responsible_user_id: int | None = None
    status: str | None = None


class RiskFilterParams(BaseModel):
    category_id: int | None = None
    status: str | None = None
    risk_level: str | None = None
    responsible_user_id: int | None = None
    search: str | None = None
    page: int = 1
    page_size: int = 20
    sort_by: str = "created_at"
    sort_dir: str = "desc"