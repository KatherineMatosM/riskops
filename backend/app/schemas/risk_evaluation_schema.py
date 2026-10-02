from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class RiskEvaluationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    risk_id: int
    probability: int
    impact: int
    risk_score: int
    risk_level: str
    evaluated_by: int
    observations: str | None = None
    evaluation_date: datetime


class RiskEvaluationCreateRequest(BaseModel):
    probability: int = Field(ge=1, le=5)
    impact: int = Field(ge=1, le=5)
    observations: str | None = None