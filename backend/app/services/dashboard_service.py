from datetime import date
from sqlalchemy.orm import Session
from app.repositories.statistics_repository import RiskStatisticsRepository, MitigationStatisticsRepository
from app.schemas.dashboard_schema import DashboardSummary, ChartPoint, MatrixCell


class DashboardService:
    def __init__(self, db: Session):
        self.risk_repo = RiskStatisticsRepository(db)
        self.plan_repo = MitigationStatisticsRepository(db)

    def get_summary(self, reference_date: date | None = None) -> DashboardSummary:
        reference_date = reference_date or date.today()
        return DashboardSummary(**self.risk_repo.summary_counts(), **self.plan_repo.summary_counts(reference_date))

    def get_risks_by_level(self) -> list[ChartPoint]:
        counts = self.risk_repo.counts_by_level()
        levels = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
        return [ChartPoint(label=level, value=counts.get(level, 0)) for level in levels]

    def get_risks_by_category(self) -> list[ChartPoint]:
        return [ChartPoint(label=item["category"], value=item["count"]) for item in self.risk_repo.counts_by_category()]

    def get_risks_by_status(self) -> list[ChartPoint]:
        counts = self.risk_repo.counts_by_status()
        statuses = ["IDENTIFIED", "ASSESSED", "MITIGATION_IN_PROGRESS", "MONITORED", "CLOSED"]
        return [ChartPoint(label=status, value=counts.get(status, 0)) for status in statuses]

    def get_risk_trend(self) -> list[ChartPoint]:
        return [ChartPoint(**item) for item in self.risk_repo.counts_by_month()]

    def get_mitigations_by_status(self, reference_date: date | None = None) -> list[ChartPoint]:
        reference_date = reference_date or date.today()
        counts = self.plan_repo.counts_by_effective_status(reference_date)
        statuses = ["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "OVERDUE"]
        return [ChartPoint(label=status, value=counts.get(status, 0)) for status in statuses]

    def get_risk_matrix(self) -> list[MatrixCell]:
        coordinates = self.risk_repo.matrix_coordinates()
        cells: dict[tuple[int, int], list[int]] = {}
        for probability in range(1, 6):
            for impact in range(1, 6):
                cells[(probability, impact)] = []
        for risk_id, probability, impact in coordinates:
            if probability and impact:
                cells.setdefault((probability, impact), []).append(risk_id)
        return [
            MatrixCell(probability=p, impact=i, risk_ids=ids, count=len(ids))
            for (p, i), ids in cells.items()
        ]
