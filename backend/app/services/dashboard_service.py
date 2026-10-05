from datetime import date
from sqlalchemy.orm import Session
from app.repositories.risk_repository import RiskRepository
from app.repositories.mitigation_plan_repository import MitigationPlanRepository
from app.schemas.dashboard_schema import DashboardSummary, ChartPoint, MatrixCell


class DashboardService:
    def __init__(self, db: Session):
        self.risk_repo = RiskRepository(db)
        self.plan_repo = MitigationPlanRepository(db)

    def get_summary(self) -> DashboardSummary:
        all_risks = self.risk_repo.list_all()
        all_plans = self.plan_repo.list_all()
        overdue_plans = self.plan_repo.list_overdue(date.today())

        return DashboardSummary(
            total_risks=len(all_risks),
            critical_risks=sum(1 for r in all_risks if r.risk_level == "CRITICAL"),
            high_risks=sum(1 for r in all_risks if r.risk_level == "HIGH"),
            medium_risks=sum(1 for r in all_risks if r.risk_level == "MEDIUM"),
            low_risks=sum(1 for r in all_risks if r.risk_level == "LOW"),
            open_risks=sum(1 for r in all_risks if r.status != "CLOSED"),
            closed_risks=sum(1 for r in all_risks if r.status == "CLOSED"),
            active_mitigation_plans=sum(1 for p in all_plans if p.status in ("PLANNED", "IN_PROGRESS")),
            overdue_mitigation_plans=len(overdue_plans),
        )

    def get_risks_by_level(self) -> list[ChartPoint]:
        all_risks = self.risk_repo.list_all()
        levels = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
        return [ChartPoint(label=level, value=sum(1 for r in all_risks if r.risk_level == level)) for level in levels]

    def get_risks_by_category(self) -> list[ChartPoint]:
        all_risks = self.risk_repo.list_all()
        counts: dict[str, int] = {}
        for r in all_risks:
            key = r.category.name if r.category else "Sin categoria"
            counts[key] = counts.get(key, 0) + 1
        return [ChartPoint(label=k, value=v) for k, v in counts.items()]

    def get_risks_by_status(self) -> list[ChartPoint]:
        all_risks = self.risk_repo.list_all()
        statuses = ["IDENTIFIED", "ASSESSED", "MITIGATION_IN_PROGRESS", "MONITORED", "CLOSED"]
        return [ChartPoint(label=s, value=sum(1 for r in all_risks if r.status == s)) for s in statuses]

    def get_risk_trend(self) -> list[ChartPoint]:
        all_risks = self.risk_repo.list_all()
        counts: dict[str, int] = {}
        for r in all_risks:
            key = r.created_at.strftime("%Y-%m")
            counts[key] = counts.get(key, 0) + 1
        return [ChartPoint(label=k, value=v) for k, v in sorted(counts.items())]

    def get_mitigations_by_status(self) -> list[ChartPoint]:
        all_plans = self.plan_repo.list_all()
        statuses = ["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "OVERDUE"]
        return [ChartPoint(label=s, value=sum(1 for p in all_plans if p.status == s)) for s in statuses]

    def get_risk_matrix(self) -> list[MatrixCell]:
        all_risks = self.risk_repo.list_all()
        cells: dict[tuple[int, int], list[int]] = {}
        for probability in range(1, 6):
            for impact in range(1, 6):
                cells[(probability, impact)] = []
        for r in all_risks:
            if r.probability and r.impact:
                cells.setdefault((r.probability, r.impact), []).append(r.id)
        return [
            MatrixCell(probability=p, impact=i, risk_ids=ids, count=len(ids))
            for (p, i), ids in cells.items()
        ]