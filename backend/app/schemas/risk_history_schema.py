from datetime import datetime
from pydantic import BaseModel, ConfigDict


class RiskHistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    risk_id: int
    user_id: int
    action: str
    old_value: str | None = None
    new_value: str | None = None
    created_at: datetime