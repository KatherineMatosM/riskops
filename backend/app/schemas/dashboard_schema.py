from pydantic import BaseModel


class DashboardSummary(BaseModel):
    total_risks: int
    critical_risks: int
    high_risks: int
    medium_risks: int
    low_risks: int
    open_risks: int
    closed_risks: int
    active_mitigation_plans: int
    overdue_mitigation_plans: int


class ChartPoint(BaseModel):
    label: str
    value: int


class MatrixCell(BaseModel):
    probability: int
    impact: int
    risk_ids: list[int]
    count: int