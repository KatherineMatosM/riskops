from datetime import date
import pandas as pd
from sqlalchemy.orm import Session
from app.repositories.risk_repository import RiskRepository
from app.repositories.mitigation_plan_repository import MitigationPlanRepository
from app.schemas.analytics_schema import AnalyticsResponse, AnalyticsInsight


class AnalyticsService:
    def __init__(self, db: Session):
        self.risk_repo = RiskRepository(db)
        self.plan_repo = MitigationPlanRepository(db)

    def build_analytics(self) -> AnalyticsResponse:
        risks = self.risk_repo.list_all()
        if not risks:
            return AnalyticsResponse(
                top_categories=[], recurring_risks=[], trending_risks=[],
                overdue_mitigations=[], recommendations=[],
            )

        risks_df = pd.DataFrame([
            {
                "id": r.id, "title": r.title,
                "category": r.category.name if r.category else "Sin categoria",
                "risk_level": r.risk_level, "created_at": r.created_at,
            }
            for r in risks
        ])

        top_categories = (
            risks_df.groupby("category").size().sort_values(ascending=False)
            .reset_index(name="count").to_dict(orient="records")
        )

        recurring = risks_df.groupby("title").size().reset_index(name="count")
        recurring_risks = recurring[recurring["count"] > 1].to_dict(orient="records")

        risks_df["month"] = risks_df["created_at"].dt.strftime("%Y-%m")
        monthly = risks_df.groupby(["category", "month"]).size().reset_index(name="count")
        trending_risks = []
        for category in monthly["category"].unique():
            cat_data = monthly[monthly["category"] == category].sort_values("month")
            if len(cat_data) >= 2 and cat_data["count"].iloc[-1] > cat_data["count"].iloc[-2]:
                trending_risks.append({
                    "category": category,
                    "current_count": int(cat_data["count"].iloc[-1]),
                    "previous_count": int(cat_data["count"].iloc[-2]),
                })

        overdue = self.plan_repo.list_overdue(date.today())
        overdue_mitigations = [
            {"id": p.id, "title": p.title, "due_date": str(p.due_date), "status": p.status}
            for p in overdue
        ]

        recommendations = []
        if top_categories:
            top = top_categories[0]
            recommendations.append(AnalyticsInsight(
                type="TOP_CATEGORY", title="Categoria con mas riesgos",
                description=f"La categoria '{top['category']}' concentra la mayor cantidad de riesgos registrados ({top['count']}).",
            ))
        if recurring_risks:
            recommendations.append(AnalyticsInsight(
                type="RECURRING_RISK", title="Riesgos recurrentes detectados",
                description=f"Se detectaron {len(recurring_risks)} titulos de riesgo que se repiten en el sistema.",
            ))
        if overdue_mitigations:
            recommendations.append(AnalyticsInsight(
                type="OVERDUE_MITIGATION", title="Planes de mitigacion atrasados",
                description=f"Existen {len(overdue_mitigations)} planes de mitigacion atrasados que requieren atencion inmediata.",
                related_ids=[m["id"] for m in overdue_mitigations],
            ))
        if trending_risks:
            recommendations.append(AnalyticsInsight(
                type="TRENDING_CATEGORY", title="Categorias con tendencia al alza",
                description=f"{len(trending_risks)} categorias muestran un aumento de riesgos respecto al mes anterior.",
            ))

        return AnalyticsResponse(
            top_categories=top_categories, recurring_risks=recurring_risks,
            trending_risks=trending_risks, overdue_mitigations=overdue_mitigations,
            recommendations=recommendations,
        )