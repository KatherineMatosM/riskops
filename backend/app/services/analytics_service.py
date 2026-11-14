from datetime import date
from sqlalchemy.orm import Session
from app.repositories.statistics_repository import RiskStatisticsRepository, MitigationStatisticsRepository
from app.schemas.analytics_schema import AnalyticsResponse, AnalyticsInsight


class AnalyticsService:
    def __init__(self, db: Session):
        self.risk_repo = RiskStatisticsRepository(db)
        self.plan_repo = MitigationStatisticsRepository(db)

    def build_analytics(self, reference_date: date | None = None) -> AnalyticsResponse:
        reference_date = reference_date or date.today()
        category_counts = self.risk_repo.counts_by_category()
        if not category_counts:
            return AnalyticsResponse(
                top_categories=[], recurring_risks=[], trending_risks=[],
                overdue_mitigations=[], recommendations=[],
            )

        top_categories = sorted(category_counts, key=lambda item: (-item["count"], item["category"]))
        recurring_risks = self.risk_repo.recurring_titles()
        monthly = self.risk_repo.counts_by_category_month()
        monthly_by_category: dict[str, list[dict]] = {}
        for item in monthly:
            monthly_by_category.setdefault(item["category"], []).append(item)
        trending_risks = []
        for category in sorted(monthly_by_category):
            observed = sorted(monthly_by_category[category], key=lambda item: item["month"])
            if len(observed) >= 2 and observed[-1]["count"] > observed[-2]["count"]:
                trending_risks.append({
                    "category": category,
                    "current_count": observed[-1]["count"],
                    "previous_count": observed[-2]["count"],
                })

        overdue_mitigations = self.plan_repo.overdue_projection(reference_date)

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
