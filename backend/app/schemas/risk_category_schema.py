from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class RiskCategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime


class RiskCategoryCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    description: str | None = None


class RiskCategoryUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    status: str | None = None