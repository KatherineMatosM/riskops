from pydantic import BaseModel


class AnalyticsInsight(BaseModel):
    type: str
    title: str
    description: str
    related_ids: list[int] = []


class AnalyticsResponse(BaseModel):
    top_categories: list[dict]
    recurring_risks: list[dict]
    trending_risks: list[dict]
    overdue_mitigations: list[dict]
    recommendations: list[AnalyticsInsight]