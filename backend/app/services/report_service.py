from sqlalchemy.orm import Session
from app.repositories.risk_repository import RiskRepository
from app.repositories.mitigation_plan_repository import MitigationPlanRepository
from app.schemas.report_schema import ReportFilterParams
from app.schemas.risk_schema import RiskOut
from app.schemas.mitigation_plan_schema import MitigationPlanOut


class ReportService:
    def __init__(self, db: Session):
        self.risk_repo = RiskRepository(db)
        self.plan_repo = MitigationPlanRepository(db)

    def risks_report(self, filters: ReportFilterParams) -> list[RiskOut]:
        all_risks = self.risk_repo.list_all()
        results = []
        for r in all_risks:
            if filters.category_id and r.category_id != filters.category_id:
                continue
            if filters.risk_level and r.risk_level != filters.risk_level:
                continue
            if filters.status and r.status != filters.status:
                continue
            if filters.responsible_user_id and r.responsible_user_id != filters.responsible_user_id:
                continue
            if filters.start_date and r.created_at.date() < filters.start_date:
                continue
            if filters.end_date and r.created_at.date() > filters.end_date:
                continue
            results.append(RiskOut.model_validate(r))
        return results

    def mitigations_report(self) -> list[MitigationPlanOut]:
        return [MitigationPlanOut.model_validate(p) for p in self.plan_repo.list_all()]

    def critical_risks_report(self) -> list[RiskOut]:
        all_risks = self.risk_repo.list_all()
        return [RiskOut.model_validate(r) for r in all_risks if r.risk_level == "CRITICAL"]