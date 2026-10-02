from datetime import date
from pydantic import BaseModel


class ReportFilterParams(BaseModel):
    start_date: date | None = None
    end_date: date | None = None
    category_id: int | None = None
    risk_level: str | None = None
    status: str | None = None
    responsible_user_id: int | None = None